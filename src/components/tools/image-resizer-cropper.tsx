"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import {
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  ImageProcessingError,
  getImageFormatLabel,
  getImageMimeType,
  parseImageFileHeader,
  validateImageFileMetadata,
  type ImageFormat,
} from "@/lib/image-compression";
import {
  CROP_RATIOS,
  WIDTH_PRESETS,
  applyCropRatio,
  calculateLockedSize,
  clampCropRect,
  cropRatioValue,
  moveCrop,
  outputFilename,
  validateCrop,
  validateProcessingMemory,
  validateOutputSize,
  type CropRatio,
  type CropRect,
} from "@/lib/image-resizing";

interface SourceImage {
  file: File;
  bitmap: ImageBitmap;
  url: string;
  width: number;
  height: number;
  format: ImageFormat;
}

interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  filename: string;
  format: ImageFormat;
}

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const OUTPUT_FORMATS: readonly { value: ImageFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WebP" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The image could not be processed. Try another image or smaller dimensions.";
}

export function ImageResizerCropper() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sourceRef = useRef<SourceImage | null>(null);
  const resultRef = useRef<ProcessedImage | null>(null);
  const operationRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; lastX: number; lastY: number; moving: boolean } | null>(null);

  const [source, setSource] = useState<SourceImage | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [cropRatio, setCropRatio] = useState<CropRatio>("free");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [ratioLocked, setRatioLocked] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(80);
  const [background, setBackground] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const invalidateResult = useCallback(() => {
    operationRef.current += 1;
    setBusy(false);
    const old = resultRef.current;
    if (old) URL.revokeObjectURL(old.url);
    resultRef.current = null;
    setResult(null);
  }, []);

  const releaseSource = useCallback(() => {
    const old = sourceRef.current;
    if (old) {
      old.bitmap.close();
      URL.revokeObjectURL(old.url);
    }
    sourceRef.current = null;
    setSource(null);
  }, []);

  useEffect(() => () => {
    operationRef.current += 1;
    if (sourceRef.current) {
      sourceRef.current.bitmap.close();
      URL.revokeObjectURL(sourceRef.current.url);
    }
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
  }, []);

  async function chooseFile(file?: File) {
    if (!file) return;
    invalidateResult();
    releaseSource();
    setCrop(null);
    setError("");
    setMessage("Checking and opening image…");
    const currentOperation = ++operationRef.current;
    try {
      if (file.size === 0) throw new ImageProcessingError("empty", "The selected file is empty.");
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) throw new ImageProcessingError("too-large", "Choose an image no larger than 25 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const header = parseImageFileHeader(file, bytes);
      validateImageFileMetadata(file, header, MAX_IMAGE_FILE_SIZE_BYTES, MAX_IMAGE_PIXELS);
      if (typeof createImageBitmap !== "function") throw new ImageProcessingError("decode-unavailable", "This browser cannot open images for editing.");
      const bitmap = await createImageBitmap(file);
      if (currentOperation !== operationRef.current) { bitmap.close(); return; }
      if (!Number.isSafeInteger(bitmap.width) || !Number.isSafeInteger(bitmap.height)
        || bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
        bitmap.close();
        throw new ImageProcessingError("too-many-pixels", "The decoded image exceeds the supported dimensions for this browser.");
      }
      const imageUrl = URL.createObjectURL(file);
      const selected: SourceImage = { file, bitmap, url: imageUrl, width: bitmap.width, height: bitmap.height, format: header.format };
      sourceRef.current = selected;
      setSource(selected);
      setCrop({ x: 0, y: 0, width: bitmap.width, height: bitmap.height });
      setWidth(bitmap.width);
      setHeight(bitmap.height);
      setFormat(header.format);
      setQuality(80);
      setMessage("Image ready. Select a crop area or keep the full image, then choose output dimensions.");
    } catch (caught) {
      if (currentOperation === operationRef.current) {
        setError(errorMessage(caught));
        setMessage("");
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void chooseFile(event.target.files?.[0]);
  }

  function currentCrop() {
    if (!source) return null;
    return crop ?? { x: 0, y: 0, width: source.width, height: source.height };
  }

  function updateCrop(next: CropRect) {
    if (!source) return;
    try {
      const bounded = clampCropRect(next, source.width, source.height);
      setCrop(bounded);
      invalidateResult();
      if (ratioLocked) {
        const size = calculateLockedSize("width", width, bounded.width / bounded.height);
        setHeight(size.height);
      }
      setError("");
    } catch (caught) { setError(errorMessage(caught)); }
  }

  function resizeDimension(axis: "width" | "height", value: number) {
    setError("");
    invalidateResult();
    if (axis === "width") setWidth(value);
    else setHeight(value);
    const selectedCrop = currentCrop();
    if (ratioLocked && selectedCrop && Number.isFinite(value) && value > 0) {
      const next = calculateLockedSize(axis, value, selectedCrop.width / selectedCrop.height);
      setWidth(next.width);
      setHeight(next.height);
    }
  }

  function applyWidthPreset(value: number) {
    const selectedCrop = currentCrop();
    const next = selectedCrop && ratioLocked ? calculateLockedSize("width", value, selectedCrop.width / selectedCrop.height) : { width: value, height };
    setWidth(next.width);
    setHeight(next.height);
    invalidateResult();
  }

  function toggleRatioLock(locked: boolean) {
    setRatioLocked(locked);
    const selectedCrop = currentCrop();
    if (locked && selectedCrop && width > 0) {
      const next = calculateLockedSize("width", width, selectedCrop.width / selectedCrop.height);
      setHeight(next.height);
    }
    invalidateResult();
  }

  function cropReset() {
    if (!source) return;
    setCrop({ x: 0, y: 0, width: source.width, height: source.height });
    setCropRatio("free");
    if (ratioLocked) { setWidth(source.width); setHeight(source.height); }
    invalidateResult();
    setError("");
  }

  function setRatio(value: CropRatio) {
    setCropRatio(value);
    if (!source) return;
    const selected = currentCrop();
    if (!selected) return;
    const adjusted = applyCropRatio(selected, value, source.width, source.height);
    setCrop(adjusted);
    if (ratioLocked) {
      const next = calculateLockedSize("width", Math.min(width, adjusted.width), adjusted.width / adjusted.height);
      setWidth(next.width);
      setHeight(next.height);
    }
    invalidateResult();
  }

  function imagePoint(clientX: number, clientY: number) {
    const image = imageRef.current;
    if (!image || !source) return null;
    const box = image.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(box.width, clientX - box.left)) * source.width / box.width,
      y: Math.max(0, Math.min(box.height, clientY - box.top)) * source.height / box.height,
      width: box.width,
      height: box.height,
    };
  }

  function onCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!source) return;
    const point = imagePoint(event.clientX, event.clientY);
    const selected = crop;
    if (!point) return;
    const moving = Boolean(selected && point.x >= selected.x && point.x <= selected.x + selected.width && point.y >= selected.y && point.y <= selected.y + selected.height);
    dragRef.current = { pointerId: event.pointerId, startX: point.x, startY: point.y, lastX: point.x, lastY: point.y, moving };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!moving) updateCrop({ x: point.x, y: point.y, width: 1, height: 1 });
  }

  function onCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!source || !drag || drag.pointerId !== event.pointerId) return;
    const point = imagePoint(event.clientX, event.clientY);
    const selected = currentCrop();
    if (!point || !selected) return;
    if (drag.moving) {
      updateCrop(moveCrop(selected, point.x - drag.lastX, point.y - drag.lastY, source.width, source.height));
      drag.lastX = point.x;
      drag.lastY = point.y;
      return;
    }
    const left = Math.min(drag.startX, point.x);
    const top = Math.min(drag.startY, point.y);
    let cropWidth = Math.abs(point.x - drag.startX);
    let cropHeight = Math.abs(point.y - drag.startY);
    const ratio = cropRatioValue(cropRatio);
    if (ratio) {
      if (cropWidth / Math.max(cropHeight, 1) > ratio) cropWidth = cropHeight * ratio;
      else cropHeight = cropWidth / ratio;
    }
    const x = Math.min(left, source.width - cropWidth);
    const y = Math.min(top, source.height - cropHeight);
    if (cropWidth >= 1 && cropHeight >= 1) updateCrop({ x, y, width: cropWidth, height: cropHeight });
  }

  function onCropPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      if (!drag.moving && ratioLocked && crop) {
        const next = calculateLockedSize("width", crop.width, crop.width / crop.height);
        setWidth(next.width);
        setHeight(next.height);
      }
      dragRef.current = null;
    }
  }

  async function processImage() {
    const selected = sourceRef.current;
    const selectedCrop = crop;
    if (!selected) return;
    if (!selectedCrop) {
      setError("Select a crop area or reset the crop to the full image before creating a preview.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("Creating preview…");
    invalidateResult();
    setBusy(true);
    const currentOperation = ++operationRef.current;
    try {
      const outputSize = validateOutputSize(width, height);
      const sourceCrop = validateCrop(selectedCrop, selected.width, selected.height);
      validateProcessingMemory(selected.width, selected.height, outputSize.width, outputSize.height);
      const canvas = document.createElement("canvas");
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;
      const context = canvas.getContext("2d", { alpha: format !== "jpeg" });
      if (!context) throw new ImageProcessingError("encode-unavailable", "This browser cannot create an image preview.");
      if (format === "jpeg") {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(selected.bitmap, sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height, 0, 0, outputSize.width, outputSize.height);
      const mime = getImageMimeType(format);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((encoded) => encoded ? resolve(encoded) : reject(new ImageProcessingError("encode-failed", "The browser could not encode this image.")), mime, format === "png" ? undefined : quality / 100));
      if (blob.type !== mime) throw new ImageProcessingError("unsupported-output", `This browser cannot export ${getImageFormatLabel(format)} images. Choose another output format.`);
      if (currentOperation !== operationRef.current) return;
      const url = URL.createObjectURL(blob);
      const finalResult: ProcessedImage = { blob, url, width: outputSize.width, height: outputSize.height, filename: outputFilename(selected.file.name, format), format };
      resultRef.current = finalResult;
      setResult(finalResult);
      setMessage("Preview ready. Download the latest image below.");
    } catch (caught) {
      if (currentOperation === operationRef.current) {
        setError(errorMessage(caught));
        setMessage("");
      }
    } finally {
      if (currentOperation === operationRef.current) setBusy(false);
    }
  }

  function download() {
    if (!resultRef.current) return;
    const anchor = document.createElement("a");
    anchor.href = resultRef.current.url;
    anchor.download = resultRef.current.filename;
    anchor.click();
  }

  function clearAll() {
    invalidateResult();
    releaseSource();
    setCrop(null);
    setCropRatio("free");
    setWidth(0);
    setHeight(0);
    setRatioLocked(true);
    setMessage("");
    setError("");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    if (source && imageRef.current) {
      const img = imageRef.current;
      if (!img.complete) return;
      if (img.naturalWidth !== source.width || img.naturalHeight !== source.height) {
        setError("The displayed image dimensions do not match the decoded source.");
      }
    }
  }, [source]);

  const visibleCrop = source && crop ? crop : null;

  return (
    <section aria-label="Image Resizer and Cropper" className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <div
        onDragOver={(event) => { event.preventDefault(); setDraggingFile(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingFile(false); }}
        onDrop={(event) => { event.preventDefault(); setDraggingFile(false); void chooseFile(event.dataTransfer.files?.[0]); }}
        className={`rounded-2xl border border-dashed p-5 text-center sm:p-7 ${draggingFile ? "border-deep-navy bg-surface-muted" : "border-[#AEBACB] bg-[#FAFBFD]"}`}
      >
        <label htmlFor="resizer-image-input" className="block text-sm font-semibold text-text">Choose a JPG, PNG, or WebP image</label>
        <p className="mt-1 text-sm text-muted">Drop one image here or select it from your device. Maximum 25 MB and 25 megapixels.</p>
        <input ref={inputRef} id="resizer-image-input" type="file" accept={ACCEPT} onChange={onFileChange} className="sr-only" />
        <label htmlFor="resizer-image-input" className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring">Choose image</label>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-3 py-2 text-sm font-medium text-error">{error}</p> : null}
      {message ? <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">{message}</p> : null}

      {source ? <>
        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-text">Crop image</h2>
            <p className="mt-1 text-sm text-muted">Drag across the image to select a crop. Drag inside the selection to reposition it. Numeric controls below are keyboard accessible.</p>
            <div className="mt-3 flex min-h-52 max-h-[460px] items-center justify-center overflow-hidden rounded-xl bg-[#111827] p-2">
              <div className="relative inline-block max-h-[440px] max-w-full select-none touch-none" onPointerDown={onCropPointerDown} onPointerMove={onCropPointerMove} onPointerUp={onCropPointerUp} onPointerCancel={onCropPointerUp}>
                <Image ref={imageRef} src={source.url} alt={`Original image preview, ${source.width} by ${source.height} pixels`} width={source.width} height={source.height} unoptimized draggable={false} className="block max-h-[440px] max-w-full object-contain" />
                {visibleCrop ? <div aria-hidden="true" className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,.48)]" style={{ left: `${visibleCrop.x / source.width * 100}%`, top: `${visibleCrop.y / source.height * 100}%`, width: `${visibleCrop.width / source.width * 100}%`, height: `${visibleCrop.height / source.height * 100}%` }} /> : null}
              </div>
            </div>
            <Button variant="secondary" onClick={() => { setCrop(null); invalidateResult(); }} className="mt-3 min-h-11">Select a new crop area</Button>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["x", "y", "width", "height"] as const).map((field) => <label key={field} className="text-sm font-medium text-text">Crop {field === "x" ? "left" : field === "y" ? "top" : field} (px)<input type="number" min={field === "x" || field === "y" ? 0 : 1} max={field === "x" || field === "width" ? source.width : source.height} value={crop?.[field] ?? ""} onChange={(event) => { const value = Number(event.target.value); if (!Number.isFinite(value)) return; const base = crop ?? { x: 0, y: 0, width: source.width, height: source.height }; updateCrop({ ...base, [field]: value }); }} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /></label>)}
            </div>
            <label className="mt-4 block text-sm font-medium text-text">Crop aspect ratio<select value={cropRatio} onChange={(event) => setRatio(event.target.value as CropRatio)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:max-w-sm">{CROP_RATIOS.map((value) => <option key={value} value={value}>{value === "free" ? "Free" : value === "1:1" ? "1:1 Square" : value}</option>)}</select></label>
            <Button variant="secondary" onClick={cropReset} className="mt-3 min-h-11">Reset crop to full image</Button>
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5">
            <h2 className="font-heading text-lg font-semibold text-text">Resize and export</h2>
            <p className="mt-1 text-sm text-muted">Original: {source.width} × {source.height} px · {getImageFormatLabel(source.format)} · {formatBytes(source.file.size)}</p>
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-medium text-text"><input type="checkbox" checked={ratioLocked} onChange={(event) => toggleRatioLock(event.target.checked)} className="h-5 w-5 accent-[#0F766E]" />Lock aspect ratio</label>
            <p className="mt-1 text-xs leading-relaxed text-muted">{ratioLocked ? `Ratio follows the ${crop?.width ?? source.width} × ${crop?.height ?? source.height} px crop.` : "Unlocked dimensions may stretch or distort the image."} Upscaling is allowed but cannot restore missing detail.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-text">Width (px)<input type="number" min="1" max="8000" step="1" value={width || ""} onChange={(event) => resizeDimension("width", Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /></label>
              <label className="text-sm font-medium text-text">Height (px)<input type="number" min="1" max="8000" step="1" value={height || ""} onChange={(event) => resizeDimension("height", Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{WIDTH_PRESETS.map((preset) => <Button key={preset} variant="subtle" size="compact" onClick={() => applyWidthPreset(preset)} className="min-h-10">{preset} px wide</Button>)}<Button variant="subtle" size="compact" onClick={() => { setWidth(source.width); setHeight(source.height); invalidateResult(); }} className="min-h-10">Reset to original size</Button></div>
            <label className="mt-4 block text-sm font-medium text-text">Output format<select value={format} onChange={(event) => { setFormat(event.target.value as ImageFormat); invalidateResult(); }} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{OUTPUT_FORMATS.map((option) => <option key={option.value} value={option.value}>{option.label}{option.value === source.format ? " (original format)" : ""}</option>)}</select></label>
            {format === "jpeg" ? <><label className="mt-4 block text-sm font-medium text-text">JPEG quality: {quality}%<input type="range" min="10" max="100" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); invalidateResult(); }} className="mt-2 w-full accent-[#0F766E]" /></label><label className="mt-3 block text-sm font-medium text-text">Background for transparent pixels<input type="color" value={background} onChange={(event) => { setBackground(event.target.value); invalidateResult(); }} className="ml-3 h-10 w-14 align-middle" /></label><p className="mt-2 text-xs text-muted">JPEG has no transparency; transparent areas use this background.</p></> : null}
            {format === "webp" ? <label className="mt-4 block text-sm font-medium text-text">WebP quality: {quality}%<input type="range" min="10" max="100" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); invalidateResult(); }} className="mt-2 w-full accent-[#0F766E]" /></label> : null}
            {format === "png" ? <p className="mt-3 text-xs text-muted">PNG uses browser lossless encoding; quality is not adjustable. Transparency is preserved.</p> : null}
            <p className="mt-3 text-xs leading-relaxed text-muted">Re-encoding may remove EXIF metadata or embedded color profiles.</p>
            <Button onClick={() => { void processImage(); }} disabled={busy} className="mt-5 min-h-11 w-full">{busy ? "Processing…" : "Create preview"}</Button>
            <Button variant="secondary" onClick={clearAll} className="mt-2 min-h-11 w-full">Clear image</Button>
          </div>
        </div>

        {result ? <section aria-labelledby="result-heading" className="mt-6 rounded-xl border border-border bg-surface p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="result-heading" className="font-heading text-lg font-semibold text-text">Edited image preview</h2><p className="mt-1 text-sm text-muted">{result.width} × {result.height} px · {getImageFormatLabel(result.format)} · {formatBytes(result.blob.size)}</p></div><Button onClick={download} className="min-h-11">Download Image</Button></div><div className="mt-4 flex max-h-[420px] justify-center overflow-hidden rounded-lg bg-[linear-gradient(45deg,#ddd_25%,transparent_25%),linear-gradient(-45deg,#ddd_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ddd_75%),linear-gradient(-45deg,transparent_75%,#ddd_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"><Image src={result.url} alt={`Edited image, ${result.width} by ${result.height} pixels`} width={result.width} height={result.height} unoptimized className="max-h-[420px] max-w-full object-contain" /></div><p className="mt-3 text-sm text-muted">File: {result.filename}. Source image processing stays in this browser.</p></section> : null}
      </> : null}

      <ToolPrivacyNote id="image-resizer-privacy" message="Your images are resized and cropped in your browser. They are not uploaded to our servers." />
    </section>
  );
}
