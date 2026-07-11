"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useMotion } from "./MotionPreference";

/**
 * On-chain interactive HTML artwork. Poster-still by default; the live
 * render loads into a sandboxed iframe (`allow-scripts`, no same-origin).
 * The `src` must be an https URL (typically the pinned gateway copy),
 * NEVER a data: URI — browsers block blob-URL Web Workers spawned inside
 * an opaque-origin document.
 *
 * Motion-preference wiring — matches SinglePieceDisplay so the piece
 * behaves the same in every context:
 *   - "play-all" → run immediately (mounts iframe on load).
 *   - "hover"    → run on pointer-enter; revert on pointer-leave.
 *   - "off"      → still only.
 * Reduced-motion + small viewport (≤768px) suppress playback.
 * No manual play/stop chrome — the global Media preference is the switch.
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
  /** Intrinsic aspect ratio, e.g. {w: 2400, h: 1561}. When present, the
   *  container sizes to this ratio instead of forcing a 1:1 square. */
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

  useEffect(() => {
    if (mode === "play-all" && !reduced && !isSmall) activate();
    if (mode === "off") setRunning(false);
  }, [mode, reduced, isSmall, activate]);

  const canHover = mode === "hover" && !reduced && !isSmall;
  const onEnter = () => { if (canHover) activate(); };
  const onLeave = () => { if (canHover) setRunning(false); };

  return (
    <div
      className="mx-auto w-full"
      style={{
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
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
              running ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
        )}
      </div>
    </div>
  );
}
