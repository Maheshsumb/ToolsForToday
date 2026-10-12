import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { PercentageCalculator } from "@/components/tools/percentage-calculator";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "percentage-calculator") as (typeof tools)[number];

export const metadata: Metadata = {
  title: "Percentage Calculator | ToolsForToday",
  description: "Calculate percentages, find percentage changes, and increase or decrease numbers instantly with our free online percentage calculator.",
};

export default function PercentageCalculatorPage() {
  return (
    <>
      <AnalyticsPageView page="percentageCalculator" />
      <ToolPageShell tool={tool} showRelatedTools={false}>
        <PercentageCalculator />

        <section aria-labelledby="percentage-guide-heading" className="mt-10 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="percentage-guide-heading" className="font-heading text-xl font-semibold text-text">How percentages work</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">
              A percentage is a number out of 100. To find a percentage of a number, divide the percentage by 100 and multiply by the number. For example, 20% of 150 is (20 ÷ 100) × 150 = 30.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Find what percentage one number is of another</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Divide the part by the total and multiply by 100. For example, 45 ÷ 150 × 100 = 30%, so 45 is 30% of 150. A zero total has no defined percentage result.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-text">Calculate percentage change</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Subtract the original value from the new value, divide by the absolute value of the original, then multiply by 100. This uses the original value&apos;s magnitude as the reference, so a result above zero is an increase and one below zero is a decrease. For example, 100 to 125 is +25%; 100 to 75 is −25%. When the original is zero, percentage change is undefined.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-2">
              <h2 className="font-heading text-lg font-semibold text-text">Increase or decrease a value</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For an increase, multiply the starting value by (1 + percentage ÷ 100). For a decrease, multiply it by (1 − percentage ÷ 100). Increasing 200 by 15% gives 230; decreasing 200 by 15% gives 170. A decrease greater than 100% can produce a negative result.
              </p>
            </article>
          </div>
        </section>

        <ToolHelpSection
          id="percentage-help"
          title="Using the Percentage Calculator"
          steps={[
            "Choose one of the four calculation questions.",
            "Enter the requested values. The result and explanation update immediately.",
            "Copy the result if needed, or use Clear to reset the inputs without reloading.",
          ]}
          limitations={[
            "A zero total cannot be used as a percentage denominator, and percentage change from an original value of zero is undefined.",
            "The increase/decrease mode accepts only a nonnegative percentage; a decrease above 100% may produce a negative result.",
            "JavaScript numbers use normal binary floating-point precision. Display formatting reduces common representation artifacts, but this calculator is not intended for high-precision financial accounting.",
          ]}
          faqs={[
            {
              question: "How do I find a discount amount?",
              answer: "Choose Percentage of a number and enter the discount rate and original price. For example, 15% of 80 is 12. Subtract that amount from the price if you want the price after discount.",
            },
            {
              question: "Why is percentage change undefined from zero?",
              answer: "The percentage-change formula divides by the magnitude of the original value. If the original is zero, there is no reference magnitude for the calculation.",
            },
            {
              question: "Are these results suitable for accounting?",
              answer: "No. This tool uses JavaScript's standard floating-point numbers and is intended for everyday estimates, not high-precision financial or accounting work.",
            },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
