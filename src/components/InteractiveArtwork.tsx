"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMotion } from "./MotionPreference";

/**
 * On-chain interactive HTML artwork (E.1) — e.g. Kim Asendorf's generative pixel
 * works, self-contained HTML/JS. Poster-still by default (motion + reduced-motion
 * courtesy); a "Run interactive" action loads the live render into a **sandboxed**
 * iframe (`allow-scripts`, no same-origin — the art runs but is fully isolated from
 * this origin). The `src` is the **pinned gateway copy** (an https URL on
 * lightyear.myfilebase.com, allowed by the CSP `frame-src`), never the raw on-chain
 * `data:` URI: the art spawns a Web Worker from a blob URL, which browsers block in
 * a `data:`/opaque-origin document (→ black square) but run from the https origin.
 */
export default function InteractiveArtwork({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string | null;
  title: string;
}) {
  const [running, setRunning] = useState(false);
  const { mode, reduced } = useMotion();

  // On "Auto", run the live work immediately (it IS the artwork); otherwise the
  // still shows with a "Run interactive" action. Mobile/reduced-motion stay still.
  useEffect(() => {
    const small = window.matchMedia("(max-width: 768px)").matches;
    if (mode === "play-all" && !reduced && !small) setRunning(true);
  }, [mode, reduced]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[80vh] overflow-hidden bg-surface">
      {running ? (
        <>
          <iframe
            src={src}
            title={`${title} (interactive)`}
            sandbox="allow-scripts"
            className="absolute inset-0 h-full w-full border-0"
          />
          <button
            onClick={() => setRunning(false)}
            className="absolute right-2 top-2 z-10 border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted transition-colors duration-200 hover:text-foreground"
          >
            Show still
          </button>
        </>
      ) : (
        <>
          {poster && (
            <Image
              src={poster}
              alt={title}
              width={1200}
              height={1200}
              sizes="(max-width: 768px) 90vw, 60vw"
              className="h-full w-full object-contain"
            />
          )}
          {/* Full-image overlay stays the click/hover target, but the visible
              label drops to ~75% down so it sits below the focal point of the
              art rather than masking its centre. */}
          <button
            onClick={() => setRunning(true)}
            aria-label={`Run ${title} interactive`}
            className="group absolute inset-0 flex items-end justify-center pb-[25%] bg-black/0 transition-colors duration-200 hover:bg-black/10"
          >
            <span className="flex items-center gap-2 border border-border bg-background px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-foreground">
              <span aria-hidden>▶</span> Run interactive
            </span>
          </button>
        </>
      )}
    </div>
  );
}
