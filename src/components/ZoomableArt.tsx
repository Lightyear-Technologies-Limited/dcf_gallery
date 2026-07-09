"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: React.ReactNode;
  /** Src for the zoomed / fullscreen view. Should be the highest-quality
   *  source available (sharp 1920w webp for detail-set pieces, the
   *  animated GIF url for GIFs, the SVG url for Punks). If omitted, the
   *  artwork is not zoom-clickable (video + interactive pieces skip). */
  fullscreenSrc?: string;
  fullscreenAlt: string;
  /** Preserve pixelated rendering in the zoomed view (Punks + Kim
   *  Asendorf pixel art). */
  pixelated?: boolean;
  className?: string;
}

const ZOOM_LEVELS = [2, 3.5];

/**
 * Click artwork -> opens a full-viewport zoom overlay. Inside the overlay,
 * mouse movement pans (transform-origin tracks the cursor), a click cycles
 * the zoom depth (2x -> 3.5x -> reset), Escape or backdrop-click exits.
 * The artwork at rest has NO transform applied so its native rendering is
 * preserved (a `transform: scale(1)` wrapper forces GPU compositing on
 * some monitors and introduces sub-pixel blur even at rest).
 */
export default function ZoomableArt({ children, fullscreenSrc, fullscreenAlt, pixelated, className }: Props) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const openZoom = useCallback(() => {
    if (!fullscreenSrc) return;
    setLevel(0);
    setOrigin({ x: 50, y: 50 });
    setOpen(true);
  }, [fullscreenSrc]);

  const close = useCallback(() => {
    setOpen(false);
    setLevel(0);
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  }, []);

  const onZoomClick = useCallback((e: React.MouseEvent) => {
    // Don't propagate to backdrop-close; cycle zoom depth in place.
    e.stopPropagation();
    setLevel((l) => (l + 1) % (ZOOM_LEVELS.length + 1));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const scale = level === 0 ? 1 : ZOOM_LEVELS[level - 1];

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <div
        onClick={openZoom}
        className={`w-full ${fullscreenSrc ? "cursor-zoom-in" : ""} select-none`}
      >
        {children}
      </div>
      {fullscreenSrc && (
        <button
          type="button"
          onClick={openZoom}
          className="text-muted hover:text-foreground transition-colors duration-200 text-[16px] leading-none p-1"
          aria-label="View fullscreen"
          title="View fullscreen"
        >
          ⛶
        </button>
      )}
      {open && fullscreenSrc && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={close}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <div
              onClick={onZoomClick}
              onMouseMove={onMove}
              className={`w-screen h-screen flex items-center justify-center overflow-hidden ${
                level === ZOOM_LEVELS.length ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullscreenSrc}
                alt={fullscreenAlt}
                draggable={false}
                className={`max-w-[96vw] max-h-[96vh] object-contain ${pixelated ? "[image-rendering:pixelated]" : ""}`}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                  // No transition — pan updates fire on every mousemove;
                  // a CSS transition here would make the cursor drag the
                  // image behind it by the transition duration. Zoom
                  // clicks land instantly instead of animating, which
                  // matches the snappy feel of the Raster reference.
                  transition: "none",
                  willChange: "transform",
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
