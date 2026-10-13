import assert from "node:assert/strict";
import test from "node:test";
import { degrees, PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { unzipSync } from "fflate";
import {
  EXTRACTED_PDF_FILENAME,
  MAX_EXTRACTED_PDF_BYTES,
  MAX_PAGE_RANGE_CHARACTERS,
  MAX_SPLIT_PDF_FILE_BYTES,
  MAX_SPLIT_PDF_PAGES,
  MAX_SPLIT_ZIP_BYTES,
  MAX_SPLIT_ZIP_PAGES,
  SPLIT_PDF_ZIP_FILENAME,
  extractPdfPages,
  estimateStoredZipSize,
  inspectSplitPdfBytes,
  parsePageRange,
  splitEveryPdfPage,
} from "./pdf-splitting.ts";

async function makePdf(specs, name = "source.pdf") {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const [index, spec] of specs.entries()) {
    const page = doc.addPage([spec.width ?? 300, spec.height ?? 400]);
    page.drawText(spec.text ?? `SOURCE PAGE ${index + 1}`, { x: 20, y: 40, font, size: 12 });
    if (spec.rotation) page.setRotation(degrees(spec.rotation));
  }
  return { name, bytes: await doc.save({ useObjectStreams: false }) };
}

async function encryptedPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  doc.encrypt({ userPassword: "secret", ownerPassword: "owner" });
  return doc.save({ useObjectStreams: false });
}

async function outputDocument(bytes) {
  return PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
}

async function readZip(artifact) {
  return unzipSync(new Uint8Array(await artifact.blob.arrayBuffer()));
}

test("parses one positive 1-based page", () => assert.deepEqual(parsePageRange("1", 5), [1]));
test("parses an inclusive range", () => assert.deepEqual(parsePageRange("1-3", 5), [1, 2, 3]));
test("parses comma-separated page numbers", () => assert.deepEqual(parsePageRange("1,3,5", 5), [1, 3, 5]));
test("parses mixed ranges", () => assert.deepEqual(parsePageRange("1-3,6,8-10", 10), [1, 2, 3, 6, 8, 9, 10]));
test("allows harmless whitespace", () => assert.deepEqual(parsePageRange(" 5 , 2 - 3 ", 5), [5, 2, 3]));
test("preserves the order entered rather than sorting", () => assert.deepEqual(parsePageRange("5,2-3", 5), [5, 2, 3]));
test("rejects page zero", () => assert.throws(() => parsePageRange("0", 5), /start at 1|not valid/));
test("rejects negative pages", () => assert.throws(() => parsePageRange("-2", 5), /Negative page numbers/));
test("rejects reversed ranges", () => assert.throws(() => parsePageRange("5-2", 5), /reversed/));
test("rejects an out-of-range page", () => assert.throws(() => parsePageRange("6", 5), /outside this 5-page/));
test("rejects an out-of-range range endpoint", () => assert.throws(() => parsePageRange("4-6", 5), /outside this 5-page/));
test("rejects malformed syntax", () => assert.throws(() => parsePageRange("1--2", 5), /not a valid/));
test("rejects empty selection", () => assert.throws(() => parsePageRange("  ", 5), /Enter one or more/));
test("rejects an empty comma item", () => assert.throws(() => parsePageRange("1,,3", 5), /commas only/));
test("rejects trailing commas", () => assert.throws(() => parsePageRange("1,", 5), /commas only/));
test("rejects duplicate page numbers", () => assert.throws(() => parsePageRange("1,1", 5), /selected more than once/));
test("rejects overlapping ranges", () => assert.throws(() => parsePageRange("1-3,3-5", 5), /selected more than once/));
test("rejects unsafe integer values", () => assert.throws(() => parsePageRange("9007199254740993", 5), /whole numbers/));
test("rejects a range string beyond its parser limit", () => assert.throws(() => parsePageRange("1".repeat(MAX_PAGE_RANGE_CHARACTERS + 1), 5), /too long/));
test("enforces a 300-page selection ceiling", () => assert.equal(parsePageRange("1-300", 300).length, MAX_SPLIT_PDF_PAGES));
test("rejects invalid source page counts", () => assert.throws(() => parsePageRange("1", 0), /at least one page/));

