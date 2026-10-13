import { PDFDocument } from "@cantoo/pdf-lib";
import { parseImageFileHeader, validateImageFileMetadata, type ImageFormat } from "./image-compression.ts";

export const MAX_IMAGES_TO_PDF_COUNT = 20;
export const MAX_IMAGES_TO_PDF_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGES_TO_PDF_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGES_TO_PDF_PIXELS = 25_000_000;
export const MAX_IMAGES_TO_PDF_TOTAL_PIXELS = 40_000_000;
export const MAX_IMAGES_TO_PDF_OUTPUT_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGES_TO_PDF_PAGE_POINTS = 14_400;
export const IMAGES_TO_PDF_FILENAME = "toolsfortoday-images.pdf";
export const AUTO_PAGE_POINTS_PER_PIXEL = 72 / 96;

export function readJpegExifOrientation(bytes: Uint8Array): number | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) return null;
    const dataStart = offset + 4;
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 0xe1 && segmentLength >= 14
      && bytes[dataStart] === 0x45 && bytes[dataStart + 1] === 0x78 && bytes[dataStart + 2] === 0x69
      && bytes[dataStart + 3] === 0x66 && bytes[dataStart + 4] === 0 && bytes[dataStart + 5] === 0) {
      const tiff = dataStart + 6;
      const littleEndian = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
      const bigEndian = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
      if (!littleEndian && !bigEndian) return null;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const read16 = (position: number) => view.getUint16(position, littleEndian);
      const read32 = (position: number) => view.getUint32(position, littleEndian);
      const tiffEnd = tiff + segmentLength - 8;
      if (tiff + 8 > tiffEnd) return null;
      if (read16(tiff + 2) !== 42) return null;
      const ifd = tiff + read32(tiff + 4);
      if (ifd + 2 > tiffEnd) return null;
      const count = read16(ifd);
      for (let index = 0; index < count; index += 1) {
        const entry = ifd + 2 + index * 12;
        if (entry + 12 > tiffEnd) return null;
        if (read16(entry) === 0x0112 && read16(entry + 2) === 3 && read32(entry + 4) >= 1) {
          const orientation = read16(entry + 8);
          return orientation >= 1 && orientation <= 8 ? orientation : null;
        }
      }
      return null;
    }
    offset += 2 + segmentLength;
  }
  return null;
}

export type ImagesPdfPageSize = "a4" | "letter" | "auto";
export type ImagesPdfOrientation = "auto" | "portrait" | "landscape";
export type ImagesPdfMargin = "none" | "small" | "medium";

export interface ImagesPdfSettings {
  pageSize: ImagesPdfPageSize;
  orientation: ImagesPdfOrientation;
  margin: ImagesPdfMargin;
}

export interface ImagesPdfInput {
  name: string;
  format: ImageFormat;
  width: number;
  height: number;
  bytes: Uint8Array;
}

export interface ImagePageSize {
  width: number;
  height: number;
}

export interface ImagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface ImagesPdfArtifact {
  blob: Blob;
  filename: string;
  imageCount: number;
  pageCount: number;
  sizeBytes: number;
  pageSizes: ImagePageSize[];
  placements: ImagePlacement[];
}

export const IMAGE_MARGIN_POINTS: Record<ImagesPdfMargin, number> = {
  none: 0,
  small: 18,
  medium: 36,
};

const PAPER_SIZES: Record<Exclude<ImagesPdfPageSize, "auto">, ImagePageSize> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export function assertImagesToPdfBatch(files: readonly Pick<File, "size">[]): void {
  if (files.length === 0) throw new Error("Choose at least one JPG, PNG, or WebP image.");
  if (files.length > MAX_IMAGES_TO_PDF_COUNT) throw new Error(`Choose no more than ${MAX_IMAGES_TO_PDF_COUNT} images.`);
  let total = 0;
  for (const file of files) {
    if (file.size <= 0) throw new Error("The selected image file is empty.");
    if (file.size > MAX_IMAGES_TO_PDF_FILE_BYTES) throw new Error("Each image must be no larger than 25 MB.");
    total += file.size;
  }
  if (total > MAX_IMAGES_TO_PDF_TOTAL_BYTES) throw new Error("The selected images exceed the 100 MB combined input limit.");
}

export function assertImagesToPdfPixels(pixelCounts: readonly number[]): void {
  if (pixelCounts.some((pixels) => !Number.isSafeInteger(pixels) || pixels < 1 || pixels > MAX_IMAGES_TO_PDF_PIXELS)) {
    throw new Error("Each decoded image must be no larger than 25 megapixels.");
  }
  if (pixelCounts.reduce((sum, pixels) => sum + pixels, 0) > MAX_IMAGES_TO_PDF_TOTAL_PIXELS) {
    throw new Error("The selected images exceed the 40-megapixel combined processing limit. Remove some images or choose smaller files.");
  }
}

export function inspectImagesToPdfBytes(
  file: Pick<File, "name" | "type" | "size">,
  bytes: Uint8Array,
) {
  if (file.size === 0 || bytes.byteLength === 0) throw new Error(`${file.name || "This image"} is empty.`);
  if (file.size > MAX_IMAGES_TO_PDF_FILE_BYTES || bytes.byteLength > MAX_IMAGES_TO_PDF_FILE_BYTES) {
    throw new Error(`${file.name || "This image"} is larger than the 25 MB per-image limit.`);
  }
  const header = validateImageFileMetadata(file, parseImageFileHeader(file, bytes));
  if (header.width * header.height > MAX_IMAGES_TO_PDF_PIXELS) {
    throw new Error(`${file.name || "This image"} exceeds the 25-megapixel decoded image limit.`);
  }
  return header;
}

