"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolStatus, type ToolStatusState } from "@/components/tools/tool-status";
import {
  compressImageFile,
  DEFAULT_IMAGE_QUALITY,
  formatImageFileSize,
  getCompressedFilename,
  getCompressionMetrics,
  getImageErrorMessage,
  getImageFormatLabel,
  ImageProcessingError,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_QUALITY,
  MIN_IMAGE_QUALITY,
  type ImageFormat,
  type ImageHeader,
  parseImageFileHeader,
  validateImageFileMetadata,
} from "@/lib/image-compression";

const allowedTypes = [
  { label: "JPEG", mimeTypes: ["image/jpeg"], extensions: [".jpg", ".jpeg"] },
  { label: "PNG", mimeTypes: ["image/png"], extensions: [".png"] },
  { label: "WebP", mimeTypes: ["image/webp"], extensions: [".webp"] },
] as const;

interface SelectedImage {
  file: File;
  header: ImageHeader;
  previewUrl: string;
}

interface ProcessedImage {
  blob: Blob;
  format: ImageFormat;
  width: number;
  height: number;
  previewUrl: string;
  filename: string;
  differenceBytes: number;
  percentage: number;
  outcome: "reduced" | "same" | "larger";
}

export function ImageCompressor() {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [quality, setQuality] = useState(DEFAULT_IMAGE_QUALITY);
  const [status, setStatus] = useState<{ state: ToolStatusState; message: string }>({
    state: "idle",
    message: "Choose one JPEG, PNG, or WebP image to begin.",
  });
  const [dropzoneKey, setDropzoneKey] = useState(0);
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

  useEffect(() => () => {
    operationId.current += 1;
    releaseOriginal();
    releaseResult();
  }, [releaseOriginal, releaseResult]);

  const resetSelectedImage = useCallback((message = "Choose one JPEG, PNG, or WebP image to begin.") => {
    operationId.current += 1;
    releaseOriginal();
    releaseResult();
    setSelected(null);
    setResult(null);
    setQuality(DEFAULT_IMAGE_QUALITY);
    setStatus({ state: "idle", message });
  }, [releaseOriginal, releaseResult]);

  const selectImage = useCallback(async (files: readonly File[]) => {
    if (files.length === 0) {
      resetSelectedImage();
      return;
    }

    const operation = ++operationId.current;
    releaseOriginal();
    releaseResult();
    setSelected(null);
    setResult(null);
    setStatus({ state: "processing", message: "Checking the file format, dimensions, and image data…" });

    try {
      const file = files[0];
      if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) throw new ImageProcessingError("too-large", `Choose an image no larger than ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)}.`);
      const header = validateImageFileMetadata(file, parseImageFileHeader(file, new Uint8Array(await file.arrayBuffer())));
      if (operation !== operationId.current) return;

      let decoded: ImageBitmap | null = null;
      if (typeof createImageBitmap === "function") {
        try {
          decoded = await createImageBitmap(file);
          if (!decoded.width || !decoded.height) throw new ImageProcessingError("decode-failed", "The browser could not read the image dimensions.");
          if (decoded.width * decoded.height > MAX_IMAGE_PIXELS) throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
          header.width = decoded.width;
          header.height = decoded.height;
        } catch (error) {
          if (error instanceof ImageProcessingError) throw error;
          throw new ImageProcessingError("decode-failed", "The image is corrupt or cannot be decoded by this browser.");
        } finally {
          decoded?.close();
        }
      } else {
        const dimensions = await readImageElementDimensions(file);
        if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new ImageProcessingError("too-many-pixels", `The decoded image exceeds the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel limit.`);
        header.width = dimensions.width;
        header.height = dimensions.height;
      }

      if (operation !== operationId.current) return;
      const previewUrl = URL.createObjectURL(file);
      originalUrl.current = previewUrl;
      setSelected({ file, header, previewUrl });
      setStatus({ state: "ready", message: `${getImageFormatLabel(header.format)} image ready. Choose a quality and optimize it. Processing stays in this browser.` });
    } catch (error) {
      if (operation !== operationId.current) return;
      setStatus({ state: "error", message: getImageErrorMessage(error) });
    }
  }, [releaseOriginal, releaseResult, resetSelectedImage]);

  async function optimize() {
    if (!selected || status.state === "processing") return;
    const operation = ++operationId.current;
    releaseResult();
    setResult(null);
    setStatus({ state: "processing", message: "Optimizing the image locally in your browser…" });

    try {
      const compressed = await compressImageFile(selected.file, quality);
      if (operation !== operationId.current) return;
      const metrics = getCompressionMetrics(selected.file.size, compressed.blob.size);
      const previewUrl = URL.createObjectURL(compressed.blob);
      resultUrl.current = previewUrl;
      setResult({
        ...compressed,
        previewUrl,
        filename: getCompressedFilename(selected.file.name, compressed.format),
        differenceBytes: metrics.differenceBytes,
        percentage: metrics.percentage,
        outcome: metrics.outcome,
      });

      if (metrics.outcome === "reduced") {
        setStatus({ state: "success", message: `Image optimized. The output is ${formatImageFileSize(metrics.differenceBytes)} smaller (${metrics.percentage}% reduction).` });
      } else if (metrics.outcome === "larger") {
        setStatus({ state: "ready", message: `No file-size saving: the output is ${formatImageFileSize(Math.abs(metrics.differenceBytes))} larger (${metrics.percentage}% increase). Keep the original if that is preferable.` });
      } else {
        setStatus({ state: "ready", message: "The output has the same file size as the original (0% reduction)." });
      }
    } catch (error) {
      if (operation !== operationId.current) return;
      setStatus({ state: "error", message: getImageErrorMessage(error) });
    }
  }

  function changeQuality(value: number) {
    setQuality(value);
    operationId.current += 1;
    releaseResult();
    setResult(null);
    if (selected) setStatus({ state: "ready", message: "Quality changed. Optimize the image again to create a current download." });
  }

  function clearAll() {
    resetSelectedImage();
    setDropzoneKey((key) => key + 1);
  }

  const metrics = selected && result ? getCompressionMetrics(selected.file.size, result.blob.size) : null;
  const supportsQuality = selected?.header.format !== "png";

  return (
    <section aria-labelledby="image-compressor-workspace-heading" className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <div className="mb-6">
        <h2 id="image-compressor-workspace-heading" className="font-heading text-xl font-semibold text-text">Compress one image</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Choose a JPEG, PNG, or WebP image. The browser decodes and re-encodes it at its existing pixel dimensions; no image is uploaded.</p>
      </div>

      <FileDropzone
        key={dropzoneKey}
        label="Choose an image"
        instructions={`Select or drop one non-animated JPEG, PNG, or WebP image. Maximum ${formatImageFileSize(MAX_IMAGE_FILE_SIZE_BYTES)} and 25 million decoded pixels.`}
        allowedTypes={allowedTypes}
        maxFileSizeBytes={MAX_IMAGE_FILE_SIZE_BYTES}
        onSelectionChange={(files) => { void selectImage(files); }}
      />

      {selected ? (
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
          <figure className="min-w-0 rounded-xl border border-border bg-surface-muted/45 p-4">
            <figcaption className="mb-3 text-sm font-semibold text-text">Original image</figcaption>
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
              <NextImage src={selected.previewUrl} alt={`Original preview of ${selected.file.name}`} width={selected.header.width} height={selected.header.height} unoptimized className="max-h-72 w-full object-contain" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 break-words text-xs text-muted">
              <dt>File size</dt><dd>{formatImageFileSize(selected.file.size)}</dd>
              <dt>Dimensions</dt><dd>{selected.header.width.toLocaleString()} × {selected.header.height.toLocaleString()} px</dd>
              <dt>Format</dt><dd>{getImageFormatLabel(selected.header.format)}</dd>
            </dl>
          </figure>

          <div className="min-w-0 rounded-xl border border-border bg-surface-muted/45 p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Optimized image</h3>
            {result ? (
              <>
                <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                  <NextImage src={result.previewUrl} alt={`Optimized preview of ${result.filename}`} width={result.width} height={result.height} unoptimized className="max-h-72 w-full object-contain" />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 break-words text-xs text-muted">
                  <dt>Output size</dt><dd>{formatImageFileSize(result.blob.size)}</dd>
                  <dt>Dimensions</dt><dd>{result.width.toLocaleString()} × {result.height.toLocaleString()} px</dd>
                  <dt>Output format</dt><dd>{getImageFormatLabel(result.format)}</dd>
                </dl>
                {metrics ? (
                  <p className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${metrics.outcome === "reduced" ? "bg-[#EFF9F5] text-[#14563F]" : "bg-[#FFF8E8] text-[#704A00]"}`}>
                    {metrics.outcome === "reduced" ? `Saved ${formatImageFileSize(metrics.differenceBytes)} (${metrics.percentage}%)`
                      : metrics.outcome === "larger" ? `Output is ${formatImageFileSize(Math.abs(metrics.differenceBytes))} larger (${metrics.percentage}% increase); no size saving.`
                        : "Same size as original (0% reduction)."}
                  </p>
                ) : null}
                {result.outcome === "larger" ? <p className="mt-2 text-xs leading-relaxed text-muted">The original remains available above. You may keep it instead of downloading this larger output.</p> : null}
                <a href={result.previewUrl} download={result.filename} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Download Image</a>
              </>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-white px-4 text-center text-sm text-muted">Optimize the selected image to compare its measured output.</div>
            )}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="mt-6 grid min-w-0 gap-5 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <label htmlFor="image-quality" className="flex items-center justify-between gap-3 text-sm font-semibold text-text">
              <span>Encoding quality</span><span>{quality}%</span>
            </label>
            <input
              id="image-quality"
              type="range"
              min={MIN_IMAGE_QUALITY}
              max={MAX_IMAGE_QUALITY}
              step={5}
              value={quality}
              disabled={!supportsQuality || status.state === "processing"}
              aria-describedby="image-quality-help"
              onChange={(event) => changeQuality(Number(event.target.value))}
              className="mt-3 min-h-8 w-full accent-[#176A8B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p id="image-quality-help" className="mt-1 text-xs leading-relaxed text-muted">
              {supportsQuality ? "JPEG and WebP quality controls affect encoding, not the promised percentage of file-size reduction. Lower quality can make a smaller file with more visible image changes." : "PNG encoding through the browser canvas is lossless and does not use this quality control; PNG output may not be smaller."}
            </p>
          </div>
          <Button onClick={() => { void optimize(); }} disabled={!selected || status.state === "processing"} className="min-h-11 w-full sm:w-auto">
            {status.state === "processing" ? "Processing…" : "Optimize image"}
          </Button>
        </div>
      ) : null}

      <div className="mt-5">
        <ToolStatus state={status.state} message={status.message} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={clearAll} className="min-h-11">Clear</Button>
        {result ? <span className="text-sm text-muted">Latest result: {result.filename}</span> : null}
      </div>

      <ToolPrivacyNote id="image-compressor-privacy" message="Your images are processed in your browser. They are not uploaded to our servers." />
    </section>
  );
}

async function readImageElementDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof Image === "undefined") throw new Error("This browser cannot decode images for compression.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The image is corrupt or cannot be read by this browser."));
    });
    image.src = objectUrl;
    await loaded;
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
