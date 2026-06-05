"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Explore view switcher (E.3). Toggles between Salon (the homepage), Index,
 * Chapters, and Constellation; persists the choice to localStorage and restores
 * it on a bare /explore visit; mobile-aware (views that don't translate to small
 * screens drop out); keyboard-driven (←/→ cycle the explorer views, 1–4 jump);
 * and shows a one-time tutorial on first visit.
 */
const VIEWS = [
  { id: "salon", label: "Salon", href: "/" },
  { id: "index", label: "Index", href: "/explore?view=index" },
  { id: "chapters", label: "Chapters", href: "/explore?view=chapters" },
  { id: "constellation", label: "Constellation", href: "/explore?view=constellation", desktopOnly: true },
];

export default function ViewSwitcher({
  active,
  explicit,
  suppressTip,
}: {
  active: string;
  explicit?: boolean;
  suppressTip?: boolean;
}) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(true);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const views = VIEWS.filter((v) => isDesktop || !v.desktopOnly);

  // Persist the chosen explore view.
  useEffect(() => {
    if (active && active !== "salon") {
      try { localStorage.setItem("dcf-view", active); } catch { /* private mode */ }
    }
  }, [active]);

  // Restore the last view on a bare /explore visit (no ?view= in the URL).
  useEffect(() => {
    if (explicit) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem("dcf-view"); } catch { /* private mode */ }
    if (stored && stored !== active && views.some((v) => v.id === stored)) {
      router.replace(`/explore?view=${stored}`, { scroll: false });
    }
  }, [explicit, active, views, router]);

  const go = useCallback(
    (id: string) => {
      const v = VIEWS.find((x) => x.id === id);
      if (v) router.push(v.href);
    },
    [router],
  );

  // Keyboard: ←/→ cycle the explorer views (Salon excluded — it leaves the
  // explorer); 1–4 jump directly. Ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cycle = views.filter((v) => v.id !== "salon").map((v) => v.id);
      const idx = cycle.indexOf(active);
      if (e.key === "ArrowRight" && idx !== -1) {
        e.preventDefault();
        go(cycle[(idx + 1) % cycle.length]);
      } else if (e.key === "ArrowLeft" && idx !== -1) {
        e.preventDefault();
        go(cycle[(idx - 1 + cycle.length) % cycle.length]);
      } else if (/^[1-9]$/.test(e.key)) {
        const v = views[parseInt(e.key, 10) - 1];
        if (v) { e.preventDefault(); go(v.id); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, views, go]);

  // One-time tutorial on first visit (suppressed on the homepage — it belongs on
  // the explorer, where the views actually live).
  useEffect(() => {
    if (suppressTip) return;
    try { if (!localStorage.getItem("dcf-explore-tip")) setTip(true); } catch { /* private mode */ }
  }, [suppressTip]);
  const dismissTip = () => {
    setTip(false);
    try { localStorage.setItem("dcf-explore-tip", "1"); } catch { /* private mode */ }
  };

  return (
    <div className="relative">
      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.12em] uppercase" aria-label="Explore views">
        {views.map((v) =>
          active === v.id ? (
            <span key={v.id} className="text-foreground font-medium" aria-current="page">{v.label}</span>
          ) : (
            <Link key={v.id} href={v.href} className="text-muted hover:text-foreground transition-colors duration-200">
              {v.label}
            </Link>
          ),
        )}
      </nav>

      {tip && (
        <div
          role="dialog"
          aria-label="How to explore"
          className="absolute left-0 top-full mt-3 z-40 w-[min(22rem,calc(100vw-3rem))] border border-border bg-surface/95 backdrop-blur-sm shadow-lg p-5"
        >
          <p className="font-serif text-[19px] mb-2">Four ways in</p>
          <p className="text-[13px] leading-[1.55] text-foreground-secondary mb-3">
            <strong className="font-medium text-foreground">Salon</strong> is the curated wall;{" "}
            <strong className="font-medium text-foreground">Index</strong> filters and searches everything;{" "}
            <strong className="font-medium text-foreground">Chapters</strong> walks the five movements; and{" "}
            <strong className="font-medium text-foreground">Constellation</strong> maps the whole collection as a star-field.
          </p>
          <p className="hidden lg:block text-[12px] text-muted mb-4">
            Use <kbd className="font-mono">←</kbd>/<kbd className="font-mono">→</kbd> to move between views, or{" "}
            <kbd className="font-mono">1</kbd>–<kbd className="font-mono">4</kbd> to jump.
          </p>
          <button
            onClick={dismissTip}
            className="text-[11px] tracking-[0.12em] uppercase text-foreground hover:opacity-70 transition-opacity"
          >
            Got it →
          </button>
        </div>
      )}
    </div>
  );
}
