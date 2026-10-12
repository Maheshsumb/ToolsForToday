"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolInput } from "@/components/tools/tool-input";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolSelect } from "@/components/tools/tool-select";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import {
  convertUnitInput,
  formatUnitValue,
  getDefaultUnitPair,
  UNIT_CATEGORIES,
  UNIT_CATEGORIES_INFO,
  type UnitCategory,
} from "@/lib/unit-conversions";

const categoryOptions = UNIT_CATEGORIES.map((id) => ({ value: id, label: UNIT_CATEGORIES_INFO[id].label }));

const errorMessages = {
  missing: "Enter a value to see the conversion.",
  invalid: "Enter a valid finite number, such as 12 or -3.5.",
  "below-absolute-zero": "That temperature is below absolute zero and cannot be converted.",
  overflow: "The result is outside the range of finite numbers JavaScript can represent.",
  underflow: "The result is too small for JavaScript numeric precision to represent.",
  "category-mismatch": "Choose units from the selected category.",
} as const;

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [value, setValue] = useState("");
  const [units, setUnits] = useState(() => getDefaultUnitPair("length"));
  const [feedback, setFeedback] = useState("");

  const categoryInfo = UNIT_CATEGORIES_INFO[category];
  const fromUnit = categoryInfo.units.find((unit) => unit.id === units.from) ?? categoryInfo.units[0];
  const toUnit = categoryInfo.units.find((unit) => unit.id === units.to) ?? categoryInfo.units[1];
  const conversion = useMemo(() => value.trim()
    ? convertUnitInput(value, category, fromUnit.id, toUnit.id)
    : null, [category, fromUnit.id, toUnit.id, value]);
  const result = conversion?.ok ? formatUnitValue(conversion.value) : "";
  const formula = conversion?.ok
    ? `${formatUnitValue(Number(value))} ${fromUnit.symbol} = ${result} ${toUnit.symbol}`
    : "";

  function changeCategory(nextCategory: UnitCategory) {
    setCategory(nextCategory);
    setUnits(getDefaultUnitPair(nextCategory));
    setFeedback("");
  }

  async function copyResult() {
    if (!conversion?.ok) return;
    try {
      await navigator.clipboard.writeText(`${result} ${toUnit.symbol}`);
      setFeedback("Result copied to clipboard.");
    } catch {
      setFeedback("Could not access the clipboard. Select and copy the result manually.");
    }
  }

  function clear() {
    setValue("");
    setFeedback("Input and result cleared.");
  }

  const error = conversion && !conversion.ok ? errorMessages[conversion.error] : undefined;

  return (
    <ToolWorkspace id="unit-converter-workspace" title="Convert a measurement" description="Choose a category and units. The result updates as you enter a value or change a selection.">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <ToolSelect
          id="unit-category"
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(event) => changeCategory(event.target.value as UnitCategory)}
        />
        <ToolInput
          id="unit-value"
          label={`Value${error ? "" : " to convert"}`}
          type="number"
          inputMode="decimal"
          step="any"
          value={value}
          onChange={(event) => { setValue(event.target.value); setFeedback(""); }}
          error={error}
          hint={category === "temperature" ? "Temperatures below absolute zero are not allowed." : "Negative values are accepted as signed quantities."}
        />
        <ToolSelect
          id="unit-from"
          label="From unit"
          options={categoryInfo.units.map(({ id, label, symbol }) => ({ value: id, label: `${label} (${symbol})` }))}
          value={fromUnit.id}
          onChange={(event) => { setUnits((current) => ({ ...current, from: event.target.value })); setFeedback(""); }}
        />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <ToolSelect
            id="unit-to"
            label="To unit"
            options={categoryInfo.units.map(({ id, label, symbol }) => ({ value: id, label: `${label} (${symbol})` }))}
            value={toUnit.id}
            onChange={(event) => { setUnits((current) => ({ ...current, to: event.target.value })); setFeedback(""); }}
          />
          <Button
            type="button"
            variant="secondary"
            className="mb-0 min-h-12 border-border px-3 sm:px-4"
            onClick={() => { setUnits((current) => ({ from: current.to, to: current.from })); setFeedback(""); }}
            aria-label={`Swap ${fromUnit.label} and ${toUnit.label}`}
          >
            <span aria-hidden="true">⇄</span><span className="sr-only sm:not-sr-only sm:ml-2">Swap</span>
          </Button>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="mt-6 min-w-0 rounded-2xl border border-border bg-surface-muted/55 p-5 sm:p-6">
        <p className="text-sm font-semibold text-muted">Converted result</p>
        {conversion?.ok ? (
          <>
            <output className="mt-1 block break-words font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {result} <span className="text-2xl sm:text-3xl">{toUnit.symbol}</span>
            </output>
            <p className="mt-3 break-words text-sm text-muted">{formula}</p>
          </>
        ) : (
          <p className={`mt-2 text-sm ${error ? "font-medium text-error" : "text-muted"}`}>
            {error ?? "Enter a value above to convert instantly."}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={clear} variant="secondary" className="min-h-11 border-border">Clear</Button>
        <Button type="button" onClick={copyResult} disabled={!conversion?.ok} className="min-h-11">Copy Result</Button>
        <span role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-muted">{feedback}</span>
      </div>

      {category === "mass" ? <p className="mt-4 text-sm leading-relaxed text-muted">These conversions measure mass. Everyday language often says “weight,” but weight is a force that depends on gravity.</p> : null}
      {category === "volume" ? <p className="mt-4 text-sm leading-relaxed text-muted">Cup, spoon, and customary liquid units are US definitions; they are not UK imperial units.</p> : null}
      {category === "time" ? <p className="mt-4 text-sm leading-relaxed text-muted">A day is fixed at 24 hours and a week at 7 days. Calendar months and daylight-saving changes are not included.</p> : null}

      <ToolPrivacyNote id="unit-converter-privacy" message="Conversions are calculated in your browser. Your entered values are not sent to our servers." />
    </ToolWorkspace>
  );
}
