import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { GuidesHub } from "@/components/guides/guides-hub";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Free Online Tool Guides & Tutorials | ToolsForToday",
  description: "Learn practical ways to compress images, merge PDFs, convert images to PDF, resize and crop images, and calculate percentage change.",
  path: "/guides/",
});

export default function GuidesPage() {
  return <><AnalyticsPageView page="guides" /><GuidesHub /></>;
}
