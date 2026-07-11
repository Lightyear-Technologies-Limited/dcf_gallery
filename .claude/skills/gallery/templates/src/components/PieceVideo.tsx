"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionPreference";

/**
 * Video piece on a piece page. Auto-plays in view / on hover per the
 * global Media preference. Muted + looping. Reduced-motion + small-viewport
 * suppress autoplay. Centered inline-block within a wrapper so the video's
 * natural aspect + max-h cap produce clean centering.
 */
export default function PieceVideo({ src, poster, title }: { src: string; poster?: string; title: string }) {
  const { mode, reduced } = useMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const upd = () => setSmall(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  const canPlay = !reduced && !small;
  const autoplay = canPlay && mode === "play-all";
  const hoverPlay = canPlay && mode === "hover";

  useEffect(() => {
    if (!autoplay || !ref.current) { setInView(false); return; }
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const should = autoplay ? inView : hoverPlay ? hovering : false;
    if (should) v.play().catch(() => {});
    else v.pause();
  }, [inView, hovering, autoplay, hoverPlay]);

  return (
    <div className="text-center" onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
        className="block w-auto h-auto max-w-full mx-auto object-contain"
        style={{ maxHeight: "calc(100dvh - 14rem)" }}
      />
    </div>
  );
}
