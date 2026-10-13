import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { ToolHelpSection } from "@/components/tools/tool-help-section";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { DateDifferenceAgeCalculator } from "@/components/tools/date-difference-age-calculator";
import { tools } from "@/config/tools";

const tool = tools.find((entry) => entry.id === "date-difference-age-calculator") as (typeof tools)[number];

export const metadata: Metadata = createPageMetadata({
  title: 'Date Difference & Age Calculator | ToolsForToday',
  description: 'Compare two dates, calculate an age on a selected date, or find the days remaining until a date.',
  path: "/tools/date-difference-age-calculator/",
});

export default function DateDifferenceAgeCalculatorPage() {
  return (
    <>
      <AnalyticsPageView page="dateDifferenceAgeCalculator" />
      <ToolPageShell tool={tool}>
        <DateDifferenceAgeCalculator />
        <ToolHelpSection
          id="date-calculator-help"
          title="How to use the Date Difference & Age Calculator"
          steps={[
            "Choose Date difference to compare two dates, Age calculator to calculate an age on a chosen date, or Days until / since to compare a target date with today.",
            "Select the dates in the calendar fields. Results update as soon as the required dates are entered.",
            "Use Copy Result to copy a text summary, or Clear to reset the selected calculation.",
          ]}
          limitations={[
            "Dates are calendar dates, not times of day. Results are not based on elapsed 24-hour periods and are unaffected by time zones or daylight-saving changes.",
            "Calendar breakdown counts complete calendar years and months, then remaining days. Months have different lengths.",
            "For a February 29 birth date, the age calculation uses February 28 as the birthday in non-leap years.",
            "Supported dates use four-digit Gregorian calendar years from 0001 through 9999.",
          ]}
          faqs={[
            {
              question: "Does this calculate exact hours between dates?",
              answer: "No. It compares calendar dates and counts the number of date boundaries between them. It does not use times of day or elapsed hours.",
            },
            {
              question: "Why can the calendar breakdown differ from the total number of days?",
              answer: "Calendar months vary in length. The breakdown counts complete years and months from the earlier date, then the remaining calendar days; the total is the exact number of calendar days between the dates.",
            },
            {
              question: "How is a February 29 birthday handled in a non-leap year?",
              answer: "For age and next-birthday calculations, February 28 is used in non-leap years. In leap years, February 29 is used.",
            },
            {
              question: "Are my dates sent to ToolsForToday?",
              answer: "No. The calculations run locally in your browser. The site's consent-gated Analytics page views use a fixed route and do not include your entered date values.",
            },
          ]}
        />
      </ToolPageShell>
    </>
  );
}
