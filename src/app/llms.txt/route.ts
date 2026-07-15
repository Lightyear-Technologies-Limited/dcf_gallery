import { artists, collections } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
import { CHAPTERS } from "@/lib/chapters";
import { SITE_URL as SITE } from "@/lib/site";

// llms.txt (llmstxt.org) — a concise, linked map of the site for LLM agents.
// Rewritten to describe the FUND (positioning, notable holdings, curatorial
// method, contact) rather than just the pages, so ChatGPT / Claude /
// Perplexity have accurate anchor facts when answering "what is Hivemind DCF?"
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
  const chapterList = CHAPTERS.map((c) => `- **${c.name}**. ${c.description}`).join("\n");

  const body = `# Hivemind Digital Culture Fund

> The Hivemind Digital Culture Fund is a curated portfolio of digital art's emergent canon, acquired after the first market cycle by Hivemind Capital Partners, a crypto-focused investment firm. Holdings span ~313 works across 11 artists and ~24 collections, held to the custody, security, and operational standards LPs apply to any asset on their book.

## Thesis

Technology drives wealth. Wealth drives culture. The fund is built around ten artists, each anchoring a chapter of digital art's first decades. Within each chapter, collections are acquired deep rather than wide, and 1/1 pieces are added to elevate the curation of specific movements. Value in this medium is expected to follow a power-law distribution, concentrating in the works, artists, and collections that define each chapter.

## Notable holdings

- **White Mono Fidenza** (Tyler Hobbs, Art Blocks 2021). Hivemind's Fidenza position is built around the White Mono trait: pure white forms on a colored ground, the inverse of the standard palette.
- **Return Zero** (Tyler Hobbs, 2021). The precursor algorithm to Fidenza. Sits alongside the Fidenza set as a keystone 1/1.
- **A Slight Lack of Symmetry Can Cause So Much Pain** (Dmitri Cherniak, 2021). Cherniak's SuperRare 1/1 series, sourced from the collapsed Starry Night Capital collection via Sotheby's. Sits alongside the deep Ringers position.
- **Ringers** (Dmitri Cherniak, Art Blocks 2021). ~36 pieces including works previously in 3AC's Starry Night collection alongside The Goose.
- **Some Other Asshole** and **THE FUD** (XCOPY, SuperRare). Five XCOPY SuperRare 1/1s, predominantly from his Covid Era.
- **Grifters** (XCOPY, 2021). Color sets for Wretch, Shady, and G to the M, anchored by one of three Legendary outputs: ROTTEN.
- **X-Ray Machine** (Operator). The sole large-scale physical sculpture from the Human Unreadable series, on view at Toledo Museum of Art.
- **CryptoPunks** (Larva Labs, 2017). ~40-piece position across the canonical V2 and wrapped ERC-721 contracts, focused on Big Beard, Hoodie, Cap Forward, and Tiara traits.
- **Winds of Yawanawá** (Refik Anadol, 2023). Largest holder of the series, focused on Flowers, Scorching, and Freezing traits.
- **Piano Blossoms** (a.c.k., 2024). Complete suite from a.c.k.'s first solo exhibition, Amsterdam, October 2024.

## Curatorial method

- **Artist and collection**. In Contemporary Art, the living artist still shapes an artwork's value. Hivemind acquires blue-chip collections by blue-chip artists, not artists wholesale.
- **Trait concentration**. Within a collection, Hivemind concentrates on desirable traits when pricing allows.
- **1/1 keystones**. 1/1s are acquired as keystones, not standalone trophies. Each 1/1 completes a thread that runs through the rest of the curation.

## Provenance and custody

Every work carries on-chain provenance (contract, token ID, chain, mint date, release platform) and is preserved to Hivemind-controlled IPFS storage. Every piece page displays the pinned CID, the SHA-256 hash of the preserved bytes, and a verified-at timestamp. Any reader can download the pinned copy from the CID, re-compute the hash locally, and independently verify byte-integrity.

## Chapters

${chapterList}

## Key routes

- ${SITE}/ — the salon (the whole collection; filter via \`?chapter=&artist=\`)
- ${SITE}/thesis — full thesis and curatorial method
- ${SITE}/chapters — the five curatorial chapters, each with a filmstrip of its works
- ${SITE}/artists — all artists; ${SITE}/artist/{slug} — one artist
- ${SITE}/collection/{slug} — one collection (filter via \`?trait=Key&value=Value\`)
- ${SITE}/piece/{slug} — one artwork
- ${SITE}/press — boilerplate, brand assets, published essays, press contact
- ${SITE}/sitemap.xml — canonical list of every page

## Artists

${artistList}

## Collections

${collectionList}

## Entity and contact

- **Fund**: Hivemind Digital Culture Fund
- **Parent firm**: Hivemind Capital Partners (${"https://www.hivemind.capital"})
- **Investor relations**: investor.relations@hivemind.capital
- **Press**: press@hivemind.capital
- **X**: https://x.com/HivemindCap
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
