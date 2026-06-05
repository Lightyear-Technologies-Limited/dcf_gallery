import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage, getArtworkAspect, resolveTokenId } from "@/lib/images";
import { getDetailVariants, getArtworkBlur, getProvenance, getOgImage } from "@/lib/provenance";
import { getEditionType, getArtistSiteUrl, getPieceTraits, getPieceDescription, getCollectionDisplayName, getArtistDisplayName, SYNTHETIC_TRAITS } from "@/lib/curation";
import type { TraitValue } from "@/lib/curation";
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
  // IPFS served over an HTTP gateway (ipfs.pixura.io/ipfs/…, …ipfs.io/…) must be
  // detected before the generic https → Centralized fallback. (plan A.5)
  if (originalUri.includes("/ipfs/") || /^https?:\/\/[^/]*\bipfs\./.test(originalUri)) return "IPFS";
  if (originalUri.startsWith("https://") || originalUri.startsWith("http://")) return "Centralized";
  return undefined;
}

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) return {};
  const artist = getArtist(piece.artistSlug);
  const collection = getCollection(piece.collectionSlug);
  const artistName = artist ? getArtistDisplayName(artist.slug, artist.name) : undefined;
  const title = artistName ? `${piece.title} — ${artistName}` : piece.title;
  const collName = collection ? getCollectionDisplayName(collection.slug, collection.name) : undefined;
  const description = (
    getPieceDescription(piece.slug) ||
    piece.description ||
    (collName ? `${piece.title}, from ${collName} — in the Hivemind Digital Culture Fund collection.` : "Held by the Hivemind Digital Culture Fund.")
  ).slice(0, 200);
  const og = getOgImage(piece.slug);
  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: og ? [{ url: og, width: 1200, alt: piece.title }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: og ? [og] : undefined },
  };
}

