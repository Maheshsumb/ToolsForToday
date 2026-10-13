import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import { parseImageHeader, ImageProcessingError } from "./image-compression.ts";
import {
  assertImagesToPdfBatch,
  assertImagesToPdfPixels,
  calculateImagePlacement,
  createImagesPdf,
  getImagesPdfPageSize,
  IMAGES_TO_PDF_FILENAME,
  inspectImagesToPdfBytes,
  MAX_IMAGES_TO_PDF_COUNT,
  MAX_IMAGES_TO_PDF_FILE_BYTES,
  MAX_IMAGES_TO_PDF_OUTPUT_BYTES,
  MAX_IMAGES_TO_PDF_PIXELS,
  MAX_IMAGES_TO_PDF_TOTAL_PIXELS,
  readJpegExifOrientation,
} from "./images-to-pdf.ts";

const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAHUlEQVR4nGP8z8Dwn4GBgYGR4T8jiGYCEcgAQwAAiZQDBWtKtnsAAAAASUVORK5CYII=", "base64");
const jpegBytes = Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAADAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4W8ef8jXff9sv/RS0UUV/o14Yf8kPk3/YJh//AEzAw8RP+Swzb/sJr/8Ap2Z//9k=", "base64");
const webpBytes = Buffer.from("UklGRoAAAABXRUJQVlA4WAoAAAAQAAAAAwAAAgAAQUxQSA0AAAAA//8AAP//AAD//wAAAFZQOCBMAAAAUAMAnQEqBAADAADAEiWoAnS6AfgBRgPwArQD+AZQB+gAPtAA/vohl/+6NDCZ7bv9dE/ujQwme27/9aOf/Etqrakyuex0/P+d6nAAAA==", "base64");

function file(name, type, bytes, size = bytes.length) {
  return { name, type, size };
}

function orientJpeg(bytes, orientation) {
  const exif = Buffer.from([
    0x45,0x78,0x69,0x66,0,0, 0x49,0x49,0x2a,0,0x08,0,0,0,
    1,0, 0x12,0x01, 3,0, 1,0,0,0, orientation,0,0,0, 0,0,0,0,
  ]);
  const segment = Buffer.concat([Buffer.from([0xff,0xe1,(exif.length+2)>>8,(exif.length+2)&0xff]),exif]);
  return Buffer.concat([bytes.subarray(0,2),segment,bytes.subarray(2)]);
}

test("recognizes synthetic JPEG, PNG, and WebP file structures", () => {
  assert.deepEqual(parseImageHeader(new Uint8Array(jpegBytes)), { format: "jpeg", width: 4, height: 3, animated: false });
  assert.deepEqual(parseImageHeader(new Uint8Array(pngBytes)), { format: "png", width: 4, height: 3, animated: false });
  assert.deepEqual(parseImageHeader(new Uint8Array(webpBytes)), { format: "webp", width: 4, height: 3, animated: false });
});

test("accepts properly named and typed image bytes", () => {
  assert.equal(inspectImagesToPdfBytes(file("photo.jpg", "image/jpeg", jpegBytes), jpegBytes).format, "jpeg");
  assert.equal(inspectImagesToPdfBytes(file("transparent.png", "image/png", pngBytes), pngBytes).format, "png");
  assert.equal(inspectImagesToPdfBytes(file("photo.webp", "image/webp", webpBytes), webpBytes).format, "webp");
});

test("rejects empty, unsupported, corrupt, and mislabeled image files", () => {
  assert.throws(() => inspectImagesToPdfBytes(file("empty.png", "image/png", Buffer.alloc(0)), Buffer.alloc(0)), /empty/i);
  assert.throws(() => inspectImagesToPdfBytes(file("photo.gif", "image/gif", jpegBytes), jpegBytes), /\.jpg, \.jpeg, \.png, or \.webp/i);
  assert.throws(() => inspectImagesToPdfBytes(file("photo.png", "image/png", jpegBytes), jpegBytes), /extension does not match/i);
  assert.throws(() => inspectImagesToPdfBytes(file("photo.jpg", "image/jpeg", Buffer.from("not an image")), Buffer.from("not an image")), /corrupt|readable/i);
  assert.throws(() => parseImageHeader(Buffer.from("GIF89a")), (error) => error instanceof ImageProcessingError);
});

