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
 * no client state.
 */
export default function ArtistHero({ artistSlug, candidates }: Props) {
  if (candidates.length === 0) return null;
  const hero = candidates[0];

  return (
    <Link
      href={`/artist/${artistSlug}`}
      // Uniform aspect-[9/8] frame per artist so every row on /artists
      // has the same hero footprint regardless of the artwork's natural
      // ratio. Image inside is object-contain (never cropped) - tall
      // pieces render narrower than the frame; wide pieces render
      // shorter. Punks keep their classic teal background to frame the
      // pixel art; everything else has no background fill so the
      // artwork sits on the page colour (no visible frame border).
      className={`block w-full aspect-[9/8] flex items-center justify-center overflow-hidden ${hero.isPunk ? "bg-punk" : ""}`}
    >
      <Image
        src={hero.src}
        alt={hero.title}
        width={1200}
        height={1200}
        className={`max-w-full max-h-full w-auto h-auto ${hero.isPunk ? "[image-rendering:pixelated]" : ""}`}
        sizes="(max-width: 768px) 90vw, 55vw"
      />
    </Link>
  );
}
