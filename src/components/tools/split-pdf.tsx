"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_EXTRACTED_PDF_BYTES,
  MAX_SPLIT_PDF_FILE_BYTES,
  MAX_SPLIT_PDF_PAGES,
  MAX_SPLIT_ZIP_BYTES,
  MAX_SPLIT_ZIP_PAGES,
  extractPdfPages,
  inspectSplitPdfBytes,
  parsePageRange,
  splitEveryPdfPage,
} from "@/lib/pdf-splitting";

type SplitMode = "extract" | "split";
type SplitSource = { file: File; bytes: Uint8Array; pageCount: number };
type DownloadArtifact = { url: string; filename: string; pageCount: number; sizeBytes: number; kind: "pdf" | "zip" };

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SplitPdfTool() {
  const [source, setSource] = useState<SplitSource | null>(null);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [pageRange, setPageRange] = useState("");
  const [downloads, setDownloads] = useState<DownloadArtifact[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose one PDF to begin.");
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const generationRef = useRef(0);
  const validationRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  const revokeDownloads = () => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
    setDownloads([]);
  };

  const invalidateWork = () => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    processingRef.current = false;
    setIsProcessing(false);
    revokeDownloads();
    return generationRef.current;
  };

  useEffect(() => () => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
  }, []);

  const loadFiles = async (fileList: FileList | readonly File[]) => {
    if (validationRef.current) {
      setErrors(["Please wait for the current PDF check to finish before choosing another file."]);
      return;
    }
    const generation = invalidateWork();
    const files = Array.from(fileList);
    setSource(null);
    setErrors([]);
    setPageRange("");
    if (files.length !== 1) {
      setIsValidating(false);
      setStatus("Choose one PDF file at a time.");
      setErrors(files.length > 1 ? ["Choose one PDF file at a time. Separate multiple documents one at a time."] : []);
      return;
    }

    const file = files[0];
    if (!file || file.size <= 0) {
      setStatus("Choose a non-empty PDF file.");
      setErrors(["The selected file is empty."]);
      return;
    }
    if (file.size > MAX_SPLIT_PDF_FILE_BYTES) {
      setStatus("Choose a smaller PDF file.");
      setErrors([`The PDF is larger than the ${MAX_SPLIT_PDF_FILE_BYTES / (1024 * 1024)} MB input limit.`]);
      return;
    }

    setIsValidating(true);
    validationRef.current = true;
    setStatus("Checking the PDF structure in your browser…");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validated = await inspectSplitPdfBytes(bytes, file.name);
      if (generation !== generationRef.current) return;
      setSource({ file, bytes: validated.bytes, pageCount: validated.pageCount });
      setStatus(`${file.name} is ready. Enter page numbers to extract or split every page.`);
    } catch (error) {
      if (generation !== generationRef.current) return;
      setErrors([error instanceof Error ? error.message : "The selected file could not be read as a supported PDF."]);
      setStatus("The PDF could not be selected. Choose another file to try again.");
    } finally {
      validationRef.current = false;
      if (generation === generationRef.current) setIsValidating(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clearAll = () => {
    invalidateWork();
    setSource(null);
    setMode("extract");
    setPageRange("");
    setErrors([]);
    setIsValidating(false);
    setStatus("Selection cleared. Choose one PDF to begin.");
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectedPages = (() => {
    if (!source || !pageRange.trim()) return null;
    try {
      return { pages: parsePageRange(pageRange, source.pageCount), error: null };
    } catch (error) {
      return { pages: null, error: error instanceof Error ? error.message : "The page selection is invalid." };
    }
  })();

  const runExtraction = async () => {
    if (!source || !selectedPages?.pages || processingRef.current) return;
    const generation = invalidateWork();
    const controller = new AbortController();
    controllerRef.current = controller;
    processingRef.current = true;
    setIsProcessing(true);
    setErrors([]);
    setStatus("Extracting the selected pages in your browser…");
    try {
      const result = await extractPdfPages(source.bytes, selectedPages.pages, controller.signal);
      if (generation !== generationRef.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(result.blob);
      urlsRef.current.push(url);
      setDownloads([{ url, filename: result.filename, pageCount: result.pageCount, sizeBytes: result.sizeBytes, kind: "pdf" }]);
      setStatus(`Extraction complete: ${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"} are ready to download.`);
    } catch (error) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      setErrors([error instanceof Error ? error.message : "The selected pages could not be extracted. Try again with a supported PDF."]);
      setStatus("Extraction did not complete. Your source PDF is still available to review.");
    } finally {
      if (generation === generationRef.current) {
        controllerRef.current = null;
        processingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const runSplit = async () => {
    if (!source || processingRef.current) return;
    if (source.pageCount > MAX_SPLIT_ZIP_PAGES) {
      setErrors([`This PDF has ${source.pageCount} pages. Split Every Page supports up to ${MAX_SPLIT_ZIP_PAGES}; use Extract Pages instead.`]);
      return;
    }
    const generation = invalidateWork();
    const controller = new AbortController();
    controllerRef.current = controller;
    processingRef.current = true;
    setIsProcessing(true);
    setErrors([]);
    setStatus(`Preparing page 1 of ${source.pageCount} for the ZIP…`);
    try {
      const result = await splitEveryPdfPage(source.bytes, (completed, total) => {
        if (generation === generationRef.current) setStatus(`Preparing page ${completed} of ${total} for the ZIP…`);
      }, controller.signal);
      if (generation !== generationRef.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(result.blob);
      urlsRef.current.push(url);
      setDownloads([{ url, filename: result.filename, pageCount: result.pageCount, sizeBytes: result.sizeBytes, kind: "zip" }]);
      setStatus(result.pageCount === 1
        ? "Split complete: the ZIP contains one PDF because the source had one page."
        : `Split complete: ${result.pageCount} individual page PDFs are ready in the ZIP.`);
    } catch (error) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      setErrors([error instanceof Error ? error.message : "The PDF could not be split. Try again with a supported document."]);
      setStatus("The split did not complete. Your source PDF is still available to review.");
    } finally {
      if (generation === generationRef.current) {
        controllerRef.current = null;
        processingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const setNewRange = (value: string) => {
    invalidateWork();
    setErrors([]);
    setPageRange(value);
    setStatus("Page selection updated. Run Extract Pages to create a new result.");
  };

  const setNewMode = (nextMode: SplitMode) => {
    if (nextMode === mode) return;
    invalidateWork();
    setErrors([]);
    setMode(nextMode);
    setStatus(nextMode === "split" ? "Split Every Page will create one PDF per source page." : "Enter page numbers or ranges to extract into one PDF.");
  };

  const busy = isValidating || isProcessing;
  const canExtract = Boolean(source && selectedPages?.pages && !busy);
  const canSplit = Boolean(source && source.pageCount <= MAX_SPLIT_ZIP_PAGES && !busy);

  return (
    <section aria-labelledby="split-pdf-workspace-heading" className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <h2 id="split-pdf-workspace-heading" className="font-heading text-xl font-semibold text-text">Split PDF</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Your PDF is processed in your browser. Your document is not uploaded to our servers.</p>

      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (isValidating) {
            setErrors(["Please wait for the current PDF check to finish before choosing another file."]);
            return;
          }
          void loadFiles(event.dataTransfer.files);
        }}
        className={`mt-5 rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? "border-deep-navy bg-surface-muted" : "border-[#AEBACB] bg-[#FAFBFD]"}`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5FB] text-[#14536C]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>
          </span>
          <p className="mt-3 text-sm font-medium text-text">Drop one PDF here or choose it from your device</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">The document is checked and processed locally; nothing is uploaded.</p>
          <input
            ref={inputRef}
            id="split-pdf-file-input"
            type="file"
            accept="application/pdf,.pdf"
            disabled={isValidating}
            aria-describedby="split-pdf-limits"
            onChange={(event) => {
              const files = event.currentTarget.files;
              void loadFiles(files ?? []);
              event.currentTarget.value = "";
            }}
            className="peer sr-only"
          />
          <label htmlFor="split-pdf-file-input" className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus-ring">
            Choose PDF
          </label>
          <p id="split-pdf-limits" className="mt-3 text-xs leading-relaxed text-muted">Limits: {MAX_SPLIT_PDF_FILE_BYTES / (1024 * 1024)} MB input, {MAX_SPLIT_PDF_PAGES} source pages, {MAX_EXTRACTED_PDF_BYTES / (1024 * 1024)} MB extracted PDF, {MAX_SPLIT_ZIP_PAGES} pages per ZIP, and {MAX_SPLIT_ZIP_BYTES / (1024 * 1024)} MB per ZIP.</p>
        </div>
      </div>

      {errors.length > 0 ? <ul role="alert" className="mt-4 grid gap-2 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-4 py-3 text-sm font-medium text-error">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul> : null}

      {source ? (
        <div className="mt-5 rounded-xl border border-border bg-white p-4">
          <p className="break-all text-sm font-semibold text-text">{source.file.name}</p>
          <p className="mt-1 text-sm text-muted">{formatBytes(source.file.size)} · {source.pageCount} {source.pageCount === 1 ? "page" : "pages"}</p>
        </div>
      ) : null}

      <fieldset className="mt-5" disabled={!source || busy}>
        <legend className="text-sm font-semibold text-text">Choose how to split this PDF</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-white p-3 text-sm font-medium text-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring">
            <input type="radio" name="split-pdf-mode" value="extract" checked={mode === "extract"} onChange={() => setNewMode("extract")} className="accent-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
            Extract Pages
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-white p-3 text-sm font-medium text-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring">
            <input type="radio" name="split-pdf-mode" value="split" checked={mode === "split"} onChange={() => setNewMode("split")} className="accent-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
            Split Every Page
          </label>
        </div>
      </fieldset>

      {source && mode === "extract" ? (
        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="split-pdf-page-range" className="block text-sm font-semibold text-text">Pages to extract</label>
            <input
              id="split-pdf-page-range"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={pageRange}
              onChange={(event) => setNewRange(event.currentTarget.value)}
              aria-invalid={Boolean(selectedPages?.error)}
              aria-describedby="split-pdf-range-help split-pdf-range-status"
              placeholder="Example: 1-3, 5, 8-10"
              disabled={busy}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            />
            <p id="split-pdf-range-help" className="mt-2 text-sm leading-relaxed text-muted">Enter 1-based page numbers separated by commas, with inclusive ranges such as 1, 1-3, 1,3,5, or 1-3,6,8-10. The order you enter determines the output order. Pages cannot be repeated or overlap.</p>
            <p id="split-pdf-range-status" className={`mt-2 text-sm ${selectedPages?.error ? "text-error" : "text-muted"}`} role={selectedPages?.error ? "alert" : undefined}>
              {selectedPages?.error ?? (selectedPages?.pages ? `Selected source pages in this order: ${selectedPages.pages.join(", ")}.` : `This PDF has ${source.pageCount} pages. Page numbering starts at 1.`)}
            </p>
          </div>
        </div>
      ) : null}

      {source && mode === "split" ? (
        <p className="mt-5 rounded-xl bg-surface-muted p-4 text-sm leading-relaxed text-muted">
          {source.pageCount > MAX_SPLIT_ZIP_PAGES
            ? `This PDF has ${source.pageCount} pages, above the ${MAX_SPLIT_ZIP_PAGES}-page ZIP limit. Choose Extract Pages to select a smaller set.`
            : source.pageCount === 1
              ? "This one-page PDF will produce one PDF inside the ZIP."
              : `This will create ${source.pageCount} single-page PDFs in page order. The ZIP is limited to ${MAX_SPLIT_ZIP_BYTES / (1024 * 1024)} MB.`}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {source && mode === "extract" ? <Button onClick={() => void runExtraction()} disabled={!canExtract}>Extract Pages</Button> : null}
        {source && mode === "split" ? <Button onClick={() => void runSplit()} disabled={!canSplit}>Split Every Page</Button> : null}
        {downloads.map((download) => (
          <a key={download.url} href={download.url} download={download.filename} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-secondary px-4 py-2.5 text-sm font-semibold text-action-secondary-foreground hover:bg-action-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            Download {download.kind === "pdf" ? "PDF" : "ZIP"}
          </a>
        ))}
        {source ? <Button variant="subtle" onClick={clearAll} disabled={isValidating}>Clear</Button> : null}
      </div>

      {downloads.length > 0 ? <p className="mt-4 rounded-lg border border-[#A6D9C9] bg-[#EFF9F5] p-3 text-sm text-[#14563F]">{downloads[0].pageCount} {downloads[0].pageCount === 1 ? "page" : "pages"} · {formatBytes(downloads[0].sizeBytes)} · {downloads[0].filename}</p> : null}
      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite" aria-atomic="true">{isValidating ? "Validating selected file. " : ""}{isProcessing ? "Processing. " : ""}{status}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted">Output may omit or alter bookmarks, links, annotations, forms, attachments, metadata, and other advanced PDF features. Digital signatures may no longer be valid. This tool does not repair PDFs or scan/remove malicious content.</p>
    </section>
  );
}
