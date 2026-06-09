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
