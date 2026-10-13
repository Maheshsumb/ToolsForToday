export const DATE_CALCULATOR_MODES = ["difference", "age", "days"] as const;

export type DateCalculatorMode = (typeof DATE_CALCULATOR_MODES)[number];

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export type CalendarDateError = "missing-date" | "invalid-date" | "future-birth-date";

export type DateDifferenceResult = {
  ok: true;
  signedDays: number;
  absoluteDays: number;
  years: number;
  months: number;
  days: number;
  wholeWeeks: number;
  weekDays: number;
  direction: "after" | "before" | "same";
} | {
  ok: false;
  error: "missing-date" | "invalid-date";
};

export type AgeResult = {
  ok: true;
  years: number;
  months: number;
  days: number;
  totalDaysLived: number;
  daysUntilNextBirthday: number | null;
} | {
  ok: false;
  error: CalendarDateError;
};

export type DaysRelativeResult = {
  ok: true;
  signedDays: number;
  absoluteDays: number;
  wholeWeeks: number;
  weekDays: number;
  direction: "future" | "past" | "today";
} | {
  ok: false;
  error: "missing-date" | "invalid-date";
};

export interface DateCalculatorState {
  mode: DateCalculatorMode;
  startDate: string;
  endDate: string;
  birthDate: string;
  asOfDate: string;
  targetDate: string;
  today: string;
  feedback: string;
}

export type DateCalculatorAction =
  | { type: "set-mode"; mode: DateCalculatorMode }
  | { type: "set-field"; field: "startDate" | "endDate" | "birthDate" | "asOfDate" | "targetDate"; value: string }
  | { type: "set-today"; value: string }
  | { type: "set-feedback"; value: string }
  | { type: "reset" };

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) return 0;
  return month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1];
}

export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

function daysBeforeYear(year: number): number {
  const previous = year - 1;
  return 365 * previous + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400);
}

export function calendarDateToOrdinal(date: CalendarDate): number {
  let ordinal = daysBeforeYear(date.year);
  for (let month = 1; month < date.month; month += 1) ordinal += daysInMonth(date.year, month);
  return ordinal + date.day - 1;
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate | null {
  if (!Number.isInteger(days)) return null;
  const ordinal = calendarDateToOrdinal(date) + days;
  if (ordinal < 0 || ordinal >= daysBeforeYear(10000)) return null;

  let low = 1;
  let high = 10000;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (daysBeforeYear(middle) <= ordinal) low = middle;
    else high = middle;
  }

  let dayOfYear = ordinal - daysBeforeYear(low);
  let month = 1;
  while (dayOfYear >= daysInMonth(low, month)) {
    dayOfYear -= daysInMonth(low, month);
    month += 1;
  }
  return { year: low, month, day: dayOfYear + 1 };
}

