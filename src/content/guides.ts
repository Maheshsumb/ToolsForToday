export type GuideCategory = "Image Tools" | "PDF Tools" | "Utilities";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  toolName: string;
  toolHref: `/tools/${string}/`;
  intro: string;
  steps: readonly { title: string; body: string }[];
  sections: readonly { heading: string; paragraphs: readonly string[]; bullets?: readonly string[] }[];
  example: { heading: string; body: string };
  mistakes: readonly string[];
  tips: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  related: readonly string[];
}

export const guides = [
  {
    slug: "how-to-compress-images-in-your-browser",
    title: "How to Compress Images in Your Browser",
    description: "Learn what image compression changes, how to compare the real output size, and how to optimize a JPEG, PNG, or WebP image in your browser.",
    category: "Image Tools",
    toolName: "Image Compressor",
    toolHref: "/tools/image-compressor/",
    intro: "A photo can be awkward to email, upload, or store when its file is larger than a service accepts. Image compression re-encodes the image data to try to use fewer bytes. It is different from resizing: compression changes the encoded file, while resizing changes its pixel dimensions. The ToolsForToday compressor keeps the decoded dimensions and reports the actual result, so you can decide whether the output is useful.",
    steps: [
      { title: "Choose one supported image", body: "Open the Image Compressor and select one non-animated JPEG, PNG, or WebP image. The current limits are 25 MB and 25 million decoded pixels. The image is processed in your browser." },
      { title: "Review the original", body: "Check the preview, format, dimensions, and starting file size. Keep a copy of the original if image detail or embedded metadata matters." },
      { title: "Set quality when available", body: "For JPEG and WebP, adjust the quality control. A lower encoder quality may reduce file size but may also make visual changes. PNG uses browser lossless canvas encoding and has no matching quality slider." },
      { title: "Optimize and compare", body: "Choose Optimize image. Compare the measured input and output byte sizes, dimensions, and preview. Download only if the result fits your needs; the output may be the same size or larger." },
    ],
    sections: [
      { heading: "Compression is not resizing", paragraphs: ["A 3000 × 2000 pixel image remains at those decoded dimensions in this tool. If a website or form needs a smaller width or height, use the Image Resizer & Cropper instead. Reducing pixel dimensions can reduce file size too, but it also changes how large the image can be displayed sharply."] },
      { heading: "JPEG, PNG, and WebP behave differently", paragraphs: ["JPEG is commonly used for photographs and its quality setting trades some encoded detail for file size. WebP can use lossy or lossless encoding, but this compressor applies a quality setting and keeps the original format. PNG encoding is lossless from the decoded pixels; the resulting PNG can still be larger if the browser encoder does not reproduce a more efficient representation.", "The quality number describes an encoder setting, not a promised percentage reduction. Compare the preview and measured byte sizes instead of assuming that a particular setting will save a fixed amount."] },
      { heading: "Know what re-encoding can change", paragraphs: ["The browser decodes the selected image and writes a new image from its pixels. That can change visible detail for lossy formats. Canvas re-encoding may also remove EXIF metadata such as camera or GPS information, color-profile details, and other metadata. Animated files are rejected; GIF, SVG, TIFF, and HEIC are not supported by this tool."] },
    ],
    example: { heading: "A practical comparison", body: "Suppose a JPEG is 2.4 MB and the selected setting creates a 1.6 MB output at the same decoded dimensions. That is a measured reduction for this image and browser run, not a guarantee for the next photograph. If the PNG output is 3.1 MB from a 2.8 MB source, keep the original or try a purpose-built format-conversion or resizing workflow if your requirements allow it." },
    mistakes: ["Expecting every image or PNG to become smaller.", "Treating the quality percentage as a file-size target.", "Using compression when the actual requirement is fewer pixels.", "Replacing the original without checking image detail or metadata needs."],
    tips: ["Compare at the display size where the image will be used.", "Keep originals when metadata or exact pixels matter.", "If a file-size cap is strict, verify the downloaded file itself before submitting it."],
    faqs: [
      { question: "Will image compression always reduce file size?", answer: "No. The tool measures the browser-produced output, which can be smaller, the same size, or larger than the selected file." },
      { question: "Does compression reduce image dimensions?", answer: "No. The Image Compressor keeps the decoded pixel dimensions. Use the Image Resizer & Cropper when you need different dimensions." },
      { question: "Are image files uploaded to ToolsForToday?", answer: "The compressor reads, decodes, and re-encodes the image in your browser. Its image data and filename are not uploaded to the site's application server." },
    ],
    related: ["how-to-resize-and-crop-images", "how-to-turn-images-into-pdf"],
  },
  {
    slug: "how-to-merge-pdf-files",
    title: "How to Merge PDF Files in the Correct Order",
    description: "Combine PDF documents into one file, set the document order before merging, and check the resulting page count and download.",
    category: "PDF Tools",
    toolName: "Merge PDF",
    toolHref: "/tools/merge-pdf/",
    intro: "Merging PDFs is useful when a report, application, class handout, or scanned packet is split across several documents. The order matters because the tool joins each complete source PDF in the order shown in its file list. Decide that sequence before creating the output, then inspect the downloaded document before sharing it.",
    steps: [
      { title: "Prepare the source PDFs", body: "Choose readable, unencrypted PDF files that your browser can open. ToolsForToday accepts up to 20 files, 25 MB per file, 100 MB combined, and 300 pages total." },
      { title: "Add the files", body: "Open Merge PDF and choose two or more files, or drop them into the selection area. Wait for validation; invalid or unsupported files are reported rather than silently included." },
      { title: "Arrange the file sequence", body: "Review the list from first document to last. Use Move up or Move down on a file to change where its pages will appear. Each PDF's internal page order remains as it was." },
      { title: "Merge and review", body: "Select Merge PDFs, wait for processing to finish, then download the generated PDF. Open it and check the opening page, transitions between source documents, final page, and page count." },
    ],
    sections: [
      { heading: "Plan a useful document sequence", paragraphs: ["A common packet order is cover page, main document, supporting material, then appendices. If names sort differently from your intended sequence, do not rely on filenames alone: use the visible controls to move each file into position.", "The current interface reorders whole PDF files. It does not offer controls to rearrange individual pages inside a source, remove selected pages during merging, or rotate pages. Use a PDF page editor for those tasks before or after combining files."] },
      { heading: "Check the output instead of assuming it is unchanged", paragraphs: ["The merger copies pages into a newly generated PDF in the browser. It is intended to combine readable PDFs, not to edit their text. Do not assume every form, annotation, bookmark, signature, attachment, or interactive feature will behave exactly as it did in the source files. Review the merged file in a PDF reader and keep your originals until the output is accepted."] },
      { heading: "Processing limits and browser resources", paragraphs: ["The tool checks the number of files, each file size, combined size, and total page count. Browser memory and device performance can also affect a large merge, even when the files fit the stated limits. If validation or processing fails, reduce the batch size, check that the PDFs open in a reader, or use a desktop PDF tool for an unusually large packet.", "Selected PDF contents are processed locally in the browser and are not uploaded to ToolsForToday application servers. This does not replace checking the content or handling requirements of a sensitive document."] },
    ],
    example: { heading: "Example: assemble a course submission", body: "For a submission with a cover sheet, assignment, and references, add those three PDFs and arrange them in that order. After merging, open the output and confirm the cover is first, the references are last, and all pages are present before uploading the result to the course portal." },
    mistakes: ["Leaving files in an accidental selection order.", "Expecting individual page-level reordering when only whole-file moves are provided.", "Deleting originals before checking the merged file.", "Assuming encryption, forms, signatures, bookmarks, or annotations will be preserved in every case."],
    tips: ["Use descriptive filenames before selecting a large batch.", "Check the displayed total pages before starting.", "Open the downloaded file and inspect boundaries between source PDFs."],
    faqs: [
      { question: "Can I change the order after adding PDFs?", answer: "Yes. Move whole files up or down in the list before merging. Pages inside each file remain in their original order." },
      { question: "How many PDFs can I merge?", answer: "The current tool limits a batch to 20 files, 25 MB per file, 100 MB combined, and 300 pages total." },
      { question: "Are my PDFs uploaded?", answer: "The merge is performed in your browser; the selected PDF contents are not uploaded to the ToolsForToday application server." },
    ],
    related: ["how-to-turn-images-into-pdf"],
  },
  {
    slug: "how-to-turn-images-into-pdf",
    title: "How to Turn JPG, PNG, and WebP Images into a PDF",
    description: "Convert a set of JPG, PNG, or WebP images into a multi-page PDF and choose page size, orientation, and margins.",
    category: "PDF Tools",
    toolName: "Images to PDF",
    toolHref: "/tools/images-to-pdf/",
    intro: "Turning a group of photos or screenshots into a PDF can make them easier to review, print, or submit as one document. Before converting, decide whether the pages should use a common paper size or follow each image's own proportions. Then set the sequence and inspect the PDF after download.",
    steps: [
      { title: "Select supported images", body: "Choose JPG/JPEG, PNG, or WebP image files. The tool accepts up to 20 images, 25 MB per image, 25 million decoded pixels per image, 40 million combined decoded pixels, and a generated PDF up to 100 MB." },
      { title: "Arrange the image order", body: "Review the image list before creating the PDF. The order shown determines the page sequence; add files in the intended order and use the available move controls to correct it." },
      { title: "Choose page settings", body: "Select A4, US Letter, or Auto / Fit to Image. You can also choose automatic, portrait, or landscape orientation and none, small, or medium margins. Auto orientation can choose a page orientation per image." },
      { title: "Create and check the PDF", body: "Create the PDF and download it when processing finishes. Open the file to review page order, crop/fit, margins, and orientation before printing or submitting it." },
    ],
    sections: [
      { heading: "A4, US Letter, or Auto", paragraphs: ["A4 is a common international paper size; US Letter is common in North America. Select the format required by the recipient or printer if the PDF must fit standard paper. Auto / Fit to Image makes a page based on the source image dimensions rather than a standard sheet, which can be useful when consistent printable page dimensions are not required.", "For standard page sizes, the image is placed to fit the page area and is not stretched to fill it. Margins reduce the available placement area. Choose orientation automatically when mixed portrait and landscape images should each be fitted according to their shape; choose portrait or landscape when every page should use that orientation."] },
      { heading: "Understand the output and limits", paragraphs: ["Each selected image becomes a PDF page. The tool supports JPG/JPEG, PNG, and WebP; other formats such as GIF, SVG, HEIC, or TIFF are not accepted by this workflow. WebP images are decoded in the browser and re-encoded as PNG for embedding, so output size can differ from the source.", "The PDF is assembled locally in the browser. Large images can use substantial device memory, so the per-image and combined pixel limits are enforced. If a batch does not fit, use fewer images at a time or reduce image dimensions before conversion."] },
      { heading: "Keep the reading sequence clear", paragraphs: ["For scanned pages, check that page 1 is first and page 2 follows it. If file selection adds items in an unexpected order, correct the list before creating the PDF. A reliable filename pattern such as scan-01, scan-02, scan-03 can also help you prepare a batch, but the visible list is the final check."] },
    ],
    example: { heading: "Example: make a printable photo handout", body: "Select four landscape and portrait photos, choose A4, automatic orientation, and small margins. The tool creates one page per image; automatic orientation chooses each page direction to fit that image. Open the result and check that none of the important edges are clipped and that the pages appear in the intended sequence." },
    mistakes: ["Choosing a standard paper size when the recipient expects image-sized pages, or vice versa.", "Assuming an image is stretched to fill a page with no whitespace.", "Forgetting that the current order becomes the PDF page order.", "Trying unsupported formats or a batch over the file/pixel limits."],
    tips: ["Use the recipient's required paper size when submitting forms or printable material.", "Preview the result at actual page size, especially for text in screenshots.", "Keep the source images until the downloaded PDF has been reviewed."],
    faqs: [
      { question: "Which image formats can I convert?", answer: "The current tool accepts JPG/JPEG, PNG, and WebP. GIF, SVG, HEIC, and TIFF are not supported in this workflow." },
      { question: "What is the difference between A4 and US Letter?", answer: "They are different standard paper dimensions used in different regions. Use the size required for your printer or recipient; Auto / Fit to Image instead follows each image's dimensions." },
      { question: "Can pages use different orientations?", answer: "Yes, with automatic orientation. You can also force portrait or landscape orientation for the pages." },
    ],
    related: ["how-to-compress-images-in-your-browser", "how-to-merge-pdf-files"],
  },
  {
    slug: "how-to-resize-and-crop-images",
    title: "How to Resize and Crop Images Without Distorting Them",
    description: "Choose the right image dimensions, crop area, aspect ratio, and output format while keeping proportions under control.",
    category: "Image Tools",
    toolName: "Image Resizer & Cropper",
    toolHref: "/tools/image-resizer-cropper/",
    intro: "Resizing and cropping solve different problems. Resize changes the output pixel dimensions. Crop removes part of the image to change what remains in frame. When an image must fit a thumbnail, profile shape, or banner, using both carefully is often better than stretching the whole picture.",
    steps: [
      { title: "Choose one supported source image", body: "Select one JPEG, PNG, or WebP image no larger than 25 MB and 25 million decoded pixels. Wait for the browser preview and original dimensions to appear." },
      { title: "Crop only if the frame needs to change", body: "Drag across the preview to select a crop, or use the numeric crop controls. Choose Free, 1:1, 4:3, 3:4, 16:9, or 9:16 when you need a particular crop shape. Reset to the full image if you do not need a crop." },
      { title: "Choose output dimensions", body: "Enter a width and height in pixels or apply a width preset. The aspect-ratio lock follows the current crop ratio; unlock it only if distortion is acceptable. Output dimensions must fit the tool's maximum dimension and pixel limits." },
      { title: "Preview and export", body: "Choose JPEG, PNG, or WebP, set a quality value for JPEG or WebP if desired, then create the preview. Inspect the output dimensions and image before downloading." },
    ],
    sections: [
      { heading: "Resize versus crop", paragraphs: ["Resizing maps the selected source pixels to a new width and height. Cropping selects a smaller rectangular area from the source. A crop changes composition; a resize changes output dimensions. Cropping first can make the subject fit a target ratio, then resizing can set the exact pixel size.", "The cropper supports free selection and fixed ratios 1:1, 4:3, 3:4, 16:9, and 9:16. Use the numeric crop fields when precise left, top, width, or height coordinates are needed. The crop must stay within the source image."] },
      { heading: "Protect the aspect ratio", paragraphs: ["The aspect ratio is width divided by height. If a 1600 × 900 image is resized with its proportions locked to 800 pixels wide, its height becomes 450 pixels. If the dimensions are changed independently, the subject may look wider or taller than intended. The tool warns that unlocked dimensions can stretch or distort the image.", "Upscaling is allowed within the tool's limits, but it cannot restore detail that was not present in the source. A larger pixel count does not automatically make a small source sharper."] },
      { heading: "Choose a format with the output in mind", paragraphs: ["JPEG and WebP expose an encoding quality setting. PNG is encoded losslessly and preserves transparency, but it has no quality slider. JPEG has no transparency; transparent source pixels are filled with the background color chosen in the tool. Re-encoding can remove EXIF metadata or embedded color profiles, so preserve the original if those details matter.", "The current output width and height are each limited to 8,000 pixels, with a 25-million-pixel cap. Browser memory also matters, and an oversized source/output combination can be rejected before export."] },
    ],
    example: { heading: "Example: make a square avatar", body: "For a 1600 × 900 landscape photo, select a 1:1 crop around the subject. With the ratio locked, set width to 512 pixels; the output height follows at 512 pixels. Preview the crop before export so the subject is centered and no important detail is cut off." },
    mistakes: ["Entering width and height that stretch the subject when ratio lock is off.", "Cropping too tightly before checking the final small display size.", "Expecting upscaling to recreate missing detail.", "Using JPEG when transparent pixels must remain transparent."],
    tips: ["Choose the destination's required pixel size before editing.", "Use a fixed crop ratio for consistent profile or banner images.", "Check transparency and metadata requirements before choosing the output format."],
    faqs: [
      { question: "Will locking the aspect ratio prevent distortion?", answer: "It keeps the width-to-height ratio associated with the current crop while dimensions change. Unlocking lets dimensions vary independently and may stretch the image." },
      { question: "Which crop ratios are available?", answer: "Free, 1:1, 4:3, 3:4, 16:9, and 9:16." },
      { question: "Will a larger output look sharper?", answer: "Not necessarily. Upscaling increases pixel dimensions but cannot restore detail absent from the source image." },
    ],
    related: ["how-to-compress-images-in-your-browser", "how-to-turn-images-into-pdf"],
  },
  {
    slug: "how-to-calculate-percentage-change",
    title: "How to Calculate Percentage Increase and Decrease",
    description: "Understand the percentage-change formula, work through increase and decrease examples, and distinguish percentages from percentage points.",
    category: "Utilities",
    toolName: "Percentage Calculator",
    toolHref: "/tools/percentage-calculator/",
    intro: "Percentage change describes how much a value changed relative to its starting value. It is useful for comparing prices, counts, measurements, and other quantities, but only when the reference value is clear. The same arithmetic can describe a rise or a fall; the sign tells you which direction the value moved.",
    steps: [
      { title: "Identify the original and new values", body: "Write down the starting value and the later value. Keep the order clear: percentage change is measured from the original to the new value." },
      { title: "Find the absolute difference", body: "Subtract the original value from the new value. A positive difference means the value rose; a negative difference means it fell." },
      { title: "Divide by the original magnitude", body: "Divide the difference by the absolute value of the original, then multiply by 100. Percentage change from an original value of zero is undefined because the formula divides by zero." },
      { title: "Check the sign and interpretation", body: "A positive result is an increase, a negative result is a decrease. Use the Percentage Calculator's Percentage change mode to enter the original and new values and see the result update." },
    ],
    sections: [
      { heading: "The percentage-change formula", paragraphs: ["Percentage change = ((new value − original value) ÷ |original value|) × 100. The absolute value in the denominator treats the original magnitude as the reference, while the numerator's sign indicates direction.", "For 100 to 125, the difference is 25 and 25 ÷ 100 × 100 = 25%, an increase. For 100 to 75, the difference is −25 and −25 ÷ 100 × 100 = −25%, a decrease. When the original value is negative, state the context carefully; a percentage change can be mathematically calculated but may not match every domain's convention."] },
      { heading: "Percentage increase and decrease", paragraphs: ["To increase a value by p percent, multiply it by 1 + p/100. To decrease it by p percent, multiply it by 1 − p/100. For example, increasing 200 by 15% gives 200 × 1.15 = 230; decreasing 200 by 15% gives 200 × 0.85 = 170.", "An increase followed by the same percentage decrease does not generally return to the starting value, because the second percentage is calculated from the new, larger base. A decrease greater than 100% can produce a negative result in the calculator's adjustment mode; whether that has a meaningful interpretation depends on the context."] },
      { heading: "Percentage versus percentage points", paragraphs: ["A percentage describes a proportion out of 100. A percentage point is the arithmetic difference between two percentages. If a rate changes from 20% to 25%, it increased by 5 percentage points. Relative to the starting 20%, it increased by 25% because (25 − 20) ÷ 20 × 100 = 25%. These statements answer different questions, so name the one you mean."] },
    ],
    example: { heading: "Worked example: a price changes", body: "A price goes from 80 to 92. The change is 92 − 80 = 12. Divide 12 by the original 80, then multiply by 100: 12 ÷ 80 × 100 = 15%. The price increased by 15%. A 15% decrease from 92 would be 78.20, not 80, because the second calculation uses 92 as its base." },
    mistakes: ["Dividing by the new value instead of the original value.", "Reversing original and new values and changing the sign.", "Calling a difference between percentages a percent change without naming the reference.", "Trying to calculate percentage change from zero."],
    tips: ["Label both values before calculating.", "Use percentage points for a simple difference between rates.", "For financial, scientific, or regulated reporting, verify the convention used in that domain."],
    faqs: [
      { question: "What is the percentage-change formula?", answer: "Subtract the original from the new value, divide by the absolute value of the original, and multiply by 100. The calculator treats a positive result as an increase and a negative result as a decrease." },
      { question: "Why is percentage change from zero undefined?", answer: "The formula divides by the original value's magnitude. With an original value of zero, that denominator is zero." },
      { question: "How are percentage and percentage points different?", answer: "Percentage points measure the direct difference between two percentage values. Percent change compares that difference with an original base." },
    ],
    related: ["how-to-merge-pdf-files"],
  },
] as const satisfies readonly Guide[];

export type GuideSlug = (typeof guides)[number]["slug"];

export function getGuide(slug: GuideSlug) {
  return guides.find((guide) => guide.slug === slug)!;
}
