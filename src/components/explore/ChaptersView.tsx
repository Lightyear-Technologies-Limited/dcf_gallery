"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getArtworkImage, getArtworkAspect } from "@/lib/images";
import PlaceholderArt from "../PlaceholderArt";
import GridArtwork from "../GridArtwork";

interface Work {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistName: string;
  artistSlug?: string;
  contractAddress?: string;
  tokenId?: string;
}
interface ChapterData {
  slug: string;
  name: string;
  description: string;
  total: number;
  artists: { slug: string; name: string }[];
  works: Work[];
}

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Chapters view (E.3) — the cinematic entry. Each curatorial chapter is a
 * full-height title card with a refined filmstrip of its works; a fixed
 * position rail lets you feel where you are in the procession and jump between
 * chapters. Restrained (Argent titles, no colour accent); static — the big titles
 * carry the cinema, no decorative entrance motion. The rail is desktop-only.
 */
export default function ChaptersView({ chapters }: { chapters: ChapterData[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // Track which chapter is centred → drives the position rail (functional, not motion).
  useEffect(() => {
    const activeObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = refs.current.indexOf(e.target as HTMLElement);
            if (i !== -1) setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && activeObs.observe(el));
    return () => activeObs.disconnect();
  }, [chapters]);

  const jump = (i: number) => {
    // Honor reduced-motion: the explicit `behavior` option overrides the global
    // `scroll-behavior:auto` reduced-motion rule in globals.css, so check here too.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    refs.current[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="relative">
      {/* Position rail — the "feel where you are" axis. */}
      <nav
        aria-label="Chapters"
        className="hidden lg:flex fixed right-10 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-5"
      >
        {chapters.map((c, i) => (
          <button
            key={c.slug}
            onClick={() => jump(i)}
            className="group flex items-center gap-3 cursor-pointer"
            aria-current={i === active ? "true" : undefined}
          >
            <span
              className={`text-[10px] tracking-[0.14em] uppercase whitespace-nowrap transition-opacity duration-300 ${
                i === active ? "text-foreground opacity-100" : "text-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              }`}
            >
              {c.name}
            </span>
            <span
              className={`block h-px transition-all duration-300 ${
                i === active ? "w-9 bg-foreground" : "w-4 bg-border group-hover:bg-foreground group-focus-within:bg-foreground"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            ref={(el) => { refs.current[i] = el; }}
            className="min-h-[78vh] flex flex-col justify-center py-16 border-b border-border last:border-b-0"
          >
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-muted font-medium mb-4">
                Chapter {roman[i]} of {roman[chapters.length - 1]}
              </p>
              <h2 className="font-serif display-lg leading-[0.95] mb-5">{c.name}</h2>
              <p className="max-w-2xl text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary mb-3">
                {c.description}
              </p>
              <p className="text-[12px] text-muted mb-9 tabular-nums">
                {c.artists.map((a, j) => (
                  <span key={a.slug}>
                    {j > 0 && " · "}
                    <Link
                      href={`/artist/${a.slug}`}
                      className="hover:text-foreground transition-colors duration-200"
                    >
                      {a.name}
                    </Link>
                  </span>
                ))}
                {" - "}
                {c.total} {c.total === 1 ? "work" : "works"}
              </p>

              {/* Filmstrip — uniform height, aspect-true widths. Focusable,
                  labelled scroll region so it's keyboard-operable (arrow-scroll)
                  even though the scrollbar is hidden (WCAG 2.1.1 / discoverability).
                  Scrolls WITHIN the container padding (no full-bleed) so it keeps
                  the same side white-gap as the Salon grid — consistent inset
                  whatever the screen width. A trailing pad-right lets the last
                  tile clear the chapter rail and hints there's more to scroll. */}
              <div
                role="group"
                aria-label={`${c.name} — works (scroll horizontally)`}
                tabIndex={0}
                className="overflow-x-auto scrollbar-hide pr-6 lg:pr-10"
              >
                <div className="flex gap-3 pb-1">
                  {c.works.map((w) => {
                    const aspect = getArtworkAspect(w.slug, w.contractAddress, w.tokenId);
                    const ratio = aspect ? aspect.w / aspect.h : 1;
                    const src = getArtworkImage(w.slug, w.contractAddress, w.tokenId, "thumb");
                    const isPunk = w.collectionSlug === "cryptopunks";
                    return (
                      <Link
                        key={w.id}
                        id={`p-${w.slug}`}
                        href={`/piece/${w.slug}?from=chapters`}
                        title={w.title}
                        style={{ aspectRatio: `${ratio}` }}
                        className={`group relative block h-[180px] sm:h-[220px] lg:h-[260px] shrink-0 overflow-hidden bg-surface ${
                          isPunk ? "bg-punk" : ""
                        }`}
                      >
                        {src ? (
                          <GridArtwork slug={w.slug} title={w.title} imgSrc={src} isPunk={isPunk} sizes="320px" />
                        ) : (
                          <PlaceholderArt collectionSlug={w.collectionSlug} pieceSlug={w.slug} className="h-full w-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Link
                href={`/?chapter=${c.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-muted hover:text-foreground transition-colors duration-200 tabular-nums"
              >
                View all {c.total} in {c.name}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
