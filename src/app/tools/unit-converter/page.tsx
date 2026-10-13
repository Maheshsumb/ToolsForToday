import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { UnitConverter } from "@/components/tools/unit-converter";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "unit-converter") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'Unit Converter – Length, Mass & More | ToolsForToday',
  description: 'Convert length, mass, temperature, area, volume and time units, including clearly labeled US customary volume measures.',
  path: "/tools/unit-converter/",
});

export default function UnitConverterPage() {
  return (
    <>
      <AnalyticsPageView page="unitConverter" />
      <ToolPageShell tool={tool}>
        <UnitConverter />

        <section aria-labelledby="unit-conversion-guide-heading" className="mt-10 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="unit-conversion-guide-heading" className="font-heading text-xl font-semibold text-text">How unit conversion works</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">
              For length, mass, area, volume, and time, a measurement is scaled through a shared base unit. For example, a kilometer is 1,000 meters, so 1 km converts to 1,000 m. Temperature uses offsets as well as scale factors, so it needs dedicated formulas instead of ordinary multiplication.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Metric and customary units</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Metric units use decimal relationships, such as 100 centimeters in a meter and 1,000 grams in a kilogram. This converter also includes selected US customary units, such as inches, pounds, and US gallons. Volume labels identify the US system because equivalent-sounding UK imperial units can have different sizes.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Temperature is different</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Celsius and Fahrenheit have different zero points as well as different degree sizes. To convert Celsius to Fahrenheit, multiply by 9/5 and add 32. Kelvin starts at absolute zero, so negative Kelvin values and temperatures below absolute zero are rejected.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Examples and precision</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-brand-accent">
                <li>1 inch = 2.54 centimeters.</li>
                <li>1 kilogram is about 2.20462 pounds.</li>
                <li>1 square meter is about 10.7639 square feet.</li>
                <li>1 US gallon = 3.785411784 liters.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-muted">Some results are displayed as approximations because the conversion is rounded for readability. Calculations use standard JavaScript floating-point numbers, not arbitrary precision.</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Using Swap Units</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Choose a category and enter a measurement, then select its current and desired units. Select Swap to reverse the units; the entered number stays the same and the conversion is recalculated in the opposite direction. Clear removes the input and result.
              </p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="unit-converter-help"
          title="Using the Unit Converter"
          steps={[
            "Choose Length, Weight / Mass, Temperature, Area, Volume, or Time.",
            "Enter a number and select the units to convert from and to. The result updates immediately.",
            "Use Swap Units to reverse the direction, Copy Result to copy the converted value, or Clear to reset.",
          ]}
          limitations={[
            "US customary volume measures are used; UK imperial volume measures are not included.",
            "Days and weeks are fixed durations (24 hours and 7 days), not calendar calculations or daylight-saving adjustments.",
            "Mass is converted, not gravitational force or local weight. Negative values are accepted as signed quantities, though they may not describe a physical object's size or mass.",
            "Ordinary JavaScript floating-point precision is used. Extremely small results outside its representable range are reported instead of silently displayed as zero.",
          ]}
          faqs={[
            {
              question: "Why might a result be approximate?",
              answer: "The tool uses established unit definitions and JavaScript floating-point arithmetic. A result may need rounding for display, and some input values cannot be represented exactly in binary floating point.",
            },
            {
              question: "Are the volume units US or UK measures?",
              answer: "The listed teaspoons, tablespoons, fluid ounces, cups, pints, quarts, and gallons use US customary definitions. UK imperial measures are not mixed into those conversions.",
            },
            {
              question: "Does the converter send my values anywhere?",
              answer: "The conversion is calculated in your browser and entered values are not sent to ToolsForToday servers. The site's separate consent-gated analytics uses fixed route information, not the values or selected units.",
            },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
