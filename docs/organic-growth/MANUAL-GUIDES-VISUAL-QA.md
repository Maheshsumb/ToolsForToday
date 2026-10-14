# Manual Guides Visual QA Checklist

Use this checklist after opening the local or deployed site in a browser. Record actual results and attach screenshots; do not infer that a check passed from static HTML tests.

## Viewports

- [ ] Mobile: 320 × 800
- [ ] Mobile: 390 × 844
- [ ] Tablet: 768 × 1024
- [ ] Desktop: 1440 × 900

At each size, check for horizontal scrolling, clipped text, unreadable article measure, overlapping navigation, cards with uneven or broken content, and visible keyboard focus. Capture the viewport and note browser/device scaling.

## Pages

- [ ] Homepage (`/`): Guides link in desktop navigation and footer; mobile menu opens, shows Guides, closes after navigation, and closes with Escape.
- [ ] Guides hub (`/guides/`): five cards, accurate category/tool labels, readable summaries, each Read guide and related-tool link works.
- [ ] Image compression (`/guides/how-to-compress-images-in-your-browser/`) and Image Compressor (`/tools/image-compressor/`).
- [ ] PDF merging (`/guides/how-to-merge-pdf-files/`) and Merge PDF (`/tools/merge-pdf/`).
- [ ] Images to PDF (`/guides/how-to-turn-images-into-pdf/`) and Images to PDF (`/tools/images-to-pdf/`).
- [ ] Image resizing/cropping (`/guides/how-to-resize-and-crop-images/`) and Image Resizer & Cropper (`/tools/image-resizer-cropper/`).
- [ ] Percentage change (`/guides/how-to-calculate-percentage-change/`) and Percentage Calculator (`/tools/percentage-calculator/`).

For each guide, inspect the breadcrumb, title, heading order, steps, worked example, limitations, related links, and tool call to action. Follow the tool CTA and guide backlink. Use keyboard-only navigation and confirm focus is visible and links are reachable in a sensible order.

## Browser diagnostics

- [ ] Record browser and version.
- [ ] Check DevTools Console for application errors and warnings on each page.
- [ ] Check Network for failed same-origin page, script, font, stylesheet, and image requests.
- [ ] Record any extension-generated messages separately from application errors.
- [ ] If running Lighthouse, record its version, URL, viewport/device mode, category scores, and date. Do not mix lab scores with field data.

## Evidence log

| Date/time and timezone | Page and viewport | Result / issue | Screenshot filename | Console/network notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

\n