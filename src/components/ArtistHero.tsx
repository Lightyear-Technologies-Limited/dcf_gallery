import Link from "next/link";
import Image from "next/image";

interface Candidate {
  src: string;
  title: string;
  isPunk: boolean;
}

interface Props {
  artistSlug: string;
  candidates: Candidate[];
}

/**
 * Renders the first candidate. The Artists index pins a specific piece
 * per artist upstream, so this component just frames it — no rotation,
 * no client state. Rotation can be reintroduced later if we want it.
 */
export default function ArtistHero({ artistSlug, candidates }: Props) {
  if (candidates.length === 0) return null;
  const hero = candidates[0];

  return (
    <Link
      href={`/artist/${artistSlug}`}
      // Uniform aspect-[16/9] frame per artist so every row on /artists
      // has the same hero footprint regardless of the artwork's natural
      // ratio. Image inside is object-contain (never cropped). For
      // punks, the teal background is constrained to a square pane
      // inside the 16:9 frame (the canonical 1:1 punk display) rather
      // than stretched the full frame width.
      className="block w-full aspect-[16/9] flex items-center justify-center overflow-hidden"
    >
      {hero.isPunk ? (
        <div className="aspect-square h-full bg-punk flex items-center justify-center overflow-hidden">
          <Image
            src={hero.src}
            alt={hero.title}
            width={1200}
            height={1200}
            className="max-w-full max-h-full w-auto h-auto [image-rendering:pixelated]"
            sizes="(max-width: 768px) 90vw, 55vw"
          />
        </div>
      ) : (
        <Image
          src={hero.src}
          alt={hero.title}
          width={1200}
          height={1200}
          className="max-w-full max-h-full w-auto h-auto"
          sizes="(max-width: 768px) 90vw, 55vw"
        />
      )}
    </Link>
  );
}
