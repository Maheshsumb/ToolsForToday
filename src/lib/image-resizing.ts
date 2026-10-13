export type ImageFormat = "jpeg" | "png" | "webp";

export const MAX_OUTPUT_DIMENSION = 8_000;
export const MAX_OUTPUT_PIXELS = 25_000_000;
export const MAX_OUTPUT_BYTES_ESTIMATE = 256 * 1024 * 1024;

export type CropRatio = "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OutputSize {
  width: number;
  height: number;
}

export const CROP_RATIOS: readonly CropRatio[] = ["free", "1:1", "4:3", "3:4", "16:9", "9:16"];
export const WIDTH_PRESETS = [512, 1024, 1080, 1920] as const;

const ratioValues: Record<Exclude<CropRatio, "free">, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

export function validateOutputSize(width: number, height: number): OutputSize {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new Error("Enter positive whole-number dimensions in pixels.");
  }
  if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION || width * height > MAX_OUTPUT_PIXELS) {
    throw new Error(`Output must be no larger than ${MAX_OUTPUT_DIMENSION.toLocaleString("en-US")} px per side and ${MAX_OUTPUT_PIXELS.toLocaleString("en-US")} total pixels.`);
  }
  return { width, height };
}

export function validateProcessingMemory(sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number): void {
  if (![sourceWidth, sourceHeight, outputWidth, outputHeight].every(Number.isSafeInteger)
    || [sourceWidth, sourceHeight, outputWidth, outputHeight].some((value) => value < 1)) {
    throw new Error("Image memory estimate requires positive whole-number dimensions.");
  }
  const estimatedBytes = sourceWidth * sourceHeight * 4 + outputWidth * outputHeight * 8;
  if (estimatedBytes > MAX_OUTPUT_BYTES_ESTIMATE) throw new Error("This source and output size would require too much browser memory. Reduce the output dimensions or choose a smaller image.");
}

export function calculateLockedSize(changed: "width" | "height", value: number, ratio: number): OutputSize {
  if (!Number.isFinite(value) || value < 1 || !Number.isFinite(ratio) || ratio <= 0) return { width: 0, height: 0 };
  return changed === "width"
    ? { width: Math.round(value), height: Math.max(1, Math.round(value / ratio)) }
    : { width: Math.max(1, Math.round(value * ratio)), height: Math.round(value) };
}

export function cropRatioValue(ratio: CropRatio): number | null {
  return ratio === "free" ? null : ratioValues[ratio];
}

export function clampCropRect(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
  if (![rect.x, rect.y, rect.width, rect.height, imageWidth, imageHeight].every(Number.isFinite)
    || imageWidth < 1 || imageHeight < 1 || rect.width <= 0 || rect.height <= 0) {
    throw new Error("Select a crop area inside the image.");
  }
  const x = Math.max(0, Math.min(Math.floor(rect.x), imageWidth - 1));
  const y = Math.max(0, Math.min(Math.floor(rect.y), imageHeight - 1));
  const right = Math.max(x + 1, Math.min(Math.ceil(rect.x + rect.width), imageWidth));
  const bottom = Math.max(y + 1, Math.min(Math.ceil(rect.y + rect.height), imageHeight));
  return { x, y, width: right - x, height: bottom - y };
}

export function cropFromDisplay(startX: number, startY: number, endX: number, endY: number, displayWidth: number, displayHeight: number, sourceWidth: number, sourceHeight: number): CropRect {
  if ([displayWidth, displayHeight, sourceWidth, sourceHeight].some((v) => !Number.isFinite(v) || v <= 0)) {
    throw new Error("The image preview dimensions are not available yet.");
  }
  const left = Math.max(0, Math.min(startX, endX));
  const top = Math.max(0, Math.min(startY, endY));
  const right = Math.min(displayWidth, Math.max(startX, endX));
  const bottom = Math.min(displayHeight, Math.max(startY, endY));
  return clampCropRect({
    x: left * sourceWidth / displayWidth,
    y: top * sourceHeight / displayHeight,
    width: (right - left) * sourceWidth / displayWidth,
    height: (bottom - top) * sourceHeight / displayHeight,
  }, sourceWidth, sourceHeight);
}

export function moveCrop(rect: CropRect, dx: number, dy: number, imageWidth: number, imageHeight: number): CropRect {
  if (![dx, dy].every(Number.isFinite)) throw new Error("Crop movement must use valid coordinates.");
  const width = Math.min(Math.round(rect.width), imageWidth);
  const height = Math.min(Math.round(rect.height), imageHeight);
  const x = Math.max(0, Math.min(Math.round(rect.x + dx), imageWidth - width));
  const y = Math.max(0, Math.min(Math.round(rect.y + dy), imageHeight - height));
  return { x, y, width, height };
}

export function applyCropRatio(rect: CropRect, ratio: CropRatio, imageWidth: number, imageHeight: number): CropRect {
  const target = cropRatioValue(ratio);
  if (target === null) return clampCropRect(rect, imageWidth, imageHeight);
  const base = clampCropRect(rect, imageWidth, imageHeight);
  let width = base.width;
  let height = Math.round(width / target);
  if (height > base.height) {
    height = base.height;
    width = Math.round(height * target);
  }
  width = Math.max(1, Math.min(width, imageWidth));
  height = Math.max(1, Math.min(height, imageHeight));
  return clampCropRect({ x: base.x, y: base.y, width, height }, imageWidth, imageHeight);
}

export function validateCrop(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    || rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0
    || rect.x + rect.width > imageWidth || rect.y + rect.height > imageHeight) {
    throw new Error("Crop coordinates must stay within the source image.");
  }
  return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
}

export function outputFilename(sourceName: string, format: ImageFormat): string {
  const stem = sourceName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${stem}-resized-cropped.${extension}`;
}

export function outputMime(format: ImageFormat): string {
  return format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
}
