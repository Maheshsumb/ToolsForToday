import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarDays,
  addCalendarMonthsClamped,
  addCalendarYearsClamped,
  calculateAge,
  calculateDateDifference,
  calculateDaysUntilSince,
  calendarDateToOrdinal,
  createDateCalculatorState,
  dateCalculatorReducer,
  daysInMonth,
  formatAgeCopyText,
  formatCalendarDate,
  formatCount,
  formatDateDifferenceCopyText,
  formatDaysCopyText,
  formatWeekBreakdown,
  isLeapYear,
  parseCalendarDate,
} from "./date-calculations.ts";

test("parses strict valid Gregorian calendar dates", () => {
  assert.deepEqual(parseCalendarDate("2024-02-29"), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(parseCalendarDate("0001-01-01"), { year: 1, month: 1, day: 1 });
  assert.deepEqual(parseCalendarDate("9999-12-31"), { year: 9999, month: 12, day: 31 });
});

test("rejects malformed and impossible calendar dates", () => {
  for (const value of ["", "2024-2-01", "24-02-01", "0000-01-01", "10000-01-01", "2023-02-29", "2024-02-30", "2024-04-31", "2024-13-01", "2024-00-10", "2024-01-00", " 2024-01-01", "2024-01-01T00:00:00Z"]) {
    assert.equal(parseCalendarDate(value), null, value);
  }
});

test("applies Gregorian leap-year rules, including century exceptions", () => {
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2023), false);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2024, 13), 0);
});

test("calculates same and consecutive calendar dates", () => {
  assert.equal(calculateDateDifference("2024-06-10", "2024-06-10").absoluteDays, 0);
  assert.equal(calculateDateDifference("2024-06-10", "2024-06-11").absoluteDays, 1);
  assert.equal(calculateDateDifference("2024-06-10", "2024-06-11").direction, "after");
});

test("calculates January 1 through January 11 as ten calendar days", () => {
  const result = calculateDateDifference("2025-01-01", "2025-01-11");
  assert.equal(result.ok, true);
  assert.equal(result.absoluteDays, 10);
  assert.deepEqual([result.years, result.months, result.days], [0, 0, 10]);
});

test("calculates leap day differences and leap year day counts", () => {
  assert.equal(calculateDateDifference("2024-02-28", "2024-03-01").absoluteDays, 2);
  assert.equal(calculateDateDifference("2023-02-28", "2023-03-01").absoluteDays, 1);
  assert.equal(calculateDateDifference("2020-02-29", "2021-02-28").absoluteDays, 365);
});

test("calculates year, month-end, and month-length boundaries", () => {
  assert.equal(calculateDateDifference("2024-12-31", "2025-01-01").absoluteDays, 1);
  assert.deepEqual([calculateDateDifference("2024-01-31", "2024-02-29").years, calculateDateDifference("2024-01-31", "2024-02-29").months, calculateDateDifference("2024-01-31", "2024-02-29").days], [0, 1, 0]);
  assert.equal(calculateDateDifference("2023-01-31", "2023-02-28").absoluteDays, 28);
  assert.deepEqual([calculateDateDifference("2023-01-31", "2023-02-28").months, calculateDateDifference("2023-01-31", "2023-02-28").days], [1, 0]);
});

test("normalizes reversed dates while retaining signed direction", () => {
  const result = calculateDateDifference("2025-05-12", "2025-05-01");
  assert.equal(result.ok, true);
  assert.equal(result.signedDays, -11);
  assert.equal(result.absoluteDays, 11);
  assert.equal(result.direction, "before");
});

test("reports missing and invalid date errors", () => {
  assert.deepEqual(calculateDateDifference("", "2024-01-01"), { ok: false, error: "missing-date" });
  assert.deepEqual(calculateDateDifference("2024-01-01", ""), { ok: false, error: "missing-date" });
  assert.deepEqual(calculateDateDifference("2023-02-29", "2024-01-01"), { ok: false, error: "invalid-date" });
});

