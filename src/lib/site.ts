// Canonical site origin for absolute URLs (OG, canonical, sitemap, robots, JSON-LD,
// llms.txt). Resolution order:
//   1. NEXT_PUBLIC_SITE_URL          — set this once the real domain is live
//   2. VERCEL_PROJECT_PRODUCTION_URL — the project's stable *.vercel.app domain
//   3. VERCEL_URL                    — the per-deployment URL (preview deploys)
//   4. the eventual production domain (local/dev fallback)
//
// So a Vercel deploy self-references correctly — shared preview links unfurl with a
// working OG card and a correct sitemap/canonical — with no configuration at all.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://gallery.hivemind.capital";
}

export const SITE_URL = resolveSiteUrl();

/**
 * Serialize a JSON-LD graph for injection into a <script type="application/ld+json">.
 *
 * Plain JSON.stringify is not safe inside a <script> element: HTML parsing wins over
 * JSON, so a literal `</script>` anywhere in the payload closes the block early and
 * everything after it is parsed as markup. Curator-authored editorial copy is the
 * realistic source here (a note quoting an HTML tag), not an attacker — but the copy
 * is CMS-editable, so the escape belongs at the sink rather than in a review checklist.
 *
 * Escaping `<` to its < JSON escape is inert to JSON.parse and to consumers
 * (Google's parser unescapes it), so structured data is unaffected.
 */
export function ldJson(graph: unknown): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
