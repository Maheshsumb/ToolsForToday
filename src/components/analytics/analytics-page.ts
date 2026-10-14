export const ANALYTICS_PAGES = {
  home: { path: "/", title: "ToolsForToday | Home" },
  wordCharacterCounter: { path: "/tools/word-character-counter", title: "Word & Character Counter | ToolsForToday" },
  percentageCalculator: { path: "/tools/percentage-calculator", title: "Percentage Calculator | ToolsForToday" },
  unitConverter: { path: "/tools/unit-converter", title: "Unit Converter | ToolsForToday" },
  dateDifferenceAgeCalculator: { path: "/tools/date-difference-age-calculator", title: "Date Difference & Age Calculator | ToolsForToday" },
  qrCodeGenerator: { path: "/tools/qr-code-generator", title: "QR Code Generator | ToolsForToday" },
  imageCompressor: { path: "/tools/image-compressor", title: "Image Compressor | ToolsForToday" },
  imageResizerCropper: { path: "/tools/image-resizer-cropper", title: "Image Resizer & Cropper | ToolsForToday" },
  imageConverter: { path: "/tools/image-converter", title: "JPG, PNG & WebP Image Converter | ToolsForToday" },
  mergePdf: { path: "/tools/merge-pdf", title: "Merge PDF | ToolsForToday" },
  splitPdf: { path: "/tools/split-pdf", title: "Split PDF | ToolsForToday" },
  imagesToPdf: { path: "/tools/images-to-pdf", title: "Images to PDF | ToolsForToday" },
  pdfToJpg: { path: "/tools/pdf-to-jpg", title: "PDF to JPG Converter | ToolsForToday" },
  privacyPolicy: { path: "/privacy-policy", title: "ToolsForToday | Privacy Policy" },
  guides: { path: "/guides", title: "ToolsForToday | Guides" },
  guideImageCompression: { path: "/guides/how-to-compress-images-in-your-browser", title: "How to Compress Images in Your Browser | ToolsForToday" },
  guideMergePdf: { path: "/guides/how-to-merge-pdf-files", title: "How to Merge PDF Files in Order | ToolsForToday" },
  guideImagesToPdf: { path: "/guides/how-to-turn-images-into-pdf", title: "How to Convert Images to PDF | ToolsForToday" },
  guideResizeCrop: { path: "/guides/how-to-resize-and-crop-images", title: "How to Resize and Crop Images | ToolsForToday" },
  guidePercentageChange: { path: "/guides/how-to-calculate-percentage-change", title: "How to Calculate Percentage Change | ToolsForToday" },
  notFound: { path: "/404", title: "ToolsForToday | Page not found" },
} as const;

export type AnalyticsPageKey = keyof typeof ANALYTICS_PAGES;
export type AnalyticsConsentChoice = "accepted" | "rejected" | null;

export type PageViewPayload = {
  page_title: string;
  page_location: string;
  page_path: string;
  page_referrer: string;
};

export function canTrackPageView(choice: AnalyticsConsentChoice, analyticsConfigured: boolean): boolean {
  return choice === "accepted" && analyticsConfigured;
}

export function preparePageView(
  pageKey: AnalyticsPageKey,
  origin: string,
  previousPagePath: string | null,
): { pagePath: string; payload: PageViewPayload } | null {
  const page = ANALYTICS_PAGES[pageKey];
  if (previousPagePath === page.path) {
    return null;
  }

  return {
    pagePath: page.path,
    payload: {
      page_title: page.title,
      page_location: `${origin}${page.path}`,
      page_path: page.path,
      page_referrer: previousPagePath ? `${origin}${previousPagePath}` : "",
    },
  };
}
