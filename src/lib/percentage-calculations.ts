export type NumericInput = string | number | null | undefined;

export type PercentageCalculatorMode =
  | "percentageOf"
  | "whatPercentage"
  | "percentageChange"
  | "adjustByPercentage";

export type AdjustmentDirection = "increase" | "decrease";

export type CalculationError = "missing" | "invalid" | "division-by-zero" | "negative-percentage" | "overflow";

export type NumberParseResult =
  | { ok: true; value: number }
  | { ok: false; error: "missing" | "invalid" };

export type CalculationResult =
  | { ok: true; value: number }
  | { ok: false; error: CalculationError; field?: string };

const decimalNumberPattern = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/iu;

export function parseNumericInput(input: NumericInput): NumberParseResult {
  if (typeof input === "number") {
    return Number.isFinite(input)
      ? { ok: true, value: input }
      : { ok: false, error: "invalid" };
  }

  if (input === null || input === undefined || input.trim() === "") {
    return { ok: false, error: "missing" };
  }

  const normalized = input.trim();
  if (!decimalNumberPattern.test(normalized)) {
    return { ok: false, error: "invalid" };
  }

  const value = Number(normalized);
  return Number.isFinite(value)
    ? { ok: true, value }
    : { ok: false, error: "invalid" };
}

function getFieldValue(input: NumericInput, field: string): { ok: true; value: number } | { ok: false; error: "missing" | "invalid"; field: string } {
  const parsed = parseNumericInput(input);
  return parsed.ok ? parsed : { ...parsed, field };
}

function finishCalculation(value: number): CalculationResult {
  if (!Number.isFinite(value)) return { ok: false, error: "overflow" };
  return { ok: true, value: Object.is(value, -0) ? 0 : value };
}

export function calculatePercentageOf(percentageInput: NumericInput, numberInput: NumericInput): CalculationResult {
  const percentage = getFieldValue(percentageInput, "percentage");
  if (!percentage.ok) return percentage;

  const number = getFieldValue(numberInput, "number");
  if (!number.ok) return number;

  return finishCalculation((percentage.value / 100) * number.value);
}

export function calculateWhatPercentage(partInput: NumericInput, totalInput: NumericInput): CalculationResult {
  const part = getFieldValue(partInput, "part");
  if (!part.ok) return part;

  const total = getFieldValue(totalInput, "total");
  if (!total.ok) return total;
  if (total.value === 0) return { ok: false, error: "division-by-zero", field: "total" };

  return finishCalculation((part.value / total.value) * 100);
}

export function calculatePercentageChange(originalInput: NumericInput, newInput: NumericInput): CalculationResult {
  const original = getFieldValue(originalInput, "original");
  if (!original.ok) return original;

  const next = getFieldValue(newInput, "newValue");
  if (!next.ok) return next;
  if (original.value === 0) return { ok: false, error: "division-by-zero", field: "original" };

  // Scale before subtracting to avoid overflowing the intermediate new - original.
  const magnitude = Math.abs(original.value);
  const relativeChange = (next.value / magnitude) - (original.value / magnitude);
  return finishCalculation(relativeChange * 100);
}

export function calculateAdjustedValue(
  numberInput: NumericInput,
  percentageInput: NumericInput,
  direction: AdjustmentDirection,
): CalculationResult {
  const number = getFieldValue(numberInput, "number");
  if (!number.ok) return number;

  const percentage = getFieldValue(percentageInput, "percentage");
  if (!percentage.ok) return percentage;
  if (percentage.value < 0) return { ok: false, error: "negative-percentage", field: "percentage" };

  const multiplier = direction === "increase"
    ? 1 + (percentage.value / 100)
    : 1 - (percentage.value / 100);
  return finishCalculation(number.value * multiplier);
}

export function formatCalculationNumber(value: number, locale?: string): string {
  if (!Number.isFinite(value)) return "";
  const normalized = Object.is(value, -0) ? 0 : value;
  const formatter = new Intl.NumberFormat(locale, { maximumSignificantDigits: 15 });
  const formatted = formatter.format(normalized);

  // Keep a nonzero value visible if a locale's normal-format precision renders it as zero.
  if (normalized !== 0 && formatted === formatter.format(0)) {
    return new Intl.NumberFormat(locale, {
      maximumSignificantDigits: 15,
      notation: "scientific",
    }).format(normalized);
  }

  return formatted;
}
