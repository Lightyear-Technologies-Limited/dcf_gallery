"use client";

import { useEffect, useRef } from "react";

/**
 * Piece-page video playback (E.1). Shows the still as a poster by default with
 * native controls. If the visitor has opted into "Play all" motion (localStorage
 * `dcf-motion`), the video autoplays muted + looped — but never under
 * prefers-reduced-motion or on a small/mobile viewport (data). The genuine
 * original remains one click away via the "View original" link.
 */
export default function PieceVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let pref: string | null = null;
    try { pref = localStorage.getItem("dcf-motion"); } catch { /* private mode */ }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 768px)").matches;
    if (pref === "play-all" && !reduced && !small) {
      v.muted = true;
      v.play().catch(() => { /* autoplay blocked — poster + controls remain */ });
    }
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls
      loop
      playsInline
      preload="none"
      aria-label={`${title} (video)`}
      className="block w-auto h-auto max-w-full max-h-[80vh] object-contain"
    />
  );
}
