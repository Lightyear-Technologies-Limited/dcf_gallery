"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Props {
  image: string | null;
  /** Natural pixel dimensions of the artwork file, when known. Used to size
      the Image box at the true intrinsic aspect (else next/image defaults to
      the 4:3 of the placeholder width/height props and tall pieces letterbox). */
  aspect?: { w: number; h: number } | null;
  title: string;
  isPunk: boolean;
  artistName?: string;
  artistSlug?: string;
  collectionName?: string;
  collectionSlug?: string;
  /** Per-piece prose from on-chain metadata (artist statement, TIME essay
      excerpt, etc.). Rendered below the title block and above the metadata
      panel. Collection-level boilerplate is filtered out at build time. */
  description?: string | null;
  /** True if the piece has a contract address + token ID. Drives whether the
      description block carries the "From the artist's metadata description"
      attribution; physical works (no on-chain token) get no attribution
      because their description is editorial, not quoted from metadata. */
  isOnChain?: boolean;
  /** Physical specifications for sculptural / installation works. Rendered
      as a Specifications panel; the blockchain details panel is omitted by
      the caller for these pieces. */
  physical?: {
    dimensions: string;
    weight?: string;
    materials: string;
    edition?: string;
  };
  /** Related piece in the catalogue (e.g. the on-chain NFT this sculpture
      extends). Rendered as a small "Companion: {Title}" link. */
  companion?: { slug: string; title: string };
  metadata: React.ReactNode;
  rasterUrl?: string;
  /** Optional CryptoPunks Marketplace URL. Only set for Punks; rendered as
      "View on CryptoPunks.app" above the Raster link. */
  cryptopunksUrl?: string;
  artistSiteUrl?: string;
  originalUri?: string;
  placeholder: React.ReactNode;
}

/** Derive a label like "pxl.onl" from a URL, stripping "www.". A few brand
    names are stylized (XCOPY.art is upper-cased per the artist's wordmark);
    those get explicit display overrides. */
const HOST_DISPLAY: Record<string, string> = {
  "xcopy.art": "XCOPY.art",
};
function hostLabel(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return HOST_DISPLAY[host] || host;
  } catch {
    return null;
  }
}

/**
 * Resolve ipfs:// and ar:// URIs to public gateway HTTPS URLs,
 * and derive a short human label for the link text.
 */
function resolveOriginal(uri: string): { href: string; label: string } | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    const path = uri.slice(7).replace(/^ipfs\//, "");
    return { href: `https://ipfs.io/ipfs/${path}`, label: "ipfs.io" };
  }
  if (uri.startsWith("ar://")) {
    return { href: `https://ar-io.dev/${uri.slice(5)}`, label: "ar-io.dev" };
  }
  if (uri.startsWith("data:")) return null; // on-chain SVG; no external link
  // Bare IPFS CID (CIDv0 starts with "Qm", CIDv1 with "bafy"/"bafk").
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]+|bafk[a-z0-9]+)$/.test(uri)) {
    return { href: `https://ipfs.io/ipfs/${uri}`, label: "ipfs.io" };
  }
  // Rewrite literal arweave.net URLs to ar-io.dev - arweave.net's edge is
  // flaky enough that 4% of our originalUri probes timed out on it; ar-io.dev
  // resolves the same transactions reliably.
  const arweaveMatch = uri.match(/^https?:\/\/arweave\.net\/(.+)$/);
  if (arweaveMatch) {
    return { href: `https://ar-io.dev/${arweaveMatch[1]}`, label: "ar-io.dev" };
  }
  const host = hostLabel(uri);
  return host ? { href: uri, label: host } : null;
}

/**
 * Piece layout: image on the left, details on the right.
 */
