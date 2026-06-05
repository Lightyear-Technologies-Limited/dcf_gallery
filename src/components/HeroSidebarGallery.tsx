"use client";

import Link from "next/link";
import Image from "next/image";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "./PlaceholderArt";
import JustifiedGallery from "./JustifiedGallery";

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

interface Props {
  pieces: PieceData[];
  heroSlug: string;
  /** Grid is `(sidebarCols + N) × N` squares - hero spans N × N. */
  sidebarCols: number;
  /** Number of rows in the composite block (also the hero side length). */
  sidebarRows: number;
  /**
   * Optional explicit ordering for sidebar cells (row-major).
   * If omitted, the first sidebarCols × sidebarRows non-hero pieces are used.
   * Slugs not found in `pieces` are skipped.
   */
  sidebarSlugs?: string[];
  /** Pieces-per-row for the leftover pieces below the composite block. */
  fallbackPerRow: number;
  gap?: number;
  hrefSearch?: string;
}

/**
 * Hero + sidebar grid. Renders one hero piece spanning `sidebarRows × sidebarRows`
 * squares with smaller pieces filling a `sidebarCols × sidebarRows` sidebar to
 * its right. All cells are square, computed from the container width so the
 * block sits flush. Anything beyond hero + sidebar pieces falls through to a
 * standard justified gallery below.
 */
export default function HeroSidebarGallery({
  pieces,
  heroSlug,
  sidebarCols,
  sidebarRows,
  sidebarSlugs,
  fallbackPerRow,
  gap = 4,
  hrefSearch,
}: Props) {
  const hero = pieces.find((p) => p.slug === heroSlug);
  if (!hero) {
    // Hero not in this collection - fall back to plain justified gallery.
    return <JustifiedGallery pieces={pieces} piecesPerRow={fallbackPerRow} gap={gap} hrefSearch={hrefSearch} />;
  }

  const heroSrc = getArtworkImage(hero.slug, hero.contractAddress, hero.tokenId, "detail");
  const isPunkHero = hero.collectionSlug === "cryptopunks";

  const sidebarCount = sidebarCols * sidebarRows;
  const remaining = pieces.filter((p) => p.slug !== heroSlug);

  // If explicit sidebarSlugs given, use them in order (skipping any unknown
  // slugs). Then fill any remaining sidebar cells from the rest of the
  // collection. Pieces not in hero or sidebar fall through to leftover.
  let sidebarPieces: PieceData[];
  let leftover: PieceData[];
  if (sidebarSlugs && sidebarSlugs.length) {
    const explicit = sidebarSlugs
      .map((s) => remaining.find((p) => p.slug === s))
      .filter((p): p is PieceData => p !== undefined);
    const sidebarSet = new Set(explicit.map((p) => p.slug));
    const fillers = remaining.filter((p) => !sidebarSet.has(p.slug));
    const needed = Math.max(0, sidebarCount - explicit.length);
    sidebarPieces = [...explicit, ...fillers.slice(0, needed)];
    leftover = fillers.slice(needed);
  } else {
    sidebarPieces = remaining.slice(0, sidebarCount);
    leftover = remaining.slice(sidebarCount);
  }

  // Total columns in the composite block: hero (sidebarRows wide) + sidebar (sidebarCols wide).
  const totalCols = sidebarRows + sidebarCols;

  return (
    <div className="w-full">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${sidebarRows}, 1fr)`,
          gap: `${gap}px`,
          aspectRatio: `${totalCols} / ${sidebarRows}`,
        }}
      >
        {/* Hero - spans the first sidebarRows × sidebarRows cells */}
        <Link
          href={`/piece/${hero.slug}${hrefSearch ? `?${hrefSearch}` : ""}`}
          className={`block overflow-hidden ${isPunkHero ? "bg-[#638596]" : ""}`}
          style={{
            gridColumn: `1 / span ${sidebarRows}`,
            gridRow: `1 / span ${sidebarRows}`,
          }}
        >
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt={hero.title}
              width={1200}
              height={1200}
              className={`w-full h-full ${isPunkHero ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
              quality={95}
              sizes="(max-width: 1024px) 60vw, 720px"
            />
          ) : (
            <PlaceholderArt
              collectionSlug={hero.collectionSlug}
              pieceSlug={hero.slug}
              className="w-full h-full"
            />
          )}
        </Link>

        {/* Sidebar - fills the remaining cells row-major */}
        {sidebarPieces.map((p) => {
          // Sidebar tiles are small — use the thumb tier, not detail. (plan A.1)
          const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "thumb");
          const isPunk = p.collectionSlug === "cryptopunks";
          return (
            <Link
              key={p.id}
              href={`/piece/${p.slug}${hrefSearch ? `?${hrefSearch}` : ""}`}
              className={`block overflow-hidden ${isPunk ? "bg-[#638596]" : ""}`}
            >
              {src ? (
                <Image
                  src={src}
                  alt={p.title}
                  width={400}
                  height={400}
                  className={`w-full h-full ${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
                  sizes="240px"
                />
              ) : (
                <PlaceholderArt
                  collectionSlug={p.collectionSlug}
                  pieceSlug={p.slug}
                  className="w-full h-full"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Leftover pieces below the composite block */}
      {leftover.length > 0 && (
        <div style={{ marginTop: `${gap}px` }}>
          <JustifiedGallery pieces={leftover} piecesPerRow={fallbackPerRow} gap={gap} hrefSearch={hrefSearch} />
        </div>
      )}
    </div>
  );
}
