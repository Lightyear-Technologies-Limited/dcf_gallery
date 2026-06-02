import { notFound } from "next/navigation";
import Link from "next/link";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage, getArtworkAspect, resolveTokenId } from "@/lib/images";
import { getEditionType, getArtistSiteUrl, getPieceTraits, getPieceDescription, sortPieces } from "@/lib/curation";
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

  // Sibling navigation - previous + next piece in the collection (curation
  // order). Sits at the top alongside the back link so a reader can move
  // laterally through the catalogue without scrolling.
  const siblingPieces = sortPieces(piece.collectionSlug, getPiecesByCollection(piece.collectionSlug));
  const sibIdx = siblingPieces.findIndex((p) => p.slug === piece.slug);
  const prevPiece = sibIdx > 0 ? siblingPieces[sibIdx - 1] : null;
  const nextPiece = sibIdx >= 0 && sibIdx < siblingPieces.length - 1 ? siblingPieces[sibIdx + 1] : null;
  const isPunk = piece.collectionSlug === "cryptopunks";

  // Marketplace links. Punks get both CryptoPunks.app (canonical) and
  // Raster - the canonical V2 contract is indexed there regardless of
  // wrap state. Everything else gets Raster only. Some contracts/tokens
  // aren't in Raster's token index but exist on Raster's slug-based
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
  // Punks: Raster indexes the canonical V2 contract regardless of which
  // contract our copy lives on (V2 canonical or V1 wrapped). Always use
  // V2 for the Raster URL.
  const PUNK_V2 = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
  const cryptopunksUrl = isPunk && piece.tokenId
    ? `https://cryptopunks.app/cryptopunks/details/${piece.tokenId}`
    : undefined;
  const rasterUrl = piece.contractAddress && piece.tokenId
    ? (isPunk
        ? `https://www.raster.art/token/ethereum/${PUNK_V2}/${piece.tokenId}`
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
      {(prevPiece || nextPiece) && (
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-2 text-[13px] text-muted">
          {prevPiece ? (
            <Link
              href={`/piece/${prevPiece.slug}`}
              className="hover:text-foreground transition-colors duration-200 truncate max-w-full sm:max-w-[45%]"
            >
              ← {prevPiece.title}
            </Link>
          ) : (
            <span />
          )}
          {nextPiece && (
            <Link
              href={`/piece/${nextPiece.slug}`}
              className="hover:text-foreground transition-colors duration-200 text-right truncate max-w-full sm:max-w-[45%]"
            >
              {nextPiece.title} →
            </Link>
          )}
        </div>
      )}
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
          description={getPieceDescription(piece.slug) || piece.description || null}
          isOnChain={Boolean(piece.contractAddress && piece.tokenId)}
          physical={piece.physical}
          companion={(() => {
            if (!piece.companionSlug) return undefined;
            const c = pieces.find((p) => p.slug === piece.companionSlug);
            if (!c) return undefined;
            return { slug: c.slug, title: c.title };
          })()}
          metadata={metadata}
          rasterUrl={rasterUrl}
          cryptopunksUrl={cryptopunksUrl}
          artistSiteUrl={artistSiteUrl}
          originalUri={piece.originalUri}
          placeholder={<PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} className="w-full h-full" />}
        />
      </div>

    </div>
  );
}
