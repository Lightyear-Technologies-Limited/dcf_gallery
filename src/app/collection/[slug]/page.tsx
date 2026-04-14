import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, getArtist, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortPieces,
  getPiecesPerRow,
  getPieceRows,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";
import CuratorNote from "@/components/CuratorNote";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = collections.find((c) => c.slug === slug);
  if (!col) notFound();

  const artist = getArtist(col.artistSlug);
  const collectionName = getCollectionDisplayName(col.slug, col.name);
  const artistName = artist ? getArtistDisplayName(artist.slug, artist.name) : null;

  const rawPieces = getPiecesByCollection(slug).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    collectionSlug: p.collectionSlug,
    artistSlug: p.artistSlug,
    medium: p.medium,
    contractAddress: p.contractAddress,
    tokenId: p.tokenId,
  }));
  const pieces = sortPieces(slug, rawPieces);

  const piecesPerRow = getPiecesPerRow(slug);
  const pieceRows = getPieceRows(slug);
  const n = pieces.length;
  const first = pieces[0];
  const heroImage =
    n === 1 && first
      ? getArtworkImage(first.slug, first.contractAddress, first.tokenId, "detail")
      : null;

  let ideal: number;
  if (piecesPerRow && piecesPerRow > 0) ideal = piecesPerRow;
  else if (n <= 3) ideal = Math.max(n, 1);
  else if (n <= 6) ideal = 3;
  else if (n <= 12) ideal = 4;
  else ideal = 5;

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Breadcrumb */}
      <div className="pt-[120px]">
        <p className="text-[13px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">
            Collection
          </Link>
          {artist && (
            <>
              {" / "}
              <Link
                href={`/artist/${artist.slug}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                {artistName}
              </Link>
            </>
          )}
          {" / "}
          {collectionName}
        </p>
      </div>

      {/* Editorial header — title left, description right */}
      <div className="pt-10 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 md:gap-16">
        <div>
          <h1 className="font-serif text-[48px] sm:text-[56px] lg:text-[64px] tracking-[-0.02em] leading-[0.95]">
            {collectionName}
          </h1>
          {artist && (
            <Link
              href={`/artist/${artist.slug}`}
              className="text-[16px] text-muted hover:text-foreground transition-colors duration-200 mt-3 inline-block"
            >
              {artistName}
            </Link>
          )}
          <div className="mt-6 space-y-1 text-[13px] text-muted">
            <p className="capitalize">
              {n} work{n === 1 ? "" : "s"} · {col.medium}
            </p>
            {col.mintDate && <p>Minted {col.mintDate}</p>}
          </div>
        </div>

        <div className="space-y-10 md:pt-4">
          {col.description && (
            <p className="text-[17px] text-foreground-secondary leading-[1.65]">
              {col.description}
            </p>
          )}
          {col.curatorNote && <CuratorNote text={col.curatorNote} variant="inline" />}
          {col.essayUrl && (
            <a
              href={col.essayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 inline-block"
            >
              Read the essay
              {col.essayTitle && (
                <>
                  : <span className="underline underline-offset-4 decoration-border">{col.essayTitle}</span>
                </>
              )}{" "}
              &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="pt-20 pb-24">
        {n === 1 && heroImage && first ? (
          <SinglePieceDisplay
            slug={first.slug}
            src={heroImage}
            title={first.title}
            isPunk={first.collectionSlug === "cryptopunks"}
          />
        ) : pieceRows && Object.keys(pieceRows).length > 0 ? (
          <FixedRowGallery pieces={pieces} rowMap={pieceRows} fallbackPerRow={ideal} />
        ) : (
          <JustifiedGallery pieces={pieces} piecesPerRow={ideal} />
        )}
      </div>
    </div>
  );
}