test("reports completed weeks and remainder days", () => {
  const result = calculateDateDifference("2025-01-01", "2025-01-17");
  assert.equal(result.wholeWeeks, 2);
  assert.equal(result.weekDays, 2);
});

test("calculates age on exact birthday and before and after birthday", () => {
  assert.deepEqual([calculateAge("2000-06-15", "2025-06-15").years, calculateAge("2000-06-15", "2025-06-15").months, calculateAge("2000-06-15", "2025-06-15").days], [25, 0, 0]);
  assert.equal(calculateAge("2000-06-15", "2025-06-14").years, 24);
  assert.equal(calculateAge("2000-06-15", "2025-06-16").years, 25);
});

test("calculates age's remaining months and days", () => {
  const result = calculateAge("2000-01-31", "2001-03-01");
  assert.equal(result.ok, true);
  assert.deepEqual([result.years, result.months, result.days], [1, 1, 1]);
});

test("uses February 28 for a February 29 birthday in common years", () => {
  const result = calculateAge("2000-02-29", "2023-02-28");
  assert.equal(result.ok, true);
  assert.equal(result.years, 23);
  assert.equal(result.daysUntilNextBirthday, 366);
});

test("uses February 29 for a February 29 birthday in leap years", () => {
  const result = calculateAge("2000-02-29", "2024-02-28");
  assert.equal(result.ok, true);
  assert.equal(result.years, 23);
  assert.equal(result.daysUntilNextBirthday, 1);
  assert.equal(calculateAge("2000-02-29", "2024-02-29").years, 24);
});

test("rejects future birth dates and reports incomplete or invalid age input", () => {
  assert.deepEqual(calculateAge("2025-01-02", "2025-01-01"), { ok: false, error: "future-birth-date" });
  assert.deepEqual(calculateAge("", "2025-01-01"), { ok: false, error: "missing-date" });
  assert.deepEqual(calculateAge("2023-02-29", "2025-01-01"), { ok: false, error: "invalid-date" });
});

test("counts total lived calendar days and the next birthday", () => {
  const result = calculateAge("2000-01-01", "2000-01-10");
  assert.equal(result.totalDaysLived, 9);
  assert.equal(result.daysUntilNextBirthday, 357);
});

test("supports an age as of the birth date itself", () => {
  const result = calculateAge("2020-08-12", "2020-08-12");
  assert.deepEqual([result.years, result.months, result.days, result.totalDaysLived], [0, 0, 0, 0]);
});

test("calculates target dates in the future, past, and today", () => {
  assert.deepEqual([calculateDaysUntilSince("2025-01-11", "2025-01-01").signedDays, calculateDaysUntilSince("2025-01-11", "2025-01-01").direction], [10, "future"]);
  assert.deepEqual([calculateDaysUntilSince("2024-12-22", "2025-01-01").signedDays, calculateDaysUntilSince("2024-12-22", "2025-01-01").direction], [-10, "past"]);
  assert.deepEqual([calculateDaysUntilSince("2025-01-01", "2025-01-01").absoluteDays, calculateDaysUntilSince("2025-01-01", "2025-01-01").direction], [0, "today"]);
});

test("returns weeks and day remainder for days-until calculations", () => {
  const result = calculateDaysUntilSince("2025-01-20", "2025-01-01");
  assert.deepEqual([result.wholeWeeks, result.weekDays], [2, 5]);
});

test("reports missing and invalid target dates", () => {
  assert.deepEqual(calculateDaysUntilSince("", "2025-01-01"), { ok: false, error: "missing-date" });
  assert.deepEqual(calculateDaysUntilSince("2025-02-30", "2025-01-01"), { ok: false, error: "invalid-date" });
});

