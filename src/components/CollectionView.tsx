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
  artists: { name: string; slug: string }[];
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

  // Filter behaves in two modes:
  //  - "in flow"  (default): filter sits at its natural position below the
  //    masthead, scrolls naturally with the page. As the reader scrolls
  //    down past it, it leaves the viewport like any other element - no
  //    slide animation, no sticky pin.
  //  - "sticky overlay": filter pins to the top of the viewport. Engaged
  //    when the reader scrolls UP anywhere past the masthead, so
  //    navigation is one upward gesture away from any scroll depth.
  // IntersectionObserver on a sentinel just below the masthead tells us
  // whether the reader is at the top (sentinel in viewport → in flow).
  // A scroll listener tracks direction; past the masthead, up-scroll
  // engages the overlay, down-scroll lets it leave again.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLElement>(null);
  const [showsAsSticky, setShowsAsSticky] = useState(false);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let isAtTop = true;

    function onScroll() {
      const y = window.scrollY;
      if (isAtTop) {
        setShowsAsSticky(false);
      } else if (y < lastY - 5) {
        setShowsAsSticky(true);
      } else if (y > lastY + 5) {
        setShowsAsSticky(false);
      }
      lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    let observer: IntersectionObserver | null = null;
    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          isAtTop = entry.isIntersecting;
          if (isAtTop) setShowsAsSticky(false);
        },
        // rootMargin extends the observed area 200px above the viewport
        // top, so the overlay starts hiding (when the reader scrolls up)
        // 200px before the main filter would naturally come back into
        // viewport. Avoids a visible overlap between overlay and main.
        { threshold: 0, rootMargin: "200px 0px 0px 0px" },
      );
      observer.observe(sentinel);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  // On filter change while the reader is past the masthead, snap to the
  // top of the new (filtered) gallery. Without this, scroll position
  // sticks at the absolute scrollY of the old view - if the new
  // collection is shorter, the browser caps at max scroll, dumping the
  // reader at the bottom of the new content. When at/above the
  // masthead, no scroll - the reader stays where they are.
  function scrollToFilterIfPast() {
    if (typeof window === "undefined" || !filterRef.current) return;
    const top = filterRef.current.offsetTop;
    if (window.scrollY > top) {
      window.scrollTo(0, top);
    }
  }

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
        scrollToFilterIfPast();
        return;
      }
      // In-chapter artist: toggle exclude (the original chapter-mode
      // affordance for paring down which artists in the chapter show).
      if (excludedArtists.includes(slug)) {
        setExcludedArtists(excludedArtists.filter((a) => a !== slug));
      } else {
        setExcludedArtists([...excludedArtists, slug]);
      }
      scrollToFilterIfPast();
      return;
    }
    const next = artistFilter === slug ? null : slug;
    setArtistFilter(next);
    syncUrl(next, null);
    scrollToFilterIfPast();
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
    scrollToFilterIfPast();
  }

  function clearAll() {
    setArtistFilter(null);
    setChapterFilter(null);
    setExcludedArtists([]);
    syncUrl(null, null);
    scrollToFilterIfPast();
  }

  // Both "All" buttons now clear EVERYTHING (artist + chapter + exclusions)
  // - they're the "back to full view" affordance regardless of which row
  // they sit in. Previously each was row-scoped (Artist All kept chapter,
  // Chapter All kept artist) but that meant Chapter All did nothing when
  // only an artist was selected, which read as broken. Aliased to clearAll.
  const selectArtistAll = clearAll;
  const selectChapterAll = clearAll;

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

  // Filter content - rendered TWICE: once in flow (main) so the page
  // scrolls past it naturally on the way down, once in a fixed overlay
  // that slides in from above on scroll-up. Both share state, so
  // clicking a button in either updates everything.
  const filterContent = (
    <>
      {/* Row 1: Artists. Mask gives a fade on the trailing edge when overflowing.
          "All" moved to its own middle row so artist items and chapter items
          align in the same left column. */}
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">
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
                  ? "text-muted hover:text-foreground"
                  : isActive
                  ? "text-foreground"
                  : hasFilters
                  ? "text-muted hover:text-foreground"
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

      {/* Middle row: shared All. Sits between the Artist and Chapter rows
          so items in both rows column-align. Blank label slot keeps the
          button's left edge at the same column as the artist/chapter
          content beside it. */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20" aria-hidden />
        <button
          type="button"
          onClick={clearAll}
          aria-label="Clear all filters"
          className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
            !hasFilters
              ? "text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
      </div>

      {/* Row 3: Chapters */}
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
                isHighlighted
                  ? "text-foreground"
                  : hasFilters
                  ? "text-muted hover:text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
              style={isHighlighted ? { color: ch.color } : undefined}
            >
              {ch.name}
            </button>
          );
        })}
      </div>

      {/* Result count - always renders, including the All state, so the
          reader sees the collection scale even when nothing is filtered.
          "All N works..." reads as institutional scope; "X of N works..."
          reads as filter subset. */}
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums pt-2">
        {hasFilters
          ? `${visiblePieces} of ${totalPieces} works in the Hivemind collection`
          : `All ${totalPieces} works in the Hivemind collection`}
      </p>
    </>
  );

  return (
    <>
      {/* Sticky overlay - slides in from above on scroll-up past the
          masthead. Fixed positioning so it sits over the gallery at the
          viewport top; positioned to clear the desktop left rail. */}
      <div
        aria-hidden={!showsAsSticky}
        className="fixed top-14 md:top-0 left-0 right-0 md:left-32 xl:left-36 z-40 bg-background border-b border-border transition-transform duration-300 ease-out"
        style={{
          transform: showsAsSticky ? "translateY(0)" : "translateY(-100%)",
          pointerEvents: showsAsSticky ? "auto" : "none",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-4 pb-3 space-y-2">
          {filterContent}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
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
          {/* Lede + Thesis link. Tight vertical rhythm so the filter row
              sits close under the CTA rather than floating in white space. */}
          <p className="mt-4 text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary max-w-2xl">
            Digital art&rsquo;s emergent canon, held by Hivemind Capital
            Partners. Acquired after the first market cycle.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            <Link
              href="/thesis"
              className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
            >
              Read the thesis
            </Link>
          </div>
        </div>
        {/* Sentinel: IntersectionObserver tracks this element to know when
            the reader has moved past the masthead. */}
        <div ref={sentinelRef} aria-hidden className="h-1 w-full mt-3" />
        {/* Main filter - in flow at its natural position. The page scrolls
            past it naturally on the way down (no sticky, no slide-out);
            the overlay above handles the sticky-on-scroll-up behaviour. */}
        <section
          ref={filterRef}
          className="bg-background pt-3 pb-4 border-b border-border space-y-2"
        >
          {filterContent}
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
              {/* Artist header - site-wide subject-tier register so the
                  name reads at the same scale here, on the Artists index,
                  on the Collection page artist credit, and on Chapters. */}
              <Link href={`/artist/${artist.slug}`} className="inline-block">
                <h2
                  className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200"
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
                      <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums">{n} {n === 1 ? "work" : "works"}</span>
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
    </>
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
