# ToolsForToday

**Everyday Tools. One Simple Place.**

![ToolsForToday logo](public/brand/toolsfortoday-logo.webp)

ToolsForToday is a collection of 12 free browser-based tools for everyday text, calculations, dates, images, and PDFs. The tools run in the visitor's browser; see the [Privacy Policy](https://toolsfortoday.online/privacy-policy/) for the current data-handling details.

**Website:** <https://toolsfortoday.online/>

## The tools

### Utilities

- [Word & Character Counter](https://toolsfortoday.online/tools/word-character-counter/)
- [Percentage Calculator](https://toolsfortoday.online/tools/percentage-calculator/)
- [Unit Converter](https://toolsfortoday.online/tools/unit-converter/)
- [Date Difference & Age Calculator](https://toolsfortoday.online/tools/date-difference-age-calculator/)
- [QR Code Generator](https://toolsfortoday.online/tools/qr-code-generator/)

### Image Tools

- [Image Compressor](https://toolsfortoday.online/tools/image-compressor/)
- [Image Resizer & Cropper](https://toolsfortoday.online/tools/image-resizer-cropper/)
- [JPG, PNG & WebP Image Converter](https://toolsfortoday.online/tools/image-converter/)

### PDF Tools

- [Merge PDF](https://toolsfortoday.online/tools/merge-pdf/)
- [Split PDF](https://toolsfortoday.online/tools/split-pdf/)
- [Images to PDF](https://toolsfortoday.online/tools/images-to-pdf/)
- [PDF to JPG Converter](https://toolsfortoday.online/tools/pdf-to-jpg/)

## Why we're building this

The goal is a community-driven collection of genuinely useful everyday tools that remains approachable, free, and privacy-conscious. We welcome ideas, bug reports, accessibility feedback, mobile improvements, performance work, tests, and documentation corrections.

## Open source and contributions

ToolsForToday is licensed under the [Apache License 2.0](LICENSE). The license applies to the project code; it does not grant permission to use the ToolsForToday name, logo, or other brand assets. Third-party components and bundled assets remain subject to their own licenses and notices.

Have an idea for a useful tool or found something we can improve? Open an issue, suggest a feature, fix a bug, or submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and expectations.

## Technology

- Next.js 16 App Router with static export
- React and TypeScript
- Tailwind CSS v4
- Cloudflare Pages hosting
- Browser APIs for client-side tool processing

The production app is statically exported to `out/`; it does not use a Next.js runtime server for tool processing.

## Local development

Requirements: Node.js `22.18.0` (see `.nvmrc`), npm 10 or later, and Git.

From the repository root:

```powershell
npm ci
npm run dev
```

Open <http://localhost:3000/>. Stop the server with Ctrl+C.

Run quality checks:

```powershell
npm run lint
npm run typecheck
npm run build
```

The build creates static files under `out/`. There is no `next start` script because production uses static hosting.

Run every automated test suite in PowerShell:

```powershell
$suites = @(
  'test:percentage-calculator', 'test:date-calculator', 'test:unit-converter',
  'test:qr-code', 'test:image-compressor', 'test:image-resizer',
  'test:image-converter', 'test:merge-pdf', 'test:split-pdf',
  'test:images-to-pdf', 'test:pdf-to-jpg', 'test:analytics',
  'test:text-counter', 'test:seo'
)
foreach ($suite in $suites) {
  npm run $suite
  if ($LASTEXITCODE -ne 0) { throw "Test suite failed: $suite" }
}
```

Use `npm ci` for reproducible installs and commit `package-lock.json` when dependencies change. Do not add server-side processing, secret keys to browser code, or unexpected external network calls.

## Contributing

The intended contribution areas and pull-request workflow are described in [CONTRIBUTING.md](CONTRIBUTING.md). The [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md) explain community and vulnerability reporting.

Issues are enabled for feature ideas and bug reports. Pull requests are welcome and reviewed by the maintainer before any changes are merged.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Brand guide](docs/BRAND.md)
- [Deployment notes](docs/DEPLOYMENT.md)
- [Privacy Policy](https://toolsfortoday.online/privacy-policy/)

## Third-party notices and branding

The application includes third-party libraries, a PDF.js worker and bundled fonts. See [third-party notices](docs/third-party/THIRD_PARTY_NOTICES.md) and preserve each component's terms. The ToolsForToday name, logo and other brand assets are not licensed for reuse by the source-code license; see [Brand guide](docs/BRAND.md).
