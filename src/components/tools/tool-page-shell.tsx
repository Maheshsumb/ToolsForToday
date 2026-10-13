import type { ReactNode } from "react";
import Link from "next/link";
import type { ToolDefinition } from "@/config/tools";
import { toolCategories } from "@/config/tools";
import { ToolIcon } from "@/components/tools/tool-icon";
import { Container } from "@/components/ui/container";
import { RelatedTools } from "@/components/tools/related-tools";
import { StructuredData } from "@/components/seo/structured-data";

interface ToolPageShellProps {
  tool: ToolDefinition;
  children: ReactNode;
  showRelatedTools?: boolean;
}

const iconTones = {
  image: "bg-[#FFF1EB] text-[#8C351C]",
  pdf: "bg-[#EAF5FB] text-[#14536C]",
  utility: "bg-[#E9F7F3] text-[#14563F]",
} as const;

export function ToolPageShell({ tool, children, showRelatedTools = true }: ToolPageShellProps) {
  const canonicalUrl = `https://toolsfortoday.online${tool.href}/`;
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: tool.title,
        url: canonicalUrl,
        description: tool.description,
        inLanguage: "en",
      }} />
      <main id="main-content" className="flex-1 py-8 sm:py-10 lg:py-12">
        <Container>
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <li><Link href="/" className="rounded-sm underline-offset-4 hover:text-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Home</Link></li>
            <li aria-hidden="true"><span>/</span></li>
            <li>{toolCategories[tool.category]}</li>
            <li aria-hidden="true"><span>/</span></li>
            <li aria-current="page" className="font-medium text-text">{tool.title}</li>
          </ol>
        </nav>

        <header className="mb-8 flex items-start gap-4 sm:mb-10 sm:gap-5">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${iconTones[tool.category]}`}>
            <ToolIcon name={tool.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-muted">{toolCategories[tool.category]}</p>
            <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-text sm:text-4xl">{tool.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">{tool.description}</p>
          </div>
        </header>

        {children}
        {showRelatedTools ? <RelatedTools currentToolId={tool.id} /> : null}
        </Container>
      </main>
    </>
  );
}
