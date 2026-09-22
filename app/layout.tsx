import type { Metadata } from "next";
import { Josefin_Sans, Raleway, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Josefin_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

/** Live newslines.org uses Raleway for event dates */
const date = Raleway({
  variable: "--font-date",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://newslines.org"),
  title: {
    default: "Newslines – Interactive unbiased news timelines",
    template: "%s – Newslines",
  },
  description:
    "Organise the world’s news into unbiased, just-the-facts news timelines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${date.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)] antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
