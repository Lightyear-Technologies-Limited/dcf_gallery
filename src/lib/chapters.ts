// DCF's curatorial thesis: five chapters of digital art. Chapters are
// differentiated by name and description only — accent colour has been
// removed from every consumer, so no color field lives on the entity.

export interface Chapter {
  name: string;
  slug: string;
  artists: string[];
  description: string;
}

export const CHAPTERS: Chapter[] = [
  {
    name: "AI Art",
    slug: "ai-art",
    artists: ["refik-anadol"],
    description: "Art made with machine-learning models trained on data.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "Blockchain-native art deeply tied to crypto culture and the digital art movement.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    artists: ["a-c-k", "operator", "sam-spratt"],
    description:
      "Art that combines digital media with concept, performance, and participation.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    artists: ["larva-labs"],
    description:
      "Art that doubles as identity: profile pictures (PFPs), social signal, membership.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    artists: ["tyler-hobbs", "dmitri-cherniak"],
    description:
      "Art produced by artist-designed algorithms, minted on the blockchain.",
  },
];

/** Find the chapter an artist belongs to, or null if unassigned. */
export function getChapterForArtist(artistSlug: string): Chapter | null {
  return CHAPTERS.find((ch) => ch.artists.includes(artistSlug)) || null;
}
