import ChaptersView from "@/components/ChaptersView";
import { CHAPTERS } from "@/lib/chapters";
import { artists, collections, getPiecesByArtist } from "@/lib/data";
import { getArtistDisplayName, isCollectionHidden } from "@/lib/curation";
import { FUND_NAME } from "@/lib/site";

export default function ChaptersPage() {
  if (CHAPTERS.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
        <h1 className="font-serif display-sm">{FUND_NAME}</h1>
        <p className="mt-6 text-[16px] text-muted">Chapters have not been configured. Edit <code className="font-mono">src/lib/chapters.ts</code>.</p>
      </div>
    );
  }

  const data = CHAPTERS.map((ch) => {
    const chapterArtists = ch.artists
      .map((slug) => artists.find((a) => a.slug === slug))
      .filter(Boolean)
      .map((a) => ({ slug: a!.slug, name: getArtistDisplayName(a!.slug, a!.name) }));

    const works = ch.artists.flatMap((slug) =>
      getPiecesByArtist(slug).filter((p) => !isCollectionHidden(p.collectionSlug)),
    );
    return {
      slug: ch.slug,
      name: ch.name,
      description: ch.description,
      total: works.length,
      artists: chapterArtists,
      works: works.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        collectionSlug: p.collectionSlug,
        artistName: getArtistDisplayName(p.artistSlug, artists.find((a) => a.slug === p.artistSlug)?.name ?? ""),
        artistSlug: p.artistSlug,
        contractAddress: p.contractAddress,
        tokenId: p.tokenId,
      })),
    };
  });

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      <h1 className="font-serif display-sm">{FUND_NAME}</h1>
      <div className="mt-6 mb-8 max-w-3xl">
        <h2 className="font-serif display-sm mb-5">Chapters</h2>
      </div>
      <ChaptersView chapters={data} />
    </div>
  );
}
