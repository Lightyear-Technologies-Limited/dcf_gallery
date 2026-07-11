"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Global playback preference for animated / interactive artworks.
 * Persisted to localStorage['gallery-motion']. Every media component
 * (SinglePieceDisplay, InteractiveArtwork, PieceVideo, GridArtwork)
 * reads from this context so a single toggle in the header governs the
 * whole site.
 *
 * Also tracks `reduced` (matchMedia prefers-reduced-motion) so accessibility
 * takes precedence over the reader's preference.
 */
export type MotionMode = "play-all" | "hover" | "off";

interface Ctx {
  mode: MotionMode;
  setMode: (m: MotionMode) => void;
  reduced: boolean;
}

const MotionContext = createContext<Ctx>({ mode: "hover", setMode: () => {}, reduced: false });

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<MotionMode>("hover");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gallery-motion");
      if (saved === "play-all" || saved === "hover" || saved === "off") setModeState(saved);
    } catch {}
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setReduced(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  const setMode = (m: MotionMode) => {
    setModeState(m);
    try { localStorage.setItem("gallery-motion", m); } catch {}
  };

  const value = useMemo(() => ({ mode, setMode, reduced }), [mode, reduced]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export const useMotion = () => useContext(MotionContext);
