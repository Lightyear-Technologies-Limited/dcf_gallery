"use client";

import Link from "next/link";
import { useRef } from "react";
import { getArtworkImage, getArtworkAspect } from "@/lib/images";
import PlaceholderArt from "../PlaceholderArt";
import GridArtwork from "../GridArtwork";

interface Work {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistName: string;
  artistSlug?: string;
  contractAddress?: string;
  tokenId?: string;
}

interface Props {
  name: string;
  works: Work[];
}

/**
 * Horizontal filmstrip with drag-to-scroll for pointer devices. Touch swipe
 * is native (browser handles scroll + snap); trackpad two-finger horizontal
 * scroll is native. For mouse/pen users, click-and-drag on the strip pans
 * it horizontally. A 5px click/drag threshold distinguishes a tile click
 * (navigate to /piece) from a strip drag; the click that would otherwise
 * fire on release-after-drag is suppressed so tiles never navigate as a
 * byproduct of scrolling. Scroll-snap is disabled during drag and restored
 * after so the strip settles onto tile boundaries.
 */
export default function ChapterFilmstrip({ name, works }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startScrollLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch is native (scroll + snap already work). Only mouse/pen need drag.
    if (e.pointerType === "touch") return;
    const el = scrollRef.current;
    if (!el) return;
    drag.current = {
      down: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    el.scrollLeft = drag.current.startScrollLeft - dx;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    const el = scrollRef.current;
    drag.current.down = false;
    if (el) {
      el.style.scrollSnapType = "";
      el.style.cursor = "";
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
    if (drag.current.moved) {
      // Suppress the click that would otherwise navigate the tile's Link.
      const suppress = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener("click", suppress, { once: true, capture: true });
    }
  };

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={`${name}: works (swipe or drag horizontally)`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragStart={(e) => e.preventDefault()}
      className="overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab select-none"
    >
      <div className="flex gap-3 pb-1">
        {works.map((w) => {
          const aspect = getArtworkAspect(w.slug, w.contractAddress, w.tokenId);
          const ratio = aspect ? aspect.w / aspect.h : 1;
          const src = getArtworkImage(w.slug, w.contractAddress, w.tokenId, "thumb");
          const isPunk = w.collectionSlug === "cryptopunks";
          return (
            <Link
              key={w.id}
              id={`p-${w.slug}`}
              href={`/piece/${w.slug}?from=chapters`}
              style={{ aspectRatio: `${ratio}` }}
              className={`group relative block h-[180px] sm:h-[220px] lg:h-[260px] shrink-0 overflow-hidden snap-start ${
                isPunk ? "bg-punk" : "bg-surface"
              }`}
            >
              {src ? (
                <GridArtwork slug={w.slug} title={w.title} imgSrc={src} isPunk={isPunk} sizes="320px" />
              ) : (
                <PlaceholderArt collectionSlug={w.collectionSlug} pieceSlug={w.slug} className="h-full w-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
