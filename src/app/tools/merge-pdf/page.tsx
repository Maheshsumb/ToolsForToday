import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { MergePdfTool } from "@/components/tools/merge-pdf";
import { ToolGuideLink } from "@/components/guides/tool-guide-link";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "merge-pdf") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'Merge PDF Files Online | ToolsForToday',
  description: 'Combine multiple PDFs in a chosen order and download one merged document, processed in your browser.',
  path: "/tools/merge-pdf/",
});

export default function MergePdfPage() {
  return (
    <>
      <AnalyticsPageView page="mergePdf" />
      <ToolPageShell tool={tool}>
        <MergePdfTool />

        <section aria-labelledby="merge-pdf-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="merge-pdf-guide-heading" className="font-heading text-xl font-semibold text-text">How to merge PDFs</h2>
            <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-text">
              <li>Select or drop at least two PDF files. Each file is checked in your browser before it joins the list.</li>
              <li>Review the filenames and page counts. Use Move up or Move down to set the document order; pages in each PDF keep their original sequence.</li>
              <li>Choose Merge PDFs, then download the completed file. The selected source files are not changed.</li>
            </ol>
          </article>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Page order, size, and selectable text</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Documents are added in the order shown. Each copied page keeps its source page size, orientation, rotation, and PDF page content where supported. Text is copied as PDF page content rather than rasterized, so it generally remains selectable when it was selectable in the source.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Limits and encrypted files</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">To manage browser memory, this version accepts up to 20 PDFs, 25 MB per file, 100 MB combined, and 300 pages total. Empty, incomplete, corrupt, unsupported, or encrypted/password-protected documents are rejected. Passwords are not requested or bypassed.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">PDF features and signatures</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Merging rewrites a new document. Bookmarks, annotations, forms, attachments, metadata, and other interactive or advanced features may not transfer perfectly. A digital signature on a source document should not be expected to remain valid on the merged file. This tool does not sanitize files or remove malware.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Browser processing and privacy</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">PDF files are read and merged locally using browser JavaScript. The tool does not upload documents to a ToolsForToday application server, put their contents in browser storage, or add filenames and document details to Analytics page views. Large merges use your device memory; keep the tab open while processing.</p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="merge-pdf-help"
          title="Merge PDF help"
          steps={["Add at least two valid, unencrypted PDFs within the displayed file and page limits.", "Arrange the document list with the accessible Move up and Move down controls.", "Merge the documents and download toolsfortoday-merged.pdf when processing completes."]}
          limitations={["This tool preserves page content and page geometry where supported, but does not promise exact preservation of every advanced PDF feature.", "The merged result is a new file. Do not rely on source digital signatures remaining valid after merging.", "PDFs are not rasterized, sanitized, scanned for malware, or uploaded to a server."]}
          faqs={[
            { question: "Can I add more PDFs after making the first selection?", answer: "Yes. Choose Add PDFs again or drop more files; valid new documents are added to the end of the current list." },
            { question: "Can I change the page order?", answer: "You can reorder whole documents before merging. All pages in each selected document stay together in their original internal order." },
            { question: "Are my original PDFs changed?", answer: "No. The tool reads the selected files and creates a separate merged download." },
            { question: "Why might a PDF fail?", answer: "The file may be incomplete, corrupt, unsupported, password-protected, or over the per-file or total limits. Encrypted PDFs are not decrypted by this tool." },
            { question: "Will bookmarks, forms, annotations, and signatures all be preserved?", answer: "Not necessarily. These features may not transfer unchanged, and source digital signatures should be treated as invalid on the new merged document." },
            { question: "Are the PDFs uploaded or scanned for malware?", answer: "No. PDF content is processed in your browser and is not uploaded to ToolsForToday. This tool does not sanitize files or provide malware scanning." },
          ]}
        />
        <ToolGuideLink href="/guides/how-to-merge-pdf-files/" title="How to Merge PDF Files in the Correct Order" />
      </ToolPageShell>
    </>
  );
}
