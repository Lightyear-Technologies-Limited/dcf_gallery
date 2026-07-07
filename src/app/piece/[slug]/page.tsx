import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage, getArtworkAspect, resolveTokenId } from "@/lib/images";
import { getDetailVariants, getArtworkBlur, getProvenance, getOgImage } from "@/lib/provenance";
import { getMotion } from "@/lib/motion";
import { SITE_URL as SITE } from "@/lib/site";
import { getEditionType, getArtistSiteUrl, getPieceTraits, getPieceDescription, getCollectionDisplayName, getArtistDisplayName, sortPieces, SYNTHETIC_TRAITS } from "@/lib/curation";
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
  const title = artistName ? `${piece.title} - ${artistName}` : piece.title;
  const collName = collection ? getCollectionDisplayName(collection.slug, collection.name) : undefined;
  const description = (
    getPieceDescription(piece.slug) ||
    piece.description ||
    (collName ? `${piece.title}, from ${collName} - in the Hivemind Digital Culture Fund collection.` : "Held by the Hivemind Digital Culture Fund.")
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
  // Origin view (?from=…) so Back returns to where the reader came from — the
  // Collection (the Salon homepage, with any active chapter/artist filter) or the
  // Chapters page — not just up to the parent collection. Absent → fall back up
  // the hierarchy (collection page, or the artist for single-piece collections).
  const from = typeof sp.from === "string" ? sp.from : "";
  const viewParams = new URLSearchParams();
  for (const k of ["chapter", "artist", "collection", "medium", "q"] as const) {
    const v = typeof sp[k] === "string" ? (sp[k] as string) : "";
    if (v) viewParams.set(k, v);
  }
  // Anchor the Back link to the exact tile the reader opened (`#p-<slug>`), so
  // returning to the origin restores their scroll position instead of jumping to
  // the top. ScrollRestore on each surface re-scrolls to this id once the async
  // gallery has laid out.
  const anchor = `#p-${piece.slug}`;
  let originHref: string | null = null;
  let originLabel = "";
  if (from === "salon") { originHref = `/${viewParams.toString() ? `?${viewParams}` : ""}${anchor}`; originLabel = "Collection"; }
  else if (from === "chapters") { originHref = `/chapters${anchor}`; originLabel = "Chapters"; }
  else if (from === "artist") {
    const a = viewParams.get("artist") || piece.artistSlug;
    const fa = getArtist(a);
    originHref = `/artist/${a}${anchor}`;
    originLabel = fa ? getArtistDisplayName(fa.slug, fa.name) : "Artist";
  }

  // Carry the origin (and any active filters) onto Prev/Next so sibling browsing
  // keeps the same Back destination.
  const carry = new URLSearchParams(filterQs);
  if (from) { carry.set("from", from); for (const [k, v] of viewParams) carry.set(k, v); }
  const carryQs = carry.toString();

  const pieceHref = (s: string) => `/piece/${s}${carryQs ? `?${carryQs}` : ""}`;
  const collectionHref = collection
    ? `/collection/${collection.slug}${filterQs ? `?${filterQs}` : ""}`
    : "/";

  // Sibling navigation - previous + next piece in the collection.
  //
  // Unfiltered walk: follow the curated display order from sortPieces (same
  // function the collection page uses) so prev/next matches the order the
  // reader saw the works in. Pre-fix this was sorted by raw tokenId, which
  // diverged from curation for sets like Piano Blossoms (Flower Demons is
  // displayed first but has tokenId 5 - "Next" from there walked to tokenId
  // 4, third in display order).
  //
  // Filtered walk: when a trait filter is active, walk only the filtered
  // subset (so prev/next doesn't drop the reader out of their browsing
  // mode), sorted by numeric tokenId for a predictable scan through the
  // filtered set - this matches the order the filtered collection view
  // renders subsets in (see /collection/[slug] sort comment).
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
    siblingPieces.sort((a, b) => {
      const an = parseInt(a.tokenId || "", 10);
      const bn = parseInt(b.tokenId || "", 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.slug.localeCompare(b.slug);
    });
  } else {
    siblingPieces = sortPieces(piece.collectionSlug, siblingPieces);
  }
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
  // Animated/video pieces (E.1): play the pinned video with the sharp still as poster.
  const animatedVideo =
    provenance?.animation?.cid && provenance.animation.type === "video" && provenance.animation.gateway
      ? { src: provenance.animation.gateway, poster: getDetailVariants(piece.slug)?.src, original: provenance.animation.source }
      : undefined;
  // Generative/interactive HTML pieces (E.1). Run the **pinned gateway copy**
  // (the same URL the gallery tiles use via getMotion), NOT the raw on-chain
  // `data:` URI: the artwork spawns a Web Worker from a blob URL, which browsers
  // block inside a `data:`/opaque-origin document — so the data-URI iframe paints
  // a black square, while the https gateway origin runs it correctly.
  const interactiveMotion = getMotion(piece.slug);
  const interactive =
    interactiveMotion?.type === "interactive"
      ? { src: interactiveMotion.src }
      : undefined;
  // Animated GIF 1/1s (XCOPY): the motion *is* the work, so the piece page
  // auto-animates the GIF by default (still as placeholder; reduced-motion /
  // Reels-off restores the still). Distinct from the <video> transcodes above,
  // which stay opt-in.
  const animatedGif =
    interactiveMotion?.type === "gif" ? { src: interactiveMotion.src } : undefined;
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
      {piece.exhibitions && piece.exhibitions.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
            Exhibitions
          </p>
          <ul className="space-y-1 text-[13px] leading-snug">
            {piece.exhibitions.map((ex, i) => (
              <li key={i}>
                <span className="text-muted tabular-nums">{ex.date}</span>
                <span className="text-muted"> - </span>
                {ex.url ? (
                  <a
                    href={ex.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline decoration-border hover:decoration-foreground underline-offset-4"
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
      {provenance?.cid && (
        <p className="text-[13px] text-muted">
          <span className="text-foreground-secondary">Preserved by Hivemind:</span>
          <br />
          Pinned to IPFS{provenance.verifiedAt ? ", integrity verified" : ""}
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

  const artistDisplay = artist ? getArtistDisplayName(artist.slug, artist.name) : undefined;

  // Up-the-hierarchy fallback for Back when there's no explicit ?from origin.
  // A single-piece collection is redundant chrome (the title links straight to
  // the piece everywhere), so its natural parent is the artist, not a one-item
  // collection page. Multi-piece collections — and any active filter — go to the
  // collection page, carrying the filter so the reader lands in the same subset.
  const collectionPieceCount = getPiecesByCollection(piece.collectionSlug).length;
  const upToArtist = !incomingFilter && collectionPieceCount === 1 && !!artist;
  const upHref = (upToArtist ? `/artist/${artist!.slug}` : collectionHref) + anchor;
  const upLabel = upToArtist
    ? artistDisplay ?? "Artist"
    : collection
      ? `${getCollectionDisplayName(collection.slug, collection.name)}${
          incomingFilter ? ` · ${incomingFilter.key}: ${incomingFilter.value}` : ""
        }`
      : "Back";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: piece.title,
    url: `${SITE}/piece/${piece.slug}`,
    artform: "Digital art",
    ...(getOgImage(piece.slug) ? { image: getOgImage(piece.slug) } : {}),
    ...(artistDisplay
      ? { creator: { "@type": "Person", name: artistDisplay, ...(artist ? { url: `${SITE}/artist/${artist.slug}` } : {}) } }
      : {}),
    ...(getPieceDescription(piece.slug) || piece.description
      ? { description: getPieceDescription(piece.slug) || piece.description }
      : {}),
    ...(collection ? { isPartOf: { "@type": "Collection", name: getCollectionDisplayName(collection.slug, collection.name) } } : {}),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Back link. With an explicit origin (?from=) it returns there (Collection
          or Chapters). Otherwise it goes UP one level: multi-piece collections —
          and any active trait filter — return to the collection page; single-piece
          collections, whose collection page is redundant chrome, return to the
          artist page instead. Label uses the curated display name, extended with
          "· {trait: value}" when filtered so the destination is unambiguous. */}
      <BackButton
        href={originHref || upHref}
        label={originHref ? originLabel : upLabel}
      />
      {(prevPiece || nextPiece) && (
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-2">
          {prevPiece ? (
            <Link
              href={pieceHref(prevPiece.slug)}
              className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%]"
            >
              <span className="text-[10px] tracking-[0.12em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200">
                ← Previous work
              </span>
              <span className="font-serif italic text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 truncate">
                {prevPiece.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextPiece && (
            <Link
              href={pieceHref(nextPiece.slug)}
              className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%] sm:items-end sm:text-right"
            >
              <span className="text-[10px] tracking-[0.12em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200">
                Next work →
              </span>
              <span className="font-serif italic text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 truncate">
                {nextPiece.title}
              </span>
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
          video={animatedVideo}
          interactive={interactive}
          animatedGif={animatedGif}
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
