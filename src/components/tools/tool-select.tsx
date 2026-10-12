import type { SelectHTMLAttributes } from "react";

export interface ToolSelectOption {
  value: string;
  label: string;
}

interface ToolSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  options: readonly ToolSelectOption[];
  hint?: string;
  error?: string;
}

export function ToolSelect({ id, label, options, hint, error, className = "", ...selectProps }: ToolSelectProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">{label}</label>
      <select
        {...selectProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text shadow-sm focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground ${className}`.trim()}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hint ? <p id={hintId} className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-error">{error}</p> : null}
    </div>
  );
}
