"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { countText } from "@/lib/text-counts";
import { cleanCopiedText, DEFAULT_TEXT_CLEANER_OPTIONS, inspectInvisibleCharacters, type TextCleanerOptions } from "@/lib/ai-text-cleaner";

const areaClass = "block min-h-56 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 font-mono text-sm leading-relaxed text-text shadow-sm placeholder:text-muted/80 focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-72";

export function AiTextCleaner() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TextCleanerOptions>(DEFAULT_TEXT_CLEANER_OPTIONS);
  const [feedback, setFeedback] = useState("");
  const invisible = useMemo(() => inspectInvisibleCharacters(input), [input]);
  const cleaned = useMemo(() => cleanCopiedText(input, options), [input, options]);
  const beforeCounts = useMemo(() => countText(input), [input]);
  const afterCounts = useMemo(() => countText(cleaned), [cleaned]);

  function updateOption<K extends keyof TextCleanerOptions>(key: K, value: TextCleanerOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function toggleInvisible(codePoint: number, enabled: boolean) {
    const selected = new Set(options.removeInvisibleCodePoints);
    if (enabled) selected.add(codePoint);
    else selected.delete(codePoint);
    updateOption("removeInvisibleCodePoints", [...selected]);
  }

  async function pasteText() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setInput((current) => current + clipboardText);
      setFeedback("Text pasted from clipboard.");
    } catch {
      setFeedback("Clipboard access was not available. Paste directly into the input box instead.");
    }
  }

  async function copyCleanedText() {
    try {
      await navigator.clipboard.writeText(cleaned);
      setFeedback("Cleaned text copied to the clipboard.");
    } catch {
      setFeedback("Clipboard access failed. Select the cleaned text and copy it manually.");
    }
  }

  function download() {
    const blob = new Blob([cleaned], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "toolsfortoday-cleaned-text.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Downloaded cleaned text as TXT.");
  }

  const checkboxClass = "h-4 w-4 shrink-0 accent-[#16233F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

  return (
    <>
      <ToolWorkspace id="text-cleaner-workspace" title="Clean copied text" description="Choose the formatting fixes you want. The basic cleanup runs locally and never sends your text to an AI service.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={pasteText}>Paste</Button>
          <Button variant="secondary" onClick={() => { setInput(""); setFeedback("Input cleared."); }} disabled={!input}>Clear</Button>
          <Button onClick={copyCleanedText} disabled={!cleaned}>Copy cleaned text</Button>
          <Button variant="secondary" onClick={download} disabled={!cleaned}>Download TXT</Button>
          <span role="status" aria-live="polite" aria-atomic="true" className="self-center text-sm text-muted">{feedback}</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="cleaner-input" className="mb-1.5 block text-sm font-semibold text-text">Original text</label>
            <textarea id="cleaner-input" value={input} onChange={(event) => { setInput(event.target.value); setFeedback(""); }} placeholder="Paste or type copied text here…" className={areaClass} spellCheck />
            <p className="mt-2 text-xs text-muted">{beforeCounts.words} words · {beforeCounts.characters} characters</p>
          </div>
          <div>
            <label htmlFor="cleaner-output" className="mb-1.5 block text-sm font-semibold text-text">Cleaned preview</label>
            <textarea id="cleaner-output" value={cleaned} readOnly className={`${areaClass} bg-surface-muted/50`} aria-label="Cleaned text preview" />
            <p className="mt-2 text-xs text-muted">{afterCounts.words} words · {afterCounts.characters} characters</p>
          </div>
        </div>

        <fieldset className="mt-6 rounded-xl border border-border bg-surface-muted/35 p-4">
          <legend className="px-1 font-semibold text-text">Basic cleanup</legend>
          <div className="grid gap-1 sm:grid-cols-2">
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text"><input className={checkboxClass} type="checkbox" checked={options.normalizeLineEndings} onChange={(event) => updateOption("normalizeLineEndings", event.target.checked)} />Normalize line breaks</label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text"><input className={checkboxClass} type="checkbox" checked={options.trimTrailingWhitespace} onChange={(event) => updateOption("trimTrailingWhitespace", event.target.checked)} />Remove trailing line spaces</label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text"><input className={checkboxClass} type="checkbox" checked={options.limitBlankLines} onChange={(event) => updateOption("limitBlankLines", event.target.checked)} />Limit repeated blank lines</label>
          </div>
        </fieldset>

        <details className="mt-3 rounded-xl border border-border bg-surface-muted/35 p-4">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Advanced options</summary>
          <div className="grid gap-1 sm:grid-cols-2">
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text"><input className={checkboxClass} type="checkbox" checked={options.collapseRepeatedSpaces} onChange={(event) => updateOption("collapseRepeatedSpaces", event.target.checked)} />Collapse repeated spaces and tabs</label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text"><input className={checkboxClass} type="checkbox" checked={options.normalizeSpecialSpaces} onChange={(event) => updateOption("normalizeSpecialSpaces", event.target.checked)} />Convert selected special spaces to regular spaces</label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-text sm:col-span-2"><input className={checkboxClass} type="checkbox" checked={options.stripBasicMarkdown} onChange={(event) => updateOption("stripBasicMarkdown", event.target.checked)} />Remove common Markdown formatting (headings, emphasis, lists, and link syntax)</label>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-semibold text-text">Invisible character inspection</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">Characters are preserved unless you select an individual type to remove. Joiners, direction marks, and other invisible characters can matter in multilingual text and emoji.</p>
            {invisible.length === 0 ? <p className="mt-3 text-sm text-muted">No characters from the inspection list were found.</p> : (
              <div className="mt-2 grid gap-1">
                {invisible.map((character) => (
                  <label key={character.codePoint} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-text hover:bg-surface-muted">
                    <input className={checkboxClass} type="checkbox" checked={options.removeInvisibleCodePoints.includes(character.codePoint)} onChange={(event) => toggleInvisible(character.codePoint, event.target.checked)} />
                    <span className="min-w-0 flex-1">{character.name} <span className="text-muted">(U+{character.codePoint.toString(16).toUpperCase().padStart(4, "0")}; {character.note})</span></span>
                    <span className="text-muted">×{character.count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </details>
      </ToolWorkspace>

      <ToolPrivacyNote id="cleaner-privacy" message="All cleanup happens locally in this browser. Input and output are not sent to an AI service, ToolsForToday processing server, or Analytics events. This tool changes formatting only; it does not determine who or what wrote the text, remove AI watermarks, or guarantee detector results." />
    </>
  );
}
