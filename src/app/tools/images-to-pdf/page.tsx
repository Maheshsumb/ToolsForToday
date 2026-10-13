import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ImagesToPdfTool } from "@/components/tools/images-to-pdf";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "images-to-pdf") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'Images to PDF Converter – JPG, PNG & WebP | ToolsForToday',
  description: 'Arrange JPG, PNG or WebP images, choose PDF page settings, and create a PDF in your browser.',
  path: "/tools/images-to-pdf/",
});

export default function ImagesToPdfPage() {
  return (
    <>
      <AnalyticsPageView page="imagesToPdf" />
      <ToolPageShell tool={tool}>
        <ImagesToPdfTool />

        <section aria-labelledby="images-to-pdf-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="images-to-pdf-guide-heading" className="font-heading text-xl font-semibold text-text">How images become PDF pages</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Each accepted image creates one PDF page in the order shown above the settings. Move images with the keyboard-accessible buttons before converting. A4 and US Letter use fixed page dimensions; Auto / Fit to Image makes each page from its decoded pixel dimensions at 72 PDF points per 96 pixels. Auto pages can therefore have different dimensions. At 96 PPI, one inch is 96 image pixels or 72 PDF points, but the actual printed size depends on the page settings and the image&apos;s resolution.</p>
          </article>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Orientation, margins, and fitting</h2><p className="mt-2 text-sm leading-relaxed text-muted">Auto orientation chooses portrait or landscape separately for each image. Portrait or Landscape applies that page direction to every image. The Fit / contain placement uses the smaller of the available-width-to-image-width and available-height-to-image-height ratios, centers the result, preserves its aspect ratio, and does not crop. None, Small (18 points), and Medium (36 points) margins are applied on every side.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Formats and transparency</h2><p className="mt-2 text-sm leading-relaxed text-muted">JPEG data is embedded directly when its EXIF orientation does not require normalization. PNG data is embedded with its alpha channel; WebP is decoded and locally re-encoded as PNG so supported transparency can be retained. An EXIF-oriented JPEG is also normalized through the browser. Re-encoding can change file size or metadata, and the PDF library may omit some image metadata. Transparent pixels remain transparent in the PDF; many PDF viewers display transparent areas as white.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Limits and output size</h2><p className="mt-2 text-sm leading-relaxed text-muted">The tool accepts up to 20 non-animated JPG, PNG, or WebP images, with a 25 MB and 25-megapixel limit per image, a 100 MB combined input limit, a 40-megapixel combined decoded-pixel limit, and a 100 MB output limit. PDF size may be larger or smaller than the images because PDF embedding and image encoding differ. GIF, SVG, HEIC, TIFF, and AVIF are not supported.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Local processing and image data</h2><p className="mt-2 text-sm leading-relaxed text-muted">The browser decodes the selected images and creates the PDF locally; images are not uploaded to ToolsForToday. JPEG bytes may be retained as-is when possible. Browser canvas conversion of WebP or orientation-corrected JPEG can remove EXIF information such as GPS coordinates, color profiles, or other metadata. This tool does not promise metadata removal for every image, and does not improve source resolution or print quality.</p></article>
          </div>
        </section>

        <ToolHelpSection
          id="images-to-pdf-help"
          title="How to convert images to PDF"
          steps={[
            "Choose or drop up to 20 non-animated JPG, PNG, or WebP images within the displayed file and pixel limits.",
            "Use Move Up and Move Down to set the page order. Choose A4, US Letter, or Auto / Fit to Image, then select orientation and margins.",
            "Select Convert to PDF. When generation completes, review the page count and file size, then download the PDF.",
          ]}
          limitations={[
            "Only JPEG, PNG, and WebP are accepted. Animated images and GIF, SVG, HEIC, TIFF, and AVIF are not supported.",
            "WebP and JPEG files with EXIF orientation are normalized locally through browser Canvas to PNG; this can affect file size and metadata. Other image metadata may remain in directly embedded JPEG bytes.",
            "The converter fits and centers images without cropping. PDF output size is not guaranteed to be smaller, and image conversion does not increase resolution or print quality.",
          ]}
          faqs={[
            { question: "Can I change the order of the pages?", answer: "Yes. Use the Move Up and Move Down buttons beside each image. The displayed order is the generated PDF page order." },
            { question: "What does Auto / Fit to Image mean?", answer: "Each page uses the decoded image dimensions at 72 PDF points per 96 pixels. The resulting pages can have different dimensions." },
            { question: "Are transparent areas preserved?", answer: "PNG is embedded with alpha, and WebP is converted to PNG in the browser. The PDF retains supported transparency; PDF viewers commonly show transparent areas against white." },
            { question: "Are my images uploaded?", answer: "No. Image decoding and PDF creation happen in your browser. Image data, filenames, thumbnails, settings, and generated PDFs are not sent to the ToolsForToday application server." },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