test("enforces per-image input size and decoded-pixel limits before conversion", () => {
  assert.throws(() => inspectImagesToPdfBytes(file("large.jpg", "image/jpeg", jpegBytes, MAX_IMAGES_TO_PDF_FILE_BYTES + 1), jpegBytes), /25 MB/i);
  const oversizedPng = Buffer.from(pngBytes);
  oversizedPng.writeUInt32BE(5001, 16);
  oversizedPng.writeUInt32BE(5000, 20);
  assert.throws(() => inspectImagesToPdfBytes(file("huge.png", "image/png", oversizedPng), oversizedPng), /25.megapixel|pixel limit/i);
  assert.equal(MAX_IMAGES_TO_PDF_PIXELS, 25_000_000);
});

test("enforces image count, file-size, combined-byte, and total-pixel limits", () => {
  const atLimit = Array.from({ length: MAX_IMAGES_TO_PDF_COUNT }, () => ({ size: 1 }));
  assert.doesNotThrow(() => assertImagesToPdfBatch(atLimit));
  assert.throws(() => assertImagesToPdfBatch([...atLimit, { size: 1 }]), /20 images/i);
  assert.throws(() => assertImagesToPdfBatch([{ size: MAX_IMAGES_TO_PDF_FILE_BYTES + 1 }]), /25 MB/i);
  assert.throws(() => assertImagesToPdfBatch(Array.from({ length: 4 }, () => ({ size: MAX_IMAGES_TO_PDF_FILE_BYTES })).concat({ size: 1 })), /100 MB/i);
  assert.equal(assertImagesToPdfPixels([MAX_IMAGES_TO_PDF_PIXELS]), undefined);
  assert.throws(() => assertImagesToPdfPixels([MAX_IMAGES_TO_PDF_PIXELS + 1]), /25 megapixels/i);
  assert.throws(() => assertImagesToPdfPixels([20_000_000, 20_000_001]), /40-megapixel/i);
  assert.equal(MAX_IMAGES_TO_PDF_OUTPUT_BYTES, 100 * 1024 * 1024);
  assert.equal(MAX_IMAGES_TO_PDF_TOTAL_PIXELS, 40_000_000);
});

test("reads EXIF orientation and rejects malformed orientation values", () => {
  assert.equal(readJpegExifOrientation(orientJpeg(jpegBytes, 6)), 6);
  assert.equal(readJpegExifOrientation(orientJpeg(jpegBytes, 1)), 1);
  assert.equal(readJpegExifOrientation(jpegBytes), null);
  assert.equal(readJpegExifOrientation(orientJpeg(jpegBytes, 9)), null);
});

test("calculates A4 portrait and landscape dimensions", () => {
  assert.deepEqual(getImagesPdfPageSize(400, 800, "a4", "auto"), { width: 595.28, height: 841.89 });
  assert.deepEqual(getImagesPdfPageSize(800, 400, "a4", "auto"), { width: 841.89, height: 595.28 });
});

test("calculates Letter portrait and landscape dimensions", () => {
  assert.deepEqual(getImagesPdfPageSize(400, 800, "letter", "portrait"), { width: 612, height: 792 });
  assert.deepEqual(getImagesPdfPageSize(400, 800, "letter", "landscape"), { width: 792, height: 612 });
});

test("auto page size uses the documented 72-points-per-96-pixels conversion", () => {
  assert.deepEqual(getImagesPdfPageSize(960, 480, "auto", "auto"), { width: 720, height: 360 });
  assert.deepEqual(getImagesPdfPageSize(480, 960, "auto", "portrait"), { width: 360, height: 720 });
});

test("auto orientation uses the image shape and fixed orientation can be selected", () => {
  assert.ok(getImagesPdfPageSize(1200, 800, "a4", "auto").width > getImagesPdfPageSize(1200, 800, "a4", "auto").height);
  assert.ok(getImagesPdfPageSize(1200, 800, "a4", "portrait").width < getImagesPdfPageSize(1200, 800, "a4", "portrait").height);
  assert.ok(getImagesPdfPageSize(800, 1200, "letter", "landscape").width > getImagesPdfPageSize(800, 1200, "letter", "landscape").height);
});

