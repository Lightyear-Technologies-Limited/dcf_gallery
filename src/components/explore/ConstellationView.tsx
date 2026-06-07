"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getArtworkImage } from "@/lib/images";
import { hasMotion } from "@/lib/motion";

interface Work {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistName: string;
  contractAddress?: string;
  tokenId?: string;
}
interface ChapterData {
  slug: string;
  name: string;
  description: string;
  total: number;
  artistNames: string[];
  works: Work[];
}

interface Node {
  w: Work;
  x: number; // % across the field
  y: number; // % down the field
  chapter: string;
}

// Chapter anchor points (% of the field). Hand-placed so the five regions
// breathe without colliding. Sliced to the number of populated chapters.
const CENTERS = [
  { x: 21, y: 36 },
  { x: 50, y: 24 },
  { x: 80, y: 38 },
  { x: 32, y: 72 },
  { x: 70, y: 73 },
];
const GOLDEN = 2.39996323; // golden angle (rad) → even phyllotaxis disc

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Constellation view (E.3) — the whole collection as one navigable star-map. You
 * read the five chapter REGIONS first (legible label + work count); each region
 * is a phyllotaxis field of its works, joined by a faint figure line so it reads
 * as a named constellation rather than a scatter. Hover/focus a star to preview
 * the work; click to enter. Deterministic layout (no runtime randomness), static
 * (no decorative motion). Desktop-only — small screens step aside.
 */
export default function ConstellationView({ chapters }: { chapters: ChapterData[] }) {
  const [hover, setHover] = useState<Node | null>(null);

  const clusters = useMemo(() => {
    return chapters.map((c, ci) => {
      const center = CENTERS[ci] ?? { x: 50, y: 50 };
      const n = Math.max(c.works.length, 1);
      const clusterR = Math.min(22, 7 + Math.sqrt(n) * 1.1);
      const nodes: Node[] = c.works.map((w, k) => {
        const r = clusterR * Math.sqrt((k + 0.5) / n);
        const a = k * GOLDEN;
        // x radius is squeezed (~0.58) so wide fields still read as round regions.
        const x = clamp(center.x + Math.cos(a) * r * 0.58, 3.5, 96.5);
        const y = clamp(center.y + Math.sin(a) * r, 8, 92);
        return { w, x, y, chapter: c.name };
      });
      const line = nodes.map((nd) => `${nd.x},${nd.y}`).join(" ");
      const labelY = clamp(center.y - clusterR - 3, 3, 94);
      return { ...c, center, clusterR, labelY, nodes, line };
    });
  }, [chapters]);

  const totalWorks = chapters.reduce((s, c) => s + c.total, 0);

  return (
    <>
      {/* Desktop: the constellation. */}
      <div className="hidden lg:block">
        <div className="relative w-full h-[calc(100vh-200px)] min-h-[560px] overflow-hidden">
          {/* Faint constellation figure-lines (one polyline per region). */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {clusters.map((c) => (
              <polyline
                key={c.slug}
                points={c.line}
                fill="none"
                stroke="var(--foreground)"
                strokeOpacity={0.1}
                strokeWidth={0.5}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {clusters.map((c) => (
            <div key={c.slug} className="pointer-events-none absolute inset-0">
              {/* Legible region label — read the chapter + count first. */}
              <div
                className="pointer-events-auto absolute -translate-x-1/2 text-center"
                style={{ left: `${c.center.x}%`, top: `${c.labelY}%` }}
              >
                <Link
                  href={`/explore?view=index&chapter=${c.slug}`}
                  className="font-serif text-[clamp(1rem,1.5vw,1.4rem)] leading-none text-foreground-secondary hover:text-foreground transition-colors duration-200"
                  aria-label={`View all works in ${c.name}`}
                >
                  {c.name}
                </Link>
                <p className="mt-1.5 text-[10px] tracking-[0.16em] uppercase text-muted tabular-nums">{c.total} works</p>
              </div>

              {c.nodes.map((nd) => (
                <Link
                  key={nd.w.id}
                  href={`/piece/${nd.w.slug}?from=constellation`}
                  onMouseEnter={() => setHover(nd)}
                  onMouseLeave={() => setHover((h) => (h?.w.id === nd.w.id ? null : h))}
                  onFocus={() => setHover(nd)}
                  onBlur={() => setHover((h) => (h?.w.id === nd.w.id ? null : h))}
                  className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 block p-2"
                  style={{ left: `${nd.x}%`, top: `${nd.y}%` }}
                  aria-label={`${nd.w.title} — ${nd.w.artistName}, ${nd.chapter}`}
                >
                  <span className="block h-[7px] w-[7px] rounded-full bg-foreground/35 transition-colors duration-200 group-hover:bg-foreground group-focus-visible:bg-foreground" />
                </Link>
              ))}
            </div>
          ))}

          {hover && <Preview node={hover} />}
        </div>

        <p className="mt-3 text-center text-[11px] tracking-[0.14em] uppercase text-muted">
          {totalWorks} works · {clusters.length} chapters · hover a star, click to enter
        </p>
      </div>

      {/* Small screens: the constellation needs room — point elsewhere. */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-6 sm:px-8 py-24 text-center">
        <p className="font-serif text-2xl text-foreground-secondary mb-3">The Constellation is a desktop view.</p>
        <p className="text-[14px] text-muted mb-6 max-w-sm mx-auto">
          It maps the whole collection as a star-field by chapter — best explored on a larger screen.
        </p>
        <div className="flex justify-center gap-5 text-[11px] tracking-[0.12em] uppercase">
          <Link href="/explore?view=index" className="text-foreground hover:opacity-70 transition-opacity">Index</Link>
          <Link href="/explore?view=chapters" className="text-foreground hover:opacity-70 transition-opacity">Chapters</Link>
        </div>
      </div>
    </>
  );
}

/** Preview pinned near the hovered/focused star. Flips below the node when it sits
 *  high in the field so it never clips off the top. Solid surface + hairline border
 *  (no glass / shadow — house style). */
function Preview({ node }: { node: Node }) {
  const src = getArtworkImage(node.w.slug, node.w.contractAddress, node.w.tokenId, "thumb");
  const below = node.y < 32;
  const isPunk = node.w.collectionSlug === "cryptopunks";
  const reel = hasMotion(node.w.slug);
  return (
    <div
      className="pointer-events-none absolute z-20 w-44"
      style={{
        left: `${clamp(node.x, 12, 88)}%`,
        top: `${node.y}%`,
        transform: `translate(-50%, ${below ? "20px" : "calc(-100% - 20px)"})`,
      }}
    >
      <div className="border border-border bg-surface overflow-hidden">
        <div className={`relative aspect-square ${isPunk ? "bg-[#638596]" : "bg-background"}`}>
          {src && (
            <Image
              src={src}
              alt={node.w.title}
              width={400}
              height={400}
              sizes="176px"
              className={`h-full w-full ${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
            />
          )}
          {reel && (
            <span aria-hidden className="absolute bottom-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/55 text-[7px] text-white">
              ▶
            </span>
          )}
        </div>
        <div className="px-3 py-2.5">
          <p className="font-serif text-[15px] leading-tight text-foreground truncate">{node.w.title}</p>
          <p className="text-[11px] text-muted truncate mt-0.5">{node.w.artistName}</p>
          <p className="text-[9px] tracking-[0.14em] uppercase text-muted/70 mt-1.5">{node.chapter}</p>
        </div>
      </div>
    </div>
  );
}
