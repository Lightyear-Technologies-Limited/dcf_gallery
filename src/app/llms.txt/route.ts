import { artists, collections } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
import { CHAPTERS } from "@/lib/chapters";
import { SITE_URL as SITE } from "@/lib/site";

// llms.txt (llmstxt.org) — a concise, linked map of the site for LLM agents.
// Generated from the data so it stays accurate. Served statically at /llms.txt.
export const dynamic = "force-static";

const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export function GET() {
  const artistList = artists
    .filter((a) => !MERGED.has(a.slug))
    .map((a) => `- [${getArtistDisplayName(a.slug, a.name)}](${SITE}/artist/${a.slug})`)
    .join("\n");
  const collectionList = collections
    .filter((c) => !isCollectionHidden(c.slug))
    .map((c) => `- [${getCollectionDisplayName(c.slug, c.name)}](${SITE}/collection/${c.slug})`)
    .join("\n");
  const chapterList = CHAPTERS.map((c) => `- **${c.name}** — ${c.description}`).join("\n");

  const body = `# Hivemind Digital Culture Fund — Gallery

> A curated, statically-generated showcase of the Hivemind Digital Culture Fund (DCF):
> the fund's NFT art holdings by XCOPY, Tyler Hobbs, Dmitri Cherniak, Refik Anadol,
> Larva Labs (CryptoPunks), Beeple, Sam Spratt, Operator, Kim Asendorf, A.C.K. and
> others — ~313 works across 11 artists and ~24 collections. Many works are animated
> (pinned video, on-chain generative HTML, or GIF) and play in-place.

## How it is organised
Artists → Collections → Pieces, grouped into five curatorial **Chapters**. Every
artwork has its own page with on-chain provenance (contract, token ID, pinned IPFS CID).

## Chapters
${chapterList}

## Key routes
- ${SITE}/ — the curated homepage (the whole collection; filter via \`?chapter=&artist=\`)
- ${SITE}/chapters — the five curatorial chapters, each with a filmstrip of its works
- ${SITE}/artists — all artists; ${SITE}/artist/{slug} — one artist
- ${SITE}/collection/{slug} — one collection
- ${SITE}/piece/{slug} — one artwork (on-piece trait filter: \`?trait={Key}&value={Value}\`)
- ${SITE}/about — about the fund
- ${SITE}/sitemap.xml — canonical list of every page

## Artists
${artistList}

## Collections
${collectionList}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
