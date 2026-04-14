"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "About", href: "/about" },
  { label: "Collection", href: "/" },
  { label: "Artists", href: "/artists" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-32 z-50 flex-col border-r border-border bg-background">
        {/* Masthead: logo + nav as one unit */}
        <Link href="/" className="text-foreground pt-6 px-6" aria-label="Home">
          <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-4 w-auto block dark:hidden" />
          <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-4 w-auto hidden dark:block" />
        </Link>

        <nav className="flex flex-col items-start gap-5 w-full px-6 mt-14">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[13px] tracking-[0.02em] transition-colors duration-200 ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className={`text-[13px] tracking-[0.02em] transition-colors duration-200 ${
              path === "/search" ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Search
          </Link>
        </nav>

        {/* Theme toggle pinned bottom */}
        <div className="mt-auto pb-8 px-6">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14 flex items-center justify-between px-6">
        <Link href="/" aria-label="Home">
          <img src="/brand/hivemind-black.png" alt="Hivemind" className="h-[12px] w-auto block dark:hidden" />
          <img src="/brand/hivemind-white.png" alt="Hivemind" className="h-[12px] w-auto hidden dark:block" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-muted" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </Link>
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
          <nav className="flex-1 flex flex-col justify-center px-6 gap-10">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className="font-serif text-4xl text-foreground-secondary hover:text-foreground transition-colors duration-200">
                {n.label}
              </Link>
            ))}
            <Link href="/search" onClick={() => setOpen(false)}
              className="font-serif text-4xl text-foreground-secondary hover:text-foreground transition-colors duration-200">
              Search
            </Link>
          </nav>
          <div className="px-6 pb-8"><ThemeToggle /></div>
        </div>
      )}
    </>
  );
}
