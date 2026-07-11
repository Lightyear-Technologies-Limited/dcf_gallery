import GridArtwork from "./GridArtwork";
import { getArtworkImage } from "@/lib/images";

interface Piece {
  slug: string;
  title: string;
  collectionSlug: string;
  contractAddress?: string;
  tokenId?: string;
}

/**
 * Default salon layout — a responsive CSS grid with a piecesPerRow hint.
 * Not a true justified layout (that requires row-height computation which
 * is fragile at build time); a fixed columns count is honest about the
 * catalogue's editorial structure.
 */
export default function JustifiedGallery({
  pieces,
  piecesPerRow = 4,
  maxRowHeight,
  showCaptions = false,
  hrefSearch,
}: {
  pieces: Piece[];
  piecesPerRow?: number;
  maxRowHeight?: number;
  showCaptions?: boolean;
  hrefSearch?: string;
}) {
  const gridCols = `grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(piecesPerRow, 3)} lg:grid-cols-${piecesPerRow}`;
  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6`}>
      {pieces.map((p) => {
        const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "thumb");
        if (!src) return null;
        return (
          <div key={p.slug} style={maxRowHeight ? { maxHeight: maxRowHeight } : undefined}>
            <GridArtwork
              slug={p.slug}
              src={src}
              title={p.title}
              isPunk={p.collectionSlug === "cryptopunks"}
              hrefSearch={hrefSearch}
              caption={showCaptions ? p.title : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
