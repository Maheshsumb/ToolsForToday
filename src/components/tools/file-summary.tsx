export interface SelectedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

interface FileSummaryProps {
  files: readonly SelectedFile[];
}

export function FileSummary({ files }: FileSummaryProps) {
  if (files.length === 0) return null;

  return (
    <ul aria-label="Selected files" className="mt-4 grid min-w-0 gap-2">
      {files.map((file) => (
        <li key={file.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface p-3 sm:items-center">
          <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted sm:mt-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5m-11 4h8m-8 4h8" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-all text-sm font-medium leading-snug text-text">{file.name}</span>
            <span className="mt-1 block text-xs text-muted">{formatFileSize(file.size)}{file.type ? ` · ${file.type}` : ""}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
