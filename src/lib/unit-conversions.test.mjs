import assert from "node:assert/strict";
import test from "node:test";
import {
  convertUnitInput,
  convertUnitValue,
  formatUnitValue,
  getDefaultUnitPair,
  parseUnitInput,
  swapUnitPair,
} from "./unit-conversions.ts";

function valueOf(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  return result.value;
}

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("converts 1 kilometer to 1,000 meters", () => {
  assert.equal(valueOf(convertUnitValue(1, "length", "kilometer", "meter")), 1000);
});

test("converts 1 inch to exactly 2.54 centimeters", () => {
  assert.equal(valueOf(convertUnitValue(1, "length", "inch", "centimeter")), 2.54);
});

test("converts 1 mile to 1,609.344 meters", () => {
  assert.equal(valueOf(convertUnitValue(1, "length", "mile", "meter")), 1609.344);
});

test("converts kilograms to pounds using the international pound definition", () => {
  close(valueOf(convertUnitValue(1, "mass", "kilogram", "pound")), 2.20462262185, 1e-10);
});

test("converts 0 Celsius to 32 Fahrenheit", () => {
  assert.equal(valueOf(convertUnitValue(0, "temperature", "celsius", "fahrenheit")), 32);
});

test("converts 100 Celsius to 212 Fahrenheit", () => {
  assert.equal(valueOf(convertUnitValue(100, "temperature", "celsius", "fahrenheit")), 212);
});

test("converts 0 Celsius to 273.15 Kelvin", () => {
  assert.equal(valueOf(convertUnitValue(0, "temperature", "celsius", "kelvin")), 273.15);
});

test("converts -40 Celsius and Fahrenheit to the same temperature", () => {
  assert.equal(valueOf(convertUnitValue(-40, "temperature", "celsius", "fahrenheit")), -40);
});

test("rejects negative Kelvin", () => {
  assert.deepEqual(convertUnitValue(-0.01, "temperature", "kelvin", "celsius"), { ok: false, error: "below-absolute-zero" });
});

test("rejects values below absolute zero in Celsius and Fahrenheit", () => {
  assert.deepEqual(convertUnitValue(-273.151, "temperature", "celsius", "kelvin"), { ok: false, error: "below-absolute-zero" });
  assert.deepEqual(convertUnitValue(-459.671, "temperature", "fahrenheit", "celsius"), { ok: false, error: "below-absolute-zero" });
});

test("accepts absolute zero in Celsius, Fahrenheit, and Kelvin despite rounding", () => {
  assert.equal(valueOf(convertUnitValue(-273.15, "temperature", "celsius", "kelvin")), 0);
  assert.equal(valueOf(convertUnitValue(-459.67, "temperature", "fahrenheit", "kelvin")), 0);
  close(valueOf(convertUnitValue(0, "temperature", "kelvin", "fahrenheit")), -459.67, 1e-10);
});

test("converts square meters to square feet", () => {
  close(valueOf(convertUnitValue(1, "area", "square-meter", "square-foot")), 10.7639104167, 1e-9);
});

test("converts hectares to square meters", () => {
  assert.equal(valueOf(convertUnitValue(1, "area", "hectare", "square-meter")), 10000);
});

test("converts a US gallon to liters", () => {
  assert.equal(valueOf(convertUnitValue(1, "volume", "us-gallon", "liter")), 3.785411784);
});

test("converts liters to milliliters", () => {
  assert.equal(valueOf(convertUnitValue(1, "volume", "liter", "milliliter")), 1000);
});

test("converts hours to minutes", () => {
  assert.equal(valueOf(convertUnitValue(2, "time", "hour", "minute")), 120);
});

test("converts a week to seven fixed days", () => {
  assert.equal(valueOf(convertUnitValue(1, "time", "week", "day")), 7);
});

test("same-unit conversions preserve the value", () => {
  assert.equal(valueOf(convertUnitValue(123.456, "length", "meter", "meter")), 123.456);
});

test("zero converts to zero for linear categories", () => {
  for (const category of ["length", "mass", "area", "volume", "time"]) {
    const units = getDefaultUnitPair(category);
    assert.equal(valueOf(convertUnitValue(0, category, units.from, units.to)), 0);
  }
});

test("negative values work as signed quantities for linear units", () => {
  assert.equal(valueOf(convertUnitValue(-2, "length", "kilometer", "meter")), -2000);
  assert.equal(valueOf(convertUnitValue(-2, "mass", "kilogram", "gram")), -2000);
});

test("decimal input converts accurately", () => {
  close(valueOf(convertUnitInput("1.25", "length", "meter", "centimeter")), 125);
});

test("empty input is distinguished from invalid numeric text", () => {
  assert.deepEqual(parseUnitInput("  "), { ok: false, error: "missing" });
  assert.deepEqual(parseUnitInput("12abc"), { ok: false, error: "invalid" });
});

test("rejects nonfinite and non-decimal values", () => {
  for (const input of ["Infinity", "NaN", "1e309", "0x10"]) {
    assert.deepEqual(parseUnitInput(input), { ok: false, error: "invalid" });
  }
});

test("handles very small and large finite values when representable", () => {
  assert.equal(valueOf(convertUnitValue(1e-300, "length", "meter", "meter")), 1e-300);
  assert.equal(valueOf(convertUnitValue(1e300, "time", "second", "second")), 1e300);
});

test("reports conversion overflow and underflow instead of returning infinity or zero", () => {
  assert.deepEqual(convertUnitValue(Number.MAX_VALUE, "length", "kilometer", "millimeter"), { ok: false, error: "overflow" });
  assert.deepEqual(convertUnitValue(Number.MIN_VALUE, "length", "meter", "kilometer"), { ok: false, error: "underflow" });
});

test("rejects unknown units and units from another category", () => {
  assert.deepEqual(convertUnitValue(2, "length", "hour", "meter"), { ok: false, error: "category-mismatch" });
});

test("unit swapping reverses the selected pair without changing category", () => {
  assert.deepEqual(swapUnitPair({ from: "meter", to: "foot" }), { from: "foot", to: "meter" });
  assert.deepEqual(swapUnitPair(getDefaultUnitPair("temperature")), { from: "fahrenheit", to: "celsius" });
});

test("category defaults always select units belonging to that category", () => {
  const expected = {
    length: ["meter", "foot"],
    mass: ["kilogram", "pound"],
    temperature: ["celsius", "fahrenheit"],
    area: ["square-meter", "square-foot"],
    volume: ["liter", "us-gallon"],
    time: ["hour", "minute"],
  };
  for (const [category, pair] of Object.entries(expected)) {
    const defaults = getDefaultUnitPair(category);
    assert.deepEqual([defaults.from, defaults.to], pair);
  }
});

test("formats readable precision and preserves small nonzero values", () => {
  assert.equal(formatUnitValue(0.1 + 0.2), "0.3");
  assert.notEqual(formatUnitValue(Number.MIN_VALUE), "0");
  assert.equal(formatUnitValue(-0), "0");
  assert.equal(formatUnitValue(1e300), "1e+300");
});

test("an empty converted input does not produce a numeric result", () => {
  assert.deepEqual(convertUnitInput("", "length", "meter", "foot"), { ok: false, error: "missing" });
});
