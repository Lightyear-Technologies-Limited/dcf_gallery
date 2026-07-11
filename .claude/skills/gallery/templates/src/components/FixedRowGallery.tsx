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
 * Fixed-row gallery. Reads explicit row assignments from curation.json
 * → pieceRows[collectionSlug], groups pieces by row number, renders each
 * row as a flex line. Pieces without an assignment fall into an
 * auto-assigned trailing row.
 */
export default function FixedRowGallery({
  pieces,
  pieceRows,
  hrefSearch,
}: {
  pieces: Piece[];
  pieceRows: Record<string, number>;
  hrefSearch?: string;
}) {
  const grouped = new Map<number, Piece[]>();
  const untagged: Piece[] = [];
  for (const p of pieces) {
    const row = pieceRows[p.slug];
    if (typeof row === "number") {
      if (!grouped.has(row)) grouped.set(row, []);
      grouped.get(row)!.push(p);
    } else untagged.push(p);
  }
  const rows = [...grouped.entries()].sort(([a], [b]) => a - b).map(([, arr]) => arr);
  if (untagged.length) rows.push(untagged);

  return (
    <div className="space-y-6">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-4 md:gap-6">
          {row.map((p) => {
            const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "thumb");
            if (!src) return null;
            return (
              <div key={p.slug} className="flex-1 min-w-[240px]">
                <GridArtwork
                  slug={p.slug}
                  src={src}
                  title={p.title}
                  isPunk={p.collectionSlug === "cryptopunks"}
                  hrefSearch={hrefSearch}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
