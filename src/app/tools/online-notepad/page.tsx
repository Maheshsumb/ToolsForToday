import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { OnlineNotepad } from "@/components/tools/online-notepad";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { createPageMetadata } from "@/lib/seo-metadata";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "online-notepad") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: "Free Online Notepad — Write, Save & Download Notes | ToolsForToday",
  description: "Write in a free online notepad that autosaves locally in this browser. Find and replace text, count words and lines, then download TXT or Markdown.",
  path: "/tools/online-notepad/",
});

export default function OnlineNotepadPage() {
  return (
    <>
      <AnalyticsPageView page="onlineNotepad" />
      <ToolPageShell tool={tool}>
        <OnlineNotepad />
        <ToolHelpSection
          id="online-notepad-help"
          title="Using the Online Notepad"
          steps={["Type or paste a note. It is saved in this browser after a short pause; check the save status before leaving.", "Use Find and Replace for text changes, or choose Copy Text, Download TXT, or Download Markdown.", "Use your browser’s normal undo and redo shortcuts while the editor is focused."]}
          limitations={["This tool keeps one note in this browser profile. Starting a new note replaces that saved note.", "Browser storage is not permanent or a backup. Private browsing, clearing site data, storage eviction, or switching devices can make the note unavailable.", "IndexedDB must be available and writable for automatic saving. Copy or download important notes to keep another copy."]}
          faqs={[{ question: "Is my note uploaded?", answer: "No. The note is saved in IndexedDB on this device. It is not sent to a ToolsForToday processing server or included in Analytics events." }, { question: "Can I sync notes between devices?", answer: "No. This notepad has no account or remote sync. Download a file and move it yourself if you need it on another device." }]}
        />
      </ToolPageShell>
    </>
  );
}
