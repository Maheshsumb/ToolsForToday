import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import {
  convertImageFile,
  DEFAULT_CONVERSION_BACKGROUND,
  getConversionSizeOutcome,
  getConvertedFilename,
  supportsConversionQuality,
} from "./image-conversion.ts";
import { MAX_IMAGE_FILE_SIZE_BYTES, MAX_IMAGE_PIXELS, formatImageFileSize, parseImageFileHeader, validateImageFileMetadata } from "./image-compression.ts";

const originalGlobals = new Map();
let canvasOptions;
let fillCalls;
let drawCalls;
let requestedMime;
let requestedQuality;
let requestedOutput = "webp";
let encodedBlob = null;
let bitmapClosed = false;
let activeContext;

function pngBytes(width = 3, height = 2) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

function jpegBytes(width = 3, height = 2) {
  const bytes = new Uint8Array(21);
  bytes.set([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8]);
  new DataView(bytes.buffer).setUint16(7, height, false);
  new DataView(bytes.buffer).setUint16(9, width, false);
  return bytes;
}

function webpBytes(width = 3, height = 2) {
  const bytes = new Uint8Array(26);
  bytes.set([82, 73, 70, 70]);
  bytes.set([87, 69, 66, 80], 8);
  bytes.set([86, 80, 56, 76, 5, 0, 0, 0, 47, width - 1, 0, 0, height - 1], 12);
  return bytes;
}

function signature(format) {
  if (format === "jpeg") return [0xff, 0xd8, 0xff, 0xe0];
  if (format === "png") return [137, 80, 78, 71, 13, 10, 26, 10];
  return [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80];
}

function fakeFile(format, overrides = {}) {
  const data = format === "jpeg" ? jpegBytes() : format === "png" ? pngBytes() : webpBytes();
  const names = { jpeg: "photo.jpg", png: "photo.png", webp: "photo.webp" };
  const types = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  return {
    name: names[format],
    type: types[format],
    size: data.length,
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    ...overrides,
  };
}

function installGlobals() {
  for (const key of ["document", "createImageBitmap"]) originalGlobals.set(key, globalThis[key]);
  globalThis.document = {
    createElement: (tag) => {
      assert.equal(tag, "canvas");
      return {
        width: 0,
        height: 0,
        getContext: (_kind, options) => {
          canvasOptions = options;
          activeContext = {
            fillStyle: "",
            fillRect: (...args) => fillCalls.push(args),
            drawImage: (...args) => drawCalls.push(args),
          };
          return activeContext;
        },
        toBlob: (callback, mime, quality) => {
          requestedMime = mime;
          requestedQuality = quality;
          const output = encodedBlob ?? new Blob([new Uint8Array(signature(requestedOutput))], { type: requestedMime });
          callback(output);
        },
      };
    },
  };
  globalThis.createImageBitmap = async () => ({
    width: 4,
    height: 3,
    close: () => { bitmapClosed = true; },
  });
}

beforeEach(() => {
  canvasOptions = undefined;
  fillCalls = [];
  drawCalls = [];
  requestedMime = undefined;
  requestedQuality = undefined;
  requestedOutput = "webp";
  encodedBlob = null;
  bitmapClosed = false;
  activeContext = null;
  installGlobals();
});

afterEach(() => {
  for (const [key, value] of originalGlobals) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
  originalGlobals.clear();
});

