# Analytics Fix 2 — Route Tracking and Automatic Events

## Findings

- The production page-view capture included an application-generated `/404` event while the Privacy Policy successfully rendered. The consent component mapped every pathname except `/` and `/privacy-policy` to `/404`. The exported site uses `trailingSlash: true`, so `/privacy-policy/` did not match that exact allowlist entry.
- The Google tag also automatically emitted a browser-history page view for the real Privacy Policy URL. This is consistent with the title and location in the captured request. Together, the application fallback event and Google tag history event produced two page views for one route change.
- No application `scroll` tracking call or third-party Analytics destination was found in source. At the time of the captured events, the signed-in GA4 stream had Enhanced Measurement enabled, and Google tag automatic-event detection controls were on. The locked page-load page-view control was also on, while the app config set `send_page_view: false`.
- The scroll request used measurement ID `G-8HTP8B0KY5`, had the homepage as its page location, and was initiated by `gtag.js`. At that time, the GA4 Scrolls setting was enabled. On 2026-10-13, the owner approved turning Enhanced Measurement and all six editable automatic-event controls off; the saved stream settings were reopened and verified. The locked page-load page-view control was left unchanged.

## Local correction

Page views are now requested by explicit markers in the rendered Home, Privacy Policy, and not-found pages. Unknown/transitional pathnames no longer become synthetic 404 events. A shared path guard suppresses repeated effects for the same rendered page, and the event builder uses fixed paths and titles so query strings and user input are not included in manual page-view parameters.

The Privacy Policy draft now describes the saved configuration: Enhanced Measurement and the six editable automatic-event controls are off, the locked page-load control remains on, and the website uses `send_page_view: false` with consent-gated manual route page views. It distinguishes optional interaction events from standard automatically collected events such as `session_start`. Production Network verification after the settings and route fix remains pending. The policy remains a technical draft; operator/contact information and jurisdiction-specific rights, retention, and international-transfer disclosures still require owner input and legal review.

## Verification

- `npm run test:analytics`: seven focused route/event tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; static export generated `/`, `/_not-found`, and `/privacy-policy`.
- Earlier live Network evidence showed four manual/observed page views across the test sequence (Home, an incorrect `/404`, Privacy Policy, and Home), plus a `scroll` event. The GA4 Realtime report showed aggregated `page_view` and `scroll` events. These measurements predate the local fix and include active automatic-event settings.
- The corrected code has not been deployed. A final production Network test is therefore pending. The saved Enhanced Measurement and six editable automatic-event controls are now off. Leave the locked page-load control unchanged; the site config sets `send_page_view: false` and sends its own manual route page views after consent. Do not claim that production has zero duplicate page views or zero scroll events until Network verification is complete.

## Release gate

Do not push or deploy until a clean production Network test verifies the intended Home → Privacy Policy → Home page-view sequence, no `/404` transition, consent gating, event parameters, and withdrawal behavior. Record observed page views and any scroll events; do not assume they are absent based only on settings or local tests. Preserve the unrelated local DNS and deployment documentation changes.
