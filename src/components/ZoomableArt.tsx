"use client";

import { useCallback, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const ZOOM_LEVELS = [2, 3.5];

/**
 * Inline click-to-zoom on the artwork with cursor-tracking pan. Matches
 * the Raster reference: metadata stays fixed, the artwork panel is the
 * zoom viewport. Click cycles depth (fit -> 2x -> 3.5x -> fit); once
 * zoomed, moving the cursor drives transform-origin so the reader
 * inspects any area of the work without dragging.
 *
 * Design constraints from earlier iterations:
 * - At rest (level 0) NO transform is applied. A `transform: scale(1)`
 *   wrapper forces GPU compositing on some monitors and softens the
 *   image even when not zoomed. This wrapper is invisible until zoom
 *   engages.
 * - No CSS transition on the transform. Pan updates fire on every
 *   mousemove; a transition would drag the image behind the cursor.
 *   Zoom clicks land instantly instead.
 * - overflow-hidden on the outer container clips the zoomed image to
 *   the artwork column so it doesn't overlap the metadata panel.
 */
export default function ZoomableArt({ children, className }: Props) {
  const [level, setLevel] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const cycle = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setLevel((l) => (l + 1) % (ZOOM_LEVELS.length + 1));
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (level === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin({ x, y });
    },
    [level],
  );

  const cursor =
    level === ZOOM_LEVELS.length ? "cursor-zoom-out" : "cursor-zoom-in";

  return (
    <div
      onClick={cycle}
      onMouseMove={onMove}
      className={`w-full overflow-hidden ${cursor} select-none ${className ?? ""}`}
    >
      <div
        style={
          level === 0
            ? undefined
            : {
                transform: `scale(${ZOOM_LEVELS[level - 1]})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: "none",
                willChange: "transform",
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
