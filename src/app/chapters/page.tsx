import type { Metadata } from "next";
import { artists, collections, getPiecesByCollection } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden, getArtistOrder, sortCollections, sortPieces } from "@/lib/curation";
import { CHAPTERS, getChapterForArtist } from "@/lib/chapters";
import ChaptersView from "@/components/explore/ChaptersView";
import ScrollRestore from "@/components/ScrollRestore";

export const metadata: Metadata = {
  title: "Chapters",
  description:
    "Walk the Hivemind Digital Culture Fund collection through its five curatorial chapters.",
};

const MERGE_INTO: Record<string, string> = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };

export default function ChaptersPage() {
  // Build the flat work list in the SAME curated order the Salon (homepage) uses:
  // artist order → collection order → piece order. The chapter filmstrips read in
  // that curated sequence rather than raw spreadsheet order.
  const primaryArtists = artists.filter((a) => !MERGE_INTO[a.slug]);
  const artistOrder = getArtistOrder();
  const orderedArtists = artistOrder
    ? [
        ...(artistOrder
          .map((slug) => primaryArtists.find((a) => a.slug === slug))
          .filter(Boolean) as typeof primaryArtists),
        ...primaryArtists
          .filter((a) => !artistOrder.includes(a.slug))
          .sort((a, b) =>
            getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name)),
          ),
      ]
    : [...primaryArtists].sort((a, b) =>
        getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name)),
      );

  const items = orderedArtists.flatMap((artist) => {
    const mergedSlugs = Object.entries(MERGE_INTO)
      .filter(([, parent]) => parent === artist.slug)
      .map(([child]) => child);
    const allSlugs = [artist.slug, ...mergedSlugs];
    const artistName = getArtistDisplayName(artist.slug, artist.name);
    const chapter = getChapterForArtist(artist.slug);

    const artistCollections = sortCollections(
      artist.slug,
      collections
        .filter((c) => allSlugs.includes(c.artistSlug) && !isCollectionHidden(c.slug))
        .map((c) => ({ slug: c.slug, name: getCollectionDisplayName(c.slug, c.name) })),
    );

    return artistCollections.flatMap((col) =>
      sortPieces(col.slug, getPiecesByCollection(col.slug)).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        artistName,
        artistSlug: artist.slug,
        collectionSlug: col.slug,
        chapterSlug: chapter?.slug ?? null,
        contractAddress: p.contractAddress,
        tokenId: p.tokenId,
      })),
    );
  });

  // Per-chapter data for the cinematic filmstrips. The filmstrip is a capped
  // selection; the per-chapter "View all" link reaches the full set on the Salon.
  const chapterData = CHAPTERS.map((c) => {
    const works = items.filter((i) => i.chapterSlug === c.slug);
    // Unique artists for the chapter, keyed by slug so each name can link to
    // its artist page (and a maker appearing in two collections lists once).
    const artistMap = new Map<string, string>();
    for (const w of works) {
      if (!artistMap.has(w.artistSlug)) artistMap.set(w.artistSlug, w.artistName);
    }
    return {
      slug: c.slug,
      name: c.name,
      description: c.description,
      total: works.length,
      artists: [...artistMap].map(([slug, name]) => ({ slug, name })),
      works: works.slice(0, 14),
    };
  }).filter((c) => c.total > 0);

  return (
    <div>
      <ScrollRestore />
      {/* Masthead — mirrors the Salon masthead (CollectionView) at the same
          max-w-[1600px] so the "Hivemind Digital Culture Fund" wordmark holds the
          same position when moving between Collection and Chapters. The
          "Chapters" subject heading + one-line framing match the Artists /
          About index-page pattern so the three reads as a consistent set. */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 min-h-screen">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
          Hivemind Digital Culture Fund
        </p>
        <h1 className="font-serif display-sm mt-3">Chapters</h1>
        <div className="mt-6 mb-8 max-w-2xl">
          <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
            Hivemind collects across five chapters of the digital-art canon.
          </p>
        </div>
      </div>
      <ChaptersView chapters={chapterData} />
    </div>
  );
}
