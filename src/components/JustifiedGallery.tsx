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
  piecesPerRow: number;
  gap?: number;
}

/**
 * Justified gallery — each row fills the full container width exactly.
 * Pieces within a row share the same height; widths come from aspect ratios.
 * Row heights naturally differ: rows with wider pieces are shorter, rows with
 * narrower pieces are taller. Result: no cropping, no empty space.
 */
export default function JustifiedGallery({ pieces, piecesPerRow, gap = 4 }: Props) {
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
