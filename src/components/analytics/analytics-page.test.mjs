import assert from "node:assert/strict";
import test from "node:test";
import { ANALYTICS_PAGES, canTrackPageView, preparePageView } from "./analytics-page.ts";

const origin = "https://toolsfortoday.online";

test("emits one initial home page view", () => {
  const view = preparePageView("home", origin, null);

  assert.deepEqual(view, {
    pagePath: "/",
    payload: {
      page_title: "ToolsForToday | Home",
      page_location: "https://toolsfortoday.online/",
      page_path: "/",
      page_referrer: "",
    },
  });
});

test("Home to Privacy Policy to Home produces exactly three page views", () => {
  let lastPath = null;
  let count = 0;

  for (const page of ["home", "privacyPolicy", "home"]) {
    const view = preparePageView(page, origin, lastPath);
    if (view) {
      count += 1;
      lastPath = view.pagePath;
    }
  }

  assert.equal(count, 3);
  assert.equal(lastPath, "/");
});

test("Word & Character Counter uses its fixed path and title for Analytics", () => {
  const view = preparePageView("wordCharacterCounter", origin, "/");

  assert.equal(view?.payload.page_title, "Word & Character Counter | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/word-character-counter`);
  assert.equal(view?.payload.page_path, "/tools/word-character-counter");
  assert.equal(view?.payload.page_referrer, `${origin}/`);
});

test("Percentage Calculator uses its fixed path and title for Analytics", () => {
  const view = preparePageView("percentageCalculator", origin, "/");

  assert.equal(view?.payload.page_title, "Percentage Calculator | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/percentage-calculator`);
  assert.equal(view?.payload.page_path, "/tools/percentage-calculator");
  assert.equal(view?.payload.page_referrer, `${origin}/`);
});

test("Unit Converter uses its fixed sanitized route and title for Analytics", () => {
  const view = preparePageView("unitConverter", origin, "/");

  assert.equal(view?.payload.page_title, "Unit Converter | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/unit-converter`);
  assert.equal(view?.payload.page_path, "/tools/unit-converter");
  assert.equal(view?.payload.page_referrer, `${origin}/`);
  assert.equal(JSON.stringify(view).includes("?") || JSON.stringify(view).includes("kilometer"), false);
});

test("Date Difference & Age Calculator uses a fixed sanitized route and title for Analytics", () => {
  const view = preparePageView("dateDifferenceAgeCalculator", origin, "/");
  assert.equal(view?.payload.page_title, "Date Difference & Age Calculator | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/date-difference-age-calculator`);
  assert.equal(view?.payload.page_path, "/tools/date-difference-age-calculator");
  assert.equal(view?.payload.page_referrer, `${origin}/`);
  assert.equal(JSON.stringify(view).includes("?"), false);
});

test("QR Code Generator uses a fixed sanitized route and title without encoded user content", () => {
  const view = preparePageView("qrCodeGenerator", origin, "/tools/date-difference-age-calculator");
  assert.equal(view?.payload.page_title, "QR Code Generator | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/qr-code-generator`);
  assert.equal(view?.payload.page_path, "/tools/qr-code-generator");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/date-difference-age-calculator`);
  assert.equal(JSON.stringify(view).includes("?"), false);
  assert.equal(JSON.stringify(view).includes("example.com"), false);
});

test("Image Compressor uses a fixed sanitized route and title without file details", () => {
  const view = preparePageView("imageCompressor", origin, "/tools/qr-code-generator");
  assert.equal(view?.payload.page_title, "Image Compressor | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/image-compressor`);
  assert.equal(view?.payload.page_path, "/tools/image-compressor");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/qr-code-generator`);
  assert.equal(JSON.stringify(view).includes("?"), false);
  assert.equal(JSON.stringify(view).includes("photo-private-name.jpg"), false);
});

test("Image Resizer & Cropper uses its fixed sanitized route and excludes image details", () => {
  const view = preparePageView("imageResizerCropper", origin, "/tools/image-compressor");
  assert.equal(view?.payload.page_title, "Image Resizer & Cropper | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/image-resizer-cropper`);
  assert.equal(view?.payload.page_path, "/tools/image-resizer-cropper");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/image-compressor`);
  assert.equal(JSON.stringify(view).includes("?"), false);
  assert.equal(JSON.stringify(view).includes("private-photo.jpg"), false);
  assert.equal(JSON.stringify(view).includes("crop=10,20"), false);
});

test("Image Converter uses its fixed sanitized route and excludes image details", () => {
  const view = preparePageView("imageConverter", origin, "/tools/image-resizer-cropper");
  assert.equal(view?.payload.page_title, "JPG, PNG & WebP Image Converter | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/image-converter`);
  assert.equal(view?.payload.page_path, "/tools/image-converter");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/image-resizer-cropper`);
  assert.equal(JSON.stringify(view).includes("?"), false);
  assert.equal(JSON.stringify(view).includes("private-photo.jpg"), false);
});

test("Merge PDF uses a fixed route and title without document details", () => {
  const view = preparePageView("mergePdf", origin, "/tools/image-converter");
  assert.equal(view?.payload.page_title, "Merge PDF | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/merge-pdf`);
  assert.equal(view?.payload.page_path, "/tools/merge-pdf");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/image-converter`);
  assert.equal(JSON.stringify(view).includes("?"), false);
  assert.equal(JSON.stringify(view).includes("invoice-private.pdf"), false);
});

test("Merge PDF route is included in the fixed analytics allowlist", () => {
  assert.deepEqual(ANALYTICS_PAGES.mergePdf, {
    path: "/tools/merge-pdf",
    title: "Merge PDF | ToolsForToday",
  });
});

test("Split PDF uses a fixed sanitized route and title without document details", () => {
  const view = preparePageView("splitPdf", origin, "/tools/merge-pdf");
  assert.equal(view?.payload.page_title, "Split PDF | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/split-pdf`);
  assert.equal(view?.payload.page_path, "/tools/split-pdf");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/merge-pdf`);
  for (const privateValue of ["?", "private.pdf", "1-3,6", "pageCount", "SOURCE PAGE 1"]) {
    assert.equal(JSON.stringify(view).includes(privateValue), false);
  }
});

test("Split PDF route is included in the fixed analytics allowlist", () => {
  assert.deepEqual(ANALYTICS_PAGES.splitPdf, {
    path: "/tools/split-pdf",
    title: "Split PDF | ToolsForToday",
  });
});

test("Images to PDF uses a fixed sanitized route and title without image details", () => {
  const view = preparePageView("imagesToPdf", origin, "/tools/split-pdf");
  assert.equal(view?.payload.page_title, "Images to PDF | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/images-to-pdf`);
  assert.equal(view?.payload.page_path, "/tools/images-to-pdf");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/split-pdf`);
  for (const privateValue of ["?", "private-photo.jpg", "imageWidth", "A4", "thumbnail", "image-order"]) {
    assert.equal(JSON.stringify(view).includes(privateValue), false);
  }
});

test("Images to PDF route is included in the fixed analytics allowlist", () => {
  assert.deepEqual(ANALYTICS_PAGES.imagesToPdf, {
    path: "/tools/images-to-pdf",
    title: "Images to PDF | ToolsForToday",
  });
});

test("PDF to JPG uses a fixed sanitized route and title without document details", () => {
  const view = preparePageView("pdfToJpg", origin, "/tools/images-to-pdf");
  assert.equal(view?.payload.page_title, "PDF to JPG Converter | ToolsForToday");
  assert.equal(view?.payload.page_location, `${origin}/tools/pdf-to-jpg`);
  assert.equal(view?.payload.page_path, "/tools/pdf-to-jpg");
  assert.equal(view?.payload.page_referrer, `${origin}/tools/images-to-pdf`);
  for (const privateValue of ["?", "statement.pdf", "pageRange", "1,3,5-7", "rendered.jpg", "document contents"]) {
    assert.equal(JSON.stringify(view).includes(privateValue), false);
  }
});

test("PDF to JPG route is included in the fixed analytics allowlist", () => {
  assert.deepEqual(ANALYTICS_PAGES.pdfToJpg, {
    path: "/tools/pdf-to-jpg",
    title: "PDF to JPG Converter | ToolsForToday",
  });
});

test("Merge PDF Analytics data does not contain file names, pages, or contents", () => {
  const view = preparePageView("mergePdf", origin, "/");
  const payload = JSON.stringify(view);
  for (const privateValue of ["contract.pdf", "pageCount", "Acme confidential", "?file="]) {
    assert.equal(payload.includes(privateValue), false);
  }
});

test("browser back and forward navigation each emit one page view", () => {
  let lastPath = null;
  let count = 0;

  for (const page of ["home", "privacyPolicy", "home", "privacyPolicy"]) {
    const view = preparePageView(page, origin, lastPath);
    if (view) {
      count += 1;
      lastPath = view.pagePath;
    }
  }

  assert.equal(count, 4);
  assert.equal(lastPath, "/privacy-policy");
});

test("suppresses duplicate effects for the same resolved route", () => {
  assert.equal(preparePageView("privacyPolicy", origin, "/privacy-policy"), null);
});

test("uses only fixed allowlisted paths and excludes query strings", () => {
  const view = preparePageView("privacyPolicy", origin, "/");

  assert.equal(view?.payload.page_location, "https://toolsfortoday.online/privacy-policy");
  assert.equal(view?.payload.page_referrer, "https://toolsfortoday.online/");
  assert.equal(JSON.stringify(view).includes("?"), false);
});

test("tracks a genuine not-found render only through its explicit marker", () => {
  const view = preparePageView("notFound", origin, "/");

  assert.equal(view?.payload.page_path, "/404");
  assert.equal(view?.payload.page_location, "https://toolsfortoday.online/404");
});

test("requires accepted consent and an initialized tag before tracking", () => {
  assert.equal(canTrackPageView(null, true), false);
  assert.equal(canTrackPageView("rejected", true), false);
  assert.equal(canTrackPageView("accepted", false), false);
  assert.equal(canTrackPageView("accepted", true), true);
  assert.equal(canTrackPageView("rejected", false), false);
});
