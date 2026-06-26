"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import MotionToggle from "./MotionToggle";
import { CHAPTERS } from "@/lib/chapters";

const NAV = [
  { label: "Collection", href: "/" },
  { label: "Artists", href: "/artists" },
  { label: "Chapters", href: "/chapters" },
  { label: "About", href: "/about" },
];

interface NavArtist {
  slug: string;
  name: string;
}

interface Props {
  artists: NavArtist[];
}

export default function Header({ artists }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Path-only active state. Filter-state highlights (?artist= / ?chapter=
  // on the Salon) are deliberately NOT reflected here - the Salon's own
  // filter row carries that signal in-page, and reading searchParams from
  // the root layout would force every page out of static prerendering.

  function isPrimaryActive(href: string) {
    if (href === "/") {
      // Collection nav is active on home, collection pages, and piece pages.
      return path === "/" || path.startsWith("/collection/") || path.startsWith("/piece/");
    }
    if (href === "/artists") {
      // Artists nav is active on the index AND on each artist detail page
      // (path is /artist/[slug], not /artists/[slug] — startsWith would miss it).
      return path === "/artists" || path.startsWith("/artist/");
    }
    return path.startsWith(href);
  }

  function isArtistActive(slug: string) {
    return path === `/artist/${slug}`;
  }

  function isChapterActive(_slug: string) {
    return false;
  }

  return (
    <>
      {/* Desktop sidebar - widened to w-44/xl:w-48 so the expanded nav
          (Artists + Chapters lists) fits artist display names without
          truncating most. Main content + footer left padding match. */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-44 xl:w-48 z-50 flex-col border-r border-border bg-background">
        {/* Masthead: logo at top */}
        <Link href="/" className="text-foreground pt-6 px-6" aria-label="Home">
          <span className="logo-wrap block h-4 w-24">
            <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-4 w-auto logo-light" />
            <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-4 w-auto logo-dark" />
          </span>
        </Link>

        {/* Primary nav - Collection / Artists / Chapters / About. */}
        <nav aria-label="Primary" className="flex flex-col items-start w-full px-6 pt-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[13px] tracking-[0.02em] transition-colors duration-200 py-1.5 ${
                isPrimaryActive(n.href)
                  ? "text-foreground font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Scrollable middle: artist + chapter directory. Always visible so
            readers can jump between sections from any page (per marketing
            feedback). Scrollbar hidden; the column overflows only on very
            short viewports given the small entry count. */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 pt-8 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
              Artists
            </p>
            <ul className="flex flex-col items-start space-y-1.5">
              {artists.map((a) => (
                <li key={a.slug} className="w-full">
                  <Link
                    href={`/artist/${a.slug}`}
                    className={`text-[12px] leading-[1.3] transition-colors duration-200 block truncate ${
                      isArtistActive(a.slug)
                        ? "text-foreground font-medium"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
              Chapters
            </p>
            <ul className="flex flex-col items-start space-y-1.5">
              {CHAPTERS.map((c) => (
                <li key={c.slug} className="w-full">
                  <Link
                    href={`/?chapter=${c.slug}`}
                    className={`text-[12px] leading-[1.3] transition-colors duration-200 block truncate ${
                      isChapterActive(c.slug)
                        ? "text-foreground font-medium"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Toggles pinned bottom, separated by a hairline so they read as
            chrome rather than continuation of the nav list. */}
        <div className="pb-8 px-6 space-y-5 border-t border-border pt-5">
          <MotionToggle />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14 flex items-center justify-between px-6">
        <Link href="/" aria-label="Home">
          <span className="logo-wrap block h-[12px] w-20">
            <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-[12px] w-auto logo-light" />
            <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-[12px] w-auto logo-dark" />
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-muted" onClick={() => setOpen(true)} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col md:hidden">
          <div className="h-14 flex items-center justify-end px-6">
            <button className="p-2 text-muted" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 flex flex-col justify-center px-8 gap-8">
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
              Menu
            </p>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="font-serif text-3xl tracking-[-0.01em] text-foreground-secondary hover:text-foreground transition-colors duration-200"
              >
                {n.label}
              </Link>
            ))}
            <a
              href="mailto:dcf@hivemind.capital?subject=Hivemind%20Inquiry"
              onClick={() => setOpen(false)}
              className="font-serif text-3xl tracking-[-0.01em] text-foreground-secondary hover:text-foreground transition-colors duration-200"
            >
              Inquire
            </a>
          </nav>
          <div className="px-8 pb-8 space-y-5"><MotionToggle /><ThemeToggle /></div>
        </div>
      )}
    </>
  );
}