export function addCalendarMonthsClamped(date: CalendarDate, months: number): CalendarDate | null {
  if (!Number.isInteger(months)) return null;
  const monthIndex = (date.year - 1) * 12 + date.month - 1 + months;
  if (monthIndex < 0 || monthIndex >= 9999 * 12) return null;
  const year = Math.floor(monthIndex / 12) + 1;
  const month = (monthIndex % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function addCalendarYearsClamped(date: CalendarDate, years: number): CalendarDate | null {
  if (!Number.isInteger(years)) return null;
  const year = date.year + years;
  if (year < 1 || year > 9999) return null;
  return { year, month: date.month, day: Math.min(date.day, daysInMonth(year, date.month)) };
}

function compareDates(left: CalendarDate, right: CalendarDate): number {
  return calendarDateToOrdinal(left) - calendarDateToOrdinal(right);
}

function calendarBreakdown(earlier: CalendarDate, later: CalendarDate): { years: number; months: number; days: number } {
  let years = later.year - earlier.year;
  let yearAnchor = addCalendarYearsClamped(earlier, years);
  while (yearAnchor && compareDates(yearAnchor, later) > 0) {
    years -= 1;
    yearAnchor = addCalendarYearsClamped(earlier, years);
  }
  if (!yearAnchor) return { years: 0, months: 0, days: compareDates(later, earlier) };

  let months = (later.year - yearAnchor.year) * 12 + later.month - yearAnchor.month;
  let monthAnchor = addCalendarMonthsClamped(yearAnchor, months);
  while (monthAnchor && compareDates(monthAnchor, later) > 0) {
    months -= 1;
    monthAnchor = addCalendarMonthsClamped(yearAnchor, months);
  }
  if (!monthAnchor) return { years, months: 0, days: compareDates(later, yearAnchor) };

  return { years, months, days: calendarDateToOrdinal(later) - calendarDateToOrdinal(monthAnchor) };
}

function parsePair(first: string, second: string): { first: CalendarDate; second: CalendarDate } | { error: "missing-date" | "invalid-date" } {
  if (!first.trim() || !second.trim()) return { error: "missing-date" };
  const parsedFirst = parseCalendarDate(first);
  const parsedSecond = parseCalendarDate(second);
  if (!parsedFirst || !parsedSecond) return { error: "invalid-date" };
  return { first: parsedFirst, second: parsedSecond };
}

export function calculateDateDifference(startValue: string, endValue: string): DateDifferenceResult {
  const pair = parsePair(startValue, endValue);
  if ("error" in pair) return { ok: false, error: pair.error };

  const signedDays = calendarDateToOrdinal(pair.second) - calendarDateToOrdinal(pair.first);
  const absoluteDays = Math.abs(signedDays);
  const earlier = signedDays < 0 ? pair.second : pair.first;
  const later = signedDays < 0 ? pair.first : pair.second;
  const breakdown = calendarBreakdown(earlier, later);
  return {
    ok: true,
    signedDays,
    absoluteDays,
    ...breakdown,
    wholeWeeks: Math.floor(absoluteDays / 7),
    weekDays: absoluteDays % 7,
    direction: signedDays > 0 ? "after" : signedDays < 0 ? "before" : "same",
  };
}

function birthdayInYear(birthDate: CalendarDate, year: number): CalendarDate | null {
  if (year < 1 || year > 9999) return null;
  const day = birthDate.month === 2 && birthDate.day === 29 && !isLeapYear(year) ? 28 : birthDate.day;
  return { year, month: birthDate.month, day };
}

export function calculateAge(birthValue: string, asOfValue: string): AgeResult {
  const pair = parsePair(birthValue, asOfValue);
  if ("error" in pair) return { ok: false, error: pair.error };
  if (compareDates(pair.second, pair.first) < 0) return { ok: false, error: "future-birth-date" };

  const birthOrdinal = calendarDateToOrdinal(pair.first);
  const asOfOrdinal = calendarDateToOrdinal(pair.second);
  let years = pair.second.year - pair.first.year;
  let anniversary = birthdayInYear(pair.first, pair.second.year);
  if (anniversary && compareDates(pair.second, anniversary) < 0) {
    years -= 1;
    anniversary = birthdayInYear(pair.first, pair.second.year - 1);
  }
  if (!anniversary) return { ok: false, error: "invalid-date" };

  let months = (pair.second.year - anniversary.year) * 12 + pair.second.month - anniversary.month;
  let monthAnchor = addCalendarMonthsClamped(anniversary, months);
  while (monthAnchor && compareDates(monthAnchor, pair.second) > 0) {
    months -= 1;
    monthAnchor = addCalendarMonthsClamped(anniversary, months);
  }
  if (!monthAnchor) return { ok: false, error: "invalid-date" };

  const currentYearBirthday = birthdayInYear(pair.first, pair.second.year);
  const nextBirthday: CalendarDate | null = currentYearBirthday && compareDates(currentYearBirthday, pair.second) > 0
    ? currentYearBirthday
    : birthdayInYear(pair.first, pair.second.year + 1);

  return {
    ok: true,
    years,
    months,
    days: asOfOrdinal - calendarDateToOrdinal(monthAnchor),
    totalDaysLived: asOfOrdinal - birthOrdinal,
    daysUntilNextBirthday: nextBirthday ? calendarDateToOrdinal(nextBirthday) - asOfOrdinal : null,
  };
}

export function calculateDaysUntilSince(targetValue: string, todayValue: string): DaysRelativeResult {
  const pair = parsePair(todayValue, targetValue);
  if ("error" in pair) return { ok: false, error: pair.error };
  const signedDays = calendarDateToOrdinal(pair.second) - calendarDateToOrdinal(pair.first);
  const absoluteDays = Math.abs(signedDays);
  return {
    ok: true,
    signedDays,
    absoluteDays,
    wholeWeeks: Math.floor(absoluteDays / 7),
    weekDays: absoluteDays % 7,
    direction: signedDays > 0 ? "future" : signedDays < 0 ? "past" : "today",
  };
}

export function formatCalendarDate(value: string): string {
  const date = parseCalendarDate(value);
  if (!date) return value;
  return `${MONTH_NAMES[date.month - 1]} ${date.day}, ${String(date.year).padStart(4, "0")}`;
}

export function formatDateDifferenceCopyText(startDate: string, endDate: string, result: Extract<DateDifferenceResult, { ok: true }>): string {
  const direction = result.direction === "before" ? "the end date is before the start date" : result.direction === "after" ? "the end date is after the start date" : "both dates are the same";
  return `Date difference: ${formatCalendarDate(startDate)} to ${formatCalendarDate(endDate)}. ${result.absoluteDays} calendar days; ${direction}. Calendar breakdown: ${result.years} years, ${result.months} months, ${result.days} days. ${result.wholeWeeks} weeks and ${result.weekDays} days.`;
}

export function formatAgeCopyText(birthDate: string, asOfDate: string, result: Extract<AgeResult, { ok: true }>): string {
  const nextBirthday = result.daysUntilNextBirthday === null ? "Next birthday is outside the supported date range." : `${result.daysUntilNextBirthday} days until the next birthday.`;
  return `Age as of ${formatCalendarDate(asOfDate)}: ${result.years} years, ${result.months} months, and ${result.days} days. Born ${formatCalendarDate(birthDate)}. ${result.totalDaysLived} total days lived. ${nextBirthday}`;
}

export function formatDaysCopyText(targetDate: string, today: string, result: Extract<DaysRelativeResult, { ok: true }>): string {
  const timing = result.direction === "future" ? "until" : result.direction === "past" ? "since" : "from today";
  return `${result.absoluteDays} calendar days ${timing} ${formatCalendarDate(targetDate)} (today: ${formatCalendarDate(today)}). ${result.wholeWeeks} weeks and ${result.weekDays} days.`;
}

export function getLocalTodayDate(): string {
  const now = new Date();
  return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function createDateCalculatorState(): DateCalculatorState {
  return { mode: "difference", startDate: "", endDate: "", birthDate: "", asOfDate: "", targetDate: "", today: "", feedback: "" };
}

export function dateCalculatorReducer(state: DateCalculatorState, action: DateCalculatorAction): DateCalculatorState {
  if (action.type === "set-mode") {
    return { ...state, mode: action.mode, startDate: "", endDate: "", birthDate: "", asOfDate: action.mode === "age" ? state.today : "", targetDate: "", feedback: "" };
  }
  if (action.type === "set-field") return { ...state, [action.field]: action.value, feedback: "" };
  if (action.type === "set-today") return { ...state, today: action.value, ...(state.mode === "age" && (!state.asOfDate || state.asOfDate === state.today) ? { asOfDate: action.value } : {}) };
  if (action.type === "set-feedback") return { ...state, feedback: action.value };
  return { ...state, startDate: "", endDate: "", birthDate: "", asOfDate: state.mode === "age" ? state.today : "", targetDate: "", feedback: "" };
}
