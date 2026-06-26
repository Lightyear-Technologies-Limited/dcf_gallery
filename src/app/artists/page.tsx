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

// Pinned hero piece per artist on the Artists index. Curated by hand
// rather than rotated — rotation can be re-introduced later. Kim
// Asendorf is restricted at the collection level (any Lights piece,
// in curation order) because the spec was the collection, not a
// specific token; the rest pin to a single slug.
const HERO_PIECE_SLUGS: Record<string, string> = {
  "a-c-k": "piano-blossoms-3-40f9", // Golden Afternoon
  "beeple": "superrare-beeple-24644-b9e0", // TIME: The Future of Business
  "dmitri-cherniak": "superrare-dmitri-cherniak-26901-b9e0", // A slight lack of symmetry 1/4
  "larva-labs": "cryptopunks-269-3BBB",
  "operator": "human-unreadable-455000124-b069",
  "refik-anadol": "synthetic-dreams-648-be3a",
  "sam-spratt": "skulls-of-luci-20-d27c", // Saturnalia Pigmentation (Skull)
  "tyler-hobbs": "tyler-hobbs-1-9345", // Return Zero [Blue] 0.7
  "xcopy": "superrare-xcopy-2123-b9e0", // Some Other Asshole
};
const HERO_COLLECTION_OVERRIDES: Record<string, string[]> = {
  "kim-asendorf": ["lights"],
};

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
      <div className="mt-6 mb-8 max-w-2xl">
        <h2 className="font-serif display-sm mb-5">Artists</h2>
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Hivemind brings together ten artists whose work spans digital
          art&rsquo;s first decades.
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

        // Build the candidate pool. The hero renders candidates[0],
        // so for pinned artists we filter the pool down to the
        // chosen slug; for Kim we restrict to the Lights collection
        // and let curation order pick the first one.
        const pinnedSlug = HERO_PIECE_SLUGS[artist.slug];
        const allowedSlugs = HERO_COLLECTION_OVERRIDES[artist.slug];
        const heroCols = allowedSlugs
          ? visibleCols.filter((c) => allowedSlugs.includes(c.slug))
          : visibleCols;
        const heroWorks = pinnedSlug
          ? allWorks.filter((w) => w.slug === pinnedSlug)
          : allWorks;
        const candidates = heroCols
          .flatMap((col) =>
            sortPieces(col.slug, heroWorks.filter((w) => w.collectionSlug === col.slug))
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
            // py-12 (was py-16) - sized to the current 16:9 hero, not
            // the earlier taller 9:8 frame. py-16 left the rows feeling
            // hollow once the hero was shortened, especially the first
            // row's gap below the index lede.
            className="border-b border-border py-12"
          >
            <div className={`grid grid-cols-1 ${heroOnRight ? "md:grid-cols-[45fr_55fr]" : "md:grid-cols-[55fr_45fr]"} gap-8 md:gap-16 items-start md:items-center`}>
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
                  <p className="text-[15px] text-foreground-secondary leading-[1.65] mt-6 max-w-[440px]">
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
