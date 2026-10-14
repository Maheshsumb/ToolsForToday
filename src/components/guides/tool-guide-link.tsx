import Link from "next/link";

export function ToolGuideLink({ href, title }: Readonly<{ href: `/guides/${string}/`; title: string }>) {
  return (
    <aside className="mt-8 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-sm text-muted">Want a step-by-step walkthrough?</p>
      <Link href={href} className="mt-1 inline-flex min-h-11 items-center font-semibold text-text underline underline-offset-4 hover:text-[#14536C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{title}</Link>
    </aside>
  );
}
