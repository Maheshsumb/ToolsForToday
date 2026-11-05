import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import { PNG } from "pngjs";
import { detectMetadataFileFormat, formatMetadataFileName, getMetadataImageDimensions, inspectMetadata, MetadataFileError, removeSelectedMetadata } from "./metadata-remover.ts";

const fixture = (name) => readFile(path.resolve("tests/fixtures/metadata", name));

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function pngWithTextChunk(type, data) {
  const base = PNG.sync.write({ width: 1, height: 1, data: Buffer.from([40, 100, 180, 255]) });
  const endIndex = base.lastIndexOf(Buffer.from("IEND")) - 4;
  return Buffer.concat([base.subarray(0, endIndex), pngChunk(type, data), base.subarray(endIndex)]);
}

test("JPEG EXIF inspection detects camera make and GPS, and selected removal preserves compressed image data", async () => {
  const input = await fixture("synthetic-exif-gps.jpg");
  assert.equal(detectMetadataFileFormat(input), "jpeg");
  const before = await inspectMetadata(input);
  assert.ok(before.options.some(({ id }) => id === "exif"));
  assert.ok(before.fields.some(({ label, value }) => label === "Camera make" && value === "SyntheticCam"));
  assert.ok(before.fields.some(({ label, value }) => label === "GPS coordinates" && value === "37.808333, -122.404167"));

  const output = await removeSelectedMetadata(input, "jpeg", ["exif"]);
  const after = await inspectMetadata(output);
  assert.equal(after.options.some(({ id }) => id === "exif"), false);
  assert.equal(Buffer.from(output).subarray(output.length - 2).toString("hex"), "ffd9");
  const scanStart = input.indexOf(Buffer.from([0xff, 0xda]));
  assert.ok(scanStart > 0);
  const outputScanStart = Buffer.from(output).indexOf(Buffer.from([0xff, 0xda]));
  assert.deepEqual(Buffer.from(output).subarray(outputScanStart), input.subarray(scanStart));
});

test("WebP EXIF and XMP chunks can be selected independently and RIFF length is updated", async () => {
  const input = await fixture("synthetic-exif-xmp.webp");
  const before = await inspectMetadata(input);
  assert.equal(before.format, "webp");
  assert.deepEqual(before.options.map(({ id }) => id), ["exif", "xmp"]);
  assert.ok(before.fields.some(({ label }) => label === "Camera make"));

  const output = await removeSelectedMetadata(input, "webp", ["exif"]);
  const after = await inspectMetadata(output);
  assert.equal(after.options.some(({ id }) => id === "exif"), false);
  assert.equal(after.options.some(({ id }) => id === "xmp"), true);
  assert.equal(Buffer.from(output).toString("ascii", 0, 4), "RIFF");
  assert.equal(Buffer.from(output).readUInt32LE(4), output.length - 8);
  assert.ok(Buffer.from(output).includes(Buffer.from("VP8L")));
});

test("PNG text metadata is removed while pixel content remains valid", async () => {
  const input = pngWithTextChunk("tEXt", Buffer.from("Author\0Synthetic Writer", "utf8"));
  const before = await inspectMetadata(input);
  assert.equal(before.format, "png");
  assert.deepEqual(before.fields, [{ label: "PNG text: Author", value: "Synthetic Writer" }]);
  const output = await removeSelectedMetadata(input, "png", ["png-text"]);
  assert.equal((await inspectMetadata(output)).options.length, 0);
  const decoded = PNG.sync.read(Buffer.from(output));
  assert.equal(decoded.width, 1);
  assert.deepEqual([...decoded.data], [40, 100, 180, 255]);
});

