import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import {
  applyCropRatio,
  calculateLockedSize,
  clampCropRect,
  cropFromDisplay,
  outputFilename,
  outputMime,
  moveCrop,
  validateCrop,
  validateProcessingMemory,
  validateOutputSize,
  WIDTH_PRESETS,
  CROP_RATIOS,
} from "./image-resizing.ts";
import {
  parseImageFileHeader,
  validateImageFileMetadata,
} from "./image-compression.ts";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

function makePng(width = 8, height = 6) {
  const png = new PNG({ width, height, colorType: 6 });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (width * y + x) * 4;
      png.data[offset] = x * 20;
      png.data[offset + 1] = y * 25;
      png.data[offset + 2] = 90;
      png.data[offset + 3] = (x + y) % 2 ? 255 : 0;
    }
  }
  return PNG.sync.write(png);
}

const fixture = makePng();

test("generated PNG fixture contains real pixel rows and alpha", () => {
  const decoded = PNG.sync.read(fixture);
  assert.equal(decoded.width, 8);
  assert.equal(decoded.height, 6);
  assert.equal(decoded.data[(2 * 8 + 3) * 4], 60);
  assert.equal(decoded.data[(2 * 8 + 3) * 4 + 3], 255);
});

test("real generated PNG header passes format validation", () => {
  const header = parseImageFileHeader({ name: "pattern.png", type: "image/png" }, new Uint8Array(fixture));
  assert.deepEqual(header, { format: "png", width: 8, height: 6, animated: false });
  assert.equal(validateImageFileMetadata({ name: "pattern.png", type: "image/png", size: fixture.length }, header).width, 8);
});

test("wrong extension is rejected for real PNG bytes", () => {
  const header = parseImageFileHeader({ name: "pattern.jpg", type: "image/jpeg" }, new Uint8Array(fixture));
  assert.throws(() => validateImageFileMetadata({ name: "pattern.jpg", type: "image/jpeg", size: fixture.length }, header), /extension does not match/);
});

test("unsupported SVG bytes are rejected", () => {
  assert.throws(() => parseImageFileHeader({ name: "image.svg", type: "image/svg+xml" }, new TextEncoder().encode("<svg/>")), /Choose a JPEG, PNG, or WebP/);
});

test("truncated PNG is rejected as corrupt", () => {
  assert.throws(() => parseImageFileHeader({ name: "broken.png", type: "image/png" }, new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), /incomplete or damaged/);
});

test("zero-byte image metadata is rejected", () => {
  assert.throws(() => validateImageFileMetadata({ name: "empty.png", type: "image/png", size: 0 }, { format: "png", width: 1, height: 1, animated: false }), /empty/);
});

test("file size at limit is accepted", () => {
  const file = { name: "image.png", type: "image/png", size: 100 };
  assert.equal(validateImageFileMetadata(file, { format: "png", width: 1, height: 1, animated: false }, 100).width, 1);
});

test("file size above limit is rejected", () => {
  assert.throws(() => validateImageFileMetadata({ name: "image.png", type: "image/png", size: 101 }, { format: "png", width: 1, height: 1, animated: false }, 100), /no larger/);
});

test("decoded pixel limit is enforced", () => {
  assert.throws(() => validateImageFileMetadata({ name: "large.png", type: "image/png", size: 1 }, { format: "png", width: 11, height: 10, animated: false }, 100, 100), /pixel limit/);
});

test("animated image metadata is rejected", () => {
  assert.throws(() => validateImageFileMetadata({ name: "animated.png", type: "image/png", size: 1 }, { format: "png", width: 1, height: 1, animated: true }), /Animated images are not supported/);
});

for (const [width, height] of [[1, 1], [512, 384], [1920, 1080], [8000, 1], [1, 8000]]) {
  test(`accepts safe output dimensions ${width}x${height}`, () => assert.deepEqual(validateOutputSize(width, height), { width, height }));
}

