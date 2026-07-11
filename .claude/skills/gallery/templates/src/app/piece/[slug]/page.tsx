import { notFound } from "next/navigation";
import Link from "next/link";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getPieceEditorial, getCollectionEditorial } from "@/lib/editorial";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  getPieceTraits,
  getEditionType,
  getArtistSiteUrl,
  sortPieces,
} from "@/lib/curation";
import { getDetailSrcSet, getProvenance, getOgImage } from "@/lib/provenance";
import { getArtworkImage } from "@/lib/images";
import { getMotion } from "@/lib/motion";
import PieceLayout from "@/components/PieceLayout";
import Features from "@/components/Features";
import type { Metadata } from "next";
import { SITE_URL, FUND_SHORT } from "@/lib/site";

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) return {};
  const og = getOgImage(slug);
  return {
    title: piece.title,
    openGraph: {
      title: piece.title,
      url: `${SITE_URL}/piece/${slug}`,
      images: og ? [og] : undefined,
    },
  };
}

export default async function PiecePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trait?: string; value?: string; set?: string; from?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const artist = getArtist(piece.artistSlug);
  const collection = getCollection(piece.collectionSlug);
  if (!artist || !collection) notFound();

  const artistName = getArtistDisplayName(artist.slug, artist.name);
  const collectionName = getCollectionDisplayName(collection.slug, collection.name);
  const image = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail") ?? piece.image ?? "";

  const traits = getPieceTraits(piece.slug);
  const detailSrcSet = getDetailSrcSet(piece.slug);
  const provenance = getProvenance(piece.slug);
  const motion = getMotion(piece.slug);

  // Prev/Next within the collection, preserving trait filter if present
  const cols = sortPieces(collection.slug, getPiecesByCollection(collection.slug));
  const idx = cols.findIndex((p) => p.slug === piece.slug);
  const prev = idx > 0 ? cols[idx - 1] : null;
  const next = idx >= 0 && idx < cols.length - 1 ? cols[idx + 1] : null;

  const filterQs = sp.trait && sp.value
    ? `trait=${encodeURIComponent(sp.trait)}&value=${encodeURIComponent(sp.value)}${sp.set === "1" ? "&set=1" : ""}`
    : "";
  const pieceHref = (s: string) => `/piece/${s}${filterQs ? `?${filterQs}` : ""}`;

  const editorial = getPieceEditorial(piece.slug);
  const collEditorial = getCollectionEditorial(collection.slug);

  const exhibitionsForPiece = collection.exhibitions?.filter(
    (ex) => !ex.pieces || ex.pieces.includes(piece.slug),
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-24">
      {/* Breadcrumb */}
      <p className="text-[13px] text-muted mb-6">
        <Link href="/" className="hover:text-foreground transition-colors duration-200">Collection</Link>
        <span className="mx-2 text-border">/</span>
        <Link href={`/collection/${collection.slug}`} className="hover:text-foreground transition-colors duration-200">
          {collectionName}
        </Link>
      </p>

      <PieceLayout
        title={piece.title}
        artist={artistName}
        artistSlug={artist.slug}
        collectionName={collectionName}
        collectionSlug={collection.slug}
        year={piece.year}
        image={image}
        detailSrcSet={detailSrcSet}
        medium={piece.medium}
        motionSrc={motion?.src}
        posterSrc={image}
        interactiveAspect={null}
        isPunk={collection.slug === "cryptopunks"}
        metadata={<Features traits={traits} collectionSlug={collection.slug} defaultOpen label="Attributes" />}
        exhibitionsBlock={
          exhibitionsForPiece && exhibitionsForPiece.length > 0 ? (
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">Exhibitions</p>
              <ul className="space-y-1 text-[13px] leading-snug">
                {exhibitionsForPiece.map((ex, i) => (
                  <li key={i}>
                    <span className="text-muted tabular-nums">{ex.date}</span>
                    <span className="text-muted"> — </span>
                    <span className="font-serif italic text-foreground-secondary">{ex.title}</span>
                    {ex.location && <span className="text-foreground-secondary">, {ex.location}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : undefined
        }
        onChainProps={{
          contractAddress: piece.contractAddress,
          tokenId: piece.tokenId,
          editionType: getEditionType(collection.slug),
          mintDate: piece.mintDate,
          mintPlatform: piece.mintPlatform,
          storage: provenance?.storage === "onchain" ? "On-chain" : provenance?.storage === "arweave" ? "Arweave" : provenance?.storage === "ipfs" ? "IPFS" : provenance?.storage === "centralized" ? "Centralized" : undefined,
          provenance: provenance
            ? { cid: provenance.cid, sha256: provenance.sha256, pinnedAt: provenance.pinnedAt, verifiedAt: provenance.verifiedAt }
            : undefined,
        }}
        editorialLinks={editorial?.links}
        contextLinks={editorial?.context}
        originalUri={piece.originalUri}
        artistSiteUrl={getArtistSiteUrl(collection.slug, piece.tokenId, piece.title)}
        provenance={provenance ? { cid: provenance.cid, verifiedAt: provenance.verifiedAt, sha256: provenance.sha256 } : undefined}
        description={piece.description || collEditorial?.curatorNote}
      />

      {/* Prev/Next work */}
      <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-2 min-h-[40px]">
        {prev ? (
          <Link href={pieceHref(prev.slug)} className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%]">
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200">← Previous work</span>
            <span className="font-serif text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 truncate">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={pieceHref(next.slug)} className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%] sm:items-end sm:text-right">
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200">Next work →</span>
            <span className="font-serif text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 truncate">{next.title}</span>
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
