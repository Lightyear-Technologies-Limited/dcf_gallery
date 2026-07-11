"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getMotion } from "@/lib/motion";
import { useMotion } from "./MotionPreference";

/**
 * Single-piece collection display. Single height cap (calc(100dvh - 14rem))
 * regardless of aspect — matches the piece page cap.
 *
 * Motion-aware. For pieces with a MotionEntry the live work overlays the
 * still per the global Reels preference: autoplaying in view ("Auto"),
 * on hover ("Hover"), or never ("Off"). Overlays are pointer-events-none:
 * the still is a Link to the piece page, and a playing iframe would
 * otherwise swallow the tap.
 */
interface Props {
  slug: string;
  src: string;
  title: string;
  isPunk?: boolean;
  hrefSearch?: string;
  /** Override the click target. Default is /piece/<slug>. */
  href?: string;
}

export default function SinglePieceDisplay({ slug, src, title, isPunk = false, hrefSearch, href }: Props) {
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
      href={`${href ?? `/piece/${slug}`}${hrefSearch ? `?${hrefSearch}` : ""}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className={`relative block mx-auto w-fit max-w-full ${isPunk ? "bg-punk" : ""}`}
    >
      <Image
        src={src}
        alt={title}
        width={1600}
        height={1200}
        className={`block w-auto h-auto max-w-full object-contain max-h-[calc(100dvh-14rem)] ${
          isPunk ? "[image-rendering:pixelated] w-[400px]" : ""
        }`}
        style={isPunk ? undefined : { maxHeight: "calc(100dvh - 14rem)" }}
        sizes="(max-width: 1024px) 90vw, 1200px"
      />

      {motion && show && motion.type === "video" && (
        <video src={motion.src} autoPlay muted loop playsInline preload="auto" aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      )}
      {motion && show && motion.type === "gif" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={motion.src} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
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
    </Link>
  );
}
