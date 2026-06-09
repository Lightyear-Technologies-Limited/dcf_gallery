# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ **Read `AGENTS.md` first.** This repo runs a non-standard Next.js (v16) with
> breaking changes vs. what you may know. Before writing Next.js code, read the
> relevant guide under `node_modules/next/dist/docs/`. App Router `params` and
> `searchParams` are **Promises** here and must be `await`ed.

## What this is

A statically-generated gallery site for the **Hivemind Digital Culture Fund
(DCF)** — a curated showcase of the fund's NFT art holdings (XCOPY, Tyler Hobbs,
Dmitri Cherniak, CryptoPunks, Beeple, etc.). Next.js 16 (App Router) + React 19 +
Tailwind v4 + TypeScript. Every page is pre-rendered via `generateStaticParams`;
there is no runtime backend.

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — fails if any generateStaticParams page errors
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next)
```

Testing is minimal — a single Playwright smoke test (`tests/smoke.spec.ts`, run
with `npm run test:e2e`); there is no unit-test suite. **`npm run build` is the
primary check** (catches type + static-generation errors); `npm run typecheck`
and the dev server cover the rest.

Data-pipeline scripts are plain ESM. Most have an npm alias — `npm run onboard`
(add pieces), `npm run curate` (apply `curation.json`), `npm run content`
(validate + build editorial copy; also runs as `prebuild`), plus `sources`,
`pin`, `pin-videos`, `verify-pins`, `audit` — or run any directly:
`node scripts/<name>.mjs`.

## Architecture

### Content is data, not code

The site is a thin rendering layer over a large generated dataset. **`src/lib/data.ts`**
(~5,700 lines) is the canonical content store — the `artists`, `collections`,
`pieces`, and `influences` arrays plus their interfaces and lookup helpers
(`getArtist`, `getCollection`, `getPiecesByCollection`, …). Entities link by
slug: `Artist` → `Collection` (`artistSlug`) → `Piece` (`collectionSlug`).

`data.ts` is **generated** by `scripts/import-portfolio.mjs` from a DCF Portfolio
`.xlsx` (path hardcoded to a local SharePoint location, not in the repo). For
small content fixes you can edit `data.ts` directly, but know that a re-import
would overwrite it.

### The curation layer (editorial overrides, separate from generated data)

Display ordering, naming, grouping, and which traits are interactive are **not**
baked into `data.ts` — they live in a separate editable layer read through
`src/lib/curation.ts`:

- **`src/lib/curation.json`** — the human-editable source. Supports inline `(N)`
  row-group tags and `// trait` annotation comments after piece slugs, so it is
  **not valid JSON** (and is excluded from `tsconfig.json`).
- **`src/lib/curation.data.json`** — the parsed, valid-JSON form the **app
  actually imports**. Never hand-edit this; it is generated.

**Workflow after editing `curation.json`:**
1. `node scripts/fix-curation.mjs` — strips `(N)` tags + `//` comments, validates
   every slug against `data.ts`, regenerates `curation.data.json`.
2. `node scripts/annotate-curation.mjs` — re-adds `[position/total]` + trait
   comments back into `curation.json` for the editor's benefit (stripped again
   on the next `fix`).

The `/curate` skill runs both steps. `curation.ts` exposes display names, all
ordering (`artistOrder`, `collectionOrder`, `pieceOrder`, `pieceRows`,
`heroLayouts`), hide flags, edition types, and the trait-interactivity rules
(`CLICKABLE_TRAITS`, `SYNTHETIC_TRAITS`, `getTraitGlobalCount`). For the
non-engineer authoring view of `curation.json`, see [`docs/CURATION.md`](docs/CURATION.md).

### The editorial copy layer (prose, Zod-validated)

