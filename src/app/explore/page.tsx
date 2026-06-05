import type { Metadata } from "next";
import { pieces, artists, collections } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
import { CHAPTERS, getChapterForArtist } from "@/lib/chapters";
import ExploreIndex from "@/components/explore/ExploreIndex";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Explore the Hivemind Digital Culture Fund collection by chapter, artist, collection, medium, or search.",
};

const MERGE_INTO: Record<string, string> = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
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

  return (
    <ExploreIndex
      items={items}
      chapters={chapters}
      artists={artistOpts}
      collections={collectionOpts}
      mediums={mediums}
      initial={{ chapter: s("chapter"), artist: s("artist"), collection: s("collection"), medium: s("medium"), q: s("q") }}
    />
  );
}
