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
  { route: "/guides/", file: "guides/index.html", title: "Free Online Tool Guides & Tutorials | ToolsForToday" },
  { route: "/guides/how-to-compress-images-in-your-browser/", file: "guides/how-to-compress-images-in-your-browser/index.html", title: "How to Compress Images in Your Browser | ToolsForToday" },
  { route: "/guides/how-to-merge-pdf-files/", file: "guides/how-to-merge-pdf-files/index.html", title: "How to Merge PDF Files in Order | ToolsForToday" },
  { route: "/guides/how-to-turn-images-into-pdf/", file: "guides/how-to-turn-images-into-pdf/index.html", title: "How to Convert Images to PDF | ToolsForToday" },
  { route: "/guides/how-to-resize-and-crop-images/", file: "guides/how-to-resize-and-crop-images/index.html", title: "How to Resize and Crop Images | ToolsForToday" },
  { route: "/guides/how-to-calculate-percentage-change/", file: "guides/how-to-calculate-percentage-change/index.html", title: "How to Calculate Percentage Change | ToolsForToday" },
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

test("static export contains accurate page metadata and indexable canonical pages", async () => {
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
    const robots = headTag(html, /<meta name="robots" content="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(robots.length, 1, `${page.route} robots count`);
    assert.equal(robots[0][1], "index, follow", `${page.route} robots directive`);
    assert.doesNotMatch(headTag(html, /<meta\b[^>]*>/gi).join("\n"), /name="(?:robots|googlebot)"[^>]*noindex/i, `${page.route} noindex`);
    assert.equal(headTag(html, /<meta name="googlebot"[^>]*>/gi).length, 0, `${page.route} Googlebot directive`);
  }
});

test("custom 404 remains non-indexable with the expected not-found content", async () => {
  const html = await htmlFor("404.html");
  assert.match(html, /Page not found/);
  const robots = headTag(html, /<meta name="robots" content="([^"]+)"\s*\/?\s*>/gi);
  assert.ok(robots.some(([, content]) => /noindex/i.test(content)), "404 must retain Next.js noindex");
});

test("guides are visible, indexable static articles with canonical metadata and accessible structure", async () => {
  const guidePages = pages.filter(({ route }) => route.startsWith("/guides/"));
  assert.equal(guidePages.length, 6, "one hub plus five published guide routes");
  const descriptions = new Set();

  for (const page of guidePages) {
    const html = await htmlFor(page.file);
    const title = headTag(html, /<title>([\s\S]*?)<\/title>/gi);
    assert.equal(title.length, 1, `${page.route} title count`);
    assert.equal(decodeEntities(title[0][1]), page.title, `${page.route} unique title`);
    const description = headTag(html, /<meta name="description" content="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(description.length, 1, `${page.route} description count`);
    assert.ok(description[0][1].length > 50, `${page.route} useful description`);
    assert.ok(!descriptions.has(description[0][1]), `${page.route} duplicate description`);
    descriptions.add(description[0][1]);
    const canonical = headTag(html, /<link rel="canonical" href="([^"]+)"\s*\/?\s*>/gi);
    assert.equal(canonical.length, 1, `${page.route} canonical count`);
    assert.equal(canonical[0][1], `${origin}${page.route}`);
    assert.match(html, /<meta name="robots" content="index, follow"/);
    assert.match(html, /<h1\b/);
    assert.match(html, /<nav aria-label="Breadcrumb"/);
    assert.doesNotMatch(html, /draft guide|coming soon/i);
    assert.doesNotMatch(html, /TODO|PLACEHOLDER|lorem ipsum/i);

    if (page.route !== "/guides/") {
      assert.match(html, /<article\b/);
      assert.match(html, /Step by step/);
      assert.match(html, /Common mistakes to avoid/);
      assert.match(html, /Ready to try it\?/);
      const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      assert.equal(structuredData.length, 1, `${page.route} one JSON-LD block`);
      const parsed = JSON.parse(structuredData[0][1]);
      assert.ok(Array.isArray(parsed), `${page.route} Article and BreadcrumbList JSON-LD array`);
      assert.ok(parsed.some((item) => item["@type"] === "Article" && item.mainEntityOfPage?.["@id"] === `${origin}${page.route}`), `${page.route} matching Article JSON-LD`);
      assert.ok(parsed.some((item) => item["@type"] === "BreadcrumbList" && item.itemListElement?.length === 3 && item.itemListElement.at(-1)?.item === `${origin}${page.route}`), `${page.route} visible breadcrumb JSON-LD`);
    }
  }
});

