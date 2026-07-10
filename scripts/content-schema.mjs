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

// Optional generic external links (artist site profile, catalogue page,
// press coverage, credited collaborator link, etc.). Rendered as a
// small list under the piece/collection links block. Kept flexible so
// non-X / non-essay references have a home without adding a new field
// per link type.
const linkArray = {
  links: z
    .array(
      z
        .object({
          label: z.string().min(1, "link.label must not be empty"),
          url: z.url("link.url must be a valid URL"),
        })
        .strict(),
    )
    .optional(),
};

// Context section — a small ledger of externally-referenced signals about
// the piece / collection, rendered as a "Context" block right below the
// Exhibitions block on the piece page. Announcement posts, artist / critic
// responses (Ethnograph by Tynett on the Masks of Luci), press write-ups.
// Extensible: append new entries here as the piece accumulates external
// commentary. Distinct from `links[]` which is the miscellaneous
// external-links block at the bottom of the info column.
const contextArray = {
  context: z
    .array(
      z
        .object({
          label: z.string().min(1, "context.label must not be empty"),
          url: z.url("context.url must be a valid URL"),
        })
        .strict(),
    )
    .optional(),
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
    ...linkArray,
    ...contextArray,
  })
  .strict();

// Per-piece editorial overlay. Carries the optional X thread / announcement
// link (legacy), the generic `links[]` for external references
// (samspratt.com profile, catalogue page), and the newer `context[]` for
// announcement + response items rendered as their own "Context" section
// below the Exhibitions block on the piece page.
export const PieceEditorial = z
  .object({
    ...xLink,
    ...linkArray,
    ...contextArray,
  })
  .strict();

export const ArtistsFile = z.record(z.string(), ArtistEditorial);
export const CollectionsFile = z.record(z.string(), CollectionEditorial);
export const PiecesFile = z.record(z.string(), PieceEditorial);
