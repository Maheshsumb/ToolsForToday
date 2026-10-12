import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAdjustedValue,
  calculatePercentageChange,
  calculatePercentageOf,
  calculateWhatPercentage,
  formatCalculationNumber,
  parseNumericInput,
} from "./percentage-calculations.ts";

function valueOf(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  return result.value;
}

test("calculates a percentage of a number", () => {
  assert.equal(valueOf(calculatePercentageOf("20", "150")), 30);
});

test("calculates what percentage a part is of a total", () => {
  assert.equal(valueOf(calculateWhatPercentage("45", "150")), 30);
});

test("calculates positive and negative percentage change", () => {
  assert.equal(valueOf(calculatePercentageChange("100", "125")), 25);
  assert.equal(valueOf(calculatePercentageChange("100", "75")), -25);
});

test("uses absolute original magnitude for negative percentage changes", () => {
  assert.equal(valueOf(calculatePercentageChange("-100", "-125")), -25);
  assert.equal(valueOf(calculatePercentageChange("-100", "-75")), 25);
});

test("increases and decreases a value by a percentage", () => {
  assert.equal(formatCalculationNumber(valueOf(calculateAdjustedValue("200", "15", "increase"))), "230");
  assert.equal(formatCalculationNumber(valueOf(calculateAdjustedValue("200", "15", "decrease"))), "170");
});

test("accepts zero when the operation is defined", () => {
  assert.equal(valueOf(calculatePercentageOf("0", "500")), 0);
  assert.equal(valueOf(calculatePercentageOf("50", "0")), 0);
  assert.equal(valueOf(calculateAdjustedValue("0", "15", "increase")), 0);
});

test("reports division by zero for percentage-of-total", () => {
  assert.deepEqual(calculateWhatPercentage("45", "0"), {
    ok: false,
    error: "division-by-zero",
    field: "total",
  });
});

test("reports undefined percentage change when the original is zero", () => {
  assert.deepEqual(calculatePercentageChange("0", "10"), {
    ok: false,
    error: "division-by-zero",
    field: "original",
  });
});

test("supports negative values in percentage and adjustment modes", () => {
  assert.equal(valueOf(calculatePercentageOf("20", "-150")), -30);
  assert.equal(valueOf(calculateWhatPercentage("45", "-150")), -30);
  assert.equal(formatCalculationNumber(valueOf(calculateAdjustedValue("-200", "15", "increase"))), "-230");
  assert.equal(formatCalculationNumber(valueOf(calculateAdjustedValue("-200", "15", "decrease"))), "-170");
});

test("accepts decimal inputs", () => {
  assert.equal(valueOf(calculatePercentageOf("12.5", "80.8")), 10.1);
  assert.equal(valueOf(calculateWhatPercentage("0.3", "1.2")), 25);
});

test("reports missing required input and identifies its field", () => {
  assert.deepEqual(calculatePercentageOf("", "150"), {
    ok: false,
    error: "missing",
    field: "percentage",
  });
  assert.deepEqual(calculateAdjustedValue("200", undefined, "increase"), {
    ok: false,
    error: "missing",
    field: "percentage",
  });
});

test("rejects invalid, non-finite, and non-decimal input", () => {
  assert.deepEqual(parseNumericInput("abc"), { ok: false, error: "invalid" });
  assert.deepEqual(parseNumericInput("Infinity"), { ok: false, error: "invalid" });
  assert.deepEqual(parseNumericInput("0x10"), { ok: false, error: "invalid" });
  assert.deepEqual(parseNumericInput("1e309"), { ok: false, error: "invalid" });
});

test("rejects a negative adjustment percentage", () => {
  assert.deepEqual(calculateAdjustedValue("200", "-15", "increase"), {
    ok: false,
    error: "negative-percentage",
    field: "percentage",
  });
});

test("reports arithmetic overflow instead of returning Infinity", () => {
  assert.deepEqual(calculatePercentageOf("200", "1.7976931348623157e308"), {
    ok: false,
    error: "overflow",
  });
});

test("avoids overflowing the percentage-change subtraction intermediate", () => {
  assert.equal(valueOf(calculatePercentageChange("-1.7976931348623157e308", "1.7976931348623157e308")), 200);
});

test("formats binary floating-point artifacts without hiding small nonzero values", () => {
  const imprecise = valueOf(calculatePercentageOf("10", "3"));
  assert.equal(formatCalculationNumber(imprecise), "0.3");
  assert.equal(formatCalculationNumber(5e-324) === "0", false);
  assert.equal(formatCalculationNumber(-0), "0");
});

test("formats according to the requested locale", () => {
  assert.equal(formatCalculationNumber(1234.5, "de-DE"), "1.234,5");
});
