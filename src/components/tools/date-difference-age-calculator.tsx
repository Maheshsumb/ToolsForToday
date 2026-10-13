"use client";

import { useEffect, useMemo, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { ToolInput } from "@/components/tools/tool-input";
import { ToolPrivacyNote } from "@/components/tools/tool-help-section";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import {
  calculateAge,
  calculateDateDifference,
  calculateDaysUntilSince,
  createDateCalculatorState,
  dateCalculatorReducer,
  formatAgeCopyText,
  formatCalendarDate,
  formatCount,
  formatWeekBreakdown,
  formatDateDifferenceCopyText,
  formatDaysCopyText,
  getLocalTodayDate,
  type DateCalculatorMode,
} from "@/lib/date-calculations";

const modes: { value: DateCalculatorMode; label: string }[] = [
  { value: "difference", label: "Date difference" },
  { value: "age", label: "Age calculator" },
  { value: "days", label: "Days until / since" },
];

const errors = {
  "missing-date": "Enter a date in each required field.",
  "invalid-date": "Enter valid calendar dates.",
  "future-birth-date": "The birth date cannot be after the as-of date.",
} as const;

export function DateDifferenceAgeCalculator() {
  const [state, dispatch] = useReducer(dateCalculatorReducer, undefined, createDateCalculatorState);

  useEffect(() => {
    const updateToday = () => dispatch({ type: "set-today", value: getLocalTodayDate() });
    updateToday();
    document.addEventListener("visibilitychange", updateToday);
    return () => document.removeEventListener("visibilitychange", updateToday);
  }, []);

  const difference = useMemo(() => state.mode === "difference" && state.startDate && state.endDate
    ? calculateDateDifference(state.startDate, state.endDate) : null, [state.mode, state.startDate, state.endDate]);
  const age = useMemo(() => state.mode === "age" && state.birthDate && state.asOfDate
    ? calculateAge(state.birthDate, state.asOfDate) : null, [state.mode, state.birthDate, state.asOfDate]);
  const days = useMemo(() => state.mode === "days" && state.targetDate && state.today
    ? calculateDaysUntilSince(state.targetDate, state.today) : null, [state.mode, state.targetDate, state.today]);

  const error = difference && !difference.ok ? errors[difference.error]
    : age && !age.ok ? errors[age.error]
      : days && !days.ok ? errors[days.error] : "";

  async function copyResult() {
    let text = "";
    if (difference?.ok) text = formatDateDifferenceCopyText(state.startDate, state.endDate, difference);
    else if (age?.ok) text = formatAgeCopyText(state.birthDate, state.asOfDate, age);
    else if (days?.ok) text = formatDaysCopyText(state.targetDate, state.today, days);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      dispatch({ type: "set-feedback", value: "Result copied to clipboard." });
    } catch {
      dispatch({ type: "set-feedback", value: "Could not access the clipboard. Select and copy the result manually." });
    }
  }

  function changeMode(mode: DateCalculatorMode) {
    dispatch({ type: "set-mode", mode });
    if (mode === "age" && state.today) dispatch({ type: "set-field", field: "asOfDate", value: state.today });
  }

  const clear = () => dispatch({ type: "reset" });

  return (
    <ToolWorkspace id="date-calculator-workspace" title="Calculate dates" description="Choose a calculation, enter the dates, and see the calendar result update immediately.">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-text">Calculation</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {modes.map((mode) => (
            <label key={mode.value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${state.mode === mode.value ? "border-brand-accent bg-surface-muted text-text" : "border-border bg-surface text-muted"}`}>
              <input type="radio" name="date-calculator-mode" value={mode.value} checked={state.mode === mode.value} onChange={() => changeMode(mode.value)} className="h-4 w-4 accent-brand-accent" />
              {mode.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        {state.mode === "difference" ? <>
          <ToolInput id="date-start" label="Start date" type="date" value={state.startDate} onChange={(event) => dispatch({ type: "set-field", field: "startDate", value: event.target.value })} />
          <ToolInput id="date-end" label="End date" type="date" value={state.endDate} onChange={(event) => dispatch({ type: "set-field", field: "endDate", value: event.target.value })} />
        </> : null}
        {state.mode === "age" ? <>
          <ToolInput id="date-birth" label="Date of birth" type="date" value={state.birthDate} max={state.today || undefined} onChange={(event) => dispatch({ type: "set-field", field: "birthDate", value: event.target.value })} />
          <ToolInput id="date-as-of" label="Age as of" type="date" value={state.asOfDate} onChange={(event) => dispatch({ type: "set-field", field: "asOfDate", value: event.target.value })} hint="Defaults to today in your device's local calendar." />
        </> : null}
        {state.mode === "days" ? <>
          <ToolInput id="date-target" label="Target date" type="date" value={state.targetDate} onChange={(event) => dispatch({ type: "set-field", field: "targetDate", value: event.target.value })} />
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-semibold text-text">Today</p>
            <p className="flex min-h-12 items-center rounded-xl border border-border bg-surface-muted/55 px-3.5 py-3 text-base text-text">{state.today ? formatCalendarDate(state.today) : "Loading local date…"}</p>
          </div>
        </> : null}
      </div>

      <div aria-live="polite" aria-atomic="true" className="mt-6 min-w-0 rounded-2xl border border-border bg-surface-muted/55 p-5 sm:p-6">
        <p className="text-sm font-semibold text-muted">Result</p>
        {difference?.ok ? <>
          <output className="mt-1 block break-words font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">{difference.absoluteDays.toLocaleString()} calendar {difference.absoluteDays === 1 ? "day" : "days"}</output>
          <p className="mt-3 break-words text-sm text-muted">{difference.years} {difference.years === 1 ? "year" : "years"}, {difference.months} {difference.months === 1 ? "month" : "months"}, {difference.days} {difference.days === 1 ? "day" : "days"} · {formatWeekBreakdown(difference.wholeWeeks, difference.weekDays)}</p>
          <p className="mt-1 text-sm text-muted">{difference.direction === "same" ? "The dates are the same." : `The end date is ${formatCount(difference.absoluteDays.toLocaleString(), "day", "days")} ${difference.direction} the start date.`}</p>
        </> : null}
        {age?.ok ? <>
          <output className="mt-1 block break-words font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">{age.years} {age.years === 1 ? "year" : "years"}, {age.months} {age.months === 1 ? "month" : "months"}, {age.days} {age.days === 1 ? "day" : "days"}</output>
          <p className="mt-3 break-words text-sm text-muted">{formatCount(age.totalDaysLived.toLocaleString(), "total calendar day", "total calendar days")} lived · {age.daysUntilNextBirthday === null ? "Next birthday is beyond the supported date range." : `${age.daysUntilNextBirthday} ${age.daysUntilNextBirthday === 1 ? "day" : "days"} until the next birthday`}</p>
          {state.birthDate.endsWith("-02-29") ? <p className="mt-1 text-sm text-muted">In non-leap years, the birthday is observed on February 28 for this calculation.</p> : null}
        </> : null}
        {days?.ok ? <>
          <output className="mt-1 block break-words font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">{days.absoluteDays.toLocaleString()} {days.absoluteDays === 1 ? "day" : "days"} {days.direction === "future" ? "until" : days.direction === "past" ? "since" : "from today"}</output>
          <p className="mt-3 break-words text-sm text-muted">{formatWeekBreakdown(days.wholeWeeks, days.weekDays)} · Target: {formatCalendarDate(state.targetDate)}</p>
        </> : null}
        {!difference?.ok && !age?.ok && !days?.ok ? <p className={`mt-2 text-sm ${error ? "font-medium text-error" : "text-muted"}`}>{error || "Enter the required dates above to calculate."}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={clear} variant="secondary" className="min-h-11 border-border">Clear</Button>
        <Button type="button" onClick={copyResult} disabled={!difference?.ok && !age?.ok && !days?.ok} className="min-h-11">Copy Result</Button>
        <span role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-muted">{state.feedback}</span>
      </div>

      <ToolPrivacyNote id="date-calculator-privacy" message="Date calculations happen in your browser. The dates you enter are not sent to our servers; Analytics uses a fixed tool route and does not include your date values." />
    </ToolWorkspace>
  );
}
