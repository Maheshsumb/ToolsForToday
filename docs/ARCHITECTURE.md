# Architecture

## Static application

Next.js App Router exports HTML, CSS, JavaScript, and local assets to `out/`. Cloudflare Pages Free is the intended host. Static export avoids server operations and supports free access without accounts, a database, or paid APIs. No deployment is configured in Stage 01.

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

## Outstanding dependency security findings

At Stage 02A verification (2026-10-12), `npm audit` reports five high-severity paths caused by one development dependency chain:

`eslint-config-next@16.4.0 → @next/eslint-plugin-next@16.4.0 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`.

The underlying report concerns stack exhaustion on attacker-controlled deeply nested brace patterns (CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm). npm proposes downgrading `eslint-config-next` to 14.2.35 as its available fix; that would be a breaking major downgrade and has not been applied. The registry’s latest `braces` remains 3.0.3 and the advisory lists no patched release, so an override cannot resolve it safely today. This is a build/lint toolchain dependency, not a client-bundled runtime package: `npm audit --omit=dev` reports zero issues. It still matters to trusted CI and build environments, so monitor the upstream advisory and package chain; do not feed untrusted patterns to build tooling.

Reference: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
