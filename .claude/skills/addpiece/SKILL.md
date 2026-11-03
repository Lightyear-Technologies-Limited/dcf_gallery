---
name: addpiece
description: Onboard new artwork(s) into the DCF Gallery through the standard asset pipeline (data.ts append → resolve sources → pin to Filebase IPFS → sharp variants + LQIP → verify). Use when the user wants to add a piece, add pieces from the portfolio xlsx, onboard a new artwork, register a new collection, or similar. Follows docs/ADDING-PIECES.md exactly.
user-invocable: true
argument-hint: "<piece description or slug list>"
---

## MANDATORY READING

Before doing anything, read `docs/ADDING-PIECES.md`. It is the canonical guide for this project's asset pipeline and contains the architectural decisions you must respect (especially the three-layer mental model and the rule that `scripts/import-portfolio.mjs` must NEVER be re-run).

This skill exists to operationalise that doc. If anything below conflicts with the doc, the **doc wins**.

## Mental model (from the doc)

| Layer | Where | Owner | Regenerable |
|---|---|---|---|
| **Facts** | `src/lib/data.ts` (id, slug, contract, tokenId) | machine / spreadsheet | yes |
| **Editorial** | `data.ts` editorial fields + `content/editorial/*` | **human — NEVER clobber** | no |
| **Derived** | `src/lib/provenance.data.json`, `provenance.cids.json`, `traits.data.json`, etc. | generated | yes |

> ⚠ **Never re-run `scripts/import-portfolio.mjs`.** It regenerates `data.ts` from scratch and destroys editorial content. It's guarded behind `--force`; do not bypass that guard. To add pieces, **append by hand** to the `pieces` array.

## Steps

### 1. Append the new piece object(s) to `pieces` in `src/lib/data.ts`

For each piece, required fields:
- `id` (typically same as `slug`)
- `slug`: convention is `{collection-slug}-{tokenId}`, no contract suffix (e.g. `masks-of-luci-394`, `cryptopunks-2303`). Match the existing entries in the same collection. Once live, a slug can't change without an entry in `src/lib/piece-redirects.json`
- `title`
- `image`: required by the `Piece` type. use the placeholder `'/samples/<slug>.svg'` like every existing entry. The file doesn't exist and isn't meant to: the rendered image comes from the pin pipeline (step 3) or, for Punks, `/art/all/`
- `collectionSlug`
- `artistSlug`
- `medium` (`image` | `video` | `generative` | `interactive`)
- `description` (empty string is fine — editorial fills it later)
- `traits: {}`
- `tokenId`
- `contractAddress`
- `influences: []`
- `openseaUrl`

Optional but useful when known:
- `originalUri` — canonical source URL (IPFS / Arweave / centralized)
- `artistSiteUrl`
- `companionSlug` — for physical-companion pieces like X-ray Machine

If the piece belongs to a brand-new collection or artist, also add the `collections` / `artists` entry up the file.

### 2. (Punks only) Fetch the on-chain SVG and traits

CryptoPunks render from on-chain pixel data, not a raster `tokenURI`. Follow the doc's **"Adding a CryptoPunk"** section. In short:

- Slug is `cryptopunks-<tokenId>` (no contract suffix). Copy an existing `cryptopunks-*` entry in `data.ts` and change id / slug / title / image / tokenId / openseaUrl.
- Fetch the image and the traits, both from the CryptoPunksData contract:

```bash
node scripts/fetch-punk-svgs.mjs <tokenId> [tokenId ...]    # → public/art/all/0xb47e3cd…-{tokenId}.svg
node scripts/fetch-punk-traits.mjs <tokenId> [tokenId ...]  # → src/lib/traits.data.json
```

Both use `ALCHEMY_API_KEY` from `.env`. Without the traits step the piece page shows no traits and it can't be filtered by trait, so don't skip it.

