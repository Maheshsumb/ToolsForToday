import Image from "next/image";
import Link from "next/link";
import { AnalyticsSettingsButton } from "@/components/analytics/analytics-consent";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-8 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
        <div className="max-w-md">
          <Link href="/" aria-label="ToolsForToday home" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">
            <Image src="/brand/toolsfortoday-logo.webp" alt="" width={2172} height={724} sizes="(max-width: 639px) 184px, 210px" className="h-auto w-[184px] sm:w-[210px]" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">A simple home for useful everyday tools, designed to work in your browser.</p>
          <p className="mt-2 text-sm font-medium text-text">Everyday Tools. One Simple Place.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-muted hover:text-text hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">Home</Link>
            <Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-muted hover:text-text hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">Privacy Policy</Link>
            <AnalyticsSettingsButton />
          </nav>
          <p className="text-sm text-muted">Copyright {new Date().getFullYear()} ToolsForToday</p>
        </div>
      </Container>
    </footer>
  );
}
