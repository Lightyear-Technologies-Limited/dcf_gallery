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
  metadata: React.ReactNode;
  rasterUrl?: string;
  artistSiteUrl?: string;
  originalUri?: string;
  placeholder: React.ReactNode;
}

/** Derive a label like "xcopy.art" from a URL, stripping "www." */
function hostLabel(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
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
export default function PieceLayout({ image, aspect, title, isPunk, artistName, artistSlug, collectionName, collectionSlug, description, metadata, rasterUrl, artistSiteUrl, originalUri, placeholder }: Props) {
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

      {description && <PieceDescription text={description} />}

      <div className="mt-10">{metadata}</div>

      {(artistSiteUrl || rasterUrl || original) && (
        // Link order: original/on-chain source first (verify it's real), then
        // marketplace (check market), then artist site (learn more). Matches
        // the reader's intent flow on a fund catalogue.
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
          {rasterUrl && (
            <a
              href={rasterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              {isPunk ? "View on CryptoPunks Marketplace" : "View on Raster"}
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
 * Description block. Small-caps eyebrow signals authorship (matches the
 * "HIVEMIND COMMENTARY" pattern on CuratorNote). Short prose renders static;
 * long prose collapses to three lines with a Read more / Show less toggle
 * so multi-paragraph artist statements (Piano Blossoms, Return Zero, the
 * Beeple TIME essay) don't push the rest of the page off-screen.
 */
function PieceDescription({ text }: { text: string }) {
  const COLLAPSE_THRESHOLD = 280;
  const isLong = text.length > COLLAPSE_THRESHOLD || text.includes("\n");
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-8">
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
        From the Artist
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
