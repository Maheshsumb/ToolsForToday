"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ToolInput } from "@/components/tools/tool-input";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import {
  calculateAdjustedValue,
  calculatePercentageChange,
  calculatePercentageOf,
  calculateWhatPercentage,
  formatCalculationNumber,
  type AdjustmentDirection,
  type CalculationResult,
  type PercentageCalculatorMode,
} from "@/lib/percentage-calculations";

type InputKey = "percentage" | "number" | "part" | "total" | "original" | "newValue";
type CalculatorInputs = Record<InputKey, string>;

const emptyInputs: CalculatorInputs = {
  percentage: "",
  number: "",
  part: "",
  total: "",
  original: "",
  newValue: "",
};

const modeOptions: { id: PercentageCalculatorMode; label: string; question: string }[] = [
  { id: "percentageOf", label: "Percentage of a number", question: "What is X% of Y?" },
  { id: "whatPercentage", label: "What percentage?", question: "X is what percent of Y?" },
  { id: "percentageChange", label: "Percentage change", question: "How much did a value change?" },
  { id: "adjustByPercentage", label: "Increase or decrease", question: "Apply a percentage to a value." },
];

const fieldDefinitions: Record<Exclude<PercentageCalculatorMode, "adjustByPercentage">, { key: InputKey; label: string }[]> = {
  percentageOf: [
    { key: "percentage", label: "Percentage (X)" },
    { key: "number", label: "Number (Y)" },
  ],
  whatPercentage: [
    { key: "part", label: "Part (X)" },
    { key: "total", label: "Total (Y)" },
  ],
  percentageChange: [
    { key: "original", label: "Original value" },
    { key: "newValue", label: "New value" },
  ],
};

const errorMessages = {
  missing: "Enter a number.",
  invalid: "Enter a valid finite number.",
  "division-by-zero": "This value cannot be zero for this calculation.",
  "negative-percentage": "Enter a percentage of zero or more.",
  overflow: "The result is outside the range of finite numbers JavaScript can represent.",
} as const;

function getResultError(result: Extract<CalculationResult, { ok: false }>, mode: PercentageCalculatorMode): string {
  if (result.error === "division-by-zero") {
    return mode === "percentageChange"
      ? "Percentage change is undefined when the original value is zero."
      : "A percentage of a total is undefined when the total is zero.";
  }
  if (result.error === "missing") return "Complete the required number fields to see a result.";
  return errorMessages[result.error];
}