export default async function PiecePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const artist = getArtist(piece.artistSlug);
  const collection = getCollection(piece.collectionSlug);
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");

  // If the reader arrived via a filtered collection view, the URL carries
  // the filter as ?trait=Key&value=Value (mirroring the filter route).
  // Preserve it on Back + Prev/Next so the filtered browsing mode survives
  // navigation.
  const incomingFilter: { key: string; value: string } | null =
    typeof sp.trait === "string" && typeof sp.value === "string" && sp.trait && sp.value
      ? { key: sp.trait, value: sp.value }
      : null;
  const filterQs = incomingFilter
    ? `trait=${encodeURIComponent(incomingFilter.key)}&value=${encodeURIComponent(incomingFilter.value)}`
    : "";
  const pieceHref = (s: string) => `/piece/${s}${filterQs ? `?${filterQs}` : ""}`;
  const collectionHref = collection
    ? `/collection/${collection.slug}${filterQs ? `?${filterQs}` : ""}`
    : "/";

  // Sibling navigation - previous + next piece in the collection sorted by
  // numeric tokenId. Predictable forward/backward through the series, even
  // when the collection page itself uses a curated display order. Falls back
  // to lexical slug compare when tokenId is missing (physical works, etc.).
  // When a filter is active, walk only the filtered subset so prev/next
  // doesn't drop the reader out of their browsing mode.
  let siblingPieces = [...getPiecesByCollection(piece.collectionSlug)];
  if (incomingFilter) {
    siblingPieces = siblingPieces.filter((p) => {
      const t = getPieceTraits(p.slug);
      if (!t) return false;
      return t.some(([k, v]) => {
        if (k !== incomingFilter.key) return false;
        if (Array.isArray(v)) return v.some((item) => String(item) === incomingFilter.value);
        return String(v) === incomingFilter.value;
      });
    });
  }
  siblingPieces.sort((a, b) => {
    const an = parseInt(a.tokenId || "", 10);
    const bn = parseInt(b.tokenId || "", 10);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return a.slug.localeCompare(b.slug);
  });
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
    piece.artistSiteUrl ||
    getArtistSiteUrl(piece.collectionSlug, piece.tokenId, piece.title) ||
    undefined;

  const rawTraits = getPieceTraits(piece.slug);
  // Editorial / curator-added "synthetic" traits prepended to the on-chain
  // attributes - used for facts not in metadata (QQL "Minted by: Tyler
  // Hobbs"). When the collection has none, the piece's traits pass through.
  const syntheticEntries = SYNTHETIC_TRAITS[piece.collectionSlug];
  const traits: Array<[string, TraitValue]> | null = syntheticEntries
    ? [...Object.entries(syntheticEntries), ...(rawTraits || [])]
    : rawTraits;
  // Collections where traits carry curatorial weight (palette, scale, mood,
  // origin) - open the Features panel by default. Others stay collapsed.
  // Traits / Attributes panel opens by default - the on-chain attributes
  // are the readable signature of the work; collapsing them hides the
  // information the reader came for.
  const featuresDefaultOpen = true;
  // Edition format "1/1/N" means a multi-piece series (CryptoPunks 1/1/10000,
  // Fidenza 1/1/999, etc.) - those are the only collections where trait
  // values are filterable, because there ARE other pieces sharing the trait
  // to pivot to. Single-edition 1/1 pieces (Cope Salada, Some Other Asshole,
  // her-favorite-flowers) have nothing to filter against, so traits render
  // as plain catalogue metadata without link affordance.
  const collectionEditionType = getEditionType(piece.collectionSlug);
  const isMultiPieceSeries = /^1\/1\/\d/.test(collectionEditionType);
  // Preservation provenance (C.2): real CID + sha256 from the Filebase pin.
  const provenance = getProvenance(piece.slug);
  const STORAGE_LABEL: Record<string, string> = {
    ipfs: "IPFS", arweave: "Arweave", onchain: "On-chain", centralized: "Centralized",
  };
  const storageLabel =
    (provenance?.storage && STORAGE_LABEL[provenance.storage]) ||
    deriveStorage(piece.originalUri, piece.contractAddress);
  const metadata = (
    <div className="space-y-6">
      <Features
        traits={traits}
        collectionSlug={isMultiPieceSeries ? piece.collectionSlug : undefined}
        defaultOpen={featuresDefaultOpen}
        label={isPunk ? "Attributes" : "Traits"}
      />
      {provenance?.cid && (
        <p className="text-[10px] tracking-[0.12em] uppercase text-muted font-medium">
          Preserved by DCF — pinned to IPFS{provenance.verifiedAt ? " · integrity verified" : ""}
        </p>
      )}
      <OnChainDetails
        contractAddress={piece.contractAddress}
        tokenId={piece.tokenId}
        editionType={collectionEditionType}
        storage={storageLabel}
        provenance={
          provenance?.cid
            ? { cid: provenance.cid, sha256: provenance.sha256, pinnedAt: provenance.pinnedAt, verifiedAt: provenance.verifiedAt }
            : undefined
        }
      />
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Back link goes up one level to the parent collection, preserving
          any active trait filter so the reader returns to the filtered view
          they came from. Label uses the curated display name and is
          extended with "· {trait: value}" when filtered so the destination
          is unambiguous. */}
      <BackButton
        href={collectionHref}
        label={
          collection
            ? `${getCollectionDisplayName(collection.slug, collection.name)}${
                incomingFilter ? ` · ${incomingFilter.key}: ${incomingFilter.value}` : ""
              }`
            : "Back"
        }
      />
      {(prevPiece || nextPiece) && (
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-2 text-[13px] text-muted">
          {prevPiece ? (
            <Link
              href={pieceHref(prevPiece.slug)}
              className="hover:text-foreground transition-colors duration-200 truncate max-w-full sm:max-w-[45%]"
            >
              ← {prevPiece.title}
            </Link>
          ) : (
            <span />
          )}
          {nextPiece && (
            <Link
              href={pieceHref(nextPiece.slug)}
              className="hover:text-foreground transition-colors duration-200 text-right truncate max-w-full sm:max-w-[45%]"
            >
              {nextPiece.title} →
            </Link>
          )}
        </div>
      )}
      <div className="pt-6 pb-24">
        <PieceLayout
          image={realImage}
          detailSrc={getDetailVariants(piece.slug)?.src}
          detailSrcSet={getDetailVariants(piece.slug)?.srcSet}
          lqip={getArtworkBlur(piece.slug)}
          aspect={getArtworkAspect(piece.slug, piece.contractAddress, piece.tokenId)}
          title={piece.title}
          isPunk={isPunk}
          artistName={artist?.name}
          artistSlug={artist?.slug}
          collectionName={collection ? getCollectionDisplayName(collection.slug, collection.name) : undefined}
          collectionSlug={collection?.slug}
          holdingNote={collection?.holdingNote}
          description={getPieceDescription(piece.slug) || piece.description || null}
          collectionDescription={collection?.description || null}
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
