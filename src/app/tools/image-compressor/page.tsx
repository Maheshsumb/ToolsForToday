import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ImageCompressor } from "@/components/tools/image-compressor";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "image-compressor") as (typeof tools)[number];

const description = "Compress JPG, PNG and WebP images directly in your browser. Adjust quality, compare file sizes, and download your optimized image.";

export const metadata: Metadata = {
  title: "Image Compressor | ToolsForToday",
  description,
};

export default function ImageCompressorPage() {
  return (
    <>
      <AnalyticsPageView page="imageCompressor" />
      <ToolPageShell tool={tool} showRelatedTools={false}>
        <ImageCompressor />

        <section aria-labelledby="image-compression-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="image-compression-guide-heading" className="font-heading text-xl font-semibold text-text">What image compression does</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">Image compression re-encodes an image so the stored file may use fewer bytes. This tool reports the actual output size; results depend on the source image and browser encoder, and an output can be the same size or larger. Pixel dimensions are kept at the decoded image size. Animated files are rejected rather than silently flattened.</p>
          </article>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">JPEG, PNG, and WebP</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">JPEG and WebP support a quality setting that trades some image detail for a potentially smaller file. PNG uses lossless canvas encoding from the decoded pixels and has no equivalent quality slider; it may not shrink. The original format is kept, and the tool does not silently convert formats.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Quality and measured file size</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">The quality percentage is an encoder setting, not a promise of a matching file-size reduction. Lower JPEG or WebP quality can reduce bytes but may introduce visible changes. The comparison uses the selected file&apos;s measured byte count and the browser-produced output.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Dimensions and metadata</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Images are not resized. The dimensions shown are the decoded dimensions, including orientation applied by the browser where supported. Canvas re-encoding may remove EXIF metadata such as camera details or GPS information; metadata, color profiles, and animation are not promised to be preserved.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Privacy and browser processing</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">The image is read, decoded, and encoded in your browser. The file, filename, preview, and metadata are not uploaded to ToolsForToday or included in the site&apos;s fixed Analytics page-view data.</p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="image-compressor-help"
          title="How to compress an image"
          steps={[
            "Choose or drop one JPEG, PNG, or WebP image no larger than 25 MB and 25 million decoded pixels.",
            "Review the original preview and size. For JPEG or WebP, choose a quality setting; PNG uses browser lossless encoding without that control.",
            "Select Optimize image, compare the measured dimensions and file sizes, then download the output if it suits your needs.",
          ]}
          limitations={[
            "A result can be larger than its source, especially for PNG or already-optimized images. The comparison shows increases as well as savings.",
            "The browser decodes and re-encodes the image. Re-encoding can change image details and remove metadata; inspect the output before relying on it.",
            "Animated images, SVG, GIF, TIFF, and HEIC are not supported. Choose a non-animated JPEG, PNG, or WebP image instead.",
          ]}
          faqs={[
            { question: "Will every image become smaller?", answer: "No. The browser measures the actual encoded file. It can be smaller, unchanged, or larger than the original." },
            { question: "Does the quality control resize my image?", answer: "No. The quality control changes JPEG or WebP encoding only. Image dimensions remain at the browser-decoded size." },
            { question: "Why is quality disabled for PNG?", answer: "The browser Canvas API encodes PNG without a JPEG-style quality parameter. PNG output may not be smaller, so this tool does not imply the slider changes PNG compression." },
            { question: "Are my images uploaded?", answer: "No. This tool uses browser image decoding and canvas encoding. Image contents, filenames, and metadata are not sent to ToolsForToday servers or its manual Analytics page views." },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
