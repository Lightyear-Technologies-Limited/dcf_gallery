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
      "Art made with machine learning as a primary medium. Trained models render datasets as moving image.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    color: "var(--foreground)",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "Artists native to the blockchain - the early on-chain practice that shaped what digital art became.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    color: "var(--foreground)",
    artists: ["a-c-k", "operator", "sam-spratt"],
    description:
      "Digital-native artists working in the lineage of figurative painting and visual narrative - studio practice translated to on-chain canvas.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    color: "var(--foreground)",
    artists: ["larva-labs"],
    description:
      "Generative collections where the artwork is also identity - profile picture, status object, membership card.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    color: "var(--foreground)",
    artists: ["tyler-hobbs", "dmitri-cherniak"],
    description:
      "Artists who design algorithms rather than individual works. Each piece is a unique output of one shared system.",
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
