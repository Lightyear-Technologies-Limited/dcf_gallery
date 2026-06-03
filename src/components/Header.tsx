"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "Collection", href: "/" },
  { label: "Artists", href: "/artists" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  function isActive(href: string) {
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

  return (
    <>
      {/* Desktop sidebar - tightens to w-32 below xl so content doesn't right-shift
          on 1280px laptops, expands to w-36 on xl+ where the extra breathing room
          is affordable. */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-32 xl:w-36 z-50 flex-col border-r border-border bg-background">
        {/* Masthead: logo at top */}
        <Link href="/" className="text-foreground pt-6 px-6" aria-label="Home">
          <span className="logo-wrap block h-4 w-24">
            <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-4 w-auto logo-light" />
            <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-4 w-auto logo-dark" />
          </span>
        </Link>

        {/* Nav - Collection leads (the curatorial surface), then Artists, then About.
            Active state uses font-medium + foreground so it survives hover (hover
            also raises non-active items to foreground, so color alone wasn't enough). */}
        <nav className="flex flex-col items-start w-full px-6 pt-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[13px] tracking-[0.02em] transition-colors duration-200 py-1.5 ${
                isActive(n.href)
                  ? "text-foreground font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Theme toggle pinned bottom */}
        <div className="mt-auto pb-8 px-6">
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
          <div className="px-8 pb-8"><ThemeToggle /></div>
        </div>
      )}
    </>
  );
}
