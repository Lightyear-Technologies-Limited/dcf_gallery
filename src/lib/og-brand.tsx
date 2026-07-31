import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shared chrome for the generated OG cards (`opengraph-image.tsx` routes).
 *
 * The site root ships a hand-made static card (`src/app/opengraph-image.png`)
 * carrying the Hivemind wordmark. The generated per-route cards previously used a
 * letterspaced *text* eyebrow instead, so a share of /artists or /thesis unfurled
 * with no brand mark at all. These helpers put the real wordmark on every card so
 * the whole set reads as one system.
 *
 * SERVER ONLY — reads from disk at module scope. Imported exclusively by
 * `opengraph-image.tsx` routes, all of which prerender at build time, so the read
 * never happens at request time.
 */

// Inlined as a data URI: Satori (which backs ImageResponse) will not resolve a
// site-relative path, and an absolute URL would mean a network fetch during
// rendering. The wordmark is ~2.4KB, so inlining costs nothing.
const wordmark = readFileSync(join(process.cwd(), "public/brand/hivemind-black.png"));
export const WORDMARK_SRC = `data:image/png;base64,${wordmark.toString("base64")}`;

// Named OG_COLORS, not OG: every opengraph-image route names its default export
// `OG`, so the short name collides on import.
/** Card palette — mirrors the eggshell/warm-near-black tokens in globals.css. */
export const OG_COLORS = {
  bg: "#f8f8f7",
  fg: "#1a1815",
  secondary: "#4a4640",
  muted: "#7a746c",
  size: { width: 1200, height: 630 },
} as const;

/** The frame every generated card shares: eggshell ground, consistent padding. */
export const frameStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between" as const,
  background: OG_COLORS.bg,
  color: OG_COLORS.fg,
  padding: "64px 80px",
  // Minimum separation between the wordmark, the title block and the footer.
  // space-between alone collapses to zero once the middle block grows — that is
  // exactly how the old root card ended up with its roster sitting on top of its
  // footer. A gap makes the three bands unable to touch regardless of content.
  gap: 32,
};

/**
 * Wordmark lockup used as the top-left masthead on every generated card, in place
 * of the old text eyebrow. Width is set explicitly because Satori needs intrinsic
 * dimensions; 260x47 preserves the asset's 745x136 aspect ratio.
 */
export function Wordmark() {
  return (
    // Satori renders to a raster OG card; next/image has no meaning inside
    // ImageResponse, so a plain <img> is the only option here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={WORDMARK_SRC} width={260} height={47} alt="Hivemind" style={{ display: "flex" }} />
  );
}

/** Small-caps footer line, shared so the five cards stay typographically identical. */
export const footStyle = {
  display: "flex",
  fontSize: 16,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: OG_COLORS.muted,
  fontFamily: "sans-serif",
  fontWeight: 500,
};
