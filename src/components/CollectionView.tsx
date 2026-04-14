"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "./PlaceholderArt";
import JustifiedGallery from "./JustifiedGallery";

// Chapter colors — for section headings only
const CHAPTERS = [
  { name: "AI Art", slug: "ai-art", color: "#9B6FD0", artists: ["refik-anadol"] },
  { name: "CryptoArt", slug: "cryptoart", color: "#E05555", artists: ["xcopy", "beeple", "kim-asendorf"] },
  { name: "Digital Canvas", slug: "digital-canvas", color: "#6AAF5C", artists: ["ack", "operator", "sam-spratt"] },
  { name: "Digital Identity", slug: "digital-identity", color: "#4A9EC9", artists: ["larva-labs", "meebits"] },
  { name: "Generative Art", slug: "genart", color: "#C4956A", artists: ["tyler-hobbs", "dmitri-cherniak"] },
];

const CHAPTER_COLORS: Record<string, string> = {};
for (const ch of CHAPTERS) for (const a of ch.artists) CHAPTER_COLORS[a] = ch.color;

interface PieceData {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistSlug: string;
  medium: string;
  contractAddress?: string;
  tokenId?: string;
}

interface Section {
  artist: { name: string; slug: string };
  collections: {
    name: string;
    slug: string;
    pieces: PieceData[];
  }[];
}

interface Props {
  sections: Section[];
  artists: { name: string; slug: string; tags: string[] }[];
  totalPieces: number;
}

