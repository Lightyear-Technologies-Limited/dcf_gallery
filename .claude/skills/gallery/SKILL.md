---
name: gallery
description: Scaffold a static museum-catalogue site for an NFT art fund or collection. Prescriptive: Next.js 16 App Router, OKLCH warm-eggshell palette, Argent Thin serif + Instrument Sans body, 4-layer data separation (on-chain source → curation → editorial → rendering), provenance-first (SHA-256 + IPFS CID + verify-yourself hover hint), trait-facet filter with URL deep-linking. Enforces site-wide conventions (no em-dashes, sentence-case headers, eyebrow labels). Runs `init` to create a fresh project or `extend` to add artists / collections / pieces to an existing one.
user-invocable: true
argument-hint: "[init|extend|design-check]"
license: MIT
---

This skill scaffolds a **static NFT art gallery site** in the shape of the DCF Gallery — a curated museum-catalogue-style presentation of a collection or fund's holdings. It is deliberately prescriptive: opinionated typography, palette, architecture, and voice choices are baked in, so the resulting site reads as institutional the first time it renders.

## When to use

- User asks to build an NFT art gallery, collection catalogue, fund holdings site, or curated art presentation.
- Static site (no runtime backend), on-chain data + IPFS-pinned images, editorial voice is important.
- Design register: museum catalogue / auction house / fund brochure. NOT marketplace, NOT dashboard.

**Do NOT use if:**
- The site needs runtime auth, purchase, or marketplace behavior — this is a read-only catalogue.
- The design brief is playful, maximalist, or product-marketing — this skill enforces restrained institutional aesthetics.
- The collection is one or two pieces — the scaffolded architecture is overkill for a single-page portfolio.

## Sub-commands

Invoke with an argument:

- `/gallery init` — create a new gallery project in a fresh directory
- `/gallery extend` — add artists / collections / pieces to an existing gallery
- `/gallery design-check` — audit an existing project against the gallery conventions (typography, palette, header casing, em-dash, eyebrow labels)

## Context Gathering (REQUIRED before init)

You cannot scaffold this from thin air. Before running `init`, gather from the user:

