import type { ReactNode } from "react";

type JsonLdValue = Record<string, unknown>;

export function StructuredData({ data }: Readonly<{ data: JsonLdValue | readonly JsonLdValue[] }>): ReactNode {
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialized }} />;
}
