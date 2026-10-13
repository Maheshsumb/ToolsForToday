"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_PDF_FILES,
  MAX_PDF_FILE_BYTES,
  MAX_PDF_TOTAL_BYTES,
  MAX_PDF_TOTAL_PAGES,
  assertPdfQueueLimits,
  getPdfTotalPages,
  inspectPdfFile,
  mergePdfFiles,
  movePdfItem,
  removePdfItem,
  type PdfQueueItem,
} from "@/lib/pdf-merging";

type QueuedPdf = PdfQueueItem<File>;
type DownloadResult = { url: string; filename: string; documentCount: number; pageCount: number; sizeBytes: number };

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MergePdfTool() {
  const [items, setItems] = useState<QueuedPdf[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose two or more PDFs to begin.");
  const [isValidating, setIsValidating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [download, setDownload] = useState<DownloadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueuedPdf[]>([]);
  const nextIdRef = useRef(0);
  const generationRef = useRef(0);
  const validationActiveRef = useRef(false);
  const mergeControllerRef = useRef<AbortController | null>(null);
  const downloadUrlRef = useRef<string | null>(null);

  const updateItems = (nextItems: QueuedPdf[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  const discardDownload = () => {
    generationRef.current += 1;
    mergeControllerRef.current?.abort();
    mergeControllerRef.current = null;
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
    setIsMerging(false);
  };

  useEffect(() => () => {
    generationRef.current += 1;
    mergeControllerRef.current?.abort();
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  const addFiles = async (fileList: FileList | readonly File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    if (validationActiveRef.current) {
      setErrors(["Please wait for the current PDF validation to finish before adding more files."]);
      return;
    }

    discardDownload();
    setErrors([]);
    validationActiveRef.current = true;
    setIsValidating(true);
    setStatus("Checking selected PDFs in your browser…");
    const generation = generationRef.current;
    const accepted = [...itemsRef.current];
    const messages: string[] = [];

    for (const file of incoming) {
      if (generation !== generationRef.current) return;
      if (accepted.length >= MAX_PDF_FILES) {
        messages.push(`You can select up to ${MAX_PDF_FILES} PDF files.`);
        break;
      }
      try {
        assertPdfQueueLimits([...accepted.map((item) => item.file), file]);
        const validated = await inspectPdfFile(file);
        const nextPageTotal = getPdfTotalPages(accepted) + validated.pageCount;
        if (nextPageTotal > MAX_PDF_TOTAL_PAGES) {
          throw new Error(`The selection would exceed the ${MAX_PDF_TOTAL_PAGES}-page total limit.`);
        }
        accepted.push({ id: `pdf-${++nextIdRef.current}`, file, pageCount: validated.pageCount });
      } catch (error) {
        messages.push(`${file.name}: ${error instanceof Error ? error.message : "This PDF could not be read."}`);
      }
    }

    if (generation === generationRef.current) {
      updateItems(accepted);
      setErrors(messages);
      setStatus(messages.length > 0
        ? `${accepted.length} valid ${accepted.length === 1 ? "PDF" : "PDFs"} selected. Review the messages below.`
        : `${accepted.length} PDFs ready to merge.`);
    }
    validationActiveRef.current = false;
    setIsValidating(false);
  };

  const changeItems = (nextItems: QueuedPdf[]) => {
    discardDownload();
    updateItems(nextItems);
    setErrors([]);
    setStatus(`${nextItems.length} PDFs selected. Review their order, then merge.`);
  };

  const clearAll = () => {
    discardDownload();
    validationActiveRef.current = false;
    updateItems([]);
    setErrors([]);
    setIsValidating(false);
    setStatus("Selection cleared. Choose two or more PDFs to begin.");
    if (inputRef.current) inputRef.current.value = "";
  };

  const merge = async () => {
    if (itemsRef.current.length < 2) {
      setErrors(["Select at least two valid PDFs before merging."]);
      return;
    }
    discardDownload();
    const generation = generationRef.current;
    const controller = new AbortController();
    mergeControllerRef.current = controller;
    setIsMerging(true);
    setErrors([]);
    setStatus("Merging PDFs in your browser… Keep this tab open until the merge finishes.");
    try {
      const result = await mergePdfFiles(itemsRef.current.map((item) => item.file), controller.signal);
      if (generation !== generationRef.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(result.blob);
      downloadUrlRef.current = url;
      setDownload({
        url,
        filename: result.filename,
        documentCount: result.documentCount,
        pageCount: result.pageCount,
        sizeBytes: result.sizeBytes,
      });
      setStatus(`Merge complete: ${result.documentCount} PDFs and ${result.pageCount} pages are ready to download.`);
    } catch (error) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      setErrors([error instanceof Error ? error.message : "The PDFs could not be merged. Try again with supported files."]);
      setStatus("The merge could not be completed. Your selected files are still available to review.");
    } finally {
      if (generation === generationRef.current) {
        mergeControllerRef.current = null;
        setIsMerging(false);
      }
    }
  };

  const totalBytes = items.reduce((total, item) => total + item.file.size, 0);
  const totalPages = getPdfTotalPages(items);
  const controlsDisabled = isValidating || isMerging;

  return (
    <section aria-labelledby="merge-pdf-workspace-heading" className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <h2 id="merge-pdf-workspace-heading" className="font-heading text-xl font-semibold text-text">Merge PDFs</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Your PDF files are merged in your browser. They are not uploaded to our servers.</p>

      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={`mt-5 rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? "border-deep-navy bg-surface-muted" : "border-[#AEBACB] bg-[#FAFBFD]"}`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5FB] text-[#14536C]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>
          </span>
          <p className="mt-3 text-sm font-medium text-text">Drop PDF files here or choose from your device</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">Add two or more PDFs. Files are checked and processed locally; nothing is uploaded.</p>
          <input
            ref={inputRef}
            id="merge-pdf-file-input"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            aria-describedby="merge-pdf-limits"
            onChange={(event) => { void addFiles(event.currentTarget.files ?? []); event.currentTarget.value = ""; }}
            className="peer sr-only"
          />
          <label htmlFor="merge-pdf-file-input" className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus-ring">
            Add PDFs
          </label>
          <p id="merge-pdf-limits" className="mt-3 text-xs text-muted">Limits: {MAX_PDF_FILES} files, {MAX_PDF_FILE_BYTES / (1024 * 1024)} MB each, {MAX_PDF_TOTAL_BYTES / (1024 * 1024)} MB combined, and {MAX_PDF_TOTAL_PAGES} pages total.</p>
        </div>
      </div>

      {errors.length > 0 ? <ul role="alert" className="mt-4 grid gap-2 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-4 py-3 text-sm font-medium text-error">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text">Selected documents ({items.length})</h3>
        {items.length > 0 ? <p className="text-sm text-muted">{totalPages} pages · {formatBytes(totalBytes)}</p> : null}
      </div>

      {items.length > 0 ? (
        <ol className="mt-3 grid gap-3" aria-label="PDF merge order">
          {items.map((item, index) => (
            <li key={item.id} className="flex min-w-0 flex-wrap items-start gap-3 rounded-xl border border-border bg-white p-3 sm:flex-nowrap sm:items-center sm:p-4">
              <span aria-label={`Position ${index + 1}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-text">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="break-all text-sm font-semibold text-text">{item.file.name}</p>
                <p className="mt-1 text-xs text-muted">{item.pageCount} {item.pageCount === 1 ? "page" : "pages"} · {formatBytes(item.file.size)}</p>
              </div>
              <div className="flex w-full flex-wrap justify-start gap-1 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-2">
                <Button variant="subtle" size="compact" aria-label={`Move ${item.file.name} up`} disabled={controlsDisabled || index === 0} onClick={() => changeItems(movePdfItem(itemsRef.current, item.id, -1))}>Move up</Button>
                <Button variant="subtle" size="compact" aria-label={`Move ${item.file.name} down`} disabled={controlsDisabled || index === items.length - 1} onClick={() => changeItems(movePdfItem(itemsRef.current, item.id, 1))}>Move down</Button>
                <Button variant="subtle" size="compact" aria-label={`Remove ${item.file.name}`} disabled={controlsDisabled} onClick={() => changeItems(removePdfItem(itemsRef.current, item.id))}>Remove</Button>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 rounded-xl bg-surface-muted p-4 text-sm text-muted">No PDFs selected yet.</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => void merge()} disabled={controlsDisabled || items.length < 2}>Merge PDFs</Button>
        {download ? <a href={download.url} download={download.filename} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-secondary px-4 py-2.5 text-sm font-semibold text-action-secondary-foreground hover:bg-action-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Download Merged PDF</a> : null}
        {items.length > 0 ? <Button variant="subtle" onClick={clearAll}>Clear All</Button> : null}
      </div>

      {download ? <p className="mt-4 rounded-lg border border-[#A6D9C9] bg-[#EFF9F5] p-3 text-sm text-[#14563F]">{download.documentCount} documents · {download.pageCount} pages · {formatBytes(download.sizeBytes)} · {download.filename}</p> : null}
      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite" aria-atomic="true">{isValidating ? "Validating selected files. " : ""}{isMerging ? "Merging. " : ""}{status}</p>
    </section>
  );
}
