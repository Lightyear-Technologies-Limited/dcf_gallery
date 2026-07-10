"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ShareButton from "./ShareButton";
import PieceVideo from "./PieceVideo";
import PieceGif from "./PieceGif";
import InteractiveArtwork from "./InteractiveArtwork";

interface Props {
  image: string | null;
  /** Path B hybrid: sharp detail-variant src + srcSet (served raw via a plain
      <img>, bypassing next/image so the gateway doesn't re-resize/re-soften
      them). When present, the detail hero uses these instead of next/image. */
  detailSrc?: string;
  detailSrcSet?: string;
  /** Tiny blurred LQIP data URI shown as a background until the sharp image
      paints (blur-up / progressive load). */
  lqip?: string;
  /** When present, the artwork is a video — rendered with PieceVideo (still
      poster + opt-in autoplay) instead of the static image. (E.1) */
  video?: { src: string; poster?: string; original?: string };
  /** When the piece is an interactive on-chain HTML work, its data: URI — shown
      poster-by-default and run on demand inside a sandboxed iframe. (E.1) */
  interactive?: { src: string };
  /** When the artwork is an animated GIF 1/1 (XCOPY) — auto-animates on the piece
      page (its motion is the work), falling back to the still under reduced-motion
      or Reels-off. (E.1) */
  animatedGif?: { src: string };
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
  /** Optional single-line institutional note about the fund's position in
      the collection (e.g. "DCF is the largest single holder of Winds of
      Yawanawa."). Rendered as a quiet eyebrow under the collection link. */
  holdingNote?: string;
  /** Per-piece prose from on-chain metadata (artist statement, TIME essay
      excerpt, etc.). Rendered below the title block and above the metadata
      panel. Collection-level boilerplate is filtered out at build time. */
  description?: string | null;
  /** Collection-level description used as a fallback About when the piece
      itself has no per-piece prose (collections where descriptions repeat
      across every token, e.g. Ringers, Winds, Skulls of Luci). Eyebrow
      reads "About {Collection}" instead of "About {Piece Title}". The
      block starts collapsed so the editorial context is reachable but
      doesn't compete with the artwork. */
  collectionDescription?: string | null;
  /** True if the piece has a contract address + token ID. Reserved for
      future use; currently unused since the metadata-attribution line
      under the description was dropped. */
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
  /** The on-chain details expander (renders "Blockchain details >" until
   *  opened). Sits between the metadata block and the external links so
   *  the reader can access the token facts without hunting for them. */
  blockchainDetails?: React.ReactNode;
  /** The "Preserved by Hivemind" note (rendered after the external links
   *  as a preservation-status coda, above the Share button). */
  preservedBlock?: React.ReactNode;
  rasterUrl?: string;
  /** Optional CryptoPunks Marketplace URL. Only set for Punks; rendered as
      "View on CryptoPunks.app" above the Raster link. */
  cryptopunksUrl?: string;
  artistSiteUrl?: string;
  originalUri?: string;
  /** Optional X (Twitter) thread / announcement link for this piece.
   *  Rendered as a small muted link under the collection link. */
  xUrl?: string;
  xLabel?: string;
  /** Optional list of external links from the piece editorial layer
   *  (samspratt.com profile, credited collaborator, artist site page). */
  editorialLinks?: { label: string; url: string }[];
  /** Creation year (e.g. "2023"). Rendered as ", 2023" right after the
   *  artist credit — outside the artist Link so the year isn't part of
   *  the click target. */
  year?: string;
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
    return { href: `https://arweave.net/${uri.slice(5)}`, label: "arweave.net" };
  }
  if (uri.startsWith("data:")) return null; // on-chain SVG; no external link
  // Bare IPFS CID (CIDv0 starts with "Qm", CIDv1 with "bafy"/"bafk").
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]+|bafk[a-z0-9]+)$/.test(uri)) {
    return { href: `https://ipfs.io/ipfs/${uri}`, label: "ipfs.io" };
  }
  // Arweave URLs pass through unchanged to the canonical arweave.net gateway.
  // (Earlier we rewrote to ar-io.dev to sidestep arweave.net timeout issues,
  // but ar-io.dev now redirects some transactions to paid Turbo-tier
  // gateways that ask the reader for a micro-payment — a worse outcome
  // than an occasional retry on arweave.net's free canonical gateway.)
  const arweaveMatch = uri.match(/^https?:\/\/arweave\.net\/(.+)$/);
  if (arweaveMatch) {
    return { href: `https://arweave.net/${arweaveMatch[1]}`, label: "arweave.net" };
  }
  const host = hostLabel(uri);
  return host ? { href: uri, label: host } : null;
}