export default function PieceLayout({ image, aspect, title, isPunk, artistName, artistSlug, collectionName, collectionSlug, description, isOnChain = true, physical, companion, metadata, rasterUrl, cryptopunksUrl, artistSiteUrl, originalUri, placeholder }: Props) {
  const artistHost = artistSiteUrl ? hostLabel(artistSiteUrl) : null;
  const original = originalUri ? resolveOriginal(originalUri) : null;
  // When natural aspect is known, pass it as width/height props so next/image
  // sizes the box to the artwork's true shape. Falls back to 1600x1200 (4:3)
  // for pieces without a stored aspect - tall fallback pieces will still
  // letterbox slightly but the gallery 320-of-321 has real dimensions.
  const imgW = aspect?.w ?? 1600;
  const imgH = aspect?.h ?? 1200;
  const artworkBlock = image ? (
    <div className={isPunk ? "bg-[#638596] inline-block" : ""}>
      <Image
        src={image}
        alt={title}
        width={imgW}
        height={imgH}
        className={`block w-auto h-auto max-w-full max-h-[80vh] object-contain ${isPunk ? "[image-rendering:pixelated] max-w-[400px]" : ""}`}
        priority
        sizes="(max-width: 768px) 90vw, 60vw"
      />
    </div>
  ) : (
    <div className="aspect-[4/3] w-full">{placeholder}</div>
  );

  const infoBlock = (
    <div className="flex-1 md:pt-4">
      <h1 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">
        {title}
      </h1>
      {artistSlug && artistName && (
        <Link
          href={`/artist/${artistSlug}`}
          className="text-[16px] text-foreground-secondary hover:text-foreground transition-colors duration-200 mt-3 inline-block"
        >
          {artistName}
        </Link>
      )}
      {collectionSlug && collectionName && (
        <div className="mt-1">
          <Link
            href={`/collection/${collectionSlug}`}
            className="text-[13px] text-muted hover:text-foreground transition-colors duration-200"
          >
            {collectionName}
          </Link>
        </div>
      )}

      {description && (
        <PieceDescription
          text={description}
          label={`About ${title}`}
          showMetadataAttribution={isOnChain}
        />
      )}

      {physical && (
        <div className="mt-10 border-l border-border pl-5">
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
            Specifications
          </p>
          <div className="text-[13px] space-y-0">
            <SpecRow label="Dimensions" value={physical.dimensions} />
            {physical.weight && <SpecRow label="Weight" value={physical.weight} />}
            <SpecRow label="Materials" value={physical.materials} />
            {physical.edition && <SpecRow label="Edition" value={physical.edition} />}
          </div>
        </div>
      )}

      {companion && (
        <div className="mt-8 text-[12px] text-muted">
          Companion:{" "}
          <Link
            href={`/piece/${companion.slug}`}
            className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground italic font-serif"
          >
            {companion.title}
          </Link>
        </div>
      )}

      <div className="mt-10">{metadata}</div>

      {(artistSiteUrl || rasterUrl || cryptopunksUrl || original) && (
        // Link order: original (verify on-chain provenance), then artist site
        // (canonical artist-curated view), then marketplace(s) (trading view).
        // Punks get both CryptoPunks.app and Raster under marketplace, with
        // CryptoPunks.app first as canonical.
        <div className="mt-10 flex flex-col gap-2 text-[12px] text-muted">
          {original && (
            <a
              href={original.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              View original
            </a>
          )}
          {artistSiteUrl && artistHost && (
            <a
              href={artistSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              View on {artistHost}
            </a>
          )}
          {cryptopunksUrl && (
            <a
              href={cryptopunksUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              View on CryptoPunks.app
            </a>
          )}
          {rasterUrl && (
            <a
              href={rasterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              View on Raster
            </a>
          )}
        </div>
      )}
    </div>
  );

  // Tall pieces (aspect ratio < 1, i.e. taller than wide) collapse the column
  // to a tighter cap so the dead gutter between artwork and metadata vanishes;
  // wide/square pieces keep the standard 60-65% column so they have room to
  // breathe.
  const isTall = aspect ? aspect.w / aspect.h < 1 : false;
  const columnClass = isTall
    ? "w-full md:w-auto md:max-w-[45%] lg:max-w-[40%] shrink-0"
    : "w-full md:w-[60%] lg:w-[65%] shrink-0";
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
      <div className={columnClass}>
        {artworkBlock}
      </div>
      {infoBlock}
    </div>
  );
}

/**
 * Description block - the prose stored as the token's on-chain metadata
 * description field. Catalogue convention:
 * - Eyebrow names the subject ("About {Artwork}")
 * - Body holds the prose
 * - Closing attribution names the source ("From the artist's metadata")
 *
 * The left rule sets the block off as quoted material rather than UI text,
 * the way a museum catalogue indents a sourced quote. Long prose collapses
 * to three lines with a Read more / Show less toggle.
 */
function PieceDescription({
  text,
  label,
  showMetadataAttribution = true,
}: {
  text: string;
  label: string;
  showMetadataAttribution?: boolean;
}) {
  const COLLAPSE_THRESHOLD = 280;
  const isLong = text.length > COLLAPSE_THRESHOLD || text.includes("\n");
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-8 border-l border-border pl-5">
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
        {label}
      </p>
      <p
        className={`font-serif text-[17px] leading-[1.55] text-foreground-secondary whitespace-pre-line ${
          isLong && !expanded ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[11px] tracking-[0.1em] uppercase text-muted hover:text-foreground transition-colors duration-200 font-medium"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      {showMetadataAttribution && (
        <p className="mt-4 text-[12px] text-muted italic">
          From the artist&rsquo;s metadata description
        </p>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border">
      <span className="text-muted shrink-0">{label}</span>
      {/* text-pretty + the NBSPs embedded in the value strings let the
          browser break at natural phrase boundaries (between metric and
          imperial, between comma-separated materials) rather than
          mid-phrase. */}
      <span className="text-foreground text-right text-pretty">{value}</span>
    </div>
  );
}
