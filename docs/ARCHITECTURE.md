# Architecture

## Static application

Next.js App Router exports HTML, CSS, JavaScript, and local assets to `out/`. Cloudflare Pages Free is the intended host. Static export avoids server operations and supports free access without accounts, a database, or paid APIs. Deployment preparation and current connection status are tracked in `docs/DEPLOYMENT.md`.

The root layout renders a shared `SiteHeader` and `SiteFooter`, a skip link, and each route’s main content. Reusable UI components live in `src/components/ui/`; page-shell parts live in `src/components/layout/`. The brand tokens and responsive global conventions live in `src/app/globals.css`.

The header uses a server-rendered desktop navigation plus a small Client Component for the mobile disclosure menu. The menu exposes expanded/controls state, closes after navigation or Escape and returns focus to its trigger, including when focus moved elsewhere before Escape. Navigation links only point to routes that currently exist. Add a tools-directory link after that route is implemented.

Server Components may render at build time. Browser APIs must be used in event handlers or effects, not during prerendering. Supported features include static routes, CSS, local assets, and dynamic routes with every path supplied by `generateStaticParams`. next/image optimization is disabled for static hosting.

Runtime SSR, Server Actions, request-dependent route handlers, cookies(), runtime redirects/rewrites, ISR, and the default image optimizer are incompatible with this architecture. Do not introduce runtime API endpoints, authentication, databases, Workers, or Pages Functions. New routes must pass a static build.

## Future browser file processing

Files will be selected explicitly by the user and processed locally using browser APIs. Validate type and size, handle errors, release object URLs, and avoid storing file contents in logs or analytics. Consider Web Workers for expensive work and load processing libraries only on relevant tool routes. No file-processing libraries or tools are implemented yet.

## Directories

- `src/app/`: route pages, root metadata, global tokens, and 404 page.
- `src/components/layout/`: shared header, footer, and responsive menu.
- `src/components/ui/`: reusable buttons, containers, navigation links, and section headings.
- `src/config/`: shared configuration when needed.
- `src/lib/`: focused browser utilities when needed.
- `src/types/`: shared types when needed.
- `public/brand/`: optimized web logo and icon assets.
- `docs/brand/source/`: preserved original brand PNGs and reference poster.
- `docs/`: architecture, brand, and milestone scope.

The Inter and Poppins font files are bundled from Fontsource and served from the same static host; font-display: swap and system fallbacks keep text readable. Current subsets are Latin; expand subsets when adding other languages.

## Homepage and tool catalogue

The root metadata sets `robots: { index: false, follow: true }` through the Next.js Metadata API. Keep this temporary noindex directive until the owner separately approves indexing; do not block crawling in `robots.txt`, because crawlers need to read the noindex directive.

The home route (`src/app/page.tsx`) is a Server Component with page-specific title and description metadata. It composes the hero, catalogue, benefits, and closing sections from `src/components/home/`. The shared header, footer, skip link, and locally bundled fonts remain in the root layout. The existing `suppressHydrationWarning` on `<html>` is retained to tolerate attributes injected by browser extensions before hydration; do not add client-only values or branches to the root markup.

`src/config/tools.ts` is the single typed source for the 12 planned tools. Each entry has a stable ID and slug, title, category, description, search keywords, icon identifier, and availability. Keep unbuilt tools' copy descriptive and clearly paired with their `Coming soon` status; do not claim the tools already work. To publish a tool in a later stage, implement its real static route first, then set its entry to `availability: "available"` and add the matching local `href`. The reusable `ToolCard` only renders a link for entries that are both available and have a route. Do not add placeholder routes or open buttons.

`ToolCatalogue` is the only homepage client island. It filters the imported catalogue in memory by title, description, slug, and keywords, and applies category and search criteria together. Its initial state renders all tool cards in the statically generated page. Keep search data in the shared configuration; do not duplicate it in UI components or connect an external service. The benefit and hero copy describe the intended product and explicitly say tools are being prepared; browser-based processing is a plan for supported future tools, not a claim that current tools process files.

Homepage design uses the approved logo in the shared shell, Poppins headings, Inter interface text, and the existing semantic palette. Category icon tints use accessible dark foregrounds on pale surfaces. The hero preview is a lightweight decorative CSS/inline-SVG composition, not an interactive tool or a status dashboard.

