import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { unzipSync } from "fflate";
import {
  assertPdfJpgOutputSize,
  createPdfJpgZip,
  assertPdfJpgPixelBudget,
  estimatePdfJpgDimensions,
  estimateStoredZipSize,
  getPdfJpgPageSelection,
  inspectPdfJpgBytes,
  isCompleteJpeg,
  PDF_TO_JPG_DEFAULT_QUALITY,
  PDF_TO_JPG_MAX_FILE_BYTES,
  PDF_TO_JPG_MAX_PAGE_PIXELS,
  PDF_TO_JPG_MAX_OUTPUT_BYTES,
  PDF_TO_JPG_MAX_SELECTED_PAGES,
  PDF_TO_JPG_MAX_SOURCE_PAGES,
  PDF_TO_JPG_MAX_TOTAL_PIXELS,
  PDF_TO_JPG_VERSION,
  PDF_TO_JPG_WORKER_URL,
  PDF_TO_JPG_ZIP_FILENAME,
  parsePdfJpgPageSelection,
  pdfJpgPageFilename,
  resolutionDpi,
  resolutionScale,
  validatePdfJpgZipMembers,
  validatePdfJpgQuality,
} from "./pdf-to-jpg.ts";

const samplePdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9]);

test("PDF validator accepts actual PDF signature and EOF markers regardless of filename", () => {
  assert.deepEqual(inspectPdfJpgBytes(samplePdf, "renamed.bin"), { sizeBytes: samplePdf.length });
});
test("rejects an empty file", () => assert.throws(() => inspectPdfJpgBytes(new Uint8Array(), "empty.pdf"), /empty/));
test("rejects non-PDF bytes even when named .pdf", () => assert.throws(() => inspectPdfJpgBytes(new TextEncoder().encode("GIF89a"), "fake.pdf"), /not a PDF/));
test("rejects a missing PDF header", () => assert.throws(() => inspectPdfJpgBytes(new TextEncoder().encode("body %%EOF")), /not a PDF/));
test("rejects truncated PDFs without an EOF marker", () => assert.throws(() => inspectPdfJpgBytes(new TextEncoder().encode("%PDF-1.7\nbody")), /truncated/));
test("checks the 25 MB input ceiling before parsing", () => assert.throws(() => inspectPdfJpgBytes(new Uint8Array(PDF_TO_JPG_MAX_FILE_BYTES + 1)), /25 MB/));
test("rejects a PDF over the source page-count limit", () => assert.throws(() => parsePdfJpgPageSelection("1", PDF_TO_JPG_MAX_SOURCE_PAGES + 1), /300-page limit/));

test("All Pages selects each page in source order when the document fits one batch", () => assert.deepEqual(getPdfJpgPageSelection("all", "", 3), [1, 2, 3]));
test("All Pages rejects source PDFs larger than the batch limit instead of truncating", () => assert.throws(() => getPdfJpgPageSelection("all", "", 21), /Select up to 20 pages/));
test("Selected Pages accepts one page", () => assert.deepEqual(getPdfJpgPageSelection("selected", "7", 8), [7]));
test("Selected Pages supports inclusive ranges", () => assert.deepEqual(parsePdfJpgPageSelection("2-4", 8), [2, 3, 4]));
test("Selected Pages supports comma-separated pages and ranges", () => assert.deepEqual(parsePdfJpgPageSelection("1,3,5-7", 8), [1, 3, 5, 6, 7]));
test("Selected Pages supports harmless whitespace", () => assert.deepEqual(parsePdfJpgPageSelection(" 5 , 2 - 3 ", 8), [5, 2, 3]));
test("Selected Pages preserves the user's ordering", () => assert.deepEqual(parsePdfJpgPageSelection("5,2-3", 8), [5, 2, 3]));
test("Selected Pages rejects page zero", () => assert.throws(() => parsePdfJpgPageSelection("0", 8), /Page 0/));
test("Selected Pages rejects negative pages", () => assert.throws(() => parsePdfJpgPageSelection("-2", 8), /Negative page numbers/));
test("Selected Pages rejects out-of-range pages", () => assert.throws(() => parsePdfJpgPageSelection("9", 8), /outside this 8-page/));
test("Selected Pages rejects out-of-range range endpoints", () => assert.throws(() => parsePdfJpgPageSelection("7-9", 8), /outside this 8-page/));
test("Selected Pages rejects duplicate pages", () => assert.throws(() => parsePdfJpgPageSelection("1,1", 8), /selected more than once/));
test("Selected Pages rejects overlapping ranges", () => assert.throws(() => parsePdfJpgPageSelection("1-3,3-5", 8), /selected more than once/));
test("Selected Pages rejects reversed ranges", () => assert.throws(() => parsePdfJpgPageSelection("5-2", 8), /reversed/));
test("Selected Pages rejects malformed syntax", () => assert.throws(() => parsePdfJpgPageSelection("1--2", 8), /not a valid/));
test("Selected Pages rejects a blank selection", () => assert.throws(() => parsePdfJpgPageSelection(" ", 8), /Enter one or more/));
test("Selected Pages rejects empty comma segments", () => assert.throws(() => parsePdfJpgPageSelection("1,,3", 8), /commas only/));
test("Selected Pages enforces the 20 page batch limit", () => assert.throws(() => parsePdfJpgPageSelection("1-21", 300), /no more than 20/));
test("the configured per-batch selection limit is 20 pages", () => assert.equal(PDF_TO_JPG_MAX_SELECTED_PAGES, 20));
test("Selected Pages supports page 300 in a large source PDF", () => assert.deepEqual(parsePdfJpgPageSelection("300", 300), [300]));

