import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import Link from "next/link";
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
    { path: "../fonts/InstrumentSans-Variable.ttf", weight: "100 900", style: "normal" },
    { path: "../fonts/InstrumentSans-Italic-Variable.ttf", weight: "100 900", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DCF Gallery — Digital Culture Fund",
  description: "A curated showcase of the Hivemind Digital Culture Fund collection.",
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
        <Header />
        <main className="flex-1 pt-14 md:pt-0 md:pl-32">{children}</main>
        <footer className="mt-20 border-t border-border py-16 md:pl-32">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">Digital Culture Fund</p>
              <p className="text-[13px] text-muted mt-1">A Hivemind Collection</p>
            </div>
            <div className="flex flex-wrap gap-8 text-[13px] text-muted">
              <Link href="/" className="hover:text-foreground transition-colors duration-200">Collection</Link>
              <Link href="/artists" className="hover:text-foreground transition-colors duration-200">Artists</Link>
              <Link href="/about" className="hover:text-foreground transition-colors duration-200">About</Link>
              <a href="mailto:dcf@hivemind.capital" className="hover:text-foreground transition-colors duration-200">Inquire</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
