import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { PdfToJpgTool } from "@/components/tools/pdf-to-jpg";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "pdf-to-jpg") as (typeof tools)[number];
const description = "Convert PDF pages into high-quality JPG images online for free. Select pages, adjust resolution and image quality, then download your JPG files.";

export const metadata: Metadata = {
  title: "PDF to JPG Converter | ToolsForToday",
  description,
};

export default function PdfToJpgPage() {
  return (
    <>
      <AnalyticsPageView page="pdfToJpg" />
      <ToolPageShell tool={tool} showRelatedTools={false}>
        <PdfToJpgTool />

        <section aria-labelledby="pdf-to-jpg-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="pdf-to-jpg-guide-heading" className="font-heading text-xl font-semibold text-text">How PDF pages become JPG images</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">PDF-to-JPG conversion rasterizes each selected page into a pixel image. The resulting text is part of the image and is not selectable. This tool renders pages locally in your browser; it does not upload the document or run as a PDF security scanner or sanitizer.</p>
          </article>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Page numbers and ranges</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Page numbering starts at 1. Select All Pages for PDFs with at most 20 pages, or enter individual pages and inclusive ranges such as 1,3,5-7. The order you enter determines the JPG and ZIP member order. Duplicate, overlapping, malformed, and out-of-range selections are rejected.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Resolution, dimensions, and quality</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Standard, High, and Very High use rasterization scales equivalent to 72, 144, and 216 DPI for standard PDF point units. Actual pixel dimensions follow each page&apos;s effective geometry and rotation. Pages are limited to 16 megapixels each and 150 megapixels combined per conversion. Higher scale takes more memory and time. JPG quality ranges from 10% to 100%, with an 85% default; quality percentages do not promise a specific file-size reduction.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Limits and supported PDFs</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Input is limited to 25 MB and 300 source pages. Each conversion can include up to 20 pages, and generated JPGs or ZIP output are limited to 100 MB. Empty, malformed, incomplete, encrypted, password-protected, or unsupported PDFs may be rejected. Passwords are not requested or bypassed. Large pages can require substantial browser memory; choose a lower resolution or fewer pages if a limit is reached.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Rendering and image appearance</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Pages are rendered one at a time against white before JPEG encoding. PDF rotation and effective viewport dimensions are used. Some advanced or unusual PDF features may not render exactly as in every PDF viewer. Raster images cannot retain vector sharpness, selectable text, or transparency.</p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="pdf-to-jpg-help"
          title="How to convert PDF pages to JPG"
          steps={[
            "Choose or drop one unencrypted PDF up to 25 MB and 300 pages. The browser checks its contents and displays its page count.",
            "Choose All Pages for up to 20 pages or enter page numbers and ranges. Select a resolution and JPG quality, then convert.",
            "Review the first-page preview and output dimensions. Download one selected page as a JPG or multiple selected pages in a ZIP.",
          ]}
          limitations={[
            "At most 20 pages can be converted per batch. A larger source PDF can be processed in multiple batches by selecting different pages.",
            "A generated image is a raster JPG. Text is not selectable, and JPG does not support transparency.",
            "This browser tool does not promise perfect rendering of every PDF feature, sanitize documents, or scan them for malware.",
          ]}
          faqs={[
            { question: "How do I download more than one JPG?", answer: "Select multiple pages and convert them. The tool provides one ZIP containing the JPGs in the order you selected." },
            { question: "Can I choose pages out of order?", answer: "Yes. For example, 5,2-3 creates page-005.jpg, page-002.jpg, then page-003.jpg. Duplicate or overlapping pages are rejected." },
            { question: "Why might a PDF not convert?", answer: "It may be empty, malformed, incomplete, encrypted, unsupported, over 25 MB, over 300 pages, or contain a page that exceeds the selected pixel limits." },
            { question: "Are my PDF pages uploaded?", answer: "No. The document is read and rendered locally in your browser. PDF bytes, filenames, page selections, generated images, and ZIP contents are not sent to the ToolsForToday application server or added to the site's manual Analytics page views." },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
