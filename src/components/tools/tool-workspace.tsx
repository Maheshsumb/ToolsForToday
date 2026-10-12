import type { ReactNode } from "react";

interface ToolWorkspaceProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ToolWorkspace({ id, title, description, children, className = "" }: ToolWorkspaceProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`rounded-2xl border border-border bg-surface p-5 shadow-[0_4px_20px_rgba(22,35,63,0.045)] sm:p-7 lg:p-8 ${className}`.trim()}>
      <div className="mb-6">
        <h2 id={`${id}-heading`} className="font-heading text-xl font-semibold text-text sm:text-2xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
