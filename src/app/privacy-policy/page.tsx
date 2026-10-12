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
              ToolsForToday uses Google Analytics 4 (GA4) to understand visits to this website. For a visitor who has not accepted analytics, or whose saved choice is rejection, this website does not load the Google Analytics tag. After you accept analytics, the tag may load and the website sends consent-gated manual page-view events using fixed, allowlisted paths and titles. Those manual events do not include search text, query-string values, filenames, or tool input.
            </p>
            <p className="mt-3">
              The GA4 web stream currently has Enhanced Measurement turned off. The editable automatic-event controls for browser-history page views, scrolls, outbound clicks, form interactions, video engagement, and file downloads are also turned off. These are optional automatic interaction events. GA4 may still collect automatically collected standard events after the tag loads with consent, such as <code>session_start</code> (see Google&apos;s <a className="font-medium text-text underline underline-offset-4" href="https://support.google.com/analytics/answer/9234069" rel="noreferrer" target="_blank">automatically collected events</a> information).
            </p>
            <p className="mt-3">
              GA4&apos;s locked page-load page-view control remains enabled in the stream settings. The website configures `send_page_view: false` and sends its own consent-gated manual page views when the corresponding page has rendered. The optional browser-history page-view control is off. Production Network verification after these changes is still pending; this description does not claim that duplicate page views or scroll events have been independently ruled out in production.
            </p>
            <p className="mt-3">
              Google Analytics may process information such as pages visited, event details, browser and device information, and technical identifiers. Analytics cookies or similar technologies may be used after consent. This policy does not claim that Analytics data is anonymous or that Google receives no personal data. Do not put personal or sensitive information in a page URL.
            </p>
          </section>

          <section aria-labelledby="choices-heading">
            <h2 id="choices-heading" className="font-heading text-xl font-semibold text-text">Your choices</h2>
            <p className="mt-3">
              The analytics prompt offers separate Accept and Reject choices. The website works without analytics consent. Rejecting prevents the Google Analytics tag from loading. If you withdraw after acceptance, the website updates the consent state to denied, stops its future manual page-view events, clears accessible Google Analytics cookies for this site, and reloads the page if the tag had already been requested. This does not delete information Google may already have received. The choice is stored in this browser&apos;s local storage until changed or browser site data is cleared.
            </p>
            <p className="mt-3">
              You can change or withdraw your choice at any time using “Analytics settings” in the footer. Your browser may retain other data outside this website&apos;s control; you can also clear site data in your browser settings.
            </p>
          </section>

          <section aria-labelledby="cookies-heading">
            <h2 id="cookies-heading" className="font-heading text-xl font-semibold text-text">Cookies and similar technologies</h2>
            <p className="mt-3">
              Before analytics is accepted, this website does not load the GA4 tag or set GA cookies. The consent choice is saved in local browser storage. After acceptance, Google Analytics may use cookies or similar technologies as described by Google. See Google&apos;s information about its <a className="font-medium text-text underline underline-offset-4" href="https://support.google.com/analytics/answer/9019185" rel="noreferrer" target="_blank">privacy controls for Google Analytics</a> and <a className="font-medium text-text underline underline-offset-4" href="https://support.google.com/analytics/answer/7667196" rel="noreferrer" target="_blank">data-retention settings</a> for general product information; this website&apos;s configured Analytics retention period has not been verified for this draft.
            </p>
          </section>

          <section aria-labelledby="google-heading">
            <h2 id="google-heading" className="font-heading text-xl font-semibold text-text">More information</h2>
            <p className="mt-3">
              Read Google&apos;s <a className="font-medium text-text underline underline-offset-4" href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">Privacy Policy</a> and its <a className="font-medium text-text underline underline-offset-4" href="https://support.google.com/analytics/answer/7318509" rel="noreferrer" target="_blank">Google Analytics privacy disclosures</a> for information about Google&apos;s handling of data and disclosure guidance.
            </p>
          </section>

          <section aria-labelledby="owner-review-heading">
            <h2 id="owner-review-heading" className="font-heading text-xl font-semibold text-text">Details to complete before publication</h2>
            <p className="mt-3">
              This technical draft does not yet identify the responsible website operator or provide a working privacy-contact email. The operator must add and verify those details, determine which visitor privacy rights and request procedures apply to the site&apos;s visitors, and obtain appropriate legal review.
            </p>
            <p className="mt-3">
              The Analytics data-retention period for this property has not been verified. The operator must confirm the setting and describe it accurately. The locations and terms for any international processing or transfers involving Google have also not been verified and require operator and legal review. The withdrawal controls described above are implemented on this website; the operator should confirm whether additional withdrawal or rights-request methods are required for the jurisdictions served.
            </p>
            <p className="mt-3">This page is a technical draft for owner review and is not a guarantee of legal compliance.</p>
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
