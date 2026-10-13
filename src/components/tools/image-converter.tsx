"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolStatus, type ToolStatusState } from "@/components/tools/tool-status";
import {
  DEFAULT_IMAGE_QUALITY,
  formatImageFileSize,
  getImageFormatLabel,
  ImageProcessingError,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  parseImageFileHeader,
  validateImageFileMetadata,
  type ImageFormat,
} from "@/lib/image-compression";
import { validateProcessingMemory } from "@/lib/image-resizing";
import {
  convertImageFile,
  DEFAULT_CONVERSION_BACKGROUND,
  getConversionSizeOutcome,
  getConvertedFilename,
} from "@/lib/image-conversion";

const allowedTypes = [
  { label: "JPEG", mimeTypes: ["image/jpeg"], extensions: [".jpg", ".jpeg"] },
  { label: "PNG", mimeTypes: ["image/png"], extensions: [".png"] },
  { label: "WebP", mimeTypes: ["image/webp"], extensions: [".webp"] },
] as const;

const defaultTargets: Record<ImageFormat, ImageFormat> = { jpeg: "webp", png: "jpeg", webp: "png" };
const formats: readonly { value: ImageFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

interface SelectedImage {
  file: File;
  format: ImageFormat;
  width: number;
  height: number;
  previewUrl: string;
}

interface ConvertedPreview {
  blob: Blob;
  format: ImageFormat;
  width: number;
  height: number;
  previewUrl: string;
  filename: string;
  outcome: "smaller" | "larger" | "equal";
}

export function ImageConverter() {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [result, setResult] = useState<ConvertedPreview | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(DEFAULT_IMAGE_QUALITY);
  const [background, setBackground] = useState(DEFAULT_CONVERSION_BACKGROUND);
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const [status, setStatus] = useState<{ state: ToolStatusState; message: string }>({
    state: "idle",
    message: "Choose one JPEG, PNG, or WebP image to begin.",
  });
  const operationId = useRef(0);
  const originalUrl = useRef<string | null>(null);
  const resultUrl = useRef<string | null>(null);

  const releaseOriginal = useCallback(() => {
    if (originalUrl.current) URL.revokeObjectURL(originalUrl.current);
    originalUrl.current = null;
  }, []);

  const releaseResult = useCallback(() => {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
  }, []);

  const invalidateResult = useCallback(() => {
    operationId.current += 1;
    releaseResult();
    setResult(null);
  }, [releaseResult]);

  useEffect(() => () => {
    operationId.current += 1;
    releaseOriginal();
    releaseResult();
  }, [releaseOriginal, releaseResult]);

  const selectImage = useCallback(async (files: readonly File[]) => {
    const file = files[0];
    if (!file) return;
    const operation = ++operationId.current;
    releaseOriginal();
    releaseResult();
    setSelected(null);
    setResult(null);
    setStatus({ state: "processing", message: "Checking the file format and decoding the image in this browser…" });

    try {
      if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) throw new ImageProcessingError("too-large", `Choose an image no larger than ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)}.`);
      const header = validateImageFileMetadata(file, parseImageFileHeader(file, new Uint8Array(await file.arrayBuffer())));
      if (operation !== operationId.current) return;

      let width = header.width;
      let height = header.height;
      if (typeof createImageBitmap === "function") {
        let bitmap: ImageBitmap | null = null;
        try {
          bitmap = await createImageBitmap(file);
          width = bitmap.width;
          height = bitmap.height;
        } catch {
          throw new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser.");
        } finally {
          bitmap?.close();
        }
      } else if (typeof Image !== "undefined") {
        const probeUrl = URL.createObjectURL(file);
        const image = new Image();
        try {
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser."));
            image.src = probeUrl;
          });
          width = image.naturalWidth;
          height = image.naturalHeight;
        } finally {
          image.src = "";
          URL.revokeObjectURL(probeUrl);
        }
      } else {
        throw new ImageProcessingError("decode-unavailable", "This browser cannot decode images for conversion.");
      }
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
        throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
      }
      try {
        validateProcessingMemory(width, height, width, height);
      } catch {
        throw new ImageProcessingError("too-many-pixels", "This image would require too much browser memory to convert safely. Choose a smaller image.");
      }
      if (operation !== operationId.current) return;

      const previewUrl = URL.createObjectURL(file);
      originalUrl.current = previewUrl;
      setSelected({ file, format: header.format, width, height, previewUrl });
      setOutputFormat(defaultTargets[header.format]);
      setQuality(DEFAULT_IMAGE_QUALITY);
      setBackground(DEFAULT_CONVERSION_BACKGROUND);
      setStatus({ state: "ready", message: `${getImageFormatLabel(header.format)} image ready. Choose a different output format and convert it locally.` });
    } catch (error) {
      if (operation === operationId.current) {
        setStatus({ state: "error", message: error instanceof Error ? error.message : "The image could not be read. Choose another file." });
      }
    }
  }, [releaseOriginal, releaseResult]);

  async function convert() {
    if (!selected || outputFormat === selected.format || status.state === "processing") return;
    const operation = ++operationId.current;
    releaseResult();
    setResult(null);
    setStatus({ state: "processing", message: `Converting ${getImageFormatLabel(selected.format)} to ${getImageFormatLabel(outputFormat)} in your browser…` });
    try {
      const converted = await convertImageFile(selected.file, outputFormat, quality, background);
      if (operation !== operationId.current) return;
      const previewUrl = URL.createObjectURL(converted.blob);
      resultUrl.current = previewUrl;
      const filename = getConvertedFilename(selected.file.name, converted.format);
      const outcome = getConversionSizeOutcome(selected.file.size, converted.blob.size);
      setResult({ ...converted, previewUrl, filename, outcome });
      setStatus({ state: "success", message: `Conversion complete. The ${getImageFormatLabel(converted.format)} output is ${outcome} than the original.` });
    } catch (error) {
      if (operation === operationId.current) {
        setStatus({ state: "error", message: error instanceof Error ? error.message : "The image could not be converted. Try another file or browser." });
      }
    }
  }

  function clearAll() {
    operationId.current += 1;
    releaseOriginal();
    releaseResult();
    setSelected(null);
    setResult(null);
    setOutputFormat("webp");
    setQuality(DEFAULT_IMAGE_QUALITY);
    setBackground(DEFAULT_CONVERSION_BACKGROUND);
    setStatus({ state: "idle", message: "Choose one JPEG, PNG, or WebP image to begin." });
    setDropzoneKey((key) => key + 1);
  }

  function changeOutputFormat(format: ImageFormat) {
    setOutputFormat(format);
    invalidateResult();
    if (selected) setStatus({ state: "ready", message: "Output format changed. Convert again to create a current download." });
  }

  const outputQualityEnabled = outputFormat !== "png";
  const sizeComparison = selected && result
    ? result.outcome === "smaller" ? `Smaller by ${formatImageFileSize(selected.file.size - result.blob.size)}.`
      : result.outcome === "larger" ? `Larger by ${formatImageFileSize(result.blob.size - selected.file.size)}. Different formats use different encoding methods, so conversion may increase file size.`
        : "The output is the same size as the original."
    : null;

  return (
    <section aria-labelledby="image-converter-workspace-heading" className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <div className="mb-6">
        <h2 id="image-converter-workspace-heading" className="font-heading text-xl font-semibold text-text">Convert one image</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Choose a non-animated JPEG, PNG, or WebP. This tool decodes and re-encodes at the browser-decoded dimensions. It does not resize or crop.</p>
      </div>

      <FileDropzone
        key={dropzoneKey}
        label="Choose an image"
        instructions={`Select or drop one non-animated JPEG, PNG, or WebP image. Maximum ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)} and 25 million decoded pixels.`}
        allowedTypes={allowedTypes}
        maxFileSizeBytes={MAX_IMAGE_FILE_SIZE_BYTES}
        onSelectionChange={(files) => { void selectImage(files); }}
      />

      <div className="mt-4"><ToolStatus state={status.state} message={status.message} /></div>

      {selected ? (
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
          <figure className="min-w-0 rounded-xl border border-border bg-surface-muted/45 p-4">
            <figcaption className="mb-3 text-sm font-semibold text-text">Original image</figcaption>
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
              <NextImage src={selected.previewUrl} alt={`Original ${getImageFormatLabel(selected.format)} image preview`} width={selected.width} height={selected.height} unoptimized className="max-h-72 w-full object-contain" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 break-words text-xs text-muted">
              <dt>Format</dt><dd>{getImageFormatLabel(selected.format)}</dd>
              <dt>Dimensions</dt><dd>{selected.width.toLocaleString()} × {selected.height.toLocaleString()} px</dd>
              <dt>File size</dt><dd>{formatImageFileSize(selected.file.size)}</dd>
            </dl>
          </figure>

          <div className="min-w-0 rounded-xl border border-border bg-surface-muted/45 p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Conversion settings</h3>
            <label htmlFor="image-converter-format" className="block text-sm font-medium text-text">Output format</label>
            <select id="image-converter-format" value={outputFormat} onChange={(event) => changeOutputFormat(event.target.value as ImageFormat)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              {formats.map((format) => <option key={format.value} value={format.value} disabled={format.value === selected.format}>{format.label}{format.value === selected.format ? " (same as original)" : ""}</option>)}
            </select>
            <p className="mt-1 text-xs leading-relaxed text-muted">Choose a different format. Same-format re-encoding is not offered here.</p>

            {outputQualityEnabled ? (
              <div className="mt-4">
                <label htmlFor="image-converter-quality" className="flex items-center justify-between gap-3 text-sm font-semibold text-text"><span>{getImageFormatLabel(outputFormat)} quality</span><span>{quality}%</span></label>
                <input id="image-converter-quality" type="range" min="10" max="100" step="5" value={quality} disabled={status.state === "processing"} aria-describedby="image-converter-quality-help" onChange={(event) => { setQuality(Number(event.target.value)); invalidateResult(); if (selected) setStatus({ state: "ready", message: "Quality changed. Convert again to create a current download." }); }} className="mt-3 min-h-8 w-full accent-[#176A8B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50" />
                <p id="image-converter-quality-help" className="mt-1 text-xs leading-relaxed text-muted">Higher quality generally creates a larger file; lower quality can add visible artifacts. This is an encoder setting, not a promised size reduction.</p>
              </div>
            ) : <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-muted">PNG uses browser lossless canvas encoding and does not use the JPEG/WebP quality setting. PNG output may be larger.</p>}

            {outputFormat === "jpeg" ? (
              <div className="mt-4">
                <label htmlFor="image-converter-background" className="block text-sm font-semibold text-text">Background for transparent pixels</label>
                <div className="mt-2 flex items-center gap-3"><input id="image-converter-background" type="color" value={background} disabled={status.state === "processing"} onChange={(event) => { setBackground(event.target.value.toUpperCase()); invalidateResult(); if (selected) setStatus({ state: "ready", message: "Background changed. Convert again to create a current download." }); }} className="h-11 w-14 cursor-pointer rounded border border-border bg-white p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /><span className="text-sm text-muted">JPEG cannot store transparency. Transparent areas are filled with this color (default white).</span></div>
              </div>
            ) : null}

            <Button onClick={() => { void convert(); }} disabled={status.state === "processing" || outputFormat === selected.format} className="mt-5 min-h-11 w-full">{status.state === "processing" ? "Converting…" : `Convert to ${getImageFormatLabel(outputFormat)}`}</Button>
            <Button variant="secondary" onClick={clearAll} className="mt-2 min-h-11 w-full">Clear image</Button>
            <p className="mt-3 text-xs leading-relaxed text-muted">Canvas re-encoding may remove EXIF, GPS, embedded color profiles, and other metadata. Metadata is not sent to Analytics and is not promised to be preserved.</p>
          </div>
        </div>
      ) : null}

      {selected && result ? (
        <section aria-labelledby="image-converter-result-heading" className="mt-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="image-converter-result-heading" className="font-heading text-lg font-semibold text-text">Converted image</h3><p className="mt-1 break-words text-sm text-muted">{result.filename}</p></div><a href={result.previewUrl} download={result.filename} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Download Converted Image</a></div>
          <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-2">
            <figure className="min-w-0 rounded-xl border border-border bg-surface-muted/45 p-4">
              <figcaption className="mb-3 text-sm font-semibold text-text">Converted preview</figcaption>
              <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2"><NextImage src={result.previewUrl} alt={`Converted ${getImageFormatLabel(result.format)} image preview`} width={result.width} height={result.height} unoptimized className="max-h-72 w-full object-contain" /></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 break-words text-xs text-muted"><dt>Format</dt><dd>{getImageFormatLabel(result.format)}</dd><dt>Dimensions</dt><dd>{result.width.toLocaleString()} × {result.height.toLocaleString()} px</dd><dt>File size</dt><dd>{formatImageFileSize(result.blob.size)}</dd><dt>Size comparison</dt><dd>{result.outcome}</dd></dl>
            </figure>
            <div className="flex min-h-48 flex-col justify-center rounded-xl border border-border bg-white p-4"><p className="text-sm font-semibold text-text">Measured file size</p><p className="mt-2 text-sm leading-relaxed text-muted">Original: {formatImageFileSize(selected.file.size)}<br />Converted: {formatImageFileSize(result.blob.size)}</p><p className="mt-3 text-sm leading-relaxed text-muted">{sizeComparison}</p></div>
          </div>
        </section>
      ) : null}

      <ToolPrivacyNote id="image-converter-privacy" message="Your images are converted in your browser. They are not uploaded to our servers." />
    </section>
  );
}
