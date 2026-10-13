export const ANALYTICS_PAGES = {
  home: { path: "/", title: "ToolsForToday | Home" },
  wordCharacterCounter: { path: "/tools/word-character-counter", title: "Word & Character Counter | ToolsForToday" },
  percentageCalculator: { path: "/tools/percentage-calculator", title: "Percentage Calculator | ToolsForToday" },
  unitConverter: { path: "/tools/unit-converter", title: "Unit Converter | ToolsForToday" },
  dateDifferenceAgeCalculator: { path: "/tools/date-difference-age-calculator", title: "Date Difference & Age Calculator | ToolsForToday" },
  privacyPolicy: { path: "/privacy-policy", title: "ToolsForToday | Privacy Policy" },
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
