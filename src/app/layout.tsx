import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/poppins/latin-600.css";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalyticsConsentProvider } from "@/components/analytics/analytics-consent";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://toolsfortoday.online"),
  title: "ToolsForToday | Everyday Tools. One Simple Place.",
  description: "Explore free online tools for PDFs, images, calculations, dates, text and QR codes. ToolsForToday brings everyday tasks together in one place.",
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "google-adsense-account": "ca-pub-9582226210309650",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Browser extensions can inject attributes on <html> before React hydrates. */}
      <body className="flex min-h-svh flex-col">
        <Script id="google-consent-default" strategy="beforeInteractive">
          {`(function (window) {
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
            window.gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
          })(window);`}
        </Script>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <AnalyticsConsentProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AnalyticsConsentProvider>
      </body>
    </html>
  );
}
