# Stage 03E — Privacy and GA4 Audit

Audit date: October 13, 2026
Project: ToolsForToday
Production commit checked: `efe54cfb2be583a76e351cd381dd237e049ec4f0`
GA4 property: ToolsForToday
Web stream ID: `16114214078`
Measurement ID: `G-8HTP8B0KY5`

This is a record of the read-only GA4 dashboard review and a source review of the local website. It is not a legal opinion, proof of production network behavior, or approval to publish the policy.

## Operator details supplied by the owner

- Website: ToolsForToday — <https://toolsfortoday.online>
- Operator: Mahesh Sumb
- Location: Maharashtra, India
- Operation: Personal website; no registered company
- Privacy contact: <maheshsumb.dev@gmail.com>
- No postal address, registration number, DPO, or legal representative was supplied. The policy does not imply an incorporated entity.

## India law review and commencement status

Read the official MeitY-hosted Gazette notifications G.S.R. 843(E) (Act commencement) and G.S.R. 846(E) (DPDP Rules commencement), both dated November 13, 2025, and the Rules corrigendum G.S.R. 892(E), published December 11, 2025. The corrigendum corrects text at specified pages and does not change the phased commencement dates. The MeitY Act-and-Policies listing also shows the Rules, their enforcement timeline, and the corrigendum. No later commencement change was identified in that official listing as of October 13, 2026.

The notifications phase in commencement; enactment and rulemaking do not mean every provision is currently operative:

- Effective November 13, 2025 under G.S.R. 843(E): Act section 1(2), section 2, sections 18–26, 35, and 38–43, and section 44(1) and (3). Under G.S.R. 846(E), Rules 1, 2, and 17–21 commenced on publication.
- Scheduled for November 13, 2026: Act section 6(9) and section 27(1)(d), and Rule 4. As of this audit date, these scheduled dates are still in the future.
- Scheduled for May 13, 2027: Act sections 3–5, 6(1)–(8) and (10), 7–17, 27 except clause (d) of subsection (1), 28–34, 36, 37, and 44(2); Rules 3, 5–16, 22, and 23. These dates are computed as eighteen months after publication of the November 13, 2025 Gazette notifications.

The 18-month group includes the Act's principal processing and fiduciary duties, consent and notice framework, rights and grievance provisions, security, breach, retention/erasure and transfer provisions, together with implementing Rules 3 and 5–16. In particular, the Rules on security safeguards, breach intimation, and specified-purpose retention/erasure are Rules 6–8 within the scheduled Rules 5–16 group. This is a commencement summary only; counsel should map each duty to the actual processing and providers.

This is a reading of the commencement notices, not advice that the operator has no current obligations under other Indian laws, nor a conclusion that the DPDP Act applies to each activity on the site. Counsel should confirm how the phased provisions apply to this personal website and what changes or notice content will be needed by each effective date. Official references: Act commencement notification, <https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf>; Rules notification, <https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf>; corrigendum, <https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf>; MeitY Act-and-Policies listing, <https://www.meity.gov.in/documents/act-and-policies>.

## International audience review

The site is intended for worldwide visitors. The EU GDPR applies in defined territorial-scope cases, including processing connected with an EU establishment and certain processing by an operator outside the Union related to offering services to people in the Union or monitoring their behaviour there. UK GDPR has comparable establishment, targeting, and monitoring questions. Public accessibility alone does not determine the outcome; the global audience statement and use of GA4 mean scope needs a fact-specific legal review. If EU/EEA or UK rules apply, counsel should determine the lawful basis for each processing purpose, rights and request routes, any representative requirement, cookie/similar-technology rules, and international transfer mechanisms. The policy flags these matters without asserting applicability or compliance.

Official primary references reviewed: EU GDPR Article 3, <https://eur-lex.europa.eu/eli/reg/2016/679/oj>; UK ICO territorial-scope guidance, <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-and-the-eu-in-detail/the-uk-gdpr/territorial-scope/>.

## Website implementation reviewed

- The root layout sets all four Consent Mode signals to denied by default. The GA4 script is rendered only after the visitor accepts Analytics.
- Accept grants `analytics_storage`; `ad_storage`, `ad_user_data`, and `ad_personalization` remain denied. Reject saves the choice, updates the denied state, clears accessible `_ga` cookies, and reloads if the tag had been requested.
- The choice is saved in browser local storage under `toolsfortoday-analytics-consent` as `accepted` or `rejected`. If storage is unavailable, the application catches the error and cannot persist the choice.
- The tag config includes `send_page_view: false`, `allow_google_signals: false`, and `allow_ad_personalization_signals: false`. Manual page views use the fixed route/title allowlist and fixed route referrers; query strings and visitor inputs are not part of those payloads. Existing tests cover allowlisted routes, consent gating, duplicate-route suppression, and excluding query strings from prepared page views.
- The Word & Character Counter and Percentage Calculator compute in the browser. The source reviewed does not pass their inputs to Analytics or an application endpoint. This code review does not verify every production request or every standard GA4 event payload.
- The root Metadata API still sets `noindex, follow` and the AdSense verification meta tag. `public/ads.txt` still contains `google.com, pub-9582226210309650, DIRECT, f08c47fec0942fa0`. No AdSense advertising script or ad unit was found in the reviewed application source.
- The footer links to the Privacy Policy and exposes the “Analytics settings” control.

## GA4 dashboard findings

### Stream and Google tag