test("PNG Content Credentials marker is disclosed and not removed with text metadata", async () => {
  const base = pngWithTextChunk("tEXt", Buffer.from("Author\0Synthetic Writer"));
  const endIndex = base.lastIndexOf(Buffer.from("IEND")) - 4;
  const input = Buffer.concat([base.subarray(0, endIndex), pngChunk("caBX", Buffer.from("c2pa synthetic provenance fixture")), base.subarray(endIndex)]);
  const before = await inspectMetadata(input);
  assert.equal(before.c2paMarkerFound, true);
  const output = await removeSelectedMetadata(input, "png", ["png-text"]);
  const after = await inspectMetadata(output);
  assert.equal(after.c2paMarkerFound, true);
  assert.ok(Buffer.from(output).includes(Buffer.from("caBX")));
});

test("PDF document fields are inspected and individually removed without losing the page", async () => {
  const source = await PDFDocument.create();
  source.addPage([200, 120]);
  source.setTitle("Synthetic title");
  source.setAuthor("Synthetic author");
  source.setSubject("Fixture subject");
  const input = new Uint8Array(await source.save());
  const before = await inspectMetadata(input);
  assert.equal(before.format, "pdf");
  assert.ok(before.fields.some(({ label, value }) => label === "Title" && value === "Synthetic title"));
  assert.ok(before.options.some(({ id }) => id === "pdf-author"));

  const output = await removeSelectedMetadata(input, "pdf", ["pdf-author"]);
  const after = await PDFDocument.load(output, { updateMetadata: false });
  assert.equal(after.getTitle(), "Synthetic title");
  assert.equal(after.getAuthor(), undefined);
  assert.equal(after.getPageCount(), 1);
  assert.ok((await inspectMetadata(output)).fields.some(({ label }) => label === "Subject"));
});

test("signed-marker, encrypted, malformed, and unsupported inputs fail safely", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const signedLike = Buffer.concat([Buffer.from(await pdf.save()), Buffer.from("\n/ByteRange [0 10 20 30]", "ascii")]);
  await assert.rejects(removeSelectedMetadata(signedLike, "pdf", ["pdf-title"]), /digital signature/u);
  const encryptedPdf = await fixture("encrypted-password.pdf");
  await assert.rejects(inspectMetadata(encryptedPdf), /Encrypted, malformed, or unsupported PDFs/u);
  await assert.rejects(removeSelectedMetadata(encryptedPdf, "pdf", ["pdf-title"]), /Encrypted, malformed, or unsupported PDFs/u);
  await assert.rejects(inspectMetadata(Buffer.from("not an image or document")), MetadataFileError);
  await assert.rejects(inspectMetadata(Buffer.from("%PDF-1.7\nNot a document structure\n%%EOF", "ascii")), /Encrypted, malformed, or unsupported PDFs/u);
  await assert.rejects(inspectMetadata(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 10])), /PNG (?:end marker is missing|chunk)/u);
  const corruptedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x7f, 0xff, 0x45, 0x78, 0x69, 0x66, 0, 0]);
  await assert.rejects(inspectMetadata(corruptedJpeg), /Invalid JPEG segment length/u);
});

test("download filenames cannot introduce path traversal", () => {
  assert.equal(formatMetadataFileName("../../private photo?.jpg"), "private-photo-metadata-cleaned.jpg");
  assert.equal(formatMetadataFileName("archive.PDF"), "archive-metadata-cleaned.pdf");
});

test("reads safe image dimensions before decode and rejects oversized PNG dimensions", async () => {
  const jpeg = await fixture("synthetic-exif-gps.jpg");
  const webp = await fixture("synthetic-exif-xmp.webp");
  assert.deepEqual(getMetadataImageDimensions(jpeg, "jpeg"), { width: 16, height: 12 });
  assert.deepEqual(getMetadataImageDimensions(webp, "webp"), { width: 16, height: 12 });
  const validPng = pngWithTextChunk("tEXt", Buffer.from("Author\0Test"));
  assert.deepEqual(getMetadataImageDimensions(validPng, "png"), { width: 1, height: 1 });
  const oversized = Buffer.from(validPng);
  oversized.writeUInt32BE(20_001, 16);
  assert.throws(() => getMetadataImageDimensions(oversized, "png"), /exceeds the supported dimensions/u);
});
