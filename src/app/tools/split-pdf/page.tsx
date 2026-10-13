import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { SplitPdfTool } from "@/components/tools/split-pdf";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "split-pdf") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'Split PDF & Extract Pages Online | ToolsForToday',
  description: 'Extract selected pages into a new PDF or split pages into separate PDF files, processed in your browser.',
  path: "/tools/split-pdf/",
});

export default function SplitPdfPage() {
  return (
    <>
      <AnalyticsPageView page="splitPdf" />
      <ToolPageShell tool={tool}>
        <SplitPdfTool />

        <section aria-labelledby="split-pdf-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="split-pdf-guide-heading" className="font-heading text-xl font-semibold text-text">How to split a PDF</h2>
            <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-text">
              <li>Choose one PDF file or drop it into the upload area. The browser checks its PDF structure and page count.</li>
              <li>Choose <strong>Extract Pages</strong> to enter page numbers or ranges, or choose <strong>Split Every Page</strong> to put each page in a separate PDF inside a ZIP.</li>
              <li>Review the page selection and order, then create and download the result. Changing the source or selection clears any older download.</li>
            </ol>
          </article>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Page ranges and order</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Page numbers start at 1, matching the labels readers see in a PDF. Enter examples such as 1, 1-3, 1,3,5, or 1-3,6,8-10. Ranges include both endpoints. The order you type determines the output order, so 5,2-3 creates pages 5, 2, then 3. Repeated and overlapping selections are rejected instead of silently removed.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Page size and orientation</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">The PDF library copies page content and page boxes when supported. Extracted pages retain their source dimensions and rotation in the generated document. This is not a visual repair or conversion tool; malformed or unsupported files may be rejected.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Limits and protected PDFs</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Files are limited to 25 MB and 300 source pages. Extracted PDFs are limited to 50 MB. Split Every Page accepts at most 50 source pages and caps its ZIP at 75 MB. Empty, corrupt, truncated, and encrypted or password-protected PDFs are rejected. Passwords are not requested or bypassed. For larger documents, extract a smaller page selection.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Privacy and PDF features</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Your PDF is processed in your browser and is not uploaded to our servers or stored in browser databases. Extraction rewrites PDF data. Bookmarks, links, annotations, forms, attachments, metadata, and other advanced features may not transfer perfectly. Digital signatures may no longer be valid. The tool does not scan for malware or remove malicious content.</p>
            </article>
          </div>

          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-text">Split PDF questions</h2>
            <div className="mt-3 grid gap-4 text-sm leading-relaxed text-muted">
              <details>
                <summary className="cursor-pointer font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">How do I select pages 2 through 5?</summary>
                <p className="mt-2">Choose Extract Pages and enter 2-5. Both page 2 and page 5 are included.</p>
              </details>
              <details>
                <summary className="cursor-pointer font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Can I change the order of extracted pages?</summary>
                <p className="mt-2">Yes. Enter the page numbers in the order you want them in the output, for example 5,2-3. Duplicate or overlapping pages are not accepted.</p>
              </details>
              <details>
                <summary className="cursor-pointer font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Can I split a password-protected PDF?</summary>
                <p className="mt-2">No. Encrypted or password-protected PDFs are rejected; the tool does not ask for or bypass a password.</p>
              </details>
              <details>
                <summary className="cursor-pointer font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Will forms, links, or signatures remain intact?</summary>
                <p className="mt-2">Not necessarily. Splitting rewrites PDF data, and interactive or advanced features may not transfer. Do not rely on source digital signatures remaining valid.</p>
              </details>
            </div>
          </article>
        </section>
      </ToolPageShell>
    </>
  );
}
