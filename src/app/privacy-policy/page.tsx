import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | ToolsForToday",
  description: "How ToolsForToday uses consent-based Google Analytics on this soft-launch website.",
};

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content" className="flex-1 py-12 sm:py-16">
      <Container className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Privacy</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted">Technical draft for owner review · Last updated October 13, 2026</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
          <section aria-labelledby="analytics-heading">
            <h2 id="analytics-heading" className="font-heading text-xl font-semibold text-text">Google Analytics</h2>
            <p className="mt-3">
              ToolsForToday uses Google Analytics 4 (GA4) to understand visits to this website. We send basic page-view events only after you choose “Accept analytics.” These events use a limited set of known page paths and fixed page titles. We do not send search text, query-string values, filenames, or tool input in our manually configured events.
            </p>
            <p className="mt-3">
              Google Analytics may process information such as the pages visited, the time of a visit, browser and device details, and technical identifiers. Analytics cookies and similar storage may be used after consent. We do not describe GA4 data as anonymous; Google may receive and process information when analytics is enabled.
            </p>
            <p className="mt-3">
              Enhanced Measurement is disabled for this GA4 web stream. Automatic browser-history page views, scrolls, outbound clicks, site-search tracking, form interactions, video engagement, and file-download events are turned off. The website sends limited manual page views only after you accept analytics. Its configuration disables the tag’s automatic initial page view and uses an allowlist of known routes and fixed titles; it excludes search text, query-string values, filenames, and tool input from those events. Google Analytics may still process technical identifiers and browser or device information when analytics is enabled.
            </p>
          </section>

          <section aria-labelledby="choices-heading">
            <h2 id="choices-heading" className="font-heading text-xl font-semibold text-text">Your choices</h2>
            <p className="mt-3">
              The analytics prompt offers separate Accept and Reject choices. The website works without analytics consent. Rejecting before acceptance prevents the Google Analytics script from loading. If you withdraw after acceptance, we update consent to denied and stop sending our manual page-view events. We store only your choice in this browser so we can remember it.
            </p>
            <p className="mt-3">
              You can change or withdraw your choice at any time using “Analytics settings” in the footer. Withdrawing consent updates the analytics consent state to denied, stops future manual page-view events, removes accessible Google Analytics cookies for this site, and reloads the page if the Google tag was already requested so it is not reloaded. This does not delete information Google may have already received. Your browser may retain other data outside the website’s control; browser settings can be used to clear site data.
            </p>
          </section>

          <section aria-labelledby="cookies-heading">
            <h2 id="cookies-heading" className="font-heading text-xl font-semibold text-text">Cookies and similar technologies</h2>
            <p className="mt-3">
              Before you accept analytics, this website does not load the GA4 tag or set analytics cookies. Your choice is saved in local browser storage. After acceptance, GA4 may use analytics cookies or similar technologies as described by Google. The stream’s automatic event controls are disabled; only the consent-gated manual page views described above are configured by this website.
            </p>
          </section>

          <section aria-labelledby="google-heading">
            <h2 id="google-heading" className="font-heading text-xl font-semibold text-text">More information</h2>
            <p className="mt-3">
              Read <a className="font-medium text-text underline underline-offset-4" href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">Google’s Privacy Policy</a> for information about Google’s handling of data. This page is a technical draft for owner review and is not a guarantee of legal compliance.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm">
          <Link className="font-semibold text-text underline underline-offset-4" href="/">Return to ToolsForToday</Link>
        </p>
      </Container>
    </main>
  );
}
