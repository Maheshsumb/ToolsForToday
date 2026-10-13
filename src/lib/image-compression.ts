export const MAX_IMAGE_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export const DEFAULT_IMAGE_QUALITY = 80;
export const MIN_IMAGE_QUALITY = 10;
export const MAX_IMAGE_QUALITY = 100;

export type ImageFormat = "jpeg" | "png" | "webp";

export interface ImageHeader {
  format: ImageFormat;
  width: number;
  height: number;
  animated: boolean;
}

export type ImageInputErrorCode =
  | "empty"
  | "too-large"
  | "unsupported-type"
  | "format-mismatch"
  | "corrupt"
  | "animated"
  | "too-many-pixels"
  | "quality-range"
  | "decode-unavailable"
  | "decode-failed"
  | "encode-unavailable"
  | "encode-failed"
  | "unsupported-output";

export class ImageProcessingError extends Error {
  readonly code: ImageInputErrorCode;

  constructor(code: ImageInputErrorCode, message: string) {
    super(message);
    this.name = "ImageProcessingError";
    this.code = code;
  }
}

const extensionFormat: Record<string, ImageFormat> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
};

const expectedMime: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const formatLabel: Record<ImageFormat, string> = {
  jpeg: "JPEG",
  png: "PNG",
  webp: "WebP",
};

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, false);
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, true);
}

function matchesAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  return [...text].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

function assertDimensions(format: ImageFormat, width: number, height: number, animated = false): ImageHeader {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new ImageProcessingError("corrupt", "The file does not contain valid image dimensions.");
  }
  return { format, width, height, animated };
}

function parsePngHeader(bytes: Uint8Array): ImageHeader {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || !signature.every((byte, index) => bytes[index] === byte)) {
    throw new ImageProcessingError("corrupt", "This PNG file is incomplete or damaged.");
  }

  let width = 0;
  let height = 0;
  let animated = false;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const chunkLength = readUint32BE(bytes, offset);
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > bytes.length) throw new ImageProcessingError("corrupt", "This PNG file is incomplete or damaged.");
    if (matchesAscii(bytes, offset + 4, "IHDR")) {
      if (chunkLength !== 13) throw new ImageProcessingError("corrupt", "This PNG file has an invalid image header.");
      width = readUint32BE(bytes, offset + 8);
      height = readUint32BE(bytes, offset + 12);
    }
    if (matchesAscii(bytes, offset + 4, "acTL")) animated = true;
    if (matchesAscii(bytes, offset + 4, "IEND")) break;
    offset = chunkEnd;
  }
  if (!width || !height) throw new ImageProcessingError("corrupt", "This PNG file does not contain a readable image header.");
  return assertDimensions("png", width, height, animated);
}

const jpegFrameMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function parseJpegHeader(bytes: Uint8Array): ImageHeader {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new ImageProcessingError("corrupt", "This JPEG file is incomplete or damaged.");
  }

  let offset = 2;
  while (offset < bytes.length) {
    while (bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;

    const segmentLength = readUint16BE(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new ImageProcessingError("corrupt", "This JPEG file has an invalid image header.");
    }
    if (jpegFrameMarkers.has(marker)) {
      if (segmentLength < 7) throw new ImageProcessingError("corrupt", "This JPEG file has an invalid frame header.");
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      return assertDimensions("jpeg", width, height);
    }
    offset += segmentLength;
  }
  throw new ImageProcessingError("corrupt", "This JPEG file does not contain a readable frame header.");
}

