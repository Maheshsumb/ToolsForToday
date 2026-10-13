# Contributing to ToolsForToday

Thank you for helping make everyday browser tools more useful, accessible, reliable, and privacy-conscious. You can contribute code, tests, documentation, accessibility feedback, bug reports, and ideas for tools that solve real problems.

Before you start, read the [Code of Conduct](CODE_OF_CONDUCT.md). Contributions submitted for inclusion are handled under the [Apache License 2.0](LICENSE), subject to its terms. The source license does not grant rights to the ToolsForToday name, logo, favicon, or other brand assets. Third-party software and assets retain their own terms; see [NOTICE](NOTICE) and the [third-party notices](docs/third-party/THIRD_PARTY_NOTICES.md).

## Choose a contribution path

- Found a reproducible problem? Use the [bug report form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=bug_report.yml).
- Want to improve an existing feature? Use the [feature request form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=feature_request.yml).
- Have an idea for a new tool? Use the [new tool proposal form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml).
- Want to change code or documentation? Search existing issues and pull requests, then open an issue for discussion when scope or product behavior is not clear.
- Found a security vulnerability? Follow [SECURITY.md](SECURITY.md) and do not report it in a public issue.

Proposals and pull requests are reviewed by the maintainer. Opening one does not guarantee that a feature will be built or that a change will be accepted or merged.

## Propose a tool

Before implementation, describe:

1. The real user problem and who would benefit.
2. Why the tool belongs in the current catalogue and how it differs from existing tools.
3. Inputs, outputs, formats, browser support, and expected limitations.
4. Whether the work can run in the browser and what dependencies it needs.
5. Privacy, accessibility, file-size, memory, and performance considerations.
6. A practical test plan.

Prefer a focused tool with clear everyday value. Do not propose features whose only purpose is keyword targeting or artificial search traffic. A feature must not require a secret in frontend code or send sensitive user content to an external service without a separately reviewed product and privacy change.

## Set up the project

The project uses Node.js 22.x (`.nvmrc` pins 22.18.0), npm 10 or later, and Git.

```bash
git clone https://github.com/<your-github-name>/ToolsForToday.git
cd ToolsForToday
npm ci
npm run dev
```

Open <http://localhost:3000>. Stop the development server with `Ctrl+C`.

Create a focused branch in your fork:

```bash
git switch -c feat/short-description
```

Outside contributors should work from a fork and should not push directly to the production branch. Keep changes focused and leave generated `out/` files out of commits.

## Build or change a tool

Follow existing route, catalogue, metadata, shared UI, and processing patterns. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making structural changes. In particular:

- Prefer browser-side processing and avoid unnecessary network services.
- Validate input and handle invalid or resource-heavy files clearly.
- Do not transmit uploaded content, user-entered values, or sensitive data without a separately reviewed product and privacy change.
- Preserve the fixed Analytics page allowlist and consent behavior.
- Keep controls keyboard-accessible and consider focus states and screen readers.
- Test responsive layouts, especially where controls or results might overflow on mobile.
- Keep third-party dependencies focused and preserve applicable license and attribution notices.
- Keep new routes compatible with the static export and verify they exist after `npm run build`.
- Do not put credentials or secrets in source code, tests, issues, screenshots, or logs.

## Test and validate

Run lint and typecheck:

```bash
npm run lint
npm run typecheck
```

Run the relevant test script(s), then run the full suite before submitting a pull request. The available scripts are listed in [README.md](README.md#validate-a-change). Finish with a static production build:

```bash
npm run build
```

The build writes the static site to `out/`. If a check fails, include the exact command and concise failure details rather than reporting it as passed. Consider keyboard use, visible focus, accessibility, mobile behavior, and unexpected network requests for any affected user flow.

## Open a pull request

1. Search existing issues and pull requests for related work.
2. Keep the change focused and explain the problem it solves.
3. Add or update tests for behavior changes and documentation where needed.
4. Run validation and note exactly which checks passed or could not be performed.
5. Open a pull request using the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).
6. Respond to maintainer review feedback and make any requested follow-up changes.

Pull requests should pass the repository's validation workflow, preserve static-export compatibility, avoid unrelated changes and unnecessary dependencies, and avoid leaking user content. The maintainer reviews contributions before merging; no change is automatically accepted.

## Report bugs and security concerns

For ordinary bugs, use the [bug report form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=bug_report.yml). Include a route, reproducible steps, expected and actual behavior, and browser/device details when useful. Use synthetic examples and remove credentials, personal information, private files, and sensitive tool inputs from reports and screenshots.

For vulnerabilities, follow the private reporting instructions in [SECURITY.md](SECURITY.md), not a public issue. The reporting contact is listed there; the owner should confirm that the mailbox is monitored.

## Possible first contributions

These are discussion topics, not confirmed defects or pre-approved tasks:

- Add repeatable keyboard and screen-reader checks for tool workflows.
- Document a browser/device compatibility test matrix for image and PDF processing.
- Add focused component-level interaction tests alongside the existing utility tests.
- Review tool instructions and error messages for clarity with representative users.
- Profile large-image and multi-page-PDF operations on mid-range mobile devices.
- Expand localization readiness based on actual user needs.

Check [open issues](https://github.com/Maheshsumb/ToolsForToday/issues) before starting. If no suitable issue exists, open a proposal or discussion first. The project does not label any issue as “good first issue” unless a maintainer has created and confirmed it.
