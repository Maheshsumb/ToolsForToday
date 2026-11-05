"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { countText } from "@/lib/text-counts";
import { countNoteLines, replaceNoteText } from "@/lib/online-notepad";
import { notePersistence, type NotePersistenceState } from "@/lib/online-notepad-persistence";

type SaveState = "loading" | "saved" | "saving" | "error";

export function OnlineNotepad() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(() => notePersistence.getSnapshot().status);
  const [saveMessage, setSaveMessage] = useState(() => notePersistence.getSnapshot().message);
  const [feedback, setFeedback] = useState("");
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [matchCase, setMatchCase] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const counts = useMemo(() => countText(text), [text]);

  useEffect(() => {
    let active = true;
    const unsubscribe = notePersistence.subscribe((state: NotePersistenceState) => {
      if (!active) return;
      setSaveState(state.status);
      setSaveMessage(state.message);
    });
    notePersistence.load().then((saved) => {
      if (!active) return;
      setText(saved);
    }).catch(() => {
      if (!active) return;
      setSaveState("error");
      setSaveMessage("Browser storage could not be opened. Your edits may not persist after this page closes.");
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
      void notePersistence.flush().catch(() => undefined);
    };
  }, []);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Note copied to the clipboard.");
    } catch {
      setFeedback("Clipboard access failed. Select the note and copy it manually.");
    }
  }

  function download(extension: "txt" | "md") {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `toolsfortoday-note.${extension}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(`Downloaded toolsfortoday-note.${extension}.`);
  }

  function startNewNote() {
    if (text && !window.confirm("Start a new blank note? This replaces the note saved in this browser.")) return;
    setText("");
    notePersistence.update("");
    setFeedback("New blank note started.");
    editorRef.current?.focus();
  }

  function clearNote() {
    if (!text) return;
    if (!window.confirm("Clear this note and delete its saved copy from this browser?")) return;
    setText("");
    void notePersistence.clear().catch(() => undefined);
    setFeedback("Note cleared.");
    editorRef.current?.focus();
  }

  function replaceAll() {
    if (!findValue) {
      setFeedback("Enter text to find first.");
      return;
    }
    const result = replaceNoteText(text, findValue, replaceValue, matchCase);
    if (result.replacements === 0) {
      setFeedback("No matches found.");
      return;
    }
    setText(result.text);
    setFeedback(`Replaced ${result.replacements} ${result.replacements === 1 ? "match" : "matches"}.`);
  }

  const statusTone = saveState === "error" ? "text-error" : saveState === "saved" ? "text-[#14563F]" : "text-muted";

  return (
    <>
      <ToolWorkspace id="notepad-workspace" title="Your note" description="Type or paste a note. It autosaves to this browser after a short pause.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite" aria-atomic="true" className={`text-sm font-medium ${statusTone}`}>{saveMessage}</p>
          <p className="text-xs text-muted">Undo and redo use your browser’s native editor shortcuts (Ctrl/⌘+Z and Ctrl/⌘+Shift+Z).</p>
        </div>
        <label htmlFor="notepad-text" className="mb-1.5 block text-sm font-semibold text-text">Note text</label>
        <textarea
          ref={editorRef}
          id="notepad-text"
          value={text}
          onChange={(event) => { setText(event.target.value); notePersistence.update(event.target.value); setFeedback(""); }}
          placeholder="Start typing or paste your note…"
          rows={15}
          spellCheck
          disabled={!ready}
          className="block min-h-[22rem] w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 font-mono text-base leading-relaxed text-text shadow-sm placeholder:text-muted/80 focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-70 sm:min-h-[30rem]"
        />
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-surface-muted/70 p-3"><dt className="text-xs text-muted">Words</dt><dd className="font-semibold text-text">{counts.words}</dd></div>
          <div className="rounded-lg bg-surface-muted/70 p-3"><dt className="text-xs text-muted">Characters</dt><dd className="font-semibold text-text">{counts.characters}</dd></div>
          <div className="rounded-lg bg-surface-muted/70 p-3"><dt className="text-xs text-muted">Lines</dt><dd className="font-semibold text-text">{countNoteLines(text)}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={startNewNote} disabled={!ready}>New Note</Button>
          <Button variant="secondary" onClick={clearNote} disabled={!ready || !text}>Clear Note</Button>
          <Button variant="secondary" onClick={copyText} disabled={!text}>Copy Text</Button>
          <Button variant="secondary" onClick={() => download("txt")} disabled={!text}>Download TXT</Button>
          <Button variant="secondary" onClick={() => download("md")} disabled={!text}>Download Markdown</Button>
          <span role="status" aria-live="polite" className="self-center text-sm text-muted">{feedback}</span>
        </div>

        <section aria-labelledby="notepad-find-heading" className="mt-7 rounded-xl border border-border bg-surface-muted/40 p-4">
          <h3 id="notepad-find-heading" className="font-semibold text-text">Find and replace</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="notepad-find" className="mb-1 block text-sm font-medium text-text">Find</label>
              <input id="notepad-find" value={findValue} onChange={(event) => setFindValue(event.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
            </div>
            <div>
              <label htmlFor="notepad-replace" className="mb-1 block text-sm font-medium text-text">Replace with</label>
              <input id="notepad-replace" value={replaceValue} onChange={(event) => setReplaceValue(event.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
            </div>
          </div>
          <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-text"><input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} className="h-4 w-4 accent-[#16233F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />Match case</label>
          <div><Button variant="secondary" onClick={replaceAll} disabled={!ready}>Replace all</Button></div>
        </section>
      </ToolWorkspace>

      <ToolPrivacyNote id="notepad-privacy" message="Your note is stored only in IndexedDB in this browser and is not sent to a ToolsForToday processing server or Analytics. This is not permanent storage: clearing browser data, using private browsing, storage eviction, or switching devices may lose the note. Download a copy to keep it elsewhere." />
    </>
  );
}
