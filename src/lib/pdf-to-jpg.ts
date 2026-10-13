import { MAX_PAGE_RANGE_CHARACTERS, parsePdfPageRange } from "./pdf-page-ranges.ts";
import { Zip, ZipPassThrough } from "fflate";

export const PDF_TO_JPG_VERSION = "6.4.299";
export const PDF_TO_JPG_WORKER_URL = "/vendor/pdfjs/pdf.worker.min.mjs";
export const PDF_TO_JPG_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const PDF_TO_JPG_MAX_SOURCE_PAGES = 300;
export const PDF_TO_JPG_MAX_SELECTED_PAGES = 20;
export const PDF_TO_JPG_MAX_PAGE_PIXELS = 16_000_000;
export const PDF_TO_JPG_MAX_TOTAL_PIXELS = 150_000_000;
export const PDF_TO_JPG_MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
export const PDF_TO_JPG_DEFAULT_QUALITY = 85;
export const PDF_TO_JPG_DEFAULT_RANGE = "1-20";
export const PDF_TO_JPG_ZIP_FILENAME = "toolsfortoday-pdf-to-jpg.zip";

export type PdfJpgResolution = "standard" | "high" | "very-high";

export interface PdfJpgDimensions {
  width: number;
  height: number;
  pixels: number;
}

export interface PdfJpgOutput {
  sourcePage: number;
  width: number;
  height: number;
  blob: Blob;
  filename: string;
}

export interface PdfJpgZipInput {
  filename: string;
  bytes: Uint8Array;
}

export interface PdfJpgZipResult {
  blob: Blob;
  filename: string;
  files: string[];
  sizeBytes: number;
}

export function resolutionScale(resolution: PdfJpgResolution): number {
  switch (resolution) {
    case "standard": return 1;
    case "high": return 2;
    case "very-high": return 3;
  }
}

export function resolutionDpi(resolution: PdfJpgResolution): number {
  return 72 * resolutionScale(resolution);
}

export function estimatePdfJpgDimensions(width: number, height: number, resolution: PdfJpgResolution): PdfJpgDimensions {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("This PDF page has invalid dimensions and cannot be rendered.");
  }
  const scale = resolutionScale(resolution);
  const outputWidth = Math.ceil(width * scale);
  const outputHeight = Math.ceil(height * scale);
  if (!Number.isSafeInteger(outputWidth) || !Number.isSafeInteger(outputHeight)) {
    throw new Error("This page is too large to render safely. Choose a lower resolution.");
  }
  const pixels = outputWidth * outputHeight;
  if (!Number.isSafeInteger(pixels) || pixels > PDF_TO_JPG_MAX_PAGE_PIXELS) {
    throw new Error(`This page exceeds the 16-megapixel limit at ${resolutionDpi(resolution)} DPI. Choose a lower resolution.`);
  }
  return { width: outputWidth, height: outputHeight, pixels };
}

export function assertPdfJpgPixelBudget(pages: readonly PdfJpgDimensions[]): number {
  const total = pages.reduce((sum, page) => sum + page.pixels, 0);
  if (!Number.isSafeInteger(total) || total > PDF_TO_JPG_MAX_TOTAL_PIXELS) {
    throw new Error("These pages exceed the 150-megapixel combined processing limit. Select fewer pages or a lower resolution.");
  }
  return total;
}

export function parsePdfJpgPageSelection(selection: string, pageCount: number): number[] {
  return parsePdfPageRange(selection, pageCount, {
    maxSourcePages: PDF_TO_JPG_MAX_SOURCE_PAGES,
    maxSelectedPages: PDF_TO_JPG_MAX_SELECTED_PAGES,
  });
}

export function getPdfJpgPageSelection(mode: "all" | "selected", selection: string, pageCount: number): number[] {
  if (mode === "all") {
    if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > PDF_TO_JPG_MAX_SOURCE_PAGES) {
      throw new Error(`This PDF must contain between 1 and ${PDF_TO_JPG_MAX_SOURCE_PAGES} pages.`);
    }
    if (pageCount > PDF_TO_JPG_MAX_SELECTED_PAGES) {
      throw new Error(`This PDF has ${pageCount} pages. Select up to ${PDF_TO_JPG_MAX_SELECTED_PAGES} pages for each conversion.`);
    }
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  return parsePdfJpgPageSelection(selection, pageCount);
}

