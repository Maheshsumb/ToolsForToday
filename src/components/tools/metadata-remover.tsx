"use client";

import { useMemo, useRef, useState } from "react";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { detectMetadataFileFormat, formatMetadataFileName, getMetadataImageDimensions, inspectMetadata, MetadataFileError, removeSelectedMetadata, type MetadataInspection } from "@/lib/metadata-remover";
import { MetadataSelectionGuard } from "@/lib/metadata-remover-operations";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedTypes = [
  { label: "JPEG", mimeTypes: ["image/jpeg"], extensions: [".jpg", ".jpeg"] },
  { label: "PNG", mimeTypes: ["image/png"], extensions: [".png"] },
  { label: "WebP", mimeTypes: ["image/webp"], extensions: [".webp"] },
  { label: "PDF", mimeTypes: ["application/pdf"], extensions: [".pdf"] },
] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeForFormat(format: MetadataInspection["format"]): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "application/pdf";
}

export function MetadataRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<MetadataInspection | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [output, setOutput] = useState<{ blob: Blob; name: string } | null>(null);
  const [verification, setVerification] = useState<{ removed: string[]; retained: string[] } | null>(null);
  const selectionGuardRef = useRef(new MetadataSelectionGuard());
  const workingCopyRef = useRef<{ generation: number; bytes: Uint8Array } | null>(null);
  const selectedCount = selected.length;
  const noMetadata = useMemo(() => Boolean(inspection && inspection.options.length === 0), [inspection]);

  async function inspectFile(nextFile: File | null) {
    const generation = selectionGuardRef.current.beginSelection();
    workingCopyRef.current = null;
    setFile(nextFile);
    setInspection(null);
    setSelected([]);
    setOutput(null);
    setVerification(null);
    setStatus("");
    setError("");
    if (!nextFile) {
      setBusy(false);
      return;
    }
    setBusy(true);
    setStatus("Checking the file contents and supported metadata locally…");
    await selectionGuardRef.current.run(generation, async () => {
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      if (bytes.length > MAX_FILE_SIZE) throw new MetadataFileError("Files must be 20 MB or smaller.");
      const format = detectMetadataFileFormat(bytes);
      if (format !== "pdf") {
        getMetadataImageDimensions(bytes, format);
        if (typeof createImageBitmap !== "function") throw new MetadataFileError("This browser cannot verify decoded image files. Try a current browser that supports image decoding.");
        const bitmap = await createImageBitmap(nextFile);
        bitmap.close();
      }
      const nextInspection = await inspectMetadata(bytes);
      return { bytes, format, inspection: nextInspection };
    }, {
      onSuccess: ({ bytes, format, inspection: nextInspection }) => {
        workingCopyRef.current = { generation, bytes: new Uint8Array(bytes) };
        setInspection(nextInspection);
        setSelected(nextInspection.options.map((option) => option.id));
        setStatus(`Inspected ${format.toUpperCase()} file contents in this browser.`);
      },
      onError: (reason) => {
        setError(reason instanceof Error ? reason.message : "Could not inspect this file.");
        setStatus("");
      },
      onFinally: () => setBusy(false),
    });
  }

  async function processFile() {
    const currentGeneration = workingCopyRef.current?.generation;
    if (currentGeneration === undefined || !selectionGuardRef.current.isCurrent(currentGeneration)
      || !file || !inspection || selectedCount === 0 || !selectionGuardRef.current.beginProcessing(currentGeneration)) return;
    const processingGeneration = currentGeneration;
    const sourceBytes = workingCopyRef.current!.bytes;
    const sourceInspection = inspection;
    const sourceFile = file;
    const selectedIds = [...selected];
    setBusy(true);
    setError("");
    setStatus("Removing the selected metadata locally…");
    await selectionGuardRef.current.run(processingGeneration, async () => {
      const result = await removeSelectedMetadata(new Uint8Array(sourceBytes), sourceInspection.format, selectedIds);
      const after = await inspectMetadata(result);
      const removedOptions = selectedIds.map((id) => sourceInspection.options.find((option) => option.id === id)).filter((option) => option && !after.options.some((remaining) => remaining.id === option.id));
      const retainedOptions = selectedIds.map((id) => sourceInspection.options.find((option) => option.id === id)).filter((option) => option && after.options.some((remaining) => remaining.id === option.id));
      const removed = removedOptions.map((option) => option!.label);
      const retained = retainedOptions.map((option) => option!.label);
      const outputBuffer = new ArrayBuffer(result.byteLength);
      new Uint8Array(outputBuffer).set(result);
      const blob = new Blob([outputBuffer], { type: mimeForFormat(sourceInspection.format) });
      if (sourceInspection.format !== "pdf") {
        const bitmap = await createImageBitmap(blob);
        bitmap.close();
      } else {
        await inspectMetadata(new Uint8Array(result));
      }
      return { result, blob, after, removed, retained };
    }, {
      onSuccess: ({ result, blob, after, removed, retained }) => {
        workingCopyRef.current = { generation: processingGeneration, bytes: new Uint8Array(result) };
        setOutput({ blob, name: formatMetadataFileName(sourceFile.name) });
        setVerification({ removed, retained });
        setInspection(after);
        setSelected([]);
        setStatus(removed.length > 0
          ? `Reinspection confirmed removal of ${removed.length} selected ${removed.length === 1 ? "category" : "categories"}${retained.length ? `; ${retained.length} selected categories remain` : ""}. Download and review the output.`
          : "Reinspection did not confirm removal of the selected metadata. The output is available for your review.");
      },
      onError: (reason) => {
        setError(reason instanceof Error ? reason.message : "The file could not be processed safely.");
        setStatus("");
      },
      onFinally: () => {
        selectionGuardRef.current.endProcessing(processingGeneration);
        setBusy(false);
      },
    });
  }

  function downloadOutput() {
    if (!output) return;
    const url = URL.createObjectURL(output.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = output.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toggleOption(id: string, checked: boolean) {
    setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  }

  return (
    <>
      <ToolWorkspace id="metadata-remover-workspace" title="Inspect a file’s metadata" description="Select a JPEG, PNG, WebP, or PDF file. File contents are checked and processed locally in your browser; they are not uploaded.">
        <FileDropzone
          label="Choose an image or PDF"
          instructions="Drop one file here or use the file picker. The file type is verified from its contents, not just its name."
          allowedTypes={allowedTypes}
          maxFileSizeBytes={MAX_FILE_SIZE}
          onSelectionChange={(files) => { void inspectFile(files[0] ?? null); }}
        />

        {file ? <p className="mt-4 rounded-lg bg-surface-muted/60 px-3 py-2 text-sm text-text">Selected file: <span className="font-medium">{file.name}</span> · {formatBytes(file.size)}</p> : null}
        {busy ? <p className="mt-4 rounded-lg border border-border bg-surface-muted/50 px-3 py-3 text-sm text-muted" role="status" aria-live="polite">{status}</p> : null}
        {!busy && status ? <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">{status}</p> : null}
        {error ? <p className="mt-4 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-3 py-2 text-sm font-medium text-error" role="alert">{error}</p> : null}

        {inspection ? (
          <div className="mt-6 space-y-5">
            <section aria-labelledby="metadata-found-heading">
              <h3 id="metadata-found-heading" className="font-heading text-lg font-semibold text-text">Inspection results</h3>
              <p className="mt-1 text-sm text-muted">Detected file format: <span className="font-semibold text-text">{inspection.format.toUpperCase()}</span></p>
              {inspection.fields.length ? (
                <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
                  {inspection.fields.map((field, index) => <div key={`${field.label}-${index}`} className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(10rem,0.7fr)_1fr] sm:gap-4"><dt className="text-sm font-medium text-text">{field.label}</dt><dd className="break-words text-sm text-muted">{field.value}</dd></div>)}
                </dl>
              ) : <p className="mt-3 rounded-xl border border-border bg-surface-muted/40 p-4 text-sm text-muted">No readable supported metadata values were found. This does not prove the file contains no metadata or other identifying information.</p>}
              {inspection.c2paMarkerFound ? <p className="mt-3 rounded-lg border border-[#EACB8D] bg-[#FFF9EA] p-3 text-sm text-text">A possible C2PA / Content Credentials marker was found. This tool does not validate, remove, or replace provenance records. They will be preserved where the format processor permits.</p> : null}
            </section>

            {inspection.options.length ? (
              <fieldset className="rounded-xl border border-border p-4">
                <legend className="px-1 font-semibold text-text">Choose metadata to remove</legend>
                <div className="grid gap-2">
                  {inspection.options.map((option) => (
                    <label key={option.id} className="flex min-h-12 items-start gap-3 rounded-lg p-2 text-sm hover:bg-surface-muted/40">
                      <input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => toggleOption(option.id, event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#16233F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
                      <span><span className="font-medium text-text">{option.label}</span><span className="mt-0.5 block leading-relaxed text-muted">{option.description}</span></span>
                    </label>
                  ))}
                </div>
                <Button className="mt-4" onClick={processFile} disabled={busy || selectedCount === 0}>{busy ? "Processing…" : "Remove selected metadata"}</Button>
              </fieldset>
            ) : noMetadata ? <p className="rounded-xl border border-border bg-surface-muted/40 p-4 text-sm text-muted">No supported removable metadata categories were detected, so no rewritten download is offered.</p> : null}

            {inspection.limitations.length > 0 ? <section aria-labelledby="metadata-limits-heading" className="rounded-xl border border-border bg-surface-muted/35 p-4"><h3 id="metadata-limits-heading" className="font-semibold text-text">What this check does not cover</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">{inspection.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></section> : null}
            {inspection.format !== "pdf" && selected.includes("exif") ? <p className="rounded-lg border border-[#EACB8D] bg-[#FFF9EA] p-3 text-sm leading-relaxed text-text">Removing EXIF also removes its orientation instruction. The encoded image pixels are not rotated or recompressed, so some viewers may display the cleaned image in a different orientation. Preview the downloaded file before sharing it.</p> : null}
            {inspection.format === "pdf" ? <p className="rounded-lg border border-[#EACB8D] bg-[#FFF9EA] p-3 text-sm leading-relaxed text-text">PDF processing rewrites the document and may affect signatures or interactive features. PDFs with recognized signature markers are rejected, but this check cannot guarantee detection of every signature or historical revision. Do not use this tool to modify signed or legally significant documents. Review the downloaded document before sharing it.</p> : null}
            {output ? <div className="rounded-xl border border-[#A6D9C9] bg-[#EFF9F5] p-4"><div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><p className="font-semibold text-[#14563F]">Output re-inspected</p><p className="mt-1 break-all text-sm text-muted">{output.name} · {formatBytes(output.blob.size)}</p></div><Button onClick={downloadOutput}>Download cleaned file</Button></div>{verification ? <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><span className="font-semibold text-text">Confirmed removed:</span> <span className="text-muted">{verification.removed.join(", ") || "None"}</span></p><p><span className="font-semibold text-text">Still present:</span> <span className="text-muted">{verification.retained.join(", ") || "None of the selected categories"}</span></p></div> : null}</div> : null}
          </div>
        ) : null}
      </ToolWorkspace>

      <ToolPrivacyNote id="metadata-remover-privacy" message="Files stay in this browser for inspection and processing. No file, filename, metadata value, or output is sent to a ToolsForToday processing server or Analytics. Metadata cleanup does not remove visible or invisible watermarks, erase identifying image content, or guarantee that a file is anonymous." />
    </>
  );
}
