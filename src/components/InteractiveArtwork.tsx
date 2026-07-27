"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useMotion } from "./MotionPreference";

/**
 * On-chain interactive HTML artwork (E.1) — e.g. Kim Asendorf's generative pixel
 * works, self-contained HTML/JS. Poster-still by default (motion + reduced-motion
 * courtesy); a "Run interactive" action loads the live render into a **sandboxed**
 * iframe (`allow-scripts`, no same-origin — the art runs but is fully isolated from
 * this origin). The `src` is the **pinned gateway copy** (an https URL on
 * lightyear.myfilebase.com, allowed by the CSP `frame-src`), never the raw on-chain
 * `data:` URI: the art spawns a Web Worker from a blob URL, which browsers block in
 * a `data:`/opaque-origin document (→ black square) but run from the https origin.
 *
 * Motion-preference wiring, mirrors PieceVideo and matches the
 * collection page (SinglePieceDisplay) so the artwork behaves the
 * same way in every context:
 *   - "play-all" → run immediately (mounts iframe on load).
 *   - "hover"    → run on pointer-enter; once run for the first time the
 *                  iframe stays mounted and is toggled via opacity, so
 *                  subsequent hovers don't reload it.
 *   - "off"      → still only.
 * Reduced-motion and small-viewport (≤768px) suppress hover / autoplay.
 * No manual play/stop chrome — the reader's global Media preference is
 * the switch.
 */
export default function InteractiveArtwork({
  src,
  poster,
  title,
  aspect,
}: {
  src: string;
  poster?: string | null;
  title: string;
  /** Intrinsic aspect ratio of the piece, e.g. { w: 2400, h: 1561 } for
   *  Kim Asendorf's Raster und Spektrum. When present, the container
   *  and both layers (poster + iframe) size to this ratio instead of
   *  forcing a 1:1 square. Falls back to square for pieces without a
   *  known aspect (pxl-dex, pxl-pod, x0x). */
  aspect?: { w: number; h: number } | null;
}) {
  const [running, setRunning] = useState(false);
  const [everRun, setEverRun] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const { mode, reduced } = useMotion();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const upd = () => setIsSmall(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  const activate = useCallback(() => {
    setEverRun(true);
    setRunning(true);
  }, []);

  // Play-all: kick the iframe as soon as the artwork mounts.
  useEffect(() => {
    if (mode === "play-all" && !reduced && !isSmall) {
      activate();
    }
    if (mode === "off") setRunning(false);
  }, [mode, reduced, isSmall, activate]);

  const canHover = mode === "hover" && !reduced && !isSmall;

  const onEnter = () => {
    if (!canHover) return;
    activate();
  };
  // Hover mode reverts to still on pointer-leave so the artwork behaves
  // the same as the collection-page preview. Reader-driven interaction
  // keeps the pointer inside the container by definition; the leave
  // only fires when the reader has genuinely moved away.
  const onLeave = () => {
    if (!canHover) return;
    setRunning(false);
  };

  return (
    <div
      className="mx-auto w-full"
      style={{
        // Cap the container width so its natural height (via aspectRatio
        // below) sits inside the viewport-minus-header budget we use
        // everywhere else. For a landscape piece (Raster und Spektrum
        // 2400×1561) this reads as "max height = 100dvh - 14rem, width
        // scales to keep the piece's own aspect".
        maxWidth: aspect
          ? `calc((100dvh - 14rem) * ${aspect.w / aspect.h})`
          : "calc(100dvh - 14rem)",
      }}
    >
      <div
        className="relative w-full overflow-hidden bg-surface"
        style={{ aspectRatio: aspect ? `${aspect.w} / ${aspect.h}` : "1 / 1" }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* Iframe stays mounted after first activation and is toggled by
            opacity + pointer-events, so hovering in and out of the artwork
            doesn't reload the pinned HTML each time. */}
        {everRun && (
          <iframe
            src={src}
            title={`${title} (interactive)`}
            sandbox="allow-scripts"
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-150 ${
              running ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        )}
        {poster && (
          <Image
            src={poster}
            alt={title}
            width={1200}
            height={1200}
            sizes="(max-width: 768px) 90vw, 60vw"
            // pointer-events-none while running so mouse events fall
            // through to the iframe below (the poster is on top of the
            // iframe in DOM order — without this, the invisible poster
            // was swallowing every click and drag intended for the
            // interactive piece).
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
              running ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
        )}
      </div>
    </div>
  );
}