/**
 * Piece layout: image on the left, details on the right.
 */
export default function PieceLayout({ image, detailSrc, detailSrcSet, lqip, video, interactive, animatedGif, aspect, title, isPunk, artistName, artistSlug, collectionName, collectionSlug, holdingNote, description, collectionDescription, physical, companion, metadata, blockchainDetails, preservedBlock, rasterUrl, cryptopunksUrl, artistSiteUrl, originalUri, xUrl, xLabel, editorialLinks, year, placeholder }: Props) {
  const artistHost = artistSiteUrl ? hostLabel(artistSiteUrl) : null;
  const original = originalUri ? resolveOriginal(originalUri) : null;
  // When natural aspect is known, pass it as width/height props so next/image
  // sizes the box to the artwork's true shape. Falls back to 1600x1200 (4:3)
  // for pieces without a stored aspect - tall fallback pieces will still
  // letterbox slightly but the gallery 320-of-321 has real dimensions.
  const imgW = aspect?.w ?? 1600;
  const imgH = aspect?.h ?? 1200;
  // Artwork rendering — pick one of four paths (video / interactive HTML /
  // animated GIF / still image). Zoom was previously wired here for stills
  // and GIFs, then removed: at our 1920w variant cap the zoom quality
  // couldn't beat the "View original" link, which serves the true full-
  // resolution source at native quality.
  const artworkBlock = video ? (
    <PieceVideo src={video.src} poster={video.poster} title={title} original={video.original} />
  ) : interactive ? (
    <InteractiveArtwork src={interactive.src} poster={image} title={title} />
  ) : animatedGif ? (
    <PieceGif src={animatedGif.src} poster={detailSrc ?? image ?? undefined} lqip={lqip} title={title} />
  ) : image ? (
    isPunk ? (
      // Punks render the on-chain SVG at full container dimensions on the
      // colorway background. The container is aspect-square AND capped by
      // max-h so it stays within the viewport without needing the image's
      // own max-height to truncate it — which was clipping the image
      // element shorter than the container and leaving a teal gap under
      // the punk on wider desktops.
      <div className="bg-punk w-full aspect-square max-w-[calc(100dvh-14rem)] mx-auto">
        <Image
          src={image}
          alt={title}
          width={imgW}
          height={imgH}
          className="block w-full h-full object-contain [image-rendering:pixelated]"
          priority
          sizes="(max-width: 768px) 90vw, 60vw"
        />
      </div>
    ) : detailSrcSet ? (
      // Sharp detail variants served raw via a plain <img> (no next/image, so
      // the gateway loader can't re-resize/re-soften them). The LQIP shows as a
      // blurred background until the sharp image paints. (plan B.3 / Path B)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={detailSrc}
        srcSet={detailSrcSet}
        sizes="(max-width: 768px) 90vw, 60vw"
        alt={title}
        width={imgW}
        height={imgH}
        decoding="async"
        className="block w-auto h-auto max-w-full max-h-[calc(100dvh-14rem)] object-contain mx-auto"
        style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
    ) : (
      <Image
        src={image}
        alt={title}
        width={imgW}
        height={imgH}
        className="block w-auto h-auto max-w-full max-h-[calc(100dvh-14rem)] object-contain mx-auto"
        priority
        quality={95}
        sizes="(max-width: 768px) 90vw, 60vw"
      />
    )
  ) : (
    <div className="aspect-[4/3] w-full">{placeholder}</div>
  );

  const infoBlock = (
    <div className="flex-1 md:pt-4 md:max-w-[420px]">
      <h1 className="font-serif display-sm">
        {title}
      </h1>
      {artistSlug && artistName && (
        <span className="text-[16px] text-foreground-secondary mt-3 inline-block">
          <Link
            href={`/artist/${artistSlug}`}
            className="hover:text-foreground transition-colors duration-200"
          >
            {artistName}
          </Link>
          {year && <span>, {year}</span>}
        </span>
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
      {xUrl && (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-[13px] text-muted hover:text-foreground transition-colors duration-200 inline-block"
        >
          {xLabel ?? "Read the thread on X"} →
        </a>
      )}

      {description ? (
        <PieceDescription
          text={description}
          label={`About ${title}`}
        />
      ) : collectionDescription && collectionName ? (
        /* Fallback: the piece has no per-piece prose (descriptions repeat
           across every token in the collection - Ringers, Winds, Skulls,
           etc.) so borrow the collection's editorial description. A reader
           who clicks straight from the Collection page to a Piece page
           still gets editorial grounding instead of nothing. Starts
           collapsed - the artwork is the subject. */
        <PieceDescription
          text={collectionDescription}
          label={`About ${collectionName}`}
          defaultCollapsed
        />
      ) : null}

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

      {/* Right-column stack from here down follows the editorial brief:
       *   1. Blockchain details >          (on-chain expander)
       *   2. External links                (View original / artist / Raster / editorial)
       *   3. Preserved by Hivemind         (custody / preservation coda)
       *   4. Share                         (the reader's outbound action)
       * Each group is a distinct block with mt-6 between them so the
       * reader visually parses three groups rather than one long list. */}
      {blockchainDetails && <div className="mt-6">{blockchainDetails}</div>}

      <div className="mt-6 flex flex-col gap-2 text-[12px] text-muted">
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
        {editorialLinks?.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200"
          >
            {l.label}
          </a>
        ))}
      </div>

      {preservedBlock && <div className="mt-6">{preservedBlock}</div>}

      <div className="mt-3 text-[12px] text-muted">
        <ShareButton title={artistName ? `${title} by ${artistName}` : title} />
      </div>
    </div>
  );

  // Column widths. Wide/square pieces get a generous 65% column so the art
  // reads as the subject. Tall (portrait) pieces used to collapse to 40% —
  // which made the artwork a narrow strip next to a huge metadata block on
  // Fidenza / Ringers / Skulls. Metadata is capped at max-w-[420px] via
  // infoBlock instead, so the tall column can grow to 60% without the
  // metadata column bloating on wide monitors.
  const isTall = aspect ? aspect.w / aspect.h < 1 : false;
  const columnClass = isTall
    ? "w-full md:w-[55%] lg:w-[60%] shrink-0"
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
 * Description block - prose for the piece. The eyebrow names the subject
 * ("About {Artwork}" when piece-level, "About {Collection}" when the piece
 * page is borrowing the collection's editorial description because per-
 * piece prose is suppressed or repeats). The metadata-attribution line
 * ("From the artist's metadata description") that used to follow has been
 * dropped - it was chrome more than information.
 *
 * The left rule sets the block off as quoted material rather than UI text,
 * the way a museum catalogue indents a sourced quote. Long prose collapses
 * to three lines behind a Read more toggle.
 */
function PieceDescription({
  text,
  label,
  defaultCollapsed = false,
}: {
  text: string;
  label: string;
  /** When true, start collapsed regardless of length. Used for the
      collection-level About fallback - the reader on the piece page is
      here for the art; the editorial context is in reach but not in the
      way. */
  defaultCollapsed?: boolean;
}) {
  const COLLAPSE_THRESHOLD = 280;
  const isLong = text.length > COLLAPSE_THRESHOLD || text.includes("\n") || defaultCollapsed;
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
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border">
      <span className="text-muted shrink-0">{label}</span>
      {/* whitespace-pre-line honours \n in the value strings (used to force
          micro-computer control onto its own line); text-pretty + NBSPs
          embedded in the value handle natural wrap at phrase boundaries
          (between metric and imperial, between comma-separated materials)
          rather than mid-phrase. */}
      <span className="text-foreground text-right text-pretty whitespace-pre-line">{value}</span>
    </div>
  );
}