The Word & Character Counter is the first available catalogue entry at `/tools/word-character-counter/`. The other 11 entries remain `coming-soon`. The catalogue's search covers full query substrings, so a multi-word phrase matches when that phrase appears continuously in a title, description, slug, or keyword.

## Reusable tool-page UI

`src/components/tools/tool-page-shell.tsx` is the Server Component frame for a future tool route. It accepts a configured tool, renders Home > category > tool breadcrumbs, the icon/title/description introduction, page content, and related tools. The category crumb is text because category routes do not exist. `RelatedTools` derives entries from `src/config/tools.ts` and only links definitions marked `available` with a real `href`; with the current catalogue it renders no related links.

Use `ToolWorkspace` for a focused input/result group. `ToolInput`, `ToolTextarea`, and `ToolSelect` pair visible labels with optional help and error IDs. `ToolHelpSection` renders supplied instructions, limitations, and only the FAQs passed by the tool page. `ToolPrivacyNote` receives the exact processing statement verified for that implementation. `ToolResultPanel` is a content region with an optional action slot; the tool page may put a real download link or copy control there after a real result exists. It provides no fake download or processing action itself.

Workspace patterns are composed from the same controls:

- File tools use `FileDropzone` and `FileSummary`. The dropzone supports a configured MIME/extension list, per-file size, and single or multiple selection. Drag-and-drop is optional; the labelled file input remains available. Client-side type/size checks give users immediate feedback, but are not a security boundary: an engine must revalidate files before processing. Selection stays in the browser; this component does not upload or process files, create previews, or retain file contents. It stores display metadata and can send selected `File` references through its optional `onSelectionChange` callback. Because callbacks are not serializable across the Server/Client Component boundary, connect that callback from a Client Component controller.
- The Word & Character Counter uses `ToolTextarea`, `ToolWorkspace`, `ToolHelpSection`, and `ToolPrivacyNote`. Its pure `src/lib/text-counts.ts` utility calculates words, grapheme-cluster characters, non-whitespace characters, sentences, paragraphs, and estimated reading time in the browser. Text remains in the component's in-memory state; it is not uploaded, logged, sent to Analytics, or saved to browser storage. Its copy action only writes text to the clipboard after an explicit button press. Other text tools can reuse `CharacterCount`, `ToolResultPanel`, and `CopyAction` when appropriate.
- Calculator tools use numeric/date `ToolInput` fields, `ToolSelect` for units, validation text, and `ToolResultPanel`. The UI does not calculate values. Add calculation logic as separate pure TypeScript functions where practical, then connect it to client-side form state.

`ToolStatus` accepts one of `idle`, `ready`, `processing`, `success`, or `error` and a user-facing message. It announces ordinary updates politely and errors assertively. Processing is indeterminate unless a caller provides a measured progress value and label; never supply guessed progress or expose internal exceptions. Keep state updates in the tool's Client Component, while the shell, instructions, privacy statement, and stable content remain server-rendered.

Static route rule: do not create pages for coming-soon definitions. When real tool routes are ready, choose a route such as `/tools/[slug]/`, implement `generateStaticParams()` from only definitions that are available and have a real `href`, and build one HTML page per returned slug. A static export cannot serve a newly added slug at runtime; add the route and parameter at build time. Keep per-tool metadata based on the same configuration. Do not turn on runtime slug resolution, Server Actions, or request-dependent APIs.

Stage 02C's temporary `src/app/ui-preview/page.tsx` fixture was used only for local visual and interaction checks and was removed before the production build and commit. It was not a public route or tool implementation.

## Outstanding dependency security findings

At Stage 02A verification (2026-10-12), `npm audit` reports five high-severity paths caused by one development dependency chain:

`eslint-config-next@16.4.0 → @next/eslint-plugin-next@16.4.0 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`.

The underlying report concerns stack exhaustion on attacker-controlled deeply nested brace patterns (CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm). npm proposes downgrading `eslint-config-next` to 14.2.35 as its available fix; that would be a breaking major downgrade and has not been applied. The registry’s latest `braces` remains 3.0.3 and the advisory lists no patched release, so an override cannot resolve it safely today. This is a build/lint toolchain dependency, not a client-bundled runtime package: `npm audit --omit=dev` reports zero issues. It still matters to trusted CI and build environments, so monitor the upstream advisory and package chain; do not feed untrusted patterns to build tooling.

Reference: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
