# ToolsForToday

Everyday Tools. One Simple Place.

Stage 01 foundation for a global website offering 12 free browser-based everyday tools at launch. The current application is only a setup-confirmation page; tools and the final homepage are not implemented.

## Requirements

- Node.js 22 LTS (validated with 22.18.0; see .nvmrc). Use a maintained security patch in this LTS line for future builds.
- npm 10 or later (validated with 10.9.3).
- Git.

## Local setup

From PowerShell:

```powershell
cd C:\Users\mahes\OneDrive\Desktop\ToolsForToday\toolsfortoday
npm ci
npm run dev
```

Open http://localhost:3000. Stop the server with Ctrl+C.

## Commands

```powershell
npm run lint
npm run typecheck
npm run build
```

Lint uses the ESLint CLI. Typecheck generates Next.js route types before checking strict TypeScript, so it also works on a fresh checkout. Build produces out/index.html and static assets in out/. Generated output, dependencies, environment files, and TypeScript caches are ignored by Git. Commit package-lock.json with dependency changes and use npm ci for reproducible installation.

There is no next start command because this application is exported as static files. Production requires only a static file host, not a Next.js server.

## Hosting target

Cloudflare Pages Free, with npm run build as the eventual build command and out as the output directory relative to this repository root. The intended domain is https://toolsfortoday.online. No remote repository, deployment, Cloudflare connection, or DNS changes are part of Stage 01.

## Project guides

- [Architecture](docs/ARCHITECTURE.md): static constraints and browser processing strategy.
- [Brand](docs/BRAND.md): colours, typography, and approved-logo policy.
- [Project plan](docs/PROJECT_PLAN.md): all nine milestones.
- [Agent instructions](AGENTS.md): permanent task boundaries and validation requirements.

Fonts are bundled with the app using Fontsource, without runtime font-service requests. Approved logos should be supplied in public/brand/. Existing parent-folder brand images are preserved. No accounts, database, paid APIs, analytics, or advertising scripts have been added.

## Recorded Stage 01 versions

Validated on 2026-10-12 using Node.js 22.18.0 and npm 10.9.3:

| Package | Installed version |
| --- | --- |
| Next.js / eslint-config-next | 16.4.0 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS / Tailwind Turbopack loader | 4.3.3 |
| ESLint | 9.39.5 |
| Fontsource Inter / Poppins | 5.3.0 |

The lockfile records exact transitive versions. Next.js, React, and Tailwind versions were checked against npm stable tags. Node 22 is a supported maintenance LTS line: https://github.com/nodejs/Release.

## Stage 01 validation and known limitations

- npm run lint: passed.
- npm run typecheck: passed with strict mode.
- npm run build: passed without build warnings; out/index.html and local WOFF/WOFF2 assets exist.
- Development browser check: HTTP 200, expected title and content, desktop and 375px mobile layouts checked; no horizontal overflow at 375px or console errors/warnings observed on the home page.
- Custom missing-page route: HTTP 404 and expected recovery link verified.
- npm audit --omit=dev: zero vulnerabilities.
- Full npm audit: five high-severity findings in one development-only chain (eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces). The reported advisory is GHSA-vfj7-8cjw-p6xm. npm proposes downgrading eslint-config-next to 14.2.35; this incompatible fix was not applied. Recheck upstream updates before production release.
- ESLint 9.39.5 emits a support/deprecation warning. ESLint 10.12.0 was evaluated, but the current React/import/accessibility plugins required by eslint-config-next do not declare support for ESLint 10. The final setup uses compatible ESLint 9 without forced peer overrides. Upgrade when the full lint stack supports it.
- No exhaustive accessibility, cross-browser, or tool-functionality testing is claimed; these belong to future stages. The setup is validated, with the tooling limitations above still open.
