import Link from "next/link";
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
import { FUND_NAME } from "@/lib/site";

const sortedArtists = [...artists].sort((a, b) => a.name.localeCompare(b.name));

export default function ArtistsPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      <h1 className="font-serif display-sm">{FUND_NAME}</h1>
      <div className="mt-6 mb-8 max-w-3xl">
        <h2 className="font-serif display-sm mb-5">Artists</h2>
      </div>
      {sortedArtists.map((artist, idx) => {
        const artistName = getArtistDisplayName(artist.slug, artist.name);
        const visibleCols = sortCollections(
          artist.slug,
          getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug)),
        );
        const allWorks = getPiecesByArtist(artist.slug).filter(
          (p) => !isCollectionHidden(p.collectionSlug),
        );
        const candidates = allWorks
          .flatMap((p) => {
            const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "detail");
            if (!src) return [];
            return [{ src, title: p.title, isPunk: p.collectionSlug === "cryptopunks" }];
          })
          .slice(0, 3);
        const heroOnRight = idx % 2 === 1;
        return (
          <div key={artist.slug} className={`border-b border-border pb-16 ${idx === 0 ? "pt-4" : "pt-16"}`}>
            <div className={`grid grid-cols-1 ${heroOnRight ? "md:grid-cols-[45fr_55fr]" : "md:grid-cols-[55fr_45fr]"} gap-8 md:gap-16 items-start`}>
              <div className={heroOnRight ? "md:order-2" : ""}>
                <ArtistHero artistSlug={artist.slug} candidates={candidates} />
              </div>
              <div className={`md:pt-4 ${heroOnRight ? "md:order-1" : ""}`}>
                <Link href={`/artist/${artist.slug}`} className="inline-flex items-center gap-3">
                  <h3 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200">
                    {artistName}
                  </h3>
                </Link>
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mt-4 tabular-nums">
                  {visibleCols.length} collection{visibleCols.length !== 1 ? "s" : ""} &middot; {allWorks.length} work{allWorks.length !== 1 ? "s" : ""}
                </p>
                {(getArtistEditorial(artist.slug)?.bio ?? artist.bio) && (
                  <p className="text-[15px] text-foreground-secondary leading-[1.65] mt-6 max-w-[440px]">
                    {getArtistEditorial(artist.slug)?.bio ?? artist.bio}
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
