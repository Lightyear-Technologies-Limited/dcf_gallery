"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import MotionToggle from "./MotionToggle";

const NAV = [
  { label: "Collection", href: "/" },
  { label: "Artists", href: "/artists" },
  { label: "Chapters", href: "/chapters" },
  { label: "Thesis", href: "/thesis" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function isActive(href: string) {
    if (href === "/") {
      return path === "/" || path.startsWith("/collection/") || path.startsWith("/piece/");
    }
    if (href === "/artists") {
      return path === "/artists" || path.startsWith("/artist/");
    }
    return path.startsWith(href);
  }

  // ESC to close + focus the close button when the overlay opens.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-32 xl:w-36 z-50 flex-col border-r border-border bg-background">
        <Link href="/" className="text-foreground pt-6 px-6" aria-label="Home">
          <span className="logo-wrap block h-4 w-24">
            <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-4 w-auto logo-light" />
            <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-4 w-auto logo-dark" />
          </span>
        </Link>

        <nav aria-label="Primary" className="flex flex-col items-start w-full px-6 pt-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[13px] tracking-[0.02em] transition-colors duration-200 py-2 ${
                isActive(n.href)
                  ? "text-foreground font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <a
            href="mailto:investor.relations@hivemind.capital?subject=Hivemind%20DCF%20-%20LP%20inquiry"
            className="text-[13px] tracking-[0.02em] transition-colors duration-200 py-2 text-muted hover:text-foreground"
          >
            Inquire
          </a>
        </nav>

        {/* Preferences + theme + parent firm attribution. Moved MotionToggle
            behind a small "Preferences" disclosure so the sidebar rail
            reads as navigation, not settings, on first visit. */}
        <div className="mt-auto pb-8 px-6 space-y-4">
          <details className="group">
            <summary className="cursor-pointer list-none text-[10px] tracking-[0.1em] uppercase text-muted font-medium hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
              <span>Preferences</span>
              <svg
                aria-hidden
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block transition-transform duration-200 group-open:rotate-90"
              >
                <path d="M4 2l4 4-4 4" />
              </svg>
            </summary>
            <div className="mt-3 space-y-3">
              <MotionToggle />
              <ThemeToggle />
            </div>
          </details>
          <p className="text-[9px] tracking-[0.08em] uppercase text-muted/70 leading-relaxed">
            A vehicle of Hivemind Capital Partners
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14 flex items-center justify-between px-6">
        <Link href="/" aria-label="Home">
          <span className="logo-wrap block h-[14px] w-24">
            <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-[14px] w-auto logo-light" />
            <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-[14px] w-auto logo-dark" />
          </span>
        </Link>
        <div className="flex items-center">
          <button
            className="w-11 h-11 flex items-center justify-center text-muted hover:text-foreground transition-colors duration-200 -mr-2"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[100] bg-background flex flex-col md:hidden"
        >
          <div className="h-14 flex items-center justify-end px-6">
            <button
              ref={closeRef}
              className="w-11 h-11 flex items-center justify-center text-muted hover:text-foreground transition-colors duration-200 -mr-2"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              href="mailto:investor.relations@hivemind.capital?subject=Hivemind%20DCF%20-%20LP%20inquiry"
              onClick={() => setOpen(false)}
              className="font-serif text-3xl tracking-[-0.01em] text-foreground-secondary hover:text-foreground transition-colors duration-200"
            >
              Inquire
            </a>
          </nav>
          <div className="px-8 pb-8 space-y-5">
            <MotionToggle />
            <ThemeToggle />
            <p className="text-[9px] tracking-[0.08em] uppercase text-muted/70 leading-relaxed">
              A vehicle of Hivemind Capital Partners
            </p>
          </div>
        </div>
      )}
    </>
  );
}
