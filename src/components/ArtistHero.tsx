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
  /** Optional width/height aspect override. When provided, the hero
   *  renders at this aspect with object-cover (image crops to fill).
   *  When omitted, the hero renders in the default 9/8 letterbox frame
   *  with object-contain (image preserves intrinsic aspect, letterboxes
   *  inside the frame). Used by Kim Asendorf to force Lights to a 1:1
   *  square crop so the landscape Lights piece doesn't visually
   *  dominate the row. */
  aspect?: number;
}

export default function ArtistHero({ artistSlug, candidates, aspect }: Props) {
  if (candidates.length === 0) return null;
  const hero = candidates[0];

  // Override path: fit-to-aspect with object-cover crop.
  if (aspect !== undefined) {
    const frameAspect = hero.isPunk ? 1 : aspect;
    return (
      <Link
        href={`/artist/${artistSlug}`}
        style={{ aspectRatio: String(frameAspect) }}
        className="block w-full overflow-hidden"
      >
        {hero.isPunk ? (
          <div className="w-full h-full bg-punk flex items-center justify-center overflow-hidden">
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
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 90vw, 55vw"
          />
        )}
      </Link>
    );
  }

  // Default: 9/8 letterbox frame; image preserves intrinsic aspect.
  return (
    <Link
      href={`/artist/${artistSlug}`}
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