- Placement: the Punks grid is curated in **trait-grouped rows** (e.g. row 10 Fedoras, row 11 Police Caps). Check the new Punk's traits against the existing rows (`traits.data.json`) and ask the user which row, or propose one. Add the slug to `curation.json` with its `(N)` row tag, then run step 5. A new row is just the next number.
- Still run step 3: it pins the SVG for a provenance record (CID + sha256), with no variants. The site renders fine without it, so if Filebase fails (see Special cases) ship anyway and report the backfill.

### 3. Run the asset pipeline

```bash
npm run onboard -- --only <comma-separated-slugs>
```

`onboard` chains two steps:
1. **`resolve-sources.mjs`** — reads each piece's on-chain `tokenURI` via Alchemy, captures `image` + `animation_url`, classifies storage (ipfs / arweave / onchain / centralized). Writes `scripts/asset-sources.json`. Idempotent: skips already-resolved slugs unless `--refresh`.
2. **`pin-assets.mjs`** — downloads each canonical original, pins to the Filebase IPFS bucket (CID + sha256), generates sharp detail variants (768/1280/1920w webp) + base64 LQIP, writes `src/lib/provenance.data.json` and `src/lib/provenance.cids.json`. *SVGs are intentionally excluded from `provenance.cids.json` — Punks serve raw from `/art/all/`, not via the gateway.*

If you previously ran the pipeline and a piece is stuck (cached empty result, partial pin), append `--refresh` to force a re-resolve / re-pin for that slug.

### 4. Read the gap report

For each gap (`no source`, `pin error`):
- Try to find the canonical image: marketplace, IPFS link, Arweave, the artist's own site
- If found, add the URL to that slug's `image` entry in `scripts/asset-sources.json` and re-run `npm run pin -- --only <slug>` (not the full onboard)
- If not findable, **stop and ask the human** for a manual asset, naming the piece

### 5. If you changed curation order, display names, or added a collection

```bash
npm run curate
```

