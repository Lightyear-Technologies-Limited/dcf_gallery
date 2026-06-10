import Link from "next/link";
import Image from "next/image";
import { artists, getPiecesByArtist, getCollectionsByArtist } from "@/lib/data";
import { getArtistEditorial } from "@/lib/editorial";
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
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      {/* Masthead — mirrors the Chapters / Salon masthead (same component +
          display-sm scale) so the "Hivemind Digital Culture Fund" wordmark
          holds position across the index pages. */}
      <h1 className="font-serif display-sm">Hivemind Digital Culture Fund</h1>
      {/* Section title + framing copy, structured to match a Chapters chapter
          entry: the section title sits at the chapter-title scale, with a
          framing paragraph below (replacing the old "N artists" count line). */}
      <div className="mt-16 mb-16 max-w-2xl">
        <h2 className="font-serif display-lg leading-[0.95] mb-5">Artists</h2>
        {/* HOLDING COPY — placeholder, to be replaced before launch (issue #13). */}
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Hivemind Digital Culture Fund consists of {sorted.length} of the most
          prominent digital artists working today. Each anchors a chapter of
          digital art&rsquo;s first decades, and each is held with conviction
          depth rather than breadth.
        </p>
      </div>
      {sorted.map((artist, idx) => {
        const artistName = getArtistDisplayName(artist.slug, artist.name);
        const visibleCols = sortCollections(
          artist.slug,
          getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug))
        );
        const allWorks = getPiecesByArtist(artist.slug).filter(
          (p) => !isCollectionHidden(p.collectionSlug)
        );

        // Build the candidate pool - every visible piece that resolves to a
        // real image, in curation order. ArtistHero picks one and freezes
        // it for the session.
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

        // Alternate image-left and image-right across rows so the eye has
        // something to track. Eleven identical 55/45 rows read as wallpaper;
        // the cadence break gives each artist a distinct beat without losing
        // the catalogue rhythm.
        const heroOnRight = idx % 2 === 1;

        return (
          <div
            key={artist.slug}
            className="border-b border-border py-16 first:pt-8"
          >
            <div className={`grid grid-cols-1 ${heroOnRight ? "md:grid-cols-[45fr_55fr]" : "md:grid-cols-[55fr_45fr]"} gap-8 md:gap-16 items-start`}>
              {/* On odd rows the hero is on the right; markup-order stays
                  hero-first so reading order matches visual order on mobile
                  (single column), and the desktop swap is column-order only. */}
              <div className={heroOnRight ? "md:order-2" : ""}>
                <ArtistHero artistSlug={artist.slug} candidates={candidates} />
              </div>

              {/* Info */}
              <div className={`md:pt-4 ${heroOnRight ? "md:order-1" : ""}`}>
                {/* Portrait + wordmark. Portrait sits inline with the h2
                    as the artist's identity badge - small enough not to
                    compete with the artwork hero across the gutter,
                    consistent across rows so the index reads as a roster.
                    Absent portrait gracefully degrades to a plain
                    wordmark row. */}
                <Link
                  href={`/artist/${artist.slug}`}
                  className="inline-flex items-center gap-3 group"
                >
                  {artist.portrait && (
                    <Image
                      src={artist.portrait}
                      alt=""
                      width={48}
                      height={48}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  )}
                  <h3 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight group-hover:opacity-60 transition-opacity duration-200">
                    {artistName}
                  </h3>
                </Link>
                {/* Single eyebrow line - count only. The collection list used
                    to be inlined here as a comma-separated link row, but it
                    duplicated what the artist page itself does better and read
                    as filler. Cut. */}
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mt-4 tabular-nums">
                  {visibleCols.length} collection{visibleCols.length !== 1 ? "s" : ""} &middot; {allWorks.length} works
                </p>
                {(getArtistEditorial(artist.slug)?.bio ?? artist.bio) && (
                  <p className="text-[15px] text-foreground-secondary leading-[1.65] mt-6 max-w-[400px]">
                    {(getArtistEditorial(artist.slug)?.bio ?? artist.bio)}
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
