"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface Props {
  slug: string;
  src: string;
  title: string;
  isPunk?: boolean;
}

/**
 * Single-piece collection display:
 * - Wide pieces (aspect > 1): full container width
 * - Tall/square pieces (aspect <= 1): cap at 70vh so they don't dominate vertically
 */
export default function SinglePieceDisplay({ slug, src, title, isPunk = false }: Props) {
  const [aspect, setAspect] = useState<number | null>(null);
  const isWide = aspect !== null && aspect > 1;

  return (
    <Link
      href={`/piece/${slug}`}
      className={`block ${isPunk ? "bg-[#638596] inline-block" : ""}`}
      style={!isWide && aspect !== null ? { width: "fit-content", maxWidth: "100%" } : undefined}
    >
      <Image
        src={src}
        alt={title}
        width={1600}
        height={1200}
        className={`block ${
          isWide
            ? "w-full h-auto"
            : "w-auto h-auto max-h-[70vh] max-w-full"
        } ${isPunk ? "[image-rendering:pixelated] w-[400px]" : ""}`}
        sizes="(max-width: 1024px) 90vw, 1200px"
        onLoad={(e) => {
          const img = e.currentTarget;
          setAspect(img.naturalWidth / img.naturalHeight);
        }}
      />
    </Link>
  );
}
