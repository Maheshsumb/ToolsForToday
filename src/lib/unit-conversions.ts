export const UNIT_CATEGORIES = ["length", "mass", "temperature", "area", "volume", "time"] as const;

export type UnitCategory = (typeof UNIT_CATEGORIES)[number];

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
}

interface LinearCategoryDefinition {
  label: string;
  units: readonly UnitDefinition[];
  /** Number of base units represented by one unit in this category. */
  factors: Readonly<Record<string, number>>;
  baseLabel: string;
}

export const UNIT_CATEGORIES_INFO: Readonly<Record<UnitCategory, LinearCategoryDefinition | { label: string; units: readonly UnitDefinition[] }>> = {
  length: {
    label: "Length",
    baseLabel: "meters",
    units: [
      { id: "millimeter", label: "Millimeters", symbol: "mm" },
      { id: "centimeter", label: "Centimeters", symbol: "cm" },
      { id: "meter", label: "Meters", symbol: "m" },
      { id: "kilometer", label: "Kilometers", symbol: "km" },
      { id: "inch", label: "Inches", symbol: "in" },
      { id: "foot", label: "Feet", symbol: "ft" },
      { id: "yard", label: "Yards", symbol: "yd" },
      { id: "mile", label: "Miles", symbol: "mi" },
    ],
    factors: { millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 },
  },
  mass: {
    label: "Weight / Mass",
    baseLabel: "kilograms",
    units: [
      { id: "milligram", label: "Milligrams", symbol: "mg" },
      { id: "gram", label: "Grams", symbol: "g" },
      { id: "kilogram", label: "Kilograms", symbol: "kg" },
      { id: "tonne", label: "Metric tonnes", symbol: "t" },
      { id: "ounce", label: "Ounces", symbol: "oz" },
      { id: "pound", label: "Pounds", symbol: "lb" },
    ],
    factors: { milligram: 1e-6, gram: 1e-3, kilogram: 1, tonne: 1000, ounce: 0.028349523125, pound: 0.45359237 },
  },
  temperature: {
    label: "Temperature",
    units: [
      { id: "celsius", label: "Celsius", symbol: "°C" },
      { id: "fahrenheit", label: "Fahrenheit", symbol: "°F" },
      { id: "kelvin", label: "Kelvin", symbol: "K" },
    ],
  },
  area: {
    label: "Area",
    baseLabel: "square meters",
    units: [
      { id: "square-millimeter", label: "Square millimeters", symbol: "mm²" },
      { id: "square-centimeter", label: "Square centimeters", symbol: "cm²" },
      { id: "square-meter", label: "Square meters", symbol: "m²" },
      { id: "square-kilometer", label: "Square kilometers", symbol: "km²" },
      { id: "square-inch", label: "Square inches", symbol: "in²" },
      { id: "square-foot", label: "Square feet", symbol: "ft²" },
      { id: "square-yard", label: "Square yards", symbol: "yd²" },
      { id: "acre", label: "Acres", symbol: "ac" },
      { id: "hectare", label: "Hectares", symbol: "ha" },
    ],
    factors: {
      "square-millimeter": 1e-6,
      "square-centimeter": 1e-4,
      "square-meter": 1,
      "square-kilometer": 1e6,
      "square-inch": 0.0254 ** 2,
      "square-foot": 0.3048 ** 2,
      "square-yard": 0.9144 ** 2,
      acre: 4046.8564224,
      hectare: 10000,
    },
  },
  volume: {
    label: "Volume",
    baseLabel: "liters",
    units: [
      { id: "milliliter", label: "Milliliters", symbol: "mL" },
      { id: "liter", label: "Liters", symbol: "L" },
      { id: "cubic-meter", label: "Cubic meters", symbol: "m³" },
      { id: "us-teaspoon", label: "US teaspoons", symbol: "tsp (US)" },
      { id: "us-tablespoon", label: "US tablespoons", symbol: "tbsp (US)" },
      { id: "us-fluid-ounce", label: "US fluid ounces", symbol: "fl oz (US)" },
      { id: "us-cup", label: "US cups", symbol: "cup (US)" },
      { id: "us-pint", label: "US pints", symbol: "pt (US)" },
      { id: "us-quart", label: "US quarts", symbol: "qt (US)" },
      { id: "us-gallon", label: "US gallons", symbol: "gal (US)" },
    ],
    factors: {
      milliliter: 0.001,
      liter: 1,
      "cubic-meter": 1000,
      "us-teaspoon": 0.00492892159375,
      "us-tablespoon": 0.01478676478125,
      "us-fluid-ounce": 0.0295735295625,
      "us-cup": 0.2365882365,
      "us-pint": 0.473176473,
      "us-quart": 0.946352946,
      "us-gallon": 3.785411784,
    },
  },
  time: {
    label: "Time",
    baseLabel: "seconds",
    units: [
      { id: "millisecond", label: "Milliseconds", symbol: "ms" },
      { id: "second", label: "Seconds", symbol: "s" },
      { id: "minute", label: "Minutes", symbol: "min" },
      { id: "hour", label: "Hours", symbol: "h" },
      { id: "day", label: "Days", symbol: "d" },
      { id: "week", label: "Weeks", symbol: "wk" },
    ],
    factors: { millisecond: 0.001, second: 1, minute: 60, hour: 3600, day: 86400, week: 604800 },
  },
};