for (const [width, height] of [[0, 10], [-1, 10], [10, 0], [1.5, 8], [8, 2.2], [NaN, 3], [Infinity, 1]]) {
  test(`rejects invalid output dimensions ${width}x${height}`, () => assert.throws(() => validateOutputSize(width, height), /positive whole-number/));
}

test("rejects output dimensions beyond the per-side limit", () => assert.throws(() => validateOutputSize(8001, 1), /8,000/));
test("rejects output dimensions beyond the total pixel budget", () => assert.throws(() => validateOutputSize(5001, 5000), /total pixels/));
test("processing memory estimator accepts a small source and output", () => assert.doesNotThrow(() => validateProcessingMemory(100, 100, 200, 200)));
test("processing memory estimator rejects unsafe combined source and output sizes", () => assert.throws(() => validateProcessingMemory(5000, 5000, 5000, 5000), /too much browser memory/));
test("processing memory estimator rejects invalid dimensions", () => assert.throws(() => validateProcessingMemory(10, 10, 0, 10), /positive whole-number/));

test("locked width calculates rounded height from crop ratio", () => assert.deepEqual(calculateLockedSize("width", 100, 4 / 3), { width: 100, height: 75 }));
test("locked height calculates rounded width from crop ratio", () => assert.deepEqual(calculateLockedSize("height", 100, 4 / 3), { width: 133, height: 100 }));
test("locked aspect ratio prevents zero dimensions", () => assert.deepEqual(calculateLockedSize("width", 1, 1000), { width: 1, height: 1 }));
test("invalid locked ratio returns safe empty dimensions", () => assert.deepEqual(calculateLockedSize("width", 100, 0), { width: 0, height: 0 }));
test("width presets are the requested practical values", () => assert.deepEqual(WIDTH_PRESETS, [512, 1024, 1080, 1920]));
test("crop ratios include all required preset choices", () => assert.deepEqual(CROP_RATIOS, ["free", "1:1", "4:3", "3:4", "16:9", "9:16"]));

test("free crop ratio preserves its rectangle", () => assert.deepEqual(applyCropRatio({ x: 2, y: 2, width: 6, height: 3 }, "free", 10, 10), { x: 2, y: 2, width: 6, height: 3 }));
test("square ratio produces a square crop", () => assert.deepEqual(applyCropRatio({ x: 0, y: 0, width: 6, height: 5 }, "1:1", 10, 10), { x: 0, y: 0, width: 5, height: 5 }));
test("landscape 4:3 ratio is applied within selection", () => assert.deepEqual(applyCropRatio({ x: 1, y: 2, width: 8, height: 6 }, "4:3", 12, 10), { x: 1, y: 2, width: 8, height: 6 }));
test("landscape 16:9 ratio is applied within selection", () => assert.equal(Math.round((applyCropRatio({ x: 2, y: 2, width: 16, height: 9 }, "16:9", 20, 15).width / applyCropRatio({ x: 2, y: 2, width: 16, height: 9 }, "16:9", 20, 15).height) * 100), 178));
test("portrait 3:4 ratio is applied", () => assert.equal(Math.round(applyCropRatio({ x: 1, y: 1, width: 6, height: 8 }, "3:4", 10, 10).width / applyCropRatio({ x: 1, y: 1, width: 6, height: 8 }, "3:4", 10, 10).height * 100), 75));
test("portrait 9:16 ratio is applied", () => assert.equal(Math.round(applyCropRatio({ x: 1, y: 1, width: 9, height: 16 }, "9:16", 12, 20).width / applyCropRatio({ x: 1, y: 1, width: 9, height: 16 }, "9:16", 12, 20).height * 100), 56));

