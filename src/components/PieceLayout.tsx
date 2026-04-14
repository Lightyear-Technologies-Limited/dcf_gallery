"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Props {
  image: string | null;
  title: string;
  isPunk: boolean;
  artistName?: string;
  artistSlug?: string;
  collectionName?: string;
  collectionSlug?: string;
  metadata: React.ReactNode;
  rasterUrl?: string;
  placeholder: React.ReactNode;
}

/**
 * Adaptive piece layout:
 * - Wide artworks (aspect > 1.3): image on top full-width, info below
 * - Tall/square artworks: image left, info right
 */
export default function PieceLayout({ image, title, isPunk, artistName, artistSlug, collectionName, collectionSlug, metadata, rasterUrl, placeholder }: Props) {
  const [aspect, setAspect] = useState<number | null>(null);
  const isWide = aspect !== null && aspect > 1.3;

  const artworkBlock = image ? (
    <div className={isPunk ? "bg-[#638596] inline-block" : ""}>
      <Image
        src={image}
        alt={title}
        width={1600}
        height={1200}
        className={`block w-full h-auto max-h-[80vh] ${isPunk ? "[image-rendering:pixelated] max-w-[400px]" : ""}`}
        priority
        sizes={isWide ? "100vw" : "(max-width: 768px) 90vw, 60vw"}
        onLoadingComplete={(img) => setAspect(img.naturalWidth / img.naturalHeight)}
      />
    </div>
  ) : (
    <div className="aspect-[4/3] w-full">{placeholder}</div>
  );

  const infoBlock = (
    <div className="flex-1 md:pt-4">
      {artistSlug && artistName && (
        <Link href={`/artist/${artistSlug}`} className="text-[16px] text-foreground hover:text-muted transition-colors duration-200">
          {artistName}
        </Link>
      )}
      <h1 className="font-serif text-[24px] sm:text-[32px] tracking-tight leading-tight mt-2 italic">
        {title}
      </h1>
      {collectionSlug && collectionName && (
        <Link href={`/collection/${collectionSlug}`} className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-2 inline-block">
          {collectionName}
        </Link>
      )}

      <div className="mt-10">{metadata}</div>

      {rasterUrl && (
        <a href={rasterUrl} target="_blank" rel="noopener noreferrer"
          className="text-[11px] text-muted/60 hover:text-muted transition-colors duration-200 inline-block mt-10">
          View on Raster
        </a>
      )}
    </div>
  );

  if (isWide) {
    // Wide artwork: stacked layout, image spans full width
    return (
      <>
        <div className="flex justify-center">
          {artworkBlock}
        </div>
        <div className="pt-10 max-w-2xl">
          {infoBlock}
        </div>
      </>
    );
  }

  // Default/tall/square: side-by-side
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
      <div className="w-full md:w-[60%] lg:w-[65%] shrink-0">
        {artworkBlock}
      </div>
      {infoBlock}
    </div>
  );
}