export function inspectPdfJpgBytes(bytes: Uint8Array, name = "PDF"): { sizeBytes: number } {
  if (bytes.byteLength === 0) throw new Error(`${name} is empty.`);
  if (bytes.byteLength > PDF_TO_JPG_MAX_FILE_BYTES) throw new Error(`${name} is larger than the 25 MB limit.`);
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 1024)));
  if (!/%PDF-\d\.\d/.test(header)) throw new Error(`${name} is not a PDF document.`);
  const trailer = new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
  if (!trailer.includes("%%EOF")) throw new Error(`${name} appears truncated or incomplete.`);
  return { sizeBytes: bytes.byteLength };
}

export function pdfJpgPageFilename(sourcePage: number): string {
  if (!Number.isInteger(sourcePage) || sourcePage < 1 || sourcePage > PDF_TO_JPG_MAX_SOURCE_PAGES) {
    throw new Error("A JPG filename requires a valid source page number.");
  }
  return `page-${String(sourcePage).padStart(3, "0")}.jpg`;
}

export function isCompleteJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
}

export function validatePdfJpgQuality(quality: number): number {
  if (!Number.isInteger(quality) || quality < 10 || quality > 100) {
    throw new Error("JPG quality must be a whole-number percentage from 10 to 100.");
  }
  return quality;
}

export function estimateStoredZipSize(emittedBytes: number, existingNames: readonly string[], nextName: string, nextSize: number): number {
  const names = [...existingNames, nextName];
  const headers = names.reduce((sum, name) => sum + 76 + (new TextEncoder().encode(name)).byteLength, 22);
  return emittedBytes + nextSize + 30 + new TextEncoder().encode(nextName).byteLength + headers;
}

export function assertPdfJpgOutputSize(sizeBytes: number): void {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) throw new Error("The generated output size is invalid.");
  if (sizeBytes > PDF_TO_JPG_MAX_OUTPUT_BYTES) {
    throw new Error("The ZIP would exceed the 100 MB output limit. Select fewer pages, lower the resolution, or reduce JPG quality.");
  }
}

export function validatePdfJpgZipMembers(names: readonly string[]): void {
  if (names.length < 2) throw new Error("A ZIP is only used when more than one page is selected.");
  if (new Set(names).size !== names.length) throw new Error("The ZIP contains duplicate page names.");
  for (const name of names) {
    if (!/^page-\d{3}\.jpg$/.test(name) || name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error("The ZIP contains an unsafe filename.");
    }
  }
}

export function createPdfJpgZip(files: readonly PdfJpgZipInput[]): PdfJpgZipResult {
  const names = files.map((file) => file.filename);
  validatePdfJpgZipMembers(names);
  const chunks: Uint8Array[] = [];
  let emittedBytes = 0;
  let zipError: Error | null = null;
  const zip = new Zip((error, chunk) => {
    if (error) zipError = error;
    else {
      emittedBytes += chunk.byteLength;
      if (emittedBytes > PDF_TO_JPG_MAX_OUTPUT_BYTES) {
        zipError = new Error("The ZIP would exceed the 100 MB output limit. Select fewer pages, lower the resolution, or reduce JPG quality.");
      }
      chunks.push(chunk);
    }
  });

  try {
    let projectedBytes = 0;
    const addedNames: string[] = [];
    for (const file of files) {
      if (!isCompleteJpeg(file.bytes)) throw new Error(`${file.filename} is not a complete JPEG image.`);
      projectedBytes = estimateStoredZipSize(projectedBytes, addedNames, file.filename, file.bytes.byteLength);
      assertPdfJpgOutputSize(projectedBytes);
      const entry = new ZipPassThrough(file.filename);
      zip.add(entry);
      entry.push(file.bytes, true);
      addedNames.push(file.filename);
      if (zipError) throw zipError;
    }
    zip.end();
    if (zipError) throw zipError;
    if (emittedBytes < 22 || emittedBytes > PDF_TO_JPG_MAX_OUTPUT_BYTES) {
      throw new Error("The generated ZIP did not pass its output-size check.");
    }
    const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
    return { blob, filename: PDF_TO_JPG_ZIP_FILENAME, files: names, sizeBytes: blob.size };
  } catch (error) {
    zip.terminate();
    throw error;
  }
}

export const PDF_TO_JPG_MAX_PAGE_RANGE_CHARACTERS = MAX_PAGE_RANGE_CHARACTERS;
