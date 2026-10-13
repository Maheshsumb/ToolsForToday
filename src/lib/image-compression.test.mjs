import assert from "node:assert/strict";
import test from "node:test";
import { PNG } from "pngjs";
import {
  DEFAULT_IMAGE_QUALITY,
  ImageProcessingError,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_QUALITY,
  MIN_IMAGE_QUALITY,
  formatImageFileSize,
  getCompressedFilename,
  getCompressionMetrics,
  getImageFormatLabel,
  getImageMimeType,
  isImageQualityValid,
  parseImageFileHeader,
  parseImageHeader,
  qualityToCanvasValue,
  validateImageFileMetadata,
} from "./image-compression.ts";

function pngFixture(width = 2, height = 3) {
  const image = new PNG({ width, height });
  image.data.fill(255);
  return PNG.sync.write(image);
}

function jpegHeader(width = 32, height = 16) {
  return Uint8Array.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
  ]);
}

function webpExtendedHeader(width = 64, height = 48, flags = 0) {
  const bytes = new Uint8Array(30);
  bytes.set([...Buffer.from("RIFF")], 0);
  new DataView(bytes.buffer).setUint32(4, 22, true);
  bytes.set([...Buffer.from("WEBPVP8X")], 8);
  new DataView(bytes.buffer).setUint32(16, 10, true);
  bytes[20] = flags;
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes[24] = widthMinusOne & 0xff;
  bytes[25] = (widthMinusOne >> 8) & 0xff;
  bytes[26] = (widthMinusOne >> 16) & 0xff;
  bytes[27] = heightMinusOne & 0xff;
  bytes[28] = (heightMinusOne >> 8) & 0xff;
  bytes[29] = (heightMinusOne >> 16) & 0xff;
  return bytes;
}

function webpLosslessHeader(width = 12, height = 6) {
  const bytes = new Uint8Array(26);
  bytes.set([...Buffer.from("RIFF")], 0);
  new DataView(bytes.buffer).setUint32(4, 18, true);
  bytes.set([...Buffer.from("WEBPVP8L")], 8);
  new DataView(bytes.buffer).setUint32(16, 5, true);
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes[20] = 0x2f;
  bytes[21] = widthMinusOne & 0xff;
  bytes[22] = ((widthMinusOne >> 8) & 0x3f) | ((heightMinusOne & 0x03) << 6);
  bytes[23] = (heightMinusOne >> 2) & 0xff;
  bytes[24] = (heightMinusOne >> 10) & 0x0f;
  return bytes;
}

function webpLossyHeader(width = 16, height = 32) {
  const bytes = new Uint8Array(30);
  bytes.set([...Buffer.from("RIFF")], 0);
  new DataView(bytes.buffer).setUint32(4, 22, true);
  bytes.set([...Buffer.from("WEBPVP8 ")], 8);
  new DataView(bytes.buffer).setUint32(16, 10, true);
  bytes[23] = 0x9d;
  bytes[24] = 0x01;
  bytes[25] = 0x2a;
  new DataView(bytes.buffer).setUint16(26, width, true);
  new DataView(bytes.buffer).setUint16(28, height, true);
  return bytes;
}

function metadata(name, size, type) {
  return { name, size, type };
}

test("recognizes actual PNG, JPEG, and WebP headers and reads dimensions", () => {
  assert.deepEqual(parseImageHeader(pngFixture()), { format: "png", width: 2, height: 3, animated: false });
  assert.deepEqual(parseImageHeader(jpegHeader()), { format: "jpeg", width: 32, height: 16, animated: false });
  assert.deepEqual(parseImageHeader(webpExtendedHeader()), { format: "webp", width: 64, height: 48, animated: false });
});

test("reads lossy and lossless WebP frame dimensions, including compact files", () => {
  assert.deepEqual(parseImageHeader(webpLossyHeader()), { format: "webp", width: 16, height: 32, animated: false });
  assert.deepEqual(parseImageHeader(webpLosslessHeader()), { format: "webp", width: 12, height: 6, animated: false });
});

test("accepts supported extensions and matching reported MIME types", () => {
  const png = parseImageHeader(pngFixture());
  assert.equal(validateImageFileMetadata(metadata("sample.png", 128, "image/png"), png).format, "png");
  assert.equal(validateImageFileMetadata(metadata("photo.jpeg", 128, "image/jpeg"), parseImageHeader(jpegHeader())).format, "jpeg");
  assert.equal(validateImageFileMetadata(metadata("graphic.webp", 128, "image/webp"), parseImageHeader(webpExtendedHeader())).format, "webp");
});

test("allows browsers that report a generic MIME when the extension and bytes agree", () => {
  const header = parseImageHeader(pngFixture());
  assert.equal(validateImageFileMetadata(metadata("sample.png", 128, "application/octet-stream"), header).format, "png");
  assert.equal(validateImageFileMetadata(metadata("sample.png", 128, ""), header).format, "png");
});

test("rejects empty files, unsupported extensions, and format/extension mismatches", () => {
  const png = parseImageHeader(pngFixture());
  assert.throws(() => validateImageFileMetadata(metadata("empty.png", 0, "image/png"), png), { code: "empty" });
  assert.throws(() => validateImageFileMetadata(metadata("photo.gif", 100, "image/gif"), png), { code: "unsupported-type" });
  assert.throws(() => validateImageFileMetadata(metadata("photo.jpg", 100, "image/png"), png), { code: "format-mismatch" });
  assert.throws(() => validateImageFileMetadata(metadata("photo.png", 100, "image/jpeg"), png), { code: "format-mismatch" });
});

