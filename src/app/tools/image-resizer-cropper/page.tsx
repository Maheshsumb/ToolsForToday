import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ImageResizerCropper } from "@/components/tools/image-resizer-cropper";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "image-resizer-cropper") as (typeof tools)[number];
const description = "Resize and crop JPG, PNG and WebP images online for free. Choose custom dimensions, lock aspect ratio, and download your edited image.";

export const metadata: Metadata = {
  title: "Image Resizer & Cropper | ToolsForToday",
  description,
};

export default function ImageResizerCropperPage() {
  return <>
    <AnalyticsPageView page="imageResizerCropper" />
    <ToolPageShell tool={tool} showRelatedTools={false}>
      <ImageResizerCropper />
      <section aria-labelledby="image-resizer-guide" className="mt-10 space-y-5">
        <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="image-resizer-guide" className="font-heading text-xl font-semibold text-text">Resizing versus cropping</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Resizing changes the number of pixels in the image. Cropping trims the visible area before resizing. This editor applies operations in that order: source image → crop → resize → encode. Pixel dimensions describe the image grid, not a guaranteed physical print size. Locking the aspect ratio keeps proportions; unlocked dimensions can stretch people and objects.</p>
        </article>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Choosing a crop ratio</h2><p className="mt-2 text-sm leading-relaxed text-muted">A 1:1 crop is square, 4:3 is a common photo frame, and 16:9 is a wide landscape frame. Portrait ratios 3:4 and 9:16 suit taller compositions. Free lets you choose any shape. The selection remains within the source image.</p></article>
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Upscaling and output formats</h2><p className="mt-2 text-sm leading-relaxed text-muted">Upscaling creates more pixels but cannot restore image detail that was not in the source. JPG is suitable for many photographs but does not support transparency; PNG supports transparency and uses lossless browser encoding; WebP supports lossy encoding and transparency in compatible browsers. Re-encoding can remove metadata or color profiles.</p></article>
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Quality and transparency</h2><p className="mt-2 text-sm leading-relaxed text-muted">The JPG and WebP quality slider changes the encoder setting and may trade detail for file size; it does not promise a particular size reduction. PNG has no standard canvas quality control. Transparency is preserved for PNG and supported WebP output. When exporting JPG, transparent pixels are filled with the selected background color.</p></article>
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold text-text">Browser-based privacy</h2><p className="mt-2 text-sm leading-relaxed text-muted">Image bytes are opened, cropped, resized, and encoded by your browser. Images are not uploaded to ToolsForToday. The tool does not send filenames, crop values, output dimensions, image metadata, or image content to its fixed Analytics page view.</p></article>
        </div>
      </section>
      <ToolHelpSection id="image-resizer-help" title="How to resize and crop an image" steps={[
        "Choose or drop one non-animated JPG, PNG, or WebP image up to 25 MB and 25 megapixels.",
        "Drag to select a crop region, reposition it by dragging inside it, or use the numeric crop controls. Choose an aspect ratio or reset to the full image.",
        "Set output width and height. Keep aspect ratio locked to avoid distortion, or unlock it for independent dimensions. Choose an output format and quality where available.",
        "Create a preview, check its dimensions and file size, then download the current result.",
      ]} limitations={[
        "Animated images and formats other than JPEG, PNG, and WebP are not supported.",
        "Input and output are limited to reduce browser memory use. The browser's available memory varies by device.",
        "Image re-encoding may remove EXIF metadata and embedded color profiles. Metadata is not promised to be preserved.",
      ]} faqs={[
        { question: "Are my images uploaded?", answer: "No. The image is processed in your browser and is not uploaded to our servers." },
        { question: "Will a larger output look sharper?", answer: "Not necessarily. Upscaling increases pixel dimensions but cannot recreate detail absent from the source." },
        { question: "Why is my transparent image white in JPG?", answer: "JPG has no transparency. Choose a background color before exporting; PNG and supported WebP outputs can retain transparency." },
      ]} />
    </ToolPageShell>
  </>;
}
