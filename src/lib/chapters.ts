// DCF's curatorial thesis: five chapters of digital art.
//
// Each chapter carries a single accent hue used on chapter dots (Thesis page)
// and highlighted chapter labels (homepage filter row). Per .impeccable.md
// principle #1: accent colors are for chapter labels only; everything else in
// the site is grayscale on warm neutrals. Muted mid-lightness values so the
// hues read on both eggshell and dark surfaces without turning garish.

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
    color: "#9B6FD0",
    artists: ["refik-anadol"],
    description: "Art made with machine-learning models trained on data.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    color: "#E05555",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "Blockchain-native art deeply tied to crypto culture and the digital art movement.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    color: "#6AAF5C",
    artists: ["a-c-k", "operator", "sam-spratt"],
    description:
      "Art that combines digital media with concept, performance, and participation.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    color: "#4A9EC9",
    artists: ["larva-labs"],
    description:
      "Art that doubles as identity: profile pictures (PFPs), social signal, membership.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    color: "#C4956A",
    artists: ["tyler-hobbs", "dmitri-cherniak"],
    description:
      "Art produced by artist-designed algorithms, minted on the blockchain.",
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
