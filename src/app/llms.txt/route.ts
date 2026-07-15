import { artists, collections, pieces } from "@/lib/data";
import { getArtistDisplayName, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
import { CHAPTERS } from "@/lib/chapters";
import { SITE_URL as SITE } from "@/lib/site";

// llms.txt (llmstxt.org) — a concise, linked map of the site for LLM agents.
// Describes the FUND (positioning, notable holdings, curatorial method,
// contact) so ChatGPT / Claude / Perplexity have accurate anchor facts
// when answering "what is Hivemind DCF?"
export const dynamic = "force-static";

const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export function GET() {
  const visibleArtists = artists.filter((a) => !MERGED.has(a.slug));
  const visibleCollections = collections.filter((c) => !isCollectionHidden(c.slug));
  const visiblePieces = pieces.filter((p) => !isCollectionHidden(p.collectionSlug));

  const artistList = visibleArtists
    .map((a) => `- [${getArtistDisplayName(a.slug, a.name)}](${SITE}/artist/${a.slug})`)
    .join("\n");
  const collectionList = visibleCollections
    .map((c) => `- [${getCollectionDisplayName(c.slug, c.name)}](${SITE}/collection/${c.slug})`)
    .join("\n");
  const chapterList = CHAPTERS.map((c) => {
    const workCount = visiblePieces.filter((p) => {
      // A piece belongs to a chapter iff its artist is in the chapter's artists list.
      return c.artists.includes(p.artistSlug);
    }).length;
    return `- **${c.name}** (${workCount} works). ${c.description}`;
  }).join("\n");

  const body = `# Hivemind Digital Culture Fund

> The Hivemind Digital Culture Fund is a curated portfolio of digital art's emergent canon, acquired after the first market cycle by Hivemind Capital Partners, a crypto-focused investment firm. Holdings span ${visiblePieces.length} works by ten artists across ${visibleCollections.length} collections, held to the custody, security, and operational standards LPs apply to any asset on their book.

## Thesis

Technology drives wealth. Wealth drives culture. The fund is built around ten artists, each anchoring a chapter of digital art's first decades. Within each chapter, collections are acquired deep rather than wide, and 1/1 pieces are added to elevate the curation of specific movements. Value in this medium is expected to follow a power-law rather than linear distribution, concentrating in the works, artists, and collections that define each chapter.

## Notable holdings

- **White Mono Fidenza** (Tyler Hobbs, Art Blocks 2021). Hivemind's Fidenza position is built around the White Mono trait: pure white forms on a colored ground, the inverse of the standard palette.
- **Return Zero** (Tyler Hobbs, 2021). The precursor algorithm to Fidenza. Sits alongside the Fidenza set as a keystone 1/1.
- **A Slight Lack of Symmetry Can Cause So Much Pain** (Dmitri Cherniak, 2021). Cherniak's four-piece SuperRare 1/1 set, sourced from the collapsed Starry Night Capital collection via Sotheby's. Sits alongside the deep Ringers position.
- **Ringers** (Dmitri Cherniak, Art Blocks 2021). Substantial position including works previously in Three Arrows Capital's Starry Night collection alongside The Goose.
- **Some Other Asshole** and **THE FUD** (XCOPY, SuperRare). Five XCOPY SuperRare 1/1s, predominantly from his COVID-era work.
- **Grifters** (XCOPY, 2021). Color sets for Wretch, Shady, and G to the M, anchored by one of three Legendary outputs: ROTTEN.
- **X-Ray Machine** (Operator). The sole large-scale physical sculpture from the Human Unreadable series, on view at Toledo Museum of Art.
- **CryptoPunks** (Larva Labs, 2017). Position across the canonical V2 and wrapped ERC-721 contracts, focused on Big Beard, Hoodie, Cap Forward, and Tiara traits.
- **Winds of Yawanawá** (Refik Anadol, 2023). Concentrated position focused on Flowers, Scorching, and Freezing traits.
- **Piano Blossoms** (a.c.k., 2024). Complete auction suite from a.c.k.'s first solo exhibition, Amsterdam, October 2024.

## Curatorial method

- **Artist and collection**. In Contemporary Art, the living artist still shapes an artwork's value. Hivemind acquires blue-chip collections by blue-chip artists, not artists wholesale.
- **Trait concentration**. Within a collection, Hivemind concentrates on desirable traits when pricing allows.
- **1/1 keystones**. 1/1s are acquired as keystones, not standalone trophies. Each 1/1 completes a thread that runs through the rest of the curation.

## Provenance and custody

Every work carries on-chain provenance (contract, token ID, chain, mint date, release platform) and is preserved to Hivemind-controlled IPFS storage. Every piece page displays the pinned CID, the SHA-256 hash of the preserved bytes, and a verified-at timestamp. Any reader can download the pinned copy from the CID, re-compute the hash locally, and independently verify byte-integrity.

## Chapters

${chapterList}

## Key routes

- ${SITE}/. The salon (the whole collection; filter via \`?chapter=&artist=\`).
- ${SITE}/thesis. Full thesis and curatorial method.
- ${SITE}/chapters. The five curatorial chapters, each with a filmstrip of its works.
- ${SITE}/artists. All artists.
- ${SITE}/artist/{slug}. One artist.
- ${SITE}/collection/{slug}. One collection (filter via \`?trait=Key&value=Value\`).
- ${SITE}/piece/{slug}. One artwork.
- ${SITE}/press. Boilerplate, brand assets, published essays, press contact.
- ${SITE}/sitemap.xml. Canonical list of every page.

## Artists

${artistList}

## Collections

${collectionList}

## Entity and contact

- **Fund**: Hivemind Digital Culture Fund
- **Parent firm**: Hivemind Capital Partners (https://www.hivemind.capital)
- **Investor relations**: investor.relations@hivemind.capital
- **Press**: press@hivemind.capital
- **X**: https://x.com/HivemindCap

Holdings and figures on this page reflect the state of the fund as of the build date. Site is redeployed on every content or holdings change; see \`Last-Modified\` header of individual pages for the last update.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
