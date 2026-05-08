"use client";

import { useState } from "react";

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
 */
export default function ExpandableProse({
  text,
  threshold = 280,
  className = "text-[20px] text-foreground-secondary leading-[1.6]",
}: Props) {
  const [open, setOpen] = useState(false);

  if (text.length <= threshold) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className="space-y-2">
      <p className={`${className} ${open ? "" : "line-clamp-3"}`}>{text}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[13px] text-muted hover:text-foreground transition-colors duration-200"
      >
        {open ? "Read less" : "Read more"}
      </button>
    </div>
  );
}
