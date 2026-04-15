import Link from "next/link";
import { artists, getPiecesByArtist, getCollectionsByArtist } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  isCollectionHidden,
  sortCollections,
  sortPieces,
} from "@/lib/curation";
import ArtistHero from "@/components/ArtistHero";

// Merge collab artists under their primary artist
const MERGE_INTO: Record<string, string> = {
  "tyler-hobbs-and-dandelion-wist": "tyler-hobbs",
};

const sorted = [...artists]
  .filter((a) => !MERGE_INTO[a.slug])
  .sort((a, b) => a.name.localeCompare(b.name));

export default function ArtistsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-16">
      {sorted.map((artist) => {
        const artistName = getArtistDisplayName(artist.slug, artist.name);
        const visibleCols = sortCollections(
          artist.slug,
          getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug))
        );
        const allWorks = getPiecesByArtist(artist.slug).filter(
          (p) => !isCollectionHidden(p.collectionSlug)
        );

        // Build the candidate pool — every visible piece that resolves to a
        // real image, in curation order. Client component picks one at random
        // on each mount.
        const candidates = visibleCols
          .flatMap((col) =>
            sortPieces(col.slug, allWorks.filter((w) => w.collectionSlug === col.slug))
          )
          .map((p) => {
            const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "detail");
            if (!src) return null;
            return { src, title: p.title, isPunk: p.collectionSlug === "cryptopunks" };
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        return (
          <div
            key={artist.slug}
            className="border-b border-border py-16 first:pt-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-8 md:gap-16 items-start">
              {/* Hero artwork — fills its column */}
              <ArtistHero artistSlug={artist.slug} candidates={candidates} />

              {/* Info */}
              <div className="md:pt-4">
                <Link
                  href={`/artist/${artist.slug}`}
                  className="inline-block group"
                >
                  <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight group-hover:opacity-60 transition-opacity duration-200">
                    {artistName}
                  </h2>
                </Link>
                <p className="text-[13px] text-muted mt-3">
                  {visibleCols.length} collection{visibleCols.length !== 1 ? "s" : ""} &middot; {allWorks.length} works
                </p>
                {visibleCols.length > 0 && (
                  <p className="text-[13px] text-muted mt-2">
                    {visibleCols.map((c, i) => (
                      <span key={c.slug}>
                        {i > 0 && ", "}
                        <Link
                          href={`/collection/${c.slug}`}
                          className="hover:text-foreground transition-colors duration-200"
                        >
                          {getCollectionDisplayName(c.slug, c.name)}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {artist.bio && (
                  <p className="text-[15px] text-foreground-secondary leading-[1.65] mt-6 max-w-[400px]">
                    {artist.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
