import type { PDFDocument } from "@cantoo/pdf-lib";

export type MetadataFileFormat = "jpeg" | "png" | "webp" | "pdf";

export interface MetadataField {
  label: string;
  value: string;
}

export interface MetadataRemovalOption {
  id: string;
  label: string;
  description: string;
}

export interface MetadataInspection {
  format: MetadataFileFormat;
  fields: MetadataField[];
  options: MetadataRemovalOption[];
  c2paMarkerFound: boolean;
  limitations: string[];
}

export interface ImageDimensions { width: number; height: number }

export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 20_000_000;

export class MetadataFileError extends Error {}

const ascii = new TextDecoder("latin1");
const utf8 = new TextDecoder("utf-8", { fatal: false });

function startsWith(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function readAscii(bytes: Uint8Array, start: number, end: number): string {
  return ascii.decode(bytes.subarray(start, end));
}

function assertSupportedImageDimensions({ width, height }: ImageDimensions): ImageDimensions {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1
    || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
    throw new MetadataFileError("This image exceeds the supported dimensions (maximum 12,000 pixels per side and 20 megapixels). It was not decoded.");
  }
  return { width, height };
}

/** Reads container dimensions before asking the browser to decode an image. */
export function getMetadataImageDimensions(bytes: Uint8Array, format: Exclude<MetadataFileFormat, "pdf">): ImageDimensions {
  if (format === "png") {
    if (!startsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || bytes.length < 24 || readAscii(bytes, 12, 16) !== "IHDR") {
      throw new MetadataFileError("The PNG image header is incomplete.");
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return assertSupportedImageDimensions({ width: view.getUint32(16, false), height: view.getUint32(20, false) });
  }

  if (format === "jpeg") {
    const segments = jpegSegments(bytes);
    const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    const sof = segments.find((segment) => sofMarkers.has(segment.marker));
    if (!sof || sof.dataEnd - sof.dataStart < 5) throw new MetadataFileError("The JPEG frame dimensions could not be read.");
    const view = new DataView(bytes.buffer, bytes.byteOffset + sof.dataStart, sof.dataEnd - sof.dataStart);
    return assertSupportedImageDimensions({ height: view.getUint16(1, false), width: view.getUint16(3, false) });
  }

  const chunks = webpChunks(bytes);
  const image = chunks.find((chunk) => ["VP8X", "VP8L", "VP8 "].includes(chunk.type));
  if (!image) throw new MetadataFileError("The WebP image dimensions could not be read.");
  const data = bytes.subarray(image.dataStart, image.dataEnd);
  if (image.type === "VP8X" && data.length >= 10) {
    const read24 = (offset: number) => data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
    return assertSupportedImageDimensions({ width: read24(4) + 1, height: read24(7) + 1 });
  }
  if (image.type === "VP8L" && data.length >= 5 && data[0] === 0x2f) {
    const width = 1 + data[1] + ((data[2] & 0x3f) << 8);
    const height = 1 + (data[2] >> 6) + (data[3] << 2) + ((data[4] & 0x0f) << 10);
    return assertSupportedImageDimensions({ width, height });
  }
  if (image.type === "VP8 " && data.length >= 10 && startsWith(data, 3, [0x9d, 0x01, 0x2a])) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return assertSupportedImageDimensions({ width: view.getUint16(6, true) & 0x3fff, height: view.getUint16(8, true) & 0x3fff });
  }
  throw new MetadataFileError("The WebP image dimensions could not be read safely.");
}

export function detectMetadataFileFormat(bytes: Uint8Array): MetadataFileFormat {
  if (startsWith(bytes, 0, [0xff, 0xd8])) return "jpeg";
  if (startsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 12) === "WEBP") return "webp";
  if (readAscii(bytes, 0, 5) === "%PDF-") return "pdf";
  throw new MetadataFileError("The file contents do not match a supported JPEG, PNG, WebP, or PDF format.");
}

interface ExifEntry { tag: number; type: number; count: number; valueOffset: number; valuePosition: number }

