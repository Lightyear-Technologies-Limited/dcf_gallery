import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import Link from "next/link";
import { MotionProvider } from "@/components/MotionPreference";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const argent = localFont({
  src: [
    { path: "../fonts/Argent-Thin.woff2", weight: "100", style: "normal" },
    { path: "../fonts/Argent-ThinItalic.woff2", weight: "100", style: "italic" },
  ],
  variable: "--font-argent",
  display: "swap",
});

const instrumentSans = localFont({
  src: [
    { path: "../fonts/InstrumentSans-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/InstrumentSans-Italic-Variable.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

// SITE_URL is resolved in @/lib/site: NEXT_PUBLIC_SITE_URL → Vercel domain → default.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hivemind — Digital Culture Fund Gallery",
    template: "%s — Hivemind DCF",
  },
  description: "A curated showcase of the Hivemind Digital Culture Fund collection.",
  openGraph: {
    siteName: "Hivemind Digital Culture Fund",
    type: "website",
    title: "Hivemind — Digital Culture Fund Gallery",
    description: "A curated showcase of the Hivemind Digital Culture Fund collection.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${argent.variable} ${instrumentSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#F8F8F7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('dcf-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.querySelector('meta[name=theme-color]').content='#111111'}})()` }} />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:border focus:border-border focus:text-[13px]"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: "Hivemind Digital Culture Fund", url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
                { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: "Hivemind Digital Culture Fund", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` } },
              ],
            }),
          }}
        />
        <MotionProvider>
        <Header />
        <main id="main" className="flex-1 pt-14 md:pt-0 md:pl-32 xl:pl-36">{children}</main>
        <footer className="border-t border-border py-8 md:pl-32 xl:pl-36">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">Hivemind Digital Culture Fund</p>
            </div>
            <div className="flex flex-wrap gap-8 text-[13px] text-muted">
              <Link href="/" className="hover:text-foreground transition-colors duration-200">Collection</Link>
              <Link href="/artists" className="hover:text-foreground transition-colors duration-200">Artists</Link>
              <Link href="/about" className="hover:text-foreground transition-colors duration-200">About</Link>
              <a
                href="mailto:dcf@hivemind.capital?subject=Hivemind%20Inquiry"
                className="hover:text-foreground transition-colors duration-200"
                title="For acquisitions, partnerships, or press"
                aria-label="Inquire about acquisitions, partnerships, or press"
              >
                Inquire
              </a>
            </div>
          </div>
        </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
