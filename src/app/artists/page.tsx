import Link from "next/link";
import Image from "next/image";
import { artists, getPiecesByArtist, getCollectionsByArtist } from "@/lib/data";
import PlaceholderArt from "@/components/PlaceholderArt";

// Best representative piece per artist — { image, title, collection }
const FEATURED: Record<string, { image: string; title: string; collection: string }> = {
  "tyler-hobbs":     { image: "/art/fidenza-145.png",            title: "Fidenza #145",           collection: "Fidenza" },
  "dmitri-cherniak": { image: "/art/ringers-13000014.png",       title: "Ringers #14",            collection: "Ringers" },
  "xcopy":           { image: "/art/grifters/008.png",           title: "Grifter #8",             collection: "Grifters" },
  "refik-anadol":    { image: "/art/woy-103.png",                title: "Winds of Yawanawa #103", collection: "Winds of Yawanawa" },
  "larva-labs":      { image: "/art/cryptopunk-1568.png",        title: "CryptoPunk #1568",       collection: "CryptoPunks" },
  "sam-spratt":      { image: "/art/masks-442.png",              title: "Masks of Luci #442",     collection: "Masks of Luci" },
};

// Curated order
const ARTIST_ORDER = [
  "tyler-hobbs", "dmitri-cherniak", "xcopy", "refik-anadol", "larva-labs",
  "sam-spratt", "operator", "kim-asendorf", "ack", "beeple", "meebits",
];

const sorted = ARTIST_ORDER
  .map((slug) => artists.find((a) => a.slug === slug))
  .filter(Boolean) as typeof artists;

export default function ArtistsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-16">
      {sorted.map((artist) => {
        const works = getPiecesByArtist(artist.slug);
        const cols = getCollectionsByArtist(artist.slug);
        const featured = FEATURED[artist.slug];
        const firstPiece = works[0];
        const isPunk = artist.slug === "larva-labs" || artist.slug === "meebits";

        return (
          <Link
            key={artist.slug}
            href={`/artist/${artist.slug}`}
            className="group block border-b border-border py-16 first:pt-8"
          >
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              {/* Featured artwork — full dimensions, no cropping */}
              <div className="w-full md:w-[55%] shrink-0">
                {featured ? (
                  <div className={isPunk ? "bg-[#638596] inline-block" : ""}>
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      width={800}
                      height={800}
                      className={`block w-auto h-auto max-w-full max-h-[60vh] ${isPunk ? "[image-rendering:pixelated] w-[200px]" : ""}`}
                      sizes="(max-width: 768px) 90vw, 55vw"
                    />
                  </div>
                ) : firstPiece ? (
                  <div className="aspect-[4/3] w-full">
                    <PlaceholderArt collectionSlug={firstPiece.collectionSlug} pieceSlug={firstPiece.slug} />
                  </div>
                ) : null}
              </div>

              {/* Info — right side */}
              <div className="flex-1 md:pt-4">
                <h2 className="text-[32px] sm:text-[40px] tracking-tight leading-tight group-hover:opacity-60 transition-opacity duration-200">
                  {artist.name}
                </h2>
                <p className="text-[13px] text-muted mt-2">
                  {works.length} works &middot; {cols.length} collection{cols.length !== 1 ? "s" : ""}
                </p>
                {cols.length > 0 && (
                  <p className="text-[13px] text-muted mt-1">
                    {cols.map((c) => c.name).join(", ")}
                  </p>
                )}
                {artist.bio && (
                  <p className="text-[15px] text-foreground-secondary leading-relaxed mt-6 max-w-[400px]">
                    {artist.bio}
                  </p>
                )}
                {!artist.bio && (
                  <p className="text-[13px] text-muted italic mt-6">Biography forthcoming.</p>
                )}
                {featured && (
                  <div className="mt-8">
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted">Featured</p>
                    <p className="text-[13px] text-foreground mt-1">{featured.title}</p>
                    <p className="text-[13px] text-muted">{featured.collection}</p>
                  </div>
                )}
                <p className="text-[13px] text-muted mt-8 group-hover:text-foreground transition-colors duration-200">
                  View works &rarr;
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
