"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Candidate {
  src: string;
  title: string;
  isPunk: boolean;
}

interface Props {
  artistSlug: string;
  candidates: Candidate[];
}

/**
 * Picks a random candidate per page-mount so the artists index shows a fresh
 * hero per visit. SSR renders the first candidate (deterministic, no hydration
 * mismatch); after mount we swap to a random pick.
 */
export default function ArtistHero({ artistSlug, candidates }: Props) {
  const [pick, setPick] = useState(0);

  useEffect(() => {
    if (candidates.length <= 1) return;
    setPick(Math.floor(Math.random() * candidates.length));
  }, [candidates.length]);

  if (candidates.length === 0) return null;
  const hero = candidates[pick] ?? candidates[0];

  return (
    <Link
      href={`/artist/${artistSlug}`}
      className={`block w-full ${hero.isPunk ? "bg-[#638596]" : ""}`}
    >
      <Image
        src={hero.src}
        alt={hero.title}
        width={1200}
        height={1200}
        className={`block w-full h-auto ${hero.isPunk ? "[image-rendering:pixelated]" : ""}`}
        sizes="(max-width: 768px) 90vw, 55vw"
      />
    </Link>
  );
}
