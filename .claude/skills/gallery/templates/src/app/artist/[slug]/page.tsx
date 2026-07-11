import { notFound } from "next/navigation";
import Link from "next/link";
import { artists, getPiecesByArtist, getCollectionsByArtist } from "@/lib/data";
import { getArtistEditorial, getCollectionEditorial } from "@/lib/editorial";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  isCollectionHidden,
  sortCollections,
  sortPieces,
  getPiecesPerRow,
  getPieceRows,
  getHeroLayout,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import HeroSidebarGallery from "@/components/HeroSidebarGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";

export function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug);
  if (!artist) notFound();

  const artistName = getArtistDisplayName(artist.slug, artist.name);
  const bio = getArtistEditorial(artist.slug)?.bio ?? artist.bio;
  const cols = sortCollections(
    artist.slug,
    getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug)),
  );
  const artistFrom = `from=artist&artist=${artist.slug}`;

  const artistCollections = cols.map((col) => ({
    ...col,
    pieces: sortPieces(col.slug, getPiecesByCollection(col.slug)),
  }));

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-24">
      <p className="text-[13px] text-muted mb-4">
        <Link href="/artists" className="hover:text-foreground transition-colors duration-200">Artists</Link>
      </p>
      <h1 className="font-serif display-sm">{artistName}</h1>
      {bio && (
        <p className="mt-6 text-[16px] text-foreground-secondary leading-[1.65] max-w-2xl">
          {bio}
        </p>
      )}
      <div className="pt-8 pb-24 space-y-3">
        {artistCollections.map((col) => {
          const n = col.pieces.length;
          const piece = col.pieces[0];
          const heroImage = n === 1 && piece
            ? getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail")
            : null;
          const ideal = getPiecesPerRow(col.slug) ?? (n <= 3 ? Math.max(n, 1) : n <= 6 ? 3 : n <= 12 ? 4 : 5);
          const heroLayout = getHeroLayout(col.slug);
          const pieceRows = getPieceRows(col.slug);

          const sectionHref = `/collection/${col.slug}`;
          const colName = getCollectionDisplayName(col.slug, col.name);

          return (
            <section key={col.slug} id={col.slug}>
              <div className="flex items-baseline gap-2.5 mb-2">
                <Link href={sectionHref} className="font-serif text-[22px] sm:text-[28px] text-foreground-secondary hover:opacity-60 transition-opacity duration-200">
                  {colName}
                </Link>
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums">
                  {n} {n === 1 ? "work" : "works"}
                </span>
              </div>
              {n === 1 && heroImage && piece ? (
                <SinglePieceDisplay
                  slug={piece.slug}
                  src={heroImage}
                  title={piece.title}
                  isPunk={piece.collectionSlug === "cryptopunks"}
                  hrefSearch={artistFrom}
                  href={`/collection/${col.slug}`}
                />
              ) : heroLayout ? (
                <HeroSidebarGallery
                  pieces={col.pieces}
                  heroSlug={heroLayout.heroPiece}
                  sidebarCols={heroLayout.sidebarCols}
                  sidebarRows={heroLayout.sidebarRows}
                  sidebarSlugs={heroLayout.sidebarPieces}
                  hrefSearch={artistFrom}
                />
              ) : pieceRows ? (
                <FixedRowGallery pieces={col.pieces} pieceRows={pieceRows} hrefSearch={artistFrom} />
              ) : (
                <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} hrefSearch={artistFrom} />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
