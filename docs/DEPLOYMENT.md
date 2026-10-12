# Deployment

## Current launch state

- Git repository root: this directory (`toolsfortoday`); the parent `ToolsForToday` folder is not part of the Git repository.
- Production branch: `main`.
- GitHub repository: [Maheshsumb/ToolsForToday](https://github.com/Maheshsumb/ToolsForToday) (SSH remote: `git@github.com:Maheshsumb/ToolsForToday.git`).
- Pushed branch and deployment commit: `main` at `16675174a6161bf7084b38e7b30d7ef32658f0e2` (`docs: record initial GitHub push`).
- Cloudflare Pages project: `toolsfortoday`, connected to `Maheshsumb/ToolsForToday`.
- Production URL: <https://toolsfortoday.pages.dev/>.
- First production deployment: successful on 2026-10-12. Cloudflare installed Node.js `22.18.0`, ran `npm clean-install --progress=false` and `npx next build`, exported `/` and `/_not-found` as static content, then uploaded the site to Cloudflare's global network.
- Live browser verification: homepage served over HTTPS with the expected `noindex, follow` metadata and logo assets; the catalogue showed 12 Coming Soon tools; searching `PDF` and selecting PDF Tools each showed the four PDF tools; an unknown path displayed the custom Page not found screen. The first request immediately after Cloudflare reported success returned a transient 522; the site served normally on retry after propagation.
- Custom domain: `toolsfortoday.online` is intentionally not configured. Do not change DNS or nameservers as part of the first deployment.
- All 12 catalogue entries remain `Coming Soon`; no tool routes or processing engines are live.

## Cloudflare Pages settings

Use the Cloudflare Pages Free plan with the following project settings:

| Setting | Value |
| --- | --- |
| Project name | `toolsfortoday` |
| Framework preset | Next.js (Static HTML Export) |
| Root directory | `/` (repository root) |
| Production branch | `main` |
| Build command | `npx next build` |
| Build output directory | `out` |
| Node.js | `22.18.0` |

The committed `.nvmrc` pins `22.18.0`; configure Cloudflare's `NODE_VERSION` build environment variable to the same value if the Pages build environment does not select it automatically. Keep `package-lock.json` committed and use `npm ci` for reproducible dependency installation. The app is a static export: it does not require Workers, Pages Functions, a Next.js server, databases, or paid APIs.

## Temporary indexing policy

The root layout currently emits `noindex,follow` through Next.js `Metadata` in `src/app/layout.tsx`. This prevents search indexing while the catalogue is still Coming Soon, while still allowing crawlers to follow links and read the directive. No `robots.txt` rule blocks these pages.

Remove the `robots` property from the root metadata only after the first tool is functional and its page has useful, accurate content. Then rebuild and deploy; verify the rendered metadata no longer includes `noindex`. Keep the Coming Soon labels accurate for tools that remain unfinished.

## GitHub and automatic deployments

The GitHub remote is configured as `origin` at `git@github.com:Maheshsumb/ToolsForToday.git`; `main` is pushed and Cloudflare builds from that branch. Never put a password, personal access token, or other credential in a file or chat; use GitHub's supported browser/device login or credential manager.

After Cloudflare Pages is connected to that repository, new commits pushed to `main` should trigger production builds automatically. Pull request branches can be used for Pages preview deployments. Review the build log and preview URL before merging changes intended for production.

## Troubleshooting

- **`npm ci` fails:** confirm `package-lock.json` is present and committed, use Node.js `22.18.0` and npm 10+, then check that the lockfile and `package.json` were changed together.
- **Build fails in Pages:** compare the Pages root directory, Node version, build command, and output directory with the settings above; use the actual Cloudflare log to diagnose missing modules or type errors.
- **Pages cannot find output:** ensure the command is `npx next build`, `output: "export"` remains in `next.config.ts`, and output is `out` relative to the Git repository root.
- **Fonts or logos are missing:** confirm `public/brand/` and the lockfile are committed and check that asset paths are root-relative.
- **A Coming Soon card opens a dead route:** restore its `availability: "coming-soon"` status or implement and build the route before marking it available.
- **Noindex is missing:** inspect the deployed page's HTML `<head>` for `<meta name="robots" content="noindex, follow">`; root metadata should apply to the homepage and current 404 page.

## Outstanding items

- Recheck the development-tool dependency audit finding documented in `docs/ARCHITECTURE.md` when upstream releases are available.
- Keep the custom domain `toolsfortoday.online` disconnected until separately approved; do not change DNS or nameservers.
