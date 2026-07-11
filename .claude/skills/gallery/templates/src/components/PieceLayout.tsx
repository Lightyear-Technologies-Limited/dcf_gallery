import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import OnChainDetails from "./OnChainDetails";
import ShareButton from "./ShareButton";
import InteractiveArtwork from "./InteractiveArtwork";
import PieceVideo from "./PieceVideo";
import { getDetailSrcSet, getArtworkBlur, GATEWAY_BASE } from "@/lib/provenance";

/**
 * Piece detail layout. Two-column on desktop: artwork on the left,
 * metadata + editorial column on the right. Metadata stack, top to
 * bottom: attributes → blockchain details → exhibitions → other resources
 * → preserved → share. Every label in eyebrow style (sentence-case).
 *
 * The `metadata` slot carries the Features (attributes) panel.
 * `exhibitionsBlock` is separate so it can be omitted when empty.
 * `editorialLinks` and `contextLinks` merge into a single "Other resources"
 * block internally; if you need to split them into two labelled subgroups
 * on a fund-specific site, edit this file rather than passing separate
 * slots.
 */
interface EditorialLink { label: string; url: string; }

export default function PieceLayout({
  title,
  artist,
  artistSlug,
  collectionName,
  collectionSlug,
  year,
  image,
  detailSrcSet,
  medium,
  motionSrc,
  posterSrc,
  interactiveAspect,
  isPunk,
  metadata,
  exhibitionsBlock,
  onChainProps,
  editorialLinks,
  contextLinks,
  originalUri,
  artistSiteUrl,
  provenance,
  imgW,
  imgH,
  description,
  physical,
}: {
  title: string;
  artist: string;
  artistSlug: string;
  collectionName: string;
  collectionSlug: string;
  year?: string;
  image: string;
  detailSrcSet?: { src: string; srcSet: string } | null;
  medium: "image" | "video" | "interactive" | "physical";
  motionSrc?: string;
  posterSrc?: string;
  interactiveAspect?: { w: number; h: number } | null;
  isPunk?: boolean;
  metadata?: ReactNode;
  exhibitionsBlock?: ReactNode;
  onChainProps?: Parameters<typeof OnChainDetails>[0];
  editorialLinks?: EditorialLink[];
  contextLinks?: EditorialLink[];
  originalUri?: string;
  artistSiteUrl?: string | null;
  provenance?: { cid?: string; verifiedAt?: string; sha256?: string };
  imgW?: number;
  imgH?: number;
  description?: string;
  physical?: { dimensions?: string; weight?: string; materials?: string; edition?: string };
}) {
  const lqip = getArtworkBlur(collectionSlug + "-" + title); // placeholder key

  // Determine artwork layout — tall pieces get a narrower column
  const isTall = imgW && imgH ? imgH > imgW : false;
  const artColClass = isTall
    ? "w-full md:w-[45%] lg:w-[45%] shrink-0"
    : "w-full md:w-[60%] lg:w-[65%] shrink-0";

  const otherResources: EditorialLink[] = [
    ...(originalUri ? [{ label: "View original", url: originalUri }] : []),
    ...(artistSiteUrl ? [{ label: "View on artist site", url: artistSiteUrl }] : []),
    ...(editorialLinks ?? []),
    ...(contextLinks ?? []),
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
      {/* Artwork column */}
      <div className={artColClass}>
        {medium === "interactive" && motionSrc ? (
          <InteractiveArtwork src={motionSrc} poster={posterSrc ?? image} title={title} aspect={interactiveAspect} />
        ) : medium === "video" && motionSrc ? (
          <PieceVideo src={motionSrc} poster={posterSrc ?? image} title={title} />
        ) : detailSrcSet ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detailSrcSet.src}
            srcSet={detailSrcSet.srcSet}
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
            width={imgW ?? 1600}
            height={imgH ?? 1200}
            className={`block w-auto h-auto max-w-full max-h-[calc(100dvh-14rem)] object-contain mx-auto ${isPunk ? "bg-punk [image-rendering:pixelated]" : ""}`}
            priority
            quality={95}
            sizes="(max-width: 768px) 90vw, 60vw"
          />
        )}
      </div>

      {/* Metadata + editorial column */}
      <div className="flex-1 space-y-8">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
            <Link href={`/artist/${artistSlug}`} className="hover:text-foreground transition-colors duration-200">
              {artist}
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link href={`/collection/${collectionSlug}`} className="hover:text-foreground transition-colors duration-200">
              {collectionName}
            </Link>
            {year && <><span className="mx-2 text-border">·</span>{year}</>}
          </p>
          <h1 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">{title}</h1>
        </div>

        {description && (
          <p className="text-[15px] leading-[1.65] text-foreground-secondary max-w-[52ch]">
            {description}
          </p>
        )}

        {/* Attributes (Features) — open by default */}
        {metadata}

        {/* Blockchain details — closed by default */}
        {onChainProps && <OnChainDetails {...onChainProps} gatewayBase={GATEWAY_BASE} />}

        {/* Physical specifications, when applicable */}
        {physical && (
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
              Specifications
            </p>
            <div className="text-[13px] space-y-0">
              {physical.dimensions && <SpecRow label="Dimensions" value={physical.dimensions} />}
              {physical.weight && <SpecRow label="Weight" value={physical.weight} />}
              {physical.materials && <SpecRow label="Materials" value={physical.materials} />}
              {physical.edition && <SpecRow label="Edition" value={physical.edition} />}
            </div>
          </div>
        )}

        {/* Exhibitions */}
        {exhibitionsBlock}

        {/* Other resources */}
        {otherResources.length > 0 && (
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
              Other resources
            </p>
            <div className="space-y-1.5 text-[13px]">
              {otherResources.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="block text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground">
                  {l.label} →
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Preserved */}
        {provenance?.cid && (
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
              Preserved by Hivemind
            </p>
            <p className="text-[13px] text-muted">
              Pinned to IPFS{provenance.verifiedAt ? ", integrity verified" : ""}
            </p>
          </div>
        )}

        {/* Share */}
        <ShareButton title={title} />
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
