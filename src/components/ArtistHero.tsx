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
      // Uniform aspect-[16/9] frame per artist so every row on /artists
      // has the same hero footprint regardless of the artwork's natural
      // ratio. Reduced from 9:8 (~1.125:1) because that aspect ran the
      // hero ~590px tall on desktop while the info column was ~280px,
      // leaving a big air pocket below the bio. 16:9 brings the frame
      // to ~370px - much closer to info-column height. Image inside is
      // object-contain (never cropped). For punks, the teal background
      // is constrained to a square pane inside the 16:9 frame (the
      // canonical 1:1 punk display) rather than stretched the full
      // frame width.
      className="block w-full aspect-[16/9] flex items-center justify-center overflow-hidden"
    >
      {hero.isPunk ? (
        <div className="aspect-square h-full bg-punk flex items-center justify-center overflow-hidden">
          <Image
            src={hero.src}
            alt={hero.title}
            width={1200}
            height={1200}
            className="max-w-full max-h-full w-auto h-auto [image-rendering:pixelated]"
            sizes="(max-width: 768px) 90vw, 55vw"
          />
        </div>
      ) : (
        <Image
          src={hero.src}
          alt={hero.title}
          width={1200}
          height={1200}
          className="max-w-full max-h-full w-auto h-auto"
          sizes="(max-width: 768px) 90vw, 55vw"
        />
      )}
    </Link>
  );
}
