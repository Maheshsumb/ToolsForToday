"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyActionProps {
  text: string;
  label?: string;
}

export function CopyAction({ text, label = "Copy text" }: CopyActionProps) {
  const [message, setMessage] = useState("");
  if (!text.trim()) return null;

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={copyText} className="min-h-11 border-border">{label}</Button>
      <span role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted">{message}</span>
    </div>
  );
}
