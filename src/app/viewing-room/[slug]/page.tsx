import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { pieces, getArtist, getCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import { getArtistDisplayName, getCollectionDisplayName } from "@/lib/curation";
import { CHAPTER_COLORS } from "@/lib/chapters";

// Viewing rooms: curated vertical scrolls of flagship pieces.
// Each entry: piece slug + optional curatorial paragraph.
const VIEWING_ROOMS: Record<
  string,
  { title: string; subtitle: string; pieces: { slug: string; note?: string }[] }
> = {
  "flagship-1-1s": {
    title: "The 1/1s",
    subtitle:
      "Singular works acquired for their cultural weight \u2014 each a one-of-one statement by its artist.",
    pieces: [
      {
        slug: "superrare-beeple-24644-b9e0",
        note: "TIME: The Future of Business was created for a 2021 TIME magazine cover. The 1/1 NFT was acquired by the Digital Culture Fund in April 2025.",
      },
      {
        slug: "tyler-hobbs-2-8e82",
        note: "Harbor Scene #2 (after John Henry Twachtman) was acquired through a private sale via LACMA and Cactoid Labs \u2014 a generative reinterpretation of Twachtman\u2019s Impressionist harbor painting.",
      },
      {
        slug: "tyler-hobbs-1-9345",
        note: "Return Zero [Blue] is one of Tyler Hobbs\u2019 singular 1/1 works \u2014 a meditation on algorithmic reset and the tension between control and surprise.",
      },
      {
        slug: "tyler-hobbs-2-9345",
        note: "Elektroanima fuses digital process with organic energy \u2014 the computational analog of a living brushstroke.",
      },
      {
        slug: "tyler-hobbs-3-9345",
        note: "One One Overflow pushes Hobbs\u2019 system to its limits, embracing the moment where precision tips into beautiful disorder.",
      },
      {
        slug: "x-ray-machine-1",
        note: "The X-Ray Machine is a monumental physical sculpture by Operator, currently in the Infinite Images exhibition at Toledo Museum of Art.",
      },
      {
        slug: "skulls-of-luci-12-d27c",
        note: "Skulls of Luci marks an earlier chapter in Sam Spratt\u2019s Luci universe, establishing the visual and narrative foundations for one of digital art\u2019s most ambitious storytelling projects.",
      },
      {
        slug: "her-favorite-flowers-2-fe63",
        note: "A singular work from a.c.k.\u2019s exploration of botanical and emotive imagery.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(VIEWING_ROOMS).map((slug) => ({ slug }));
}

/**
 * Viewing rooms are not surfaced in public navigation right now - they exist
 * as a parked format for future curated exhibitions. Block search indexing so
 * a direct URL doesn't end up in Google before we commit to the program.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ViewingRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = VIEWING_ROOMS[slug];
  if (!room) notFound();

  const resolved = room.pieces
    .map((entry) => {
      const piece = pieces.find((p) => p.slug === entry.slug);
      if (!piece) return null;
      const image = getArtworkImage(
        piece.slug,
        piece.contractAddress,
        piece.tokenId,
        "detail"
      );
      const artist = getArtist(piece.artistSlug);
      const collection = getCollection(piece.collectionSlug);
      return { piece, image, artist, collection, note: entry.note };
    })
    .filter(
      (r): r is NonNullable<typeof r> => r !== null && r.image !== null
    );

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="pt-[120px] max-w-[680px]">
        <p className="text-[13px] text-muted mb-8">
          <Link
            href="/"
            className="hover:text-foreground transition-colors duration-200"
          >
            Collection
          </Link>
          {" / "}
          {room.title}
        </p>
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-5">
          Viewing Room
        </p>
        <h1 className="font-serif display">
          {room.title}
        </h1>
        <p className="text-[20px] text-foreground-secondary leading-[1.6] mt-8">
          {room.subtitle}
        </p>
      </div>

      {/* Pieces - one per screen, curatorial text between */}
      <div className="pt-24 pb-24 space-y-32">
        {resolved.map(({ piece, image, artist, collection, note }, i) => {
          const artistName = artist
            ? getArtistDisplayName(artist.slug, artist.name)
            : "";
          const collectionName = collection
            ? getCollectionDisplayName(collection.slug, collection.name)
            : "";
          const isPunk = piece.collectionSlug === "cryptopunks";

          return (
            <section key={piece.slug}>
              {/* Artwork - near-full-width */}
              <Link
                href={`/piece/${piece.slug}`}
                className={`block ${isPunk ? "bg-[#638596]" : ""}`}
              >
                <Image
                  src={image!}
                  alt={piece.title}
                  width={2400}
                  height={1600}
                  className={`block w-full h-auto max-h-[80vh] object-contain ${
                    isPunk ? "[image-rendering:pixelated]" : ""
                  }`}
                  sizes="(max-width: 1024px) 90vw, 1200px"
                  priority={i === 0}
                />
              </Link>

              {/* Caption + curatorial note */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-16">
                <div>
                  <Link
                    href={`/artist/${piece.artistSlug}`}
                    className="text-[16px] hover:opacity-60 transition-opacity duration-200"
                    style={
                      CHAPTER_COLORS[piece.artistSlug]
                        ? { color: CHAPTER_COLORS[piece.artistSlug] }
                        : undefined
                    }
                  >
                    {artistName}
                  </Link>
                  <p className="font-serif text-[24px] sm:text-[28px] tracking-tight leading-tight mt-2 text-foreground">
                    {piece.title}
                  </p>
                  <Link
                    href={`/collection/${piece.collectionSlug}`}
                    className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-2 inline-block"
                  >
                    {collectionName}
                  </Link>
                </div>
                {note && (
                  <p className="font-serif text-[20px] leading-[1.55] text-foreground-secondary md:pt-2">
                    {note}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Curator attribution - institutional convention for an online
          exhibition. DCF curates as an institution, not a named individual. */}
      <div className="border-t border-border pt-10 pb-16 max-w-[680px]">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
          Curated by
        </p>
        <p className="text-[16px] text-foreground-secondary mt-2">
          Hivemind Digital Culture Fund
        </p>
        <p className="text-[13px] text-muted tabular-nums mt-1">
          {resolved.length} work{resolved.length === 1 ? "" : "s"}
        </p>
        <Link
          href="/"
          className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-8 inline-block"
        >
          ← Back to the collection
        </Link>
      </div>
    </div>
  );
}
