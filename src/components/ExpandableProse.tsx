"use client";

import { useId, useRef, useState } from "react";

interface Props {
  text: string;
  /** Threshold in characters above which the prose collapses by default. */
  threshold?: number;
  /** Tailwind classes for the prose styling. */
  className?: string;
}

/**
 * Long-form prose that line-clamps to ~3 lines and discloses the rest
 * behind a "Read more" toggle. Short prose (under threshold) renders
 * verbatim with no toggle. Server-rendered text is preserved on first
 * paint; the toggle is purely client-side.
 *
 * Collapse behaviour: when "Read less" fires, the block scrolls back into
 * view so the reader isn't stranded mid-gallery after the prose above
 * them shrinks. Without this the page reflows under their scroll position
 * and they end up in a random place on the page.
 */
export default function ExpandableProse({
  text,
  threshold = 280,
  className = "text-[20px] text-foreground-secondary leading-[1.6] whitespace-pre-line",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const proseId = useId();

  if (text.length <= threshold) {
    return <p className={className}>{text}</p>;
  }

  const handleToggle = () => {
    const willCollapse = open;
    setOpen((v) => !v);
    if (willCollapse) {
      // After React commits the collapsed state, scroll the block back to
      // the top of the viewport so the reader stays anchored to the prose
      // they were reading, not to whatever the gallery reflowed into.
      requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <p id={proseId} className={`${className} ${open ? "" : "line-clamp-3"}`}>{text}</p>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={proseId}
        className="text-[13px] text-muted hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 transition-colors duration-200"
      >
        {open ? "Read less" : "Read more"}
      </button>
    </div>
  );
}
