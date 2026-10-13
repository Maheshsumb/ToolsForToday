import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { QrCodeGenerator } from "@/components/tools/qr-code-generator";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "qr-code-generator") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'QR Code Generator Online – PNG & SVG | ToolsForToday',
  description: 'Create a QR code from text or a website link, choose colors and size, then download it as PNG or SVG.',
  path: "/tools/qr-code-generator/",
});

export default function QrCodeGeneratorPage() {
  return (
    <>
      <AnalyticsPageView page="qrCodeGenerator" />
      <ToolPageShell tool={tool}>
        <QrCodeGenerator />

        <section aria-labelledby="qr-code-guide-heading" className="mt-10 space-y-5">
          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="qr-code-guide-heading" className="font-heading text-xl font-semibold text-text">What is a QR code?</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">A QR code is a two-dimensional pattern that stores information in square modules. A compatible camera or reader decodes the pattern into the text or website address that was encoded. This tool creates the pattern in your browser and does not open or fetch encoded links.</p>
          </article>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Text and website URL modes</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Text mode stores the entered text as written, including spaces, punctuation, Unicode characters, and supported emoji. Website URL mode accepts complete HTTP or HTTPS addresses. The URL itself is encoded; the generator does not visit it.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">PNG and SVG downloads</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">PNG is a raster image with a selected pixel size and is convenient for documents and screens. SVG is vector artwork that can be scaled without pixelation, which is useful for print layouts. Preview and download use the same content, colors, correction level, and quiet zone.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Error correction and contrast</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Error correction adds information that can help a reader recover data from some damaged or obscured modules. Higher levels make a denser code and reduce the available capacity; they cannot guarantee a successful scan. Strong contrast between a darker foreground and lighter background helps QR readers detect the pattern.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Size, printing, and privacy</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Choose the PNG size for the intended use, then check a printed sample at its final dimensions and scan distance. Keep the four-module quiet zone clear of text and graphics. QR generation runs in your browser: the entered text and links are not uploaded to our servers or included in Analytics events.</p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="qr-code-help"
          title="How to create a QR code"
          steps={[
            "Choose Text or Website URL and enter the content to encode.",
            "Select a PNG size, error correction level, and foreground and background colors. Check the live preview and contrast guidance.",
            "Download the code as PNG or SVG. Scan a sample before printing or sharing it widely.",
          ]}
          limitations={[
            "Every QR code has a finite capacity. Longer content and higher error correction can exceed it; shorten the content or select a lower level if generation fails.",
            "A low-contrast code, small print size, poor lighting, or damaged surface can make scanning difficult. Error correction does not guarantee readability.",
            "URL mode accepts only HTTP and HTTPS addresses. The tool encodes a URL without opening it or retrieving the linked website.",
          ]}
          faqs={[
            { question: "Can I encode a link?", answer: "Yes. Choose Website URL and enter a complete HTTP or HTTPS address. Other schemes, including data: and javascript:, are rejected." },
            { question: "Does the QR generator upload my content?", answer: "No. QR rendering occurs in your browser. Content is not sent to ToolsForToday servers or included in the site's fixed Analytics page-view data." },
            { question: "Which error correction level should I use?", answer: "M is a general starting point. Use higher correction when you expect some damage, while keeping in mind that higher levels reduce capacity and create a denser code." },
            { question: "Will every phone scan a customized QR code?", answer: "Scanning depends on the reader, display or print quality, size, contrast, lighting, and content. Check the exported code with the readers and conditions that matter to you." },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
