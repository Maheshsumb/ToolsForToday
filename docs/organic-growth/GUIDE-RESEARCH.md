# Guide Research and Accuracy Record

Prepared October 14, 2026 for Stage 06A. This is qualitative search-intent research, not keyword-volume, ranking, or traffic-potential research.

## Source of truth for product claims

Guide instructions were checked against the current local implementation before writing:

- Image Compressor: `src/components/tools/image-compressor.tsx`, `src/lib/image-compression.ts`, and `src/app/tools/image-compressor/page.tsx`.
- Merge PDF: `src/components/tools/merge-pdf.tsx`, `src/lib/pdf-merging.ts`, and `src/app/tools/merge-pdf/page.tsx`.
- Images to PDF: `src/components/tools/images-to-pdf.tsx`, `src/lib/images-to-pdf.ts`, and `src/app/tools/images-to-pdf/page.tsx`.
- Image Resizer & Cropper: `src/components/tools/image-resizer-cropper.tsx`, `src/lib/image-resizing.ts`, and its route page.
- Percentage Calculator: `src/components/tools/percentage-calculator.tsx`, `src/lib/percentage-calculations.ts`, and its route page.

The guides intentionally avoid promises about compression rates, preservation of advanced PDF features, output quality, rankings, and traffic.

## Guide intent and reason to publish

| Guide | User problem / common questions | Product details checked |
| --- | --- | --- |
| Compress images in a browser | Reduce a large photo for sharing or a file-size limit; understand quality versus size; ask why a PNG may not shrink or why dimensions did not change. | One JPEG/PNG/WebP; 25 MB and 25-million-pixel limits; dimensions retained; JPEG/WebP quality setting; PNG has no quality slider; output measured and may be larger; metadata may be removed. |
| Merge PDF files in order | Join a packet; control document sequence; verify page count; understand why advanced PDF features or a large file may fail. | Up to 20 PDFs, 25 MB each, 100 MB combined, 300 pages; whole-file up/down ordering; internal page order unchanged; browser-side processing; advanced features not guaranteed. |
| Turn images into PDF | Combine photos/scans; choose A4 or Letter; fit mixed portrait/landscape pages; know which image types and batch sizes work. | JPG/JPEG, PNG, WebP; up to 20 images; 25 MB and 25 MP each; 40 MP combined; PDF output limit 100 MB; A4/US Letter/Auto, auto/portrait/landscape, none/small/medium margins; one image per page. |
| Resize and crop images | Fit an avatar, banner, or upload slot without stretching; understand crop ratio, pixel dimensions, upscaling, transparency, and format trade-offs. | Free, 1:1, 4:3, 3:4, 16:9, 9:16 crop ratios; 8,000 pixels per side / 25 MP output; JPEG/PNG/WebP; ratio lock; upscaling cannot recreate detail. |
| Percentage increase/decrease | Compare before and after values; understand the sign; distinguish relative percent change from percentage-point differences; ask why zero has no percentage change. | Four calculator modes; change uses `(new - original) / |original| × 100`; zero original is undefined; increase/decrease formula; ordinary JavaScript floating-point precision. |

These intents were reviewed qualitatively using searches such as “how to compress images in browser reduce file size,” “how to merge PDF files in correct order,” and “how to convert JPG PNG WebP images to PDF choose A4 Letter.” Search results and product/help pages repeatedly surface practical questions about file order, output review, supported formats, paper size, quality, and limits. That observation is not a claim about demand volume or ranking opportunity.

## Research references

- [Google Search Central: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Search Central: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google Search Central: General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Adobe: rearrange pages in a combined PDF](https://helpx.adobe.com/acrobat/desktop/edit-documents/combine-files/rearrange-combined-files.html) — confirms the importance of checking sequence after combining; ToolsForToday controls whole source files.
- [Brunel University: merge PDF instructions](https://students.brunel.ac.uk/documents/Examinations/How-to-merge-multiple-pdf-files-into-one-single-pdf-and-reduce-file-size-for-uploading-into-your-exam.pdf) — example of a real submission workflow.

No third-party screenshots or copied article text were used. The public guides should be checked again whenever the corresponding tool controls or limits change.
