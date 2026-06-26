// C.4 — Zod schemas for the editorial content layer. Shared by the build join
// (scripts/build-editorial.mjs) and any CI validation. Build-time only; never
// shipped to the client (the app imports the validated JSON + plain TS types).
import { z } from "zod";

const essay = {
  essayUrl: z.url("essayUrl must be a valid URL").optional(),
  essayTitle: z.string().min(1, "essayTitle must not be empty").optional(),
};

// Optional X (Twitter) thread / announcement-post link. Renders alongside
// the essay link on the collection page. Authoritative source is the
// same per-collection JSON; populate when a thread exists.
const xLink = {
  xUrl: z.url("xUrl must be a valid URL").optional(),
  xLabel: z.string().min(1, "xLabel must not be empty").optional(),
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
    ...xLink,
  })
  .strict();

export const ArtistsFile = z.record(z.string(), ArtistEditorial);
export const CollectionsFile = z.record(z.string(), CollectionEditorial);
