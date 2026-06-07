import type { Metadata } from "next";
import { pieces, artists, collections } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
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

  const items = pieces
    .filter((p) => !isCollectionHidden(p.collectionSlug))
    .map((p) => {
      const artistSlug = MERGE_INTO[p.artistSlug] || p.artistSlug;
      const artist = artists.find((a) => a.slug === artistSlug);
      const collection = collections.find((c) => c.slug === p.collectionSlug);
      const chapter = getChapterForArtist(artistSlug);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        artistSlug,
        artistName: artist ? getArtistDisplayName(artist.slug, artist.name) : artistSlug,
        collectionSlug: p.collectionSlug,
        collectionName: collection ? getCollectionDisplayName(collection.slug, collection.name) : p.collectionSlug,
        chapterSlug: chapter?.slug ?? null,
        medium: p.medium,
        contractAddress: p.contractAddress,
        tokenId: p.tokenId,
      };
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
          <h1 className="font-serif display-sm">Hivemind Digital Culture Fund</h1>
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
