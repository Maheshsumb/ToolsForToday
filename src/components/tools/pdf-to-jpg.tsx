"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  assertPdfJpgPixelBudget,
  createPdfJpgZip,
  estimatePdfJpgDimensions,
  getPdfJpgPageSelection,
  inspectPdfJpgBytes,
  isCompleteJpeg,
  PDF_TO_JPG_DEFAULT_QUALITY,
  PDF_TO_JPG_DEFAULT_RANGE,
  PDF_TO_JPG_MAX_OUTPUT_BYTES,
  PDF_TO_JPG_MAX_SELECTED_PAGES,
  PDF_TO_JPG_MAX_SOURCE_PAGES,
  PDF_TO_JPG_VERSION,
  PDF_TO_JPG_WORKER_URL,
  pdfJpgPageFilename,
  resolutionDpi,
  resolutionScale,
  validatePdfJpgQuality,
  type PdfJpgResolution,
} from "@/lib/pdf-to-jpg";

interface PdfSource {
  name: string;
  size: number;
  pageCount: number;
}

interface PageOutput {
  sourcePage: number;
  width: number;
  height: number;
  sizeBytes: number;
  filename: string;
}

interface ConversionResult {
  downloadUrl: string;
  previewUrl: string;
  filename: string;
  downloadLabel: string;
  pageCount: number;
  sizeBytes: number;
  pages: PageOutput[];
}

type PdfDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;
type PdfRenderTask = import("pdfjs-dist").RenderTask;
type PdfLoadingTask = import("pdfjs-dist").PDFDocumentLoadingTask;

const PAGE_RANGE_EXAMPLE = "1,3,5-7";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && /password|encrypt/i.test(`${error.name} ${error.message}`)) {
    return "Encrypted or password-protected PDFs are not supported. Remove the password protection before choosing this file.";
  }
  if (error instanceof Error && /InvalidPDFException|MissingPDFException|UnexpectedResponseException|invalid pdf structure/i.test(`${error.name} ${error.message}`)) {
    return "This PDF could not be read. It may be corrupt, incomplete, or use a PDF feature this browser renderer does not support.";
  }
  if (error instanceof Error && /worker/i.test(error.message)) {
    return "The local PDF rendering worker could not start. Refresh the page and try again.";
  }
  return error instanceof Error ? error.message : "This PDF could not be processed. Try another supported PDF.";
}

function pdfJsLoadingOptions(data: Uint8Array) {
  return {
    data,
    isEvalSupported: false,
    enableXfa: false,
    useWasm: false,
    useWorkerFetch: false,
    stopAtErrors: true,
    disableAutoFetch: true,
    disableStream: true,
    verbosity: 0,
  } as const;
}

