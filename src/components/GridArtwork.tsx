"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getVideoSrc } from "@/lib/videos";
import { useMotion } from "./MotionPreference";

interface Props {
  slug: string;
  title: string;
  /** The still/poster src (gateway transform of the variant). */
  imgSrc: string;
  isPunk?: boolean;
  sizes?: string;
}

/**
 * Motion-aware gallery tile (E.1). Renders the still as the base layer; for video
 * pieces it overlays a muted/looped reel according to the global motion preference:
 *  - "play-all": autoplays while in view (paused + unmounted off-screen)
 *  - "hover": plays on hover (desktop)
 *  - "off" / reduced-motion / small viewport: still only
 * A small glyph marks reels. The tile remains a link to the piece (the parent
 * wraps this), so on touch a tap opens the piece where the reel plays full.
 */
export default function GridArtwork({ slug, title, imgSrc, isPunk = false, sizes = "500px" }: Props) {
  const video = getVideoSrc(slug);
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

  const autoplay = !!video && mode === "play-all" && !reduced && !small;
  const hoverPlay = !!video && mode === "hover" && !reduced && !small;

  // In-view tracking drives autoplay (and frees the <video> off-screen).
  useEffect(() => {
    if (!autoplay || !wrapRef.current) { setInView(false); return; }
    const el = wrapRef.current;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  const showVideo = autoplay ? inView : hoverPlay ? hovering : false;

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
        className={`h-full w-full ${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
      />
      {video && showVideo && (
        <video
          src={video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className={`absolute inset-0 h-full w-full ${isPunk ? "object-contain" : "object-cover"}`}
        />
      )}
      {video && !showVideo && (
        <span
          aria-hidden
          className="absolute bottom-1.5 right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/45 text-[7px] text-white backdrop-blur-sm"
          title="Reel"
        >
          ▶
        </span>
      )}
    </div>
  );
}