test("Standard, High, and Very High use 72, 144, and 216 DPI-equivalent scales", () => {
  assert.deepEqual([resolutionDpi("standard"), resolutionDpi("high"), resolutionDpi("very-high")], [72, 144, 216]);
  assert.deepEqual([resolutionScale("standard"), resolutionScale("high"), resolutionScale("very-high")], [1, 2, 3]);
});
test("output dimensions use ceiling of effective viewport dimensions times scale", () => {
  assert.deepEqual(estimatePdfJpgDimensions(595.28, 841.89, "standard"), { width: 596, height: 842, pixels: 501832 });
  assert.deepEqual(estimatePdfJpgDimensions(100, 200, "high"), { width: 200, height: 400, pixels: 80000 });
});
test("rejects invalid page geometry", () => assert.throws(() => estimatePdfJpgDimensions(0, 100, "standard"), /invalid dimensions/));
test("enforces the per-page 16 megapixel canvas limit before allocation", () => assert.throws(() => estimatePdfJpgDimensions(1600, 1600, "very-high"), /16-megapixel limit/));
test("the configured per-page pixel ceiling is 16 megapixels", () => assert.equal(PDF_TO_JPG_MAX_PAGE_PIXELS, 16_000_000));
test("enforces the combined 150 megapixel rendering budget", () => assert.throws(() => assertPdfJpgPixelBudget(Array(10).fill({ pixels: PDF_TO_JPG_MAX_TOTAL_PIXELS / 10 + 1 })), /150-megapixel/));
test("accepts a combined page budget at the configured maximum", () => assert.equal(assertPdfJpgPixelBudget([{ pixels: PDF_TO_JPG_MAX_TOTAL_PIXELS }]), PDF_TO_JPG_MAX_TOTAL_PIXELS));
test("default JPG quality is 85 percent and the supported setting is bounded by the UI range", () => {
  assert.equal(PDF_TO_JPG_DEFAULT_QUALITY, 85);
  assert.equal(validatePdfJpgQuality(10), 10);
  assert.equal(validatePdfJpgQuality(100), 100);
  for (const invalid of [9, 101, 85.5, Number.NaN]) assert.throws(() => validatePdfJpgQuality(invalid), /10 to 100/);
});

test("recognizes complete JPEG signature and end marker", () => assert.equal(isCompleteJpeg(jpeg), true));
test("rejects non-JPEG and incomplete JPEG bytes", () => {
  assert.equal(isCompleteJpeg(new TextEncoder().encode("PNG")), false);
  assert.equal(isCompleteJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), false);
});
test("creates zero-padded source page filenames", () => {
  assert.equal(pdfJpgPageFilename(1), "page-001.jpg");
  assert.equal(pdfJpgPageFilename(7), "page-007.jpg");
  assert.throws(() => pdfJpgPageFilename(0), /valid source page/);
});
test("estimates stored ZIP sizes including safe entry headers", () => assert.ok(estimateStoredZipSize(0, [], "page-001.jpg", jpeg.length) > jpeg.length));
test("accepts the exact output-size limit and rejects larger or invalid sizes", () => {
  assertPdfJpgOutputSize(PDF_TO_JPG_MAX_OUTPUT_BYTES);
  assert.throws(() => assertPdfJpgOutputSize(PDF_TO_JPG_MAX_OUTPUT_BYTES + 1), /100 MB output limit/);
  assert.throws(() => assertPdfJpgOutputSize(Number.NaN), /size is invalid/);
});
test("rejects unsafe ZIP paths and duplicate names", () => {
  assert.throws(() => validatePdfJpgZipMembers(["page-001.jpg", "../page-002.jpg"]), /unsafe filename/);
  assert.throws(() => validatePdfJpgZipMembers(["page-001.jpg", "page-001.jpg"]), /duplicate/);
});
test("rejects a ZIP for fewer than two images", () => assert.throws(() => validatePdfJpgZipMembers(["page-001.jpg"]), /only used/));
test("creates a valid ZIP containing only ordered source-page JPEGs", async () => {
  const archive = createPdfJpgZip([
    { filename: "page-005.jpg", bytes: jpeg },
    { filename: "page-002.jpg", bytes: jpeg },
    { filename: "page-003.jpg", bytes: jpeg },
  ]);
  const bytes = new Uint8Array(await archive.blob.arrayBuffer());
  const entries = unzipSync(bytes);
  assert.equal(archive.filename, PDF_TO_JPG_ZIP_FILENAME);
  assert.equal(archive.blob.type, "application/zip");
  assert.deepEqual(Object.keys(entries), ["page-005.jpg", "page-002.jpg", "page-003.jpg"]);
  assert.ok(Object.values(entries).every(isCompleteJpeg));
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
});
test("rejects incomplete JPEG members instead of creating a partial ZIP", () => assert.throws(() => createPdfJpgZip([
  { filename: "page-001.jpg", bytes: jpeg },
  { filename: "page-002.jpg", bytes: new Uint8Array([0xff, 0xd8]) },
]), /not a complete JPEG/));

test("pins the renderer and checks that the static worker is the same release", () => {
  const worker = readFileSync("public/vendor/pdfjs/pdf.worker.min.mjs", "utf8");
  assert.equal(PDF_TO_JPG_VERSION, "6.4.299");
  assert.equal(PDF_TO_JPG_WORKER_URL, "/vendor/pdfjs/pdf.worker.min.mjs");
  assert.ok(worker.includes(PDF_TO_JPG_VERSION));
});