function ArtworkThumb({ piece, natural = false }: { piece: PieceData; natural?: boolean }) {
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  const isPunk = piece.collectionSlug === "cryptopunks";

  if (natural && realImage && !isPunk) {
    // Natural dimensions — let the artwork determine its own aspect ratio
    return (
      <Link href={`/piece/${piece.slug}`} className="block group">
        <Image
          src={realImage}
          alt={piece.title}
          width={800}
          height={800}
          className="block w-full h-auto"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </Link>
    );
  }

  return (
    <Link href={`/piece/${piece.slug}`} className="block group">
      <div className={`relative aspect-square overflow-hidden ${isPunk ? "bg-[#638596]" : ""}`}>
        {realImage ? (
          <Image
            src={realImage}
            alt={piece.title}
            fill
            className={`${isPunk ? "[image-rendering:pixelated] object-contain" : "object-cover"}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} />
        )}
      </div>
    </Link>
  );
}

export default function CollectionView({ sections, artists, totalPieces }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [artistFilter, setArtistFilter] = useState<string | null>(searchParams.get("artist") || null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(searchParams.get("chapter") || null);
  const [mediumFilter, setMediumFilter] = useState<string | null>(searchParams.get("medium") || null);

  const syncUrl = useCallback((artist: string | null, chapter: string | null, medium: string | null) => {
    const params = new URLSearchParams();
    if (artist) params.set("artist", artist);
    if (chapter) params.set("chapter", chapter);
    if (medium) params.set("medium", medium);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router]);

  // Track which artists are explicitly excluded when a chapter is active
  const [excludedArtists, setExcludedArtists] = useState<string[]>([]);

  function selectArtist(slug: string) {
    if (chapterFilter) {
      // Chapter is active — toggle this artist within the chapter
      if (excludedArtists.includes(slug)) {
        setExcludedArtists(excludedArtists.filter((a) => a !== slug));
      } else {
        setExcludedArtists([...excludedArtists, slug]);
      }
      return;
    }
    // No chapter — solo filter this artist
    setArtistFilter(artistFilter === slug ? null : slug);
    syncUrl(artistFilter === slug ? null : slug, null, mediumFilter);
  }

  function selectChapter(slug: string | null) {
    if (chapterFilter === slug) {
      // Deselect chapter
      setChapterFilter(null);
      setExcludedArtists([]);
      syncUrl(artistFilter, null, mediumFilter);
    } else {
      setChapterFilter(slug);
      setArtistFilter(null);
      setExcludedArtists([]);
      syncUrl(null, slug, mediumFilter);
    }
  }

  function selectMedium(m: string | null) {
    setMediumFilter(m);
    syncUrl(artistFilter, chapterFilter, m);
  }

  function clearAll() {
    setArtistFilter(null);
    setChapterFilter(null);
    setMediumFilter(null);
    setExcludedArtists([]);
    syncUrl(null, null, null);
  }

  useEffect(() => {
    const a = searchParams.get("artist");
    const c = searchParams.get("chapter");
    const m = searchParams.get("medium");
    if (a !== artistFilter) setArtistFilter(a);
    if (c !== chapterFilter) setChapterFilter(c);
    if (m !== mediumFilter) setMediumFilter(m);
  }, [searchParams]);

  // Apply filters
  let visible = sections;
  if (artistFilter) {
    visible = visible.filter((s) => s.artist.slug === artistFilter);
  }
  if (chapterFilter) {
    const ch = CHAPTERS.find((c) => c.slug === chapterFilter);
    if (ch) visible = visible.filter((s) => ch.artists.includes(s.artist.slug) && !excludedArtists.includes(s.artist.slug));
  }
  if (mediumFilter) {
    visible = visible.map((s) => ({
      ...s,
      collections: s.collections.map((col) => ({
        ...col,
        pieces: col.pieces.filter((p) => p.medium === mediumFilter),
      })).filter((col) => col.pieces.length > 0),
    })).filter((s) => s.collections.length > 0);
  }

  const hasFilters = artistFilter || chapterFilter || mediumFilter;

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      <div className="pt-12 sm:pt-16" />

      {/* Filters */}
      <div className="pb-6 sticky top-0 md:top-0 z-40 bg-background border-b border-border space-y-2 pt-2">
        {/* All — above everything */}
        <button
          onClick={clearAll}
          className={`text-[13px] transition-colors duration-200 ${
            !hasFilters ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          All
        </button>

        {/* Row 1: Artists */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Artist</span>
          {artists.map((a) => {
            const activeChapter = chapterFilter ? CHAPTERS.find((c) => c.slug === chapterFilter) : null;
            const inChapter = activeChapter ? activeChapter.artists.includes(a.slug) : true;
            const excluded = excludedArtists.includes(a.slug);
            const isActive = artistFilter === a.slug || (inChapter && !excluded && !!chapterFilter);
            const isDisabled = chapterFilter && !inChapter;

            return (
              <button
                key={a.slug}
                onClick={() => !isDisabled && selectArtist(a.slug)}
                className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  isDisabled
                    ? "text-muted/30 cursor-default"
                    : isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: Chapters */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium shrink-0 w-20">Chapter</span>
          {CHAPTERS.map((ch) => (
            <button
              key={ch.slug}
              onClick={() => selectChapter(chapterFilter === ch.slug ? null : ch.slug)}
              className={`text-[13px] whitespace-nowrap shrink-0 transition-colors duration-200 ${
                chapterFilter === ch.slug ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
              style={chapterFilter === ch.slug ? { color: ch.color } : undefined}
            >
              {ch.name}
            </button>
          ))}
        </div>


      </div>

      {/* Works — Salon wall. Artist header once, collections as coherent blocks. */}
      <div className="pt-6 pb-16 space-y-16">
        {visible.map(({ artist, collections: cols }) => (
          <div key={artist.slug} className="space-y-10">
            {/* Artist header */}
            <Link href={`/artist/${artist.slug}`} className="inline-block">
              <h2
                className="text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200"
                style={CHAPTER_COLORS[artist.slug] ? { color: CHAPTER_COLORS[artist.slug] } : undefined}
              >
                {artist.name}
              </h2>
            </Link>

            {cols.map((col) => {
              const n = col.pieces.length;
              // Target ideal per row — split pieces into rows at this size
              let ideal: number;
              if (n === 1) ideal = 1;
              else if (n <= 3) ideal = n;
              else if (n <= 6) ideal = 3;
              else if (n <= 12) ideal = 4;
              else ideal = 5;

              return (
                <div key={`${artist.slug}-${col.slug}`}>
                  <Link
                    href={`/collection/${col.slug}`}
                    className="text-[11px] tracking-[0.05em] text-muted hover:text-foreground transition-colors duration-200 block mb-3"
                  >
                    {col.name}
                  </Link>
                  <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
