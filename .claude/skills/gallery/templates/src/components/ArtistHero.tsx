"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/**
 * Artists index hero. Renders candidates[0] as the primary image, letterboxed
 * to the aspect (default 9/8 landscape). Click routes to /artist/<slug>.
 */
export default function ArtistHero({
  artistSlug,
  candidates,
  aspect = 9 / 8,
}: {
  artistSlug: string;
  candidates: { src: string; title: string; isPunk?: boolean }[];
  aspect?: number;
}) {
  const [i] = useState(0);
  if (!candidates.length) {
    return <div className="w-full bg-surface" style={{ aspectRatio: aspect }} aria-hidden />;
  }
  const c = candidates[i];
  return (
    <Link
      href={`/artist/${artistSlug}`}
      className="relative block w-full overflow-hidden"
      style={{ aspectRatio: aspect }}
    >
      <div className={`absolute inset-0 ${c.isPunk ? "bg-punk" : "bg-surface"}`}>
        <Image
          src={c.src}
          alt={c.title}
          fill
          sizes="(max-width: 1024px) 90vw, 45vw"
          className={`object-cover ${c.isPunk ? "[image-rendering:pixelated]" : ""}`}
        />
      </div>
    </Link>
  );
}
