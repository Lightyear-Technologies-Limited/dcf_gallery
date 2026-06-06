"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getMotion } from "@/lib/motion";
import { useMotion } from "./MotionPreference";

interface Props {
  slug: string;
  title: string;
  /** The still/poster src (gateway transform of the variant). */
  imgSrc: string;
  isPunk?: boolean;
  sizes?: string;
  quality?: number;
}

/**
 * Motion-aware gallery tile (E.1). Renders the still as the base layer; for pieces
 * with playable motion it overlays the live work according to the global Reels
 * preference — autoplaying in view ("Auto"), on hover ("Hover"), or never ("Off")
 * — and by kind: a muted/looped <video> (transcode), an animated GIF <img>, or a
 * sandboxed <iframe> (on-chain HTML). prefers-reduced-motion and small/mobile
 * viewports suppress playback. The tile stays a link, so a tap opens the piece.
 */
export default function GridArtwork({ slug, title, imgSrc, isPunk = false, sizes = "500px", quality }: Props) {
  const motion = getMotion(slug);
  const { mode, reduced } = useMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
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

  const canPlay = !!motion && !reduced && !small;
  const autoplay = canPlay && mode === "play-all";
  const hoverPlay = canPlay && mode === "hover";

  // In-view tracking drives autoplay (and frees the media off-screen).
  useEffect(() => {
    if (!autoplay || !wrapRef.current) { setInView(false); return; }
    const el = wrapRef.current;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  const show = autoplay ? inView : hoverPlay ? hovering : false;
  const fit = isPunk ? "object-contain" : "object-cover";

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <Image
        src={imgSrc}
        alt={title}
        width={800}
        height={800}
        sizes={sizes}
        quality={quality}
        className={`h-full w-full ${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
      />
      {motion && show && motion.type === "video" && (
        <video
          src={motion.src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className={`absolute inset-0 h-full w-full ${fit}`}
        />
      )}
      {motion && show && motion.type === "gif" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={motion.src} alt="" aria-hidden className={`absolute inset-0 h-full w-full ${fit}`} />
      )}
      {motion && show && motion.type === "interactive" && (
        <iframe
          src={motion.src}
          title={title}
          sandbox="allow-scripts"
          aria-hidden
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
      {motion && !show && (
        <span
          aria-hidden
          className="absolute bottom-1.5 right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/45 text-[7px] text-white backdrop-blur-sm"
          title="Animated"
        >
          ▶
        </span>
      )}
    </div>
  );
}
