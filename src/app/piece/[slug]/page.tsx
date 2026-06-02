import { notFound } from "next/navigation";
import { pieces, getArtist, getCollection } from "@/lib/data";
import { getArtworkImage, getArtworkAspect, resolveTokenId } from "@/lib/images";
import { getEditionType, getArtistSiteUrl, getPieceTraits } from "@/lib/curation";
import PlaceholderArt from "@/components/PlaceholderArt";
import BackButton from "@/components/BackButton";
import PieceLayout from "@/components/PieceLayout";
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
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  const isPunk = piece.collectionSlug === "cryptopunks";

  // Marketplace link: CryptoPunks Marketplace for Punks (canonical), Raster
  // for everything else. Most pieces use Raster's token-based URL; some
  // contracts/tokens aren't in that index but exist on Raster's slug-based
  // /artwork/ pages, so we override those explicitly.
  const RASTER_CONTRACT_OVERRIDES: Record<string, string> = {
    // Operator, Repeat as Necessary - all 4 pieces share the series artwork page.
    "0x99a9b7c1116f9ceeb1652de04d5969cce509b069":
      "https://www.raster.art/artwork/repeat-as-necessary-by-operator",
    // XCOPY, Cope Salada (single-piece contract).
    "0xab3a867a6b14cc2f3286b9f03698656f8a892e9e":
      "https://www.raster.art/artwork/cope-salada-by-xcopy",
  };
  const RASTER_PIECE_OVERRIDES: Record<string, string> = {
    // XCOPY, "Some Other Asshole" - early SuperRare token, not in Raster's token index.
    "0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0:2123":
      "https://www.raster.art/artwork/some-other-asshole-by-xcopy",
  };
  function rasterUrlFor(contract: string, slug: string, tokenId: string): string {
    const c = contract.toLowerCase();
    return (
      RASTER_PIECE_OVERRIDES[`${c}:${tokenId}`] ||
      RASTER_CONTRACT_OVERRIDES[c] ||
      `https://www.raster.art/token/ethereum/${contract}/${resolveTokenId(slug, contract, tokenId)}`
    );
  }
  const marketplaceUrl = piece.contractAddress && piece.tokenId
    ? (isPunk
        ? `https://cryptopunks.app/cryptopunks/details/${piece.tokenId}`
        : rasterUrlFor(piece.contractAddress, piece.slug, piece.tokenId))
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
          aspect={getArtworkAspect(piece.slug, piece.contractAddress, piece.tokenId)}
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

    </div>
  );
}