test("parses the real structure of a PDF regardless of its filename", async () => {
  const source = await makePdf([{ text: "valid" }], "renamed.bin");
  assert.equal((await inspectSplitPdfBytes(source.bytes, source.name)).pageCount, 1);
});
test("rejects an empty input", async () => assert.rejects(inspectSplitPdfBytes(new Uint8Array(), "empty.pdf"), /empty/));
test("rejects non-PDF bytes even with a PDF filename", async () => assert.rejects(inspectSplitPdfBytes(new TextEncoder().encode("not a PDF"), "fake.pdf"), /not a PDF/));
test("rejects bytes without a PDF header", async () => assert.rejects(inspectSplitPdfBytes(new TextEncoder().encode("\n\n%%EOF")), /not a PDF/));
test("rejects a truncated PDF", async () => {
  const source = await makePdf([{ text: "truncated" }]);
  await assert.rejects(inspectSplitPdfBytes(source.bytes.slice(0, -8)), /truncated or incomplete/);
});
test("rejects corrupt content with a PDF-shaped header and trailer", async () => assert.rejects(inspectSplitPdfBytes(new TextEncoder().encode("%PDF-1.7\ninvalid body\n%%EOF")), /could not be read/));
test("rejects encrypted PDFs without asking for or bypassing a password", async () => assert.rejects(inspectSplitPdfBytes(await encryptedPdf(), "locked.pdf"), /encrypted or password-protected/));
test("checks the 25 MB input ceiling before parsing", async () => assert.rejects(inspectSplitPdfBytes(new Uint8Array(MAX_SPLIT_PDF_FILE_BYTES + 1)), /25 MB per-file/));
test("rejects a PDF over the 300 source-page ceiling", async () => {
  const source = await makePdf(Array.from({ length: MAX_SPLIT_PDF_PAGES + 1 }, (_, i) => ({ width: 100 + i })));
  await assert.rejects(inspectSplitPdfBytes(source.bytes), /300-page total limit/);
});
test("rejects PDFs without usable pages", async () => {
  const onePage = await PDFDocument.create();
  onePage.addPage([100, 100]);
  const saved = await onePage.save({ useObjectStreams: false });
  const mutated = new TextDecoder().decode(saved)
    .replace(/\/Kids \[ 4 0 R \]/, (match) => `/Kids []${" ".repeat(match.length - 8)}`)
    .replace("/Count 1", "/Count 0");
  await assert.rejects(inspectSplitPdfBytes(new TextEncoder().encode(mutated)), /usable pages/);
});

