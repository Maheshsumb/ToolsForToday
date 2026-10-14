import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuideArticle } from "@/components/guides/guide-article";
import { getGuide } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo-metadata";

const guide = getGuide("how-to-compress-images-in-your-browser");
export const metadata: Metadata = createPageMetadata({ title: "How to Compress Images in Your Browser | ToolsForToday", description: guide.description, path: "/guides/how-to-compress-images-in-your-browser/" });

export default function HowToCompressImagesGuide() {
  return <><AnalyticsPageView page="guideImageCompression" /><GuideArticle guide={guide} /></>;
}
