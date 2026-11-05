import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { AiTextCleaner } from "@/components/tools/ai-text-cleaner";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { tools } from "@/config/tools";
import { createPageMetadata } from "@/lib/seo-metadata";

const tool = tools.find((entry) => entry.id === "ai-text-cleaner") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: "Free AI Text Cleaner — Clean Copied Text & Formatting | ToolsForToday",
  description: "Clean copied text formatting, whitespace, basic Markdown, and selected invisible characters locally. Review every change before copying or downloading.",
  path: "/tools/ai-text-cleaner/",
});

export default function AiTextCleanerPage() {
  return (
    <>
      <AnalyticsPageView page="aiTextCleaner" />
      <ToolPageShell tool={tool}>
        <AiTextCleaner />
        <ToolHelpSection
          id="ai-text-cleaner-help"
          title="Clean text carefully"
          steps={["Paste or type text in the original panel. Basic line-ending, trailing-space, and blank-line cleanup is selected by default.", "Compare the original and cleaned panels. Open Advanced options only when you want additional changes.", "Inspect invisible characters and select specific code points to remove. Copy or download the cleaned text when it looks right."]}
          limitations={["This is a local formatting utility; it does not call an AI model, detect AI-generated text, or guarantee a detector result.", "Zero-width joiners, non-joiners, direction marks, and other invisible characters can affect scripts, emoji, and text display. They are preserved unless individually selected.", "Markdown cleanup handles common syntax such as headings, emphasis, lists, and links. Always review the result, especially when formatting carries meaning."]}
          faqs={[{ question: "Does this make AI-written text look human?", answer: "No. It only changes formatting that you choose. It does not identify authorship, remove AI watermarks, or make claims about how text was written." }, { question: "Is my text sent to an AI service?", answer: "No. The cleaner runs with local string operations in your browser and sends no text to an AI provider or ToolsForToday processing server." }]}
        />
      </ToolPageShell>
    </>
  );
}
