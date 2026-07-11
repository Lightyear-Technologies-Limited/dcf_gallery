import { Suspense } from "react";
import CollectionView from "@/components/CollectionView";
import { artists, collections, getPiecesByCollection } from "@/lib/data";
import {
  getCollectionDisplayName,
  getArtistDisplayName,
  sortCollections,
  sortPieces,
  isCollectionHidden,
  getArtistOrder,
} from "@/lib/curation";

export default function HomePage() {
  const order = getArtistOrder();
  const sorted = order
    ? [
        ...(order
          .map((slug) => artists.find((a) => a.slug === slug))
          .filter(Boolean) as typeof artists),
        ...artists
          .filter((a) => !order.includes(a.slug))
          .sort((a, b) =>
            getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name)),
          ),
      ]
    : [...artists].sort((a, b) =>
        getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name)),
      );

  const sections = sorted.map((artist) => {
    const artistCollections = sortCollections(
      artist.slug,
      collections
        .filter((c) => c.artistSlug === artist.slug && !isCollectionHidden(c.slug))
        .map((col) => ({
          name: getCollectionDisplayName(col.slug, col.name),
          slug: col.slug,
          totalSupply: col.totalSupply,
          pieces: sortPieces(
            col.slug,
            getPiecesByCollection(col.slug).map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              collectionSlug: p.collectionSlug,
              artistSlug: p.artistSlug,
              contractAddress: p.contractAddress,
              tokenId: p.tokenId,
            })),
          ),
        })),
    );
    return {
      artist: { name: getArtistDisplayName(artist.slug, artist.name), slug: artist.slug },
      collections: artistCollections,
    };
  });

  return (
    <Suspense>
      <CollectionView
        sections={sections}
        artists={sorted.map((a) => ({
          name: getArtistDisplayName(a.slug, a.name),
          slug: a.slug,
          tags: a.tags,
        }))}
      />
    </Suspense>
  );
}