export function PdfToJpgTool() {
  const [source, setSource] = useState<PdfSource | null>(null);
  const [selectionMode, setSelectionMode] = useState<"all" | "selected">("all");
  const [pageRange, setPageRange] = useState("1");
  const [resolution, setResolution] = useState<PdfJpgResolution>("high");
  const [quality, setQuality] = useState(PDF_TO_JPG_DEFAULT_QUALITY);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose a PDF to convert its pages into JPG images.");
  const [isBusy, setIsBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<PdfSource | null>(null);
  const documentRef = useRef<PdfDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PdfLoadingTask | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const operationRef = useRef(0);
  const busyRef = useRef(false);
  const resultUrlsRef = useRef<string[]>([]);

  function releaseResult() {
    for (const url of resultUrlsRef.current) URL.revokeObjectURL(url);
    resultUrlsRef.current = [];
    setResult(null);
  }

  function cancelRender() {
    try { renderTaskRef.current?.cancel(); } catch { /* Already completed. */ }
    renderTaskRef.current = null;
  }

  function invalidateResult(message?: string) {
    operationRef.current += 1;
    cancelRender();
    releaseResult();
    setErrors([]);
    if (message) setStatus(message);
  }

  function releaseSource() {
    documentRef.current = null;
    const loadingTask = loadingTaskRef.current;
    loadingTaskRef.current = null;
    if (loadingTask) void loadingTask.destroy().catch(() => undefined);
    sourceRef.current = null;
  }

  function clearAll() {
    operationRef.current += 1;
    busyRef.current = false;
    setIsBusy(false);
    cancelRender();
    releaseResult();
    releaseSource();
    setSource(null);
    setSelectionMode("all");
    setPageRange("1");
    setResolution("high");
    setQuality(PDF_TO_JPG_DEFAULT_QUALITY);
    setErrors([]);
    setStatus("Selection cleared. Choose a PDF to convert its pages into JPG images.");
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => () => {
    operationRef.current += 1;
    cancelRender();
    for (const url of resultUrlsRef.current) URL.revokeObjectURL(url);
    resultUrlsRef.current = [];
    releaseSource();
  }, []);

  async function chooseFile(file: File | undefined) {
    if (!file || busyRef.current) return;
    const operation = ++operationRef.current;
    cancelRender();
    releaseResult();
    releaseSource();
    setSource(null);
    setErrors([]);
    busyRef.current = true;
    setIsBusy(true);
    setStatus("Checking the PDF structure and page count in your browser…");
    try {
      if (file.size === 0) throw new Error("This file is empty.");
      if (file.size > 25 * 1024 * 1024) throw new Error("This PDF is larger than the 25 MB limit.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (operation !== operationRef.current) return;
      inspectPdfJpgBytes(bytes, file.name);
      const pdfjs = await import("pdfjs-dist");
      if (operation !== operationRef.current) return;
      if (pdfjs.version !== PDF_TO_JPG_VERSION) {
        throw new Error("The PDF renderer and its local worker versions do not match. Refresh the page and try again.");
      }
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(PDF_TO_JPG_WORKER_URL, window.location.origin).toString();
      const loadingTask = pdfjs.getDocument(pdfJsLoadingOptions(bytes));
      loadingTaskRef.current = loadingTask;
      const document = await loadingTask.promise;
      if (operation !== operationRef.current) {
        await loadingTask.destroy();
        return;
      }
      if (document.numPages < 1) throw new Error("This PDF does not contain any usable pages.");
      if (document.numPages > PDF_TO_JPG_MAX_SOURCE_PAGES) {
        throw new Error(`This PDF exceeds the ${PDF_TO_JPG_MAX_SOURCE_PAGES}-page source limit.`);
      }
      documentRef.current = document;
      const nextSource = { name: file.name, size: file.size, pageCount: document.numPages };
      sourceRef.current = nextSource;
      setSource(nextSource);
      const needsPageRange = document.numPages > PDF_TO_JPG_MAX_SELECTED_PAGES;
      setSelectionMode(needsPageRange ? "selected" : "all");
      setPageRange(needsPageRange ? PDF_TO_JPG_DEFAULT_RANGE : "1");
      setStatus(`${document.numPages} PDF ${document.numPages === 1 ? "page is" : "pages are"} ready. Choose pages, resolution, and JPG quality.`);
    } catch (error) {
      if (operation === operationRef.current) {
        releaseSource();
        setErrors([getErrorMessage(error)]);
        setStatus("The PDF was not added.");
      }
    } finally {
      if (operation === operationRef.current) {
        busyRef.current = false;
        setIsBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }

  function updateSelectionMode(value: "all" | "selected") {
    invalidateResult("Page selection changed. Convert again to create a new result.");
    setSelectionMode(value);
    if (value === "selected" && pageRange === "1" && (source?.pageCount ?? 0) > 1) setPageRange("1-2");
  }

  function updateRange(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult("Page selection changed. Convert again to create a new result.");
    setPageRange(event.currentTarget.value);
  }

  function updateResolution(value: PdfJpgResolution) {
    invalidateResult("Resolution changed. Convert again to create a new result.");
    setResolution(value);
  }

  function updateQuality(value: number) {
    invalidateResult("JPG quality changed. Convert again to create a new result.");
    setQuality(value);
  }

  let selectedPages: number[] = [];
  let selectionError = "";
  if (source) {
    try {
      selectedPages = getPdfJpgPageSelection(selectionMode, pageRange, source.pageCount);
    } catch (error) {
      selectionError = error instanceof Error ? error.message : "Enter a valid page selection.";
    }
  }

  async function convert() {
    const document = documentRef.current;
    if (!source || !document || busyRef.current) return;
    let pages: number[];
    try {
      pages = getPdfJpgPageSelection(selectionMode, pageRange, source.pageCount);
    } catch (error) {
      setErrors([getErrorMessage(error)]);
      setStatus("The selected pages could not be converted.");
      return;
    }

    const operation = ++operationRef.current;
    busyRef.current = true;
    setIsBusy(true);
    cancelRender();
    releaseResult();
    setErrors([]);
    setStatus("Checking page dimensions before rendering…");
    const madeUrls: string[] = [];
    const outputs: PageOutput[] = [];
    const archiveFiles: { filename: string; bytes: Uint8Array }[] = [];
    let resultPublished = false;
    let previewUrl = "";
    let singleDownloadUrl = "";
    let singleBlob: Blob | null = null;

    try {
      const pageDimensions = [];
      for (const pageNumber of pages) {
        if (operation !== operationRef.current) return;
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        pageDimensions.push(estimatePdfJpgDimensions(viewport.width, viewport.height, resolution));
      }
      assertPdfJpgPixelBudget(pageDimensions);

      for (const [index, pageNumber] of pages.entries()) {
        if (operation !== operationRef.current) return;
        setStatus(`Rendering page ${pageNumber} (${index + 1} of ${pages.length}) at ${resolutionDpi(resolution)} DPI equivalent…`);
        const page = await document.getPage(pageNumber);
        const scale = resolutionScale(resolution);
        const viewport = page.getViewport({ scale });
        const dimensions = pageDimensions[index];
        if (!dimensions) throw new Error("A page dimension could not be calculated.");
        const canvas = window.document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("The browser could not allocate a canvas for this page. Choose a lower resolution.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const pdfjs = await import("pdfjs-dist");
        let blob: Blob;
        try {
          const renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport,
            background: "rgb(255, 255, 255)",
            annotationMode: pdfjs.AnnotationMode.DISABLE,
          });
          renderTaskRef.current = renderTask;
          await renderTask.promise;
          renderTaskRef.current = null;
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((value) => value ? resolve(value) : reject(new Error(`Page ${pageNumber} could not be encoded as a JPG.`)), "image/jpeg", validatePdfJpgQuality(quality) / 100);
          });
        } finally {
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();
        }
        if (operation !== operationRef.current) return;
        if (blob.type !== "image/jpeg") throw new Error(`Page ${pageNumber} was not encoded as JPEG. No partial download was kept.`);
        if (blob.size > PDF_TO_JPG_MAX_OUTPUT_BYTES) throw new Error("A generated JPG exceeds the 100 MB output limit. Choose a lower resolution or quality.");
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (!isCompleteJpeg(bytes)) throw new Error(`Page ${pageNumber} did not produce a complete JPG. No partial download was kept.`);
        const filename = pdfJpgPageFilename(pageNumber);
        if (index === 0) {
          previewUrl = URL.createObjectURL(blob);
          madeUrls.push(previewUrl);
        }
        outputs.push({ sourcePage: pageNumber, width: dimensions.width, height: dimensions.height, sizeBytes: blob.size, filename });
        if (pages.length === 1) {
          singleBlob = blob;
          singleDownloadUrl = previewUrl;
        } else {
          archiveFiles.push({ filename, bytes });
        }
      }

      if (operation !== operationRef.current) return;
      let downloadUrl = singleDownloadUrl;
      let filename = outputs[0]?.filename ?? "page-001.jpg";
      let sizeBytes = singleBlob?.size ?? 0;
      if (pages.length > 1) {
        const archive = createPdfJpgZip(archiveFiles);
        downloadUrl = URL.createObjectURL(archive.blob);
        madeUrls.push(downloadUrl);
        filename = archive.filename;
        sizeBytes = archive.sizeBytes;
      }
      if (!previewUrl || !downloadUrl) throw new Error("The conversion did not produce a complete download.");
      resultUrlsRef.current = madeUrls;
      resultPublished = true;
      setResult({
        downloadUrl,
        previewUrl,
        filename,
        downloadLabel: pages.length === 1 ? "Download JPG" : "Download ZIP",
        pageCount: pages.length,
        sizeBytes,
        pages: outputs,
      });
      setStatus(`${pages.length} ${pages.length === 1 ? "JPG is" : "JPGs are"} ready to download.`);
    } catch (error) {
      if (operation === operationRef.current) {
        setErrors([getErrorMessage(error)]);
        setStatus("Conversion failed. No partial output is available.");
      }
    } finally {
      if (!resultPublished) {
        for (const url of madeUrls) URL.revokeObjectURL(url);
      }
      if (operation === operationRef.current) {
        renderTaskRef.current = null;
        busyRef.current = false;
        setIsBusy(false);
      }
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <section aria-label="PDF to JPG converter" className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors sm:p-7 ${isDragging ? "border-action-primary bg-surface-muted" : "border-border"}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" aria-label="Choose a PDF file" onChange={(event) => void chooseFile(event.currentTarget.files?.[0])} />
          <p className="font-medium text-text">Drop a PDF here or choose a file</p>
          <p className="mt-2 text-sm text-muted">PDF only · maximum 25 MB and 300 pages</p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={isBusy}>Choose PDF</Button>
        </div>

        <p className="mt-4 rounded-lg bg-surface-muted p-3 text-sm text-text">Your PDF is converted into JPG images in your browser. Your document is not uploaded to our servers.</p>
        <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">{status}</p>
        {errors.length > 0 && <ul role="alert" className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}

        {source && (
          <div className="mt-5 grid gap-5">
            <div className="rounded-xl border border-border p-4">
              <h2 className="font-semibold text-text">PDF details</h2>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                <div><dt className="text-muted">File</dt><dd className="break-all font-medium text-text">{source.name}</dd></div>
                <div><dt className="text-muted">File size</dt><dd className="font-medium text-text">{formatBytes(source.size)}</dd></div>
                <div><dt className="text-muted">Pages</dt><dd className="font-medium text-text">{source.pageCount}</dd></div>
              </dl>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="pdf-jpg-page-mode" className="mb-1 block text-sm font-medium text-text">Pages to convert</label>
                <select id="pdf-jpg-page-mode" value={selectionMode} onChange={(event) => updateSelectionMode(event.currentTarget.value as "all" | "selected")} disabled={isBusy} className="min-h-11 w-full rounded-lg border border-border bg-white px-3 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  <option value="all" disabled={source.pageCount > PDF_TO_JPG_MAX_SELECTED_PAGES}>All Pages{source.pageCount > PDF_TO_JPG_MAX_SELECTED_PAGES ? ` (select up to ${PDF_TO_JPG_MAX_SELECTED_PAGES} at a time)` : ""}</option>
                  <option value="selected">Selected Pages</option>
                </select>
                {selectionMode === "selected" && <>
                  <label htmlFor="pdf-jpg-page-range" className="mb-1 mt-3 block text-sm font-medium text-text">Page numbers or ranges</label>
                  <input id="pdf-jpg-page-range" value={pageRange} onChange={updateRange} placeholder={PAGE_RANGE_EXAMPLE} disabled={isBusy} aria-describedby="pdf-jpg-range-help" className="min-h-11 w-full rounded-lg border border-border px-3 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
                  <p id="pdf-jpg-range-help" className="mt-1 text-xs text-muted">Example: 5,2-3 · inclusive ranges · up to {PDF_TO_JPG_MAX_SELECTED_PAGES} pages in the order entered.</p>
                </>}
                {source.pageCount > PDF_TO_JPG_MAX_SELECTED_PAGES && selectionMode === "all" && <p className="mt-2 text-sm text-muted">Select up to {PDF_TO_JPG_MAX_SELECTED_PAGES} pages for each conversion. Clear and choose a different page selection to process another batch.</p>}
                <p className="mt-2 text-sm text-muted">{selectionError || `${selectedPages.length} ${selectedPages.length === 1 ? "page" : "pages"} selected`}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pdf-jpg-resolution" className="mb-1 block text-sm font-medium text-text">Resolution</label>
                  <select id="pdf-jpg-resolution" value={resolution} onChange={(event) => updateResolution(event.currentTarget.value as PdfJpgResolution)} disabled={isBusy} className="min-h-11 w-full rounded-lg border border-border bg-white px-3 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    <option value="standard">Standard · 72 DPI equivalent</option>
                    <option value="high">High · 144 DPI equivalent</option>
                    <option value="very-high">Very High · 216 DPI equivalent</option>
                  </select>
                  <p className="mt-1 text-xs text-muted">Higher rasterization scale makes larger images and uses more memory and processing time.</p>
                </div>
                <div>
                  <label htmlFor="pdf-jpg-quality" className="mb-1 block text-sm font-medium text-text">JPG quality: {quality}%</label>
                  <input id="pdf-jpg-quality" type="range" min="10" max="100" step="1" value={quality} onChange={(event) => updateQuality(Number(event.currentTarget.value))} disabled={isBusy} className="min-h-11 w-full accent-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
                  <p className="text-xs text-muted">Higher quality usually creates larger files; lower quality may add visible artifacts. The percentage is not a guaranteed compression amount.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void convert()} disabled={isBusy || selectedPages.length === 0 || Boolean(selectionError)}>{isBusy ? "Converting…" : "Convert to JPG"}</Button>
              <Button variant="secondary" onClick={clearAll}>{isBusy ? "Cancel and Clear" : "Clear"}</Button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <section aria-labelledby="pdf-jpg-result-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="pdf-jpg-result-heading" className="font-heading text-xl font-semibold text-text">JPG conversion result</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl bg-surface-muted p-3">
              {/* The preview URL is an image blob generated locally from the first selected page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.previewUrl} alt={`Preview of source page ${result.pages[0]?.sourcePage ?? 1} converted to JPG`} className="max-h-96 max-w-full object-contain" />
            </div>
            <div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Output files</dt><dd className="text-right font-medium text-text">{result.pageCount} {result.pageCount === 1 ? "JPG" : "JPGs"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Resolution</dt><dd className="text-right font-medium text-text">{resolutionDpi(resolution)} DPI equivalent</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">JPG quality</dt><dd className="text-right font-medium text-text">{quality}%</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">{result.pageCount > 1 ? "ZIP size" : "JPG size"}</dt><dd className="text-right font-medium text-text">{formatBytes(result.sizeBytes)}</dd></div>
              </dl>
              <div className="mt-4 max-h-44 overflow-auto rounded-lg border border-border p-3">
                <h3 className="text-sm font-semibold text-text">Page dimensions and file sizes</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {result.pages.map((page) => <li key={page.filename}>{page.filename} · {page.width} × {page.height} px · {formatBytes(page.sizeBytes)}</li>)}
                </ul>
              </div>
              <a href={result.downloadUrl} download={result.filename} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 font-medium text-action-primary-foreground hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{result.downloadLabel}</a>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
