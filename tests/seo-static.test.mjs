import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const output = path.resolve("out");
const origin = "https://toolsfortoday.online";
const pages = [
  { route: "/", file: "index.html", title: "ToolsForToday – Free Online PDF, Image & Utility Tools" },
  { route: "/tools/word-character-counter/", file: "tools/word-character-counter/index.html", title: "Word Counter & Character Counter Online | ToolsForToday" },
  { route: "/tools/percentage-calculator/", file: "tools/percentage-calculator/index.html", title: "Percentage Calculator – Percent & Change | ToolsForToday" },
  { route: "/tools/unit-converter/", file: "tools/unit-converter/index.html", title: "Unit Converter – Length, Mass & More | ToolsForToday" },
  { route: "/tools/date-difference-age-calculator/", file: "tools/date-difference-age-calculator/index.html", title: "Date Difference & Age Calculator | ToolsForToday" },
  { route: "/tools/qr-code-generator/", file: "tools/qr-code-generator/index.html", title: "QR Code Generator Online – PNG & SVG | ToolsForToday" },
  { route: "/tools/image-compressor/", file: "tools/image-compressor/index.html", title: "Image Compressor for JPG, PNG & WebP | ToolsForToday" },
  { route: "/tools/image-resizer-cropper/", file: "tools/image-resizer-cropper/index.html", title: "Image Resizer & Cropper Online | ToolsForToday" },
  { route: "/tools/image-converter/", file: "tools/image-converter/index.html", title: "Image Converter: JPG, PNG & WebP | ToolsForToday" },
  { route: "/tools/merge-pdf/", file: "tools/merge-pdf/index.html", title: "Merge PDF Files Online | ToolsForToday" },
  { route: "/tools/split-pdf/", file: "tools/split-pdf/index.html", title: "Split PDF & Extract Pages Online | ToolsForToday" },
  { route: "/tools/images-to-pdf/", file: "tools/images-to-pdf/index.html", title: "Images to PDF Converter – JPG, PNG & WebP | ToolsForToday" },
  { route: "/tools/pdf-to-jpg/", file: "tools/pdf-to-jpg/index.html", title: "PDF to JPG Converter – Extract Pages | ToolsForToday" },
  { route: "/privacy-policy/", file: "privacy-policy/index.html", title: "Privacy Policy | ToolsForToday" },
];

async function htmlFor(file) {
  return readFile(path.join(output, file), "utf8");
}

function headTag(html, expression) {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  return [...head.matchAll(expression)];
}

function decodeEntities(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
}

