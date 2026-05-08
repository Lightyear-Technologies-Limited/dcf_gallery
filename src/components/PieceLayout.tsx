"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
  image: string | null;
  title: string;
  isPunk: boolean;
  artistName?: string;
  artistSlug?: string;
  collectionName?: string;
  collectionSlug?: string;
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
    return { href: `https://arweave.net/${uri.slice(5)}`, label: "arweave.net" };
  }
  if (uri.startsWith("data:")) return null; // on-chain SVG; no external link
  // Bare IPFS CID (CIDv0 starts with "Qm", CIDv1 with "bafy"/"bafk").
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]+|bafk[a-z0-9]+)$/.test(uri)) {
    return { href: `https://ipfs.io/ipfs/${uri}`, label: "ipfs.io" };
  }
  const host = hostLabel(uri);
  return host ? { href: uri, label: host } : null;
}

/**
 * Piece layout: image on the left, details on the right.
 */
export default function PieceLayout({ image, title, isPunk, artistName, artistSlug, collectionName, collectionSlug, metadata, rasterUrl, artistSiteUrl, originalUri, placeholder }: Props) {
  const artistHost = artistSiteUrl ? hostLabel(artistSiteUrl) : null;
  const original = originalUri ? resolveOriginal(originalUri) : null;
  const artworkBlock = image ? (
    <div className={isPunk ? "bg-[#638596] inline-block" : ""}>
      <Image
        src={image}
        alt={title}
        width={1600}
        height={1200}
        className={`block w-full h-auto max-h-[80vh] object-contain ${isPunk ? "[image-rendering:pixelated] max-w-[400px]" : ""}`}
        priority
        sizes="(max-width: 768px) 90vw, 60vw"
      />
    </div>
  ) : (
    <div className="aspect-[4/3] w-full">{placeholder}</div>
  );

  const infoBlock = (
    <div className="flex-1 md:pt-4">
      {artistSlug && artistName && (
        <Link href={`/artist/${artistSlug}`} className="text-[16px] text-foreground hover:text-muted transition-colors duration-200">
          {artistName}
        </Link>
      )}
      <h1 className="font-serif text-[24px] sm:text-[32px] tracking-tight leading-tight mt-2 italic">
        {title}
      </h1>
      {collectionSlug && collectionName && (
        <Link href={`/collection/${collectionSlug}`} className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-2 inline-block">
          {collectionName}
        </Link>
      )}

      <div className="mt-10">{metadata}</div>

      {(artistSiteUrl || rasterUrl || original) && (
        <div className="mt-10 flex flex-col gap-2 text-[11px] text-muted/60">
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
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
      <div className="w-full md:w-[60%] lg:w-[65%] shrink-0">
        {artworkBlock}
      </div>
      {infoBlock}
    </div>
  );
}