function parseExif(tiff: Uint8Array): MetadataField[] {
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  if (tiff.length < 8) return [];
  const byteOrder = readAscii(tiff, 0, 2);
  if (byteOrder !== "II" && byteOrder !== "MM") return [];
  const little = byteOrder === "II";
  const u16 = (offset: number) => offset >= 0 && offset + 2 <= view.byteLength ? view.getUint16(offset, little) : undefined;
  const u32 = (offset: number) => offset >= 0 && offset + 4 <= view.byteLength ? view.getUint32(offset, little) : undefined;
  if (u16(2) !== 42) return [];

  function entriesAt(offset: number): ExifEntry[] {
    const count = u16(offset);
    if (count === undefined || count > 512 || offset + 2 + count * 12 > view.byteLength) return [];
    const entries: ExifEntry[] = [];
    for (let index = 0; index < count; index += 1) {
      const position = offset + 2 + index * 12;
      const tag = u16(position);
      const type = u16(position + 2);
      const valueCount = u32(position + 4);
      const valueOffset = u32(position + 8);
      if (tag !== undefined && type !== undefined && valueCount !== undefined && valueOffset !== undefined) {
        entries.push({ tag, type, count: valueCount, valueOffset, valuePosition: position + 8 });
      }
    }
    return entries;
  }

  function rawValue(entry: ExifEntry): Uint8Array | undefined {
    const sizes: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    const size = sizes[entry.type];
    if (!size) return undefined;
    const byteLength = size * entry.count;
    const start = byteLength <= 4 ? entry.valuePosition : entry.valueOffset;
    if (start < 0 || byteLength > view.byteLength || start + byteLength > view.byteLength) return undefined;
    return tiff.subarray(start, start + byteLength);
  }

  function stringValue(entry: ExifEntry): string {
    const raw = rawValue(entry);
    return raw ? readAscii(raw, 0, raw.length).replace(/\0+$/u, "").trim() : "";
  }

  function rationalValues(entry: ExifEntry): number[] {
    const values: number[] = [];
    for (let index = 0; index < Math.min(entry.count, 16); index += 1) {
      const position = entry.valueOffset + index * 8;
      if (position < 0 || position + 8 > view.byteLength) return [];
      const numerator = entry.type === 10 ? view.getInt32(position, little) : u32(position);
      const denominator = entry.type === 10 ? view.getInt32(position + 4, little) : u32(position + 4);
      if (numerator === undefined || denominator === undefined || denominator === 0) return [];
      values.push(numerator / denominator);
    }
    return values;
  }

  const root = entriesAt(u32(4) ?? -1);
  const fields: MetadataField[] = [];
  const knownTags: readonly [number, string][] = [[0x010f, "Camera make"], [0x0110, "Camera model"], [0x0131, "Software"], [0x013b, "Creator / artist"], [0x0132, "Recorded date"], [0x9003, "Original date"], [0x8298, "Copyright"]];
  const exifOffset = root.find((entry) => entry.tag === 0x8769)?.valueOffset;
  const exifEntries = exifOffset ? entriesAt(exifOffset) : [];
  const allEntries = [...root, ...exifEntries];
  for (const [tag, label] of knownTags) {
    const entry = allEntries.find((candidate) => candidate.tag === tag);
    const value = entry ? stringValue(entry) : "";
    if (value) fields.push({ label, value });
  }

  const gpsOffset = root.find((entry) => entry.tag === 0x8825)?.valueOffset;
  if (gpsOffset) {
    const gps = entriesAt(gpsOffset);
    const latRef = gps.find((entry) => entry.tag === 1) ? stringValue(gps.find((entry) => entry.tag === 1)!) : "";
    const lonRef = gps.find((entry) => entry.tag === 3) ? stringValue(gps.find((entry) => entry.tag === 3)!) : "";
    const latEntry = gps.find((entry) => entry.tag === 2);
    const lonEntry = gps.find((entry) => entry.tag === 4);
    const toDecimal = (entry?: ExifEntry, ref?: string) => {
      const parts = entry ? rationalValues(entry) : [];
      if (parts.length < 3) return undefined;
      const decimal = parts[0] + parts[1] / 60 + parts[2] / 3600;
      return ref === "S" || ref === "W" ? -decimal : decimal;
    };
    const latitude = toDecimal(latEntry, latRef);
    const longitude = toDecimal(lonEntry, lonRef);
    if (latitude !== undefined && longitude !== undefined) fields.push({ label: "GPS coordinates", value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
  }
  return fields;
}

interface JpegSegment { start: number; end: number; marker: number; dataStart: number; dataEnd: number }

function jpegSegments(bytes: Uint8Array): JpegSegment[] {
  const segments: JpegSegment[] = [];
  if (!startsWith(bytes, 0, [0xff, 0xd8])) throw new MetadataFileError("Invalid JPEG header.");
  let cursor = 2;
  while (cursor < bytes.length) {
    const start = cursor;
    if (bytes[cursor] !== 0xff) throw new MetadataFileError("Malformed JPEG marker sequence.");
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor++];
    if (marker === undefined) break;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      segments.push({ start, end: cursor, marker, dataStart: cursor, dataEnd: cursor });
      continue;
    }
    if (cursor + 2 > bytes.length) throw new MetadataFileError("Truncated JPEG segment.");
    const length = (bytes[cursor] << 8) | bytes[cursor + 1];
    if (length < 2 || cursor + length > bytes.length) throw new MetadataFileError("Invalid JPEG segment length.");
    segments.push({ start, end: cursor + length, marker, dataStart: cursor + 2, dataEnd: cursor + length });
    cursor += length;
  }
  return segments;
}

