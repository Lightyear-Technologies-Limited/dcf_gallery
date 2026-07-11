import Link from "next/link";
import { getArtworkImage } from "@/lib/images";

interface Work {
  slug: string;
  title: string;
  collectionSlug: string;
  contractAddress?: string;
  tokenId?: string;
}

/**
 * Horizontal-scrolling filmstrip of works within a chapter. Server
 * component — no client interactivity beyond native scroll.
 */
export default function ChapterFilmstrip({ works }: { name: string; works: Work[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
      {works.map((w) => {
        const src = getArtworkImage(w.slug, w.contractAddress, w.tokenId, "thumb");
        if (!src) return null;
        return (
          <Link
            key={w.slug}
            href={`/piece/${w.slug}`}
            className={`shrink-0 w-[240px] md:w-[300px] block ${
              w.collectionSlug === "cryptopunks" ? "bg-punk" : "bg-surface"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={w.title}
              loading="lazy"
              className={`block w-full h-auto ${w.collectionSlug === "cryptopunks" ? "[image-rendering:pixelated]" : ""}`}
            />
          </Link>
        );
      })}
    </div>
  );
}
