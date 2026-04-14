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
      "Work in which machine learning is not a tool but a medium — models trained, guided, and contested until something resolves into an image.",
  },
  {
    name: "CryptoArt",
    slug: "cryptoart",
    color: "#E05555",
    artists: ["xcopy", "beeple", "kim-asendorf"],
    description:
      "The native art of a new medium — gestural, glitched, politically alert, and made for the chain it lives on.",
  },
  {
    name: "Digital Canvas",
    slug: "digital-canvas",
    color: "#6AAF5C",
    artists: ["a-c-k", "ack", "operator", "sam-spratt"],
    description:
      "Painters, illustrators, and narrative image-makers extending the canvas tradition into a screen-native practice.",
  },
  {
    name: "Digital Identity",
    slug: "digital-identity",
    color: "#4A9EC9",
    artists: ["larva-labs", "meebits"],
    description:
      "Avatars, profile pictures, and the grammar of self-representation on-chain — the earliest and most widely-held forms of digital ownership.",
  },
  {
    name: "Generative Art",
    slug: "genart",
    color: "#C4956A",
    artists: ["tyler-hobbs", "dmitri-cherniak"],
    description:
      "Algorithmic authorship — artists who write the rules and let the work complete itself, one output at a time.",
  },
];

export const CHAPTER_COLORS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const ch of CHAPTERS) for (const a of ch.artists) map[a] = ch.color;
  return map;
})();