function jpegXmpPayload(bytes: Uint8Array, segment: JpegSegment): boolean {
  return readAscii(bytes, segment.dataStart, Math.min(segment.dataEnd, segment.dataStart + 40)).startsWith("http://ns.adobe.com/xap/1.0/\0");
}

function inspectJpeg(bytes: Uint8Array): MetadataInspection {
  const segments = jpegSegments(bytes);
  const fields: MetadataField[] = [];
  const options: MetadataRemovalOption[] = [];
  const exif = segments.find((segment) => segment.marker === 0xe1 && readAscii(bytes, segment.dataStart, segment.dataStart + 6) === "Exif\0\0");
  if (exif) {
    options.push({ id: "exif", label: "EXIF metadata", description: "Removes the EXIF block, including supported camera details and GPS data." });
    fields.push(...parseExif(bytes.subarray(exif.dataStart + 6, exif.dataEnd)));
  }
  if (segments.some((segment) => segment.marker === 0xe1 && jpegXmpPayload(bytes, segment))) options.push({ id: "xmp", label: "XMP metadata", description: "Removes standard Adobe XMP packets in JPEG APP1 segments." });
  if (segments.some((segment) => segment.marker === 0xed)) options.push({ id: "iptc", label: "IPTC / Photoshop metadata", description: "Removes JPEG APP13 metadata segments." });
  for (const segment of segments.filter((candidate) => candidate.marker === 0xfe)) {
    const value = readAscii(bytes, segment.dataStart, segment.dataEnd).trim();
    options.push({ id: "jpeg-comment", label: "JPEG comment", description: "Removes a comment segment." });
    if (value) fields.push({ label: "JPEG comment", value: value.slice(0, 500) });
  }
  return {
    format: "jpeg", fields, options: uniqueOptions(options),
    c2paMarkerFound: /c2pa|jumbf/iu.test(ascii.decode(bytes)),
    limitations: ["JPEG metadata outside recognized EXIF, XMP, IPTC, and comment segments is not fully inventoried. Color profile segments are preserved.", "Removing metadata segments preserves the encoded image data without recompressing it. Embedded watermarks and identifying image content are not removed."],
  };
}

interface PngChunk { start: number; end: number; type: string; dataStart: number; dataEnd: number }

function pngChunks(bytes: Uint8Array): PngChunk[] {
  if (!startsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) throw new MetadataFileError("Invalid PNG header.");
  const chunks: PngChunk[] = [];
  let cursor = 8;
  let foundEnd = false;
  while (cursor + 12 <= bytes.length) {
    const start = cursor;
    const length = new DataView(bytes.buffer, bytes.byteOffset + cursor, 4).getUint32(0, false);
    if (length > bytes.length || cursor + 12 + length > bytes.length) throw new MetadataFileError("Truncated PNG chunk.");
    const type = readAscii(bytes, cursor + 4, cursor + 8);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    cursor = dataEnd + 4;
    chunks.push({ start, end: cursor, type, dataStart, dataEnd });
    if (type === "IEND") { foundEnd = true; break; }
  }
  if (!foundEnd) throw new MetadataFileError("PNG end marker is missing.");
  return chunks;
}