This runs `fix-curation.mjs` (strips inline `(N)` tags + `//` comments from `curation.json`, validates every slug against `data.ts`, regenerates `curation.data.json`) then `annotate-curation.mjs` (re-adds position annotations for the editor's benefit).

Do NOT run this if you only added pieces to existing collections at default positions — `curation.json` doesn't need touching.

### 6. Verify

```bash
npm run build
```

Must compile cleanly and statically generate every piece page without error.

Then start the dev server and visit each new piece page:

```bash
npm run dev
# /piece/<each-new-slug>
```

Per the doc, a correctly-onboarded raster piece shows:
- A gateway URL in the grid's `<img srcset>`
- Three sharp-variant CIDs (768w/1280w/1920w) on the detail page, plus a 2560w one for collections in `EXTRA_WIDE_COLLECTIONS` (`scripts/pin-assets.mjs`)
- LQIP blur-up rendering

A correctly-onboarded **Punk** shows:
- The on-chain SVG served raw from `/art/all/0xb47e3cd…-{tokenId}.svg` (no variants — vector)

### 7. Ask, then branch, commit and open a PR

**Stop and ask the user before committing.** Show them what changed (pieces, placement, files) and wait for a yes. Once they approve, go straight through to the PR.

Branch naming follows the repo history: `data/...` for portfolio/data additions, `editorial/...` for copy, `fix/...` for bug fixes. For piece additions use `data/<yyyy-mm>-portfolio-additions`.

What to commit:
- `src/lib/data.ts` (the new piece entries)
- `src/lib/traits.data.json` (Punks: from `fetch-punk-traits.mjs`)
- `src/lib/curation.json` + `src/lib/curation.data.json` (if placement changed)
- `src/lib/provenance.data.json` and `src/lib/provenance.cids.json` (generated by `pin-assets.mjs`). Only if the pin succeeded; never commit `"error"` placeholder entries
- For Punks: the new SVG file(s) at `public/art/all/0xb47e3cd…-*.svg` (the `.gitignore` carve-out for the Punk contract already allows these)
- For new collections / artists: any related editorial JSON in `content/editorial/`

What NOT to commit:
- `scripts/asset-sources.json` (intermediate, regeneratable)
- `.claude/settings.local.json`
- Any `*.data.json` whose diff is line endings only (`git diff --stat` shows nothing). On Windows, `prebuild` rewrites `editorial.data.json` this way
- Anything in `public/art/optimized/`, `public/art/thumbs/` (gitignored, too large)
- `.env`

```bash
git checkout -b data/<yyyy-mm>-portfolio-additions
git add <files above>
git commit
git push -u origin data/<yyyy-mm>-portfolio-additions
gh pr create --base master --title "Add <piece name(s)>" --body "..."
```

The PR body should list the pieces, their placement (row by row if curation changed), traits, and what was checked locally. End with the Claude Code attribution line.

### 8. Review, then merge (live)

Tell the user **it is not live yet**, and how to review:
- **Vercel preview:** Vercel posts a preview URL as a comment on the PR within a couple of minutes. It's a full copy of the site at a private URL, good for sharing with others.
- **Locally:** the user runs `npm run dev` in their own terminal (don't start it yourself; other Claude sessions may be using the port) and opens `/collection/<slug>` and `/piece/<new-slug>`.

When the user says to merge:
1. `gh pr checks <n>`. If `ci` is pending, wait (`gh pr checks <n> --watch`). Never merge on red.
2. `gh pr merge <n> --squash --delete-branch`, then `git checkout master && git pull`.
3. Confirm the production deploy: `gh api repos/Lightyear-Technologies-Limited/dcf_gallery/commits/<sha>/status` shows `Vercel: success` (usually within ~5 minutes). Only then say it's live.

## Special cases (from the doc)

- **No resolvable source** (some 1/1s where Alchemy returns nothing): the gap report lists the slug. Find the canonical image manually, add to `asset-sources.json`, re-run `npm run pin -- --only <slug>`.
- **Video / interactive pieces**: the still pins normally. The `animation_url` is recorded and classified but not pinned in this phase. Don't block onboarding waiting for video playback to be solved.
- **Centralized sources**: re-pinning to IPFS gives Hivemind a CID + preservation, even when the artist declared a centralized image. That's expected and good.
- **Large originals** (tens of MB): fine — they're pinned for preservation; the served variants are small. Variant generation just takes a few extra seconds.
- **CryptoPunks**: serve from local SVG at `/art/all/{PUNK_CANONICAL}-{tokenId}.svg`. The IPFS gateway can't transform vector. Use `scripts/fetch-punk-svgs.mjs` for the SVG and `scripts/fetch-punk-traits.mjs` for traits (step 2).
- **Filebase "Access Denied"** on pin: the `FILEBASE_*` keys in `.env` can't write to the bucket. The run leaves `"error"` placeholder entries in `provenance.data.json`, so discard them with `git checkout -- src/lib/provenance.data.json src/lib/provenance.cids.json`. Tell the user fresh keys are needed from the bucket owner, and name the slugs awaiting backfill. For Punks this doesn't block shipping.
- **NEVER hand-edit** `provenance.data.json` or `asset-sources.json` — they're generated. Fix the input (`data.ts`, the source URL) and re-run.

## Required environment

`.env` must exist in the repo root with these keys (template in `.env.example`):

```
ALCHEMY_API_KEY=<your Alchemy key>
FILEBASE_ACCESS_KEY=<Lightyear's Filebase IPFS bucket access key>
FILEBASE_SECRET_KEY=<Lightyear's Filebase IPFS bucket secret>
FILEBASE_BUCKET=<bucket name>
FILEBASE_S3_ENDPOINT=https://s3.filebase.com
FILEBASE_GATEWAY=lightyear.myfilebase.com
```

Without Alchemy: `resolve-sources.mjs` falls back to a heavily rate-limited demo endpoint.
Without Filebase: `pin-assets.mjs` cannot run. Get the credentials from whoever set up the bucket (typically the project's infra owner).

## Report

When the workflow completes, report:
- Pieces added (slugs)
- Where each piece was placed (row by row if curation changed)
- CIDs pinned (count, or "N rasters + M Punks"), or which pins failed and why
- Any gaps still needing a human (named)
- Confirm the build is green
- Branch + PR link, and that it is **not live until merged**