test("rejects unrecognized and truncated image contents even with a supported extension", () => {
  assert.throws(() => parseImageHeader(new Uint8Array([1, 2, 3, 4])), { code: "unsupported-type" });
  assert.throws(() => parseImageHeader(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), { code: "corrupt" });
  assert.throws(() => parseImageHeader(Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0, 1])), { code: "corrupt" });
  assert.throws(() => parseImageFileHeader(metadata("damaged.jpg", 100, "image/jpeg"), new Uint8Array([0, 1, 2])), { code: "corrupt" });
});

test("rejects files above the compressed input limit", () => {
  const png = parseImageHeader(pngFixture());
  assert.throws(
    () => validateImageFileMetadata(metadata("large.png", MAX_IMAGE_FILE_SIZE_BYTES + 1, "image/png"), png),
    { code: "too-large" },
  );
});

test("rejects decoded dimensions above the pixel limit before canvas allocation", () => {
  const png = parseImageHeader(pngFixture(5001, 5000));
  assert.equal(png.width * png.height, 25_005_000);
  assert.throws(() => validateImageFileMetadata(metadata("huge.png", 128, "image/png"), png), { code: "too-many-pixels" });
  assert.equal(MAX_IMAGE_PIXELS, 25_000_000);
});

test("rejects animated PNG and WebP instead of silently flattening animation", () => {
  const png = pngFixture();
  const ihdrEnd = 8 + 12 + 13;
  const actl = Buffer.alloc(20);
  actl.writeUInt32BE(8, 0);
  actl.write("acTL", 4, "ascii");
  actl.writeUInt32BE(2, 8);
  const animatedPng = Buffer.concat([png.subarray(0, ihdrEnd), actl, png.subarray(ihdrEnd)]);
  assert.throws(() => validateImageFileMetadata(metadata("animated.png", animatedPng.length, "image/png"), parseImageHeader(animatedPng)), { code: "animated" });
  assert.throws(() => validateImageFileMetadata(metadata("animated.webp", 30, "image/webp"), parseImageHeader(webpExtendedHeader(64, 48, 0x02))), { code: "animated" });
});

test("enforces quality bounds and converts percent quality without altering PNG semantics", () => {
  assert.equal(DEFAULT_IMAGE_QUALITY, 80);
  assert.equal(isImageQualityValid(MIN_IMAGE_QUALITY), true);
  assert.equal(isImageQualityValid(MAX_IMAGE_QUALITY), true);
  assert.equal(isImageQualityValid(9), false);
  assert.equal(isImageQualityValid(101), false);
  assert.equal(isImageQualityValid(Number.NaN), false);
  assert.equal(qualityToCanvasValue(80), 0.8);
  assert.throws(() => qualityToCanvasValue(0), { code: "quality-range" });
});

test("calculates reductions, equal sizes, and increases from measured byte counts", () => {
  assert.deepEqual(getCompressionMetrics(1000, 500), { differenceBytes: 500, percentage: 50, outcome: "reduced" });
  assert.deepEqual(getCompressionMetrics(1000, 1000), { differenceBytes: 0, percentage: 0, outcome: "same" });
  assert.deepEqual(getCompressionMetrics(1000, 1250), { differenceBytes: -250, percentage: 25, outcome: "larger" });
  assert.deepEqual(getCompressionMetrics(0, 0), { differenceBytes: 0, percentage: 0, outcome: "same" });
  assert.deepEqual(getCompressionMetrics(Number.NaN, Number.POSITIVE_INFINITY), { differenceBytes: 0, percentage: 0, outcome: "same" });
});

test("formats sizes consistently without NaN or Infinity", () => {
  assert.equal(formatImageFileSize(0), "0.00 KB");
  assert.equal(formatImageFileSize(1024), "1.00 KB");
  assert.equal(formatImageFileSize(1024 * 1024), "1.00 MB");
  assert.equal(formatImageFileSize(Number.NaN), "Size unavailable");
  assert.equal(formatImageFileSize(Number.POSITIVE_INFINITY), "Size unavailable");
});

test("creates safe filenames with an extension matching the real output format", () => {
  assert.equal(getCompressedFilename("C:\\private\\family photo.jpeg", "jpeg"), "family-photo-compressed.jpg");
  assert.equal(getCompressedFilename("../../<script>.webp", "webp"), "script-compressed.webp");
  assert.equal(getCompressedFilename("my.image.png", "png"), "my.image-compressed.png");
  assert.equal(getCompressedFilename(".png", "png"), "image-compressed.png");
});

test("reports explicit labels and output MIME types for supported formats", () => {
  assert.deepEqual(["jpeg", "png", "webp"].map(getImageFormatLabel), ["JPEG", "PNG", "WebP"]);
  assert.deepEqual(["jpeg", "png", "webp"].map(getImageMimeType), ["image/jpeg", "image/png", "image/webp"]);
});

test("format failures use a typed, readable processing error", () => {
  const error = new ImageProcessingError("encode-failed", "Could not encode.");
  assert.equal(error.name, "ImageProcessingError");
  assert.equal(error.code, "encode-failed");
  assert.equal(error.message, "Could not encode.");
});
