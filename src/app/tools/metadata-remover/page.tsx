import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { MetadataRemover } from "@/components/tools/metadata-remover";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";
import { createPageMetadata } from "@/lib/seo-metadata";

const tool = tools.find((entry) => entry.id === "metadata-remover") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: "Free Image & File Metadata Remover | ToolsForToday",
  description: "Inspect and remove selected EXIF, XMP, PNG text, and basic PDF document properties from JPEG, PNG, WebP, and PDF files in your browser.",
  path: "/tools/metadata-remover/",
});

export default function MetadataRemoverPage() {
  return (
    <>
      <AnalyticsPageView page="metadataRemover" />
      <ToolPageShell tool={tool}>
        <MetadataRemover />
        <ToolHelpSection
          id="metadata-remover-help"
          title="Inspect before you remove"
          steps={["Select a JPEG, PNG, WebP, or PDF file no larger than 20 MB. The file's contents are checked locally.", "Review the supported metadata values and select the categories you want to remove.", "Process the file, review the before-and-after report, download the result, and open it in a normal viewer before sharing."]}
          limitations={["JPEG EXIF, standard XMP segments, IPTC APP13 segments, and comments are supported. PNG eXIf, text, and timestamp chunks and WebP EXIF and XMP chunks are supported.", "PDF support is limited to standard document information fields such as title, author, subject, keywords, creator, producer, and dates. XMP packets, embedded files, annotations, signatures, and historical revisions are not fully inspected or cleaned.", "Signed PDFs are not modified. PDF rewriting can affect signatures or interactive features. Encrypted, malformed, or unsupported PDFs fail without a download.", "C2PA Content Credentials and provenance are not validated, removed, or replaced. Marker detection is limited and cannot confirm authenticity.", "Metadata is not the same as visible or invisible watermarks or identifying image content. This tool does not remove watermarks or make files undetectable."]}
          faqs={[{ question: "Does metadata prove that an image came from ChatGPT?", answer: "No. Software or creator fields can be edited or absent. Their presence does not prove who created a file, and their absence does not prove it was made by a person." }, { question: "Does removing metadata guarantee anonymity?", answer: "No. Other identifying information can remain in visible content, uninspected containers, document objects, provenance records, or embedded signals." }]}
        />
      </ToolPageShell>
    </>
  );
}