test("calendar day arithmetic crosses month and year boundaries", () => {
  assert.deepEqual(addCalendarDays({ year: 2024, month: 2, day: 28 }, 1), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(addCalendarDays({ year: 2024, month: 2, day: 29 }, 1), { year: 2024, month: 3, day: 1 });
  assert.deepEqual(addCalendarDays({ year: 2024, month: 12, day: 31 }, 1), { year: 2025, month: 1, day: 1 });
  assert.deepEqual(addCalendarDays({ year: 2025, month: 1, day: 1 }, -1), { year: 2024, month: 12, day: 31 });
});

test("calendar addition handles supported minimum and maximum dates", () => {
  assert.equal(addCalendarDays({ year: 1, month: 1, day: 1 }, -1), null);
  assert.equal(addCalendarDays({ year: 9999, month: 12, day: 31 }, 1), null);
  assert.equal(addCalendarYearsClamped({ year: 9999, month: 12, day: 31 }, 1), null);
  assert.equal(addCalendarMonthsClamped({ year: 1, month: 1, day: 1 }, -1), null);
});

test("clamps month and year arithmetic to the last valid calendar day", () => {
  assert.deepEqual(addCalendarMonthsClamped({ year: 2023, month: 1, day: 31 }, 1), { year: 2023, month: 2, day: 28 });
  assert.deepEqual(addCalendarMonthsClamped({ year: 2024, month: 1, day: 31 }, 1), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(addCalendarYearsClamped({ year: 2020, month: 2, day: 29 }, 1), { year: 2021, month: 2, day: 28 });
});

test("uses ordinal calendar arithmetic without timezone or DST elapsed-time effects", () => {
  const first = calendarDateToOrdinal(parseCalendarDate("2024-03-09"));
  const second = calendarDateToOrdinal(parseCalendarDate("2024-03-11"));
  assert.equal(second - first, 2);
  assert.equal(calculateDateDifference("2024-03-09", "2024-03-11").absoluteDays, 2);
});

test("formats dates and difference copy summaries", () => {
  const result = calculateDateDifference("2024-01-01", "2024-01-11");
  assert.equal(formatCalendarDate("2024-01-01"), "January 1, 2024");
  assert.match(formatDateDifferenceCopyText("2024-01-01", "2024-01-11", result), /10 calendar days/);
});

test("formats week and day singulars correctly in every date-difference display", () => {
  assert.equal(formatWeekBreakdown(0, 1), "0 weeks and 1 day");
  assert.equal(formatWeekBreakdown(1, 1), "1 week and 1 day");
  assert.equal(formatWeekBreakdown(2, 2), "2 weeks and 2 days");
  assert.equal(formatCount(1, "calendar day", "calendar days"), "1 calendar day");
  assert.equal(formatCount(0, "day"), "0 days");
  const oneDay = calculateDateDifference("2025-01-01", "2025-01-02");
  assert.match(formatDateDifferenceCopyText("2025-01-01", "2025-01-02", oneDay), /0 weeks and 1 day/);
  assert.match(formatDateDifferenceCopyText("2025-01-01", "2025-01-02", oneDay), /1 calendar day;/);
  const relative = calculateDaysUntilSince("2025-01-02", "2025-01-01");
  assert.match(formatDaysCopyText("2025-01-02", "2025-01-01", relative), /0 weeks and 1 day/);
});

test("formats age and days copy summaries", () => {
  const age = calculateAge("2000-01-01", "2000-01-10");
  const days = calculateDaysUntilSince("2025-01-11", "2025-01-01");
  assert.match(formatAgeCopyText("2000-01-01", "2000-01-10", age), /9 total days lived/);
  assert.match(formatDaysCopyText("2025-01-11", "2025-01-01", days), /10 calendar days until/);
});

test("formats singular years, months, days, and birthday countdowns in age summaries", () => {
  const age = calculateAge("2020-01-01", "2021-02-02");
  const summary = formatAgeCopyText("2020-01-01", "2021-02-02", age);
  assert.match(summary, /1 year, 1 month, and 1 day/);
  const oneDayLived = calculateAge("2025-01-01", "2025-01-02");
  assert.match(formatAgeCopyText("2025-01-01", "2025-01-02", oneDayLived), /1 total day lived/);
  const oneDayUntilBirthday = calculateAge("2000-01-02", "2025-01-01");
  assert.match(formatAgeCopyText("2000-01-02", "2025-01-01", oneDayUntilBirthday), /1 day until the next birthday/);
});

test("reconstructs a range through clamped calendar years, months, then days", () => {
  for (const [start, end] of [["2020-02-29", "2024-03-01"], ["2023-01-31", "2024-03-30"], ["2001-12-31", "2010-01-01"]]) {
    const result = calculateDateDifference(start, end);
    let cursor = parseCalendarDate(start);
    cursor = addCalendarYearsClamped(cursor, result.years);
    cursor = addCalendarMonthsClamped(cursor, result.months);
    cursor = addCalendarDays(cursor, result.days);
    assert.equal(`${String(cursor.year).padStart(4, "0")}-${String(cursor.month).padStart(2, "0")}-${String(cursor.day).padStart(2, "0")}`, end);
  }
});

test("date calculator initializes with no user-entered dates", () => {
  assert.deepEqual(createDateCalculatorState(), { mode: "difference", startDate: "", endDate: "", birthDate: "", asOfDate: "", targetDate: "", today: "", feedback: "" });
});

test("switching modes clears prior inputs and applies local today to age mode", () => {
  const initial = { ...createDateCalculatorState(), startDate: "2024-01-01", endDate: "2024-02-01", today: "2025-03-04" };
  const next = dateCalculatorReducer(initial, { type: "set-mode", mode: "age" });
  assert.equal(next.startDate, "");
  assert.equal(next.endDate, "");
  assert.equal(next.asOfDate, "2025-03-04");
});

test("refreshes the default age-as-of date when local today changes", () => {
  const state = { ...createDateCalculatorState(), mode: "age", today: "2025-01-01", asOfDate: "2025-01-01" };
  assert.equal(dateCalculatorReducer(state, { type: "set-today", value: "2025-01-02" }).asOfDate, "2025-01-02");
  assert.equal(dateCalculatorReducer({ ...state, asOfDate: "2024-06-01" }, { type: "set-today", value: "2025-01-02" }).asOfDate, "2024-06-01");
});

test("clearing resets entered dates while keeping the current mode and local date", () => {
  const state = { ...createDateCalculatorState(), mode: "age", birthDate: "2000-01-01", asOfDate: "2025-01-01", today: "2025-01-02" };
  const next = dateCalculatorReducer(state, { type: "reset" });
  assert.equal(next.mode, "age");
  assert.equal(next.birthDate, "");
  assert.equal(next.asOfDate, "2025-01-02");
});

test("clearing feedback when a field changes does not alter other fields", () => {
  const state = { ...createDateCalculatorState(), feedback: "copied", startDate: "2024-01-01" };
  const next = dateCalculatorReducer(state, { type: "set-field", field: "endDate", value: "2024-02-01" });
  assert.equal(next.startDate, "2024-01-01");
  assert.equal(next.endDate, "2024-02-01");
  assert.equal(next.feedback, "");
});

test("supports the smallest positive year and day numbering", () => {
  assert.equal(calendarDateToOrdinal(parseCalendarDate("0001-01-01")), 0);
  assert.deepEqual(addCalendarDays({ year: 1, month: 1, day: 1 }, 1), { year: 1, month: 1, day: 2 });
});

test("returns finite calendar differences for maximum supported dates", () => {
  const result = calculateDateDifference("0001-01-01", "9999-12-31");
  assert.equal(result.ok, true);
  assert.ok(Number.isFinite(result.absoluteDays));
  assert.ok(result.absoluteDays > 0);
});

test("does not interpret date strings as instants in UTC", () => {
  assert.equal(parseCalendarDate("1999-12-31").year, 1999);
  assert.equal(formatCalendarDate("1999-12-31"), "December 31, 1999");
});
