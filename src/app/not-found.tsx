import Link from "next/link";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export default function NotFound() {
  return (
    <>
      <AnalyticsPageView page="notFound" />
      <main id="main-content" className="flex flex-1 items-center py-16">
      <Container>
        <SectionHeading as="h1" title="Page not found" description="This page could not be found." />
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-md font-medium text-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">Return to ToolsForToday</Link>
      </Container>
      </main>
    </>
  );
}
