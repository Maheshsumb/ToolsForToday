# Unit Converter

The browser-only Unit Converter is available at `/tools/unit-converter/`. Its route page is `src/app/tools/unit-converter/page.tsx`, the interactive controls are in `src/components/tools/unit-converter.tsx`, and definitions, conversion functions, parsing, and formatting are in `src/lib/unit-conversions.ts`.

## Categories and units

- **Length:** millimeters, centimeters, meters, kilometers, inches, feet, yards, and miles; base unit: meter.
- **Weight / Mass:** milligrams, grams, kilograms, metric tonnes, ounces, and pounds; base unit: kilogram. These are mass conversions, not force/weight conversions.
- **Temperature:** Celsius, Fahrenheit, and Kelvin; converted with temperature-specific formulas and absolute-zero validation.
- **Area:** square millimeters, square centimeters, square meters, square kilometers, square inches, square feet, square yards, acres, and hectares; base unit: square meter. Square customary units use the corresponding squared length factors.
- **Volume:** milliliters, liters, cubic meters, and US teaspoons, tablespoons, fluid ounces, cups, pints, quarts, and gallons; base unit: liter. UK imperial units are not included.
- **Time:** milliseconds, seconds, minutes, hours, days, and weeks; base unit: second. Days are fixed 24-hour durations and weeks are fixed 7-day durations.

## Conversion and numeric behavior

Linear categories convert as `value × (source factor ÷ destination factor)` using the base units described above. Definitions include 1 inch = 0.0254 m, 1 international pound = 0.45359237 kg, 1 acre = 4046.8564224 m², 1 US gallon = 3.785411784 L, and fixed time durations. Celsius/Fahrenheit/Kelvin use dedicated formulas and reject inputs below absolute zero.

Empty, malformed, nonfinite, cross-category, below-absolute-zero, overflow, and underflow cases are represented as errors; the interface shows a clear message instead of `NaN` or `Infinity`. Signed negative values are allowed for linear categories as mathematical quantities. Results use 12 significant digits and scientific notation when JavaScript's number formatting requires it. Calculations rely on ordinary JavaScript binary floating-point precision, not arbitrary precision. A nonzero calculation that underflows to zero is reported as too small to represent rather than displayed as zero.

Category changes reset the selectors to a valid, useful pair: meter/foot, kilogram/pound, Celsius/Fahrenheit, square meter/square foot, liter/US gallon, or hour/minute. Swapping changes only the selected units and preserves the entered number. Clear resets the input; copy is available only for a valid result.

## Privacy and Analytics

Calculations run in the browser, and the converter does not persist or transmit entered values. The consent-gated Analytics allowlist uses the fixed route `/tools/unit-converter` and title `Unit Converter | ToolsForToday`; it does not include input values, unit selections, or query strings. AdSense remains verification-only with no advertising script added.

## Tests

Run the conversion tests with `npm run test:unit-converter` and route tests with `npm run test:analytics`. The unit suite covers exact and approximate conversions across all categories, temperature boundaries, parsing, error and numeric range behavior, formatting, swapping, and category defaults. Project-wide checks are `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:text-counter`, `npm run test:percentage-calculator`, `npm run test:unit-converter`, and `npm run test:analytics`.
