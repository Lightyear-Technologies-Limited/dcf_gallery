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
  contractAddress?: string;
  tokenId?: string;
}
interface ChapterData {
  slug: string;
  name: string;
  description: string;
  total: number;
  artistNames: string[];
  works: Work[];
}

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Chapters view (E.3) — the cinematic entry. Each curatorial chapter is a
 * full-height title card with a refined filmstrip of its works; a fixed
 * position rail lets you feel where you are in the procession and jump between
 * chapters. Restrained (Argent titles, no colour accent) with a single quiet
 * motion: each card rises into view as you reach it. Reduced-motion safe;
 * the rail is desktop-only (it sits beside the body text).
 */
export default function ChaptersView({ chapters }: { chapters: ChapterData[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState<boolean[]>(() => chapters.map((_, i) => i === 0));
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setShown(chapters.map(() => true));

    // Which chapter is centred → drives the position rail.
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

    // Reveal-on-enter (skipped under reduced motion — everything starts shown).
    const revealObs = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            setShown((prev) => {
              let changed = false;
              const next = [...prev];
              for (const e of entries) {
                if (e.isIntersecting) {
                  const i = refs.current.indexOf(e.target as HTMLElement);
                  if (i !== -1 && !next[i]) { next[i] = true; changed = true; }
                }
              }
              return changed ? next : prev;
            });
          },
          { threshold: 0.2 },
        );

    refs.current.forEach((el) => { if (el) { activeObs.observe(el); revealObs?.observe(el); } });
    return () => { activeObs.disconnect(); revealObs?.disconnect(); };
  }, [chapters]);

  const jump = (i: number) => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });

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
                i === active ? "text-foreground opacity-100" : "text-muted opacity-0 group-hover:opacity-100"
              }`}
            >
              {c.name}
            </span>
            <span
              className={`block h-px transition-all duration-300 ${
                i === active ? "w-9 bg-foreground" : "w-4 bg-border group-hover:bg-foreground"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            ref={(el) => { refs.current[i] = el; }}
            className="min-h-[78vh] flex flex-col justify-center py-16 border-b border-border last:border-b-0"
          >
            <div
              className={`transition-all duration-700 ease-out ${
                shown[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <p className="text-[10px] tracking-[0.22em] uppercase text-muted font-medium mb-4">
                Chapter {roman[i]} · {String(i + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
              </p>
              <h2 className="font-serif display-lg leading-[0.95] mb-5">{c.name}</h2>
              <p className="max-w-2xl text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary mb-3">
                {c.description}
              </p>
              <p className="text-[12px] text-muted mb-9">
                {c.artistNames.join(" · ")} — {c.total} {c.total === 1 ? "work" : "works"}
              </p>

              {/* Filmstrip — uniform height, aspect-true widths. */}
              <div className="-mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-1">
                  {c.works.map((w) => {
                    const aspect = getArtworkAspect(w.slug, w.contractAddress, w.tokenId);
                    const ratio = aspect ? aspect.w / aspect.h : 1;
                    const src = getArtworkImage(w.slug, w.contractAddress, w.tokenId, "thumb");
                    const isPunk = w.collectionSlug === "cryptopunks";
                    return (
                      <Link
                        key={w.id}
                        href={`/piece/${w.slug}?from=chapters`}
                        title={w.title}
                        style={{ aspectRatio: `${ratio}` }}
                        className={`group relative block h-[180px] sm:h-[220px] lg:h-[260px] shrink-0 overflow-hidden bg-surface ${
                          isPunk ? "bg-[#638596]" : ""
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
                href={`/explore?view=index&chapter=${c.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-muted hover:text-foreground transition-colors duration-200"
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
