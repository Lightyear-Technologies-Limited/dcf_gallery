/**
 * Curatorial chapters. Groups artists into thematic sections.
 *
 * If your catalogue doesn't have chapters, leave the array empty; the
 * /chapters route + chapter filter row on the home page will hide
 * themselves.
 *
 * Colors are OKLCH — hue + light chroma so they read as tint accents,
 * never as saturated marketing color. Only the chapter title and the
 * active-filter chip use these; buttons and CTAs never do.
 */
export interface Chapter {
  slug: string;
  name: string;
  description: string;
  artists: string[];
  color: string;
}

export const CHAPTERS: Chapter[] = [
  // Example — replace with your fund's chapters, or leave empty.
  // {
  //   slug: "generative-art",
  //   name: "Generative art",
  //   description: "Algorithmic authorship: the artist writes the rules; the machine draws the piece.",
  //   artists: ["tyler-hobbs", "dmitri-cherniak"],
  //   color: "oklch(0.55 0.15 145)",
  // },
];

export const CHAPTER_COLORS = Object.fromEntries(
  CHAPTERS.map((c) => [c.slug, c.color]),
) as Record<string, string>;

export function getChapterForArtist(artistSlug: string): Chapter | null {
  return CHAPTERS.find((c) => c.artists.includes(artistSlug)) ?? null;
}
