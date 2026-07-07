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
    // Hivemind-voice commentary on why we collect this artist. Optional
    // during migration; once every artist has one this can tighten.
    curatorNote: z.string().optional(),
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

// Per-piece editorial overlay. Currently only carries an optional X
// thread / announcement link, rendered on the piece page. Populate
// `content/editorial/pieces/<slug>.json` only when a piece has a
// specific thread (TIME, ROTTEN, Fidenza #456, Tyler Hobbs 1/1s, etc).
export const PieceEditorial = z
  .object({
    ...xLink,
  })
  .strict();

export const ArtistsFile = z.record(z.string(), ArtistEditorial);
export const CollectionsFile = z.record(z.string(), CollectionEditorial);
export const PiecesFile = z.record(z.string(), PieceEditorial);
