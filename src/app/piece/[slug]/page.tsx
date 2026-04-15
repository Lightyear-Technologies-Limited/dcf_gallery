import { notFound } from "next/navigation";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import { sortPieces, getEditionType, getArtistSiteUrl } from "@/lib/curation";
import PlaceholderArt from "@/components/PlaceholderArt";
import BackButton from "@/components/BackButton";
import PieceLayout from "@/components/PieceLayout";
import JustifiedGallery from "@/components/JustifiedGallery";
import OnChainDetails from "@/components/OnChainDetails";

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

  const artistSiteUrl =
    piece.artistSiteUrl || getArtistSiteUrl(piece.collectionSlug, piece.tokenId) || undefined;

  const metadata = (
    <OnChainDetails
      contractAddress={piece.contractAddress}
      tokenId={piece.tokenId}
      editionType={getEditionType(piece.collectionSlug)}
    />
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
          artistSiteUrl={artistSiteUrl}
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
