import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/analytics/analytics-consent";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/seo-metadata";
import { StructuredData } from "@/components/seo/structured-data";

const title = "Privacy Policy | ToolsForToday";
const description = "Read how ToolsForToday handles website requests, browser-based tools, consent-based Google Analytics, and privacy requests.";

export const metadata: Metadata = createPageMetadata({ title, description, path: "/privacy-policy/" });

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
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        url: "https://toolsfortoday.online/privacy-policy/",
        description,
        inLanguage: "en",
      }} />
      <AnalyticsPageView page="privacyPolicy" />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <Container className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Privacy</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted">Last updated October 13, 2026</p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
            <section aria-labelledby="operator-heading">
              <h2 id="operator-heading" className="font-heading text-xl font-semibold text-text">Who operates this website</h2>
              <p className="mt-3">
                ToolsForToday (<ExternalLink href="https://toolsfortoday.online">toolsfortoday.online</ExternalLink>) is operated by Mahesh Sumb, an individual based in Maharashtra, India. This is a personal website; it is not operated by a registered company. For privacy questions or requests, email <a className="font-medium text-text underline underline-offset-4" href="mailto:maheshsumb.dev@gmail.com">maheshsumb.dev@gmail.com</a>. No postal address or separate privacy-request portal is currently provided.
              </p>
            </section>

            <section aria-labelledby="information-heading">
              <h2 id="information-heading" className="font-heading text-xl font-semibold text-text">Information processed</h2>
              <p className="mt-3">
                When you visit the website, the services that deliver and protect it may process connection and request details such as your IP address, requested page, browser or device information, and request headers. We do not control all records held by these providers. Their specific log-retention periods for this website have not been confirmed.
              </p>
              <p className="mt-3">
                Your Analytics choice is saved in this browser when browser storage is available. If you email the privacy contact, the email address, message, attachments, and delivery information may be processed by the email services involved. The retention period for correspondence has not been confirmed.
              </p>
            </section>

            <section aria-labelledby="tools-heading">
              <h2 id="tools-heading" className="font-heading text-xl font-semibold text-text">Browser-based tools</h2>
              <p className="mt-3">
                The Word &amp; Character Counter, Percentage Calculator, Unit Converter, Date Difference &amp; Age Calculator, QR Code Generator, Image Compressor, Image Resizer &amp; Cropper, JPG, PNG &amp; WebP Image Converter, Images to PDF, PDF to JPG, Merge PDF, and Split PDF process entered values or selected files locally in your browser. QR content is encoded locally, images are processed using browser image APIs, and PDFs are created, rasterized, merged, or split in the browser. Tool inputs, selected files, filenames, page selections, image dimensions, conversion settings, thumbnails, and generated documents are not sent to a ToolsForToday application server or included in the site&apos;s manual Google Analytics page-view events.
              </p>
            </section>

            <section aria-labelledby="analytics-heading">
              <h2 id="analytics-heading" className="font-heading text-xl font-semibold text-text">Google Analytics 4</h2>
              <p className="mt-3">
                ToolsForToday uses Google Analytics 4 (GA4) to understand visits. The GA4 tag loads only after you accept Analytics. If you reject, the tag is not loaded. After acceptance, the site sends page-view events for supported pages using fixed page paths and titles. These manual page views do not include your search text, tool inputs, filenames, or URL query values.
              </p>
              <p className="mt-3">
                Enhanced Measurement is turned off. The separate automatic-event controls for browser-history page views, scrolls, outbound clicks, form interactions, video engagement, and file downloads are also turned off. The site sends its own page views after a supported page loads. Google may still collect standard events after consent, such as session starts and first visits.
              </p>
              <p className="mt-3">
                Advertising-related consent signals remain denied even when Analytics is accepted. Google signals and collection of user-provided data are turned off. After consent, GA4 may process visited-page and event details, browser and device information, technical identifiers, and approximate location information. Google Analytics may use cookies or similar technologies. Analytics data should not be assumed to be anonymous or free of personal information.
              </p>
              <p className="mt-3">
                The GA4 property allows city-level location and detailed device information in all 307 regions listed in its settings. This is a property setting and does not mean every visit is necessarily collected at that level. Four account-level data-sharing options are enabled: Google may use shared Analytics data to improve its products and services; contribute aggregated and de-identified measurement data to modeling and business insights; allow support personnel to access Analytics data when needed for support; and use account usage, configuration, spending, and associated-user information for business recommendations. Read Google&apos;s <ExternalLink href="https://support.google.com/analytics/answer/1011397">data-sharing information</ExternalLink> for details.
              </p>
              <p className="mt-3">
                Google&apos;s email-redaction setting is on, but URL query-parameter redaction is off. The site&apos;s manual page views use fixed paths; other Analytics event details may differ. Avoid putting personal or sensitive information in a URL.
              </p>
              <p className="mt-3">
                See Google&apos;s <ExternalLink href="https://policies.google.com/privacy">Privacy Policy</ExternalLink> and <ExternalLink href="https://support.google.com/analytics/answer/7318509">Analytics privacy information</ExternalLink> for more about Google&apos;s data practices.
              </p>
            </section>

            <section aria-labelledby="choices-heading">
              <h2 id="choices-heading" className="font-heading text-xl font-semibold text-text">Your Analytics choices</h2>
              <p className="mt-3">
                You can accept or reject Analytics in the consent prompt. When browser storage is available, your choice is saved in this browser until you change it or clear the site data. Use “Analytics settings” in the footer to change your choice or withdraw consent by selecting “Reject analytics.”
              </p>
              <p className="mt-3">
                When you withdraw, the site changes its Analytics consent to denied, stops sending its own manual page views, clears Google Analytics cookies it can access, and reloads the page if the GA4 tag had loaded. Withdrawal cannot retrieve or erase information Google already received. You can also clear this site&apos;s data in your browser settings.
              </p>
            </section>

            <section aria-labelledby="providers-heading">
              <h2 id="providers-heading" className="font-heading text-xl font-semibold text-text">Hosting and service providers</h2>
              <p className="mt-3">
                Cloudflare Pages hosts and delivers this website. Cloudflare may process connection and request information to provide and protect the service. See <ExternalLink href="https://www.cloudflare.com/privacypolicy/">Cloudflare&apos;s Privacy Policy</ExternalLink>. The specific processing locations and retention periods for this website have not been confirmed.
              </p>
              <p className="mt-3">
                Google provides the GA4 service described above. Email providers may also process messages sent to the privacy contact.
              </p>
            </section>

            <section aria-labelledby="cloudflare-analytics-heading">
              <h2 id="cloudflare-analytics-heading" className="font-heading text-xl font-semibold text-text">Cloudflare Web Analytics</h2>
              <p className="mt-3">
                We use Cloudflare Web Analytics to understand website visits and improve website performance.
              </p>
              <p className="mt-3">
                Cloudflare may use a browser-based beacon to collect technical information, including page and referrer information, browser and device details, page-loading measurements, and website performance metrics.
              </p>
              <p className="mt-3">
                Cloudflare Web Analytics operates separately from Google Analytics. The Google Analytics consent preference on ToolsForToday does not control Cloudflare Web Analytics.
              </p>
              <p className="mt-3">
                According to Cloudflare&apos;s published documentation, its Web Analytics beacon does not access browser cookies or other browser storage. Cloudflare also describes how it handles IP addresses, processes performance information internationally, and retains analytics data.
              </p>
              <p className="mt-3">
                For more information, see Cloudflare&apos;s <ExternalLink href="https://developers.cloudflare.com/speed/observatory/rum-beacon/">RUM beacon documentation</ExternalLink> and <ExternalLink href="https://developers.cloudflare.com/web-analytics/faq/">Web Analytics FAQ</ExternalLink>.
              </p>
              <p className="mt-3">
                We may update this disclosure as our analytics configuration or Cloudflare&apos;s services change.
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
                GA4 event-level data retention is set to 2 months. User-level data retention is set to 14 months, with the retention period resetting when there is new user activity. This means the period may extend for active users. These settings do not establish how long information may remain in every Google system or aggregated report. Retention periods for Cloudflare request logs and privacy emails have not been confirmed.
              </p>
              <p className="mt-3">
                See Google&apos;s <ExternalLink href="https://support.google.com/analytics/answer/7667196">Analytics data-retention information</ExternalLink> for an explanation of these controls.
              </p>
            </section>

            <section aria-labelledby="international-heading">
              <h2 id="international-heading" className="font-heading text-xl font-semibold text-text">International processing</h2>
              <p className="mt-3">
                Cloudflare and Google may process information in countries outside the country where you are located. The specific locations and transfer arrangements used for this website have not been confirmed. See Google&apos;s <ExternalLink href="https://policies.google.com/privacy/frameworks">international data-transfer information</ExternalLink> and <ExternalLink href="https://www.cloudflare.com/privacypolicy/">Cloudflare&apos;s Privacy Policy</ExternalLink>.
              </p>
              <p className="mt-3">
                India&apos;s Digital Personal Data Protection Act, 2023 and the 2025 Rules have phased start dates. Some provisions took effect on November 13, 2025. Most provisions concerning personal-data processing and related duties are scheduled to take effect on May 13, 2027, with a smaller group scheduled for November 13, 2026. Not all provisions are currently in force. See the official <ExternalLink href="https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf">Act commencement notice</ExternalLink> and <ExternalLink href="https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf">Rules notice</ExternalLink>.
              </p>
              <p className="mt-3">
                This website is intended for visitors worldwide, but international accessibility alone does not automatically mean every country&apos;s privacy law applies. For example, EU GDPR and UK GDPR may apply depending on an organisation&apos;s establishment and whether it targets or monitors people in those regions. If a law applies, the rights available and the rules for using personal information depend on that law. See <ExternalLink href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">EU GDPR Article 3</ExternalLink> and the UK ICO&apos;s <ExternalLink href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/who-does-the-uk-gdpr-apply-to/">UK GDPR guidance</ExternalLink>.
              </p>
            </section>

            <section aria-labelledby="rights-heading">
              <h2 id="rights-heading" className="font-heading text-xl font-semibold text-text">Privacy questions and requests</h2>
              <p className="mt-3">
                To make a privacy request, email <a className="font-medium text-text underline underline-offset-4" href="mailto:maheshsumb.dev@gmail.com">maheshsumb.dev@gmail.com</a> and describe your request and the ToolsForToday visit or service it concerns. The rights and response process depend on the laws that apply. No response deadline is stated here. A request to the operator does not automatically delete information already held by Google, Cloudflare, or an email provider.
              </p>
            </section>

            <section aria-labelledby="updates-heading">
              <h2 id="updates-heading" className="font-heading text-xl font-semibold text-text">Policy updates</h2>
              <p className="mt-3">
                This policy was last updated October 13, 2026. It may be updated when the website or its services change.
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