Long-form copy — artist **bios** and collection **curator notes** ("Hivemind
Commentary"), plus essay links — is **not** in `data.ts`. It lives as one JSON
file per entity under `content/editorial/{artists,collections}/<slug>.json`
(human-/CMS-editable; **`content/editorial/README.md` is the authoring guide** —
point non-engineers there). `scripts/build-editorial.mjs` (npm `content`, wired
as `prebuild`) validates each file with Zod (`scripts/content-schema.mjs`) and
emits `src/lib/editorial.data.json`, which the app reads via `src/lib/editorial.ts`.
A missing required field or stray key **fails the build** with a precise path.
`tina/config.ts` describes these same files for the (deferred) TinaCMS visual
editor — see `docs/CMS-TINA.md`.

### Other generated `src/lib/*.data.json` (do not hand-edit)

| File | Built by | Contents |
|------|----------|----------|
| `traits.data.json` | `build-traits-data.mjs` | on-chain attributes per piece slug (consolidated from per-collection `fetch-*.mjs` output) |
| `descriptions.data.json` | `build-descriptions.mjs` | per-piece prose; drops boilerplate repeating across ≥70% of a collection |
| `trait-totals.data.json` | `fetch-trait-totals.mjs` | collection-wide rarity counts (e.g. CryptoPunks) for "15 of 146" framing |
| `aspects.data.json` | `extract-aspects.mjs` | intrinsic `{w,h}` of optimized images, keyed `{contract}-{tokenId}` |
| `provenance.data.json` / `provenance.cids.json` | `pin-assets.mjs` (`pin`) | pinned-asset manifest — CIDs, sha256, `sharp` detail-variant CIDs, LQIP. The slim `cids.json` is the client-safe slug→CID map (`images.ts`); the full manifest stays server-only (`provenance.ts`) |
| `editorial.data.json` | `build-editorial.mjs` (`content`/`prebuild`) | consolidated artist bios + curator notes from `content/editorial/*`, Zod-validated |

The general pattern: `fetch-*.mjs` pull on-chain metadata/images into
`scripts/*.json` intermediates, then `build-*.mjs` consolidate those into the
`src/lib/*.data.json` files the app imports.

### Images — `src/lib/images.ts`

`getArtworkImage(slug, contract, tokenId, size)` resolves a **grid/thumb** URL,
trying in order: (1) a hardcoded `CURATED_DETAIL` / `CURATED_THUMB` override
(hero/featured pieces, plus the Kim Asendorf pixel decks served as local WebP);
(2) a curated slug-prefix match; (3) the **Filebase IPFS gateway** — pinned
raster originals (`CIDS` from `provenance.cids.json`) served as
`https://{gateway}/ipfs/{cid}` and resized/transcoded to WebP on the fly by the
custom loader `src/lib/image-loader.js`; (4) a local fallback
`/art/{optimized|thumbs}/{contract}-{tokenId}.webp`. **CryptoPunks** short-circuit
to on-chain SVG from `/art/all/` (vector — the gateway can't transform it).

**Detail / hero** pages don't use that path — they render locally-generated
`sharp` variants (768/1280/1920w WebP) through `<img srcset>` with an **LQIP
blur-up**, sourced from the heavy provenance manifest in `src/lib/provenance.ts`
(server-only, kept out of the client bundle). `resolveTokenId` normalizes **Art
Blocks** IDs (`project*1_000_000 + serial`; Fidenza = project 78, Ringers =
project 13) so raw serials and full token IDs both resolve. See
`docs/ADDING-PIECES.md` for the end-to-end pipeline.

### Routing — `src/app/`

`page.tsx` (home: all artists/collections), `/artists`, `/artist/[slug]`,
`/collection/[slug]`, `/piece/[slug]`, `/about`. All static. Trait filtering uses
the URL convention `?trait=Key&value=Value`, preserved across Back / Prev / Next
navigation so filtered browsing survives page transitions.

### Theming & type

Dark mode is **class-based** (`.dark` on `<html>`), toggled by `ThemeToggle` and
persisted to `localStorage['dcf-theme']`; an inline script in `layout.tsx` applies
it before paint to avoid flash. Color tokens are OKLCH CSS variables
(`--background`, `--foreground`, `--muted`, `--border`, `--surface`) defined in
`globals.css` and exposed to Tailwind v4 via `@theme inline`. Fonts (Argent serif,
Instrument Sans) load through `next/font/local`.

### Chapters — `src/lib/chapters.ts`

Five curatorial chapters group artists (AI Art, CryptoArt, Digital Canvas,
Digital Identity, Generative Art). `getChapterForArtist(slug)` maps an artist to
its chapter; chapters intentionally use the foreground token, no color accent.

## Conventions

- Import alias `@/*` → `./src/*`.
- Server Components by default; only `ThemeToggle`, `CopyableHash`,
  `ExpandableProse` and similar interactive bits are client components.
- On-chain contract addresses recur as inline constants — CryptoPunks canonical
  V2 `0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb`, wrapped V1
  `0xb7f7f6c52f2e2fdb1963eab30438024864c313f6`, Art Blocks
  `0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270`. Marketplace/Storage link logic
  (Raster, cryptopunks.app, IPFS/Arweave/On-chain detection) lives in
  `src/app/piece/[slug]/page.tsx` with explicit per-piece overrides.