export type ConversionError = "missing" | "invalid" | "below-absolute-zero" | "overflow" | "underflow" | "category-mismatch";
export type ConversionResult = { ok: true; value: number } | { ok: false; error: ConversionError };

export function getUnitCategoryInfo(category: UnitCategory) {
  return UNIT_CATEGORIES_INFO[category];
}

export function getDefaultUnitPair(category: UnitCategory): { from: string; to: string } {
  const defaults: Record<UnitCategory, { from: string; to: string }> = {
    length: { from: "meter", to: "foot" },
    mass: { from: "kilogram", to: "pound" },
    temperature: { from: "celsius", to: "fahrenheit" },
    area: { from: "square-meter", to: "square-foot" },
    volume: { from: "liter", to: "us-gallon" },
    time: { from: "hour", to: "minute" },
  };
  return defaults[category];
}

export function swapUnitPair(pair: { from: string; to: string }): { from: string; to: string } {
  return { from: pair.to, to: pair.from };
}

export function parseUnitInput(input: string): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "missing" };
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return { ok: false, error: "invalid" };
  const value = Number(trimmed);
  return Number.isFinite(value) ? { ok: true, value } : { ok: false, error: "invalid" };
}

function isLinearDefinition(category: UnitCategory): category is Exclude<UnitCategory, "temperature"> {
  return category !== "temperature";
}

function toCelsius(value: number, unit: string): number {
  if (unit === "celsius") return value;
  if (unit === "fahrenheit") return value * (5 / 9) - (32 * (5 / 9));
  return value - 273.15;
}

function fromCelsius(value: number, unit: string): number {
  if (unit === "celsius") return value;
  if (unit === "fahrenheit") return value * (9 / 5) + 32;
  return value + 273.15;
}

export function convertUnitValue(value: number, category: UnitCategory, from: string, to: string): ConversionResult {
  if (!Number.isFinite(value)) return { ok: false, error: "invalid" };
  const info = UNIT_CATEGORIES_INFO[category];
  const fromUnit = info.units.find((unit) => unit.id === from);
  const toUnit = info.units.find((unit) => unit.id === to);
  if (!fromUnit || !toUnit) return { ok: false, error: "category-mismatch" };

  let result: number;
  if (category === "temperature") {
    const minimum: Record<string, number> = { celsius: -273.15, fahrenheit: -459.67, kelvin: 0 };
    if (value < minimum[from]) return { ok: false, error: "below-absolute-zero" };
    const celsius = Math.max(-273.15, toCelsius(value, from));
    result = fromCelsius(celsius, to);
  } else if (isLinearDefinition(category)) {
    const factors = (UNIT_CATEGORIES_INFO[category] as LinearCategoryDefinition).factors;
    result = value * (factors[from] / factors[to]);
  } else {
    return { ok: false, error: "category-mismatch" };
  }

  if (!Number.isFinite(result)) return { ok: false, error: "overflow" };
  if (category !== "temperature" && value !== 0 && result === 0) return { ok: false, error: "underflow" };
  if (category === "temperature" && to === "kelvin" && result < 0) return { ok: false, error: "below-absolute-zero" };
  return { ok: true, value: result };
}

export function convertUnitInput(input: string, category: UnitCategory, from: string, to: string): ConversionResult {
  const parsed = parseUnitInput(input);
  return parsed.ok ? convertUnitValue(parsed.value, category, from, to) : parsed;
}

export function formatUnitValue(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(12)).toString();
}
