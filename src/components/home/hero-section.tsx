import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ToolIcon } from "@/components/tools/tool-icon";

const highlights = [
  { icon: "image-compressor", label: "Images", note: "Resize & convert", tone: "bg-[#FFF1EB] text-[#B84222]" },
  { icon: "merge-pdf", label: "PDFs", note: "Combine & split", tone: "bg-[#EAF5FB] text-[#176A8B]" },
  { icon: "percentage", label: "Calculations", note: "Everyday answers", tone: "bg-[#E9F7F3] text-[#176B58]" },
  { icon: "date-calculator", label: "More tools", note: "Useful, simple tasks", tone: "bg-[#FFF6E8] text-[#805013]" },
] as const;

export function HeroSection() {
  return (
    <section aria-labelledby="home-title" className="relative isolate overflow-hidden border-b border-border bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute -top-28 right-[-10rem] -z-10 h-96 w-96 rounded-full bg-[#F1A951]/10 blur-3xl" />
      <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#E7C2B1] bg-[#FFF8F4] px-3 text-xs font-semibold tracking-wide text-[#77321D]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-portland-orange" />
            A useful collection is on its way
          </p>
          <h1 id="home-title" className="mt-6 max-w-2xl font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-text sm:text-5xl lg:text-[3.5rem]">
            Free online tools for everyday tasks
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Simple tools for images, PDFs, calculations, and more. One convenient place for your everyday digital tasks.
          </p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
            <Link href="#tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-3 text-sm font-semibold text-action-primary-foreground transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              Explore Tools
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <p className="text-sm text-muted">12 tools planned, all coming soon</p>
          </div>
          <p className="mt-8 border-l-2 border-brand-accent pl-3 text-sm font-medium text-text">Everyday Tools. One Simple Place.</p>
        </div>

        <div aria-hidden="true" className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-surface-muted/70" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-surface p-4 shadow-[0_20px_56px_rgba(22,35,63,0.11)] sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-heading text-sm font-semibold text-text">Everyday tools</p>
                <p className="mt-0.5 text-xs text-muted">A simple place to get things done</p>
              </div>
              <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F1A951]" /><span className="h-2 w-2 rounded-full bg-[#66CDB0]" /><span className="h-2 w-2 rounded-full bg-[#4AAFD5]" /></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="min-h-28 rounded-xl border border-border p-3 sm:min-h-32 sm:p-4">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}><ToolIcon name={item.icon} className="h-5 w-5" /></span>
                  <p className="mt-3 text-sm font-semibold text-text">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-muted/80 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#176B58]"><ToolIcon name="qr-code" className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><div className="h-2 w-24 max-w-full rounded-full bg-[#C9D3E0]" /><div className="mt-2 h-2 w-36 max-w-full rounded-full bg-[#E0E6ED]" /></div>
              <span className="rounded-full bg-[#FFF1EB] px-2.5 py-1 text-[10px] font-semibold text-[#8C351C]">Coming soon</span>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-medium text-text shadow-lg sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E9F7F3] text-[#176B58]"><svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5"><path d="m5 10 3.2 3.2L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            Simple by design
          </div>
        </div>
      </Container>
    </section>
  );
}
