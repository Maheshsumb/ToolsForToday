import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { WordCharacterCounter } from "@/components/tools/word-character-counter";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "word-character-counter") as (typeof tools)[number];

export const metadata: Metadata = {
  title: "Word & Character Counter | ToolsForToday",
  description: "Count words, characters, sentences, and paragraphs instantly with a private, browser-based text counter.",
};

export default function WordCharacterCounterPage() {
  return (
    <>
      <AnalyticsPageView page="wordCharacterCounter" />
      <ToolPageShell tool={tool} showRelatedTools={false}>
        <WordCharacterCounter />

        <section aria-labelledby="counter-about-heading" className="mt-10 space-y-4">
          <div>
            <h2 id="counter-about-heading" className="font-heading text-xl font-semibold text-text">About this word and character counter</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">
              Get a quick, live summary of a draft, note, or other text. The counter reports word-like segments, user-perceived characters, sentences, paragraphs, and an approximate reading time while you type or paste.
            </p>
          </div>
          <ToolHelpSection
            id="counter-help"
            title="How to use the counter"
            steps={[
              "Type in the text area or paste text from your clipboard.",
              "Review the six statistics; they update immediately as the text changes.",
              "Use Copy text to copy the current text, or Clear text to reset the editor and all counts.",
            ]}
            limitations={[
              "Word boundaries vary between writing systems. This counter uses the browser's international text segmentation when available.",
              "Sentence counts are estimates based on the browser's sentence boundaries; abbreviations and unusual punctuation can affect them.",
              "Reading time uses a general rate of 200 words per minute and is an estimate, not a prediction of an individual reader's pace.",
            ]}
            faqs={[
              {
                question: "How are words counted?",
                answer: "The counter uses the browser's Intl.Segmenter word rules where available and counts segments marked as word-like. A Unicode-aware fallback counts runs of letters, combining marks, and digits, keeping common apostrophes inside words.",
              },
              {
                question: "What does characters without spaces mean?",
                answer: "It counts visible grapheme clusters after removing whitespace such as spaces, tabs, and line breaks. Punctuation is included.",
              },
              {
                question: "How is reading time estimated?",
                answer: "The estimate uses 200 words per minute. Empty text is 0 min, fewer than 200 words is Under 1 min, and longer text is rounded up to a whole minute.",
              },
              {
                question: "Is my text uploaded or saved?",
                answer: "No. Counting runs in your browser. The tool does not upload the text or save it to browser storage, and it does not send text through Analytics events.",
              },
            ]}
          />
          <div className="rounded-2xl border border-border bg-surface-muted/45 p-5 sm:p-6">
            <h2 className="font-heading text-xl font-semibold text-text">How the counts are defined</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Characters include spaces and line breaks. The no-whitespace count removes whitespace while keeping punctuation. Paragraphs are nonempty blocks separated by one or more blank lines. Where supported, the browser segments words, sentences, and grapheme clusters according to international text rules; fallback rules are used when that feature is unavailable.
            </p>
          </div>
        </section>
      </ToolPageShell>
    </>
  );
}
