import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuideArticle } from "@/components/guides/guide-article";
import { getGuide } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo-metadata";

const guide = getGuide("how-to-calculate-percentage-change");
export const metadata: Metadata = createPageMetadata({ title: "How to Calculate Percentage Change | ToolsForToday", description: guide.description, path: "/guides/how-to-calculate-percentage-change/" });

export default function HowToCalculatePercentageChangeGuide() {
  return <><AnalyticsPageView page="guidePercentageChange" /><GuideArticle guide={guide} /></>;
}
