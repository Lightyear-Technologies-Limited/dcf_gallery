"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: React.ReactNode;
  /** Best-effort src for the fullscreen overlay (uses the highest-resolution
   *  candidate available). If omitted, the fullscreen button is not shown. */
  fullscreenSrc?: string;
  fullscreenAlt: string;
  /** Punks + Kim Asendorf pixel art need image-rendering: pixelated in the
   *  fullscreen overlay to preserve the hard edges. */
  pixelated?: boolean;
  /** Extra classes on the outer container. Aspect / max-height come from the
   *  caller, this component only owns overflow + cursor + click behavior. */
  className?: string;
}

const ZOOM_LEVELS = [1, 1.75, 3];

/**
 * Click-to-zoom wrapper for a piece artwork. Three states cycle on click:
 * fit (1x) -> mid (1.75x) -> deep (3x) -> fit. Zoom is centered on the click
 * point via CSS transform-origin, so the reader can inspect any detail
 * without dragging. The metadata column stays fixed (this only transforms
 * the artwork element).
 *
 * A fullscreen button below the artwork opens a black-backdrop overlay
 * for a maximum-viewport view; Escape or backdrop-click closes it.
 */
export default function ZoomableArt({ children, fullscreenSrc, fullscreenAlt, pixelated, className }: Props) {
  const [level, setLevel] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [open, setOpen] = useState(false);

  const cycle = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setLevel((l) => (l + 1) % ZOOM_LEVELS.length);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const cursor = level === ZOOM_LEVELS.length - 1 ? "cursor-zoom-out" : "cursor-zoom-in";

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <div
        onClick={cycle}
        className={`w-full overflow-hidden ${cursor} select-none`}
      >
        <div
          style={{
            transform: `scale(${ZOOM_LEVELS[level]})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: "transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {children}
        </div>
      </div>
      {fullscreenSrc && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted hover:text-foreground transition-colors duration-200 text-[16px] leading-none p-1"
          aria-label="View fullscreen"
          title="View fullscreen"
        >
          ⛶
        </button>
      )}
      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullscreenSrc}
              alt={fullscreenAlt}
              className={`max-w-[96vw] max-h-[96vh] object-contain ${pixelated ? "[image-rendering:pixelated]" : ""}`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
