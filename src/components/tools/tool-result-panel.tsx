import type { ReactNode } from "react";

interface ToolResultPanelProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ToolResultPanel({ id, title, description, children, action, className = "" }: ToolResultPanelProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className={`min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`.trim()}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={headingId} className="font-heading text-base font-semibold text-text">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

interface CharacterCountProps {
  current: number;
  maximum?: number;
  label?: string;
}

export function CharacterCount({ current, maximum, label = "characters" }: CharacterCountProps) {
  const safeCurrent = Math.max(0, current);
  return (
    <output aria-live="polite" aria-atomic="true" className="text-sm text-muted">
      <span className="font-medium text-text">{safeCurrent}{maximum === undefined ? "" : ` / ${maximum}`}</span> {label}
    </output>
  );
}
