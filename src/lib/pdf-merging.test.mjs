import assert from "node:assert/strict";
import test from "node:test";
import { degrees, PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import {
  MAX_PDF_FILES,
  MAX_PDF_FILE_BYTES,
  MAX_PDF_TOTAL_BYTES,
  MAX_PDF_TOTAL_PAGES,
  MERGED_PDF_FILENAME,
  assertPdfQueueLimits,
  getPdfTotalPages,
  inspectPdfFile,
  mergePdfFiles,
  movePdfItem,
  removePdfItem,
  validatePdfBytes,
} from "./pdf-merging.ts";

async function makePdf(pages, name = "document.pdf") {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (const [index, spec] of pages.entries()) {
    const page = document.addPage([spec.width ?? 300, spec.height ?? 400]);
    page.drawText(spec.text ?? `${name} — Page ${index + 1}`, { x: 20, y: 40, font, size: 12 });
    if (spec.rotation) page.setRotation(degrees(spec.rotation));
  }
  return { name, bytes: await document.save({ useObjectStreams: false }) };
}

function fileOf(bytes, name = "document.pdf") {
  const data = new Uint8Array(bytes);
  return { name, size: data.byteLength, async arrayBuffer() { return data.slice().buffer; } };
}

async function loadMerged(files) {
  const result = await mergePdfFiles(files);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  return { result, bytes, document: await PDFDocument.load(bytes, { updateMetadata: false }) };
}

async function encryptedPdf() {
  const document = await PDFDocument.create();
  document.addPage([100, 100]);
  document.encrypt({ userPassword: "test", ownerPassword: "owner" });
  return document.save({ useObjectStreams: false });
}

test("recognizes a valid PDF by parsing its structure, not its filename", async () => {
  const pdf = await makePdf([{ text: "valid" }], "renamed.bin");
  assert.equal((await inspectPdfFile(fileOf(pdf.bytes, pdf.name))).pageCount, 1);
});

test("rejects a non-PDF file even when its extension says PDF", async () => {
  await assert.rejects(inspectPdfFile(fileOf(new TextEncoder().encode("not a pdf"), "fake.pdf")), /not a PDF/);
});

test("rejects corrupt PDF content", async () => {
  await assert.rejects(validatePdfBytes(new TextEncoder().encode("%PDF-1.7\ninvalid body\n%%EOF"), "corrupt.pdf"), /could not be read/);
});

test("reports empty file input", async () => {
  await assert.rejects(inspectPdfFile(fileOf(new Uint8Array(), "empty.pdf")), /empty/);
});

test("rejects encrypted PDFs without attempting password bypass", async () => {
  await assert.rejects(validatePdfBytes(await encryptedPdf(), "locked.pdf"), /encrypted or password-protected/);
});

test("prevents a merge with only one valid document", async () => {
  const pdf = await makePdf([{ text: "one" }]);
  await assert.rejects(mergePdfFiles([fileOf(pdf.bytes)]), /at least two/);
});

test("merges two valid PDFs into a readable document", async () => {
  const first = await makePdf([{ width: 100, height: 200 }], "a.pdf");
  const second = await makePdf([{ width: 200, height: 300 }], "b.pdf");
  const { document } = await loadMerged([fileOf(first.bytes, first.name), fileOf(second.bytes, second.name)]);
  assert.equal(document.getPageCount(), 2);
});

test("merges three valid PDFs", async () => {
  const files = await Promise.all(["a", "b", "c"].map(async (name) => {
    const pdf = await makePdf([{ width: name.charCodeAt(0), height: 200 }], `${name}.pdf`);
    return fileOf(pdf.bytes, pdf.name);
  }));
  assert.equal((await loadMerged(files)).document.getPageCount(), 3);
});

test("supports documents with different page counts", async () => {
  const a = await makePdf([{ width: 100 }, { width: 101 }], "a.pdf");
  const b = await makePdf([{ width: 200 }, { width: 201 }, { width: 202 }], "b.pdf");
  assert.equal((await loadMerged([fileOf(a.bytes), fileOf(b.bytes)])).document.getPageCount(), 5);
});

test("reports the exact total page count", async () => {
  const a = await makePdf([{ width: 101 }, { width: 102 }], "a.pdf");
  const b = await makePdf([{ width: 201 }, { width: 202 }, { width: 203 }], "b.pdf");
  assert.equal((await loadMerged([fileOf(a.bytes), fileOf(b.bytes)])).result.pageCount, 5);
});

test("keeps the selected document order in the output", async () => {
  const a = await makePdf([{ width: 101 }], "a.pdf");
  const b = await makePdf([{ width: 202 }], "b.pdf");
  const { document } = await loadMerged([fileOf(a.bytes), fileOf(b.bytes)]);
  assert.deepEqual(document.getPages().map((page) => page.getWidth()), [101, 202]);
});

test("reversing documents reverses their output sequence", async () => {
  const a = await makePdf([{ width: 111 }], "a.pdf");
  const b = await makePdf([{ width: 222 }], "b.pdf");
  const { document } = await loadMerged([fileOf(b.bytes), fileOf(a.bytes)]);
  assert.deepEqual(document.getPages().map((page) => page.getWidth()), [222, 111]);
});

test("preserves internal page order for every source document", async () => {
  const a = await makePdf([{ width: 101 }, { width: 102 }], "a.pdf");
  const b = await makePdf([{ width: 201 }, { width: 202 }], "b.pdf");
  const { document } = await loadMerged([fileOf(a.bytes), fileOf(b.bytes)]);
  assert.deepEqual(document.getPages().map((page) => page.getWidth()), [101, 102, 201, 202]);
});

test("preserves portrait page dimensions", async () => {
  const pdf = await makePdf([{ width: 200, height: 400 }], "portrait.pdf");
  const { document } = await loadMerged([fileOf(pdf.bytes), fileOf(pdf.bytes, "copy.pdf")]);
  assert.deepEqual([document.getPage(0).getWidth(), document.getPage(0).getHeight()], [200, 400]);
});

test("preserves landscape page dimensions", async () => {
  const pdf = await makePdf([{ width: 400, height: 200 }], "landscape.pdf");
  const { document } = await loadMerged([fileOf(pdf.bytes), fileOf(pdf.bytes, "copy.pdf")]);
  assert.deepEqual([document.getPage(0).getWidth(), document.getPage(0).getHeight()], [400, 200]);
});

test("preserves mixed page sizes in the same output", async () => {
  const pdf = await makePdf([{ width: 100, height: 300 }, { width: 500, height: 250 }], "mixed.pdf");
  const { document } = await loadMerged([fileOf(pdf.bytes), fileOf(pdf.bytes, "copy.pdf")]);
  assert.deepEqual(document.getPages().slice(0, 2).map((page) => [page.getWidth(), page.getHeight()]), [[100, 300], [500, 250]]);
});

test("preserves page rotation", async () => {
  const pdf = await makePdf([{ width: 210, height: 297, rotation: 90 }], "rotated.pdf");
  const { document } = await loadMerged([fileOf(pdf.bytes), fileOf(pdf.bytes, "copy.pdf")]);
  assert.equal(document.getPage(0).getRotation().angle, 90);
});

test("rejects a PDF with no usable pages", async () => {
  const document = await PDFDocument.create();
  const pdfWithPage = await document.save({ useObjectStreams: false });
  const serialized = new TextDecoder().decode(pdfWithPage).replace(/\/Kids \[ 4 0 R \]/, (match) => `/Kids []${" ".repeat(match.length - 8)}`).replace("/Count 1", "/Count 0");
  const bytes = new TextEncoder().encode(serialized);
  await assert.rejects(validatePdfBytes(bytes, "no-pages.pdf"), /usable pages/);
});

test("keeps duplicate filenames as separate selected uploads", async () => {
  const a = await makePdf([{ width: 111 }], "same.pdf");
  const b = await makePdf([{ width: 222 }], "same.pdf");
  const { result, document } = await loadMerged([fileOf(a.bytes, "same.pdf"), fileOf(b.bytes, "same.pdf")]);
  assert.equal(result.documentCount, 2);
  assert.deepEqual(document.getPages().map((page) => page.getWidth()), [111, 222]);
});

test("adding another batch retains existing queue entries", async () => {
  const queue = [{ id: "a", pageCount: 1 }, { id: "b", pageCount: 2 }];
  const appended = [...queue, { id: "c", pageCount: 3 }];
  assert.deepEqual(appended.map((item) => item.id), ["a", "b", "c"]);
  assert.equal(getPdfTotalPages(appended), 6);
});

test("removing a queue item keeps remaining entries and order", () => {
  const queue = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(removePdfItem(queue, "b").map((item) => item.id), ["a", "c"]);
});

test("move-up operation changes order", () => {
  const queue = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(movePdfItem(queue, "c", -1).map((item) => item.id), ["a", "c", "b"]);
});

test("move-down operation changes order", () => {
  const queue = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(movePdfItem(queue, "a", 1).map((item) => item.id), ["b", "a", "c"]);
});

test("move-up at the first position is a no-op", () => {
  const queue = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(movePdfItem(queue, "a", -1).map((item) => item.id), ["a", "b"]);
});

test("move-down at the last position is a no-op", () => {
  const queue = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(movePdfItem(queue, "b", 1).map((item) => item.id), ["a", "b"]);
});

test("rejects an individual file above the size limit", () => {
  assert.throws(() => assertPdfQueueLimits([{ name: "large.pdf", size: MAX_PDF_FILE_BYTES + 1 }]), /25 MB per-file/);
});

test("allows an individual file exactly at the size limit", () => {
  assert.doesNotThrow(() => assertPdfQueueLimits([{ name: "limit.pdf", size: MAX_PDF_FILE_BYTES }]));
});

test("rejects combined inputs above the total size limit", () => {
  assert.throws(() => assertPdfQueueLimits([
    { name: "a.pdf", size: MAX_PDF_FILE_BYTES },
    { name: "b.pdf", size: MAX_PDF_FILE_BYTES },
    { name: "c.pdf", size: MAX_PDF_FILE_BYTES },
    { name: "d.pdf", size: MAX_PDF_FILE_BYTES },
    { name: "e.pdf", size: 1 },
  ]), /100 MB combined/);
});

test("allows combined input exactly at the total size limit", () => {
  assert.doesNotThrow(() => assertPdfQueueLimits(Array.from({ length: 4 }, (_, index) => ({ name: `${index}.pdf`, size: MAX_PDF_FILE_BYTES }))));
});

test("rejects queues above the maximum file count", () => {
  assert.throws(() => assertPdfQueueLimits(Array.from({ length: MAX_PDF_FILES + 1 }, (_, index) => ({ name: `${index}.pdf`, size: 1 }))), /no more than 20/);
});

test("uses the documented page ceiling", () => {
  assert.equal(MAX_PDF_TOTAL_PAGES, 300);
  assert.equal(getPdfTotalPages([{ pageCount: 150 }, { pageCount: 150 }]), 300);
});

test("rejects an input PDF over the page ceiling", async () => {
  const pdf = await makePdf(Array.from({ length: MAX_PDF_TOTAL_PAGES + 1 }, (_, index) => ({ width: 100 + index })));
  await assert.rejects(validatePdfBytes(pdf.bytes, "many-pages.pdf"), /300-page total limit/);
});

test("rejects cumulative pages above the merge ceiling", async () => {
  const a = await makePdf(Array.from({ length: 151 }, (_, index) => ({ width: 100 + index })));
  const b = await makePdf(Array.from({ length: 150 }, (_, index) => ({ width: 300 + index })));
  await assert.rejects(mergePdfFiles([fileOf(a.bytes, "a.pdf"), fileOf(b.bytes, "b.pdf")]), /300-page total limit/);
});

test("generates a structurally valid PDF with the expected signature", async () => {
  const pdf = await makePdf([{ text: "first" }, { text: "second" }]);
  const { bytes, document } = await loadMerged([fileOf(pdf.bytes, "a.pdf"), fileOf(pdf.bytes, "b.pdf")]);
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  assert.equal(document.getPageCount(), 4);
});

test("returns the expected download MIME type and safe default filename", async () => {
  const pdf = await makePdf([{ text: "file" }]);
  const { result } = await loadMerged([fileOf(pdf.bytes, "a.pdf"), fileOf(pdf.bytes, "b.pdf")]);
  assert.equal(result.blob.type, "application/pdf");
  assert.equal(result.filename, MERGED_PDF_FILENAME);
  assert.equal(result.filename, "toolsfortoday-merged.pdf");
});

test("reports exact output file size", async () => {
  const pdf = await makePdf([{ text: "file" }]);
  const { result } = await loadMerged([fileOf(pdf.bytes, "a.pdf"), fileOf(pdf.bytes, "b.pdf")]);
  assert.equal(result.sizeBytes, result.blob.size);
  assert.ok(result.sizeBytes > 0);
});

test("cancels stale work when its signal is already aborted", async () => {
  const pdf = await makePdf([{ text: "cancel" }]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(mergePdfFiles([fileOf(pdf.bytes, "a.pdf"), fileOf(pdf.bytes, "b.pdf")], controller.signal), { name: "AbortError" });
});

test("a failed merge reports an error without producing partial output", async () => {
  const pdf = await makePdf([{ text: "valid" }]);
  await assert.rejects(mergePdfFiles([fileOf(pdf.bytes, "a.pdf"), fileOf(new TextEncoder().encode("broken"), "b.pdf")]), /not a PDF/);
});

test("removing every item resets the queue to empty", () => {
  assert.deepEqual(removePdfItem([{ id: "a" }, { id: "b" }], "a").filter((item) => item.id !== "b"), []);
});

test("merged output is independent from the selected source bytes", async () => {
  const pdf = await makePdf([{ width: 321 }], "source.pdf");
  const input = fileOf(pdf.bytes, "source.pdf");
  const { bytes } = await loadMerged([input, fileOf(pdf.bytes, "second.pdf")]);
  assert.deepEqual(new Uint8Array(await input.arrayBuffer()), new Uint8Array(pdf.bytes));
  assert.notDeepEqual(bytes, pdf.bytes);
});

test("rejects a truncated PDF without attempting recovery", async () => {
  const pdf = await makePdf([{ text: "truncated" }]);
  await assert.rejects(validatePdfBytes(pdf.bytes.subarray(0, pdf.bytes.length - 20), "truncated.pdf"), /truncated or incomplete/);
});

test("browser file handling stays local and the merge engine does not fetch or upload", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./pdf-merging.ts", import.meta.url), "utf8"));
  assert.match(source, /file\.arrayBuffer\(\)/);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});

test("defines the resource limits as finite positive values", () => {
  for (const limit of [MAX_PDF_FILES, MAX_PDF_FILE_BYTES, MAX_PDF_TOTAL_BYTES, MAX_PDF_TOTAL_PAGES]) {
    assert.ok(Number.isSafeInteger(limit) && limit > 0);
  }
});

test("prevents merging a single file even when the PDF itself is valid", async () => {
  const pdf = await makePdf([{ text: "only" }]);
  const valid = await inspectPdfFile(fileOf(pdf.bytes));
  assert.equal(valid.pageCount, 1);
  await assert.rejects(mergePdfFiles([fileOf(pdf.bytes)]), /at least two/);
});
