"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import JustifiedGallery from "./JustifiedGallery";
import { CHAPTERS } from "@/lib/chapters";
import ScrollRestore from "./ScrollRestore";
import { FUND_SHORT } from "@/lib/site";

interface Piece {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistSlug: string;
  contractAddress?: string;
  tokenId?: string;
}

interface Section {
  artist: { name: string; slug: string };
  collections: {
    name: string;
    slug: string;
    totalSupply?: number;
    pieces: Piece[];
  }[];
}

interface Props {
  sections: Section[];
  artists: { name: string; slug: string; tags?: string[] }[];
}

/**
 * Salon-wall home. Filter rows on top (artists + chapters), a running
 * tally, and the artwork grid grouped by artist / collection. See the
 * DCF Gallery for the sticky-overlay-on-scroll-up pattern and the
 * chapter-scoped artist-exclude gesture — this template is the
 * simplified starter.
 */
export default function CollectionView({ sections, artists }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [artistFilter, setArtistFilter] = useState<string | null>(searchParams.get("artist") || null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(searchParams.get("chapter") || null);

  const syncUrl = useCallback((artist: string | null, chapter: string | null) => {
    const p = new URLSearchParams();
    if (artist) p.set("artist", artist);
    if (chapter) p.set("chapter", chapter);
    const qs = p.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router]);

  const selectArtist = (slug: string) => {
    const next = artistFilter === slug ? null : slug;
    setArtistFilter(next);
    syncUrl(next, chapterFilter);
  };
  const selectChapter = (slug: string) => {
    const next = chapterFilter === slug ? null : slug;
    setChapterFilter(next);
    syncUrl(artistFilter, next);
  };
  const clearAll = () => { setArtistFilter(null); setChapterFilter(null); syncUrl(null, null); };

  const visible = useMemo(() => {
    let v = sections;
    if (artistFilter) v = v.filter((s) => s.artist.slug === artistFilter);
    if (chapterFilter) {
      const ch = CHAPTERS.find((c) => c.slug === chapterFilter);
      if (ch) v = v.filter((s) => ch.artists.includes(s.artist.slug));
    }
    return v;
  }, [sections, artistFilter, chapterFilter]);

  const hasFilters = !!(artistFilter || chapterFilter);
  const totalPieces = sections.reduce((s, sec) => s + sec.collections.reduce((cs, c) => cs + c.pieces.length, 0), 0);
  const visiblePieces = visible.reduce((s, sec) => s + sec.collections.reduce((cs, c) => cs + c.pieces.length, 0), 0);

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
      <ScrollRestore />
      <div className="pt-6">
        <h1 className="font-serif display-sm">{FUND_SHORT}</h1>
      </div>

      <section className="bg-background pt-6 pb-4 border-b border-border space-y-2">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Artist</span>
          <button type="button" onClick={clearAll}
            className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${!hasFilters ? "text-foreground" : "text-muted/40 hover:text-foreground"}`}>
            All
          </button>
          {artists.map((a) => {
            const isActive = artistFilter === a.slug;
            return (
              <button key={a.slug} onClick={() => selectArtist(a.slug)} aria-pressed={isActive}
                className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${isActive ? "text-foreground" : hasFilters ? "text-muted/40 hover:text-foreground" : "text-muted hover:text-foreground"}`}>
                {a.name}
              </button>
            );
          })}
        </div>

        {CHAPTERS.length > 0 && (
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Chapter</span>
            <button type="button" onClick={clearAll}
              className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${!hasFilters ? "text-foreground" : "text-muted/40 hover:text-foreground"}`}>
              All
            </button>
            {CHAPTERS.map((ch) => {
              const isActive = chapterFilter === ch.slug;
              return (
                <button key={ch.slug} onClick={() => selectChapter(ch.slug)} aria-pressed={isActive}
                  className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${isActive ? "text-foreground" : hasFilters ? "text-muted/40 hover:text-foreground" : "text-muted hover:text-foreground"}`}
                  style={isActive ? { color: ch.color } : undefined}>
                  {ch.name}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums pt-2">
          {hasFilters
            ? `${visiblePieces} of ${totalPieces} works in the ${FUND_SHORT} collection`
            : `All ${totalPieces} works in the ${FUND_SHORT} collection`}
        </p>
      </section>

      <div className="pt-6 pb-20 space-y-10">
        {visible.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[13px] text-muted">No works match these filters.</p>
            <button onClick={clearAll} className="text-[13px] text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200 mt-4">
              Clear filters
            </button>
          </div>
        ) : (
          visible.map(({ artist, collections: cols }) => (
            <div key={artist.slug} className="space-y-3">
              <div className="flex items-baseline gap-2.5 mb-2">
                <Link href={`/artist/${artist.slug}`} className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200">
                  {artist.name}
                </Link>
              </div>
              {cols.map((col) => (
                <div key={col.slug} className="pt-4">
                  <div className="flex items-baseline gap-2.5 mb-3">
                    <Link href={`/collection/${col.slug}`} className="font-serif text-[22px] sm:text-[28px] text-foreground-secondary hover:opacity-60 transition-opacity duration-200">
                      {col.name}
                    </Link>
                    <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums">
                      {col.pieces.length} {col.pieces.length === 1 ? "work" : "works"}
                    </span>
                  </div>
                  <JustifiedGallery pieces={col.pieces} piecesPerRow={4} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
