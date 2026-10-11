<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ToolsForToday repository instructions

- Only work on the stage explicitly assigned; stop after its completion.
- Preserve approved branding; never recreate or alter the logo.
- Use strict TypeScript and npm; commit package-lock.json with dependency changes.
- Prefer straightforward reusable components when reuse is needed.
- Keep all user file processing browser-side; do not upload files.
- Maintain Cloudflare Pages static-export compatibility.
- Do not add runtime APIs, SSR, Server Actions, databases, authentication, Workers, or Pages Functions for processing.
- Never add paid services without approval.
- Never expose credentials or secrets.
- Run relevant validation before completion: npm run lint, npm run typecheck, and npm run build.
- Never claim tests passed unless actually executed; disclose unverified checks.
- Never deploy or change DNS without explicit permission.
