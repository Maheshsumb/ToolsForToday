import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuideArticle } from "@/components/guides/guide-article";
import { getGuide } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo-metadata";

const guide = getGuide("how-to-merge-pdf-files");
export const metadata: Metadata = createPageMetadata({ title: "How to Merge PDF Files in Order | ToolsForToday", description: guide.description, path: "/guides/how-to-merge-pdf-files/" });

export default function HowToMergePdfGuide() {
  return <><AnalyticsPageView page="guideMergePdf" /><GuideArticle guide={guide} /></>;
}
