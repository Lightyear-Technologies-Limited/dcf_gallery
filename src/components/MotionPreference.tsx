"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Global reel-playback preference (E.1), the motion analogue of the theme:
 * persisted to localStorage (`dcf-motion`) and shared across the app via context.
 *
 *  - "play-all"  → reels autoplay (muted, looped) while in view
 *  - "hover"     → reels play on hover (desktop); stills otherwise  [default]
 *  - "off"       → stills only
 *
 * `prefers-reduced-motion` and small/mobile viewports suppress autoplay
 * regardless of the preference (motion + data courtesy).
 */
export type MotionMode = "play-all" | "hover" | "off";
const KEY = "dcf-motion";
const DEFAULT: MotionMode = "hover";

function readMode(): MotionMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "play-all" || v === "hover" || v === "off") return v;
  } catch { /* private mode */ }
  return DEFAULT;
}

interface MotionCtx {
  mode: MotionMode;
  setMode: (m: MotionMode) => void;
  reduced: boolean;
}
const Ctx = createContext<MotionCtx | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<MotionMode>(DEFAULT);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setModeState(readMode());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setReduced(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    // Keep tabs / multiple toggles in sync.
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setModeState(readMode()); };
    window.addEventListener("storage", onStorage);
    return () => { mq.removeEventListener("change", upd); window.removeEventListener("storage", onStorage); };
  }, []);

  const setMode = useCallback((m: MotionMode) => {
    setModeState(m);
    try { localStorage.setItem(KEY, m); } catch { /* private mode */ }
  }, []);

  return <Ctx.Provider value={{ mode, setMode, reduced }}>{children}</Ctx.Provider>;
}

export function useMotion(): MotionCtx {
  return useContext(Ctx) ?? { mode: DEFAULT, setMode: () => {}, reduced: false };
}
