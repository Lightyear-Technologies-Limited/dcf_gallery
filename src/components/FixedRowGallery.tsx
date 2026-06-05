"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getArtworkImage, getArtworkAspect } from "@/lib/images";
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
  rowMap: Record<string, number>; // pieceSlug -> rowNumber
  fallbackPerRow: number; // for pieces not in rowMap
  gap?: number;
  hrefSearch?: string;
}

/**
 * Fixed-row gallery - pieces are grouped into rows based on explicit rowMap
 * from curation.json (e.g., "ringers-x": 1, "ringers-y": 1, "ringers-z": 2).
 * Pieces without explicit rows are appended at the end using fallbackPerRow.
 * Each row fills container width; row heights vary by aspect.
 */
export default function FixedRowGallery({ pieces, rowMap, fallbackPerRow, gap = 4, hrefSearch }: Props) {
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
      // Prefer the build-time intrinsic aspect (aspects.data.json) — no network. (plan A.2)
      const known = getArtworkAspect(piece.slug, piece.contractAddress, piece.tokenId);
      if (known) { setAspects((a) => ({ ...a, [piece.id]: known.w / known.h })); return; }
      const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "thumb");
      if (!src) { setAspects((a) => ({ ...a, [piece.id]: 1 })); return; }
      // Fallback probe measures a TINY gateway render, never the full original.
      const probe = src.includes("lightyear.myfilebase.com/ipfs/") ? `${src}?img-width=32&img-format=webp` : src;
      const img = new window.Image();
      img.onload = () => setAspects((a) => ({ ...a, [piece.id]: img.naturalWidth / img.naturalHeight }));
      img.onerror = () => setAspects((a) => ({ ...a, [piece.id]: 1 }));
      img.src = probe;
    });
  }, [pieces]);

  // Group pieces into rows
  const rowsByNumber: Record<number, PieceData[]> = {};
  const unassigned: PieceData[] = [];
  for (const p of pieces) {
    const row = rowMap[p.slug];
    if (typeof row === "number") {
      if (!rowsByNumber[row]) rowsByNumber[row] = [];
      rowsByNumber[row].push(p);
    } else {
      unassigned.push(p);
    }
  }

  // Build ordered row list: explicit rows first (sorted by number), then fallback rows
  const orderedRows: PieceData[][] = Object.keys(rowsByNumber)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => rowsByNumber[n]);

  for (let i = 0; i < unassigned.length; i += fallbackPerRow) {
    orderedRows.push(unassigned.slice(i, i + fallbackPerRow));
  }

  return (
    <div ref={containerRef} className="w-full">
      {orderedRows.map((row, rowIdx) => {
        const aspectSum = row.reduce((s, p) => s + (aspects[p.id] || 1), 0);
        const totalGap = gap * (row.length - 1);
        const rowHeight = width > 0 && aspectSum > 0 ? (width - totalGap) / aspectSum : 0;

        return (
          <div
            key={rowIdx}
            className="flex"
            style={{
              gap: `${gap}px`,
              marginBottom: `${gap}px`,
              height: rowHeight > 0 ? `${rowHeight}px` : undefined,
            }}
          >
            {row.map((piece) => {
              const aspect = aspects[piece.id] || 1;
              const w = aspect * rowHeight;
              // Grid tiles render small — request the thumb tier (≤400px), not
              // detail (≤1200px). Hero/piece-page views use detail. (plan A.1)
              const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "thumb");
              const isPunk = piece.collectionSlug === "cryptopunks";
              return (
                <Link
                  key={piece.id}
                  href={`/piece/${piece.slug}${hrefSearch ? `?${hrefSearch}` : ""}`}
                  style={{ width: w > 0 ? `${w}px` : undefined, height: "100%" }}
                  className={`block shrink-0 overflow-hidden ${isPunk ? "bg-[#638596]" : ""}`}
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
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
