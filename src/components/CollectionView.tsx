"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import JustifiedGallery from "./JustifiedGallery";
import FixedRowGallery from "./FixedRowGallery";
import SinglePieceDisplay from "./SinglePieceDisplay";
import { getArtworkImage } from "@/lib/images";
import { CHAPTERS, CHAPTER_COLORS } from "@/lib/chapters";

interface PieceData {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistSlug: string;
  medium: string;
  contractAddress?: string;
  tokenId?: string;
}

interface Section {
  artist: { name: string; slug: string };
  collections: {
    name: string;
    slug: string;
    piecesPerRow?: number | null;
    pieceRows?: Record<string, number> | null;
    pieces: PieceData[];
  }[];
}

interface FeaturedHero {
  slug: string;
  title: string;
  image: string;
  mintDate: string | null;
  artistName: string;
  artistSlug: string;
  collectionName: string;
  collectionSlug: string;
  isPunk: boolean;
}

interface Props {
  sections: Section[];
  artists: { name: string; slug: string; tags: string[] }[];
  featured: FeaturedHero[];
}

export default function CollectionView({ sections, artists, featured }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [artistFilter, setArtistFilter] = useState<string | null>(searchParams.get("artist") || null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(searchParams.get("chapter") || null);
  const [heroIndex, setHeroIndex] = useState(0);

  // Rotate featured hero every 12s (only if we have >1 candidate).
  useEffect(() => {
    if (featured.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % featured.length);
    }, 12000);
    return () => clearInterval(id);
  }, [featured.length]);

  const syncUrl = useCallback(
    (artist: string | null, chapter: string | null) => {
      const params = new URLSearchParams();
      if (artist) params.set("artist", artist);
      if (chapter) params.set("chapter", chapter);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router]
  );

  const [excludedArtists, setExcludedArtists] = useState<string[]>([]);

  function selectArtist(slug: string) {
    if (chapterFilter) {
      if (excludedArtists.includes(slug)) {
        setExcludedArtists(excludedArtists.filter((a) => a !== slug));
      } else {
        setExcludedArtists([...excludedArtists, slug]);
      }
      return;
    }
    const next = artistFilter === slug ? null : slug;
    setArtistFilter(next);
    syncUrl(next, null);
  }

  function selectChapter(slug: string | null) {
    if (chapterFilter === slug) {
      setChapterFilter(null);
      setExcludedArtists([]);
      syncUrl(artistFilter, null);
    } else {
      setChapterFilter(slug);
      setArtistFilter(null);
      setExcludedArtists([]);
      syncUrl(null, slug);
    }
  }

  function clearAll() {
    setArtistFilter(null);
    setChapterFilter(null);
    setExcludedArtists([]);
    syncUrl(null, null);
  }

  useEffect(() => {
    const a = searchParams.get("artist");
    const c = searchParams.get("chapter");
    if (a !== artistFilter) setArtistFilter(a);
    if (c !== chapterFilter) setChapterFilter(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Apply filters
  let visible = sections;
  if (artistFilter) {
    visible = visible.filter((s) => s.artist.slug === artistFilter);
  }
  if (chapterFilter) {
    const ch = CHAPTERS.find((c) => c.slug === chapterFilter);
    if (ch)
      visible = visible.filter(
        (s) => ch.artists.includes(s.artist.slug) && !excludedArtists.includes(s.artist.slug)
      );
  }

  const hasFilters = artistFilter || chapterFilter;
  const activeChapter = chapterFilter ? CHAPTERS.find((c) => c.slug === chapterFilter) : null;
  const hero = featured[heroIndex];

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Featured hero — shown only when no filters are active */}
      {hero && !hasFilters && (
        <section className="pt-12 sm:pt-16">
          <Link
            href={`/piece/${hero.slug}`}
            className={`block ${hero.isPunk ? "bg-[#638596]" : "bg-surface"} overflow-hidden`}
          >
            <div className="relative w-full" style={{ height: "min(75vh, 720px)" }}>
              <Image
                src={hero.image}
                alt={hero.title}
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 1200px"
                className={
                  hero.isPunk
                    ? "[image-rendering:pixelated] object-contain"
                    : "object-contain"
                }
              />
            </div>
          </Link>
          <div className="flex flex-wrap gap-y-2 justify-between items-baseline pt-5 text-[13px]">
            <p className="text-muted">
              <Link
                href={`/artist/${hero.artistSlug}`}
                className="hover:text-foreground transition-colors duration-200"
                style={CHAPTER_COLORS[hero.artistSlug] ? { color: CHAPTER_COLORS[hero.artistSlug] } : undefined}
              >
                {hero.artistName}
              </Link>
              <span className="text-muted"> — </span>
              <span className="font-serif italic text-foreground-secondary">{hero.title}</span>
              {hero.mintDate && <span className="text-muted">, {hero.mintDate.slice(0, 4)}</span>}
            </p>
            <Link
              href={`/collection/${hero.collectionSlug}`}
              className="text-muted hover:text-foreground transition-colors duration-200"
            >
              {hero.collectionName}
            </Link>
          </div>
        </section>
      )}

      {/* Filters — ALL above, then ARTIST row, then CHAPTER row */}
      <section className={`${hero && !hasFilters ? "pt-12" : "pt-12 sm:pt-16"} pb-6 border-b border-border space-y-2`}>
        <button
          onClick={clearAll}
          className={`text-[13px] transition-colors duration-200 ${
            !hasFilters ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          All
        </button>

        {/* Row 1: Artists */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Artist</span>
          {artists.map((a) => {
            const inChapter = activeChapter ? activeChapter.artists.includes(a.slug) : true;
            const excluded = excludedArtists.includes(a.slug);
            const isActive = artistFilter === a.slug || (inChapter && !excluded && !!chapterFilter);
            const isDisabled = !!chapterFilter && !inChapter;
            return (
              <button
                key={a.slug}
                onClick={() => !isDisabled && selectArtist(a.slug)}
                className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  isDisabled
                    ? "text-muted/30 cursor-default"
                    : isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: Chapters */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Chapter</span>
          {CHAPTERS.map((ch) => (
            <button
              key={ch.slug}
              onClick={() => selectChapter(ch.slug)}
              className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                chapterFilter === ch.slug ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
              style={chapterFilter === ch.slug ? { color: ch.color } : undefined}
            >
              {ch.name}
            </button>
          ))}
        </div>

        {/* Chapter description — only when a chapter is active */}
        {activeChapter && (
          <p className="font-serif italic text-[16px] leading-[1.55] text-foreground-secondary pt-4 max-w-[680px]">
            {activeChapter.description}
          </p>
        )}
      </section>

      {/* Works — salon wall */}
      <div className="pt-12 pb-20 space-y-16">
        {visible.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[13px] text-muted">No works match these filters.</p>
            <button
              onClick={clearAll}
              className="text-[13px] text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200 mt-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          visible.map(({ artist, collections: cols }) => (
            <div key={artist.slug} className="space-y-10">
              {/* Artist header */}
              <Link href={`/artist/${artist.slug}`} className="inline-block">
                <h2
                  className="font-serif text-[32px] sm:text-[40px] tracking-[-0.01em] leading-tight hover:opacity-60 transition-opacity duration-200"
                  style={CHAPTER_COLORS[artist.slug] ? { color: CHAPTER_COLORS[artist.slug] } : undefined}
                >
                  {artist.name}
                </h2>
              </Link>

              {cols.map((col) => {
                const n = col.pieces.length;
                const piece = col.pieces[0];
                let ideal: number;
                if (col.piecesPerRow && col.piecesPerRow > 0) ideal = col.piecesPerRow;
                else if (n <= 3) ideal = Math.max(n, 1);
                else if (n <= 6) ideal = 3;
                else if (n <= 12) ideal = 4;
                else ideal = 5;

                return (
                  <div key={`${artist.slug}-${col.slug}`}>
                    <Link
                      href={`/collection/${col.slug}`}
                      className="text-[11px] tracking-[0.05em] text-muted hover:text-foreground transition-colors duration-200 block mb-3"
                    >
                      {col.name}
                    </Link>
                    {n === 1 && piece ? (
                      <SinglePieceDisplayLazy piece={piece} />
                    ) : col.pieceRows && Object.keys(col.pieceRows).length > 0 ? (
                      <FixedRowGallery
                        pieces={col.pieces}
                        rowMap={col.pieceRows}
                        fallbackPerRow={ideal}
                      />
                    ) : (
                      <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SinglePieceDisplayLazy({ piece }: { piece: PieceData }) {
  const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  if (!src) return null;
  return (
    <SinglePieceDisplay
      slug={piece.slug}
      src={src}
      title={piece.title}
      isPunk={piece.collectionSlug === "cryptopunks"}
    />
  );
}