test("valid JPEG bytes are detected from content", () => assert.equal(parseImageFileHeader(fakeFile("jpeg"), jpegBytes()).format, "jpeg"));
test("valid PNG bytes are detected from content", () => assert.equal(parseImageFileHeader(fakeFile("png"), pngBytes()).format, "png"));
test("valid WebP bytes are detected from content", () => assert.equal(parseImageFileHeader(fakeFile("webp"), webpBytes()).format, "webp"));
test("unsupported file formats are rejected", () => assert.throws(() => parseImageFileHeader({ name: "vector.svg", type: "image/svg+xml" }, new TextEncoder().encode("<svg/>")), /Choose a JPEG, PNG, or WebP/));
test("empty image files are rejected before decoding", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg", { size: 0 }), "png"), /selected file is empty/));
test("corrupt files with supported names are rejected", () => assert.throws(() => parseImageFileHeader({ name: "bad.jpg", type: "image/jpeg" }, new Uint8Array([1, 2, 3])), /supported image name/));
test("input file size limit is enforced before reading", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg", { size: MAX_IMAGE_FILE_SIZE_BYTES + 1 }), "png"), /no larger than/));
test("decoded pixel limit is enforced from image dimensions", () => assert.throws(() => validateImageFileMetadata(fakeFile("png"), parseImageFileHeader(fakeFile("png"), pngBytes(5001, 5000)), MAX_IMAGE_FILE_SIZE_BYTES, MAX_IMAGE_PIXELS), /pixel limit/));

for (const [input, output] of [["jpeg", "png"], ["jpeg", "webp"], ["png", "jpeg"], ["png", "webp"], ["webp", "jpeg"], ["webp", "png"]]) {
  test(`${input.toUpperCase()} to ${output.toUpperCase()} encodes the requested output`, async () => {
    requestedOutput = output;
    const result = await convertImageFile(fakeFile(input), output);
    assert.equal(result.format, output);
    assert.equal(result.blob.type, `image/${output}`);
    assert.equal(requestedMime, `image/${output}`);
    assert.deepEqual(drawCalls[0].slice(1), [0, 0]);
  });
}

test("unsupported output formats are rejected", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg"), "gif"), /Choose JPG, PNG, or WebP/));
test("same-format output is rejected rather than mislabeled as conversion", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg"), "jpeg"), /Same-format re-encoding is not offered/));
test("a PNG fallback is not mislabeled as WebP", async () => {
  encodedBlob = new Blob([new Uint8Array(signature("png"))], { type: "image/png" });
  await assert.rejects(() => convertImageFile(fakeFile("jpeg"), "webp"), /cannot export WebP/);
});
test("effective decoded dimensions are preserved", async () => {
  requestedOutput = "png";
  const result = await convertImageFile(fakeFile("jpeg"), "png");
  assert.deepEqual([result.width, result.height], [4, 3]);
});
test("PNG output requests an alpha-enabled canvas", async () => {
  requestedOutput = "png";
  await convertImageFile(fakeFile("jpeg"), "png");
  assert.equal(canvasOptions.alpha, true);
});
test("WebP output requests an alpha-enabled canvas", async () => {
  await convertImageFile(fakeFile("png"), "webp");
  assert.equal(canvasOptions.alpha, true);
});
test("transparent PNG to JPEG fills the default white background", async () => {
  requestedOutput = "jpeg";
  await convertImageFile(fakeFile("png"), "jpeg");
  assert.equal(canvasOptions.alpha, false);
  assert.equal(fillCalls.length, 1);
  assert.deepEqual(fillCalls[0], [0, 0, 4, 3]);
  assert.equal(activeContext.fillStyle, "#FFFFFF");
  assert.equal(DEFAULT_CONVERSION_BACKGROUND, "#FFFFFF");
});
test("custom JPEG background color is applied", async () => {
  const context = { fillStyle: "", fillRect() {}, drawImage() {} };
  globalThis.document.createElement = () => ({ width: 0, height: 0, getContext: () => context, toBlob: (callback, mime) => callback(new Blob([new Uint8Array(signature("jpeg"))], { type: mime })) });
  await convertImageFile(fakeFile("webp"), "jpeg", 80, "#12ABEF");
  assert.equal(context.fillStyle, "#12ABEF");
});
test("JPEG quality slider value is passed to the encoder", async () => {
  requestedOutput = "jpeg";
  await convertImageFile(fakeFile("png"), "jpeg", 65);
  assert.equal(requestedQuality, 0.65);
});
test("WebP quality slider value is passed to the encoder", async () => {
  await convertImageFile(fakeFile("jpeg"), "webp", 90);
  assert.equal(requestedQuality, 0.9);
});
test("PNG does not use the JPEG/WebP quality parameter", async () => {
  requestedOutput = "png";
  await convertImageFile(fakeFile("jpeg"), "png", 10);
  assert.equal(requestedQuality, undefined);
  assert.equal(supportsConversionQuality("png"), false);
});
test("result size formatting reports measured bytes", () => assert.equal(formatImageFileSize(2048), "2.00 KB"));
test("increased output size is reported as larger", () => assert.equal(getConversionSizeOutcome(10, 11), "larger"));
test("reduced output size is reported as smaller", () => assert.equal(getConversionSizeOutcome(11, 10), "smaller"));
test("equal output size is reported as equal", () => assert.equal(getConversionSizeOutcome(10, 10), "equal"));
test("converted JPEG uses the correct file extension", () => assert.equal(getConvertedFilename("photo.png", "jpeg"), "photo-converted.jpg"));
test("converted WebP uses the correct file extension", () => assert.equal(getConvertedFilename("photo.jpg", "webp"), "photo-converted.webp"));
test("converted PNG uses the correct file extension", () => assert.equal(getConvertedFilename("photo.webp", "png"), "photo-converted.png"));
test("filenames remove path traversal and unsafe characters", () => assert.equal(getConvertedFilename("../../private photo?.png", "png"), "private-photo-converted.png"));
test("animated PNG input is rejected", async () => {
  const bytes = pngBytes();
  const animated = new Uint8Array(45);
  animated.set(bytes);
  animated.set([0, 0, 0, 0, 97, 99, 84, 76], 33);
  new DataView(animated.buffer).setUint32(41, 0, false);
  await assert.rejects(() => convertImageFile(fakeFile("png", { arrayBuffer: async () => animated.buffer, size: animated.length }), "jpeg"), /Animated images are not supported/);
});
test("file extension and actual content mismatches are rejected", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg", { name: "image.png" }), "webp"), /extension does not match/));
test("browser decoding failure is reported", async () => {
  globalThis.createImageBitmap = async () => { throw new Error("bad image"); };
  await assert.rejects(() => convertImageFile(fakeFile("jpeg"), "png"), /corrupt or cannot be decoded/);
});
test("browser encoding failure is reported", async () => {
  globalThis.document.createElement = () => ({ width: 0, height: 0, getContext: () => ({ fillStyle: "", fillRect() {}, drawImage() {} }), toBlob: (callback) => callback(null) });
  await assert.rejects(() => convertImageFile(fakeFile("jpeg"), "webp"), /could not encode/);
});
test("ImageBitmap is released after a successful conversion", async () => {
  requestedOutput = "png";
  await convertImageFile(fakeFile("jpeg"), "png");
  assert.equal(bitmapClosed, true);
});
test("ImageBitmap is released after a conversion error", async () => {
  globalThis.document.createElement = () => ({ width: 0, height: 0, getContext: () => null });
  await assert.rejects(() => convertImageFile(fakeFile("jpeg"), "png"), /could not create an image canvas/);
  assert.equal(bitmapClosed, true);
});
test("conversion size estimate is checked before canvas allocation", async () => {
  globalThis.createImageBitmap = async () => ({ width: 9000, height: 9000, close: () => { bitmapClosed = true; } });
  let canvasCreated = false;
  globalThis.document.createElement = () => { canvasCreated = true; throw new Error("canvas should not be allocated"); };
  await assert.rejects(() => convertImageFile(fakeFile("jpeg"), "png"), /pixel limit/);
  assert.equal(canvasCreated, false);
});
test("non-JPEG background values are rejected for JPEG output", async () => assert.rejects(() => convertImageFile(fakeFile("png"), "jpeg", 80, "url(javascript:alert(1))"), /valid six-digit background/));
test("non-finite and out-of-range quality values are rejected", async () => assert.rejects(() => convertImageFile(fakeFile("jpeg"), "webp", Number.NaN), /quality between 10% and 100%/));
