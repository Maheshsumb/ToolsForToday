import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuideArticle } from "@/components/guides/guide-article";
import { getGuide } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo-metadata";

const guide = getGuide("how-to-resize-and-crop-images");
export const metadata: Metadata = createPageMetadata({ title: "How to Resize and Crop Images | ToolsForToday", description: guide.description, path: "/guides/how-to-resize-and-crop-images/" });

export default function HowToResizeAndCropImagesGuide() {
  return <><AnalyticsPageView page="guideResizeCrop" /><GuideArticle guide={guide} /></>;
}
