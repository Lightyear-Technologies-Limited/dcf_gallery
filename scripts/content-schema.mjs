// C.4 — Zod schemas for the editorial content layer. Shared by the build join
// (scripts/build-editorial.mjs) and any CI validation. Build-time only; never
// shipped to the client (the app imports the validated JSON + plain TS types).
import { z } from "zod";

const essay = {
  essayUrl: z.url("essayUrl must be a valid URL").optional(),
  essayTitle: z.string().min(1, "essayTitle must not be empty").optional(),
};

export const ArtistEditorial = z
  .object({
    bio: z.string().min(1, "bio is required"),
    ...essay,
  })
  .strict();

export const CollectionEditorial = z
  .object({
    // May be empty for not-yet-written notes (tracked by plan item C.6).
    curatorNote: z.string(),
    ...essay,
  })
  .strict();

export const ArtistsFile = z.record(z.string(), ArtistEditorial);
export const CollectionsFile = z.record(z.string(), CollectionEditorial);