export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageCalculatorMode>("percentageOf");
  const [inputs, setInputs] = useState<CalculatorInputs>(emptyInputs);
  const [direction, setDirection] = useState<AdjustmentDirection>("increase");
  const [feedback, setFeedback] = useState("");

  const fields = useMemo(() => mode === "adjustByPercentage"
    ? [
      { key: "number" as const, label: "Original number" },
      { key: "percentage" as const, label: "Percentage" },
    ]
    : fieldDefinitions[mode], [mode]);

  const calculation = useMemo<CalculationResult | null>(() => {
    if (!fields.some(({ key }) => inputs[key].trim() !== "")) return null;
    switch (mode) {
      case "percentageOf":
        return calculatePercentageOf(inputs.percentage, inputs.number);
      case "whatPercentage":
        return calculateWhatPercentage(inputs.part, inputs.total);
      case "percentageChange":
        return calculatePercentageChange(inputs.original, inputs.newValue);
      case "adjustByPercentage":
        return calculateAdjustedValue(inputs.number, inputs.percentage, direction);
    }
  }, [direction, fields, inputs, mode]);

  const resultText = useMemo(() => {
    if (!calculation?.ok) return "";
    const formatted = formatCalculationNumber(calculation.value);
    if (mode === "whatPercentage") return `${formatted}%`;
    if (mode === "percentageChange") {
      const signedValue = calculation.value > 0 ? `+${formatted}` : formatted;
      const changeDirection = calculation.value > 0 ? "increase" : calculation.value < 0 ? "decrease" : "no change";
      return `${signedValue}% ${changeDirection}`;
    }
    return formatted;
  }, [calculation, mode]);

  const formula = useMemo(() => {
    if (!calculation?.ok) return "";
    const number = (value: string) => formatCalculationNumber(Number(value));
    switch (mode) {
      case "percentageOf":
        return `${number(inputs.percentage)} ÷ 100 × ${number(inputs.number)} = ${formatCalculationNumber(calculation.value)}`;
      case "whatPercentage":
        return `${number(inputs.part)} ÷ ${number(inputs.total)} × 100 = ${formatCalculationNumber(calculation.value)}%`;
      case "percentageChange":
        return `(${number(inputs.newValue)} − ${number(inputs.original)}) ÷ |${number(inputs.original)}| × 100 = ${formatCalculationNumber(calculation.value)}%`;
      case "adjustByPercentage":
        return `${number(inputs.number)} × (1 ${direction === "increase" ? "+" : "−"} ${number(inputs.percentage)} ÷ 100) = ${formatCalculationNumber(calculation.value)}`;
    }
  }, [calculation, direction, inputs.newValue, inputs.number, inputs.original, inputs.part, inputs.percentage, inputs.total, mode]);

  function changeMode(nextMode: PercentageCalculatorMode) {
    setMode(nextMode);
    setInputs(emptyInputs);
    setFeedback("");
  }

  function updateInput(key: InputKey, event: ChangeEvent<HTMLInputElement>) {
    setInputs((current) => ({ ...current, [key]: event.target.value }));
    setFeedback("");
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(resultText);
      setFeedback("Result copied to clipboard.");
    } catch {
      setFeedback("Could not access the clipboard. Select and copy the result manually.");
    }
  }

  function clearInputs() {
    setInputs(emptyInputs);
    setFeedback("Inputs and result cleared.");
  }

  function fieldError(key: InputKey): string | undefined {
    if (!calculation || calculation.ok || calculation.field !== key) return undefined;
    return errorMessages[calculation.error];
  }

  return (
    <>
      <ToolWorkspace id="percentage-workspace" title="Choose a calculation" description="Select a question, enter the values, and see the result update as you type.">
        <fieldset>
          <legend className="text-sm font-semibold text-text">Calculation type</legend>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modeOptions.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${mode === option.id ? "border-deep-navy bg-surface-muted/55" : "border-border bg-surface hover:border-[#BBC8D9]"}`}
              >
                <input
                  type="radio"
                  name="percentage-calculation-mode"
                  value={option.id}
                  checked={mode === option.id}
                  onChange={() => changeMode(option.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-deep-navy"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{option.question}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "adjustByPercentage" ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-text">Adjustment</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["increase", "decrease"] as const).map((value) => (
                <label key={value} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${direction === value ? "border-deep-navy bg-surface-muted/55 text-text" : "border-border bg-surface text-muted"}`}>
                  <input
                    type="radio"
                    name="percentage-adjustment-direction"
                    value={value}
                    checked={direction === value}
                    onChange={() => setDirection(value)}
                    className="h-4 w-4 accent-deep-navy"
                  />
                  {value === "increase" ? "Increase by" : "Decrease by"}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ key, label }) => (
            <ToolInput
              key={key}
              id={`percentage-${key}`}
              label={label}
              type="number"
              inputMode="decimal"
              step="any"
              value={inputs[key]}
              onChange={(event) => updateInput(key, event)}
              error={fieldError(key)}
              hint={key === "percentage" && mode === "adjustByPercentage" ? "Use zero or a positive percentage." : undefined}
            />
          ))}
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="mt-6 min-w-0 rounded-2xl border border-border bg-surface-muted/55 p-5 sm:p-6"
        >
          <p className="text-sm font-semibold text-muted">
            {calculation?.ok
              ? mode === "whatPercentage" ? "Percentage of total" : mode === "percentageChange" ? "Percentage change" : "Result"
              : "Your result"}
          </p>
          {calculation?.ok ? (
            <>
              <output className="mt-1 block break-words font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">{resultText}</output>
              <p className="mt-3 break-words text-sm text-muted">{formula}</p>
            </>
          ) : (
            <p className={`mt-2 text-sm ${calculation && !calculation.ok ? "font-medium text-error" : "text-muted"}`}>
              {calculation && !calculation.ok
                ? getResultError(calculation, mode)
                : "Enter the values above to calculate instantly."}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={clearInputs} variant="secondary" className="min-h-11 border-border">Clear</Button>
          <Button onClick={copyResult} disabled={!calculation?.ok} className="min-h-11">Copy Result</Button>
          <span role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-muted">{feedback}</span>
        </div>

        <ToolPrivacyNote
          id="percentage-privacy"
          message="Calculations happen in your browser. Your entered numbers are not sent to our servers."
        />
      </ToolWorkspace>

      <section aria-labelledby="percentage-examples-heading" className="mt-10">
        <h2 id="percentage-examples-heading" className="font-heading text-xl font-semibold text-text">Common percentage calculations</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-border bg-surface p-4 text-sm text-muted"><span className="font-semibold text-text">Discount:</span> 15% of $80 is $12.</li>
          <li className="rounded-xl border border-border bg-surface p-4 text-sm text-muted"><span className="font-semibold text-text">Change:</span> 100 to 125 is a 25% increase.</li>
          <li className="rounded-xl border border-border bg-surface p-4 text-sm text-muted"><span className="font-semibold text-text">Adjustment:</span> Decrease 200 by 15% to get 170.</li>
        </ul>
      </section>
    </>
  );
}
