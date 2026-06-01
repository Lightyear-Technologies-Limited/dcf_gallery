// DCF's curatorial thesis: five chapters of digital art.
//
// Chapters use the page's foreground token - no color accent. Chapters are
// differentiated by name and position only. The `color` field is preserved
// for legacy render sites that pass `ch.color` to inline styles; using the
// CSS variable means it auto-switches with light/dark mode.

export interface Chapter {
  name: string;
  slug: string;
  color: string;
  artists: string[];
  description: string;
}

export const CHAPTERS: Chapter[] = [
  {
    name: "AI Art",
    slug: "ai-art",
    color: "var(--foreground)",
    artists: ["refik-anadol"],
    description:
      "Art and artists that use machine learning, neural networks, and/or large data systems as their primary medium, rendering archives, atmosphere, and memory as continuous moving image.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    color: "var(--foreground)",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "Art and artists that are native to the blockchain, and/or deeply tied to crypto culture and the early digital art movement.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    color: "var(--foreground)",
    artists: ["a-c-k", "operator", "sam-spratt"],
    description:
      "Digital-native artists who use visual storytelling, traditional art skills, and/or immersive media to build narratives, characters, or concepts in digital form.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    color: "var(--foreground)",
    artists: ["larva-labs"],
    description:
      "Generative collections and projects that establish on-chain identity, where algorithmic artwork doubles as profile picture, status object, and/or community membership.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    color: "var(--foreground)",
    artists: ["tyler-hobbs", "dmitri-cherniak"],
    description:
      "Artists who design algorithmic systems rather than finished works, where each piece in a collection is a unique output of the same underlying logic.",
  },
];

export const CHAPTER_COLORS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const ch of CHAPTERS) for (const a of ch.artists) map[a] = ch.color;
  return map;
})();

/** Find the chapter an artist belongs to, or null if unassigned. */
export function getChapterForArtist(artistSlug: string): Chapter | null {
  return CHAPTERS.find((ch) => ch.artists.includes(artistSlug)) || null;
}