test("extracts one selected page into a valid named PDF", async () => {
  const source = await makePdf([{ width: 210, height: 297 }, { width: 420, height: 297 }]);
  const result = await extractPdfPages(source.bytes, [2]);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  const doc = await outputDocument(bytes);
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  assert.equal(doc.getPageCount(), 1);
  assert.equal(result.filename, EXTRACTED_PDF_FILENAME);
  assert.equal(result.blob.type, "application/pdf");
  assert.deepEqual(result.pageNumbers, [2]);
  assert.deepEqual([doc.getPage(0).getWidth(), doc.getPage(0).getHeight()], [420, 297]);
});
test("extracts mixed ranges in the exact user-entered order", async () => {
  const source = await makePdf([{ width: 101 }, { width: 202 }, { width: 303 }, { width: 404 }, { width: 505 }]);
  const pages = parsePageRange("5,2-3", 5);
  const result = await extractPdfPages(source.bytes, pages);
  const doc = await outputDocument(new Uint8Array(await result.blob.arrayBuffer()));
  assert.equal(doc.getPageCount(), 3);
  assert.deepEqual(doc.getPages().map((page) => page.getWidth()), [505, 202, 303]);
});
test("preserves dimensions and rotation for portrait, landscape, and rotated pages", async () => {
  const source = await makePdf([
    { width: 200, height: 400 },
    { width: 500, height: 250 },
    { width: 210, height: 297, rotation: 90 },
  ]);
  const result = await extractPdfPages(source.bytes, [1, 2, 3]);
  const doc = await outputDocument(new Uint8Array(await result.blob.arrayBuffer()));
  assert.deepEqual(doc.getPages().map((page) => [page.getWidth(), page.getHeight(), page.getRotation().angle]), [
    [200, 400, 0], [500, 250, 0], [210, 297, 90],
  ]);
});
test("rejects empty, repeated, and out-of-range extraction selections", async () => {
  const source = await makePdf([{ text: "one" }, { text: "two" }]);
  await assert.rejects(extractPdfPages(source.bytes, []), /at least one page/);
  await assert.rejects(extractPdfPages(source.bytes, [1, 1]), /selected more than once/);
  await assert.rejects(extractPdfPages(source.bytes, [3]), /outside this 2-page/);
});
test("reports output size and selected-page count", async () => {
  const source = await makePdf([{ text: "one" }, { text: "two" }]);
  const result = await extractPdfPages(source.bytes, [2, 1]);
  assert.equal(result.pageCount, 2);
  assert.equal(result.sizeBytes, result.blob.size);
  assert.ok(result.sizeBytes <= MAX_EXTRACTED_PDF_BYTES);
});
test("cancels selected-page extraction when its signal is aborted", async () => {
  const source = await makePdf([{ text: "one" }]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(extractPdfPages(source.bytes, [1], controller.signal), { name: "AbortError" });
});

test("creates a valid ZIP with one PDF per source page", async () => {
  const source = await makePdf([{ width: 200 }, { width: 300 }, { width: 400 }]);
  const result = await splitEveryPdfPage(source.bytes);
  const entries = await readZip(result);
  assert.equal(new TextDecoder().decode(new Uint8Array(await result.blob.arrayBuffer()).subarray(0, 2)), "PK");
  assert.equal(result.filename, SPLIT_PDF_ZIP_FILENAME);
  assert.equal(result.blob.type, "application/zip");
  assert.equal(result.pageCount, 3);
  assert.deepEqual(Object.keys(entries), ["page-001.pdf", "page-002.pdf", "page-003.pdf"]);
  assert.deepEqual(Object.values(entries).map((bytes) => new TextDecoder().decode(bytes.subarray(0, 5))), ["%PDF-", "%PDF-", "%PDF-"]);
});
test("each ZIP member is independently a one-page PDF preserving original order and size", async () => {
  const source = await makePdf([{ width: 190, height: 300 }, { width: 420, height: 210 }, { width: 250, height: 350, rotation: 90 }]);
  const entries = await readZip(await splitEveryPdfPage(source.bytes));
  const pages = [];
  for (const name of Object.keys(entries)) {
    const doc = await outputDocument(entries[name]);
    assert.equal(doc.getPageCount(), 1);
    const page = doc.getPage(0);
    pages.push([page.getWidth(), page.getHeight(), page.getRotation().angle]);
  }
  assert.deepEqual(pages, [[190, 300, 0], [420, 210, 0], [250, 350, 90]]);
});
test("single-page split explains itself and still creates one PDF in the ZIP", async () => {
  const source = await makePdf([{ text: "only page" }]);
  const result = await splitEveryPdfPage(source.bytes);
  const entries = await readZip(result);
  assert.equal(result.pageCount, 1);
  assert.deepEqual(Object.keys(entries), ["page-001.pdf"]);
  assert.equal((await outputDocument(entries["page-001.pdf"])).getPageCount(), 1);
});
test("uses safe, sequential, zero-padded ZIP member names", async () => {
  const source = await makePdf([{ text: "one" }, { text: "two" }]);
  const result = await splitEveryPdfPage(source.bytes);
  const entries = await readZip(result);
  for (const name of Object.keys(entries)) {
    assert.match(name, /^page-\d{3}\.pdf$/);
    assert.equal(name.includes(".."), false);
    assert.equal(name.includes("/"), false);
    assert.equal(name.includes("\\"), false);
    assert.equal(name.startsWith("/"), false);
  }
});
test("rejects ZIP splitting over the 50-page batch limit before generation", async () => {
  const source = await makePdf(Array.from({ length: MAX_SPLIT_ZIP_PAGES + 1 }, (_, i) => ({ width: 100 + i })));
  await assert.rejects(splitEveryPdfPage(source.bytes), /up to 50 pages per ZIP/);
});
test("emits bounded sequential page progress", async () => {
  const source = await makePdf([{ text: "one" }, { text: "two" }, { text: "three" }]);
  const progress = [];
  await splitEveryPdfPage(source.bytes, (completed, total) => progress.push([completed, total]));
  assert.deepEqual(progress, [[1, 3], [2, 3], [3, 3]]);
});
test("ZIP output stays within its documented size ceiling", async () => {
  assert.equal(MAX_SPLIT_ZIP_BYTES, 75 * 1024 * 1024);
  const source = await makePdf([{ text: "small" }]);
  const result = await splitEveryPdfPage(source.bytes);
  assert.ok(result.sizeBytes <= MAX_SPLIT_ZIP_BYTES);
});
test("predicts stored ZIP overhead and rejects a projected archive beyond the ceiling", () => {
  const file = "page-001.pdf";
  assert.equal(estimateStoredZipSize(0, [], file, 100), 100 + 30 + file.length + 46 + file.length + 22);
  assert.ok(estimateStoredZipSize(MAX_SPLIT_ZIP_BYTES - 100, [], file, 200) > MAX_SPLIT_ZIP_BYTES);
});
test("cancels ZIP generation when its signal is aborted", async () => {
  const source = await makePdf([{ text: "one" }]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(splitEveryPdfPage(source.bytes, undefined, controller.signal), { name: "AbortError" });
});
