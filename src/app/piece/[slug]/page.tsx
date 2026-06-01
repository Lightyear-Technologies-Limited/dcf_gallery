import { notFound } from "next/navigation";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage, resolveTokenId } from "@/lib/images";
import { sortPieces, getEditionType, getArtistSiteUrl, getPieceTraits } from "@/lib/curation";
import PlaceholderArt from "@/components/PlaceholderArt";
import BackButton from "@/components/BackButton";
import PieceLayout from "@/components/PieceLayout";
import JustifiedGallery from "@/components/JustifiedGallery";
import OnChainDetails from "@/components/OnChainDetails";
import Features from "@/components/Features";

const PUNK_CANONICAL = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const PUNK_V1 = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";

/**
 * Derive a human-readable storage label from where the artwork actually lives.
 * Used as the "Storage" row in OnChainDetails - high-signal for fund collectors
 * who care about long-term permanence.
 */
function deriveStorage(originalUri?: string, contractAddress?: string): string | undefined {
  const contract = contractAddress?.toLowerCase();
  // Punks render from on-chain pixel data; the SVG is composed client-side.
  if (contract === PUNK_CANONICAL || contract === PUNK_V1) return "On-chain";
  if (!originalUri) return undefined;
  if (originalUri.startsWith("data:")) return "On-chain";
  if (originalUri.startsWith("ipfs://")) return "IPFS";
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]+|bafk[a-z0-9]+)$/.test(originalUri)) return "IPFS";
  if (originalUri.startsWith("ar://") || originalUri.includes("arweave.net")) return "Arweave";
  if (originalUri.includes("media-proxy.artblocks.io")) return "IPFS (Art Blocks proxy)";
  if (originalUri.startsWith("https://") || originalUri.startsWith("http://")) return "Centralized";
  return undefined;
}

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

  // Marketplace link: CryptoPunks Marketplace for Punks (canonical), Raster for everything else.
  const marketplaceUrl = piece.contractAddress && piece.tokenId
    ? (isPunk
        ? `https://cryptopunks.app/cryptopunks/details/${piece.tokenId}`
        : `https://www.raster.art/token/ethereum/${piece.contractAddress}/${resolveTokenId(piece.slug, piece.contractAddress, piece.tokenId)}`)
    : undefined;

  const artistSiteUrl =
    piece.artistSiteUrl || getArtistSiteUrl(piece.collectionSlug, piece.tokenId) || undefined;

  const traits = getPieceTraits(piece.slug);
  // Collections where traits carry curatorial weight (palette, scale, mood,
  // origin) - open the Features panel by default. Others stay collapsed.
  const HIGH_SIGNAL_TRAITS = new Set([
    "fidenza",
    "ringers",
    "human-unreadable",
    "winds-of-yawanawa",
    "dataland-biome-lumina",
    "synthetic-dreams",
    "masks-of-luci",
    "grifters",
    "qql",
  ]);
  const featuresDefaultOpen = HIGH_SIGNAL_TRAITS.has(piece.collectionSlug);
  const metadata = (
    <div className="space-y-6">
      <Features traits={traits} defaultOpen={featuresDefaultOpen} />
      <OnChainDetails
        contractAddress={piece.contractAddress}
        tokenId={piece.tokenId}
        editionType={getEditionType(piece.collectionSlug)}
        storage={deriveStorage(piece.originalUri, piece.contractAddress)}
      />
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
          rasterUrl={marketplaceUrl}
          artistSiteUrl={artistSiteUrl}
          originalUri={piece.originalUri}
          placeholder={<PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} className="w-full h-full" />}
        />
      </div>

      {/* Other works from this series */}
      {more.length > 0 && collection && (
        <div className="pt-24 pb-8">
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-6">
            Other works from {collection.name}
          </p>
          <JustifiedGallery pieces={more} piecesPerRow={Math.min(more.length, 4)} />
        </div>
      )}
    </div>
  );
}
