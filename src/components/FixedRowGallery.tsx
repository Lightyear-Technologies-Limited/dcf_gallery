"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getArtworkImage } from "@/lib/images";

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
}

/**
 * Fixed-row gallery — pieces are grouped into rows based on explicit rowMap
 * from curation.json (e.g., "ringers-x": 1, "ringers-y": 1, "ringers-z": 2).
 * Pieces without explicit rows are appended at the end using fallbackPerRow.
 * Each row fills container width; row heights vary by aspect.
 */
export default function FixedRowGallery({ pieces, rowMap, fallbackPerRow, gap = 4 }: Props) {
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
              const src = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
              const isPunk = piece.collectionSlug === "cryptopunks";
              return (
                <Link
                  key={piece.id}
                  href={`/piece/${piece.slug}`}
                  style={{ width: w > 0 ? `${w}px` : undefined, height: "100%" }}
                  className={`block shrink-0 overflow-hidden ${isPunk ? "bg-[#638596]" : "bg-surface"}`}
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
                  ) : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
