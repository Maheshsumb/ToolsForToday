# Analytics Fix 2 — Route Tracking and Automatic Events

## Findings

- The production page-view capture included an application-generated `/404` event while the Privacy Policy successfully rendered. The consent component mapped every pathname except `/` and `/privacy-policy` to `/404`. The exported site uses `trailingSlash: true`, so `/privacy-policy/` did not match that exact allowlist entry.
- The Google tag also automatically emitted a browser-history page view for the real Privacy Policy URL. This is consistent with the title and location in the captured request. Together, the application fallback event and Google tag history event produced two page views for one route change.
- No application `scroll` tracking call or third-party Analytics destination was found in source. In the signed-in GA4 stream, Enhanced Measurement is currently enabled, with Page views, Scrolls, and Outbound clicks active; the additional active measurements include site search, form interactions, video engagement, and file downloads. In Google tag settings, all six editable automatic-event controls are saved on: browser-history page views, scrolls, outbound clicks, form interactions, video engagement, and file downloads. The locked page-load page-view control is on, while the app config sets `send_page_view: false`.
- The scroll request used measurement ID `G-8HTP8B0KY5`, had the homepage as its page location, and was initiated by `gtag.js`. The current saved Scrolls settings explain this event. No GA4 settings were changed during this task; the owner must approve any account-setting correction.

## Local correction

Page views are now requested by explicit markers in the rendered Home, Privacy Policy, and not-found pages. Unknown/transitional pathnames no longer become synthetic 404 events. A shared path guard suppresses repeated effects for the same rendered page, and the event builder uses fixed paths and titles so query strings and user input are not included in manual page-view parameters.

The Privacy Policy draft now describes the currently observed automatic-event configuration. It remains a technical draft and still needs owner identity/contact and jurisdiction-specific legal review before publication.

## Verification

- `npm run test:analytics`: seven focused route/event tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; static export generated `/`, `/_not-found`, and `/privacy-policy`.
- Earlier live Network evidence showed four manual/observed page views across the test sequence (Home, an incorrect `/404`, Privacy Policy, and Home), plus a `scroll` event. The GA4 Realtime report showed aggregated `page_view` and `scroll` events. These measurements predate the local fix and include active automatic-event settings.
- The corrected code has not been deployed. A final production Network test is therefore pending. It cannot meet the one-page-view/no-scroll expectation while the currently saved automatic-event settings remain enabled; obtain owner approval to turn off Enhanced Measurement and the six editable automatic-event controls first. Leave the locked page-load control unchanged; `send_page_view: false` suppresses the initial automatic page view.

## Release gate

Do not push or deploy until the owner approves the GA4 settings correction and a clean production Network test confirms exactly one page view for Home → Privacy Policy → Home, no `/404` transition, no scroll event, consent gating, and withdrawal behavior. Preserve the unrelated local DNS and deployment documentation changes.
