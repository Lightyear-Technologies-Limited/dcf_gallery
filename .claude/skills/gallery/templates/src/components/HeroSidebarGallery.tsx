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
 * Hero + sidebar composite. The heroPiece renders as a (sidebarRows ×
 * sidebarRows)-height block on the left; the next (sidebarCols ×
 * sidebarRows) pieces render as smaller cells on the right. Anything past
 * that spills into a plain grid below.
 */
export default function HeroSidebarGallery({
  pieces,
  heroSlug,
  sidebarCols,
  sidebarRows,
  sidebarSlugs,
  hrefSearch,
}: {
  pieces: Piece[];
  heroSlug: string;
  sidebarCols: number;
  sidebarRows: number;
  sidebarSlugs?: string[];
  hrefSearch?: string;
}) {
  const hero = pieces.find((p) => p.slug === heroSlug);
  if (!hero) return null;

  const bySlug = new Map(pieces.map((p) => [p.slug, p]));
  const explicitSidebar = (sidebarSlugs ?? [])
    .map((s) => bySlug.get(s))
    .filter((p): p is Piece => !!p);

  const sidebarCount = sidebarCols * sidebarRows;
  const sidebar = explicitSidebar.length
    ? explicitSidebar.slice(0, sidebarCount)
    : pieces.filter((p) => p.slug !== heroSlug).slice(0, sidebarCount);

  const used = new Set<string>([hero.slug, ...sidebar.map((p) => p.slug)]);
  const spill = pieces.filter((p) => !used.has(p.slug));

  const heroSrc = getArtworkImage(hero.slug, hero.contractAddress, hero.tokenId, "detail");

  return (
    <div className="space-y-6">
      <div
        className="grid gap-4 md:gap-6"
        style={{
          gridTemplateColumns: `1fr repeat(${sidebarCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${sidebarRows}, minmax(0, 1fr))`,
        }}
      >
        {heroSrc && (
          <div style={{ gridColumn: "1 / 2", gridRow: `1 / span ${sidebarRows}` }}>
            <GridArtwork
              slug={hero.slug}
              src={heroSrc}
              title={hero.title}
              isPunk={hero.collectionSlug === "cryptopunks"}
              hrefSearch={hrefSearch}
            />
          </div>
        )}
        {sidebar.map((p) => {
          const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "thumb");
          if (!src) return null;
          return (
            <div key={p.slug}>
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

      {spill.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-${sidebarCols + 1} gap-4 md:gap-6`}>
          {spill.map((p) => {
            const src = getArtworkImage(p.slug, p.contractAddress, p.tokenId, "thumb");
            if (!src) return null;
            return (
              <div key={p.slug}>
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
      )}
    </div>
  );
}