function parseWebpHeader(bytes: Uint8Array): ImageHeader {
  if (bytes.length < 20 || !matchesAscii(bytes, 0, "RIFF") || !matchesAscii(bytes, 8, "WEBP")) {
    throw new ImageProcessingError("corrupt", "This WebP file is incomplete or damaged.");
  }

  let offset = 12;
  let animated = false;
  while (offset + 8 <= bytes.length) {
    const chunkType = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const chunkSize = readUint32LE(bytes, offset + 4);
    const dataOffset = offset + 8;
    const chunkEnd = dataOffset + chunkSize + (chunkSize % 2);
    if (chunkEnd > bytes.length) throw new ImageProcessingError("corrupt", "This WebP file is incomplete or damaged.");
    if (chunkType === "ANIM" || chunkType === "ANMF") animated = true;

    if (chunkType === "VP8X") {
      if (chunkSize < 10) throw new ImageProcessingError("corrupt", "This WebP file has an invalid image header.");
      animated ||= (bytes[dataOffset] & 0x02) !== 0;
      const width = 1 + bytes[dataOffset + 4] + (bytes[dataOffset + 5] << 8) + (bytes[dataOffset + 6] << 16);
      const height = 1 + bytes[dataOffset + 7] + (bytes[dataOffset + 8] << 8) + (bytes[dataOffset + 9] << 16);
      return assertDimensions("webp", width, height, animated);
    }
    if (chunkType === "VP8 ") {
      if (chunkSize < 10 || bytes[dataOffset + 3] !== 0x9d || bytes[dataOffset + 4] !== 0x01 || bytes[dataOffset + 5] !== 0x2a) {
        throw new ImageProcessingError("corrupt", "This WebP file has an invalid lossy frame header.");
      }
      const width = readUint16LE(bytes, dataOffset + 6) & 0x3fff;
      const height = readUint16LE(bytes, dataOffset + 8) & 0x3fff;
      return assertDimensions("webp", width, height, animated);
    }
    if (chunkType === "VP8L") {
      if (chunkSize < 5 || bytes[dataOffset] !== 0x2f) throw new ImageProcessingError("corrupt", "This WebP file has an invalid lossless frame header.");
      const width = 1 + ((bytes[dataOffset + 2] & 0x3f) << 8) + bytes[dataOffset + 1];
      const height = 1 + ((bytes[dataOffset + 4] & 0x0f) << 10) + (bytes[dataOffset + 3] << 2) + ((bytes[dataOffset + 2] & 0xc0) >> 6);
      return assertDimensions("webp", width, height, animated);
    }
    offset = chunkEnd;
  }
  throw new ImageProcessingError("corrupt", "This WebP file does not contain a readable image frame.");
}

export function parseImageHeader(bytes: Uint8Array): ImageHeader {
  if (bytes.length >= 8 && bytes[0] === 137 && matchesAscii(bytes, 1, "PNG\r\n\u001a\n")) return parsePngHeader(bytes);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return parseJpegHeader(bytes);
  if (bytes.length >= 12 && matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WEBP")) return parseWebpHeader(bytes);
  throw new ImageProcessingError("unsupported-type", "Choose a JPEG, PNG, or WebP image.");
}

export function parseImageFileHeader(file: Pick<File, "name" | "type">, bytes: Uint8Array): ImageHeader {
  try {
    return parseImageHeader(bytes);
  } catch (error) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const declaredType = file.type.toLowerCase();
    const supportedDeclaration = extension in extensionFormat
      || Object.values(expectedMime).includes(declaredType);
    if (error instanceof ImageProcessingError && error.code === "unsupported-type" && supportedDeclaration) {
      throw new ImageProcessingError("corrupt", "This file has a supported image name but its contents are not a readable JPEG, PNG, or WebP image.");
    }
    throw error;
  }
}

export function validateImageFileMetadata(
  file: Pick<File, "name" | "size" | "type">,
  header: ImageHeader,
  maxFileSizeBytes = MAX_IMAGE_FILE_SIZE_BYTES,
  maxPixels = MAX_IMAGE_PIXELS,
): ImageHeader {
  if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
  if (file.size > maxFileSizeBytes) throw new ImageProcessingError("too-large", `Choose an image no larger than ${formatImageFileSize(maxFileSizeBytes)}.`);

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const namedFormat = extensionFormat[extension];
  if (!namedFormat) throw new ImageProcessingError("unsupported-type", "Choose a .jpg, .jpeg, .png, or .webp image.");
  if (namedFormat !== header.format) throw new ImageProcessingError("format-mismatch", "The file extension does not match the image data. Choose a correctly named image file.");

  const declaredType = file.type.toLowerCase();
  if (declaredType && declaredType !== "application/octet-stream" && declaredType !== expectedMime[header.format]) {
    throw new ImageProcessingError("format-mismatch", "The browser-reported file type does not match the image data.");
  }
  if (header.animated) throw new ImageProcessingError("animated", "Animated images are not supported. Choose a non-animated JPEG, PNG, or WebP image.");
  if (header.width * header.height > maxPixels) {
    throw new ImageProcessingError("too-many-pixels", `This image exceeds the ${maxPixels.toLocaleString()}-pixel limit. Choose a smaller image.`);
  }
  return header;
}

export function getImageFormatLabel(format: ImageFormat): string {
  return formatLabel[format];
}

export function getImageMimeType(format: ImageFormat): string {
  return expectedMime[format];
}

export function isImageQualityValid(quality: number): boolean {
  return Number.isFinite(quality) && quality >= MIN_IMAGE_QUALITY && quality <= MAX_IMAGE_QUALITY;
}

export interface CompressionMetrics {
  differenceBytes: number;
  percentage: number;
  outcome: "reduced" | "same" | "larger";
}

export function getCompressionMetrics(originalBytes: number, outputBytes: number): CompressionMetrics {
  if (!Number.isFinite(originalBytes) || !Number.isFinite(outputBytes) || originalBytes <= 0 || outputBytes < 0) {
    return { differenceBytes: 0, percentage: 0, outcome: "same" };
  }
  const differenceBytes = originalBytes - outputBytes;
  return {
    differenceBytes,
    percentage: Math.round((Math.abs(differenceBytes) / originalBytes) * 1000) / 10,
    outcome: differenceBytes > 0 ? "reduced" : differenceBytes < 0 ? "larger" : "same",
  };
}

