import Link from "next/link";
import { guides, type Guide, type GuideSlug } from "@/content/guides";
import { Container } from "@/components/ui/container";
import { StructuredData } from "@/components/seo/structured-data";

const siteOrigin = "https://toolsfortoday.online";

export function GuideArticle({ guide }: Readonly<{ guide: Guide }>) {
  const canonical = `${siteOrigin}/guides/${guide.slug}/`;
  const relatedGuides = guide.related.map((slug) => guides.find((entry) => entry.slug === slug as GuideSlug)).filter((entry) => entry !== undefined);

  return (
    <>
      <StructuredData data={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          url: canonical,
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          publisher: { "@type": "Organization", name: "ToolsForToday", url: `${siteOrigin}/` },
          inLanguage: "en",
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          url: canonical,
          inLanguage: "en",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteOrigin}/` },
            { "@type": "ListItem", position: 2, name: "Guides", item: `${siteOrigin}/guides/` },
            { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
          ],
        },
      ]} />
      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-7 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li><Link href="/" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/guides/" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Guides</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-full font-medium text-text">{guide.title}</li>
            </ol>
          </nav>

          <article className="mx-auto max-w-3xl">
            <header className="border-b border-border pb-7">
              <p className="text-sm font-semibold text-[#14536C]">{guide.category}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl">{guide.title}</h1>
              <p className="mt-4 text-lg leading-relaxed text-muted">{guide.description}</p>
              <p className="mt-4 text-sm text-muted">A practical guide from ToolsForToday · <Link href={guide.toolHref} className="font-medium text-text underline underline-offset-4 hover:text-[#14536C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Open {guide.toolName}</Link></p>
            </header>

            <div className="guide-prose mt-7 space-y-7 text-base leading-relaxed text-muted">
              <p>{guide.intro}</p>

              <section aria-labelledby="guide-steps-heading">
                <h2 id="guide-steps-heading" className="font-heading text-2xl font-semibold text-text">Step by step</h2>
                <ol className="mt-4 space-y-4">
                  {guide.steps.map((step) => <li key={step.title} className="rounded-xl border border-border bg-surface p-4 sm:p-5"><h3 className="font-heading text-lg font-semibold text-text">{step.title}</h3><p className="mt-2">{step.body}</p></li>)}
                </ol>
              </section>

              {guide.sections.map((section) => (
                <section key={section.heading} aria-labelledby={`section-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <h2 id={`section-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="font-heading text-2xl font-semibold text-text">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3">{paragraph}</p>)}
                  {section.bullets ? <ul className="mt-3 list-disc space-y-2 pl-6">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                </section>
              ))}

              <section aria-labelledby="guide-example-heading" className="rounded-2xl border border-[#C7E8DD] bg-[#F1FAF7] p-5 sm:p-6">
                <h2 id="guide-example-heading" className="font-heading text-xl font-semibold text-text">{guide.example.heading}</h2>
                <p className="mt-2">{guide.example.body}</p>
              </section>

              <section aria-labelledby="guide-mistakes-heading">
                <h2 id="guide-mistakes-heading" className="font-heading text-2xl font-semibold text-text">Common mistakes to avoid</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6">{guide.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
              </section>

              <section aria-labelledby="guide-tips-heading">
                <h2 id="guide-tips-heading" className="font-heading text-2xl font-semibold text-text">Helpful checks</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6">{guide.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
              </section>

              <section aria-labelledby="guide-faq-heading">
                <h2 id="guide-faq-heading" className="font-heading text-2xl font-semibold text-text">Frequently asked questions</h2>
                <div className="mt-3 space-y-4">{guide.faqs.map((faq) => <div key={faq.question}><h3 className="font-semibold text-text">{faq.question}</h3><p className="mt-1">{faq.answer}</p></div>)}</div>
              </section>

              <section aria-labelledby="guide-cta-heading" className="rounded-2xl bg-deep-navy p-5 text-white sm:p-7">
                <h2 id="guide-cta-heading" className="font-heading text-xl font-semibold">Ready to try it?</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80">Use the {guide.toolName} to follow the workflow in this guide. Review the result before relying on or sharing it.</p>
                <Link href={guide.toolHref} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-deep-navy hover:bg-[#F3F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Open {guide.toolName}</Link>
              </section>
            </div>

            {relatedGuides.length > 0 ? <aside aria-labelledby="related-guides-heading" className="mt-10 border-t border-border pt-7"><h2 id="related-guides-heading" className="font-heading text-xl font-semibold text-text">Related guides</h2><ul className="mt-3 grid gap-3 sm:grid-cols-2">{relatedGuides.map((related) => <li key={related.slug}><Link href={`/guides/${related.slug}/`} className="block rounded-xl border border-border bg-surface p-4 font-medium text-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{related.title}</Link></li>)}</ul><p className="mt-5 text-sm"><Link href="/guides/" className="font-medium text-text underline underline-offset-4 hover:text-[#14536C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">Browse all guides</Link></p></aside> : null}
          </article>
        </Container>
      </main>
    </>
  );
}