- One web data stream was listed: ToolsForToday, `https://toolsfortoday.online`, stream `16114214078`. No other web, iOS, or Android stream was listed.
- The stream details showed “No data received in past 48 hours” and “Data collection isn't active for your website.” These are dashboard status messages; this audit did not determine their cause.
- Enhanced Measurement was OFF.
- The separate automatic-event controls were verified OFF: browser-history page views, scrolls, outbound clicks, form interactions, video engagement, and file downloads. The locked page-load page-view control remains enabled; the site config sets `send_page_view: false` and sends its own manual, consent-gated page views.
- Site-search tracking was not shown as a separate stream control during this review. Enhanced Measurement is globally OFF, so the Enhanced Measurement search event is not enabled.
- The Google tag showed measurement ID `G-8HTP8B0KY5` and tag ID `GT-K82QLC7D`, with ToolsForToday GA4 as its destination and zero connected site tags.
- Email redaction was active. URL query-parameter redaction was inactive. The stream details panel showed no active Enhanced Measurement beyond the separate page-view control.

### Data retention

- Event-level data retention: **2 months**.
- User-level data retention: **14 months**.
- “Reset on new user activity”: **ON**.
- Google Analytics states that these controls do not affect most standard reports based on aggregated data. The configured retention periods are not a promise that every copy or category of data in every Google system is deleted on those dates. See [Google Analytics data-retention information](https://support.google.com/analytics/answer/7667196).

### Property collection and advertising controls

- Google signals: **OFF**; the UI offered “Turn on Google signals.”
- GA4 user-provided data collection: **OFF**; the UI offered “Turn on.”
- Granular location and device collection: **ON**, allowed in **307 of 307** regions. The UI describes city-level location and granular device details. Region- and country-level metadata is collected by default according to the UI.
- Ads personalization: allowed in **307 of 307** regions according to the property settings panel. This setting is distinct from the site-side denied `ad_personalization` signal and from Google signals, which is OFF.
- No Google Ads links were listed (0 completed, 0 approval-needed, 0 request-sent, 0 cancelled). No Google AdSense link was listed.
- The UI showed no connected site tags, in addition to the lack of Google Ads and AdSense product links.

### Account-level data sharing

All four account-level data-sharing controls were ON:

| Setting | Observed state | Dashboard description |
| --- | --- | --- |
| Google products & services | ON | Allows Google to use shared Analytics data to improve Google products and services. |
| Modeling contributions & business insights | ON | Contributes aggregated and de-identified measurement data for business insights. |
| Technical support | ON | Allows Google support representatives to access Analytics data and the account when needed for support. |
| Recommendations for your business | ON | Allows access to Analytics account usage/configuration, product-spending, and associated-user information for business recommendations. |

The account UI recorded acceptance of the controller-controller data protection terms on October 12, 2026, and Google Ads Data Processing Terms on October 12, 2026. The account's Country of Business field showed “Select country”; no country was selected. These visible settings do not establish which legal entity operates the site or which transfer mechanism applies. Google explains the account options in its [data-sharing settings documentation](https://support.google.com/analytics/answer/1011397) and the [controller-controller terms](https://support.google.com/analytics/answer/9024351).

### Consent dashboard warning

The property Consent settings page showed:

- “Issues detected in 1 stream: ToolsForToday” and “Data missing consent signals may impact your measurement capabilities.”
- An “Urgent” warning reported a 0% consent rate in some regions, with consent signals marked denied in various regions including those outside the EEA.
- Behavioral Analytics consent signals were shown as inactive. Advertising consent signals were shown as inactive, with `ad_user_data` flagged as needing attention.

The dashboard also showed no data received in the prior 48 hours. This audit records the displayed warning but does not infer a cause or claim that the production network behavior was independently verified. The owner should investigate the warning and verify consent states in a fresh production browser session before publication or relying on consent-based reports. See Google's [Consent Mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode) and [consent settings documentation](https://support.google.com/analytics/answer/14275483).

## Privacy Policy changes

The policy now identifies Mahesh Sumb as operator and provides a clickable email contact. It describes request/connection information, consent storage, voluntary email correspondence, local processing in the two available tools, the implemented manual Analytics routes and consent controls, standard GA4 events, disabled Enhanced Measurement controls, enabled account-level data sharing, city/device collection, URL-query redaction status, verified retention, hosting/provider roles, the current AdSense verification-only setup, and the unresolved transfer and jurisdiction details.

Official references added to the policy:

- [Google Privacy Policy](https://policies.google.com/privacy)
- [Google Analytics privacy information](https://support.google.com/analytics/answer/7318509)
- [Google Analytics data-sharing settings](https://support.google.com/analytics/answer/1011397)
- [Google Analytics data retention](https://support.google.com/analytics/answer/7667196)
- [Google Consent Mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Google international data-transfer frameworks](https://policies.google.com/privacy/frameworks)
- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

## Owner and legal review still required

The page remains a draft and is **not ready for publication** until the operator or qualified counsel confirms:

1. Which current laws apply to this India-based personal website and the applicability/timing of DPDP obligations as provisions commence.
2. For each relevant visitor jurisdiction, applicable lawful bases, individual rights, request/grievance procedures, representative requirements, and legally required operator/contact disclosures. No postal address has been provided.
3. Which Google and Cloudflare processing locations, data-transfer terms, and safeguards apply to this website and its visitors.
4. Cloudflare request/security-log retention and the operator's email-correspondence retention.
5. Whether the enabled Google products-and-services data-sharing, modeling, technical-support, and recommendations settings are intended and adequately disclosed.
6. The reason for the GA4 Consent settings warning, and production network evidence for requests before acceptance, after rejection, on acceptance/navigation, and after withdrawal.
7. The URL-query redaction control remains inactive; inspect production payloads before making any stronger statement about query strings or other parameters.

No GA4, Cloudflare, DNS, redirect, or website consent setting was changed during this audit.
