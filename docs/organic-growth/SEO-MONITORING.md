# Organic Search Monitoring

Use this sheet as a manual record of measured values. Record the source and date range with every measurement. Write `UNKNOWN` or `NOT YET AVAILABLE` rather than estimating.

## Baseline context

- Baseline opened: October 14, 2026.
- Before Stage 06A, the local sitemap source listed 14 URLs: the homepage, 12 tools, and Privacy Policy. This is a source-code count, not an independent live crawl or index count.
- The Guides hub and five guides are local changes on a development branch and are not part of the production sitemap until an owner-approved deployment.
- Google Search Console and Bing Webmaster Tools ownership are reported as configured in project history. Account access and current dashboard data were not inspected for this stage.
- Current indexed-page counts, impressions, clicks, queries, referrals, and field performance values: `UNKNOWN`.

## Checkpoint

Use October 21, 2026 as a reporting checkpoint after any approved deployment and normal crawl time. Do not repeatedly resubmit the same sitemap or request indexing for every URL. A submitted/discovered URL is not proof that a search engine indexed it.

## Monthly measurement template

| Date recorded | Reporting period | Indexable URLs in live sitemap | Google indexed pages (GSC) | Bing indexed pages | Google impressions | Google organic clicks | Top relevant queries | Organic landing pages | Referring domains | Referral sources | Instagram referrals | GitHub referrals | Page-specific performance / issues | Source / notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | --- | ---: | ---: | --- | --- |
| 2026-10-14 | Baseline opened; pre-deploy | 14 in local pre-stage sitemap; live value UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Guides are local only; owner-reported verification, dashboards not accessed. |
| 2026-10-21 | First planned review | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | NOT YET AVAILABLE | Record a real date range and dashboard export/screenshot reference. |

## Measurement notes

- Use Search Console and Bing Webmaster Tools for search queries, impressions, clicks, indexing status, and page diagnostics when available.
- Treat GA4 and Cloudflare analytics as separate sources. GA4 collection depends on visitor consent; do not alter consent to improve measurement.
- Use tagged Instagram or GitHub links only if the owner approves, the query string is not sent to Analytics under current implementation, and destination privacy disclosures remain accurate.
- Track referring domains from a documented source and distinguish unique domains from individual links.
- Record lab performance measurements separately from real-user Core Web Vitals. Do not imply a Lighthouse score is field data.
- Compare equivalent date ranges and note missing data, property filters, and reporting delays.
- Add a guide to “top landing pages” only after it is live; separate impressions from actual visits.
