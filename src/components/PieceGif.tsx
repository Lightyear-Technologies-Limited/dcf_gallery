"use client";

import { useEffect, useState } from "react";
import { useMotion } from "./MotionPreference";

/**
 * Piece-page animated-GIF playback (E.1 / XCOPY 1/1s). XCOPY's singular works are
 * animated GIFs whose motion *is* the artwork — so on the piece page they
 * auto-animate by default rather than sitting frozen on a still (unlike the
 * <video> transcodes, which stay opt-in because they're heavier). The still
 * (sharp detail variant) renders first as a placeholder and is restored when the
 * visitor has opted out of motion: prefers-reduced-motion, or the global Reels
 * preference set to "Off". A GIF can't be paused in place, so "off" simply swaps
 * the source back to the static still.
 */
export default function PieceGif({
  src,
  poster,
  lqip,
  title,
}: {
  src: string;
  poster?: string;
  lqip?: string;
  title: string;
}) {
  const { mode, reduced } = useMotion();
  // Start on the still (matches SSR), then animate after mount unless the visitor
  // opted out — so there's no hydration mismatch and no motion for reduced-motion
  // / Reels-off users.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(!reduced && mode !== "off");
  }, [mode, reduced]);

  const shown = animate ? src : poster ?? src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shown}
      alt={title}
      decoding="async"
      className="block w-auto h-auto max-w-full max-h-[80vh] object-contain"
      style={
        lqip
          ? { backgroundImage: `url(${lqip})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    />
  );
}