test("static export contains accurate unique page titles, descriptions, canonicals and noindex", async () => {
  const descriptions = new Set();
  for (const page of pages) {
    const html = await htmlFor(page.file);
    assert.equal(headTag(html, /<title>([\s\S]*?)<\/title>/gi).length, 1, `${page.route} title count`);
    const title = headTag(html, /<title>([\s\S]*?)<\/title>/gi)[0][1];
    assert.equal(decodeEntities(title), page.title, `${page.route} title`);
    const description = headTag(html, /<meta name="description" content="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(description.length, 1, `${page.route} description count`);
    assert.ok(description[0][1].length > 30, `${page.route} description too short`);
    if (page.route !== "/privacy-policy/") {
      assert.ok(!descriptions.has(description[0][1]), `duplicate description at ${page.route}`);
      descriptions.add(description[0][1]);
    }
    const canonicals = headTag(html, /<link rel="canonical" href="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(canonicals.length, 1, `${page.route} canonical count`);
    assert.equal(canonicals[0][1], `${origin}${page.route}`, `${page.route} canonical`);
    assert.ok(!canonicals[0][1].includes("?"), `${page.route} canonical query`);
    assert.ok(headTag(html, /<meta name="robots" content="noindex, follow"\s*\/?\s*>/gi).length === 1, `${page.route} robots`);
  }
});

test("homepage describes all 12 available tools and category counts truthfully", async () => {
  const html = await htmlFor("index.html");
  const catalogue = html.match(/<section id="tools"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(html, /12 available tools/);
  assert.match(html, /5 Utilities, 3 Image Tools and 4 PDF Tools/);
  assert.doesNotMatch(html, /planned collection|eight available tools|four more tools are in development|being built/i);
  assert.equal((catalogue.match(/>Available<\/span>/g) ?? []).length, 12);
  const toolHrefs = [...catalogue.matchAll(/href="(\/tools\/[a-z0-9-]+\/)"/g)].map((match) => match[1]);
  assert.equal(new Set(toolHrefs).size, 12);
});

test("sitemap lists exactly the 14 canonical content pages without generated dates", async () => {
  const xml = await readFile(path.join(output, "sitemap.xml"), "utf8");
  assert.match(xml, /^<\?xml/);
  assert.match(xml, /<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, 14);
  assert.equal(new Set(urls).size, 14);
  assert.deepEqual(new Set(urls), new Set(pages.map((page) => `${origin}${page.route}`)));
  const sitemapLocations = urls.join("\n");
  assert.doesNotMatch(sitemapLocations, /pages\.dev|www\.toolsfortoday|localhost|\?|404/i);
  assert.doesNotMatch(xml, /<lastmod|<priority|<changefreq/i);
});

test("structured data is valid JSON-LD and does not invent ratings or reviews", async () => {
  for (const page of pages) {
    const html = await htmlFor(page.file);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1, `${page.route} JSON-LD script count`);
    const parsed = JSON.parse(scripts[0][1]);
    const values = Array.isArray(parsed) ? parsed : [parsed];
    for (const value of values) {
      assert.equal(value["@context"], "https://schema.org");
      assert.equal(value.inLanguage, "en");
      assert.ok(value.url.startsWith(origin));
      assert.ok(!("aggregateRating" in value));
      assert.ok(!("review" in value));
    }
    if (page.route === "/") assert.deepEqual(values.map((value) => value["@type"]), ["WebSite", "WebPage"]);
    else assert.equal(values[0]["@type"], "WebPage");
  }
});

test("related links stay within the intended tool routes and favicon and AdSense metadata remain", async () => {
  const knownRoutes = new Set(pages.map((page) => page.route));
  for (const page of pages) {
    const html = await htmlFor(page.file);
    for (const [, href] of html.matchAll(/href="(\/tools\/[a-z0-9-]+\/)"/g)) {
      assert.ok(knownRoutes.has(href), `broken tool route ${href} on ${page.route}`);
    }
  }
  const html = await htmlFor("index.html");
  assert.equal(headTag(html, /<meta name="google-adsense-account" content="ca-pub-9582226210309650"\s*\/?\s*>/gi).length, 1);
  assert.equal(headTag(html, /<link rel="icon"[^>]*favicon\.ico[^>]*>/gi).length, 1);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com|adsbygoogle\.js/i);
});

test("page-specific Open Graph metadata contains each canonical URL", async () => {
  for (const page of pages) {
    const html = await htmlFor(page.file);
    const urls = headTag(html, /<meta property="og:url" content="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(urls.length, 1, `${page.route} OG url count`);
    assert.equal(urls[0][1], `${origin}${page.route}`);
    assert.match(html, /<meta property="og:site_name" content="ToolsForToday"/);
    assert.match(html, /<meta name="twitter:card" content="summary"/);
  }
});

test("SEO additions leave Analytics source allowlist and consent code intact", async () => {
  const pageSource = await readFile("src/components/analytics/analytics-page.ts", "utf8");
  const consentSource = await readFile("src/components/analytics/analytics-consent.tsx", "utf8");
  assert.match(pageSource, /ANALYTICS_PAGES/);
  assert.match(pageSource, /export function preparePageView/);
  assert.match(consentSource, /send_page_view:\s*false/);
  assert.match(consentSource, /analytics_storage:\s*analyticsGranted\s*\?\s*"granted"\s*:\s*"denied"/);
  assert.match(consentSource, /G-8HTP8B0KY5/);
});
