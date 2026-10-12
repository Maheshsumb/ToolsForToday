export type ToolStatusState = "idle" | "ready" | "processing" | "success" | "error";

interface ToolStatusProps {
  state: ToolStatusState;
  message: string;
  progress?: { value: number; label: string };
}

const statusStyles: Record<ToolStatusState, string> = {
  idle: "border-border bg-surface-muted/70 text-muted",
  ready: "border-[#B8D5E5] bg-[#F0F8FC] text-[#164F69]",
  processing: "border-[#B8D5E5] bg-[#F0F8FC] text-[#164F69]",
  success: "border-[#A6D9C9] bg-[#EFF9F5] text-[#14563F]",
  error: "border-[#E6B8B2] bg-[#FFF5F4] text-[#8F1D14]",
};

const statusLabels: Record<ToolStatusState, string> = {
  idle: "Not started",
  ready: "Ready",
  processing: "Processing",
  success: "Complete",
  error: "Error",
};

export function ToolStatus({ state, message, progress }: ToolStatusProps) {
  const progressValue = progress && Number.isFinite(progress.value)
    ? Math.min(100, Math.max(0, progress.value))
    : undefined;

  return (
    <div
      role={state === "error" ? "alert" : "status"}
      aria-live={state === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3 ${statusStyles[state]}`}
    >
      <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {state === "processing" ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 animate-spin motion-reduce:animate-none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" /><path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
        ) : state === "success" ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : state === "error" ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="M10 6.5v4.2m0 2.8h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-relaxed">
        <span className="font-semibold">{statusLabels[state]}.</span> {message}
        {state === "processing" && progressValue !== undefined && progress ? (
          <span className="mt-2 block">
            <span className="sr-only">{progress.label}: </span>
            <span role="progressbar" aria-label={progress.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue} className="block h-2 overflow-hidden rounded-full bg-white/80">
              <span className="block h-full rounded-full bg-[#176A8B] transition-[width]" style={{ width: `${progressValue}%` }} />
            </span>
          </span>
        ) : null}
      </span>
    </div>
  );
}
