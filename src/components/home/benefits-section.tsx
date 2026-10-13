import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const benefits = [
  {
    title: "Free everyday utilities",
    description: "The Word & Character Counter, Percentage Calculator, Unit Converter, Date Difference & Age Calculator, QR Code Generator, and Image Compressor are free to use without an account or subscription.",
    icon: <path d="M12 2.8v18.4M17 6.2H9.5a3.2 3.2 0 0 0 0 6.4h5a3.2 3.2 0 0 1 0 6.4H6.8" />,
    tone: "bg-[#FFF1EB] text-[#B84222]",
  },
  {
    title: "Simple and accessible",
    description: "Clear labels, useful search, and a straightforward experience help you find what you need.",
    icon: <><path d="M4 5h16M4 10h10M4 15h16M4 20h9" /><circle cx="18" cy="10" r="2" /></>,
    tone: "bg-[#EAF5FB] text-[#176A8B]",
  },
  {
    title: "Made for your screen",
    description: "The site is designed to work across phones, tablets, laptops, and desktop screens.",
    icon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
    tone: "bg-[#E9F7F3] text-[#176B58]",
  },
  {
    title: "Browser-based where supported",
    description: "The six available tools calculate, compress, or generate results locally in your browser. Six more tools are in development.",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18" /></>,
    tone: "bg-[#FFF6E8] text-[#805013]",
  },
];

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-heading" className="py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          id="benefits-heading"
          title="Useful tools, without the fuss"
          description="ToolsForToday is being built around a few simple ideas that make everyday tasks easier."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${benefit.tone}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{benefit.icon}</svg>
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold text-text">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