function parsePngText(bytes: Uint8Array, chunk: PngChunk): MetadataField | undefined {
  const data = bytes.subarray(chunk.dataStart, chunk.dataEnd);
  const nullAt = data.indexOf(0);
  if (nullAt < 1) return undefined;
  const keyword = utf8.decode(data.subarray(0, nullAt));
  let valueStart = nullAt + 1;
  if (chunk.type === "iTXt") {
    if (valueStart + 2 > data.length) return { label: `PNG text: ${keyword}`, value: "[international text chunk]" };
    const compressed = data[valueStart];
    valueStart += 2;
    for (let part = 0; part < 2; part += 1) {
      const nextNull = data.indexOf(0, valueStart);
      if (nextNull < 0) return { label: `PNG text: ${keyword}`, value: "[international text chunk]" };
      valueStart = nextNull + 1;
    }
    return { label: `PNG text: ${keyword}`, value: compressed ? "[compressed international text]" : utf8.decode(data.subarray(valueStart, Math.min(data.length, valueStart + 500))) };
  }
  if (chunk.type === "zTXt") return { label: `PNG text: ${keyword}`, value: "[compressed text chunk]" };
  return { label: `PNG text: ${keyword}`, value: utf8.decode(data.subarray(valueStart, Math.min(data.length, valueStart + 500))) };
}

function inspectPng(bytes: Uint8Array): MetadataInspection {
  const chunks = pngChunks(bytes);
  const fields: MetadataField[] = [];
  const options: MetadataRemovalOption[] = [];
  if (chunks.some((chunk) => chunk.type === "eXIf")) {
    options.push({ id: "exif", label: "EXIF metadata", description: "Removes PNG eXIf chunks, including detected camera and GPS fields." });
    const exifChunk = chunks.find((chunk) => chunk.type === "eXIf");
    if (exifChunk) fields.push(...parseExif(bytes.subarray(exifChunk.dataStart, exifChunk.dataEnd)));
  }
  const textChunks = chunks.filter((chunk) => ["tEXt", "zTXt", "iTXt"].includes(chunk.type));
  if (textChunks.length > 0) {
    options.push({ id: "png-text", label: "PNG text metadata", description: "Removes PNG text chunks. XMP stored in a PNG text chunk is removed with this selection." });
    for (const chunk of textChunks) {
      const field = parsePngText(bytes, chunk);
      if (field) fields.push(field);
    }
  }
  const timestamp = chunks.find((chunk) => chunk.type === "tIME");
  if (timestamp) options.push({ id: "png-time", label: "PNG timestamp", description: "Removes the PNG tIME chunk." });
  return {
    format: "png", fields, options,
    c2paMarkerFound: chunks.some((chunk) => chunk.type.toLowerCase() === "cabx") || /c2pa|jumbf/iu.test(ascii.decode(bytes)),
    limitations: ["PNG text, eXIf, and tIME chunks are inventoried; unknown ancillary chunks and embedded objects are not a complete metadata audit. Color profiles and other unselected chunks are preserved.", "Removing these chunks does not alter the compressed image pixel data. Embedded watermarks and identifying image content are not removed."],
  };
}

interface WebpChunk { start: number; end: number; type: string; dataStart: number; dataEnd: number }

function webpChunks(bytes: Uint8Array): WebpChunk[] {
  if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 12) !== "WEBP" || bytes.length < 12) throw new MetadataFileError("Invalid WebP RIFF header.");
  const chunks: WebpChunk[] = [];
  let cursor = 12;
  while (cursor + 8 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + cursor + 4, 4).getUint32(0, true);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    const end = dataEnd + (length % 2);
    if (end > bytes.length) throw new MetadataFileError("Truncated WebP chunk.");
    chunks.push({ start: cursor, end, type: readAscii(bytes, cursor, cursor + 4), dataStart, dataEnd });
    cursor = end;
  }
  if (cursor !== bytes.length) throw new MetadataFileError("Malformed WebP chunk padding.");
  return chunks;
}

function inspectWebp(bytes: Uint8Array): MetadataInspection {
  const chunks = webpChunks(bytes);
  const options: MetadataRemovalOption[] = [];
  const fields: MetadataField[] = [];
  const exif = chunks.find((chunk) => chunk.type === "EXIF");
  if (exif) {
    options.push({ id: "exif", label: "EXIF metadata", description: "Removes the WebP EXIF chunk, including supported camera and GPS fields." });
    let start = exif.dataStart;
    if (readAscii(bytes, start, start + 6) === "Exif\0\0") start += 6;
    fields.push(...parseExif(bytes.subarray(start, exif.dataEnd)));
  }
  if (chunks.some((chunk) => chunk.type === "XMP ")) options.push({ id: "xmp", label: "XMP metadata", description: "Removes the WebP XMP chunk." });
  return {
    format: "webp", fields, options,
    c2paMarkerFound: chunks.some((chunk) => ["C2PA", "JUMB"].includes(chunk.type.toUpperCase())) || /c2pa|jumbf/iu.test(ascii.decode(bytes)),
    limitations: ["WebP EXIF and XMP chunks are inspected. ICC color profiles and unrecognized chunks are preserved.", "Chunk removal preserves encoded image chunks without recompression. Embedded watermarks and identifying image content are not removed."],
  };
}

