# Deployment

## Current launch state

- Git repository root: this directory (`toolsfortoday`); the parent `ToolsForToday` folder is not part of the Git repository.
- Production branch: `main`.
- GitHub remote: not configured yet. No GitHub repository URL or pushed commit exists yet.
- Cloudflare Pages project: not created or connected yet.
- `pages.dev` URL: not assigned yet.
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

No GitHub remote is configured. Create a **private** repository named `toolsfortoday` under the intended GitHub account or organization, without initializing it with a README, license, or `.gitignore`; then add it as `origin` to this existing repository so its commit history is preserved. Confirm the destination before the first push. Never put a password, personal access token, or other credential in a file or chat; use GitHub's supported browser/device login or credential manager.

After Cloudflare Pages is connected to that repository, new commits pushed to `main` should trigger production builds automatically. Pull request branches can be used for Pages preview deployments. Review the build log and preview URL before merging changes intended for production.

## Troubleshooting

- **`npm ci` fails:** confirm `package-lock.json` is present and committed, use Node.js `22.18.0` and npm 10+, then check that the lockfile and `package.json` were changed together.
- **Build fails in Pages:** compare the Pages root directory, Node version, build command, and output directory with the settings above; use the actual Cloudflare log to diagnose missing modules or type errors.
- **Pages cannot find output:** ensure the command is `npx next build`, `output: "export"` remains in `next.config.ts`, and output is `out` relative to the Git repository root.
- **Fonts or logos are missing:** confirm `public/brand/` and the lockfile are committed and check that asset paths are root-relative.
- **A Coming Soon card opens a dead route:** restore its `availability: "coming-soon"` status or implement and build the route before marking it available.
- **Noindex is missing:** inspect the deployed page's HTML `<head>` for `<meta name="robots" content="noindex, follow">`; root metadata should apply to the homepage and current 404 page.

## Outstanding items

- Create the private GitHub repository and verify its owner/name before confirming the first push.
- Configure the Cloudflare Pages project using the settings above, then record its actual project URL and successful deployment commit here.
- Verify the assigned `pages.dev` deployment in a browser before reporting the launch complete.
- Recheck the development-tool dependency audit finding documented in `docs/ARCHITECTURE.md` when upstream releases are available.
- Connect the custom domain only after a separate user approval; this task must stop after the first successful `pages.dev` deployment.
