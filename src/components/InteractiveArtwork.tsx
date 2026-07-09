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
 * Motion-preference wiring, mirrors PieceVideo:
 *   - "play-all" → run immediately (mounts iframe on load).
 *   - "hover"    → run on pointer-enter; revert to still on pointer-leave.
 *                  Once run for the first time the iframe stays mounted and is
 *                  toggled via opacity, so subsequent hovers don't reload it.
 *   - "off"      → still only; user opts in via the "Run interactive" button.
 * Reduced-motion and small-viewport (≤768px) suppress hover / autoplay
 * regardless of the mode — the button remains available in every case.
 */
export default function InteractiveArtwork({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string | null;
  title: string;
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
  // No onLeave for interactive pieces. Unlike videos (which are passive —
  // hover-to-play + auto-pause on leave reads correctly), pxl-dex / pxl-pod /
  // Raster und Spektrum are meant to be *interacted with* — the reader is
  // clicking, dragging, moving inside the piece. Auto-stopping when the
  // pointer briefly leaves the container would rip the piece out from
  // under an active interaction. Once hovered, the piece stays live until
  // the user hits "Show still" (or the piece unmounts on navigation).

  return (
    <div className="mx-auto w-full max-w-[calc(100dvh-9rem)]">
      <div
        className="relative aspect-square w-full overflow-hidden bg-surface"
        onMouseEnter={onEnter}
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
      {/* Controls sit in a row directly under the artwork so the "Run
          interactive" affordance reads as part of the work rather than
          part of the metadata block below. Suppressed when the piece is
          already always-on (play-all mode) — the button would be dead
          chrome. Kept in hover mode as a fallback for touch and non-
          pointer devices where hover doesn't apply. */}
      {mode !== "play-all" && (
        <div className="mt-1 flex items-center gap-4 text-[13px] uppercase tracking-[0.08em] text-foreground-secondary">
          {running ? (
            <button
              onClick={() => setRunning(false)}
              className="transition-colors duration-200 hover:text-foreground"
            >
              Show still
            </button>
          ) : (
            <button
              onClick={activate}
              aria-label={`Run ${title} interactive`}
              className="flex items-center gap-2 transition-colors duration-200 hover:text-foreground"
            >
              <span aria-hidden>▶</span> Run interactive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
