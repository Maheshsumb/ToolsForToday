import type { Metadata } from "next";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { BenefitsSection } from "@/components/home/benefits-section";
import { HeroSection } from "@/components/home/hero-section";
import { ToolCatalogue } from "@/components/home/tool-catalogue";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "ToolsForToday - Free Online Tools for Everyday Tasks",
  description: "ToolsForToday is preparing free online tools for images, PDFs, calculations, and everyday tasks.",
};

export default function Home() {
  return (
    <>
      <AnalyticsPageView page="home" />
      <main id="main-content" className="flex-1">
      <HeroSection />
      <ToolCatalogue />
      <BenefitsSection />
      <section aria-labelledby="closing-heading" className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-deep-navy px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-14">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#F4B99F]">ToolsForToday</p>
              <h2 id="closing-heading" className="mt-2 font-heading text-2xl leading-tight font-semibold sm:text-3xl">Everyday Tools. One Simple Place.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">Try the Word & Character Counter, then browse the rest of the planned collection.</p>
            </div>
            <a href="#tools" className="mt-7 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-deep-navy transition-colors hover:bg-[#F3F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:mt-0">
              Explore the catalogue
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
        </Container>
      </section>
      </main>
    </>
  );
}
