"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { getArtworkImage } from "@/lib/images";
import { hasMotion } from "@/lib/motion";

interface Work {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistSlug: string;
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
  artistSlug: string;
}
interface Island {
  artistSlug: string;
  artistName: string;
  count: number;
  line: string; // figure-line threading this maker's works (drawn on hover)
}
interface Cluster extends ChapterData {
  center: { x: number; y: number };
  labelTop: number; // % — anchor for the label's BOTTOM edge (grows upward)
  islands: Island[];
  nodes: Node[];
}

// Chapter anchor points (% of the field). Hand-placed so the five regions
// breathe without colliding — the two largest bodies (AI Art, Generative Art)
// get the most room. Sliced to the number of populated chapters.
const CENTERS = [
  { x: 21, y: 37 }, // AI Art          — 1 maker, ~80 works
  { x: 50, y: 25 }, // CryptoArt       — 3 makers, ~46
  { x: 80, y: 38 }, // Digital Canvas  — 3 makers, ~49
  { x: 30, y: 73 }, // Digital Identity— 1 maker, ~40
  { x: 70, y: 73 }, // Generative Art  — 2 makers, ~93
];

const GOLDEN = 2.39996323; // golden angle (rad) → even phyllotaxis disc
const SQUEEZE = 0.62; // x compression so a wide viewport still reads as round regions
const ISLAND_SCALE = 1.12; // island radius per √(work count)
const ISLAND_MAX = 12; // cap an island's radius (%)

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
// Round emitted coordinates so the SSR markup and the client match exactly —
// Math.cos/sin can differ in the last bit between engines, and an unrounded
// float in a style string is a hydration mismatch. (P3)
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Constellation view (E.3) — the whole collection as one navigable star-map, and
 * the one place the thesis is *spatial*. You read the five chapter REGIONS first
 * (legible label + count); inside each, works are grouped into ISLANDS by maker,
 * so an artist's whole body reads as a single small constellation and a chapter
 * with one artist reads, truthfully, as one island. Hover any star to trace that
 * maker — their island lights and draws its figure-line, the rest of the field
 * recedes, and a readout names them and counts the body. Click to enter.
 * Deterministic layout (no runtime randomness), static field. Desktop-only.
 */
