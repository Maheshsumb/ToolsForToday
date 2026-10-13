import type { MetadataRoute } from "next";
import { tools } from "@/config/tools";

const siteOrigin = "https://toolsfortoday.online";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...tools.map((tool) => `${tool.href}/`), "/privacy-policy/"];
  return paths.map((path) => ({ url: new URL(path, siteOrigin).toString() }));
}
