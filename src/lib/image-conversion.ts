import {
  DEFAULT_IMAGE_QUALITY,
  ImageProcessingError,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  formatImageFileSize,
  getImageFormatLabel,
  getImageMimeType,
  isImageQualityValid,
  parseImageFileHeader,
  validateImageFileMetadata,
  type ImageFormat,
} from "./image-compression.ts";
import { validateProcessingMemory } from "./image-resizing.ts";

export const DEFAULT_CONVERSION_BACKGROUND = "#FFFFFF";
export const IMAGE_CONVERSION_QUALITY = DEFAULT_IMAGE_QUALITY;
export const SUPPORTED_IMAGE_FORMATS: readonly ImageFormat[] = ["jpeg", "png", "webp"];

export interface ConvertedImage {
  blob: Blob;
  format: ImageFormat;
  width: number;
  height: number;
}

export type ConversionSizeOutcome = "smaller" | "larger" | "equal";

export function supportsConversionQuality(format: ImageFormat): boolean {
  return format !== "png";
}

export function getConversionSizeOutcome(inputBytes: number, outputBytes: number): ConversionSizeOutcome {
  if (outputBytes < inputBytes) return "smaller";
  if (outputBytes > inputBytes) return "larger";
  return "equal";
}

export function getConvertedFilename(filename: string, format: ImageFormat): string {
  const leaf = filename.split(/[\\/]/).pop() ?? "image";
  const stem = leaf.replace(/\.[^.]*$/, "").normalize("NFKC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80) || "image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${stem}-converted.${extension}`;
}

function hasEncodedSignature(bytes: Uint8Array, format: ImageFormat): boolean {
  if (format === "jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (format === "png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

interface DecodedImage {
  width: number;
  height: number;
  draw(context: CanvasRenderingContext2D): void;
  release(): void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser.");
    }
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (context) => context.drawImage(bitmap, 0, 0),
      release: () => bitmap.close(),
    };
  }

  if (typeof Image === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new ImageProcessingError("decode-unavailable", "This browser cannot decode images for conversion.");
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser."));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new ImageProcessingError("decode-failed", "The browser could not read this image.");
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context) => context.drawImage(image, 0, 0),
      release: () => { image.src = ""; URL.revokeObjectURL(url); },
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function encodeCanvas(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  const qualityValue = format === "png" ? undefined : quality / 100;
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob || blob.size === 0) {
          reject(new ImageProcessingError("encode-failed", "The browser could not encode this image. Try another file or browser."));
          return;
        }
        if (blob.type !== getImageMimeType(format)) {
          reject(new ImageProcessingError("unsupported-output", `This browser cannot export ${getImageFormatLabel(format)} images in this format.`));
          return;
        }
        resolve(blob);
      }, getImageMimeType(format), qualityValue);
    } catch {
      reject(new ImageProcessingError("encode-failed", "The browser could not encode this image."));
    }
  });
}

export async function convertImageFile(
  file: File,
  outputFormat: ImageFormat,
  quality = IMAGE_CONVERSION_QUALITY,
  background = DEFAULT_CONVERSION_BACKGROUND,
): Promise<ConvertedImage> {
  if (!SUPPORTED_IMAGE_FORMATS.includes(outputFormat)) {
    throw new ImageProcessingError("unsupported-output", "Choose JPG, PNG, or WebP as the output format.");
  }
  if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new ImageProcessingError("too-large", `Choose an image no larger than ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)}.`);
  }
  if (outputFormat !== "png" && !isImageQualityValid(quality)) {
    throw new ImageProcessingError("quality-range", "Choose a quality between 10% and 100%.");
  }
  if (outputFormat === "jpeg" && !/^#[\da-f]{6}$/i.test(background)) {
    throw new ImageProcessingError("encode-failed", "Choose a valid six-digit background color for JPG output.");
  }
  if (typeof document === "undefined") {
    throw new ImageProcessingError("encode-unavailable", "Image conversion is available in a browser.");
  }

  let header;
  try {
    header = validateImageFileMetadata(file, parseImageFileHeader(file, new Uint8Array(await file.arrayBuffer())));
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("corrupt", "The image header could not be read.");
  }
  if (header.format === outputFormat) {
    throw new ImageProcessingError("unsupported-output", "Choose a different output format. Same-format re-encoding is not offered.");
  }

  const source = await decodeImage(file);
  let canvas: HTMLCanvasElement | null = null;
  try {
    const { width, height } = source;
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
      throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
    }
    try {
      validateProcessingMemory(width, height, width, height);
    } catch {
      throw new ImageProcessingError("too-many-pixels", "This image would require too much browser memory to convert safely. Choose a smaller image.");
    }

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: outputFormat !== "jpeg" });
    if (!context) throw new ImageProcessingError("encode-unavailable", "This browser could not create an image canvas.");
    if (outputFormat === "jpeg") {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }
    source.draw(context);
    const blob = await encodeCanvas(canvas, outputFormat, quality);
    const signature = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    if (!hasEncodedSignature(signature, outputFormat)) {
      throw new ImageProcessingError("unsupported-output", `The browser did not produce a valid ${getImageFormatLabel(outputFormat)} file.`);
    }
    return { blob, format: outputFormat, width, height };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("encode-failed", "The image could not be converted. Try a smaller image or another browser.");
  } finally {
    source.release();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
