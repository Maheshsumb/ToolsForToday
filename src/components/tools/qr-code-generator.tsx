"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolTextarea } from "@/components/tools/tool-input";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import {
  DEFAULT_QR_OPTIONS,
  generateQrCodePngDataUrl,
  generateQrCodeSvg,
  hasLowQrContrast,
  isValidQrColor,
  QR_CODE_SIZES,
  QR_ERROR_CORRECTION_LEVELS,
  validateQrInput,
  type QrCodeOptions,
  type QrErrorCorrectionLevel,
  type QrInputMode,
  type QrCodeSize,
} from "@/lib/qr-code";

const errorCorrectionDescriptions: Record<QrErrorCorrectionLevel, string> = {
  L: "L — Low recovery",
  M: "M — Medium recovery (recommended)",
  Q: "Q — Higher recovery",
  H: "H — Highest recovery",
};

const inputErrors = {
  "invalid-url": "Enter a complete URL such as https://example.com.",
  "unsupported-url": "Only HTTP and HTTPS website links can be encoded as URLs.",
} as const;

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function pngDataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",", 2);
  if (!header.includes("image/png") || !encoded) throw new Error("The PNG data was empty.");
  const binary = window.atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: "image/png" });
}

export function QrCodeGenerator() {
  const [mode, setMode] = useState<QrInputMode>("text");
  const [content, setContent] = useState("");
  const [options, setOptions] = useState<QrCodeOptions>(DEFAULT_QR_OPTIONS);
  const [preview, setPreview] = useState<{ key: string; source: string } | null>(null);
  const [renderError, setRenderError] = useState<{ key: string; message: string } | null>(null);
  const [feedback, setFeedback] = useState("");

  const validation = useMemo(() => validateQrInput(content, mode), [content, mode]);
  const validContent = validation.ok ? validation.content : null;
  const colorError = [options.foreground, options.background].some((color) => !isValidQrColor(color)) ? "Enter colors in six-digit hexadecimal format, such as #1a2b3c." : "";
  const renderKey = validContent === null || colorError ? "" : JSON.stringify([validContent, options.size, options.foreground, options.background, options.errorCorrectionLevel]);
  const previewSource = preview?.key === renderKey ? preview.source : null;
  const generationError = renderError?.key === renderKey ? renderError.message : "";
  const inputError = validation.ok || validation.error === "empty" ? "" : inputErrors[validation.error];
  const lowContrast = !colorError && hasLowQrContrast(options.foreground, options.background);

  useEffect(() => {
    let current = true;
    if (validContent === null || colorError) return () => { current = false; };

    generateQrCodeSvg(validContent, options)
      .then((svg) => { if (current) setPreview({ key: renderKey, source: svgDataUrl(svg) }); })
      .catch(() => { if (current) setRenderError({ key: renderKey, message: "This content is too long for the selected error correction level. Shorten it or choose a lower level." }); });

    return () => { current = false; };
  }, [validContent, options, renderKey, colorError]);

  function updateOptions(patch: Partial<QrCodeOptions>) {
    setOptions((current) => ({ ...current, ...patch }));
    setFeedback("");
  }

  async function downloadPng() {
    if (validContent === null) return;
    try {
      const dataUrl = await generateQrCodePngDataUrl(validContent, options);
      downloadBlob(pngDataUrlToBlob(dataUrl), "toolsfortoday-qr-code.png");
      setFeedback("PNG download started.");
    } catch {
      setFeedback("Could not create the PNG. Shorten the content or choose a lower error correction level, then try again.");
    }
  }

  async function downloadSvg() {
    if (validContent === null) return;
    try {
      const svg = await generateQrCodeSvg(validContent, options);
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "toolsfortoday-qr-code.svg");
      setFeedback("SVG download started.");
    } catch {
      setFeedback("Could not create the SVG. Shorten the content or choose a lower error correction level, then try again.");
    }
  }

  function clear() {
    setContent("");
    setMode("text");
    setOptions(DEFAULT_QR_OPTIONS);
    setPreview(null);
    setRenderError(null);
    setFeedback("Input and QR preview cleared.");
  }

  return (
    <ToolWorkspace id="qr-code-generator-workspace" title="Create your QR code" description="Enter text or a website link. Your QR preview updates as you edit the content and settings.">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-text">Content type</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="QR content type">
              <Button type="button" variant={mode === "text" ? "primary" : "secondary"} aria-pressed={mode === "text"} onClick={() => { setMode("text"); setFeedback(""); }} className="min-h-11">Text</Button>
              <Button type="button" variant={mode === "url" ? "primary" : "secondary"} aria-pressed={mode === "url"} onClick={() => { setMode("url"); setFeedback(""); }} className="min-h-11">Website URL</Button>
            </div>
          </div>

          <ToolTextarea
            id="qr-code-content"
            label={mode === "url" ? "Website URL" : "Text to encode"}
            value={content}
            onChange={(event) => { setContent(event.target.value); setFeedback(""); }}
            placeholder={mode === "url" ? "https://example.com" : "Type or paste your text here"}
            hint={mode === "url" ? "Use a complete HTTP or HTTPS address. The link is encoded locally; this tool does not open it." : "Text is encoded as entered, including leading and trailing spaces."}
            error={inputError}
            className="min-h-32"
            autoComplete="off"
            spellCheck={mode === "text"}
          />

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="qr-code-size" className="mb-1.5 block text-sm font-semibold text-text">PNG size</label>
              <select id="qr-code-size" value={options.size} onChange={(event) => updateOptions({ size: Number(event.target.value) as QrCodeSize })} className="block min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text shadow-sm focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                {QR_CODE_SIZES.map((size) => <option key={size} value={size}>{size} × {size} px</option>)}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="qr-code-error-correction" className="mb-1.5 block text-sm font-semibold text-text">Error correction</label>
              <select id="qr-code-error-correction" value={options.errorCorrectionLevel} onChange={(event) => updateOptions({ errorCorrectionLevel: event.target.value as QrErrorCorrectionLevel })} className="block min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text shadow-sm focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                {QR_ERROR_CORRECTION_LEVELS.map((level) => <option key={level} value={level}>{errorCorrectionDescriptions[level]}</option>)}
              </select>
            </div>
          </div>
          <p className="-mt-3 text-xs leading-relaxed text-muted">Higher correction can recover from more damage, but makes the code denser and leaves less room for content.</p>

          <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold text-text">Colors</legend>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3">
              <input id="qr-code-foreground" type="color" value={options.foreground} onChange={(event) => updateOptions({ foreground: event.target.value })} className="h-11 w-14 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
              <div className="min-w-0 flex-1"><label htmlFor="qr-code-foreground" className="text-sm font-medium text-text">Foreground</label><label htmlFor="qr-code-foreground-hex" className="sr-only">Foreground hex color</label><input id="qr-code-foreground-hex" type="text" value={options.foreground} maxLength={7} inputMode="text" autoCapitalize="none" spellCheck={false} onChange={(event) => updateOptions({ foreground: event.target.value })} className="mt-1 block min-h-9 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-sm text-text focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /></div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3">
              <input id="qr-code-background" type="color" value={options.background} onChange={(event) => updateOptions({ background: event.target.value })} className="h-11 w-14 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" />
              <div className="min-w-0 flex-1"><label htmlFor="qr-code-background" className="text-sm font-medium text-text">Background</label><label htmlFor="qr-code-background-hex" className="sr-only">Background hex color</label><input id="qr-code-background-hex" type="text" value={options.background} maxLength={7} inputMode="text" autoCapitalize="none" spellCheck={false} onChange={(event) => updateOptions({ background: event.target.value })} className="mt-1 block min-h-9 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-sm text-text focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" /></div>
            </div>
          </fieldset>
          {colorError ? <p role="alert" className="-mt-3 text-sm font-medium text-error">{colorError}</p> : null}
          {lowContrast ? <p role="status" className="-mt-3 text-sm font-medium text-[#805013]">These colors have low contrast and may be difficult for some QR readers to scan. Choose a darker foreground and lighter background.</p> : null}
        </div>

        <div className="flex min-w-0 flex-col items-center rounded-2xl border border-border bg-surface-muted/45 p-4 sm:p-6">
          <h3 className="font-heading text-lg font-semibold text-text">QR preview</h3>
          {previewSource ? (
            <figure className="mt-4 flex w-full min-w-0 flex-col items-center">
              <Image src={previewSource} width={256} height={256} unoptimized alt={`QR code preview for ${mode === "url" ? "the entered website URL" : "the entered text"}`} className="h-auto w-full max-w-64 rounded-lg" />
              <figcaption className="mt-3 text-center text-xs text-muted">Preview shown at a readable size. PNG export uses {options.size} × {options.size} px. A four-module quiet zone is included.</figcaption>
            </figure>
          ) : (
            <div className="mt-4 flex min-h-64 w-full max-w-64 items-center justify-center rounded-xl border border-dashed border-[#BBC8D9] bg-surface px-5 text-center text-sm text-muted">
              {generationError ? "QR code could not be generated. See the message below." : inputError ? "Fix the input above to generate a QR code." : "Enter text or a website URL to see your QR code."}
            </div>
          )}
          {generationError ? <p role="alert" className="mt-3 max-w-sm text-center text-sm font-medium text-error">{generationError}</p> : null}
          <div className="mt-5 flex w-full max-w-64 flex-col gap-2">
            <Button type="button" onClick={downloadPng} disabled={validContent === null || Boolean(colorError) || Boolean(generationError)} className="min-h-11 w-full">Download PNG</Button>
            <Button type="button" variant="secondary" onClick={downloadSvg} disabled={validContent === null || Boolean(colorError) || Boolean(generationError)} className="min-h-11 w-full border-border">Download SVG</Button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={clear} variant="secondary" className="min-h-11 border-border">Clear</Button>
        <span role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-muted">{feedback}</span>
      </div>

      <ToolPrivacyNote id="qr-code-privacy" message="Your QR code is generated in your browser. Your text and links are not uploaded to our servers." />
    </ToolWorkspace>
  );
}
