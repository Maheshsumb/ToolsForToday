import assert from "node:assert/strict";
import test from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import {
  DEFAULT_QR_OPTIONS,
  generateQrCodePngDataUrl,
  generateQrCodeSvg,
  getQrColorContrast,
  hasLowQrContrast,
  isValidQrColor,
  QR_CODE_SIZES,
  QR_ERROR_CORRECTION_LEVELS,
  validateQrInput,
} from "./qr-code.ts";

function decodePngDataUrl(dataUrl) {
  const image = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"));
  const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height, { inversionAttempts: "attemptBoth" });
  return { image, decoded };
}

test("rejects empty text and empty URL content", () => {
  assert.deepEqual(validateQrInput("", "text"), { ok: false, error: "empty" });
  assert.deepEqual(validateQrInput("", "url"), { ok: false, error: "empty" });
});

test("accepts ordinary text and preserves meaningful surrounding whitespace", () => {
  const input = "  hello QR  ";
  assert.deepEqual(validateQrInput(input, "text"), { ok: true, content: input });
});

test("accepts complete HTTPS URLs and preserves their exact spelling", () => {
  const input = "https://example.com/a?b=2#part";
  assert.deepEqual(validateQrInput(input, "url"), { ok: true, content: input });
});

test("rejects malformed and incomplete URL values", () => {
  for (const input of ["example.com", "https://", "https:// example.com", " https://example.com"]) {
    assert.deepEqual(validateQrInput(input, "url"), { ok: false, error: "invalid-url" }, input);
  }
});

test("rejects unsupported URL schemes without opening or fetching them", () => {
  assert.deepEqual(validateQrInput("javascript:alert(1)", "url"), { ok: false, error: "unsupported-url" });
  assert.deepEqual(validateQrInput("data:text/plain,secret", "url"), { ok: false, error: "unsupported-url" });
  assert.deepEqual(validateQrInput("mailto:user@example.com", "url"), { ok: false, error: "unsupported-url" });
});

test("encodes ordinary text into a valid QR matrix", async () => {
  const result = decodePngDataUrl(await generateQrCodePngDataUrl("Hello, QR!", DEFAULT_QR_OPTIONS));
  assert.equal(result.decoded?.data, "Hello, QR!");
});

test("encodes a complete HTTPS URL exactly", async () => {
  const input = "https://example.com/path?q=one%20two#section";
  const result = decodePngDataUrl(await generateQrCodePngDataUrl(input, DEFAULT_QR_OPTIONS));
  assert.equal(result.decoded?.data, input);
});

test("encodes international Unicode text with exact round-trip data", async () => {
  const input = "नमस्ते 世界 — café";
  const result = decodePngDataUrl(await generateQrCodePngDataUrl(input, DEFAULT_QR_OPTIONS));
  assert.equal(result.decoded?.data, input);
});

test("encodes emoji without changing the original characters", async () => {
  const input = "QR 😊 🚀 👨‍👩‍👧‍👦";
  const result = decodePngDataUrl(await generateQrCodePngDataUrl(input, DEFAULT_QR_OPTIONS));
  assert.equal(result.decoded?.data, input);
});

test("round-trips long text without truncation", async () => {
  const input = "A longer QR payload with Unicode café and punctuation. ".repeat(25);
  const result = decodePngDataUrl(await generateQrCodePngDataUrl(input, { ...DEFAULT_QR_OPTIONS, errorCorrectionLevel: "L" }));
  assert.equal(result.decoded?.data, input);
});

test("reports oversized content by rejecting generation instead of truncating", async () => {
  await assert.rejects(generateQrCodeSvg("x".repeat(5000), { ...DEFAULT_QR_OPTIONS, errorCorrectionLevel: "L" }));
});

test("generates all four error correction levels as independently decodable PNGs", async () => {
  for (const level of QR_ERROR_CORRECTION_LEVELS) {
    const png = await generateQrCodePngDataUrl("scan-test-123", { ...DEFAULT_QR_OPTIONS, errorCorrectionLevel: level });
    assert.equal(decodePngDataUrl(png).decoded?.data, "scan-test-123", level);
  }
});

test("uses medium correction and black-on-white default colors", () => {
  assert.deepEqual(DEFAULT_QR_OPTIONS, { size: 512, foreground: "#000000", background: "#ffffff", errorCorrectionLevel: "M" });
});

test("generates and independently decodes a custom-color QR", async () => {
  const png = await generateQrCodePngDataUrl("custom-color", { ...DEFAULT_QR_OPTIONS, foreground: "#123456", background: "#fff8dc" });
  const result = decodePngDataUrl(png);
  assert.equal(result.decoded?.data, "custom-color");
  assert.deepEqual([...result.image.data.slice(0, 3)], [255, 248, 220]);
});