test("crop display coordinates scale to source pixels", () => assert.deepEqual(cropFromDisplay(10, 5, 30, 25, 40, 30, 80, 60), { x: 20, y: 10, width: 40, height: 40 }));
test("crop display coordinates clamp at displayed image edges", () => assert.deepEqual(cropFromDisplay(30, 20, 50, 40, 40, 30, 80, 60), { x: 60, y: 40, width: 20, height: 20 }));
test("landscape preview maps accurately to higher-density source", () => assert.deepEqual(cropFromDisplay(25, 10, 75, 40, 100, 50, 2000, 1000), { x: 500, y: 200, width: 1000, height: 600 }));
test("portrait preview maps accurately to source pixels", () => assert.deepEqual(cropFromDisplay(10, 25, 30, 75, 40, 100, 400, 1000), { x: 100, y: 250, width: 200, height: 500 }));
test("invalid display dimensions reject crop conversion", () => assert.throws(() => cropFromDisplay(1, 1, 2, 2, 0, 10, 10, 10), /dimensions are not available/));

test("crop rectangles clamp negative origin", () => assert.deepEqual(clampCropRect({ x: -3, y: -2, width: 5, height: 5 }, 10, 10), { x: 0, y: 0, width: 2, height: 3 }));
test("crop rectangles clamp right and bottom edges", () => assert.deepEqual(clampCropRect({ x: 8, y: 7, width: 5, height: 5 }, 10, 10), { x: 8, y: 7, width: 2, height: 3 }));
test("crop rectangles preserve a one-pixel region", () => assert.deepEqual(clampCropRect({ x: 9, y: 9, width: 1, height: 1 }, 10, 10), { x: 9, y: 9, width: 1, height: 1 }));
test("empty crop rectangles are rejected", () => assert.throws(() => clampCropRect({ x: 1, y: 1, width: 0, height: 1 }, 10, 10), /Select a crop area/));
test("invalid crop coordinates are rejected", () => assert.throws(() => validateCrop({ x: -1, y: 0, width: 2, height: 2 }, 10, 10), /stay within/));
test("crop exceeding right source edge is rejected", () => assert.throws(() => validateCrop({ x: 9, y: 0, width: 2, height: 2 }, 10, 10), /stay within/));
test("crop exceeding bottom source edge is rejected", () => assert.throws(() => validateCrop({ x: 0, y: 9, width: 2, height: 2 }, 10, 10), /stay within/));
test("valid fractional crop is rounded deterministically", () => assert.deepEqual(validateCrop({ x: 1.4, y: 2.6, width: 3.2, height: 4.3 }, 10, 10), { x: 1, y: 3, width: 3, height: 4 }));
test("crop reposition stays within right boundary", () => assert.deepEqual(moveCrop({ x: 5, y: 3, width: 4, height: 3 }, 9, 0, 10, 10), { x: 6, y: 3, width: 4, height: 3 }));
test("crop reposition stays within bottom boundary", () => assert.deepEqual(moveCrop({ x: 3, y: 5, width: 4, height: 4 }, 0, 9, 10, 10), { x: 3, y: 6, width: 4, height: 4 }));
test("crop reposition supports negative movement", () => assert.deepEqual(moveCrop({ x: 4, y: 4, width: 3, height: 3 }, -2, -3, 10, 10), { x: 2, y: 1, width: 3, height: 3 }));

test("JPEG output MIME is exact", () => assert.equal(outputMime("jpeg"), "image/jpeg"));
test("PNG output MIME is exact", () => assert.equal(outputMime("png"), "image/png"));
test("WebP output MIME is exact", () => assert.equal(outputMime("webp"), "image/webp"));
test("JPEG output uses JPG file extension", () => assert.equal(outputFilename("photo.jpeg", "jpeg"), "photo-resized-cropped.jpg"));
test("PNG output uses PNG file extension", () => assert.equal(outputFilename("holiday photo.png", "png"), "holiday-photo-resized-cropped.png"));
test("WebP output uses WebP extension", () => assert.equal(outputFilename("image.webp", "webp"), "image-resized-cropped.webp"));
test("unsafe filename characters are removed", () => assert.equal(outputFilename("../../my private image.png", "png"), "my-private-image-resized-cropped.png"));
test("empty filename receives a safe fallback", () => assert.equal(outputFilename(".png", "png"), "image-resized-cropped.png"));
