"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JustifiedGallery from "../JustifiedGallery";

interface Item {
  id: string;
  slug: string;
  title: string;
  artistSlug: string;
  artistName: string;
  collectionSlug: string;
  collectionName: string;
  chapterSlug: string | null;
  medium: string;
  contractAddress?: string;
  tokenId?: string;
}
interface Opt { slug: string; name: string }
interface Props {
  items: Item[];
  chapters: Opt[];
  artists: Opt[];
  collections: Opt[];
  mediums: string[];
  initial?: { chapter?: string; artist?: string; collection?: string; medium?: string; q?: string };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Index view of the Explore experience (E.2). A persistent chapter rail + Artist
 * / Collection / Medium filters + free-text search over a re-flowing justified
 * grid. Restrained, on-brand (Gagosian/Pace viewing room); state is URL-encoded
 * so it's shareable and survives navigation.
 */
export default function ExploreIndex({ items, chapters, artists, collections, mediums, initial }: Props) {
  const router = useRouter();
  const [chapter, setChapter] = useState(initial?.chapter || "");
  const [artist, setArtist] = useState(initial?.artist || "");
  const [collection, setCollection] = useState(initial?.collection || "");
  const [medium, setMedium] = useState(initial?.medium || "");
  const [query, setQuery] = useState(initial?.q || "");

  // Justified rows want a per-row count; make it responsive (chapters/grid both
  // read it). The galleries take a fixed prop, so derive it from the viewport.
  const [perRow, setPerRow] = useState(5);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerRow(w < 640 ? 2 : w < 1024 ? 3 : w < 1400 ? 4 : 5);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const sync = useCallback(
    (s: { chapter: string; artist: string; collection: string; medium: string; q: string }) => {
      const p = new URLSearchParams({ view: "index" });
      if (s.chapter) p.set("chapter", s.chapter);
      if (s.artist) p.set("artist", s.artist);
      if (s.collection) p.set("collection", s.collection);
      if (s.medium) p.set("medium", s.medium);
      if (s.q) p.set("q", s.q);
      router.replace(`/explore?${p.toString()}`, { scroll: false });
    },
    [router],
  );

  const apply = (patch: Partial<{ chapter: string; artist: string; collection: string; medium: string; q: string }>) => {
    const next = { chapter, artist, collection, medium, q: query, ...patch };
    // Changing artist resets a now-irrelevant collection.
    if ("artist" in patch) next.collection = "";
    setChapter(next.chapter); setArtist(next.artist); setCollection(next.collection);
    setMedium(next.medium); setQuery(next.q);
    sync(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (chapter && i.chapterSlug !== chapter) return false;
      if (artist && i.artistSlug !== artist) return false;
      if (collection && i.collectionSlug !== collection) return false;
      if (medium && i.medium !== medium) return false;
      if (q && !`${i.title} ${i.artistName} ${i.collectionName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, chapter, artist, collection, medium, query]);

  // Narrow the collection options to the selected artist.
  const visibleCollections = useMemo(
    () => (artist ? collections.filter((c) => items.some((i) => i.artistSlug === artist && i.collectionSlug === c.slug)) : collections),
    [artist, collections, items],
  );

  // Group filtered pieces by collection so different collections don't run into
  // one another — a labelled break between them. Order = first appearance.
  const groups = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; artistName: string; items: Item[] }>();
    for (const it of filtered) {
      if (!map.has(it.collectionSlug))
        map.set(it.collectionSlug, { slug: it.collectionSlug, name: it.collectionName, artistName: it.artistName, items: [] });
      map.get(it.collectionSlug)!.items.push(it);
    }
    return [...map.values()];
  }, [filtered]);

  const hasFilters = chapter || artist || collection || medium || query;
  const hrefSearch = artist || collection || chapter ? "" : ""; // piece pages don't read these; keep Back clean

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-24">
      {/* View switcher — Salon (homepage) + Index. Chapters/Constellation join here. */}
      <nav className="flex gap-5 text-[11px] tracking-[0.12em] uppercase mb-8">
        <Link href="/" className="text-muted hover:text-foreground transition-colors duration-200">Salon</Link>
        <span className="text-foreground font-medium">Index</span>
      </nav>

      {/* Search + filters */}
      <div className="flex flex-col gap-4 mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => apply({ q: e.target.value })}
          placeholder="Search the collection…"
          aria-label="Search the collection"
          className="w-full max-w-md bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-[15px] placeholder:text-muted transition-colors duration-200"
        />
        <div className="flex flex-wrap gap-3 items-center">
          <Select label="Artist" value={artist} options={artists} onChange={(v) => apply({ artist: v })} />
          <Select label="Collection" value={collection} options={visibleCollections} onChange={(v) => apply({ collection: v })} />
          <Select label="Medium" value={medium} options={mediums.map((m) => ({ slug: m, name: cap(m) }))} onChange={(v) => apply({ medium: v })} />
          {hasFilters && (
            <button
              onClick={() => apply({ chapter: "", artist: "", collection: "", medium: "", q: "" })}
              className="text-[11px] tracking-[0.1em] uppercase text-muted hover:text-foreground transition-colors duration-200"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-[12px] text-muted font-mono tabular-nums">
            {filtered.length} {filtered.length === 1 ? "work" : "works"}
          </span>
        </div>
      </div>

      {/* Chapter rail (the Movement axis) */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 border-b border-border pb-4">
        <ChapterBtn active={!chapter} onClick={() => apply({ chapter: "" })}>All chapters</ChapterBtn>
        {chapters.map((c) => (
          <ChapterBtn key={c.slug} active={chapter === c.slug} onClick={() => apply({ chapter: c.slug })}>
            {c.name}
          </ChapterBtn>
        ))}
      </div>

      {/* Grid — grouped by collection so pieces don't run into one another */}
      {groups.length > 0 ? (
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.slug}>
              <div className="mb-3 flex items-baseline gap-3 border-b border-border pb-2">
                <Link
                  href={`/collection/${g.slug}`}
                  className="font-serif text-[19px] text-foreground-secondary hover:text-foreground transition-colors duration-200"
                >
                  {g.name}
                </Link>
                <span className="text-[12px] text-muted">{g.artistName}</span>
                <span className="ml-auto text-[11px] text-muted font-mono tabular-nums">{g.items.length}</span>
              </div>
              <JustifiedGallery pieces={g.items} piecesPerRow={perRow} hrefSearch={hrefSearch} maxRowHeight={420} />
            </section>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-foreground-secondary mb-3">No works match.</p>
          <button
            onClick={() => apply({ chapter: "", artist: "", collection: "", medium: "", q: "" })}
            className="text-[11px] tracking-[0.1em] uppercase text-muted hover:text-foreground transition-colors duration-200"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Opt[]; onChange: (v: string) => void }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-transparent border border-border rounded-none pl-3 pr-7 py-1.5 text-[13px] cursor-pointer hover:border-foreground focus:border-foreground outline-none transition-colors duration-200 ${value ? "text-foreground" : "text-muted"}`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>{o.name}</option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2 text-muted text-[10px]">▾</span>
    </label>
  );
}

function ChapterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] tracking-[0.04em] transition-colors duration-200 ${active ? "text-foreground font-medium" : "text-muted hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
