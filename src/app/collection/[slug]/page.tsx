import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, getArtist, getCollectionsByArtist, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortPieces,
  sortCollections,
  isCollectionHidden,
  getPiecesPerRow,
  getPieceRows,
  getHeroLayout,
  getEditionType,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import HeroSidebarGallery from "@/components/HeroSidebarGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";
import CuratorNote from "@/components/CuratorNote";
import ExpandableProse from "@/components/ExpandableProse";
import MetadataTable from "@/components/MetadataTable";
import CopyableHash from "@/components/CopyableHash";

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

  // Find the next visible collection by the same artist for the closing link.
  const siblings = artist
    ? sortCollections(artist.slug, getCollectionsByArtist(artist.slug)).filter(
        (c) => !isCollectionHidden(c.slug)
      )
    : [];
  const idx = siblings.findIndex((c) => c.slug === slug);
  const nextSibling = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const editionType = getEditionType(slug);
  const isSingle = n === 1 && heroImage && first;

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Breadcrumb - collection only; artist link lives below the title */}
      <div className="pt-20">
        <p className="text-[13px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">
            Collection
          </Link>
          {" / "}
          {collectionName}
        </p>
      </div>

      {/* Editorial header - title left, description right. Stripped to bare on
          single-piece collections (Lights, Harbor Scene) so the SinglePieceDisplay
          can dominate. */}
      {isSingle ? (
        <div className="pt-10">
          <h1 className="font-serif display-sm">
            {collectionName}
          </h1>
          {artist && (
            <Link
              href={`/artist/${artist.slug}`}
              className="text-[20px] text-foreground-secondary hover:text-foreground transition-colors duration-200 mt-3 inline-block"
            >
              {artistName}
            </Link>
          )}

          {/* Editorial content (description, curator note, exhibitions,
              essay) was previously dropped on single-piece collections so
              the SinglePieceDisplay could dominate, but that hid substantial
              content on richly-documented collections like superrare-beeple.
              Render it in a constrained column below the title block. */}
          <div className="mt-10 space-y-10 max-w-[680px]">
            {col.description && (
              <div className="border-l border-border pl-5">
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                  About {collectionName}
                </p>
                <ExpandableProse text={col.description} />
              </div>
            )}
            {col.curatorNote && <CuratorNote text={col.curatorNote} variant="inline" />}
            {col.exhibitions && col.exhibitions.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                  Exhibitions
                </p>
                <ul className="space-y-2 text-[13px]">
                  {col.exhibitions.map((ex, i) => (
                    <li key={i}>
                      <span className="text-muted tabular-nums">{ex.date}</span>
                      <span className="text-muted"> - </span>
                      {ex.url ? (
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline decoration-transparent hover:decoration-border underline-offset-4"
                        >
                          <span className="font-serif italic">{ex.title}</span>
                          {ex.location && `, ${ex.location}`}
                        </a>
                      ) : (
                        <>
                          <span className="font-serif italic text-foreground-secondary">{ex.title}</span>
                          {ex.location && (
                            <span className="text-foreground-secondary">, {ex.location}</span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-10 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 md:gap-16">
          <div>
            <h1 className="font-serif display">
              {collectionName}
            </h1>
            {artist && (
              <Link
                href={`/artist/${artist.slug}`}
                className="text-[20px] text-foreground-secondary hover:text-foreground transition-colors duration-200 mt-3 inline-block"
              >
                {artistName}
              </Link>
            )}
            <div className="mt-6 space-y-1 text-[13px] text-muted tabular-nums">
              <p>
                {col.totalSupply
                  ? `DCF holds ${n} of ${col.totalSupply.toLocaleString()}`
                  : `${n} piece${n === 1 ? "" : "s"}`
                }
              </p>
              {col.mintDate && <p>Minted {col.mintDate}</p>}
            </div>

            {/* Institutional metadata - chain, contract, edition. Reinforces fund-grade
                posture without adding visual weight. Contract is click-to-copy. */}
            {(col.contractAddress || editionType !== "1/1") && (
              <div className="mt-8 max-w-[280px]">
                <MetadataTable
                  items={[
                    { label: "Chain", value: col.contractAddress ? "Ethereum" : null },
                    {
                      label: "Contract",
                      value: col.contractAddress ? <CopyableHash value={col.contractAddress} /> : null,
                    },
                    { label: "Type", value: editionType },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="space-y-10 md:pt-4">
            {col.description && (
              <div className="border-l border-border pl-5">
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                  About {collectionName}
                </p>
                <ExpandableProse text={col.description} />
              </div>
            )}
            {col.curatorNote && <CuratorNote text={col.curatorNote} variant="inline" />}
            {col.exhibitions && col.exhibitions.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                  Exhibitions
                </p>
                <ul className="space-y-2 text-[13px]">
                  {col.exhibitions.map((ex, i) => (
                    <li key={i}>
                      <span className="text-muted tabular-nums">{ex.date}</span>
                      <span className="text-muted"> - </span>
                      {ex.url ? (
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline decoration-transparent hover:decoration-border underline-offset-4"
                        >
                          <span className="font-serif italic">{ex.title}</span>
                          {ex.location && `, ${ex.location}`}
                        </a>
                      ) : (
                        <>
                          <span className="font-serif italic text-foreground-secondary">{ex.title}</span>
                          {ex.location && (
                            <span className="text-foreground-secondary">, {ex.location}</span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="pt-20 pb-24">
        {(() => {
          const heroLayout = getHeroLayout(slug);
          if (n === 1 && heroImage && first) {
            return (
              <SinglePieceDisplay
                slug={first.slug}
                src={heroImage}
                title={first.title}
                isPunk={first.collectionSlug === "cryptopunks"}
              />
            );
          }
          if (heroLayout) {
            return (
              <HeroSidebarGallery
                pieces={pieces}
                heroSlug={heroLayout.heroPiece}
                sidebarCols={heroLayout.sidebarCols}
                sidebarRows={heroLayout.sidebarRows}
                sidebarSlugs={heroLayout.sidebarPieces}
                fallbackPerRow={ideal}
              />
            );
          }
          if (pieceRows && Object.keys(pieceRows).length > 0) {
            return <FixedRowGallery pieces={pieces} rowMap={pieceRows} fallbackPerRow={ideal} />;
          }
          return <JustifiedGallery pieces={pieces} piecesPerRow={ideal} />;
        })()}
      </div>

      {/* Closing gesture - a single hand-off to the next collection by the
          same artist, or back up the catalogue. One link, generous space. */}
      {!isSingle && artist && (
        <div className="pt-12 pb-24 border-t border-border">
          <div className="pt-8 flex flex-col sm:flex-row sm:justify-between gap-4 text-[13px] text-muted">
            <Link
              href={`/artist/${artist.slug}`}
              className="hover:text-foreground transition-colors duration-200"
            >
              ← All works by {artistName}
            </Link>
            {nextSibling && (
              <Link
                href={`/collection/${nextSibling.slug}`}
                className="hover:text-foreground transition-colors duration-200 text-right"
              >
                Next: {getCollectionDisplayName(nextSibling.slug, nextSibling.name)} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
