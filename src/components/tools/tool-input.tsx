import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClass = "block min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text shadow-sm placeholder:text-muted/80 focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground";
const labelClass = "mb-1.5 block text-sm font-semibold text-text";

type InputType = "text" | "number" | "date";

interface ToolInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  label: string;
  type?: InputType;
  hint?: string;
  error?: string;
}

export function ToolInput({ id, label, type = "text", hint, error, className = "", ...inputProps }: ToolInputProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input
        {...inputProps}
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${controlClass} ${className}`.trim()}
      />
      {hint ? <p id={hintId} className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-error">{error}</p> : null}
    </div>
  );
}

interface ToolTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function ToolTextarea({ id, label, hint, error, className = "", ...textareaProps }: ToolTextareaProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <textarea
        {...textareaProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block min-h-32 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text shadow-sm placeholder:text-muted/80 focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground ${className}`.trim()}
      />
      {hint ? <p id={hintId} className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-error">{error}</p> : null}
    </div>
  );
}
