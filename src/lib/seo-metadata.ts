import type { Metadata } from "next";

const SITE_ORIGIN = "https://toolsfortoday.online";

interface PageMetadataInput {
  title: string;
  description: string;
  path: `/${string}`;
}

export function createPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = new URL(path, SITE_ORIGIN).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "ToolsForToday",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary", title, description },
  };
}
