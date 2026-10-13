import { PDFDocument } from "@cantoo/pdf-lib";

export const MAX_PDF_FILES = 20;
export const MAX_PDF_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_PDF_TOTAL_PAGES = 300;
export const MERGED_PDF_FILENAME = "toolsfortoday-merged.pdf";

export interface PdfFileInput {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface PdfQueueItem<TFile extends PdfFileInput = PdfFileInput> {
  id: string;
  file: TFile;
  pageCount: number;
}

export interface ValidatedPdf {
  bytes: Uint8Array;
  pageCount: number;
}

export interface MergedPdf {
  blob: Blob;
  filename: string;
  documentCount: number;
  pageCount: number;
  sizeBytes: number;
}

export function assertPdfQueueLimits(files: readonly Pick<PdfFileInput, "name" | "size">[]): void {
  if (files.length > MAX_PDF_FILES) {
    throw new Error(`Choose no more than ${MAX_PDF_FILES} PDF files at a time.`);
  }

  let totalBytes = 0;
  for (const file of files) {
    if (file.size <= 0) throw new Error(`${file.name || "This file"} is empty.`);
    if (file.size > MAX_PDF_FILE_BYTES) {
      throw new Error(`${file.name || "This file"} is larger than the 25 MB per-file limit.`);
    }
    totalBytes += file.size;
  }

  if (totalBytes > MAX_PDF_TOTAL_BYTES) {
    throw new Error("The selected PDFs exceed the 100 MB combined input limit.");
  }
}

export function movePdfItem<T extends { id: string }>(items: readonly T[], id: string, direction: -1 | 1): T[] {
  const index = items.findIndex((item) => item.id === id);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= items.length) return [...items];
  const reordered = [...items];
  [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
  return reordered;
}

export function removePdfItem<T extends { id: string }>(items: readonly T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export function getPdfTotalPages(items: readonly Pick<PdfQueueItem, "pageCount">[]): number {
  return items.reduce((total, item) => total + item.pageCount, 0);
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("The merge was cancelled.", "AbortError");
}

function bytesToAscii(bytes: Uint8Array): string {
  let result = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return result;
}

export async function validatePdfBytes(bytes: Uint8Array, name = "PDF"): Promise<ValidatedPdf> {
  if (bytes.byteLength === 0) throw new Error(`${name} is empty.`);
  if (bytes.byteLength > MAX_PDF_FILE_BYTES) throw new Error(`${name} is larger than the 25 MB per-file limit.`);

  const header = bytesToAscii(bytes.subarray(0, Math.min(bytes.length, 1024)));
  if (!/%PDF-\d\.\d/.test(header)) throw new Error(`${name} is not a PDF document.`);
  const trailer = bytesToAscii(bytes.subarray(Math.max(0, bytes.length - 1024)));
  if (!trailer.includes("%%EOF")) throw new Error(`${name} appears truncated or incomplete.`);

  // Reject encrypted files explicitly; never pass a password or ask the parser to ignore encryption.
  const contents = trailer;
  if (/\/Encrypt\s*(?:\d+\s+\d+\s+R|<<)/.test(contents)) throw new Error(`${name} is encrypted or password-protected. Remove its password protection before selecting it.`);

  try {
    const document = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
    const pageCount = document.getPageCount();
    if (pageCount < 1) throw new Error(`${name} does not contain any usable pages.`);
    if (pageCount > MAX_PDF_TOTAL_PAGES) throw new Error(`${name} exceeds the ${MAX_PDF_TOTAL_PAGES}-page total limit.`);
    return { bytes, pageCount };
  } catch (error) {
    if (error instanceof Error && /encrypted|password/i.test(error.message)) {
      throw new Error(`${name} is encrypted or password-protected. Remove its password protection before selecting it.`);
    }
    if (error instanceof Error && /does not contain any usable pages|exceeds the/i.test(error.message)) throw error;
    throw new Error(`${name} could not be read as a complete, supported PDF. Check that it is not corrupt, truncated, or password-protected.`);
  }
}

export async function inspectPdfFile(file: PdfFileInput): Promise<ValidatedPdf> {
  assertPdfQueueLimits([file]);
  const bytes = new Uint8Array(await file.arrayBuffer());
  return validatePdfBytes(bytes, file.name);
}

export async function mergePdfFiles(files: readonly PdfFileInput[], signal?: AbortSignal): Promise<MergedPdf> {
  if (files.length < 2) throw new Error("Select at least two valid PDFs before merging.");
  assertPdfQueueLimits(files);

  const output = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    checkAbort(signal);
    const validated = await inspectPdfFile(file);
    totalPages += validated.pageCount;
    if (totalPages > MAX_PDF_TOTAL_PAGES) {
      throw new Error(`The selected PDFs exceed the ${MAX_PDF_TOTAL_PAGES}-page total limit.`);
    }
    const source = await PDFDocument.load(validated.bytes, { updateMetadata: false, throwOnInvalidObject: true });
    const copiedPages = await output.copyPages(source, source.getPageIndices());
    checkAbort(signal);
    for (const page of copiedPages) output.addPage(page);
  }

  checkAbort(signal);
  const outputBytes = await output.save({ useObjectStreams: false });
  checkAbort(signal);
  if (outputBytes.byteLength < 8 || bytesToAscii(outputBytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("The merged file could not be validated. Please try again with different PDFs.");
  }
  const verified = await PDFDocument.load(outputBytes, { updateMetadata: false, throwOnInvalidObject: true });
  if (verified.getPageCount() !== totalPages) {
    throw new Error("The merged file did not contain every selected page. No download was created.");
  }

  const blob = new Blob([outputBytes as unknown as BlobPart], { type: "application/pdf" });
  return {
    blob,
    filename: MERGED_PDF_FILENAME,
    documentCount: files.length,
    pageCount: totalPages,
    sizeBytes: blob.size,
  };
}
