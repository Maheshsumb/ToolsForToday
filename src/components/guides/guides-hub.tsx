import Link from "next/link";
import { guides } from "@/content/guides";
import { Container } from "@/components/ui/container";
import { StructuredData } from "@/components/seo/structured-data";

const siteOrigin = "https://toolsfortoday.online";

export function GuidesHub() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Free Online Tool Guides & Tutorials | ToolsForToday",
        description: "Practical, step-by-step tutorials for everyday PDF, image, and calculation tasks.",
        url: `${siteOrigin}/guides/`,
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: guides.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.title,
            url: `${siteOrigin}/guides/${guide.slug}/`,
          })),
        },
      }} />
      <main id="main-content" className="flex-1 py-10 sm:py-14">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-7 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-text">Guides</li>
            </ol>
          </nav>
          <header className="max-w-3xl">
            <p className="text-sm font-semibold text-[#14536C]">ToolsForToday learning center</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">Guides &amp; Tutorials</h1>
            <p className="mt-4 text-base leading-relaxed text-muted">Learn how to complete everyday PDF, image, and calculation tasks with practical, step-by-step guides.</p>
          </header>

          <section aria-label="Published guides" className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.slug} className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#14536C]">{guide.category}</p>
                <h2 className="mt-2 font-heading text-xl font-semibold leading-snug text-text">{guide.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{guide.description}</p>
                <p className="mt-4 text-xs text-muted">Related tool: <Link href={guide.toolHref} className="font-medium text-text underline underline-offset-4 hover:text-[#14536C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{guide.toolName}</Link></p>
                <Link href={`/guides/${guide.slug}/`} className="mt-4 inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Read guide<span className="sr-only">: {guide.title}</span></Link>
              </article>
            ))}
          </section>

          <p className="mt-10 text-sm text-muted">Need a tool first? <Link href="/#tools" className="font-medium text-text underline underline-offset-4 hover:text-[#14536C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Browse all 12 ToolsForToday tools</Link>.</p>
        </Container>
      </main>
    </>
  );
}
