# Data Pipeline

Build-time scripts that populate the site's data layers. All ESM (`.mjs`). Most also have an `npm run` alias.

## Categories

### `fetch-*.mjs` — pull data from external sources into intermediates

Read from on-chain / IPFS / gateway, write to `scripts/*.json` (gitignored intermediates).

- `fetch-mint-dates.mjs` — Alchemy `alchemy_getAssetTransfers` for each contract, extract mint timestamp per token. Paginated. Handles ERC-721 + ERC-1155. Requires `ALCHEMY_API_KEY` in env.
- `fetch-fidenza-traits.mjs`, `fetch-cryptopunks-traits.mjs`, `fetch-<collection>-traits.mjs` — per-collection trait fetchers. Read on-chain `tokenURI`, parse metadata, extract attribute rows. Output per-collection JSON.
- `fetch-trait-totals.mjs` — collection-wide rarity counts (e.g. "15 of 146 Punks with this trait" framing).

### `build-*.mjs` — consolidate intermediates into `src/lib/*.data.json`

Read from `scripts/*.json` + `data.ts` + `content/editorial/*`, write to `src/lib/*.data.json`.

- `build-traits-data.mjs` — merges per-collection trait files into single `traits.data.json` keyed by piece slug.
- `build-descriptions.mjs` — merges on-chain description strings; drops boilerplate that repeats across ≥70% of a collection (Art Blocks collection descriptions are identical for every piece and add zero signal).
- `build-editorial.mjs` — Zod-validates every `content/editorial/*.json`, consolidates into `editorial.data.json`. Wired as `prebuild` in `package.json` so it runs before every `npm run build`.
- `extract-aspects.mjs` — reads each optimized image, records intrinsic `{w, h}` into `aspects.data.json` keyed by `{contract}-{tokenId}`. Used by `InteractiveArtwork` to size the container to the piece's own aspect ratio.

### `pin-*.mjs` — upload canonical bytes to IPFS

- `pin-assets.mjs` — for each piece with `originalUri`, fetches the bytes, uploads to Filebase, records CID + SHA-256 + Sharp variants (768w / 1280w / 1920w WebP) + LQIP. Writes to `provenance.data.json` (full manifest, server-only) and `provenance.cids.json` (slim client-safe slug → CID).
- `pin-videos.mjs` — same for `.mp4` video pieces. Transcodes to a web-friendly bitrate via ffmpeg before upload.
- `verify-pins.mjs` — re-fetches each pinned CID, re-computes SHA-256, compares to stored hash. Writes `verifiedAt` timestamp on match; fails loudly on mismatch. Run quarterly. Supports `--only <slug1,slug2>` for targeted re-verification.

### `import-portfolio.mjs` — spreadsheet → data.ts

Reads a hardcoded `.xlsx` path (typically SharePoint / local), parses columns (`artist, collection, title, contract_address, token_id, ...`), generates:
- Artist entries (deduping by wallet)
- Collection entries (deduping by contract)
- Piece entries (one row = one piece)
- Slug generation: `{collectionSlug}-{tokenId}` (no hex tail)

Overwrites `data.ts` entirely. **Warning:** any hand-edits to data.ts are lost. Curator prose, display overrides, editorial content must live in Layer 2/3 (curation.json + content/editorial/), NOT data.ts.

## npm run aliases

Typical `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test:e2e": "playwright test",

    "onboard": "node scripts/import-portfolio.mjs",
    "curate": "node scripts/fix-curation.mjs && node scripts/annotate-curation.mjs",
    "content": "node scripts/build-editorial.mjs",
    "prebuild": "node scripts/build-editorial.mjs",

    "sources": "node scripts/fetch-mint-dates.mjs && node scripts/fetch-traits.mjs && node scripts/build-traits-data.mjs && node scripts/build-descriptions.mjs",
    "pin": "node scripts/pin-assets.mjs",
    "pin-videos": "node scripts/pin-videos.mjs",
    "verify-pins": "node scripts/verify-pins.mjs",

    "audit": "node scripts/audit-data.mjs"
  }
}
```

## Script conventions

- Plain ESM (`.mjs`), no TypeScript on scripts.
- Read env vars at the top; fail fast if missing.
- Log every write to stdout with a `✓` prefix and a concise summary (`✓ editorial.data.json — 11 artists, 29 collections, 28 pieces`).
- Warnings prefixed `⚠`, errors `✗`.
- Idempotent by default. Re-running should produce the same output.
- `--only <slug1,slug2>` support for targeted re-runs on pin / verify scripts.

## Cache strategy

- On-chain metadata (traits, mint dates) is fetched into `scripts/*.json` intermediates and NEVER re-fetched unless explicitly requested. Add `--refresh` flags to `fetch-*.mjs` scripts to bypass.
- Pinned CIDs are stable forever (content-addressed). No cache invalidation needed.
- Editorial JSON is git-managed; no cache.
- Rebuilding: `npm run build` re-generates `editorial.data.json` via the `prebuild` hook. Other `*.data.json` files are only regenerated when their source `build-*.mjs` script is invoked.

## Error handling

- If `fetch-*.mjs` hits a network error on a single token, log the failure and continue. Do NOT abort the whole run.
- If `build-editorial.mjs` fails Zod validation, print the exact path of the offending file + field + expected schema. FAIL the build. Editorial errors must not deploy.
- If `pin-assets.mjs` fails to fetch canonical bytes, log the failure with the piece slug and continue. The next run will retry.
- If `verify-pins.mjs` finds a mismatch, halt and print a Slack-worthy alert. This is the "somebody swapped the bytes" scenario and needs a human.

## Deployment cadence

The site is static. Every content change requires a rebuild + redeploy:

1. Curator edits `content/editorial/*.json` in git.
2. Push to the working branch.
3. Vercel (or your host) rebuilds.
4. `prebuild` regenerates `editorial.data.json`.
5. `build` generates static pages.
6. Deploy.

For on-chain data updates (new pieces acquired):

1. Update the portfolio spreadsheet.
2. `npm run onboard` — regenerates `data.ts`.
3. `npm run sources` — fetches traits + mint dates for new pieces.
4. `npm run pin` — pins new canonical assets.
5. Push, deploy.

Reader-facing data is only as fresh as the last deploy. This is intentional — a static catalogue does not race the chain.
