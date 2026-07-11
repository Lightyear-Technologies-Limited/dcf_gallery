"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getMotion } from "@/lib/motion";
import { useMotion } from "./MotionPreference";

/**
 * Single grid tile. Renders the still image (as raw <img> so the gateway
 * loader can transform), overlays the motion type (video / gif / iframe)
 * based on the global Media preference. Wrapped in a Link that carries the
 * hrefSearch back-navigation param.
 */
export default function GridArtwork({
  slug,
  src,
  title,
  isPunk = false,
  hrefSearch,
  caption,
}: {
  slug: string;
  src: string;
  title: string;
  isPunk?: boolean;
  hrefSearch?: string;
  caption?: string;
}) {
  const motion = getMotion(slug);
  const { mode, reduced } = useMotion();
  const ref = useRef<HTMLAnchorElement>(null);
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

  useEffect(() => {
    if (!autoplay || !ref.current) { setInView(false); return; }
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  const show = autoplay ? inView : hoverPlay ? hovering : false;

  return (
    <Link
      ref={ref}
      id={`p-${slug}`}
      href={`/piece/${slug}${hrefSearch ? `?${hrefSearch}` : ""}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className={`relative block group ${isPunk ? "bg-punk" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        loading="lazy"
        className={`block w-full h-auto ${isPunk ? "[image-rendering:pixelated]" : ""}`}
      />
      {motion && show && motion.type === "video" && (
        <video src={motion.src} autoPlay muted loop playsInline preload="auto" aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      )}
      {motion && show && motion.type === "gif" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={motion.src} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      )}
      {motion && show && motion.type === "interactive" && (
        <iframe src={motion.src} title={title} sandbox="allow-scripts" aria-hidden tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full border-0" />
      )}
      {motion && !show && (
        <span aria-hidden title="Animated"
          className="absolute bottom-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[8px] text-white">
          ▶
        </span>
      )}
      {caption && (
        <p className="mt-2 text-[11px] text-muted tabular-nums">{caption}</p>
      )}
    </Link>
  );
}
