"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolTextarea } from "@/components/tools/tool-input";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { countText } from "@/lib/text-counts";

const statisticCards = [
  { key: "words", label: "Words", note: "Word-like text segments" },
  { key: "characters", label: "Characters", note: "Including spaces" },
  { key: "charactersWithoutWhitespace", label: "Characters without spaces", note: "Whitespace excluded" },
  { key: "sentences", label: "Sentences", note: "Sentence-like text segments" },
  { key: "paragraphs", label: "Paragraphs", note: "Blocks separated by blank lines" },
  { key: "readingTime", label: "Reading time", note: "Estimated at 200 words per minute" },
] as const;

export function WordCharacterCounter() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const counts = useMemo(() => countText(text), [text]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Text copied to clipboard.");
    } catch {
      setFeedback("Could not access the clipboard. Select the text and copy it manually.");
    }
  }

  function clearText() {
    setText("");
    setFeedback("Text cleared.");
  }

  return (
    <>
      <ToolWorkspace
        id="counter-workspace"
        title="Your text"
        description="Type or paste text below. Every statistic updates as you edit."
      >
        <ToolTextarea
          id="counter-text"
          label="Text to count"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFeedback("");
          }}
          placeholder="Start typing or paste your text here…"
          hint="Your text is processed on this device. There is no character limit imposed by this tool."
          rows={10}
          className="min-h-56 resize-y sm:min-h-72"
          spellCheck
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={clearText} variant="secondary" className="min-h-11 border-border">Clear text</Button>
          <Button onClick={copyText} disabled={!text} className="min-h-11">Copy text</Button>
          <span role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-muted">{feedback}</span>
        </div>

        <ToolPrivacyNote
          id="counter-privacy"
          message="Your text stays in your browser. Nothing you type is uploaded or saved to our servers. The tool does not store your text in browser storage or include it in Analytics events."
        />
      </ToolWorkspace>

      <section aria-labelledby="counter-results-heading" className="mt-6">
        <div className="mb-4">
          <h2 id="counter-results-heading" className="font-heading text-xl font-semibold text-text">Your counts</h2>
          <p className="mt-1 text-sm text-muted">A live summary of the text in the editor.</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {statisticCards.map((statistic) => (
            <div key={statistic.key} className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-[0_2px_8px_rgba(22,35,63,0.035)] sm:p-5">
              <dt className="text-xs font-semibold leading-snug text-muted sm:text-sm">{statistic.label}</dt>
              <dd className="mt-2 break-words font-heading text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {counts[statistic.key]}
              </dd>
              <p className="mt-1 text-xs leading-relaxed text-muted">{statistic.note}</p>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
