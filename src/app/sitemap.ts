import type { MetadataRoute } from "next";
import { tools } from "@/config/tools";
import { guides } from "@/content/guides";

const siteOrigin = "https://toolsfortoday.online";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...tools.map((tool) => `${tool.href}/`), "/privacy-policy/", "/guides/", ...guides.map((guide) => `/guides/${guide.slug}/`)];
  return paths.map((path) => ({ url: new URL(path, siteOrigin).toString() }));
}
