# Percentage Calculator

The Percentage Calculator is available at `/tools/percentage-calculator/`. It is a browser-only utility and does not send entered values to the website's servers. Its route is included in the fixed analytics page allowlist; the consent-gated page-view implementation sends the route title and canonical path, not calculator inputs or query strings.

## Calculation modes

- **Percentage of a number:** `percentage ÷ 100 × number`. Example: 20% of 150 is 30.
- **What percentage:** `part ÷ total × 100`. A total of zero is undefined.
- **Percentage change:** `(new value − original value) ÷ |original value| × 100`. The absolute original value is the reference magnitude. A zero original value is undefined.
- **Increase or decrease:** multiply the starting value by `1 + percentage ÷ 100` or `1 − percentage ÷ 100`. The percentage must be nonnegative; a decrease above 100% can produce a negative result.

All modes accept finite decimal inputs and negative values where mathematically valid. Missing, malformed, non-finite, zero-denominator, negative-adjustment, and overflow cases return clear errors instead of displaying `NaN` or infinity. Results use locale-aware formatting, normalize negative zero, and retain nonzero values that would otherwise format as zero.

## Precision and privacy

Calculations use JavaScript binary floating-point numbers. Display formatting hides common representation artifacts, but this tool is for everyday calculations and is not intended for high-precision financial or accounting work. The tool does not store or transmit the entered numbers. The fixed analytics route tracking does not include the entered values or query strings.

## Verification

Run the focused arithmetic suite with `npm run test:percentage-calculator`. Run `npm run test:analytics` to verify fixed, sanitized route tracking. The project-wide release checks are `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:text-counter`, `npm run test:percentage-calculator`, and `npm run test:analytics`.