1. **Fund / catalogue name** — the wordmark (e.g. "Hivemind Digital Culture Fund", "Zora Collection"). Used in the masthead H1 on every index page.
2. **Site URL** — final deployment domain (used for OG images, sitemap, canonical URLs).
3. **Artist list** — names + wallet addresses (if the artist is verified via on-chain identity) OR just names for editorial-only artists.
4. **Chapter structure (optional)** — if the catalogue is grouped curatorially (DCF's five chapters model), collect chapter names + which artists belong.
5. **Portfolio spreadsheet** — CSV / XLSX with columns: `artist, collection, title, contract_address, token_id`. This drives the data pipeline. If not available, plan for manual `data.ts` entry.
6. **Voice sample** — one or two paragraphs of the fund's Hivemind Commentary voice, so the editorial layer template can echo the register.

Ask these questions BEFORE writing any code. Do not infer from the codebase. If the user says "just scaffold it, I'll fill in later," insist on at least (1) and (3) — the wordmark and one artist name — so the initial render isn't stub text.

## Layer Architecture (READ THIS FIRST)

Every gallery built with this skill separates **four layers**. Cross-contamination is the #1 architectural mistake to avoid.

1. **On-chain source layer** (`src/lib/data.ts`) — Generated. The canonical content store. Interfaces + arrays for `artists`, `collections`, `pieces`. Every piece links: Artist → Collection (via `artistSlug`) → Piece (via `collectionSlug`). Regenerated from the portfolio spreadsheet via `scripts/import-portfolio.mjs`. **Do not hand-edit for anything a re-import would overwrite.**

2. **Curation layer** (`src/lib/curation.json` + `.data.json`) — Editorial display rules that are SEPARATE from on-chain truth. Display ordering (`artistOrder`, `collectionOrder`, `pieceOrder`), display names (rename display without touching the on-chain identifier), hide flags, edition-type overrides (`1/1` vs `1/1/999`), trait-interactivity rules (`CLICKABLE_TRAITS`), synthetic trait groups (`SYNTHETIC_TRAIT_GROUPS`). Not valid JSON in source (allows `(N)` row tags and `//` comments); parsed to `.data.json` for import.

3. **Editorial layer** (`content/editorial/{artists,collections,pieces}/*.json`) — Long-form prose. Artist bios, collection curator notes (Hivemind Commentary), essay links, context (announcements). Zod-validated at build time. One JSON file per entity. Consolidated into `src/lib/editorial.data.json` via `scripts/build-editorial.mjs` (`prebuild` hook). Non-engineers can edit these files without touching TSX.

4. **Rendering layer** (`src/app/*` + `src/components/*`) — Server Components by default. Read from all three layers above. Almost every page is statically generated via `generateStaticParams`. Only interactive bits (`ThemeToggle`, `InteractiveArtwork`, `CopyableHash`) are Client Components.

**Full details:** [reference/ARCHITECTURE.md](reference/ARCHITECTURE.md).

## Design Direction (PRESCRIPTIVE)

This is a **museum catalogue register.** Not a marketplace, not a dashboard, not a product-marketing site.

- **Typography** — Argent Thin (or Argent Bold) serif for display; Instrument Sans variable for body. Both via `next/font/local`. NO Inter, Geist, Playfair, or Fraunces.
- **Palette** — OKLCH warm eggshell (light-first), warm-neutral hairline borders, muted tabular-nums. Dark mode is a `.dark` class toggle stored in `localStorage['gallery-theme']`; light is the default. NO blue-500, purple gradients, or glassmorphism.
- **Section labels (eyebrows)** — `text-[10px] tracking-[0.1em] uppercase font-medium text-muted`. Used everywhere for section headers, filter chips, prev/next work labels. Consistent site-wide.
- **Header casing** — sentence-case. "Collection details", not "Collection Details". "Hivemind commentary", not "Hivemind Commentary". Proper nouns stay capitalized.
- **Em-dashes** — banned in all user-facing copy. Use colon, comma, semicolon, period, or parentheses. Applies to prose AND labels.
- **Motion** — restrained. No decorative page-load animations. Interactive artworks play on hover (Auto/Hover/Off is a global preference in the `MotionToggle`). No auto-carousels.

**Full details:** [reference/DESIGN.md](reference/DESIGN.md).

## Provenance (THE CROWN JEWEL)

The provenance craft is what makes this catalogue institutional-grade. Every piece page must render:

- Contract address (copyable, truncated)
- Token ID
- Chain
- Storage type (on-chain / IPFS / Arweave / Centralized) with hover tooltip explaining permanence implications
- Mint date + release platform
- **Pinned copy of the artwork** — content-addressed CID + SHA-256 hash + verified-at timestamp
- **SHA-256 verify hint** — hover tooltip on the hash showing a working `sha256sum` command so the reader can verify byte-integrity themselves. This is not decoration.

**Full details:** [reference/PROVENANCE.md](reference/PROVENANCE.md).

## Filter Mechanic

Collection pages support trait facet filtering with URL deep-links (`?trait=Color&value=Yellow`). Key rules:

- The Browse-by-trait disclosure renders in the same DOM position whether filtered or not — it just opens by default when a filter is active. **Do not** reshuffle sidebar blocks based on filter state.
- Synthetic trait groups (e.g. Grifters "Sets") use a separate URL param (`?trait=X&value=Y&set=1`) so a click on a synthetic set doesn't cross-highlight the underlying Type/Color row.
- Filter-preserving navigation: piece-page prev/next carries the trait filter through so a reader can "walk the White Mono Fidenzas" without losing context.
- Clear affordance sits inline beside the disclosure, not floating right.

**Full details:** [reference/FILTER.md](reference/FILTER.md).

## Data Pipeline

Two categories of build-time scripts:

- `fetch-*.mjs` — pull on-chain metadata (Alchemy `getAssetTransfers` for mint dates, contract metadata for traits) into `scripts/*.json` intermediates.
- `build-*.mjs` — consolidate intermediates into `src/lib/*.data.json` files the app imports at build time.

Also: `pin-assets.mjs` uploads canonical asset copies to Filebase / IPFS, records CIDs + SHA-256 + Sharp-generated variants in `provenance.data.json`.

**Full details:** [reference/DATA-PIPELINE.md](reference/DATA-PIPELINE.md).

## Executing `init`

1. Confirm context gathered (see above). If missing, ASK.
2. Confirm target directory. Refuse to overwrite an existing non-empty directory unless the user explicitly opts in.
3. Run `templates/scaffold.mjs` (see below) which:
   - Copies templates into target dir, doing `{{PLACEHOLDER}}` substitution
   - Runs `npm install`
   - Runs `npm run content` to build the initial editorial data (empty starter)
   - Runs `npm run build` to verify the scaffold compiles
4. Print a next-steps summary: how to add the first artist, first collection, first piece; how to run the fetch pipeline; how to pin assets.

Substitution placeholders (all `{{UPPERCASE_SNAKE}}`):

| Placeholder | Meaning |
|---|---|
| `{{FUND_NAME}}` | Wordmark, e.g. "Hivemind Digital Culture Fund" |
| `{{FUND_SHORT}}` | Short form, e.g. "Hivemind" |
| `{{SITE_URL}}` | Deployment URL, e.g. "https://dcf.hivemind.capital" |
| `{{SITE_DESCRIPTION}}` | One-sentence lede |
| `{{GATEWAY_HOST}}` | IPFS gateway hostname (Filebase, Pinata, etc.), e.g. "lightyear.myfilebase.com" |
| `{{PROJECT_SLUG}}` | Directory/package name, e.g. "dcf_gallery" |

## Executing `extend`

Adds new artists / collections / pieces to an EXISTING gallery. Steps:

1. Confirm we're inside a gallery project (check for `src/lib/data.ts` + `src/lib/curation.json`).
2. Ask what kind of extension: artist / collection / piece(s) / editorial-only prose update.
3. For pieces: ask for the portfolio row (contract, token_id, artist, collection) and run the appropriate fetch script, then merge into `data.ts`.
4. For editorial: create the appropriate `content/editorial/{artists|collections|pieces}/<slug>.json` with the right Zod schema.
5. Run `npm run content` + `npm run build` to verify.

## Executing `design-check`

Audit an existing project against gallery conventions:

- Scan for `—` (em-dash) in user-facing files (excludes code comments): `src/app/`, `src/components/`, `content/editorial/`.
- Grep for eyebrow-label consistency: any `text-[10px] uppercase` without `tracking-[0.1em] font-medium` is flagged.
- Grep for title-case section headers (e.g. `>Collection Details<` or `Hivemind Commentary`) — flag for review.
- Check `globals.css` for OKLCH tokens (fail if the palette is HSL / hex / RGB — those don't survive dark-mode toggle cleanly).
- Check `layout.tsx` for `next/font/local` calls (fail if Google Fonts or default sans is imported).

Report as a P0/P1/P2 punch list. Do NOT auto-fix; the user reviews first.

## Reference Material

Study these before implementing anything — they codify the rules that make the aesthetic hold up.

- [reference/ARCHITECTURE.md](reference/ARCHITECTURE.md) — the 4-layer data separation, why it matters, common cross-contamination mistakes.
- [reference/DESIGN.md](reference/DESIGN.md) — full typography, palette, eyebrow, casing, and em-dash rules with rationale.
- [reference/PROVENANCE.md](reference/PROVENANCE.md) — SHA-256 verify-yourself, CID resolution, storage taxonomy.
- [reference/FILTER.md](reference/FILTER.md) — trait facet mechanic, synthetic sets, URL deep-linking.
- [reference/DATA-PIPELINE.md](reference/DATA-PIPELINE.md) — fetch scripts, build scripts, pin scripts, script conventions.

## Non-Goals

To keep the skill focused, these are OUT of scope:

- Auth, purchase, or wallet-connect (the site is read-only).
- Multi-tenant / multi-fund support (each scaffold is one fund).
- CMS integration (editorial layer is git-managed JSON; TinaCMS is deferred in the DCF project and stays deferred here).
- Real-time on-chain sync (data is snapshotted at build time; readers refresh via redeploy).
- Marketplace-style trait aggregation across collections (traits live per-collection).

If a user needs any of these, this skill is the wrong starting point — they want a marketplace framework, not a catalogue.