const pdfProperties = [
  ["pdf-title", "Title", "Title", (doc: PDFDocument) => doc.getTitle()],
  ["pdf-author", "Author", "Author", (doc: PDFDocument) => doc.getAuthor()],
  ["pdf-subject", "Subject", "Subject", (doc: PDFDocument) => doc.getSubject()],
  ["pdf-keywords", "Keywords", "Keywords", (doc: PDFDocument) => doc.getKeywords()],
  ["pdf-creator", "Creator", "Creator", (doc: PDFDocument) => doc.getCreator()],
  ["pdf-producer", "Producer", "Producer", (doc: PDFDocument) => doc.getProducer()],
  ["pdf-created", "Creation date", "CreationDate", (doc: PDFDocument) => doc.getCreationDate()?.toISOString()],
  ["pdf-modified", "Modification date", "ModDate", (doc: PDFDocument) => doc.getModificationDate()?.toISOString()],
] as const;

async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    const { PDFDocument } = await import("@cantoo/pdf-lib");
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    if (doc.getPageCount() < 1) throw new Error("PDF has no readable pages");
    return doc;
  } catch {
    throw new MetadataFileError("This PDF could not be read. Encrypted, malformed, or unsupported PDFs are not modified.");
  }
}

async function inspectPdf(bytes: Uint8Array): Promise<MetadataInspection> {
  const { PDFDict, PDFName } = await import("@cantoo/pdf-lib");
  const doc = await loadPdf(bytes);
  const infoRef = doc.context.trailerInfo.Info;
  const info = infoRef ? doc.context.lookupMaybe(infoRef, PDFDict) : undefined;
  const fields: MetadataField[] = [];
  const options: MetadataRemovalOption[] = [];
  for (const [id, label, , read] of pdfProperties) {
    const value = read(doc);
    if (value) {
      fields.push({ label, value });
      options.push({ id, label, description: `Clears the basic PDF document information ${label.toLowerCase()} property.` });
    }
  }
  if (info && info.has(PDFName.of("Trapped"))) {
    const trapped = info.lookup(PDFName.of("Trapped"));
    if (trapped) {
      fields.push({ label: "Trapped / print production flag", value: trapped.toString() });
      options.push({ id: "pdf-trapped", label: "Trapped flag", description: "Removes the PDF document information Trapped property." });
    }
  }
  return {
    format: "pdf", fields, options,
    c2paMarkerFound: /c2pa|jumbf/iu.test(ascii.decode(bytes)),
    limitations: ["This tool checks standard PDF document information fields only. XMP packets, embedded files, annotations, signatures, form data, historical revisions, and other objects are not fully inspected or sanitized.", "PDFs with recognized signature markers are rejected, but this check cannot guarantee detection of every signature or historical revision. Encrypted or malformed PDFs are not modified. PDF rewriting can affect interactive features; review the output before sharing."],
  };
}

function uniqueOptions(options: MetadataRemovalOption[]): MetadataRemovalOption[] {
  return [...new Map(options.map((option) => [option.id, option])).values()];
}

export async function inspectMetadata(bytes: Uint8Array): Promise<MetadataInspection> {
  switch (detectMetadataFileFormat(bytes)) {
    case "jpeg": return inspectJpeg(bytes);
    case "png": return inspectPng(bytes);
    case "webp": return inspectWebp(bytes);
    case "pdf": return inspectPdf(bytes);
  }
}

