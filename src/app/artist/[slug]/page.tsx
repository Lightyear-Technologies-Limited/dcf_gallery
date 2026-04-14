import { notFound } from "next/navigation";
import Link from "next/link";
import { artists, collections, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortCollections,
  sortPieces,
  isCollectionHidden,
  getPiecesPerRow,
  getPieceRows,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";

const MERGE_INTO: Record<string, string> = {
  "tyler-hobbs-and-dandelion-wist": "tyler-hobbs",
};

export function generateStaticParams() {
  return artists
    .filter((a) => !MERGE_INTO[a.slug])
    .map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug);
  if (!artist) notFound();

  const artistName = getArtistDisplayName(artist.slug, artist.name);

  // Include merged artists (e.g., Dandelion Wist under Tyler Hobbs).
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
        description: col.description,
        medium: col.medium,
        mintDate: col.mintDate,
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

  const totalWorks = artistCollections.reduce((s, c) => s + c.pieces.length, 0);

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Editorial header — name left, bio right */}
      <div className="pt-20 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 md:gap-16">
        <div>
          <h1 className="font-serif text-[48px] sm:text-[64px] lg:text-[72px] tracking-[-0.02em] leading-[0.95]">
            {artistName}
          </h1>
          <p className="mt-4 text-[13px] text-muted">
            {artistCollections.length} collection
            {artistCollections.length === 1 ? "" : "s"} · {totalWorks} works
          </p>
          {(artist.website || artist.twitter || artist.instagram) && (
            <div className="flex flex-wrap gap-6 mt-4 text-[13px]">
              {artist.website && (
                <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Website
                </a>
              )}
              {artist.twitter && (
                <a href={artist.twitter} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Twitter
                </a>
              )}
              {artist.instagram && (
                <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-10 md:pt-4">
          {artist.bio && (
            <p className="text-[17px] text-foreground-secondary leading-[1.65]">{artist.bio}</p>
          )}
          {artist.curationComment && (
            <div>
              <p className="text-[13px] text-muted mb-3">Why DCF holds this work</p>
              <p className="font-serif text-[17px] leading-[1.65] text-foreground-secondary italic">
                {artist.curationComment}
              </p>
              {artist.essayUrl && (
                <a
                  href={artist.essayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-4 inline-block"
                >
                  Read the essay
                  {artist.essayTitle && (
                    <>
                      : <span className="underline underline-offset-4 decoration-border">{artist.essayTitle}</span>
                    </>
                  )}{" "}
                  &rarr;
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Artist quote — pull quote between header and collections */}
      {artist.artistQuote && (
        <div className="pt-16 max-w-[820px] mx-auto">
          <p className="font-serif italic text-[24px] sm:text-[28px] leading-[1.4] text-foreground-secondary text-center">
            “{artist.artistQuote}”
          </p>
          <p className="text-[13px] text-muted text-center mt-6">— {artistName}</p>
        </div>
      )}

      {/* Collections — each as an editorial block above its gallery */}
      <div className="pt-16 pb-24 space-y-20">
        {artistCollections.map((col) => {
          const n = col.pieces.length;
          const piece = col.pieces[0];
          const heroImage =
            n === 1 && piece
              ? getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail")
              : null;

          let ideal: number;
          if (col.piecesPerRow && col.piecesPerRow > 0) ideal = col.piecesPerRow;
          else if (n <= 3) ideal = Math.max(n, 1);
          else if (n <= 6) ideal = 3;
          else if (n <= 12) ideal = 4;
          else ideal = 5;

          return (
            <section key={col.slug}>
              {/* Editorial block — title left, description right */}
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-16 mb-10">
                <div>
                  <Link
                    href={`/collection/${col.slug}`}
                    className="font-serif text-[28px] sm:text-[32px] tracking-[-0.01em] leading-[1.05] hover:opacity-60 transition-opacity duration-200 inline-block"
                  >
                    {col.name}
                  </Link>
                  <p className="text-[13px] text-muted mt-3 capitalize">
                    {n} work{n === 1 ? "" : "s"} · {col.medium}
                    {col.mintDate && ` · ${col.mintDate.slice(0, 4)}`}
                  </p>
                </div>
                <div className="md:pt-3">
                  {col.description && (
                    <p className="text-[16px] text-foreground-secondary leading-[1.65]">
                      {col.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Gallery */}
              {n === 1 && heroImage && piece ? (
                <SinglePieceDisplay
                  slug={piece.slug}
                  src={heroImage}
                  title={piece.title}
                  isPunk={piece.collectionSlug === "cryptopunks"}
                />
              ) : col.pieceRows && Object.keys(col.pieceRows).length > 0 ? (
                <FixedRowGallery
                  pieces={col.pieces}
                  rowMap={col.pieceRows}
                  fallbackPerRow={ideal}
                />
              ) : (
                <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
