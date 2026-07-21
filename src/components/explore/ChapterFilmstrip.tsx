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

interface Props {
  name: string;
  works: Work[];
}

/**
 * Horizontal filmstrip with hidden scrollbar plus small left/right chevron
 * buttons that fade in/out based on remaining scroll. The chevrons sit
 * over the edge tiles with a light backdrop blur so they don't compete
 * with the artwork.
 *
 * Tile alignment: the scroll container uses CSS scroll-snap (x mandatory)
 * with each tile snapping to start, so chevron clicks - and any other
 * scroll input - always land on a whole tile rather than mid-artwork.
 */
export default function ChapterFilmstrip({ name, works }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Tiles' widths depend on async layout (aspect ratios + image loading);
    // scrollWidth may equal clientWidth on the first mount tick, leaving
    // canRight false and the chevron invisible even though there IS overflow.
    // ResizeObserver picks up the subsequent resize as tiles settle.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: el.clientWidth * 0.8 * dir, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="group"
        aria-label={`${name}: works (scroll horizontally)`}
        tabIndex={0}
        className="overflow-x-auto scrollbar-hide pr-6 snap-x snap-mandatory [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]"
      >
        <div className="flex gap-3 pb-1">
          {works.map((w) => {
            const aspect = getArtworkAspect(w.slug, w.contractAddress, w.tokenId);
            const ratio = aspect ? aspect.w / aspect.h : 1;
            const src = getArtworkImage(w.slug, w.contractAddress, w.tokenId, "thumb");
            const isPunk = w.collectionSlug === "cryptopunks";
            return (
              <Link
                key={w.id}
                id={`p-${w.slug}`}
                href={`/piece/${w.slug}?from=chapters`}
                style={{ aspectRatio: `${ratio}` }}
                className={`group relative block h-[180px] sm:h-[220px] lg:h-[260px] shrink-0 overflow-hidden snap-start ${
                  isPunk ? "bg-punk" : "bg-surface"
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

      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label={`Previous works in ${name}`}
        tabIndex={canLeft ? 0 : -1}
        className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border bg-background/85 backdrop-blur-sm flex items-center justify-center text-foreground transition-opacity duration-200 hover:bg-background ${
          canLeft ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label={`Next works in ${name}`}
        tabIndex={canRight ? 0 : -1}
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border bg-background/85 backdrop-blur-sm flex items-center justify-center text-foreground transition-opacity duration-200 hover:bg-background ${
          canRight ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
