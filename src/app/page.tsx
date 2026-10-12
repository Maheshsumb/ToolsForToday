import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  return (
    <main id="main-content" className="flex flex-1 items-center py-16 sm:py-24">
      <Container>
        <section aria-labelledby="site-title" className="mx-auto w-full max-w-3xl rounded-2xl border border-border border-t-8 border-t-brand-accent bg-surface px-6 py-10 sm:px-10 sm:py-14">
          <SectionHeading
            id="site-title"
            as="h1"
            title="We are getting things ready."
            description="Our website is under development. We are building a simple place for free, browser-based everyday tools."
          />
          <p className="mt-5 text-sm font-medium text-muted">Everyday Tools. One Simple Place.</p>
          <div aria-hidden="true" className="mt-8 flex gap-2">
            <span className="h-2 flex-1 rounded-full bg-portland-orange" />
            <span className="h-2 flex-1 rounded-full bg-princeton-orange" />
            <span className="h-2 flex-1 rounded-full bg-indian-yellow" />
            <span className="h-2 flex-1 rounded-full bg-gold-crayola" />
            <span className="h-2 flex-1 rounded-full bg-medium-aquamarine" />
            <span className="h-2 flex-1 rounded-full bg-max-blue" />
          </div>
        </section>
      </Container>
    </main>
  );
}
