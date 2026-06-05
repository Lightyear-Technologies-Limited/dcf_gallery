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

There is **no test framework**. `playwright` is a dependency but is used only by
the `scripts/` tooling, not a test suite. Verify changes with `npm run build`
(catches type + static-generation errors) and the dev server.

Data-pipeline scripts are plain ESM, run directly: `node scripts/<name>.mjs`.

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
(`CLICKABLE_TRAITS`, `SYNTHETIC_TRAITS`, `getTraitGlobalCount`).

### Other generated `src/lib/*.data.json` (do not hand-edit)

| File | Built by | Contents |
|------|----------|----------|
| `traits.data.json` | `build-traits-data.mjs` | on-chain attributes per piece slug (consolidated from per-collection `fetch-*.mjs` output) |
| `descriptions.data.json` | `build-descriptions.mjs` | per-piece prose; drops boilerplate repeating across ≥70% of a collection |
| `trait-totals.data.json` | `fetch-trait-totals.mjs` | collection-wide rarity counts (e.g. CryptoPunks) for "15 of 146" framing |
| `aspects.data.json` | `extract-aspects.mjs` | intrinsic `{w,h}` of optimized images, keyed `{contract}-{tokenId}` |

The general pattern: `fetch-*.mjs` pull on-chain metadata/images into
`scripts/*.json` intermediates, then `build-*.mjs` consolidate those into the
`src/lib/*.data.json` files the app imports.

### Images — `src/lib/images.ts`

`getArtworkImage(slug, contract, tokenId, size)` resolves a public path. Two
sizes: `/art/optimized/{key}.webp` (detail) and `/art/thumbs/{key}.webp` (thumb),
where `key = {contractAddress}-{tokenId}` lowercased. **CryptoPunks** are served
as SVG from `/art/all/` (pixel art, not WebP). Hero/featured pieces use the
hardcoded `CURATED_DETAIL` / `CURATED_THUMB` overrides. `resolveTokenId`
normalizes **Art Blocks** IDs (`project*1_000_000 + serial`; Fidenza = project
78, Ringers = project 13) so raw serials and full token IDs both resolve.

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