function concatParts(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function removeJpegMetadata(bytes: Uint8Array, selected: ReadonlySet<string>): Uint8Array {
  const segments = jpegSegments(bytes);
  const output: Uint8Array[] = [bytes.subarray(0, 2)];
  for (const segment of segments) {
    let category: string | undefined;
    if (segment.marker === 0xe1 && readAscii(bytes, segment.dataStart, segment.dataStart + 6) === "Exif\0\0") category = "exif";
    else if (segment.marker === 0xe1 && jpegXmpPayload(bytes, segment)) category = "xmp";
    else if (segment.marker === 0xed) category = "iptc";
    else if (segment.marker === 0xfe) category = "jpeg-comment";
    if (!(category && selected.has(category))) output.push(bytes.subarray(segment.start, segment.end));
  }
  const lastSegmentEnd = segments.at(-1)?.end ?? 2;
  if (lastSegmentEnd < bytes.length) output.push(bytes.subarray(lastSegmentEnd));
  return concatParts(output);
}

function isPngXmp(bytes: Uint8Array, chunk: PngChunk): boolean {
  if (chunk.type !== "iTXt") return false;
  const nullAt = bytes.indexOf(0, chunk.dataStart);
  return nullAt > chunk.dataStart && readAscii(bytes, chunk.dataStart, nullAt) === "XML:com.adobe.xmp";
}

function removePngMetadata(bytes: Uint8Array, selected: ReadonlySet<string>): Uint8Array {
  const chunks = pngChunks(bytes);
  const output: Uint8Array[] = [bytes.subarray(0, 8)];
  for (const chunk of chunks) {
    const remove = (chunk.type === "eXIf" && selected.has("exif"))
      || (["tEXt", "zTXt", "iTXt"].includes(chunk.type) && selected.has("png-text"))
      || (isPngXmp(bytes, chunk) && selected.has("xmp"))
      || (chunk.type === "tIME" && selected.has("png-time"));
    if (!remove) output.push(bytes.subarray(chunk.start, chunk.end));
  }
  return concatParts(output);
}

function removeWebpMetadata(bytes: Uint8Array, selected: ReadonlySet<string>): Uint8Array {
  const chunks = webpChunks(bytes);
  const parts: Uint8Array[] = [bytes.subarray(0, 12)];
  for (const chunk of chunks) {
    const remove = (chunk.type === "EXIF" && selected.has("exif")) || (chunk.type === "XMP " && selected.has("xmp"));
    if (!remove) parts.push(bytes.subarray(chunk.start, chunk.end));
  }
  const output = concatParts(parts);
  new DataView(output.buffer, output.byteOffset + 4, 4).setUint32(0, output.length - 8, true);
  return output;
}

async function removePdfMetadata(bytes: Uint8Array, selected: ReadonlySet<string>): Promise<Uint8Array> {
  const { PDFDict, PDFName } = await import("@cantoo/pdf-lib");
  if (/\/ByteRange\b|\/FT\s*\/Sig\b|\/Type\s*\/Sig\b/u.test(ascii.decode(bytes))) {
    throw new MetadataFileError("This PDF appears to contain a digital signature. It was not changed because rewriting would invalidate signature verification.");
  }
  const doc = await loadPdf(bytes);
  const infoRef = doc.context.trailerInfo.Info;
  const info = infoRef ? doc.context.lookupMaybe(infoRef, PDFDict) : undefined;
  for (const [id, , key] of pdfProperties) if (selected.has(id)) info?.delete(PDFName.of(key));
  if (selected.has("pdf-trapped")) info?.delete(PDFName.of("Trapped"));
  return doc.save({ useObjectStreams: false });
}

export async function removeSelectedMetadata(bytes: Uint8Array, format: MetadataFileFormat, selectedIds: readonly string[]): Promise<Uint8Array> {
  if (detectMetadataFileFormat(bytes) !== format) throw new MetadataFileError("The file format changed while it was being processed. Please select the file again.");
  const selected = new Set(selectedIds);
  switch (format) {
    case "jpeg": return removeJpegMetadata(bytes, selected);
    case "png": return removePngMetadata(bytes, selected);
    case "webp": return removeWebpMetadata(bytes, selected);
    case "pdf": return removePdfMetadata(bytes, selected);
  }
}

export function formatMetadataFileName(name: string): string {
  const safe = name.split(/[\\/]/u).at(-1) ?? "file";
  const dot = safe.lastIndexOf(".");
  const stem = (dot > 0 ? safe.slice(0, dot) : safe).replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 80) || "file";
  const extension = dot > 0 ? safe.slice(dot).replace(/[^.\p{L}\p{N}]/gu, "").slice(0, 10).toLowerCase() : "";
  return `${stem}-metadata-cleaned${extension}`;
}