test("guides hub, tool pages, and related guide links use only published routes", async () => {
  const publishedGuideRoutes = new Set(pages.filter(({ route }) => route.startsWith("/guides/")).map(({ route }) => route));
  const hub = await htmlFor("guides/index.html");
  for (const page of pages.filter(({ route }) => route.startsWith("/guides/") && route !== "/guides/")) {
    assert.ok(hub.includes(`href="${page.route}"`), `hub links to ${page.route}`);
  }

  const toolGuidePairs = [
    ["image-compressor/index.html", "/guides/how-to-compress-images-in-your-browser/"],
    ["merge-pdf/index.html", "/guides/how-to-merge-pdf-files/"],
    ["images-to-pdf/index.html", "/guides/how-to-turn-images-into-pdf/"],
    ["image-resizer-cropper/index.html", "/guides/how-to-resize-and-crop-images/"],
    ["percentage-calculator/index.html", "/guides/how-to-calculate-percentage-change/"],
  ];
  for (const [file, route] of toolGuidePairs) {
    const html = await htmlFor(`tools/${file}`);
    assert.ok(html.includes(`href="${route}"`), `${file} links to its guide`);
  }

  const htmlFiles = [...pages.map(({ file }) => file)];
  for (const file of htmlFiles) {
    const html = await htmlFor(file);
    for (const [, href] of html.matchAll(/href="(\/guides\/[^"?#]+)"/g)) {
      assert.ok(publishedGuideRoutes.has(href), `${file} points to published route ${href}`);
    }
  }
});

test("static sitemap contains all original pages and exactly six published guide URLs", async () => {
  const sitemap = await htmlFor("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.equal(urls.length, 20, "14 existing URLs plus Guides hub and five guides");
  assert.equal(new Set(urls).size, urls.length, "no duplicate URLs");
  for (const page of pages) assert.ok(urls.includes(`${origin}${page.route}`), `sitemap includes ${page.route}`);
  assert.ok(urls.every((url) => url.startsWith(`${origin}/`)), "sitemap uses HTTPS apex URLs only");
  assert.ok(urls.every((url) => url.endsWith("/")), "sitemap uses trailing slash routes");
  assert.ok(!urls.some((url) => /localhost|pages\.dev|preview|draft/i.test(url)), "no development or preview URL");
});

test("homepage describes all 12 available tools and category counts truthfully", async () => {
  const html = await htmlFor("index.html");
  const catalogue = html.match(/<section id="tools"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(html, /12 available tools/);
  assert.match(html, /5 Utilities, 3 Image Tools and 4 PDF Tools/);
  assert.doesNotMatch(html, /planned collection|eight available tools|four more tools are in development|being built/i);
  assert.equal((catalogue.match(/>Available<\/span>/g) ?? []).length, 12);
  assert.equal((catalogue.match(/>Coming Soon<\/span>/g) ?? []).length, 0);
  const toolHrefs = [...catalogue.matchAll(/href="(\/tools\/[a-z0-9-]+\/)"/g)].map((match) => match[1]);
  assert.equal(new Set(toolHrefs).size, 12);
});

test("sitemap lists exactly the 20 canonical content pages without generated dates", async () => {
  const xml = await readFile(path.join(output, "sitemap.xml"), "utf8");
  assert.match(xml, /^<\?xml/);
  assert.match(xml, /<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, 20);
  assert.equal(new Set(urls).size, 20);
  assert.deepEqual(new Set(urls), new Set(pages.map((page) => `${origin}${page.route}`)));
  assert.ok(urls.every((url) => url.endsWith("/")), "sitemap URLs must use trailing slashes");
  const sitemapLocations = urls.join("\n");
  assert.doesNotMatch(sitemapLocations, /pages\.dev|www\.toolsfortoday|localhost|\?|404/i);
  assert.doesNotMatch(xml, /<lastmod|<priority|<changefreq/i);
  assert.match(xml, /<\/urlset>\s*$/);
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
      if (value.inLanguage !== undefined) assert.equal(value.inLanguage, "en");
      const canonical = value.url ?? value.mainEntityOfPage?.["@id"] ?? value.itemListElement?.at(-1)?.item;
      assert.ok(typeof canonical === "string" && canonical.startsWith(origin));
      assert.ok(!("aggregateRating" in value));
      assert.ok(!("review" in value));
    }
    if (page.route === "/") assert.deepEqual(values.map((value) => value["@type"]), ["WebSite", "WebPage"]);
    else if (page.route === "/guides/") assert.equal(values[0]["@type"], "CollectionPage");
    else if (page.route.startsWith("/guides/")) assert.deepEqual(values.map((value) => value["@type"]), ["Article", "BreadcrumbList"]);
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
  assert.equal(await readFile(path.join(output, "ads.txt"), "utf8"), "google.com, pub-9582226210309650, DIRECT, f08c47fec0942fa0\n");
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
  const layoutSource = await readFile("src/app/layout.tsx", "utf8");
  assert.match(pageSource, /ANALYTICS_PAGES/);
  assert.match(pageSource, /export function preparePageView/);
  assert.match(consentSource, /send_page_view:\s*false/);
  assert.match(consentSource, /analytics_storage:\s*analyticsGranted\s*\?\s*"granted"\s*:\s*"denied"/);
  assert.match(consentSource, /G-8HTP8B0KY5/);
  assert.doesNotMatch(layoutSource, /static\.cloudflareinsights\.com|beacon\.min\.js|cdn-cgi\/rum/);
});

test("Privacy Policy contains the approved Cloudflare Web Analytics disclosure once", async () => {
  const html = await htmlFor("privacy-policy/index.html");
  const sections = [...html.matchAll(/<section aria-labelledby="cloudflare-analytics-heading">([\s\S]*?)<\/section>/g)];
  assert.equal(sections.length, 1, "Cloudflare Web Analytics disclosure count");
  const section = sections[0][1];

  assert.match(section, /<h2 id="cloudflare-analytics-heading"[^>]*>Cloudflare Web Analytics<\/h2>/);
  assert.match(section, /Cloudflare may use a browser-based beacon/);
  assert.match(section, /page and referrer information, browser and device details/);
  assert.match(section, /operates separately from Google Analytics/);
  assert.match(section, /Google Analytics consent preference on ToolsForToday does not control Cloudflare Web Analytics/);
  assert.equal((section.match(/href="https:\/\/developers\.cloudflare\.com\/speed\/observatory\/rum-beacon\/"/g) ?? []).length, 1);
  assert.equal((section.match(/href="https:\/\/developers\.cloudflare\.com\/web-analytics\/faq\/"/g) ?? []).length, 1);
  assert.match(section, /handles IP addresses, processes performance information internationally, and retains analytics data/);

  assert.match(html, /Mahesh Sumb/);
  assert.match(html, /mailto:maheshsumb\.dev@gmail\.com/);
  assert.match(html, /<title>Privacy Policy \| ToolsForToday<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/toolsfortoday\.online\/privacy-policy\/"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
});
