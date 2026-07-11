import type { Metadata } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/MotionPreference";
import Header from "@/components/Header";
import "./globals.css";

/**
 * Local fonts. Argent Thin for display, Instrument Sans (variable) for body.
 * Both files must sit in /public/fonts/ before the build runs.
 *
 * Download / license Argent from the type foundry.
 * Instrument Sans is open-source (SIL OFL) — grab from Google Fonts static hosting
 * OR fontsource, then drop into public/fonts/.
 */
const argent = localFont({
  src: [
    { path: "../../public/fonts/Argent-Thin.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/Argent-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-argent",
  display: "swap",
});

const instrument = localFont({
  src: "../../public/fonts/InstrumentSans-Variable.woff2",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "{{FUND_NAME}}",
    template: "%s — {{FUND_SHORT}}",
  },
  description: "{{SITE_DESCRIPTION}}",
  metadataBase: new URL("{{SITE_URL}}"),
  openGraph: {
    title: "{{FUND_NAME}}",
    description: "{{SITE_DESCRIPTION}}",
    url: "{{SITE_URL}}",
    siteName: "{{FUND_NAME}}",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "{{FUND_NAME}}",
    description: "{{SITE_DESCRIPTION}}",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${argent.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme script — applies the .dark class before paint
            so the first pixel matches the reader's saved preference. Runs
            synchronously; no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('gallery-theme');
                if (t === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased md:pl-32 xl:pl-36">
        <MotionProvider>
          <Header />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