function marginValue(margin: ImagesPdfMargin): number {
  return IMAGE_MARGIN_POINTS[margin];
}

function orientationFor(width: number, height: number, orientation: ImagesPdfOrientation): "portrait" | "landscape" {
  if (orientation === "auto") return width > height ? "landscape" : "portrait";
  return orientation;
}

function capPageSize(size: ImagePageSize): ImagePageSize {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
    throw new Error("The selected page settings do not produce valid PDF dimensions.");
  }
  const scale = Math.min(1, MAX_IMAGES_TO_PDF_PAGE_POINTS / size.width, MAX_IMAGES_TO_PDF_PAGE_POINTS / size.height);
  return { width: size.width * scale, height: size.height * scale };
}

export function getImagesPdfPageSize(
  imageWidth: number,
  imageHeight: number,
  pageSize: ImagesPdfPageSize,
  orientation: ImagesPdfOrientation,
): ImagePageSize {
  if (![imageWidth, imageHeight].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Image dimensions must be positive numbers.");
  }
  const layout = orientationFor(imageWidth, imageHeight, orientation);
  if (pageSize === "auto") {
    let width = imageWidth * AUTO_PAGE_POINTS_PER_PIXEL;
    let height = imageHeight * AUTO_PAGE_POINTS_PER_PIXEL;
    if (layout === "landscape" && width < height) [width, height] = [height, width];
    if (layout === "portrait" && width > height) [width, height] = [height, width];
    return capPageSize({ width, height });
  }
  const paper = PAPER_SIZES[pageSize];
  return layout === "landscape"
    ? { width: Math.max(paper.width, paper.height), height: Math.min(paper.width, paper.height) }
    : { width: Math.min(paper.width, paper.height), height: Math.max(paper.width, paper.height) };
}

export function calculateImagePlacement(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: ImagesPdfMargin,
): ImagePlacement {
  const inset = marginValue(margin);
  const availableWidth = pageWidth - inset * 2;
  const availableHeight = pageHeight - inset * 2;
  if (![imageWidth, imageHeight, pageWidth, pageHeight, availableWidth, availableHeight].every(Number.isFinite)
    || imageWidth <= 0 || imageHeight <= 0 || availableWidth <= 0 || availableHeight <= 0) {
    throw new Error("The image cannot fit inside the selected page and margins.");
  }
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height, scale };
}

export async function createImagesPdf(
  images: readonly ImagesPdfInput[],
  settings: ImagesPdfSettings,
  signal?: AbortSignal,
): Promise<ImagesPdfArtifact> {
  if (images.length === 0) throw new Error("Choose at least one supported image before converting.");
  if (images.length > MAX_IMAGES_TO_PDF_COUNT) throw new Error(`A PDF can contain no more than ${MAX_IMAGES_TO_PDF_COUNT} images.`);
  assertImagesToPdfPixels(images.map((image) => image.width * image.height));
  const doc = await PDFDocument.create();
  const pageSizes: ImagePageSize[] = [];
  const placements: ImagePlacement[] = [];

  for (const image of images) {
    if (signal?.aborted) throw new DOMException("PDF generation was cancelled.", "AbortError");
    const pageSize = getImagesPdfPageSize(image.width, image.height, settings.pageSize, settings.orientation);
    const placement = calculateImagePlacement(image.width, image.height, pageSize.width, pageSize.height, settings.margin);
    let embedded;
    try {
      embedded = image.format === "jpeg" ? await doc.embedJpg(image.bytes) : await doc.embedPng(image.bytes);
    } catch {
      throw new Error(`${image.name} could not be embedded in the PDF. Try opening and re-saving the image in a supported format.`);
    }
    const page = doc.addPage([pageSize.width, pageSize.height]);
    page.drawImage(embedded, { x: placement.x, y: placement.y, width: placement.width, height: placement.height });
    pageSizes.push(pageSize);
    placements.push(placement);
  }

  if (signal?.aborted) throw new DOMException("PDF generation was cancelled.", "AbortError");
  const bytes = await doc.save({ useObjectStreams: false });
  if (bytes.byteLength > MAX_IMAGES_TO_PDF_OUTPUT_BYTES) {
    throw new Error("The generated PDF exceeds the 100 MB output limit. Choose fewer or smaller images.");
  }
  let verified: PDFDocument;
  try {
    if (bytes.byteLength < 8 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new Error("Invalid PDF signature.");
    verified = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  } catch {
    throw new Error("The generated PDF did not pass validation, so it was not offered for download.");
  }
  if (verified.getPageCount() !== images.length) throw new Error("The generated PDF did not contain every selected image.");
  verified.getPages().forEach((page, index) => {
    if (Math.abs(page.getWidth() - pageSizes[index].width) > 0.01 || Math.abs(page.getHeight() - pageSizes[index].height) > 0.01) {
      throw new Error("The generated PDF did not pass its page-size check.");
    }
  });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  return {
    blob,
    filename: IMAGES_TO_PDF_FILENAME,
    imageCount: images.length,
    pageCount: verified.getPageCount(),
    sizeBytes: blob.size,
    pageSizes,
    placements,
  };
}

export type { ImageFormat };