export function formatImageFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Size unavailable";
  const kilobytes = bytes / 1024;
  if (kilobytes >= 1024) return `${(kilobytes / 1024).toFixed(2)} MB`;
  return `${kilobytes.toFixed(2)} KB`;
}

export function getCompressedFilename(filename: string, format: ImageFormat): string {
  const leaf = filename.split(/[\\/]/).pop() ?? "image";
  const stem = leaf.replace(/\.[^.]*$/, "").normalize("NFKC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80) || "image";
  return `${stem}-compressed.${format === "jpeg" ? "jpg" : format}`;
}

export function qualityToCanvasValue(quality: number): number {
  if (!isImageQualityValid(quality)) throw new ImageProcessingError("quality-range", "Choose a quality between 10% and 100%.");
  return quality / 100;
}

export interface CompressedImage {
  blob: Blob;
  format: ImageFormat;
  width: number;
  height: number;
}

function decodeWithImageElement(file: File): Promise<{ width: number; height: number; draw: (context: CanvasRenderingContext2D) => void }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      if (!width || !height) reject(new ImageProcessingError("decode-failed", "The browser could not read this image."));
      else resolve({ width, height, draw: (context) => context.drawImage(image, 0, 0, width, height) });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageProcessingError("decode-failed", "The image is corrupt or cannot be read by this browser."));
    };
    image.src = objectUrl;
  });
}

export async function compressImageFile(file: File, quality: number): Promise<CompressedImage> {
  if (!isImageQualityValid(quality)) throw new ImageProcessingError("quality-range", "Choose a quality between 10% and 100%.");
  if (typeof document === "undefined") throw new ImageProcessingError("encode-unavailable", "Image compression is available in a browser.");
  if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) throw new ImageProcessingError("too-large", `Choose an image no larger than ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)}.`);

  let header: ImageHeader;
  try {
    header = validateImageFileMetadata(file, parseImageFileHeader(file, new Uint8Array(await file.arrayBuffer())));
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("corrupt", "The image header could not be read.");
  }

  let width: number;
  let height: number;
  let draw: (context: CanvasRenderingContext2D) => void;
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser.");
    }
    width = bitmap.width;
    height = bitmap.height;
    if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
      bitmap.close();
      throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
    }
    draw = (context) => context.drawImage(bitmap, 0, 0, width, height);
    let canvas: HTMLCanvasElement;
    try {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: header.format !== "jpeg" });
      if (!context) throw new ImageProcessingError("encode-unavailable", "This browser could not create an image canvas.");
      draw(context);
    } finally {
      bitmap.close();
    }
    return encodeCanvas(canvas, header.format, quality, width, height);
  }

  if (typeof Image === "undefined") throw new ImageProcessingError("decode-unavailable", "This browser cannot decode images for compression.");
  let decoded: Awaited<ReturnType<typeof decodeWithImageElement>>;
  try {
    decoded = await decodeWithImageElement(file);
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser.");
  }
  width = decoded.width;
  height = decoded.height;
  if (width * height > MAX_IMAGE_PIXELS) throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: header.format !== "jpeg" });
  if (!context) throw new ImageProcessingError("encode-unavailable", "This browser could not create an image canvas.");
  decoded.draw(context);
  return encodeCanvas(canvas, header.format, quality, width, height);
}

function encodeCanvas(canvas: HTMLCanvasElement, format: ImageFormat, quality: number, width: number, height: number): Promise<CompressedImage> {
  const mimeType = expectedMime[format];
  const encodingQuality = format === "png" ? undefined : qualityToCanvasValue(quality);
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        canvas.width = 0;
        canvas.height = 0;
        if (!blob) {
          reject(new ImageProcessingError("encode-failed", "The browser could not encode this image. Try another file or browser."));
          return;
        }
        if (blob.type !== mimeType) {
          reject(new ImageProcessingError("unsupported-output", `This browser cannot export ${formatLabel[format]} images in this format.`));
          return;
        }
        resolve({ blob, format, width, height });
      }, mimeType, encodingQuality);
    } catch {
      canvas.width = 0;
      canvas.height = 0;
      reject(new ImageProcessingError("encode-failed", "The browser could not encode this image."));
    }
  });
}

export function getImageErrorMessage(error: unknown): string {
  if (error instanceof ImageProcessingError) return error.message;
  if (error instanceof DOMException && error.name === "SecurityError") return "The browser blocked access to this image. Choose a local image file.";
  return "Image processing failed. Try a different image or browser.";
}
