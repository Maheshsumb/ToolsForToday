"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  assertImagesToPdfBatch,
  assertImagesToPdfPixels,
  createImagesPdf,
  inspectImagesToPdfBytes,
  MAX_IMAGES_TO_PDF_COUNT,
  MAX_IMAGES_TO_PDF_PIXELS,
  MAX_IMAGES_TO_PDF_TOTAL_PIXELS,
  readJpegExifOrientation,
  type ImagesPdfInput,
  type ImagesPdfMargin,
  type ImagesPdfOrientation,
  type ImagesPdfPageSize,
} from "@/lib/images-to-pdf";

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  format: "jpeg" | "png" | "webp";
  width: number;
  height: number;
}

interface PdfDownload {
  url: string;
  filename: string;
  pageCount: number;
  sizeBytes: number;
}

const allowedExtensions = ".jpg,.jpeg,.png,.webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function decodeImage(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "function") {
    return Promise.reject(new Error("This browser cannot decode images for PDF conversion."));
  }
  return createImageBitmap(file);
}

async function canvasPng(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImage(file);
  } catch {
    throw new Error(`${file.name} could not be decoded by this browser.`);
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("The browser could not prepare an image for the PDF.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("The browser could not encode an image for the PDF.")), "image/png");
    });
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export function ImagesToPdfTool() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [pageSize, setPageSize] = useState<ImagesPdfPageSize>("a4");
  const [orientation, setOrientation] = useState<ImagesPdfOrientation>("auto");
  const [margin, setMargin] = useState<ImagesPdfMargin>("small");
  const [download, setDownload] = useState<PdfDownload | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose JPG, PNG, or WebP images to begin.");
  const [isBusy, setIsBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef(false);
  const imagesRef = useRef<SelectedImage[]>([]);
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const downloadUrlRef = useRef<string | null>(null);

  const setCurrentImages = (next: SelectedImage[]) => {
    imagesRef.current = next;
    setImages(next);
  };

  const releaseDownload = () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  };

  const invalidateOutput = (message: string) => {
    operationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    releaseDownload();
    setErrors([]);
    setStatus(message);
  };

  useEffect(() => () => {
    operationRef.current += 1;
    controllerRef.current?.abort();
    for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl);
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  async function acceptFiles(fileList: FileList | readonly File[], replace = false) {
    if (busyRef.current) return;
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    const previous = replace ? [] : imagesRef.current;
    try {
      assertImagesToPdfBatch([...previous.map(({ file }) => file), ...incoming]);
      assertImagesToPdfPixels(previous.map(({ width, height }) => width * height));
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "The selected image batch exceeds a supported limit."]);
      setStatus("Images were not added.");
      return;
    }

    const operation = ++operationRef.current;
    busyRef.current = true;
    setIsBusy(true);
    setErrors([]);
    setStatus(`Checking ${incoming.length} ${incoming.length === 1 ? "image" : "images"} in your browser…`);
    const accepted: SelectedImage[] = [];
    const rejected: string[] = [];
    let pixels = previous.reduce((sum, image) => sum + image.width * image.height, 0);

    for (const file of incoming) {
      if (operation !== operationRef.current) break;
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const header = inspectImagesToPdfBytes(file, bytes);
        if (pixels + header.width * header.height > MAX_IMAGES_TO_PDF_TOTAL_PIXELS) {
          throw new Error(`The selected images exceed the ${MAX_IMAGES_TO_PDF_TOTAL_PIXELS / 1_000_000}-megapixel combined processing limit.`);
        }
        const bitmap = await decodeImage(file);
        if (operation !== operationRef.current) {
          bitmap.close();
          break;
        }
        const width = bitmap.width;
        const height = bitmap.height;
        bitmap.close();
        if (width * height > MAX_IMAGES_TO_PDF_PIXELS) throw new Error("The decoded image exceeds the 25-megapixel per-image limit.");
        if (pixels + width * height > MAX_IMAGES_TO_PDF_TOTAL_PIXELS) {
          throw new Error(`The selected images exceed the ${MAX_IMAGES_TO_PDF_TOTAL_PIXELS / 1_000_000}-megapixel combined processing limit.`);
        }
        const previewUrl = URL.createObjectURL(file);
        accepted.push({ id: crypto.randomUUID(), file, previewUrl, format: header.format, width, height });
        pixels += width * height;
      } catch (error) {
        rejected.push(`${file.name}: ${error instanceof Error ? error.message : "The image could not be decoded."}`);
      }
    }

    if (operation === operationRef.current) {
      if (replace) {
        for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl);
      }
      const next = [...previous, ...accepted];
      if (replace) next.splice(0, next.length, ...accepted);
      setCurrentImages(next);
      releaseDownload();
      setErrors(rejected);
      if (next.length > 0) {
        setStatus(`${next.length} image${next.length === 1 ? "" : "s"} ready. Arrange the page order and select PDF settings.`);
      } else {
        setStatus("No supported images were added. Choose valid JPG, PNG, or WebP files.");
      }
    } else {
      for (const image of accepted) URL.revokeObjectURL(image.previewUrl);
    }
    busyRef.current = false;
    setIsBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateImages(next: SelectedImage[], message: string) {
    invalidateOutput(message);
    const nextIds = new Set(next.map(({ id }) => id));
    for (const image of imagesRef.current) {
      if (!nextIds.has(image.id)) URL.revokeObjectURL(image.previewUrl);
    }
    setCurrentImages(next);
  }

  function moveImage(id: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateImages(next, "Image order changed. Convert again to update the PDF.");
  }

  function removeImage(id: string) {
    updateImages(images.filter((image) => image.id !== id), "Image removed. Convert again to update the PDF.");
  }

  function clearAll() {
    operationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    busyRef.current = false;
    setIsBusy(false);
    for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl);
    setCurrentImages([]);
    releaseDownload();
    setErrors([]);
    setPageSize("a4");
    setOrientation("auto");
    setMargin("small");
    setStatus("Selection cleared. Choose JPG, PNG, or WebP images to begin.");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function convert() {
    if (images.length === 0 || busyRef.current) return;
    const operation = ++operationRef.current;
    busyRef.current = true;
    setIsBusy(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    releaseDownload();
    setErrors([]);
    setStatus("Preparing images and creating your PDF in this browser…");
    try {
      const prepared: ImagesPdfInput[] = [];
      for (const image of images) {
        if (operation !== operationRef.current) return;
        setStatus(`Preparing image ${prepared.length + 1} of ${images.length} in this browser…`);
        if (image.format === "webp") {
          const normalized = await canvasPng(image.file);
          if (operation !== operationRef.current) return;
          prepared.push({ name: image.file.name, format: "png", ...normalized });
        } else {
          const bytes = new Uint8Array(await image.file.arrayBuffer());
          if (operation !== operationRef.current) return;
          const orientation = image.format === "jpeg" ? readJpegExifOrientation(bytes) : null;
          if (image.format === "jpeg" && orientation !== null && orientation !== 1) {
            const normalized = await canvasPng(image.file);
            if (operation !== operationRef.current) return;
            prepared.push({ name: image.file.name, format: "png", ...normalized });
          } else {
            prepared.push({ name: image.file.name, format: image.format, width: image.width, height: image.height, bytes });
          }
        }
      }
      const result = await createImagesPdf(prepared, { pageSize, orientation, margin }, controller.signal);
      if (operation !== operationRef.current) return;
      const url = URL.createObjectURL(result.blob);
      downloadUrlRef.current = url;
      setDownload({ url, filename: result.filename, pageCount: result.pageCount, sizeBytes: result.sizeBytes });
      setStatus(`Conversion complete: ${result.imageCount} images became ${result.pageCount} PDF pages.`);
    } catch (error) {
      if (operation === operationRef.current) {
        setErrors([error instanceof Error ? error.message : "The PDF could not be created. Try fewer or smaller images."]);
        setStatus("Conversion did not complete. Your selected images are still available to review.");
      }
    } finally {
      if (operation === operationRef.current) {
        controllerRef.current = null;
        busyRef.current = false;
        setIsBusy(false);
      }
    }
  }

  const totalBytes = images.reduce((sum, image) => sum + image.file.size, 0);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void acceptFiles(event.dataTransfer.files);
  }

  function changeSetting<T extends ImagesPdfPageSize | ImagesPdfOrientation | ImagesPdfMargin>(setter: (value: T) => void, value: T, name: string) {
    if (isBusy) return;
    invalidateOutput(`${name} changed. Convert again to update the PDF.`);
    setter(value);
  }

  return (
    <section aria-labelledby="images-to-pdf-workspace-heading" className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <h2 id="images-to-pdf-workspace-heading" className="font-heading text-xl font-semibold text-text">Images to PDF</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Your images are converted into PDF in your browser. They are not uploaded to our servers.</p>

      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={onDrop}
        className={`mt-5 rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? "border-deep-navy bg-surface-muted" : "border-[#AEBACB] bg-[#FAFBFD]"}`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <p className="text-sm font-medium text-text">Drop JPG, PNG, or WebP images here</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">Choose up to {MAX_IMAGES_TO_PDF_COUNT} images. Files are decoded and processed locally.</p>
          <input
            ref={inputRef}
            id="images-to-pdf-input"
            type="file"
            accept={allowedExtensions}
            multiple
            aria-label="Choose images to convert to PDF"
            disabled={isBusy}
            onChange={(event) => { void acceptFiles(event.currentTarget.files ?? [], replaceRef.current); event.currentTarget.value = ""; }}
            className="sr-only"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button type="button" disabled={isBusy} onClick={() => { replaceRef.current = false; inputRef.current?.click(); }}>{images.length ? "Add Images" : "Choose Images"}</Button>
            {images.length > 0 ? <Button type="button" variant="secondary" disabled={isBusy} onClick={() => { replaceRef.current = true; inputRef.current?.click(); }}>Replace Images</Button> : null}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">Limits: 25 MB per image, 100 MB combined, 25 megapixels per image, 40 megapixels combined, and 20 images per PDF. The output PDF is limited to 100 MB.</p>

      {errors.length > 0 ? <ul role="alert" className="mt-4 grid gap-2 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-4 py-3 text-sm font-medium text-error">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul> : null}

      {images.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-text">Images in PDF order ({images.length})</h3>
            <p className="text-sm text-muted">{formatBytes(totalBytes)} · {images.reduce((sum, image) => sum + image.width * image.height, 0).toLocaleString()} pixels total</p>
          </div>
          <ol aria-label="PDF page order" className="mt-3 grid gap-3">
            {images.map((image, index) => (
              <li key={image.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 sm:flex-nowrap sm:p-4">
                <span aria-label={`Page ${index + 1}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-text">{index + 1}</span>
                <Image src={image.previewUrl} alt={`Preview of ${image.file.name}`} width={72} height={72} unoptimized className="h-[72px] w-[72px] shrink-0 rounded-lg border border-border bg-white object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold text-text">{image.file.name}</p>
                  <p className="mt-1 text-xs text-muted">{image.width} × {image.height} px · {formatBytes(image.file.size)} · {image.format.toUpperCase()}</p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
                  <Button type="button" size="compact" variant="subtle" disabled={isBusy || index === 0} aria-label={`Move ${image.file.name} up`} onClick={() => moveImage(image.id, -1)}>Move Up</Button>
                  <Button type="button" size="compact" variant="subtle" disabled={isBusy || index === images.length - 1} aria-label={`Move ${image.file.name} down`} onClick={() => moveImage(image.id, 1)}>Move Down</Button>
                  <Button type="button" size="compact" variant="subtle" disabled={isBusy} aria-label={`Remove ${image.file.name}`} onClick={() => removeImage(image.id)}>Remove</Button>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium text-text">Page size
              <select aria-label="Page size" disabled={isBusy} value={pageSize} onChange={(event) => changeSetting(setPageSize, event.currentTarget.value as ImagesPdfPageSize, "Page size")} className="min-h-11 rounded-lg border border-border bg-white px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <option value="a4">A4</option><option value="letter">US Letter</option><option value="auto">Auto / Fit to Image</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-text">Orientation
              <select aria-label="Orientation" disabled={isBusy} value={orientation} onChange={(event) => changeSetting(setOrientation, event.currentTarget.value as ImagesPdfOrientation, "Orientation")} className="min-h-11 rounded-lg border border-border bg-white px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <option value="auto">Auto per image</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-text">Margins
              <select aria-label="Margins" disabled={isBusy} value={margin} onChange={(event) => changeSetting(setMargin, event.currentTarget.value as ImagesPdfMargin, "Margins")} className="min-h-11 rounded-lg border border-border bg-white px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                <option value="none">None</option><option value="small">Small (18 pt)</option><option value="medium">Medium (36 pt)</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" disabled={isBusy || images.length === 0} onClick={() => void convert()}>{isBusy ? "Creating PDF…" : "Convert to PDF"}</Button>
            {download ? <a href={download.url} download={download.filename} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-secondary px-4 py-2.5 font-medium text-action-secondary-foreground hover:bg-action-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Download PDF</a> : null}
            <Button type="button" variant="subtle" onClick={clearAll}>Clear All</Button>
          </div>
          {download ? <p className="mt-4 rounded-lg border border-[#A6D9C9] bg-[#EFF9F5] p-3 text-sm text-[#14563F]">{images.length} images converted · {download.pageCount} PDF pages · {formatBytes(download.sizeBytes)} · {download.filename}</p> : null}
        </>
      ) : null}

      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite" aria-atomic="true">{isBusy ? "Processing locally. " : ""}{status}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted">Auto / Fit to Image uses 72 PDF points per 96 decoded pixels; each page can have a different size. A4 and US Letter use fixed page dimensions. Fit / contain preserves aspect ratio, centers each image, and does not crop it. Effective printed size depends on the page size and image resolution.</p>
    </section>
  );
}
