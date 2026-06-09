"use client";

import { useEffect } from "react";

/**
 * Restores scroll position when a page is reached via an anchored Back link
 * (`#p-<pieceSlug>`, emitted by the piece page's breadcrumb). The galleries lay
 * out asynchronously — justified rows measure their container width, aspects and
 * images settle after mount — so a one-shot native hash scroll lands short of the
 * final position. This re-scrolls to the target tile until its document position
 * stops moving, then stops. No-ops on a normal visit (no `#p-` hash), so a fresh
 * page load is never hijacked.
 */
export default function ScrollRestore() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#p-")) return;
    const id = decodeURIComponent(hash.slice(1));

    let tries = 0;
    let lastTop = NaN;
    let timer = 0;
    const settle = () => {
      const el = document.getElementById(id);
      if (el) {
        // Absolute document position; when it stops changing, layout has settled.
        const absTop = el.getBoundingClientRect().top + window.scrollY;
        el.scrollIntoView({ block: "center" });
        if (Number.isFinite(lastTop) && Math.abs(absTop - lastTop) < 2 && tries > 2) return;
        lastTop = absTop;
      }
      // ~3s ceiling (60 × 50ms) covers the slowest justified-gallery settle.
      if (tries++ < 60) timer = window.setTimeout(settle, 50);
    };
    timer = window.setTimeout(settle, 40);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
