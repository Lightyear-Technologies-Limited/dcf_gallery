import type { Metadata } from "next";
import { artists, collections, getPiecesByCollection } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden, getArtistOrder, sortCollections, sortPieces } from "@/lib/curation";
import { CHAPTERS, getChapterForArtist } from "@/lib/chapters";
import ExploreIndex from "@/components/explore/ExploreIndex";
import ChaptersView from "@/components/explore/ChaptersView";
import ConstellationView from "@/components/explore/ConstellationView";
import ViewSwitcher from "@/components/explore/ViewSwitcher";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Explore the Hivemind Digital Culture Fund collection by chapter, artist, collection, medium, or search.",
};

const MERGE_INTO: Record<string, string> = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };
const VIEWS = new Set(["index", "chapters", "constellation"]);

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const view = VIEWS.has(s("view")) ? s("view") : "index";
  const viewLabel = view === "chapters" ? "Chapters" : view === "constellation" ? "Constellation" : "Index";

  // Build the flat work list in the SAME curated order the Salon (homepage) uses:
  // artist order → collection order → piece order. ExploreIndex groups works by
  // collection in first-appearance order, so a curated-contiguous traversal makes
  // the Index mirror the Salon rather than raw spreadsheet order.
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
        artistSlug: artist.slug,
        artistName,
        collectionSlug: col.slug,
        collectionName: col.name,
        chapterSlug: chapter?.slug ?? null,
        medium: p.medium,
        contractAddress: p.contractAddress,
        tokenId: p.tokenId,
      })),
    );
  });

  const dedupe = (arr: { slug: string; name: string }[]) =>
    [...new Map(arr.map((o) => [o.slug, o])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const chapters = CHAPTERS.map((c) => ({ slug: c.slug, name: c.name }));
  const artistOpts = dedupe(items.map((i) => ({ slug: i.artistSlug, name: i.artistName })));
  const collectionOpts = dedupe(items.map((i) => ({ slug: i.collectionSlug, name: i.collectionName })));
  const mediums = [...new Set(items.map((i) => i.medium))].sort();

  // Per-chapter data for the Chapters / Constellation views. The Constellation is
  // a full star-field (every work is a node); the cinematic filmstrip only needs a
  // capped selection — so we only ship the full set when that view is active.
  const chapterData = CHAPTERS.map((c) => {
    const works = items.filter((i) => i.chapterSlug === c.slug);
    return {
      slug: c.slug,
      name: c.name,
      description: c.description,
      total: works.length,
      artistNames: [...new Set(works.map((w) => w.artistName))],
      works: view === "constellation" ? works : works.slice(0, 14),
    };
  }).filter((c) => c.total > 0);

  return (
    <div>
      {/* Masthead — mirrors the Salon masthead (CollectionView): the catalogue
          names itself, and the view-switcher holds the SAME top-right position
          across / and /explore, so toggling lenses never makes it jump sides. */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="pt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <h1 className="font-serif display-sm">
            Hivemind Digital Culture Fund
            {/* Visually-hidden current-view context so the page heading tells AT
                users which lens is active, without altering the catalogue masthead. */}
            <span className="sr-only"> — {viewLabel}</span>
          </h1>
          <ViewSwitcher active={view} explicit={!!s("view")} />
        </div>
      </div>

      {view === "chapters" ? (
        <ChaptersView chapters={chapterData} />
      ) : view === "constellation" ? (
        <ConstellationView chapters={chapterData} />
      ) : (
        <ExploreIndex
          items={items}
          chapters={chapters}
          artists={artistOpts}
          collections={collectionOpts}
          mediums={mediums}
          initial={{ chapter: s("chapter"), artist: s("artist"), collection: s("collection"), medium: s("medium"), q: s("q") }}
        />
      )}
    </div>
  );
}
