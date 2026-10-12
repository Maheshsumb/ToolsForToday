"use client";

import Script from "next/script";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { canTrackPageView, preparePageView, type AnalyticsPageKey } from "@/components/analytics/analytics-page";

const MEASUREMENT_ID = "G-8HTP8B0KY5";
const CONSENT_STORAGE_KEY = "toolsfortoday-analytics-consent";
type ConsentChoice = "accepted" | "rejected" | null;
type GtagCommand = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: Array<unknown[] | IArguments>;
    gtag?: GtagCommand;
  }
}

type AnalyticsConsentContextValue = {
  openAnalyticsSettings: () => void;
  choice: ConsentChoice;
  scriptReady: boolean;
  trackPageView: (page: AnalyticsPageKey) => void;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null);

function ensureGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

function updateGoogleConsent(analyticsGranted: boolean) {
  ensureGtag();
  window.gtag?.("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function saveConsentChoice(choice: Exclude<ConsentChoice, null>) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // The site remains usable when browser storage is disabled.
  }
}

function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=toolsfortoday.online; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.toolsfortoday.online; SameSite=Lax`;
  }
}

function readSavedChoice(): ConsentChoice {
  try {
    const savedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return savedChoice === "accepted" || savedChoice === "rejected" ? savedChoice : null;
  } catch {
    return null;
  }
}

export function AnalyticsConsentProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [choice, setChoice] = useState<ConsentChoice>(() =>
    typeof window === "undefined" ? null : readSavedChoice(),
  );
  const [showSettings, setShowSettings] = useState(false);
  const [shouldLoadScript, setShouldLoadScript] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const choiceRef = useRef<ConsentChoice>(choice);
  const scriptRequestedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const analyticsConfiguredRef = useRef(false);
  const lastPagePathRef = useRef<string | null>(null);

  const configureAnalytics = useCallback(() => {
    if (analyticsConfiguredRef.current || choiceRef.current !== "accepted" || !window.gtag) {
      return;
    }

    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    analyticsConfiguredRef.current = true;
    setScriptReady(true);
  }, []);

  useEffect(() => {
    ensureGtag();
    if (choiceRef.current === "accepted") {
      scriptRequestedRef.current = true;
      updateGoogleConsent(true);
      setShouldLoadScript(true);
    } else if (choiceRef.current === "rejected") {
      updateGoogleConsent(false);
    } else {
      setShowSettings(true);
    }
  }, []);

  const acceptAnalytics = useCallback(() => {
    const wasRejected = choiceRef.current === "rejected";
    choiceRef.current = "accepted";
    scriptRequestedRef.current = true;
    saveConsentChoice("accepted");
    updateGoogleConsent(true);
    setChoice("accepted");
    setShouldLoadScript(true);
    setShowSettings(false);
    if (wasRejected) {
      lastPagePathRef.current = null;
    }
    if (scriptLoadedRef.current) {
      configureAnalytics();
    }
  }, [configureAnalytics]);

  const rejectAnalytics = useCallback(() => {
    choiceRef.current = "rejected";
    saveConsentChoice("rejected");
    updateGoogleConsent(false);
    clearAnalyticsCookies();
    setChoice("rejected");
    setShowSettings(false);
    if (scriptRequestedRef.current) {
      window.setTimeout(() => window.location.reload(), 100);
    }
  }, []);

  const openAnalyticsSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const trackPageView = useCallback((page: AnalyticsPageKey) => {
    if (!canTrackPageView(choiceRef.current, analyticsConfiguredRef.current) || !window.gtag) {
      return;
    }

    const preparedView = preparePageView(page, window.location.origin, lastPagePathRef.current);
    if (!preparedView) {
      return;
    }

    window.gtag("event", "page_view", preparedView.payload);
    lastPagePathRef.current = preparedView.pagePath;
  }, []);

  const contextValue = useMemo(
    () => ({ openAnalyticsSettings, choice, scriptReady, trackPageView }),
    [openAnalyticsSettings, choice, scriptReady, trackPageView],
  );

  const handleScriptLoad = useCallback(() => {
    scriptLoadedRef.current = true;
    configureAnalytics();
  }, [configureAnalytics]);

  return (
    <AnalyticsConsentContext.Provider value={contextValue}>
      {children}
      {showSettings && (
        <aside
          aria-label="Analytics consent settings"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-h-[calc(100svh-1.5rem)] max-w-3xl overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl sm:inset-x-6 sm:bottom-6 sm:p-6"
        >
          <h2 className="font-heading text-lg font-semibold text-text">Your analytics choice</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We use Google Analytics to understand visits to ToolsForToday. If you accept, we send limited page-view information after your choice. Rejecting analytics does not affect your use of the site.
          </p>
          {choice && (
            <p className="mt-2 text-sm text-muted" role="status">
              Your current choice is {choice}. You can change it here.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              onClick={rejectAnalytics}
              type="button"
            >
              Reject analytics
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-action-primary-foreground hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              onClick={acceptAnalytics}
              type="button"
            >
              Accept analytics
            </button>
          </div>
        </aside>
      )}
      {shouldLoadScript && (
        <Script
          id="google-analytics"
          src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />
      )}
    </AnalyticsConsentContext.Provider>
  );
}

export function AnalyticsPageView({ page }: Readonly<{ page: AnalyticsPageKey }>) {
  const context = useContext(AnalyticsConsentContext);

  useEffect(() => {
    if (context?.choice === "accepted" && context.scriptReady) {
      context.trackPageView(page);
    }
  }, [context, page]);

  return null;
}

export function AnalyticsSettingsButton() {
  const context = useContext(AnalyticsConsentContext);
  if (!context) {
    throw new Error("AnalyticsSettingsButton must be used within AnalyticsConsentProvider.");
  }

  return (
    <button
      className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-muted hover:text-text hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
      onClick={context.openAnalyticsSettings}
      type="button"
    >
      Analytics settings
    </button>
  );
}
