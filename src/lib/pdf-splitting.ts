import { PDFDocument } from "@cantoo/pdf-lib";
import { Zip, ZipPassThrough } from "fflate";
import { MAX_PDF_FILE_BYTES, MAX_PDF_TOTAL_PAGES, validatePdfBytes } from "./pdf-merging.ts";
import { parsePdfPageRange } from "./pdf-page-ranges.ts";
export { MAX_PAGE_RANGE_CHARACTERS } from "./pdf-page-ranges.ts";

export const MAX_SPLIT_PDF_FILE_BYTES = MAX_PDF_FILE_BYTES;
export const MAX_SPLIT_PDF_PAGES = MAX_PDF_TOTAL_PAGES;
export const MAX_SPLIT_ZIP_PAGES = 50;
export const MAX_EXTRACTED_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_SPLIT_ZIP_BYTES = 75 * 1024 * 1024;
export const EXTRACTED_PDF_FILENAME = "toolsfortoday-extracted-pages.pdf";
export const SPLIT_PDF_ZIP_FILENAME = "toolsfortoday-split-pages.zip";

export interface SplitPdfArtifact {
  blob: Blob;
  filename: string;
  pageCount: number;
  sizeBytes: number;
  pageNumbers: number[];
}

export interface SplitPdfZipArtifact {
  blob: Blob;
  filename: string;
  pageCount: number;
  sizeBytes: number;
  files: string[];
}

function bytesToAscii(bytes: Uint8Array): string {
  let result = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    result += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 8192, bytes.length)));
  }
  return result;
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("PDF processing was cancelled.", "AbortError");
}

function assertPageNumbers(pageNumbers: readonly number[], pageCount: number): void {
  if (pageNumbers.length === 0) throw new Error("Enter at least one page to extract.");
  if (pageNumbers.length > MAX_SPLIT_PDF_PAGES) {
    throw new Error(`Select no more than ${MAX_SPLIT_PDF_PAGES} pages at a time.`);
  }
  const seen = new Set<number>();
  for (const page of pageNumbers) {
    if (!Number.isInteger(page) || page < 1) throw new Error("Page numbers must be positive whole numbers starting at 1.");
    if (page > pageCount) throw new Error(`Page ${page} is outside this ${pageCount}-page PDF.`);
    if (seen.has(page)) throw new Error(`Page ${page} is selected more than once. Remove duplicates or overlapping ranges.`);
    seen.add(page);
  }
}

export function parsePageRange(selection: string, pageCount: number): number[] {
  return parsePdfPageRange(selection, pageCount, {
    maxSourcePages: MAX_PDF_TOTAL_PAGES,
    maxSelectedPages: MAX_SPLIT_PDF_PAGES,
  });
}

export function estimateStoredZipSize(
  emittedLocalBytes: number,
  existingNames: readonly string[],
  nextName: string,
  nextFileBytes: number,
): number {
  const directoryBytes = [...existingNames, nextName].reduce((sum, name) => sum + 46 + name.length, 22);
  return emittedLocalBytes + nextFileBytes + 30 + nextName.length + directoryBytes;
}

export async function inspectSplitPdfBytes(bytes: Uint8Array, name = "PDF") {
  return validatePdfBytes(bytes, name);
}

