import { z } from "zod";

/** Zod schemas for editorial JSON files. Used by build-editorial.mjs. */

const linkArray = {
  links: z.array(z.object({ label: z.string().min(1), url: z.url() }).strict()).optional(),
};
const contextArray = {
  context: z.array(z.object({ label: z.string().min(1), url: z.url() }).strict()).optional(),
};

export const ArtistEditorial = z.object({
  bio: z.string().optional(),
  portraitCredit: z.string().optional(),
  ...linkArray,
}).strict();

export const CollectionEditorial = z.object({
  curatorNote: z.string().optional(),
  essayUrl: z.url().optional(),
  essayTitle: z.string().optional(),
  ...linkArray,
  ...contextArray,
}).strict();

export const PieceEditorial = z.object({
  curatorNote: z.string().optional(),
  ...linkArray,
  ...contextArray,
}).strict();
