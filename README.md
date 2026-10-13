# ToolsForToday

![ToolsForToday logo](public/brand/toolsfortoday-logo.webp)

**Everyday Tools. One Simple Place.**

ToolsForToday brings together 12 free browser-based tools for useful everyday tasks—from text and calculations to images and PDFs. The project is open source and welcomes thoughtful contributions that make the tools clearer, more accessible, and more useful.

**[Explore ToolsForToday](https://toolsfortoday.online/)** · **[Browse all tools](https://toolsfortoday.online/#tools)** · **[Contribute](CONTRIBUTING.md)** · **[Propose a tool](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml)**

| Project | Link |
| --- | --- |
| Website | [toolsfortoday.online](https://toolsfortoday.online/) |
| All tools | [Browse the catalogue](https://toolsfortoday.online/#tools) |
| Getting started | [Local setup](#getting-started) |
| Contribution guide | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Propose a tool | [New tool proposal](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml) |
| Report a bug | [Bug report](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=bug_report.yml) |
| Request an improvement | [Feature request](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=feature_request.yml) |
| Security | [SECURITY.md](SECURITY.md) |
| License | [Apache-2.0](LICENSE) |

## Why ToolsForToday?

Everyday tasks should not require a complicated workflow. ToolsForToday aims to make practical tools easy to find and understand, work well across screen sizes, and respect the privacy of the people using them. The project is being developed as an open-source collection of useful browser-based tools. We welcome developers who want to solve real problems, improve existing tools, and suggest thoughtful new ideas.

Contributions are reviewed by the maintainer. A proposal or pull request is not a commitment to build, accept, or merge a change.

## The tools

### Utilities

| Tool | What it does | Try it |
| --- | --- | --- |
| Word & Character Counter | Counts words, characters, sentences, paragraphs, and estimated reading time. | [Open tool](https://toolsfortoday.online/tools/word-character-counter/) |
| Percentage Calculator | Calculates percentages, percentage changes, and percentage increases or decreases. | [Open tool](https://toolsfortoday.online/tools/percentage-calculator/) |
| Unit Converter | Converts length, mass, temperature, area, volume, and time. | [Open tool](https://toolsfortoday.online/tools/unit-converter/) |
| Date Difference & Age Calculator | Calculates date differences, age, and time until a date. | [Open tool](https://toolsfortoday.online/tools/date-difference-age-calculator/) |
| QR Code Generator | Creates downloadable QR codes for text and links. | [Open tool](https://toolsfortoday.online/tools/qr-code-generator/) |

### Image tools

| Tool | What it does | Try it |
| --- | --- | --- |
| Image Compressor | Compresses supported images and lets you download the result. | [Open tool](https://toolsfortoday.online/tools/image-compressor/) |
| Image Resizer & Cropper | Resizes and crops supported images to chosen dimensions. | [Open tool](https://toolsfortoday.online/tools/image-resizer-cropper/) |
| JPG, PNG & WebP Image Converter | Converts between supported image formats. | [Open tool](https://toolsfortoday.online/tools/image-converter/) |

### PDF tools

| Tool | What it does | Try it |
| --- | --- | --- |
| Merge PDF | Combines selected PDF files into one document. | [Open tool](https://toolsfortoday.online/tools/merge-pdf/) |
| Split PDF | Extracts selected pages or separates a PDF into files. | [Open tool](https://toolsfortoday.online/tools/split-pdf/) |
| Images to PDF | Combines supported images into a PDF. | [Open tool](https://toolsfortoday.online/tools/images-to-pdf/) |
| PDF to JPG | Renders selected PDF pages as downloadable JPG images. | [Open tool](https://toolsfortoday.online/tools/pdf-to-jpg/) |

## Contribute to ToolsForToday

Have an idea for a tool that would make someone's day easier? Found a bug? Want to make an existing tool faster, more accessible, or easier to use? We would love to hear from you.

You can help by suggesting useful tools, improving current ones, fixing bugs, testing accessibility, improving mobile behavior or performance, writing tests, clarifying documentation, and reviewing code. Start with the [contribution guide](CONTRIBUTING.md), then choose the right path:

- [Propose a new tool](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml)
- [Report a bug](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=bug_report.yml)
- [Request an improvement](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=feature_request.yml)
- [Review the pull request template](.github/PULL_REQUEST_TEMPLATE.md)
- [Read the Code of Conduct](CODE_OF_CONDUCT.md)
- [Report a security concern privately](SECURITY.md)

### A first contribution

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
2. Search existing issues and pull requests for related work.
3. Open or join an issue; discuss larger changes before coding.
4. Fork the repository and create a focused feature branch.
5. Make a small, clear change and add or update tests where behavior changes.
6. Run lint, typecheck, relevant tests, and the production build.
7. Open a pull request with a concise explanation and the checks you ran.
8. Respond to maintainer feedback. Changes are reviewed before merging.

For example, after forking the repository:

```bash
git clone https://github.com/<your-github-name>/ToolsForToday.git
cd ToolsForToday
git switch -c feat/describe-your-change
```

The maintainer reviews contributions before they are merged. Contributors should not push directly to the production branch.

## Build a new tool

Start with a [new tool proposal](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml). Describe the user problem, intended inputs and outputs, browser support, privacy implications, limitations, and a practical test plan. The maintainer can then discuss feasibility and overlap before implementation begins.

When a proposal is ready to build:

1. Agree on a focused scope with the maintainer.
2. Follow the existing route, shared UI, catalogue, and metadata patterns.
3. Prefer browser-side processing and avoid unnecessary external services.
4. Validate inputs and define reasonable resource limits.
5. Keep the interface accessible, mobile-friendly, and clear about errors and limitations.
6. Do not transmit uploaded files or sensitive tool inputs without a separately reviewed product and privacy change.
7. Add tests for actual behavior and update help content and documentation.
8. Preserve the fixed Analytics route allowlist and consent policy.
9. Confirm the route works with the static export before opening a pull request.

Do not put secrets in frontend code. Keep dependencies focused, and retain third-party license notices for bundled libraries and assets.

## Technology and design

- **Application:** Next.js 16 App Router, React 19, and TypeScript.
- **Styles:** Tailwind CSS v4 and the project's shared brand tokens.
- **Hosting model:** Next.js static export, deployed as static files on Cloudflare Pages.
- **Browser processing:** Tool interactions and file operations are implemented in the browser; the application does not use a Next.js runtime server for tool processing.
- **PDF and image support:** `@cantoo/pdf-lib`, `pdfjs-dist`, `fflate`, and browser image APIs support the current PDF/image workflows. `qrcode` generates QR codes.
- **Typography:** Inter and Poppins assets are bundled locally through Fontsource.
- **Tests:** Focused Node test suites cover calculation, conversion, image/PDF utility behavior, Analytics route preparation, and static SEO output.

Analytics is consent-gated. After acceptance, the site sends its own page views for fixed, allowlisted paths and titles; query strings and tool inputs are not added to those page-view payloads by the application. See the [Privacy Policy](https://toolsfortoday.online/privacy-policy/) for the current disclosures. Do not infer from this implementation description that every third-party request is controlled by the GA consent choice.

## Getting started

### Requirements

- Node.js **22.x**; the repository pins **22.18.0** in `.nvmrc`.
- npm **10 or later**.
- Git.

### Install and run

```bash
git clone https://github.com/Maheshsumb/ToolsForToday.git
cd ToolsForToday
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Stop the development server with `Ctrl+C`.

### Validate a change

```bash
npm run lint
npm run typecheck
```

Run the automated test suites:

```bash
npm run test:percentage-calculator
npm run test:date-calculator
npm run test:unit-converter
npm run test:qr-code
npm run test:image-compressor
npm run test:image-resizer
npm run test:image-converter
npm run test:merge-pdf
npm run test:split-pdf
npm run test:images-to-pdf
npm run test:pdf-to-jpg
npm run test:analytics
npm run test:text-counter
npm run test:seo
```

Build and export the production site:

```bash
npm run build
```

The static export is written to `out/`. The project does not use `next start` for production hosting. If you change dependencies, update `package-lock.json` and use `npm ci` to validate a clean install.

## Project structure

```text
src/
  app/                 Static routes, root layout, metadata, and styles
  components/          Shared layout, catalogue, analytics, and tool UI
  config/tools.ts      Typed source for the 12-tool catalogue
  lib/                 Reusable browser-side calculations and processing
  types/               Shared TypeScript types
tests/                 Static SEO output checks
public/                Static brand, vendor, and downloadable assets
.github/               Issue forms, pull request template, and CI workflow
docs/                  Architecture, brand, deployment, and notices
```

Route pages compose shared components. `src/config/tools.ts` supplies the homepage catalogue, route identifiers, descriptions, categories, and availability. Pure or reusable processing logic lives in `src/lib/`; tool pages and controllers connect that logic to browser UI. Unit and utility tests sit alongside the relevant `src/lib` modules, while the static SEO test is in `tests/`.

The `out/` directory is generated by the build and should not be committed. The static export requires routes to exist at build time; runtime APIs, request-dependent pages, and server-side file processing do not fit the current hosting architecture. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making structural changes.

## Roadmap & ideas

The twelve tools listed above are the current catalogue. Future ideas are proposals, not committed roadmap items. Potential areas for discussion include accessibility checks, browser/device testing, mobile workflows, performance, localization based on user needs, documentation, and genuinely useful new tools.

Check [open issues](https://github.com/Maheshsumb/ToolsForToday/issues) before starting work. If there is no suitable issue, open a proposal and explain the problem first. No “good first issue” is advertised here unless maintainers have created and confirmed one.

## Quality, privacy, and security

Pull requests should solve a defined problem, stay reasonably scoped, include relevant tests, preserve static-export compatibility, and consider accessibility and mobile use. Do not include private data, credentials, or real user content in issues, tests, logs, analytics, or screenshots. Security vulnerabilities should be reported using the private contact instructions in [SECURITY.md](SECURITY.md), not in a public issue.

The repository includes a GitHub Actions workflow for lint, typecheck, tests, and a static build on pushes to `main` and pull requests targeting `main`. Review the workflow and its current GitHub status before relying on it; the README does not claim that a particular run has passed or that branch protection requires it.

## License and attribution

The project source is provided under the [Apache License, Version 2.0](LICENSE). It includes an express patent license subject to the license terms. The source-code license does not grant permission to use the ToolsForToday name, logo, favicon, or other brand assets. Third-party software, fonts, workers, and assets retain their own terms; see [NOTICE](NOTICE) and the [third-party notices](docs/third-party/THIRD_PARTY_NOTICES.md).

## Project links

- [Live website](https://toolsfortoday.online/)
- [All open issues](https://github.com/Maheshsumb/ToolsForToday/issues)
- [Contribution guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Apache-2.0 License](LICENSE)
- [Architecture](docs/ARCHITECTURE.md)
- [Brand guide](docs/BRAND.md)
- [Third-party notices](docs/third-party/THIRD_PARTY_NOTICES.md)