async function verifyPdfOutput(
  bytes: Uint8Array,
  expectedSourceIndexes: readonly number[],
  source: PDFDocument,
): Promise<void> {
  if (bytes.byteLength < 8 || bytesToAscii(bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("The generated PDF could not be validated. Please try a different document.");
  }
  let output: PDFDocument;
  try {
    output = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  } catch {
    throw new Error("The generated PDF did not pass validation, so it was not offered for download.");
  }
  if (output.getPageCount() !== expectedSourceIndexes.length) {
    throw new Error("The generated PDF did not contain the expected pages, so it was not offered for download.");
  }
  for (const [outputIndex, sourceIndex] of expectedSourceIndexes.entries()) {
    const outputPage = output.getPage(outputIndex);
    const sourcePage = source.getPage(sourceIndex);
    if (
      Math.abs(outputPage.getWidth() - sourcePage.getWidth()) > 0.01 ||
      Math.abs(outputPage.getHeight() - sourcePage.getHeight()) > 0.01 ||
      outputPage.getRotation().angle !== sourcePage.getRotation().angle
    ) {
      throw new Error("The generated PDF did not preserve the selected page dimensions and orientation.");
    }
  }
}

async function createPdfFromIndexes(
  source: PDFDocument,
  zeroBasedIndexes: readonly number[],
  signal?: AbortSignal,
): Promise<Uint8Array> {
  checkAbort(signal);
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, [...zeroBasedIndexes]);
  checkAbort(signal);
  for (const page of copiedPages) output.addPage(page);
  const bytes = await output.save({ useObjectStreams: false });
  checkAbort(signal);
  if (bytes.byteLength > MAX_EXTRACTED_PDF_BYTES) {
    throw new Error("This extracted PDF would exceed the 50 MB output limit. Select fewer or smaller pages.");
  }
  await verifyPdfOutput(bytes, zeroBasedIndexes, source);
  return bytes;
}

export async function extractPdfPages(
  sourceBytes: Uint8Array,
  pageNumbers: readonly number[],
  signal?: AbortSignal,
): Promise<SplitPdfArtifact> {
  const validated = await inspectSplitPdfBytes(sourceBytes);
  assertPageNumbers(pageNumbers, validated.pageCount);
  checkAbort(signal);
  const source = await PDFDocument.load(validated.bytes, { updateMetadata: false, throwOnInvalidObject: true });
  const indexes = pageNumbers.map((page) => page - 1);
  const bytes = await createPdfFromIndexes(source, indexes, signal);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  return { blob, filename: EXTRACTED_PDF_FILENAME, pageCount: indexes.length, sizeBytes: blob.size, pageNumbers: [...pageNumbers] };
}

function safePageFilename(index: number): string {
  return `page-${String(index + 1).padStart(3, "0")}.pdf`;
}

export async function splitEveryPdfPage(
  sourceBytes: Uint8Array,
  onProgress?: (completed: number, total: number) => void,
  signal?: AbortSignal,
): Promise<SplitPdfZipArtifact> {
  const validated = await inspectSplitPdfBytes(sourceBytes);
  if (validated.pageCount > MAX_SPLIT_ZIP_PAGES) {
    throw new Error(`Split Every Page supports up to ${MAX_SPLIT_ZIP_PAGES} pages per ZIP. Use Extract Pages for larger PDFs.`);
  }
  checkAbort(signal);
  const source = await PDFDocument.load(validated.bytes, { updateMetadata: false, throwOnInvalidObject: true });
  const names: string[] = [];
  const chunks: Uint8Array[] = [];
  let archiveSize = 0;
  let zipError: Error | null = null;
  const zip = new Zip((error, chunk) => {
    if (error) {
      zipError = error;
      return;
    }
    archiveSize += chunk.byteLength;
    chunks.push(chunk);
  });

  for (let pageIndex = 0; pageIndex < validated.pageCount; pageIndex += 1) {
    checkAbort(signal);
    const name = safePageFilename(pageIndex);
    const pageBytes = await createPdfFromIndexes(source, [pageIndex], signal);
    const projectedSize = estimateStoredZipSize(archiveSize, names, name, pageBytes.byteLength);
    if (projectedSize > MAX_SPLIT_ZIP_BYTES) {
      zip.terminate();
      throw new Error("The individual-page ZIP would exceed the 75 MB archive limit. Use Extract Pages or choose a smaller PDF.");
    }
    const entry = new ZipPassThrough(name);
    zip.add(entry);
    entry.push(pageBytes, true);
    names.push(name);
    onProgress?.(pageIndex + 1, validated.pageCount);
  }

  checkAbort(signal);
  zip.end();
  if (zipError) throw zipError;
  if (archiveSize > MAX_SPLIT_ZIP_BYTES) throw new Error("The generated ZIP exceeded the 75 MB archive limit.");
  const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
  return { blob, filename: SPLIT_PDF_ZIP_FILENAME, pageCount: validated.pageCount, sizeBytes: blob.size, files: names };
}
