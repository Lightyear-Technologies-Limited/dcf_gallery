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
 * Picks a random candidate per session and freezes it across the session, so
 * the hero stays consistent as the user navigates back to /artists. SSR
 * always renders candidate[0] for determinism; after mount we read the
 * sessionStorage pick (or generate + persist one), then snap the image.
 *
 * Earlier behaviour re-rolled the random pick on every page load, which
 * produced a visible flash on hydration. The session-frozen approach removes
 * the swap from any return visit, and the first-visit swap is one-time.
 */
export default function ArtistHero({ artistSlug, candidates }: Props) {
  const [pick, setPick] = useState(0);

  useEffect(() => {
    if (candidates.length <= 1) return;
    const key = `dcf-hero-${artistSlug}`;
    let stored: number | null = null;
    try {
      const v = sessionStorage.getItem(key);
      if (v !== null) {
        const n = parseInt(v, 10);
        if (Number.isInteger(n) && n >= 0 && n < candidates.length) stored = n;
      }
    } catch {
      // sessionStorage unavailable (private mode, SSR fallback) - just re-pick
    }
    const next = stored ?? Math.floor(Math.random() * candidates.length);
    if (stored === null) {
      try { sessionStorage.setItem(key, String(next)); } catch {}
    }
    setPick(next);
  }, [artistSlug, candidates.length]);

  if (candidates.length === 0) return null;
  const hero = candidates[pick] ?? candidates[0];

  return (
    <Link
      href={`/artist/${artistSlug}`}
      // Uniform aspect-[6/5] frame per artist so every row on /artists has the
      // same hero footprint regardless of the artwork's natural ratio. Image
      // inside is object-contain (never cropped) - tall pieces render narrower
      // than the frame; wide pieces render shorter. Punks get their classic
      // teal background to frame the pixel art; everything else uses bg-surface
      // so the artwork sits on a subtle tile rather than the raw page colour.
      className={`block w-full aspect-[9/8] flex items-center justify-center overflow-hidden ${hero.isPunk ? "bg-[#638596]" : "bg-surface"}`}
    >
      <Image
        src={hero.src}
        alt={hero.title}
        width={1200}
        height={1200}
        className={`max-w-full max-h-full w-auto h-auto ${hero.isPunk ? "[image-rendering:pixelated]" : ""}`}
        sizes="(max-width: 768px) 90vw, 55vw"
      />
    </Link>
  );
}
