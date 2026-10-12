import assert from "node:assert/strict";
import test from "node:test";
import { canTrackPageView, preparePageView } from "./analytics-page.ts";

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
