"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getMotion } from "@/lib/motion";
import { useMotion } from "./MotionPreference";

interface Props {
  slug: string;
  src: string;
  title: string;
  isPunk?: boolean;
  hrefSearch?: string;
}

/**
 * Single-piece collection display:
 * - Wide pieces (aspect > 1): fill container width, but never taller than
 *   the viewport minus ~14rem of chrome — matches the piece page cap so a
 *   solo hero like Raster und Spektrum doesn't dwarf the reader on tall
 *   monitors.
 * - Tall/square pieces (aspect <= 1): cap at 70vh so they don't dominate vertically
 *
 * Motion-aware (E.1), mirroring GridArtwork: for pieces with playable motion the
 * live work overlays the still per the global Reels preference — autoplaying in
 * view ("Auto"), on hover ("Hover"), or never ("Off") — as a muted/looped <video>,
 * an animated GIF, or a sandboxed <iframe> (on-chain HTML). The overlay is inert
 * (pointer-events-none): a tap still opens the piece page, where the interactive is
 * fully operable. prefers-reduced-motion and small/mobile viewports suppress play.
 */
export default function SinglePieceDisplay({ slug, src, title, isPunk = false, hrefSearch }: Props) {
  const motion = getMotion(slug);
  const { mode, reduced } = useMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [small, setSmall] = useState(false);
  const isWide = aspect !== null && aspect > 1;

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
      // Wrapper hugs the image and centres it in the row, so that when
      // max-h clamps a wide piece (Raster und Spektrum on a tall viewport)
      // the browser-reduced effective width doesn't strand the image
      // against the left edge.
      className={`relative block mx-auto w-fit max-w-full ${isPunk ? "bg-punk" : ""}`}
    >
      <Image
        src={src}
        alt={title}
        width={1600}
        height={1200}
        className={`block w-auto h-auto max-w-full object-contain ${
          isWide ? "max-h-[calc(100dvh-14rem)]" : "max-h-[70vh]"
        } ${isPunk ? "[image-rendering:pixelated] w-[400px]" : ""}`}
        // Inline style guarantees the max-height applies even if the
        // Tailwind arbitrary value doesn't make it into the built CSS
        // (JIT quirks with calc() have bitten us before on hero pieces).
        style={isPunk ? undefined : { maxHeight: isWide ? "calc(100dvh - 14rem)" : "70vh" }}
        sizes="(max-width: 1024px) 90vw, 1200px"
        onLoad={(e) => {
          const img = e.currentTarget;
          setAspect(img.naturalWidth / img.naturalHeight);
        }}
      />

      {/* Reel overlays are pointer-events-none: the still is a Link to the piece,
          and a playing <video>/<iframe> would otherwise swallow the tap — the live
          interaction belongs on the piece page, not the gallery hero. */}
      {motion && show && motion.type === "video" && (
        <video
          src={motion.src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      )}
      {motion && show && motion.type === "gif" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={motion.src} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      )}
      {motion && show && motion.type === "interactive" && (
        <iframe
          src={motion.src}
          title={title}
          sandbox="allow-scripts"
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
        />
      )}
      {motion && !show && (
        <span
          aria-hidden
          className="absolute bottom-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[8px] text-white"
          title="Animated"
        >
          ▶
        </span>
      )}
    </Link>
  );
}
