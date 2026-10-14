import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuideArticle } from "@/components/guides/guide-article";
import { getGuide } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo-metadata";

const guide = getGuide("how-to-turn-images-into-pdf");
export const metadata: Metadata = createPageMetadata({ title: "How to Convert Images to PDF | ToolsForToday", description: guide.description, path: "/guides/how-to-turn-images-into-pdf/" });

export default function HowToTurnImagesIntoPdfGuide() {
  return <><AnalyticsPageView page="guideImagesToPdf" /><GuideArticle guide={guide} /></>;
}
