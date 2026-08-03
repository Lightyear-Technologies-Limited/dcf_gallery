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
Tailwind v4 + TypeScript. There is no runtime backend — all content comes from
the generated dataset at build time.

Almost every route is pre-rendered. The **one exception is `/collection/[slug]`**,
which `await`s `searchParams` for trait filtering; reading `searchParams` on the
server opts a route out of static generation, so those 29 pages are
server-rendered per request (`ƒ` in the build output) and served
`Cache-Control: private, no-store`. Everything else — including all 318
`/piece/[slug]` pages — prerenders and serves `s-maxage=31536000`. Check the
`○`/`●`/`ƒ` markers in `npm run build` output if you change how a page reads the
URL; silently turning a `●` into a `ƒ` is an easy and costly regression.

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — fails if any generateStaticParams page errors
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next)
```

Testing is deliberately light — there is no unit-test suite, and **`npm run build`
is still the primary check** (it catches type + static-generation errors). Two
Playwright specs run against the production build via `npm run test:e2e`, and CI
(`.github/workflows/ci.yml`) runs lint → typecheck → `audit` → `content` → build →
e2e on every push:

| Spec | Covers |
|------|--------|
| `tests/smoke.spec.ts` | User journeys — nav renders, reels/motion preference, sandboxed interactive art, back-to-origin navigation. |
| `tests/invariants.spec.ts` | Properties that break *silently*. Every one of these regressed at least once in the 2026-07 pass and shipped, because nothing in the build or the typechecker notices. |

The invariants spec is the one to extend when something breaks invisibly. It
currently locks: the root OG card stays the static wordmark PNG and every
generated card carries the `Wordmark` lockup; every route emits an `og:image`;
`/piece/*` stays cacheable (i.e. still prerendered — see Routing); unknown slugs
return a real 404; **every URL in the sitemap resolves** (a full sweep of all ~350,
which takes under a second — no need to sample); old piece slugs still redirect;
the security headers are present; gallery tiles don't request images far larger
than they render; and content pages expose a real heading structure.

`npm run audit:slugs` (`scripts/audit-slugs.mjs`) is the companion static check:
`data.ts` is the canonical entity list, but a dozen files are keyed by the slugs it
defines — the generated `*.data.json`, the curation layer, the editorial files, the
redirect map — and nothing else enforces that they agree. A re-import, a hand-edit
or a slug rename can leave any of them pointing at an entity that no longer exists,
and the app just renders nothing for it. Pure static analysis, ~0.2s, runs in CI
before the build so a broken reference fails fast.

No pixel snapshots anywhere — `playwright.config.ts` rejects them as brittle
across OSes. Where a property is structural, assert it against the source or the
response headers instead of a rendered image.

Data-pipeline scripts are plain ESM. Most have an npm alias — `npm run onboard`
(add pieces), `npm run curate` (apply `curation.json`), `npm run content`
(validate + build editorial copy; also runs as `prebuild`), plus `sources`,
`pin`, `pin-videos`, `verify-pins`, `audit` (assets), `audit:slugs`
(cross-references) — or run any directly: `node scripts/<name>.mjs`.

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
`sharp` variants (768/1280/1920w WebP, +2560w for opted-in collections) through
`<img srcset>` with an **LQIP blur-up**, sourced from the heavy provenance manifest
in `src/lib/provenance.ts` (server-only, kept out of the client bundle).
`resolveTokenId` normalizes **Art Blocks** IDs (`project*1_000_000 + serial`;
Fidenza = project 78, Ringers = project 13) so raw serials and full token IDs both
resolve. See `docs/ADDING-PIECES.md` for the end-to-end pipeline.

**Detail variants are encoded with `smartSubsample: true`** (`pin-assets.mjs`).
Without it sharp writes WebP at 4:2:0, halving colour resolution in both axes —
which on work built from individually coloured marks smears them into muddy
streaks. It costs ~6% more bytes and is the largest quality win available on this
pipeline. Don't remove it to save weight; a.c.k. spotted the 4:2:0 artefacts on
Piano Blossoms unprompted.

**The 2560w tier is opt-in per collection** (`EXTRA_WIDE_COLLECTIONS`), and the
bar for adding one is specific: the masters must be *substantially wider than
2560* **and** the detail high-frequency. Piano Blossoms qualifies — 8500px masters
downscaled to 1920w (4.4×) merge adjacent dots before the encoder sees them, and
no quality setting recovers that. Fidenza does **not**: its masters are 2000×2400,
so 1920w is already a 1.04× downscale and there is nothing to recover — the tier
would cap at 2000w via `withoutEnlargement` and, encoded at the wide tier's q90,
would land as a candidate marginally *worse* than the existing 1920w q95 one. The
pin script now refuses to emit a tier the master can't fill, and records each
variant's **actual** encoded width so the srcset never overstates a candidate.

Measured effect: the hero caps at 978 CSS px, so DPR-2 viewports ask for 1956px.
DPR 1 and DPR 2 up to ~1440px are unaffected by the new tier; only DPR-2 viewports
at ≥1920px switch from 1920w to 2560w — precisely the case that was short.

**`sizes` must reflect the tile's real rendered width.** The loader passes the
chosen srcset candidate straight to the gateway as `img-width`, so `sizes` decides
bytes on the wire. The justified/fixed-row galleries already compute each tile's
exact CSS width (`aspect * rowHeight`) and pass it as `` `${Math.ceil(w)}px` `` —
do not substitute a flat value. A hardcoded `sizes` makes the browser pick a
candidate sized for the *widest* tile in the layout and download it for every
tile; that bug cost the homepage 71 MB vs 31 MB (mean 2.9× oversampling). No DPR
maths is needed — `sizes` is CSS px and the browser applies DPR itself. Grid tiles
default to `quality={85}` via `GridArtwork`; hero/detail paths pass higher values.

Both galleries also **withhold the tile image until the container is measured**
(`w > 0`). Row width is only known after a client measurement pass; rendering an
image before then means declaring a guessed `sizes`, and a guess gets *fetched* —
the browser will not downgrade once the real, usually much smaller, width
resolves. Nothing is visible during that frame (the row has no height yet), so
the guard costs nothing and saved a further 31 MB → 12 MB. Hero and single-piece
displays are the deliberate exception: they declare a larger `sizes` than their CSS
width so retina screens still get a sharp master, which is why
`tests/invariants.spec.ts` scopes its oversampling check to grid tiles.

### Routing — `src/app/`

`page.tsx` (home: all artists/collections), `/artists`, `/artist/[slug]`,
`/collection/[slug]`, `/piece/[slug]`, `/chapters` (the five curatorial chapters),
`/thesis`, `/press`. `/about` and `/collections` are permanent redirects (to
`/thesis` and `/` respectively), alongside the 317 old-slug piece redirects in
`src/lib/piece-redirects.json` — all declared in `next.config.ts`.

Trait filtering uses the URL convention `?trait=Key&value=Value`, preserved across
Back / Prev / Next navigation so filtered browsing survives page transitions.
**On the piece page this is resolved client-side**, in `src/lib/piece-nav.ts` —
that module is what keeps `/piece/[slug]` static. Do not re-introduce a
`searchParams` prop there: it would silently make all 318 pages
server-rendered-per-request again. `piece-nav.ts` is deliberately a plain shared
module (no `"use client"`) so the server's `<Suspense>` fallback and the client
`PieceNav` resolve links through one implementation.

All three parameterized routes set **`dynamicParams = false`**, so a slug outside
`generateStaticParams` returns a genuine 404 rather than rendering on demand and
returning `notFound()` with HTTP 200. Consequence worth knowing: a newly added
piece 404s until the site is rebuilt, and a renamed slug needs an entry in
`piece-redirects.json` or the old URL hard-404s.

Known gap: `/collection/[slug]` still soft-404s (HTTP 200 + not-found body) for
unknown or hidden slugs, because it renders dynamically and therefore streams —
the status is flushed before `notFound()` runs. It resolves if that route is ever
made static.

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
  `ExpandableProse`, `PieceNav` and similar interactive bits are client components.
- **JSON-LD goes through `ldJson()`** (`src/lib/site.ts`), never bare
  `JSON.stringify`. HTML parsing beats JSON inside `<script>`, so a literal
  `</script>` in CMS-editable editorial copy would close the block early; `ldJson`
  escapes `<` and is inert to `JSON.parse`.
- **Section labels are headings.** The small-caps eyebrow style
  (`text-[10px] tracking-[0.1em] uppercase text-muted`) is used for two different
  things: the page-level eyebrow above an `<h1>` (keep as `<p>`) and section
  labels introducing a block ("Exhibitions", "Hivemind commentary", "Collection
  details") — those must be `<h2>` or screen-reader users get no navigable
  structure. Tailwind preflight resets heading size/weight/margin to inherit, so
  the tag carries no visual cost.
- On-chain contract addresses recur as inline constants — CryptoPunks canonical
  V2 `0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb`, wrapped V1
  `0xb7f7f6c52f2e2fdb1963eab30438024864c313f6`, Art Blocks
  `0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270`. Marketplace/Storage link logic
  (Raster, cryptopunks.app, IPFS/Arweave/On-chain detection) lives in
  `src/app/piece/[slug]/page.tsx` with explicit per-piece overrides.