export default function ConstellationView({ chapters }: { chapters: ChapterData[] }) {
  const [hover, setHover] = useState<Node | null>(null);

  const clusters = useMemo<Cluster[]>(() => {
    return chapters.map((c, ci) => {
      const center = CENTERS[ci] ?? { x: 50, y: 50 };

      // Group this chapter's works by maker; largest body first (stable order).
      const byArtist = new Map<string, Work[]>();
      for (const w of c.works) {
        const arr = byArtist.get(w.artistSlug);
        if (arr) arr.push(w);
        else byArtist.set(w.artistSlug, [w]);
      }
      const groups = [...byArtist.entries()]
        .map(([slug, works]) => ({ slug, works, name: works[0].artistName }))
        .sort((a, b) => b.works.length - a.works.length || a.slug.localeCompare(b.slug));

      const A = groups.length;
      const maxIslandR = Math.min(ISLAND_MAX, Math.sqrt(Math.max(...groups.map((g) => g.works.length))) * ISLAND_SCALE);
      // Spread islands on a ring around the chapter centre — tight enough that the
      // region reads as one body, loose enough that islands stay distinct. A lone
      // maker sits dead centre.
      const ringR = A <= 1 ? 0 : clamp((maxIslandR / Math.sin(Math.PI / A)) * 0.82, maxIslandR * 0.65, 12);
      const phase = ci * 0.8 - Math.PI / 2; // vary arrangement per chapter; lead island up-ish

      const islands: Island[] = [];
      const nodes: Node[] = [];
      groups.forEach((g, gi) => {
        const ang = phase + (gi / Math.max(A, 1)) * Math.PI * 2;
        const rcx = A <= 1 ? 0 : Math.cos(ang) * ringR;
        const rcy = A <= 1 ? 0 : Math.sin(ang) * ringR;
        const islandR = Math.min(ISLAND_MAX, Math.sqrt(g.works.length) * ISLAND_SCALE);
        const subCx = center.x + rcx * SQUEEZE;
        const subCy = center.y + rcy;

        const gNodes: Node[] = g.works.map((w, k) => {
          const r = islandR * Math.sqrt((k + 0.5) / g.works.length);
          const a = k * GOLDEN;
          const x = clamp(center.x + (rcx + Math.cos(a) * r) * SQUEEZE, 3.5, 96.5);
          const y = clamp(center.y + (rcy + Math.sin(a) * r), 7, 93);
          return { w, x: r2(x), y: r2(y), chapter: c.name, artistSlug: w.artistSlug };
        });

        // Figure-line: order this maker's stars by angle around their sub-centre so
        // the connecting line reads as one shape, not a spiral scribble.
        const line = [...gNodes]
          .sort((p, q) => Math.atan2(p.y - subCy, p.x - subCx) - Math.atan2(q.y - subCy, q.x - subCx))
          .map((nd) => `${nd.x},${nd.y}`)
          .join(" ");

        islands.push({ artistSlug: g.slug, artistName: g.name, count: g.works.length, line });
        nodes.push(...gNodes);
      });

      // Anchor the chapter label's BOTTOM edge just above the topmost star, so it
      // never sits on the cluster regardless of label height or viewport.
      const topY = nodes.length ? Math.min(...nodes.map((n) => n.y)) : center.y;
      const labelTop = clamp(topY - 1.5, 6, 95);
      return { ...c, center, labelTop, islands, nodes };
    });
  }, [chapters]);

  const activeArtist = hover?.w.artistSlug ?? null;
  const activeIsland = useMemo(() => {
    if (!hover) return null;
    const cl = clusters.find((c) => c.name === hover.chapter);
    return cl?.islands.find((i) => i.artistSlug === hover.w.artistSlug) ?? null;
  }, [hover, clusters]);

  const totalWorks = chapters.reduce((s, c) => s + c.total, 0);
  const totalArtists = new Set(chapters.flatMap((c) => c.works.map((w) => w.artistSlug))).size;

  return (
    <>
      {/* Desktop: the constellation. */}
      <div className="hidden lg:block">
        {/* Bypass: the field is ~308 focusable stars. Let keyboard/SR users jump
            past it to the readout in one step (WCAG 2.4.1). */}
        <a
          href="#constellation-end"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-background focus:text-foreground focus:px-3 focus:py-2 focus:border focus:border-border focus:text-[13px]"
        >
          Skip the star-field
        </a>
        <div className="relative w-full h-[calc(100vh-200px)] min-h-[560px] overflow-hidden">
          {/* Maker figure-lines — one per island, drawn only for the traced maker. */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {clusters.flatMap((c) =>
              c.islands.map((isl) => {
                const on = activeArtist === isl.artistSlug;
                return (
                  <polyline
                    key={`${c.slug}-${isl.artistSlug}`}
                    points={isl.line}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeOpacity={on ? 0.4 : 0}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    className="transition-[stroke-opacity] duration-300"
                  />
                );
              }),
            )}
          </svg>

          {clusters.map((c) => {
            const dimRegion = activeArtist != null && !c.islands.some((i) => i.artistSlug === activeArtist);
            return (
              <div key={c.slug} className="pointer-events-none absolute inset-0">
                {/* Legible region label — read the chapter + count first. Anchored
                    by its bottom edge above the cluster (translate -100% in y). */}
                <div
                  className="pointer-events-auto absolute text-center transition-opacity duration-200"
                  style={{ left: `${c.center.x}%`, top: `${c.labelTop}%`, transform: "translate(-50%, -100%)", opacity: dimRegion ? 0.4 : 1 }}
                >
                  {/* Region = chapter: a real heading so AT can navigate the field
                      by structure rather than 308 ungrouped links (WCAG 1.3.1). */}
                  <h2 className="m-0 font-serif text-[clamp(1rem,1.5vw,1.4rem)] leading-none">
                    <Link
                      href={`/explore?view=index&chapter=${c.slug}`}
                      className="text-foreground-secondary hover:text-foreground transition-colors duration-200"
                      aria-label={`View all works in ${c.name}`}
                    >
                      {c.name}
                    </Link>
                  </h2>
                  <p className="mt-1.5 text-[10px] tracking-[0.16em] uppercase text-muted tabular-nums">{c.total} works</p>
                </div>

                {c.nodes.map((nd) => (
                  <Star
                    key={nd.w.id}
                    node={nd}
                    state={activeArtist == null ? "idle" : nd.artistSlug === activeArtist ? "on" : "off"}
                    setHover={setHover}
                  />
                ))}
              </div>
            );
          })}

          {hover && <Preview node={hover} />}
        </div>

        {/* Readout — teaches the encoding at rest; names the traced body on hover.
            Also the bypass target for the "Skip the star-field" link. */}
        <p id="constellation-end" tabIndex={-1} className="mt-3 text-center text-[11px] tracking-[0.14em] uppercase text-muted tabular-nums outline-none">
          {activeIsland ? (
            <>
              <span className="text-foreground">{activeIsland.artistName}</span> — {activeIsland.count}{" "}
              {activeIsland.count === 1 ? "work" : "works"} · {hover?.chapter}
            </>
          ) : (
            <>
              {totalWorks} works · {totalArtists} artists · {clusters.length} chapters — hover to trace a body of work
            </>
          )}
        </p>
      </div>

      {/* Small screens: the constellation needs room — point elsewhere. */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-6 sm:px-8 py-24 text-center">
        <p className="font-serif text-2xl text-foreground-secondary mb-3">The Constellation is a desktop view.</p>
        <p className="text-[14px] text-muted mb-6 max-w-sm mx-auto">
          It maps the whole collection as a star-field — five chapter regions, each made of its artists — best explored on a larger screen.
        </p>
        <div className="flex justify-center gap-5 text-[11px] tracking-[0.12em] uppercase">
          <Link href="/explore?view=index" className="text-foreground hover:opacity-70 transition-opacity">Index</Link>
          <Link href="/explore?view=chapters" className="text-foreground hover:opacity-70 transition-opacity">Chapters</Link>
        </div>
      </div>
    </>
  );
}

/** One star. Memoized so sweeping the field only re-renders nodes whose state
 *  actually changes (idle/on/off) — not all ~308 on every pointer move (L6).
 *  Handlers close over the stable `node` and `setHover`, so props stay referentially
 *  steady and `memo` can do its job. `prefetch={false}`: a screen full of stars must
 *  not prefetch ~308 piece routes on load (M8). */
type StarState = "idle" | "on" | "off";
const Star = memo(function Star({
  node,
  state,
  setHover,
}: {
  node: Node;
  state: StarState;
  setHover: Dispatch<SetStateAction<Node | null>>;
}) {
  return (
    <Link
      href={`/piece/${node.w.slug}?from=constellation`}
      prefetch={false}
      onMouseEnter={() => setHover(node)}
      onMouseLeave={() => setHover((h) => (h?.w.id === node.w.id ? null : h))}
      onFocus={() => setHover(node)}
      onBlur={() => setHover((h) => (h?.w.id === node.w.id ? null : h))}
      className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 block p-2.5"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      aria-label={`${node.w.title} — ${node.w.artistName}, ${node.chapter}`}
    >
      <span
        className={`block h-[6px] w-[6px] rounded-full transition-[background-color,opacity] duration-200 ${
          state === "on"
            ? "bg-foreground"
            : state === "off"
              ? "bg-foreground/10"
              : "bg-foreground/50 group-hover:bg-foreground"
        }`}
      />
    </Link>
  );
});

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
        <div className={`relative aspect-square ${isPunk ? "bg-punk" : "bg-background"}`}>
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
          <p className="text-[9px] tracking-[0.14em] uppercase text-muted mt-1.5">{node.chapter}</p>
        </div>
      </div>
    </div>
  );
}
