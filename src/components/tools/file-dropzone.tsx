"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { FileSummary, type SelectedFile } from "@/components/tools/file-summary";

export interface AllowedFileType {
  label: string;
  mimeTypes: readonly string[];
  extensions: readonly string[];
}

interface FileDropzoneProps {
  label: string;
  instructions: string;
  allowedTypes: readonly AllowedFileType[];
  maxFileSizeBytes: number;
  maxFiles?: number;
  onSelectionChange?: (files: readonly File[]) => void;
}

function fileMatchesAllowedType(file: File, allowedTypes: readonly AllowedFileType[]) {
  const mimeMatches = allowedTypes.some(({ mimeTypes }) => mimeTypes.some((mimeType) => (
    mimeType.endsWith("/*") ? file.type.startsWith(mimeType.slice(0, -1)) : file.type === mimeType
  )));
  const lowerName = file.name.toLowerCase();
  const extensionMatches = allowedTypes.some(({ extensions }) => extensions.some((extension) => lowerName.endsWith(extension.toLowerCase())));
  if (mimeMatches) return true;
  return (!file.type || file.type === "application/octet-stream") && extensionMatches;
}

export function FileDropzone({ label, instructions, allowedTypes, maxFileSizeBytes, maxFiles = 1, onSelectionChange }: FileDropzoneProps) {
  const generatedId = useId();
  const inputId = `file-input-${generatedId}`;
  const hintId = `file-hint-${generatedId}`;
  const errorId = `file-error-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const accept = [...new Set(allowedTypes.flatMap(({ mimeTypes, extensions }) => [...mimeTypes, ...extensions]))].join(",");
  const typeNames = allowedTypes.map(({ label: typeLabel }) => typeLabel).join(", ");

  function applySelection(fileList: FileList | readonly File[]) {
    const chosenFiles = Array.from(fileList);
    if (chosenFiles.length === 0) return;

    if (chosenFiles.length > maxFiles) {
      setFiles([]);
      setError(`Choose up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`);
      if (inputRef.current) inputRef.current.value = "";
      onSelectionChange?.([]);
      return;
    }

    const unsupportedFile = chosenFiles.find((file) => !fileMatchesAllowedType(file, allowedTypes));
    if (unsupportedFile) {
      setFiles([]);
      setError(`${unsupportedFile.name} is not a supported file type. Choose ${typeNames || "a supported file"}.`);
      if (inputRef.current) inputRef.current.value = "";
      onSelectionChange?.([]);
      return;
    }

    const oversizedFile = chosenFiles.find((file) => file.size > maxFileSizeBytes);
    if (oversizedFile) {
      setFiles([]);
      setError(`${oversizedFile.name} is larger than the ${formatLimit(maxFileSizeBytes)} limit.`);
      if (inputRef.current) inputRef.current.value = "";
      onSelectionChange?.([]);
      return;
    }

    setError("");
    setFiles(chosenFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
    })));
    onSelectionChange?.(chosenFiles);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) applySelection(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    applySelection(event.dataTransfer.files);
  }

  function clearSelection() {
    setFiles([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onSelectionChange?.([]);
  }

  const acceptedFormats = allowedTypes.flatMap(({ extensions }) => extensions).join(", ").toUpperCase();

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-text">{label}</label>
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? "border-deep-navy bg-surface-muted" : "border-[#AEBACB] bg-[#FAFBFD]"}`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5FB] text-[#14536C]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
          </span>
          <p className="mt-3 text-sm font-medium text-text">Drop files here or choose from your device</p>
          <p id={hintId} className="mt-1 max-w-lg text-sm leading-relaxed text-muted">{instructions}</p>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept || undefined}
            multiple={maxFiles > 1}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
            aria-invalid={error ? true : undefined}
            onChange={handleInputChange}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus-ring"
          >
            Choose {maxFiles > 1 ? "files" : "a file"}
          </label>
          {acceptedFormats ? <p className="mt-3 text-xs text-muted">Supported: {acceptedFormats}. Maximum {formatLimit(maxFileSizeBytes)} per file.</p> : null}
        </div>
      </div>

      {error ? <p id={errorId} role="alert" className="mt-3 rounded-lg border border-[#E6B8B2] bg-[#FFF5F4] px-3 py-2 text-sm font-medium text-error">{error}</p> : null}
      <FileSummary files={files} />
      <p className="mt-3 text-xs leading-relaxed text-muted">Selection only: this component does not upload or process files.</p>
      {files.length > 0 ? <Button variant="subtle" size="compact" onClick={clearSelection} className="mt-2 min-h-11 px-2 text-sm underline underline-offset-4">Remove selected {files.length === 1 ? "file" : "files"}</Button> : null}
    </div>
  );
}

function formatLimit(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
}