test("fits an image inside None, Small, and Medium margins without cropping", () => {
  const page = getImagesPdfPageSize(1600, 900, "letter", "landscape");
  const none = calculateImagePlacement(1600, 900, page.width, page.height, "none");
  const small = calculateImagePlacement(1600, 900, page.width, page.height, "small");
  const medium = calculateImagePlacement(1600, 900, page.width, page.height, "medium");
  assert.ok(none.width <= page.width && none.height <= page.height);
  assert.ok(small.width <= page.width - 36 && small.height <= page.height - 36);
  assert.ok(medium.width <= page.width - 72 && medium.height <= page.height - 72);
  assert.ok(Math.abs(none.width / none.height - 1600 / 900) < 1e-12);
  assert.ok(Math.abs(small.x - (page.width - small.width) / 2) < 1e-12);
  assert.ok(Math.abs(medium.y - (page.height - medium.height) / 2) < 1e-12);
});

test("rejects invalid image and page dimensions or unusable margins", () => {
  assert.throws(() => getImagesPdfPageSize(0, 10, "a4", "auto"), /positive numbers/i);
  assert.throws(() => calculateImagePlacement(10, 10, 50, 50, "medium"), /cannot fit/i);
});

test("creates a valid one-page PDF from a direct JPEG embed", async () => {
  const result = await createImagesPdf([{ name: "sample.jpg", format: "jpeg", width: 4, height: 3, bytes: new Uint8Array(jpegBytes) }], { pageSize: "a4", orientation: "auto", margin: "small" });
  const parsed = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
  assert.equal(result.filename, IMAGES_TO_PDF_FILENAME);
  assert.equal(result.blob.type, "application/pdf");
  assert.equal(result.pageCount, 1);
  assert.equal(result.imageCount, 1);
  assert.equal(parsed.getPageCount(), 1);
  assert.equal(result.pageSizes[0].width, 841.89);
});

test("creates a valid transparent PNG page and keeps alpha in the embedded image", async () => {
  const result = await createImagesPdf([{ name: "transparent.png", format: "png", width: 4, height: 3, bytes: new Uint8Array(pngBytes) }], { pageSize: "auto", orientation: "auto", margin: "none" });
  const parsed = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
  const imageNames = parsed.context.enumerateIndirectObjects().map(([ref, object]) => [ref, object]).filter(([, object]) => object?.constructor?.name === "PDFRawStream");
  assert.equal(parsed.getPageCount(), 1);
  assert.equal(result.pageSizes[0].width, 3);
  assert.ok(imageNames.length > 0);
});

test("creates multiple pages in image order and supports mixed page dimensions", async () => {
  const result = await createImagesPdf([
    { name: "first.jpg", format: "jpeg", width: 4, height: 3, bytes: new Uint8Array(jpegBytes) },
    { name: "second.png", format: "png", width: 3, height: 4, bytes: new Uint8Array(pngBytes) },
  ], { pageSize: "auto", orientation: "auto", margin: "none" });
  const parsed = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
  assert.equal(parsed.getPageCount(), 2);
  assert.deepEqual(result.pageSizes, [{ width: 3, height: 2.25 }, { width: 2.25, height: 3 }]);
  assert.deepEqual(parsed.getPages().map((page) => [page.getWidth(), page.getHeight()]), [[3, 2.25], [2.25, 3]]);
  assert.equal(result.pageCount, result.imageCount);
});

test("aborts before PDF output is exposed", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createImagesPdf([{ name: "sample.jpg", format: "jpeg", width: 4, height: 3, bytes: new Uint8Array(jpegBytes) }], { pageSize: "a4", orientation: "auto", margin: "none" }, controller.signal), /cancelled/i);
});

test("rejects an empty image list and a batch beyond the page limit", async () => {
  await assert.rejects(createImagesPdf([], { pageSize: "a4", orientation: "auto", margin: "none" }), /at least one/i);
  const tooMany = Array.from({ length: MAX_IMAGES_TO_PDF_COUNT + 1 }, () => ({ name: "x.jpg", format: "jpeg", width: 1, height: 1, bytes: new Uint8Array(jpegBytes) }));
  await assert.rejects(createImagesPdf(tooMany, { pageSize: "a4", orientation: "auto", margin: "none" }), /20 images/i);
});
