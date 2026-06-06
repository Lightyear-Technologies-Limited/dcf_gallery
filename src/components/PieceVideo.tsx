"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "./MotionPreference";

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
  original,
}: {
  src: string;
  poster?: string;
  title: string;
  /** The full-resolution master source — we serve a light transcode and link
      out to the original here for anyone who wants it. (E.1) */
  original?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const { mode, reduced } = useMotion();

  // Honor the global reel preference, reactively. Never autoplay under
  // reduced-motion or on a small/mobile viewport (data). Controls always remain.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const small = window.matchMedia("(max-width: 768px)").matches;
    if (mode === "play-all" && !reduced && !small) {
      v.muted = true;
      v.play().catch(() => { /* autoplay blocked — poster + controls remain */ });
    } else {
      v.pause();
    }
  }, [mode, reduced]);

  // Reset to the still poster on demand (does NOT auto-revert — the visitor may be
  // pausing to resume). load() re-displays the poster frame.
  const reset = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    v.load();
  };

  return (
    <div>
      <div className="relative inline-block max-w-full">
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
        <button
          onClick={reset}
          title="Back to the still"
          aria-label="Back to the still"
          className="absolute right-2 top-2 z-10 border border-border bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted backdrop-blur-sm transition-colors duration-200 hover:text-foreground"
        >
          ↺ Still
        </button>
      </div>
      {original && (
        <a
          href={original}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] text-muted hover:text-foreground transition-colors duration-200"
        >
          Full-resolution original ↗
        </a>
      )}
    </div>
  );
}
