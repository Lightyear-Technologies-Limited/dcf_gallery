// DCF's curatorial thesis: five chapters of digital art.
// Colors are applied only to artist headlines on each page.

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
    description:
      "Art and artists that use machine learning, neural networks, and/or large data systems as their primary medium, rendering archives, atmosphere, and memory as continuous moving image.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    color: "#E05555",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "Art and artists that are native to the blockchain, and/or deeply tied to crypto culture and the early digital art movement.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    color: "#6AAF5C",
    artists: ["a-c-k", "operator", "sam-spratt"],
    description:
      "Digital-native artists who use visual storytelling, traditional art skills, and/or immersive media to build narratives, characters, or concepts in digital form.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    color: "#4A9EC9",
    artists: ["larva-labs"],
    description:
      "Generative collections and projects that establish on-chain identity, where algorithmic artwork doubles as profile picture, status object, and/or community membership.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    color: "#C4956A",
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
