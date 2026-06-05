"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "./PlaceholderArt";

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
  piecesPerRow: number;
  gap?: number;
  /** Cap row height (px). When the natural justified row-height would exceed
      this, pieces are sized to this height instead and the row centers within
      the container rather than stretching to fill. Used on filtered views
      where 1-2 matches would otherwise render as massive heroes. */
  maxRowHeight?: number;
  /** Optional query string (no leading `?`) appended to every tile href so a
      reader's filter state survives clicking into a piece. The piece page
      reads these params and rebuilds the BackButton + sibling nav to keep
      the filter active. */
  hrefSearch?: string;
  /** When true, show the piece title under each tile as a small caption.
      Used on filtered views (single-match especially) where the catalog
      provenance otherwise vanishes. */
  showCaptions?: boolean;
}

/**
 * Justified gallery - each row fills the full container width exactly.
 * Pieces within a row share the same height; widths come from aspect ratios.
 * Row heights naturally differ: rows with wider pieces are shorter, rows with
 * narrower pieces are taller. Result: no cropping, no empty space.
 *
 * When maxRowHeight is set, that's the ceiling; underfilled rows center.
 */
export default function JustifiedGallery({ pieces, piecesPerRow, gap = 4, maxRowHeight, hrefSearch, showCaptions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    pieces.forEach((piece) => {
      if (aspects[piece.id]) return;
      const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "thumb");
      if (!src) { setAspects((a) => ({ ...a, [piece.id]: 1 })); return; }
      const img = new window.Image();
      img.onload = () => setAspects((a) => ({ ...a, [piece.id]: img.naturalWidth / img.naturalHeight }));
      img.onerror = () => setAspects((a) => ({ ...a, [piece.id]: 1 }));
      img.src = src;
    });
  }, [pieces]);

  // Chunk into rows
  const chunks: PieceData[][] = [];
  for (let i = 0; i < pieces.length; i += piecesPerRow) {
    chunks.push(pieces.slice(i, i + piecesPerRow));
  }

  return (
    <div ref={containerRef} className="w-full">
      {chunks.map((row, rowIdx) => {
        const aspectSum = row.reduce((s, p) => s + (aspects[p.id] || 1), 0);
        const totalGap = gap * (row.length - 1);
        // Height this row needs so its pieces sum to full container width
        const naturalRowHeight = width > 0 && aspectSum > 0 ? (width - totalGap) / aspectSum : 0;
        const rowHeight = maxRowHeight && naturalRowHeight > maxRowHeight ? maxRowHeight : naturalRowHeight;
        const isCapped = maxRowHeight !== undefined && rowHeight < naturalRowHeight;

        return (
          <div
            key={rowIdx}
            className={`flex items-start ${isCapped ? "justify-center" : ""}`}
            style={{
              gap: `${gap}px`,
              marginBottom: showCaptions ? `${gap + 24}px` : `${gap}px`,
            }}
          >
            {row.map((piece) => {
              const aspect = aspects[piece.id] || 1;
              const w = aspect * rowHeight;
              // Grid tiles render small — request the thumb tier (≤400px), not
              // detail (≤1200px). Hero/piece-page views use detail. (plan A.1)
              const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "thumb");
              const isPunk = piece.collectionSlug === "cryptopunks";
              const tileHref = `/piece/${piece.slug}${hrefSearch ? `?${hrefSearch}` : ""}`;
              return (
                <div key={piece.id} className="shrink-0" style={{ width: w > 0 ? `${w}px` : undefined }}>
                  <Link
                    href={tileHref}
                    style={{ height: rowHeight > 0 ? `${rowHeight}px` : undefined }}
                    className={`block overflow-hidden ${isPunk ? "bg-[#638596]" : ""}`}
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={piece.title}
                        width={800}
                        height={800}
                        className={`w-full h-full ${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
                        sizes="500px"
                      />
                    ) : (
                      <PlaceholderArt
                        collectionSlug={piece.collectionSlug}
                        pieceSlug={piece.slug}
                        className="w-full h-full"
                      />
                    )}
                  </Link>
                  {showCaptions && (
                    <Link
                      href={tileHref}
                      className="mt-2 block text-[11px] text-muted hover:text-foreground transition-colors duration-200 truncate"
                      title={piece.title}
                    >
                      {piece.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
