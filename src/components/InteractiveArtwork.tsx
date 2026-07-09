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
    <div className="mx-auto w-full max-w-[80vh]">
      <div className="relative aspect-square w-full overflow-hidden bg-surface">
        {running ? (
          <iframe
            src={src}
            title={`${title} (interactive)`}
            sandbox="allow-scripts"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          poster && (
            <Image
              src={poster}
              alt={title}
              width={1200}
              height={1200}
              sizes="(max-width: 768px) 90vw, 60vw"
              className="h-full w-full object-contain"
            />
          )
        )}
      </div>
      {/* Controls sit in a row directly under the artwork so the "Run
          interactive" affordance reads as part of the work rather than
          part of the metadata block below. Tight mt-1 gap keeps the CTA
          close to the piece it activates; the button is bumped to 13px
          + non-muted foreground so it doesn't disappear next to the
          image. */}
      <div className="mt-1 flex items-center gap-4 text-[13px] uppercase tracking-[0.08em] text-foreground-secondary">
        {running ? (
          <button
            onClick={() => setRunning(false)}
            className="transition-colors duration-200 hover:text-foreground"
          >
            Show still
          </button>
        ) : (
          <button
            onClick={() => setRunning(true)}
            aria-label={`Run ${title} interactive`}
            className="flex items-center gap-2 transition-colors duration-200 hover:text-foreground"
          >
            <span aria-hidden>▶</span> Run interactive
          </button>
        )}
      </div>
    </div>
  );
}
