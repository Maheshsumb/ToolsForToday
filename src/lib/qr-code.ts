import QRCode, { type QRCodeRenderersOptions } from "qrcode";

export const QR_CODE_SIZES = [256, 512, 1024] as const;
export type QrCodeSize = (typeof QR_CODE_SIZES)[number];

export const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrectionLevel = (typeof QR_ERROR_CORRECTION_LEVELS)[number];
export type QrInputMode = "text" | "url";

export interface QrCodeOptions {
  size: QrCodeSize;
  foreground: string;
  background: string;
  errorCorrectionLevel: QrErrorCorrectionLevel;
}

export type QrInputValidation =
  | { ok: true; content: string }
  | { ok: false; error: "empty" | "invalid-url" | "unsupported-url" };

export const DEFAULT_QR_OPTIONS: QrCodeOptions = {
  size: 512,
  foreground: "#000000",
  background: "#ffffff",
  errorCorrectionLevel: "M",
};

export function validateQrInput(value: string, mode: QrInputMode): QrInputValidation {
  if (value.length === 0) return { ok: false, error: "empty" };
  if (mode === "text") return { ok: true, content: value };
  if (value.trim() !== value) return { ok: false, error: "invalid-url" };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "invalid-url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, error: "unsupported-url" };
  return { ok: true, content: value };
}

export function isValidQrColor(value: string): boolean {
  return /^#[\da-f]{6}$/i.test(value);
}

function relativeLuminance(hexColor: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getQrColorContrast(foreground: string, background: string): number | null {
  if (!isValidQrColor(foreground) || !isValidQrColor(background)) return null;
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

export function hasLowQrContrast(foreground: string, background: string): boolean {
  const contrast = getQrColorContrast(foreground, background);
  return contrast === null || contrast < 4.5;
}

function createRenderOptions(options: QrCodeOptions): QRCodeRenderersOptions {
  return {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: 4,
    width: options.size,
    color: { dark: options.foreground, light: options.background },
  };
}

export function generateQrCodeSvg(content: string, options: QrCodeOptions): Promise<string> {
  return QRCode.toString(content, { ...createRenderOptions(options), type: "svg" });
}

export function generateQrCodePngDataUrl(content: string, options: QrCodeOptions): Promise<string> {
  return QRCode.toDataURL(content, { ...createRenderOptions(options), type: "image/png" });
}
