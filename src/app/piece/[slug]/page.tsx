import { notFound } from "next/navigation";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import { sortPieces } from "@/lib/curation";
import PlaceholderArt from "@/components/PlaceholderArt";
import BackButton from "@/components/BackButton";
import PieceLayout from "@/components/PieceLayout";
import JustifiedGallery from "@/components/JustifiedGallery";

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const artist = getArtist(piece.artistSlug);
  const collection = getCollection(piece.collectionSlug);
  const colPieces = getPiecesByCollection(piece.collectionSlug);
  const orderedPieces = sortPieces(piece.collectionSlug, colPieces);
  const moreRaw = orderedPieces.filter((p) => p.id !== piece.id).slice(0, 8);
  const more = moreRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    collectionSlug: p.collectionSlug,
    artistSlug: p.artistSlug,
    medium: p.medium,
    contractAddress: p.contractAddress,
    tokenId: p.tokenId,
  }));
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  const isPunk = piece.collectionSlug === "cryptopunks";

  const rasterUrl = piece.contractAddress && piece.tokenId
    ? `https://www.raster.art/token/ethereum/${piece.contractAddress}/${piece.tokenId}`
    : undefined;

  const metadata = (
    <div className="space-y-0 text-[13px]">
      {piece.tokenId && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Token ID</span>
          <span className="font-mono tabular-nums">{piece.tokenId}</span>
        </div>
      )}
      {piece.contractAddress && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Contract</span>
          <span className="font-mono">{piece.contractAddress.slice(0, 6)}...{piece.contractAddress.slice(-4)}</span>
        </div>
      )}
      {piece.mintDate && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Minted</span>
          <span>{piece.mintDate}</span>
        </div>
      )}
      {Object.entries(piece.traits).map(([k, v]) => (
        <div key={k} className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      <BackButton />
      <div className="pt-6">
        <PieceLayout
          image={realImage}
          title={piece.title}
          isPunk={isPunk}
          artistName={artist?.name}
          artistSlug={artist?.slug}
          collectionName={collection?.name}
          collectionSlug={collection?.slug}
          metadata={metadata}
          rasterUrl={rasterUrl}
          placeholder={<PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} className="w-full h-full" />}
        />
      </div>

      {/* More from collection */}
      {more.length > 0 && collection && (
        <div className="pt-24 pb-8">
          <p className="text-[13px] text-muted mb-6">More from {collection.name}</p>
          <JustifiedGallery pieces={more} piecesPerRow={Math.min(more.length, 4)} />
        </div>
      )}
    </div>
  );
}
