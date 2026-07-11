"use client";

import { useEffect } from "react";

/**
 * Scroll to a hash-anchor after client navigation (Next Link default
 * doesn't restore hash scroll on same-route transitions like filter
 * changes). Also restores an in-place scroll position for salon-origin
 * back navigation.
 */
export default function ScrollRestore() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);
  return null;
}
