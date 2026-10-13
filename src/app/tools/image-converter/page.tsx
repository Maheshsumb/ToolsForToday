import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ImageConverter } from "@/components/tools/image-converter";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "image-format-converter") as (typeof tools)[number];

export const metadata: Metadata = {
  title: "JPG, PNG & WebP Image Converter | ToolsForToday",
  description: "Convert JPG, PNG and WebP images online for free. Preview your image, choose the output format, and download the converted file instantly.",
};

export default function ImageConverterPage() {
  return (
    <>
      <AnalyticsPageView page="imageConverter" />
      <ToolPageShell tool={tool} showRelatedTools={false}>
        <ImageConverter />

        <section aria-labelledby="image-converter-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="image-converter-guide-heading" className="font-heading text-xl font-semibold text-text">JPG, PNG, and WebP compared</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">JPG (JPEG) is widely supported and works well for photographs, but it is lossy and cannot store transparency. PNG uses lossless encoding and supports transparent pixels, which suits graphics and sharp edges. WebP supports both lossy and lossless encoding and can store transparency; browser encoder support can vary. Converting formats does not guarantee better quality or a smaller file.</p>
          </article>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Lossy, lossless, and quality</h2><p className="mt-2 text-sm leading-relaxed text-muted">JPEG and the selected WebP output use a quality setting from 10% to 100%, starting at 80%. Higher settings generally retain more visual detail and create larger files; lower settings may introduce visible artifacts. The percentage is an encoder setting, not a promised size reduction. PNG uses lossless browser canvas encoding and has no equivalent quality slider.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Transparency and file size</h2><p className="mt-2 text-sm leading-relaxed text-muted">PNG and supported WebP output can retain transparency. JPEG cannot, so transparent pixels are flattened over the chosen background, white by default. PNG output can be larger than a JPEG or WebP source because the formats encode image data differently. The tool measures and displays the actual before-and-after byte counts.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Dimensions and metadata</h2><p className="mt-2 text-sm leading-relaxed text-muted">Conversion keeps the dimensions decoded by the browser; it does not resize or crop. Browser decoding may apply image orientation. Canvas re-encoding may remove EXIF details (including GPS), embedded color profiles, and other metadata. The converter handles one non-animated image and does not preserve animation.</p></article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Browser-only processing</h2><p className="mt-2 text-sm leading-relaxed text-muted">Your selected image is decoded and encoded with browser image and canvas APIs. The image, filename, pixels, and metadata are not uploaded to ToolsForToday or included in its fixed Analytics page-view data. Conversion works locally in the current browser session.</p></article>
          </div>
        </section>

        <ToolHelpSection
          id="image-converter-help"
          title="How to convert an image"
          steps={[
            "Choose or drop one non-animated JPG, PNG, or WebP image up to 25 MB and 25 million decoded pixels.",
            "Select a different output format. Set JPEG or WebP quality if applicable; choose a background color for JPEG output.",
            "Select Convert, inspect the preview, dimensions, format, and measured file sizes, then download the result if it meets your needs.",
          ]}
          limitations={[
            "Only non-animated JPEG, PNG, and WebP files are supported. GIF, SVG, HEIC, AVIF, and TIFF are not supported.",
            "Output size may be smaller, larger, or the same as the input. A format conversion is not a guaranteed compression step.",
            "Browser Canvas re-encoding may remove metadata or embedded color profiles. The converter processes one image at a time and does not preserve animation.",
          ]}
          faqs={[
            { question: "Will converting an image always reduce its size?", answer: "No. Each format encodes image data differently. The tool shows the actual output file size, which may be larger, smaller, or equal." },
            { question: "Why does a transparent image look opaque in JPG?", answer: "JPEG has no alpha channel. Transparent pixels are filled with the selected background color; the default is white." },
            { question: "Can I convert animated WebP or GIF files?", answer: "No. The converter accepts non-animated JPEG, PNG, and WebP images and rejects formats outside that set." },
            { question: "Are my images uploaded?", answer: "No. The browser reads and converts the selected file locally. Image contents, filenames, pixels, and metadata are not sent to ToolsForToday." },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
