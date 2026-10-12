import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | ToolsForToday",
  description: "How ToolsForToday handles website requests, browser-based tools, and consent-based Google Analytics.",
};

function ExternalLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <a className="font-medium text-text underline underline-offset-4" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <AnalyticsPageView page="privacyPolicy" />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <Container className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Privacy</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted">Draft for owner and legal review · Last updated October 13, 2026</p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
            <section aria-labelledby="operator-heading">
              <h2 id="operator-heading" className="font-heading text-xl font-semibold text-text">Who operates this website</h2>
              <p className="mt-3">
                ToolsForToday (<ExternalLink href="https://toolsfortoday.online">toolsfortoday.online</ExternalLink>) is operated by Mahesh Sumb. For privacy questions or requests, email <a className="font-medium text-text underline underline-offset-4" href="mailto:maheshsumb.dev@gmail.com">maheshsumb.dev@gmail.com</a>.
              </p>
            </section>

            <section aria-labelledby="information-heading">
              <h2 id="information-heading" className="font-heading text-xl font-semibold text-text">Information processed</h2>
              <p className="mt-3">
                When your browser requests a page, the services that deliver and protect the website may process ordinary connection and request information, such as an IP address, requested URL, browser or device details, and request headers. The precise server and security logs retained for this website, and their retention periods, have not been confirmed.
              </p>
              <p className="mt-3">
                The analytics choice is stored in this browser&apos;s local storage as “accepted” or “rejected.” If you email the privacy contact, your email address, message, any attachments, and delivery information are processed by the email services involved. How long correspondence is retained has not been established for this draft.
              </p>
            </section>

            <section aria-labelledby="tools-heading">
              <h2 id="tools-heading" className="font-heading text-xl font-semibold text-text">Browser-based tools</h2>
              <p className="mt-3">
                The Word &amp; Character Counter and Percentage Calculator perform their calculations in your browser. Their implementation does not send the text or calculation inputs to a ToolsForToday application server, and it does not pass those values to the website&apos;s Google Analytics events. The site&apos;s manual Analytics page views use fixed, allowlisted page paths, titles, and referrer paths rather than tool inputs or search text. This implementation review is not a capture of every network request made by third-party scripts.
              </p>
            </section>

            <section aria-labelledby="analytics-heading">
              <h2 id="analytics-heading" className="font-heading text-xl font-semibold text-text">Google Analytics 4</h2>
              <p className="mt-3">
                ToolsForToday uses Google Analytics 4 (GA4), measurement ID G-8HTP8B0KY5, to understand visits to the website. The Google Analytics tag is not loaded until you choose “Accept analytics.” If you reject, the tag is not loaded. The site then sends consent-gated manual page views for supported routes. Those events use fixed, allowlisted paths and titles and do not include search text, tool inputs, filenames, or query-string values supplied by a visitor.
              </p>
              <p className="mt-3">
                The GA4 web stream has Enhanced Measurement turned off. The editable automatic-event controls for browser-history page views, scrolls, outbound clicks, form interactions, video engagement, and file downloads are also off. The locked page-load page-view control remains enabled in Google&apos;s settings, while this website configures <code>send_page_view: false</code> and sends its own page views after a supported route renders. Standard GA4 events may still be collected after consent, such as <code>session_start</code> and <code>first_visit</code>. No claim is made here that production has been independently checked for duplicate page views, scroll events, or every event parameter.
              </p>
              <p className="mt-3">
                The site sets Google consent signals for <code>ad_storage</code>, <code>ad_user_data</code>, and <code>ad_personalization</code> to denied, including after Analytics is accepted. These site-side signals are separate from the account-level data-sharing settings below. GA4 may process page and event details, browser and device information, technical identifiers, and approximate location information. Analytics cookies or similar technologies may be used after consent. This policy does not claim that Analytics collects no personal data or uses no cookies.
              </p>
              <p className="mt-3">
                The GA4 property currently allows granular city-level location and device-detail collection in all 307 regions shown in its settings. Google signals are not activated, and the user-provided data collection control is not enabled. The account-level setting to share Analytics data with Google for products and services is enabled, as are the settings for modeling contributions and business insights, technical support, and business recommendations. Google describes these settings and their effects in its <ExternalLink href="https://support.google.com/analytics/answer/1011397">data-sharing information</ExternalLink>. This configuration means data use and access may extend beyond providing the Analytics service; the exact application of these account settings to visitor data requires owner and legal review.
              </p>
              <p className="mt-3">
                Email redaction is active in the web stream, but URL query-parameter redaction is inactive. Although the website&apos;s own page-view parameters use sanitized routes, live payloads for every standard or other GA4 event have not been inspected. Do not place personal or sensitive information in a URL.
              </p>
              <p className="mt-3">
                Google&apos;s <ExternalLink href="https://policies.google.com/privacy">Privacy Policy</ExternalLink>, <ExternalLink href="https://support.google.com/analytics/answer/7318509">Analytics privacy information</ExternalLink>, and <ExternalLink href="https://developers.google.com/tag-platform/security/concepts/consent-mode">Consent Mode overview</ExternalLink> explain Google&apos;s data practices and consent controls.
              </p>
            </section>

            <section aria-labelledby="choices-heading">
              <h2 id="choices-heading" className="font-heading text-xl font-semibold text-text">Your Analytics choices</h2>
              <p className="mt-3">
                You can accept or reject Analytics using the consent prompt. Your choice is saved in local storage on this browser until you change it or clear the browser&apos;s site data. If local storage is unavailable, the site cannot reliably save your choice. You can reopen the controls with “Analytics settings” in the footer and reject Analytics to withdraw a previous acceptance.
              </p>
              <p className="mt-3">
                When you withdraw, the site updates its consent state to denied, prevents future site-initiated Analytics events under the implemented controls, clears accessible Google Analytics cookies for this site, and reloads the page if the tag had been requested. This does not retract or delete information Google already received. You may also clear site data in your browser settings.
              </p>
            </section>

            <section aria-labelledby="providers-heading">
              <h2 id="providers-heading" className="font-heading text-xl font-semibold text-text">Hosting and service providers</h2>
              <p className="mt-3">
                The website is hosted and delivered through Cloudflare Pages and Cloudflare&apos;s delivery infrastructure. Cloudflare may process connection and request information to provide its services. See <ExternalLink href="https://www.cloudflare.com/privacypolicy/">Cloudflare&apos;s Privacy Policy</ExternalLink>. The particular logs, processing locations, retention periods, and contractual terms applicable to this site have not been independently confirmed.
              </p>
              <p className="mt-3">
                Google provides the GA4 measurement service described above. The Google Analytics account records acceptance of Google data-processing terms on October 12, 2026; the operator&apos;s jurisdiction and the applicability of particular transfer terms have not been confirmed. When you contact the operator by email, additional email service providers may process the message in transit and at delivery.
              </p>
            </section>

            <section aria-labelledby="ads-heading">
              <h2 id="ads-heading" className="font-heading text-xl font-semibold text-text">Google AdSense</h2>
              <p className="mt-3">
                The site currently has an AdSense ownership-verification meta tag and a public <code>ads.txt</code> seller entry. It does not currently load AdSense advertising JavaScript or serve active ad units. This policy therefore does not describe advertising cookies as being used by active site advertisements. If advertising is introduced later, the policy and consent choices will be reviewed and updated before activation.
              </p>
            </section>

            <section aria-labelledby="retention-heading">
              <h2 id="retention-heading" className="font-heading text-xl font-semibold text-text">Retention</h2>
              <p className="mt-3">
                The GA4 property is configured for 2 months of event-level data retention and 14 months of user-level data retention. “Reset on new user activity” is on for user-level data. Google says these controls do not affect most standard reports based on aggregated data. The settings do not establish how long every copy or category of information may remain in other Google systems. Cloudflare request-log and email-correspondence retention periods have not been confirmed.
              </p>
              <p className="mt-3">
                See Google&apos;s <ExternalLink href="https://support.google.com/analytics/answer/7667196">Analytics data-retention information</ExternalLink> for an explanation of these controls.
              </p>
            </section>

            <section aria-labelledby="international-heading">
              <h2 id="international-heading" className="font-heading text-xl font-semibold text-text">International processing</h2>
              <p className="mt-3">
                Cloudflare&apos;s delivery network and Google&apos;s services may involve processing in more than one country. The exact processing locations and transfer mechanism that apply to this site and its visitors have not been established. Google publishes information about its <ExternalLink href="https://policies.google.com/privacy/frameworks">international data-transfer frameworks</ExternalLink>; Cloudflare describes its practices in its <ExternalLink href="https://www.cloudflare.com/privacypolicy/">Privacy Policy</ExternalLink>. The operator must confirm which terms and safeguards apply before publication.
              </p>
            </section>

            <section aria-labelledby="rights-heading">
              <h2 id="rights-heading" className="font-heading text-xl font-semibold text-text">Privacy questions and requests</h2>
              <p className="mt-3">
                You may email <a className="font-medium text-text underline underline-offset-4" href="mailto:maheshsumb.dev@gmail.com">maheshsumb.dev@gmail.com</a> with a privacy question or request. The rights available to you and the procedures and deadlines that apply depend on the privacy laws relevant to you and the operator. Those laws and any additional required contact or address information have not been determined for this draft. A request to the operator does not automatically delete data already held by Google, Cloudflare, or an email provider.
              </p>
            </section>

            <section aria-labelledby="updates-heading">
              <h2 id="updates-heading" className="font-heading text-xl font-semibold text-text">Policy updates and items for review</h2>
              <p className="mt-3">
                This draft was updated October 13, 2026 and may be revised as the website and its services change. It is not legal advice or a claim of legal compliance.
              </p>
              <p className="mt-3">
                Before publication, the operator must confirm the country and region of establishment, whether the site is operated personally or through a legal entity, applicable visitor rights and request procedures, required operator contact details, applicable Google and Cloudflare transfer terms, and retention for Cloudflare logs and email correspondence. The operator should also resolve the GA4 consent-signals warning and review the enabled account-level data-sharing settings.
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
