import type { ReactNode } from "react";

interface ToolFaq {
  question: string;
  answer: ReactNode;
}

interface ToolHelpSectionProps {
  id: string;
  title?: string;
  steps: readonly string[];
  limitations?: readonly string[];
  faqs?: readonly ToolFaq[];
}

export function ToolHelpSection({ id, title = "How to use this tool", steps, limitations = [], faqs = [] }: ToolHelpSectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-10 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 id={`${id}-heading`} className="font-heading text-xl font-semibold text-text">{title}</h2>
        <ol className="mt-4 grid gap-3">
          {steps.map((step, index) => (
            <li key={`${index}-${step}`} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text">{index + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {limitations.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-heading text-xl font-semibold text-text">Help and limitations</h2>
          <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm leading-relaxed text-muted marker:text-brand-accent">
            {limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </div>
      ) : null}

      {faqs.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-heading text-xl font-semibold text-text">Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </summary>
                <div className="pt-2 pr-8 text-sm leading-relaxed text-muted">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

interface ToolPrivacyNoteProps {
  id: string;
  message: string;
}

export function ToolPrivacyNote({ id, message }: ToolPrivacyNoteProps) {
  return (
    <aside aria-labelledby={`${id}-heading`} className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface-muted/60 p-4">
      <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#14536C]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3 4.5 6v5c0 5 3.1 8.2 7.5 10 4.4-1.8 7.5-5 7.5-10V6L12 3Z" /><path d="M9 12h6" /></svg>
      </span>
      <div className="min-w-0">
        <h2 id={`${id}-heading`} className="text-sm font-semibold text-text">Processing and privacy</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
      </div>
    </aside>
  );
}
