"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import JustifiedGallery from "./JustifiedGallery";
import FixedRowGallery from "./FixedRowGallery";
import HeroSidebarGallery from "./HeroSidebarGallery";
import SinglePieceDisplay from "./SinglePieceDisplay";
import { getArtworkImage } from "@/lib/images";
import { getHeroLayout } from "@/lib/curation";
import { CHAPTERS, CHAPTER_COLORS } from "@/lib/chapters";
import ScrollRestore from "./ScrollRestore";

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
    totalSupply?: number;
    piecesPerRow?: number | null;
    pieceRows?: Record<string, number> | null;
    pieces: PieceData[];
  }[];
}

interface Props {
  sections: Section[];
  artists: { name: string; slug: string; tags: string[] }[];
}

export default function CollectionView({ sections, artists }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [artistFilter, setArtistFilter] = useState<string | null>(searchParams.get("artist") || null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(searchParams.get("chapter") || null);

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

  // Ref to the sticky filter section. Drives the scroll-direction hide:
  // when the reader scrolls down past the filter, the section translates
  // up out of view, freeing the full viewport for tall artworks. An
  // upward scroll gesture brings it back so navigation is always one
  // motion away. No auto-scroll on filter change - the reader's current
  // position is preserved, so clicking from the top doesn't force the
  // masthead off-screen.
  const filterRef = useRef<HTMLElement>(null);
  const [filterHidden, setFilterHidden] = useState(false);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    function onScroll() {
      const y = window.scrollY;
      // Up-scroll-only reveal. Past the masthead the filter is hidden
      // by default; an upward scroll motion (>2px) brings it back into
      // view. Down-scrolls are not detected separately - the default
      // simply re-asserts on any non-upward scroll event past threshold.
      const showAboveThreshold = (filterRef.current?.offsetTop ?? 0) + 80;
      if (y < showAboveThreshold) {
        setFilterHidden(false);
      } else if (y < lastY - 2) {
        setFilterHidden(false);
      } else {
        setFilterHidden(true);
      }
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function selectArtist(slug: string) {
    if (chapterFilter) {
      const ch = CHAPTERS.find((c) => c.slug === chapterFilter);
      const inChapter = ch?.artists.includes(slug) ?? false;
      if (!inChapter) {
        // Out-of-chapter artist: switch the filter from chapter-mode to
        // this single artist, clearing the chapter context entirely.
        setChapterFilter(null);
        setExcludedArtists([]);
        setArtistFilter(slug);
        syncUrl(slug, null);
        return;
      }
      // In-chapter artist: toggle exclude (the original chapter-mode
      // affordance for paring down which artists in the chapter show).
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
  // When an artist is selected without an explicit chapter, surface the
  // chapter that artist belongs to in the chapter row - same highlight as
  // an explicit chapter click. Visual cue only: the chapter description
  // and result-count line still key off the explicit chapter filter.
  const impliedChapter =
    !chapterFilter && artistFilter
      ? CHAPTERS.find((c) => c.artists.includes(artistFilter))
      : null;

  // Salon-origin breadcrumb for piece links: ?from=salon (+ active filter) so a
  // piece's Back link returns to the homepage in its current filtered state.
  const salonHrefSearch = (() => {
    const p = new URLSearchParams({ from: "salon" });
    if (artistFilter) p.set("artist", artistFilter);
    if (chapterFilter) p.set("chapter", chapterFilter);
    return p.toString();
  })();

  // Counts for the result-count line under filters.
  const totalPieces = sections.reduce(
    (sum, s) => sum + s.collections.reduce((cs, c) => cs + c.pieces.length, 0),
    0
  );
  const visiblePieces = visible.reduce(
    (sum, s) => sum + s.collections.reduce((cs, c) => cs + c.pieces.length, 0),
    0
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      <ScrollRestore />
      {/* Masthead - "Hivemind Digital Culture Fund" rendered prominently
          above the filter rows so the catalogue identifies itself before
          any interaction. Top padding matches the sidebar logo's pt-6 so
          the h1 anchors at the same vertical as the masthead wordmark
          across the gutter; eye reads "Hivemind" on the rail and
          "Hivemind Digital Culture Fund" on the page at the same line. */}
      <div className="pt-6">
        <h1 className="font-serif display-sm">
          Hivemind Digital Culture Fund
        </h1>
      </div>
      {/* Filters - ARTIST row, then CHAPTER row. Sticks to the top of the
          viewport as the reader scrolls so artist/chapter navigation is
          always reachable; the "Hivemind Digital Culture Fund" masthead
          above scrolls away cleanly. top-14 on mobile clears the fixed
          mobile header (h-14); top-0 from md+ where the header is in the
          left rail. bg-background covers the masthead as it slides under.
          The section slides up out of view on downward scroll past the
          masthead, restoring full vertical room for tall artworks; any
          upward gesture brings it back. Removing a filter is done by
          clicking its active label. */}
      <section
        ref={filterRef}
        className={`sticky top-14 md:top-0 z-30 bg-background pt-6 pb-4 border-b border-border space-y-2 transition-transform duration-300 ease-out ${
          filterHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Row 1: Artists. Mask gives a fade on the trailing edge when overflowing. */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
          <span
            className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20"
            title="Tap an artist to filter"
          >
            Artist
          </span>
          {artists.map((a) => {
            const inChapter = activeChapter ? activeChapter.artists.includes(a.slug) : true;
            const excluded = excludedArtists.includes(a.slug);
            const isActive = artistFilter === a.slug || (inChapter && !excluded && !!chapterFilter);
            // When a chapter is active, artists outside that chapter are
            // still clickable - they switch the filter to that artist
            // alone (clearing the chapter). Dim styling signals "outside
            // current chapter"; hover lifts to indicate they're live.
            const outOfChapter = !!chapterFilter && !inChapter;
            return (
              <button
                key={a.slug}
                onClick={() => selectArtist(a.slug)}
                aria-pressed={isActive}
                className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  outOfChapter
                    ? "text-muted/40 hover:text-foreground"
                    : isActive
                    ? "text-foreground"
                    : excluded
                    ? "text-muted/40 line-through hover:text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
                aria-label={
                  outOfChapter
                    ? `Switch filter to ${a.name}`
                    : activeChapter
                      ? excluded
                        ? `Include ${a.name} in chapter`
                        : `Exclude ${a.name} from chapter`
                      : `Filter by ${a.name}`
                }
              >
                {a.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: Chapters */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Chapter</span>
          {CHAPTERS.map((ch) => {
            const isExplicit = chapterFilter === ch.slug;
            const isImplied = impliedChapter?.slug === ch.slug;
            const isHighlighted = isExplicit || isImplied;
            return (
              <button
                key={ch.slug}
                onClick={() => selectChapter(ch.slug)}
                aria-pressed={isExplicit}
                className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  isHighlighted ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
                style={isHighlighted ? { color: ch.color } : undefined}
              >
                {ch.name}
              </button>
            );
          })}
        </div>

        {/* Chapter description was rendered here when a chapter was active;
            removed because the line popped into the sticky filter band on
            chapter select, growing the band by ~30px and pushing the
            gallery down. /chapters carries the descriptions instead. */}

        {/* Result count - only when filters are active. Phrased as institutional
            context (X of Y in DCF) rather than a raw ratio, so the chapter
            explainer reads as "this chapter contains N of the fund's whole." */}
        {hasFilters && (
          <p className="text-[11px] text-muted tabular-nums pt-2">
            {visiblePieces} of {totalPieces} works in the Hivemind collection
          </p>
        )}
      </section>

      {/* Works - salon wall */}
      <div className="pt-6 pb-20 space-y-10">
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
            <div key={artist.slug} className="space-y-3">
              {/* Artist header */}
              <Link href={`/artist/${artist.slug}`} className="inline-block">
                <h2
                  className="font-serif text-[28px] sm:text-[32px] tracking-[-0.01em] leading-tight hover:opacity-60 transition-opacity duration-200"
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
                    {/* Single-piece collections link the title directly to
                        the piece - the collection page would be redundant
                        chrome for what is effectively one artwork. The muted
                        piece count (the kept Index affordance) sits inline to
                        the right; shown for every collection, single-piece
                        holdings included (a "1" reads as conviction depth). */}
                    <div className="flex items-baseline gap-2.5 mb-2">
                      <Link
                        href={n === 1 && piece ? `/piece/${piece.slug}` : `/collection/${col.slug}`}
                        className="font-serif text-[22px] sm:text-[28px] text-foreground-secondary hover:opacity-60 transition-opacity duration-200"
                      >
                        {col.name}
                      </Link>
                      <span className="text-[11px] text-muted tabular-nums">{n} {n === 1 ? "work" : "works"}</span>
                    </div>
                    {(() => {
                      const heroLayout = getHeroLayout(col.slug);
                      if (n === 1 && piece) return <SinglePieceDisplayLazy piece={piece} hrefSearch={salonHrefSearch} />;
                      if (heroLayout) {
                        return (
                          <HeroSidebarGallery
                            pieces={col.pieces}
                            heroSlug={heroLayout.heroPiece}
                            sidebarCols={heroLayout.sidebarCols}
                            sidebarRows={heroLayout.sidebarRows}
                            sidebarSlugs={heroLayout.sidebarPieces}
                            fallbackPerRow={ideal}
                            hrefSearch={salonHrefSearch}
                          />
                        );
                      }
                      if (col.pieceRows && Object.keys(col.pieceRows).length > 0) {
                        return (
                          <FixedRowGallery
                            pieces={col.pieces}
                            rowMap={col.pieceRows}
                            fallbackPerRow={ideal}
                            hrefSearch={salonHrefSearch}
                          />
                        );
                      }
                      return <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} hrefSearch={salonHrefSearch} />;
                    })()}
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

function SinglePieceDisplayLazy({ piece, hrefSearch }: { piece: PieceData; hrefSearch?: string }) {
  const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  if (!src) return null;
  return (
    <SinglePieceDisplay
      slug={piece.slug}
      src={src}
      title={piece.title}
      isPunk={piece.collectionSlug === "cryptopunks"}
      hrefSearch={hrefSearch}
    />
  );
}
