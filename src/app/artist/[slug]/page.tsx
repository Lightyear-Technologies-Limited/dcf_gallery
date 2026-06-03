import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { artists, collections, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortCollections,
  sortPieces,
  isCollectionHidden,
  getPiecesPerRow,
  getPieceRows,
  getHeroLayout,
} from "@/lib/curation";
import { getChapterForArtist } from "@/lib/chapters";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import HeroSidebarGallery from "@/components/HeroSidebarGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";
import CuratorNote from "@/components/CuratorNote";

const MERGE_INTO: Record<string, string> = {
  "tyler-hobbs-and-dandelion-wist": "tyler-hobbs",
};

export function generateStaticParams() {
  return artists
    .filter((a) => !MERGE_INTO[a.slug])
    .map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug);
  if (!artist) notFound();

  const artistName = getArtistDisplayName(artist.slug, artist.name);
  const chapter = getChapterForArtist(artist.slug);

  // Include merged artists (e.g., Dandelion Wist under Tyler Hobbs).
  const mergedSlugs = Object.entries(MERGE_INTO)
    .filter(([, parent]) => parent === artist.slug)
    .map(([child]) => child);
  const allSlugs = [artist.slug, ...mergedSlugs];

  const artistCollections = sortCollections(
    artist.slug,
    collections
      .filter((c) => allSlugs.includes(c.artistSlug) && !isCollectionHidden(c.slug))
      .map((col) => ({
        name: getCollectionDisplayName(col.slug, col.name),
        slug: col.slug,
        description: col.description,
        medium: col.medium,
        mintDate: col.mintDate,
        totalSupply: col.totalSupply,
        piecesPerRow: getPiecesPerRow(col.slug),
        pieceRows: getPieceRows(col.slug),
        pieces: sortPieces(
          col.slug,
          getPiecesByCollection(col.slug).map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            collectionSlug: p.collectionSlug,
            artistSlug: p.artistSlug,
            medium: p.medium,
            contractAddress: p.contractAddress,
            tokenId: p.tokenId,
          }))
        ),
      }))
  );

  const totalWorks = artistCollections.reduce((s, c) => s + c.pieces.length, 0);

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Top row mirrors the collection page's breadcrumb + sibling-nav
          structure so the h1 below sits at the same vertical position
          on both routes (no jump when navigating Artist <-> Collection).
          Chapter eyebrow doubles as navigational lineage back to the
          chapter filter on the homepage. */}
      <div className="pt-8">
        <p className="text-[13px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">
            Collection
          </Link>
          {" / "}
          <Link href="/artists" className="hover:text-foreground transition-colors duration-200">
            Artists
          </Link>
          {" / "}
          {artistName}
        </p>
        {chapter && (
          <div className="mt-6 text-[13px]">
            <Link
              href={`/?chapter=${chapter.slug}`}
              className="text-muted hover:text-foreground transition-colors duration-200"
              style={{ color: chapter.color }}
            >
              {chapter.name}
            </Link>
          </div>
        )}
      </div>
      {/* Editorial header - name left, bio right */}
      <div className="pt-6 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 md:gap-16">
        <div>
          <h1 className="font-serif display-lg text-balance">
            {artistName}
          </h1>
          {/* Portrait + count line. Portrait acts as the artist's identity
              badge (XCOPY's signature avatar, Tyler Hobbs's photograph,
              etc.). Sits inline with the holdings count so it earns the
              real-estate the count alone used to occupy, and gives the
              page an anchor below the wordmark h1. Absent portrait
              gracefully degrades to just the count line. */}
          <div className="mt-4 flex items-center gap-3">
            {artist.portrait && (
              <Image
                src={artist.portrait}
                alt=""
                width={56}
                height={56}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            )}
            <p className="text-[13px] text-muted tabular-nums">
              {artistCollections.length} collection{artistCollections.length === 1 ? "" : "s"} · {totalWorks} works
            </p>
          </div>

          {/* Collection list for multi-collection artists - links straight
              to the dedicated collection page rather than scrolling within
              this page. The in-page sections below (which also link to the
              same collection pages) act as inline previews; the top list is
              the catalogue index. */}
          {artistCollections.length > 0 && (
            <ol className="mt-6 space-y-1.5 text-[13px]">
              {artistCollections.map((col) => (
                <li key={col.slug} className="flex items-baseline justify-between gap-3 max-w-[260px]">
                  <Link
                    href={`/collection/${col.slug}`}
                    className="text-foreground-secondary hover:text-foreground transition-colors duration-200"
                  >
                    {col.name}
                  </Link>
                  <span className="text-muted tabular-nums">{col.pieces.length}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Socials live in the LEFT column under the count line so they
              fill the natural air pocket that opens up when the right
              column carries more content than the left (especially for
              single-collection artists - Beeple, Refik, Sam Spratt et al.
              where the count line is short). Pulled up from the previous
              below-grid placement; lets the gallery climb the page. */}
          {(artist.website || artist.twitter || artist.instagram) && (
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              {artist.website && (
                <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Website
                </a>
              )}
              {artist.twitter && (
                <a href={artist.twitter} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Twitter
                </a>
              )}
              {artist.instagram && (
                <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 md:pt-4">
          {artist.bio && (
            <p className="text-[20px] text-foreground-secondary leading-[1.6]">
              {artist.bio}
            </p>
          )}
          {/* curationComment is the curator's voice - given its own attributed
              block (HIVEMIND COMMENTARY) instead of running on as a second bio
              paragraph, so a reader can clearly tell what is DCF's view. */}
          {artist.curationComment && (
            <CuratorNote text={artist.curationComment} variant="inline" />
          )}
          {artist.essayUrl && (
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
                Essay
              </p>
              <a
                href={artist.essayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] text-foreground-secondary hover:text-foreground transition-colors duration-200 inline-block underline underline-offset-4 decoration-border hover:decoration-foreground"
              >
                {artist.essayTitle || "Read the essay"} →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Artist quote - left-aligned in the 7fr-style column, smaller (22px
          instead of 28), italic Argent (genuine pullquote earns italic). No
          longer centered with curly-quotes - that read as decoration competing
          with the H1 for hero status. */}
      {artist.artistQuote && (
        <div className="pt-16 max-w-[680px]">
          <p className="font-serif italic text-[22px] leading-[1.5] text-foreground-secondary">
            {artist.artistQuote}
          </p>
          <p className="text-[13px] text-muted mt-4">- {artistName}</p>
        </div>
      )}

      {/* Collections. Always render a per-collection title + count above
          each gallery (multi-collection OR single-collection artists alike)
          so the structure is consistent across the spread. No description
          gutter beside the artwork - the artist-level About + Hivemind
          Commentary at the top of the page already does that work; per-
          collection prose beside each gallery would compete with the
          actual art for attention. Holdings count omitted when n === 1
          (a single piece IS the gallery; the count carries no info). */}
      <div className="pt-16 pb-12 space-y-20">
        {artistCollections.map((col) => {
          const n = col.pieces.length;
          const piece = col.pieces[0];
          const heroImage =
            n === 1 && piece
              ? getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail")
              : null;

          let ideal: number;
          if (col.piecesPerRow && col.piecesPerRow > 0) ideal = col.piecesPerRow;
          else if (n <= 3) ideal = Math.max(n, 1);
          else if (n <= 6) ideal = 3;
          else if (n <= 12) ideal = 4;
          else ideal = 5;

          return (
            <section key={col.slug} id={col.slug}>
              <div className="mb-8">
                <Link
                  href={`/collection/${col.slug}`}
                  className="font-serif display-sm hover:opacity-60 transition-opacity duration-200 inline-block"
                >
                  {col.name}
                </Link>
              </div>

              {/* Gallery */}
              {(() => {
                const heroLayout = getHeroLayout(col.slug);
                if (n === 1 && heroImage && piece) {
                  return (
                    <SinglePieceDisplay
                      slug={piece.slug}
                      src={heroImage}
                      title={piece.title}
                      isPunk={piece.collectionSlug === "cryptopunks"}
                    />
                  );
                }
                if (heroLayout) {
                  return (
                    <HeroSidebarGallery
                      pieces={col.pieces}
                      heroSlug={heroLayout.heroPiece}
                      sidebarCols={heroLayout.sidebarCols}
                      sidebarRows={heroLayout.sidebarRows}
                      sidebarSlugs={heroLayout.sidebarPieces}
                      fallbackPerRow={ideal}
                    />
                  );
                }
                if (col.pieceRows && Object.keys(col.pieceRows).length > 0) {
                  return (
                    <FixedRowGallery
                      pieces={col.pieces}
                      rowMap={col.pieceRows}
                      fallbackPerRow={ideal}
                    />
                  );
                }
                return <JustifiedGallery pieces={col.pieces} piecesPerRow={ideal} />;
              })()}
            </section>
          );
        })}
      </div>
    </div>
  );
}