test("accepts six-digit hexadecimal colors and rejects invalid forms", () => {
  for (const color of ["#000000", "#fffFFF", "#12ab89"]) assert.equal(isValidQrColor(color), true, color);
  for (const color of ["black", "#fff", "#12345678", "123456", "#12xz00"]) assert.equal(isValidQrColor(color), false, color);
});

test("reports low contrast and accepts strongly contrasting colors", () => {
  assert.ok((getQrColorContrast("#000000", "#ffffff") ?? 0) > 20);
  assert.equal(hasLowQrContrast("#000000", "#ffffff"), false);
  assert.equal(hasLowQrContrast("#888888", "#aaaaaa"), true);
  assert.equal(hasLowQrContrast("invalid", "#ffffff"), true);
});

test("supports every advertised output size with correct PNG dimensions", async () => {
  assert.deepEqual(QR_CODE_SIZES, [256, 512, 1024]);
  for (const size of QR_CODE_SIZES) {
    const { image, decoded } = decodePngDataUrl(await generateQrCodePngDataUrl("size test", { ...DEFAULT_QR_OPTIONS, size }));
    assert.deepEqual([image.width, image.height], [size, size]);
    assert.equal(decoded?.data, "size test");
  }
});

test("creates a valid PNG data URL with the PNG signature", async () => {
  const dataUrl = await generateQrCodePngDataUrl("png format", DEFAULT_QR_OPTIONS);
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  assert.match(dataUrl, /^data:image\/png;base64,/);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("creates scalable SVG markup with selected size and colors", async () => {
  const svg = await generateQrCodeSvg("svg format", { ...DEFAULT_QR_OPTIONS, size: 1024, foreground: "#142536", background: "#fefefe" });
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /width="1024"/);
  assert.match(svg, /height="1024"/);
  assert.match(svg, /#142536/i);
  assert.match(svg, /#fefefe/i);
});

test("new renders reflect the latest content rather than stale preview data", async () => {
  const oldRender = await generateQrCodePngDataUrl("old content", DEFAULT_QR_OPTIONS);
  const latestRender = await generateQrCodePngDataUrl("latest content", DEFAULT_QR_OPTIONS);
  assert.equal(decodePngDataUrl(latestRender).decoded?.data, "latest content");
  assert.notEqual(decodePngDataUrl(oldRender).decoded?.data, decodePngDataUrl(latestRender).decoded?.data);
});

test("includes a four-module quiet zone in PNG output", async () => {
  const options = { ...DEFAULT_QR_OPTIONS, size: 256 };
  const png = decodePngDataUrl(await generateQrCodePngDataUrl("quiet zone", options));
  const edgePixel = (x, y) => [...png.image.data.slice((y * png.image.width + x) * 4, (y * png.image.width + x) * 4 + 3)];
  assert.deepEqual(edgePixel(0, 0), [255, 255, 255]);
  assert.deepEqual(edgePixel(0, 128), [255, 255, 255]);
  const matrixSize = QRCode.create("quiet zone", { errorCorrectionLevel: "M" }).modules.size;
  const svg = await generateQrCodeSvg("quiet zone", options);
  assert.match(svg, new RegExp(`viewBox="0 0 ${matrixSize + 8} ${matrixSize + 8}"`));
});

test("exports have no SVG script or event-handler attributes", async () => {
  const svg = await generateQrCodeSvg("safe svg", DEFAULT_QR_OPTIONS);
  assert.doesNotMatch(svg, /<script\b|\son[a-z]+\s*=|javascript:/i);
});

test("text and URL mode switching validates the same entered content explicitly", () => {
  assert.equal(validateQrInput("https://example.com", "text").ok, true);
  assert.equal(validateQrInput("Hello there", "url").ok, false);
});

test("QR renderer performs local conversion without issuing network requests", async () => {
  let fetchCalls = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("unexpected fetch"); };
  try {
    await generateQrCodeSvg("local only", DEFAULT_QR_OPTIONS);
    await generateQrCodePngDataUrl("local only", DEFAULT_QR_OPTIONS);
  } finally {
    globalThis.fetch = previousFetch;
  }
  assert.equal(fetchCalls, 0);
});

test("test rendering API is compatible with static export browser-safe options", async () => {
  const svg = await generateQrCodeSvg("static route", DEFAULT_QR_OPTIONS);
  assert.match(svg, /<svg/);
  assert.equal(typeof generateQrCodePngDataUrl("static route", DEFAULT_QR_OPTIONS).then, "function");
});
