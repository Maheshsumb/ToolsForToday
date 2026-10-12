import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | ToolsForToday",
  description: "How ToolsForToday uses consent-based Google Analytics on this soft-launch website.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <AnalyticsPageView page="privacyPolicy" />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
      <Container className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Privacy</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted">Technical draft for owner review · Last updated October 13, 2026</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
          <section aria-labelledby="analytics-heading">
            <h2 id="analytics-heading" className="font-heading text-xl font-semibold text-text">Google Analytics</h2>
            <p className="mt-3">
              ToolsForToday uses Google Analytics 4 (GA4) to understand visits to this website. After you choose “Accept analytics,” the website sends manually configured page-view events using a limited set of known page paths and fixed titles. These manual events exclude search text, query-string values, filenames, and tool input. The current GA4 automatic-event settings are described below.
            </p>
            <p className="mt-3">
              Google Analytics may process information such as the pages visited, the time of a visit, browser and device details, and technical identifiers. Analytics cookies and similar storage may be used after consent. We do not describe GA4 data as anonymous; Google may receive and process information when analytics is enabled.
            </p>
            <p className="mt-3">
              The current GA4 configuration has Enhanced Measurement enabled. Google tag automatic event detection is also enabled for browser-history page views, scrolls, outbound clicks, site search, form interactions, video engagement, and file downloads. These automatic events are separate from this website’s manually configured page views and may be sent after you accept analytics when their conditions are met. Google may receive page-location details, including URL query values, for automatically detected page views and site-search events; do not put personal or sensitive information in a page URL. The website’s manual page views use fixed paths and titles and exclude query-string values, search text, filenames, and tool input. Google Analytics may still process technical identifiers and browser or device information when analytics is enabled.
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
              Before you accept analytics, this website does not load the GA4 tag or set analytics cookies. Your choice is saved in local browser storage. After acceptance, GA4 may use analytics cookies or similar technologies as described by Google. The current stream has automatic event detection enabled as described above, in addition to the consent-gated manual page views configured by this website.
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
    </>
  );
}
