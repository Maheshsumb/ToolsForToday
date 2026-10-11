import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://toolsfortoday.online"),
  title: "ToolsForToday | Everyday Tools. One Simple Place.",
  description: "ToolsForToday is under development: a future home for free, browser-based everyday tools.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
