import CollectionView from "@/components/CollectionView";
import { artists, collections, pieces, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import { getCollectionDisplayName, getArtistDisplayName, sortCollections, sortPieces, isCollectionHidden, getArtistOrder, getPiecesPerRow, getPieceRows, getFeaturedHeroes } from "@/lib/curation";

const MERGE_INTO: Record<string, string> = {
  "tyler-hobbs-and-dandelion-wist": "tyler-hobbs",
};

export default function HomePage() {
  const primaryArtists = artists.filter((a) => !MERGE_INTO[a.slug]);

  // Honor the curated artist order from curation.json (set by the CSV import).
  // Anything not in the order falls back to alphabetical at the end.
  const order = getArtistOrder();
  const sorted = order
    ? [
        ...order
          .map((slug) => primaryArtists.find((a) => a.slug === slug))
          .filter(Boolean) as typeof primaryArtists,
        ...primaryArtists
          .filter((a) => !order.includes(a.slug))
          .sort((a, b) =>
            getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name))
          ),
      ]
    : [...primaryArtists].sort((a, b) =>
        getArtistDisplayName(a.slug, a.name).localeCompare(getArtistDisplayName(b.slug, b.name))
      );

  const sections = sorted.map((artist) => {
    const mergedSlugs = Object.entries(MERGE_INTO)
      .filter(([, parent]) => parent === artist.slug)
      .map(([child]) => child);

    const allSlugs = [artist.slug, ...mergedSlugs];

    const artistCollections = sortCollections(
      artist.slug,
      collections
        .filter((c) => allSlugs.includes(c.artistSlug) && !isCollectionHidden(c.slug))
        .map((col) => ({
          name: getCollectionDisplayName(col.slug, col.name),
          slug: col.slug,
          piecesPerRow: getPiecesPerRow(col.slug),
          pieceRows: getPieceRows(col.slug),
          pieces: sortPieces(
            col.slug,
            getPiecesByCollection(col.slug).map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              collectionSlug: p.collectionSlug,
              artistSlug: p.artistSlug,
              medium: p.medium,
              contractAddress: p.contractAddress,
              tokenId: p.tokenId,
            }))
          ),
        }))
    );

    return {
      artist: { name: getArtistDisplayName(artist.slug, artist.name), slug: artist.slug },
      collections: artistCollections,
    };
  });

  // Build featured-hero pool from curation.json, resolving to piece + image + labels.
  const heroSlugs = getFeaturedHeroes();
  const featured = heroSlugs
    .map((slug) => {
      const p = pieces.find((pp) => pp.slug === slug);
      if (!p) return null;
      const image = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "detail");
      if (!image) return null;
      const artist = artists.find((a) => a.slug === p.artistSlug);
      const collection = collections.find((c) => c.slug === p.collectionSlug);
      return {
        slug: p.slug,
        title: p.title,
        image,
        mintDate: p.mintDate || null,
        artistName: artist ? getArtistDisplayName(artist.slug, artist.name) : "",
        artistSlug: p.artistSlug,
        collectionName: collection ? getCollectionDisplayName(collection.slug, collection.name) : "",
        collectionSlug: p.collectionSlug,
        isPunk: p.collectionSlug === "cryptopunks",
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return (
    <CollectionView
      sections={sections}
      artists={sorted.map((a) => ({ name: getArtistDisplayName(a.slug, a.name), slug: a.slug, tags: a.tags }))}
      featured={featured}
    />
  );
}
