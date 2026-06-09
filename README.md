# DCF Gallery

A statically-generated gallery site for the **Hivemind Digital Culture Fund
(DCF)** — a curated showcase of the fund's NFT art holdings (XCOPY, Tyler Hobbs,
Dmitri Cherniak, CryptoPunks, Beeple, Kim Asendorf, and more).

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript. Every page is
pre-rendered at build time (`generateStaticParams`); there is no runtime backend.
Artwork is preserved on IPFS (Filebase) and served through an image gateway, with
locally-generated WebP variants for detail pages.

## Quick start

```bash
npm install
npm run dev      # dev server → http://localhost:3000
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` | Production build. Runs `prebuild` (validates editorial copy) first, then statically generates every page. **Fails on any type error, invalid copy, or broken page.** |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint (flat config, `eslint-config-next`). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run test:e2e` | Playwright smoke test (`tests/smoke.spec.ts`). Minimal — `npm run build` remains the primary check. |

> **Windows note:** never run `npm run build` while `next dev` is running — it
> corrupts `.next` (Turbopack panic). Stop the dev server first, and delete
> `.next` before restarting dev after a production build.

## Editing the site — where each thing lives

The site is a thin rendering layer over a generated dataset plus a small,
hand-editable editorial layer. **You almost never edit page components to change
content.** Instead:

| To change… | Edit… | Then run | Guide |
|------------|-------|----------|-------|
| **Copy / prose** — artist bios, collection "Hivemind Commentary" curator notes, essay links | `content/editorial/{artists,collections}/<slug>.json` | `npm run build` (validates) | **[`content/editorial/README.md`](content/editorial/README.md)** |
| **Curation** — display order, display names, grouping into rows, hiding, hero layouts | `src/lib/curation.json` | `npm run curate` | **[`docs/CURATION.md`](docs/CURATION.md)** |
| **Adding new artworks** — onboarding a piece through the asset pipeline | `src/lib/data.ts` (facts) | `npm run onboard -- --only <slug>` | **[`docs/ADDING-PIECES.md`](docs/ADDING-PIECES.md)** |

A visual editor (TinaCMS) can be wired on top of the editorial JSON so copy is
edited point-and-click rather than by hand — see [`docs/CMS-TINA.md`](docs/CMS-TINA.md).

## Architecture (in brief)

- **Content is data, not code.** `src/lib/data.ts` is the canonical store
  (`artists` → `collections` → `pieces`, linked by slug). Generated from a
  portfolio spreadsheet; editorial fields within it are human-owned and must not
  be clobbered by a re-import.
- **Curation layer** (`src/lib/curation.json` → `curation.data.json`) holds all
  ordering, display names, grouping, and trait-interactivity rules — separate
  from the generated data so editors can re-arrange without touching `data.ts`.
- **Editorial copy layer** (`content/editorial/*` → `editorial.data.json`) holds
  artist bios and curator notes, validated with Zod at build time.
- **Asset pipeline** — canonical source → pinned to Filebase IPFS → grid served
  via gateway transform → detail served from locally-generated `sharp` WebP
  variants with LQIP blur-up. CryptoPunks render as on-chain SVG.

For the full architecture, conventions, and the **non-standard Next.js 16**
gotchas, see [`CLAUDE.md`](CLAUDE.md).

## Documentation

| Doc | Covers |
|-----|--------|
| [`CLAUDE.md`](CLAUDE.md) | Architecture, conventions, data/curation/image internals (the canonical engineering reference). |
| [`AGENTS.md`](AGENTS.md) | Heads-up that this is Next.js 16 with breaking changes — read the bundled docs before writing Next.js code. |
| [`content/editorial/README.md`](content/editorial/README.md) | **Authoring guide for site copy** (bios, curator notes). |
| [`docs/CURATION.md`](docs/CURATION.md) | **Authoring guide for curation** (order, names, row grouping, hiding). |
| [`docs/ADDING-PIECES.md`](docs/ADDING-PIECES.md) | Onboarding new artworks through the asset pipeline. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build & deploy (Vercel) runbook. |
| [`docs/CMS-TINA.md`](docs/CMS-TINA.md) | Enabling the TinaCMS visual editor for the editorial layer. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architectural decision record. |
| [`docs/EXPLORER-BRIEF.md`](docs/EXPLORER-BRIEF.md) | Design brief for the multi-view `/explore` experience. |

## Deployment

Static site deployed on Vercel. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
