import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { artists, getPiecesByArtist, getCollectionsByArtist } from "@/lib/data";

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Ten artists shaping digital art's first decades. a.c.k., Beeple, Dmitri Cherniak, Kim Asendorf, Larva Labs, Operator, Refik Anadol, Sam Spratt, Tyler Hobbs, XCOPY.",
  openGraph: {
    title: "Artists",
    description:
      "Ten artists shaping digital art's first decades. a.c.k., Beeple, Dmitri Cherniak, Kim Asendorf, Larva Labs, Operator, Refik Anadol, Sam Spratt, Tyler Hobbs, XCOPY.",
  },
};
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
  "a-c-k": "piano-blossoms-4", // Muse Blossoms
  "beeple": "superrare-beeple-24644", // TIME: The Future of Business
  "dmitri-cherniak": "superrare-dmitri-cherniak-26901", // A slight lack of symmetry 1/4
  "larva-labs": "cryptopunks-269",
  "operator": "human-unreadable-455000124",
  "refik-anadol": "synthetic-dreams-648",
  "sam-spratt": "skulls-of-luci-20", // Saturnalia Pigmentation (Skull)
  "tyler-hobbs": "tyler-hobbs-1", // Return Zero [Blue] 0.7
  "xcopy": "superrare-xcopy-2123", // Some Other Asshole
};
const HERO_COLLECTION_OVERRIDES: Record<string, string[]> = {
  "kim-asendorf": ["lights"],
};
// Optional hero frame aspect override (width/height). When present,
// ArtistHero uses the override and crops via object-cover instead of
// the default 9/8 letterbox. Kim's Lights renders at 9/8 with crop,
// matching every other hero's footprint exactly (581x516 at desktop).
const HERO_ASPECT_OVERRIDES: Record<string, number> = {
  "kim-asendorf": 9 / 8,
};

export default function ArtistsPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24 min-h-screen">
      {/* Fund name as eyebrow; subject as H1 so index pages each carry
          their own subject and the reader isn't reading the same H1 on
          every navigation. */}
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
        Hivemind Digital Culture Fund
      </p>
      <h1 className="font-serif display-sm mt-3">Artists</h1>
      <div className="mt-6 mb-8 max-w-3xl">
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Hivemind holds work by ten of the artists shaping digital art&rsquo;s first decades.
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
            className={`border-b border-border pb-16 ${idx === 0 ? "pt-4" : "pt-16"}`}
          >
            <div className={`grid grid-cols-1 ${heroOnRight ? "md:grid-cols-[45fr_55fr]" : "md:grid-cols-[55fr_45fr]"} gap-8 md:gap-16 items-start`}>
              {/* On odd rows the hero is on the right; markup-order stays
                  hero-first so reading order matches visual order on mobile
                  (single column), and the desktop swap is column-order only. */}
              <div className={heroOnRight ? "md:order-2" : ""}>
                <ArtistHero artistSlug={artist.slug} candidates={candidates} aspect={HERO_ASPECT_OVERRIDES[artist.slug]} />
              </div>

              {/* Info - on heroOnRight rows, the info column lands on
                  the LEFT (md:order-1) with the hero on the right. Default
                  left-alignment would push text content flush against the
                  page's left edge with empty space across to the hero -
                  visually disconnected. md:text-right on the wrapper
                  re-anchors the inline portrait+name Link and the
                  eyebrow label to the right edge of the column, adjacent
                  to the gutter; the bio container uses md:ml-auto +
                  md:text-left to push its block to the right edge while
                  keeping body text left-aligned for readability. */}
              <div className={`md:pt-4 ${heroOnRight ? "md:order-1" : ""}`}>
                <Link
                  href={`/artist/${artist.slug}`}
                  className="inline-flex items-center gap-3"
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
                  <h3 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200">
                    {artistName}
                  </h3>
                </Link>
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mt-4 tabular-nums">
                  {visibleCols.length} collection{visibleCols.length !== 1 ? "s" : ""} &middot; {allWorks.length} work{allWorks.length !== 1 ? "s" : ""}
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
