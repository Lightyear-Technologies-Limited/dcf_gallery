# Adding pieces as the collection grows

This is the repeatable process for onboarding new artworks so they flow through
the **same asset pipeline** every existing piece uses: canonical source → pinned
to Filebase IPFS (preservation) → grid served via gateway → detail served from
our own sharp variants → blur-up. It's written for both a human and an agent (the
agent prompt is at the bottom).

See also: [`DECISIONS.md`](./DECISIONS.md), [`UPGRADE-PLAN.md`](./UPGRADE-PLAN.md).

---

## Mental model: three layers, one writer each

| Layer | Where | Who owns it | Regenerable? |
|-------|-------|-------------|--------------|
| **facts** | `src/lib/data.ts` (`pieces`/`collections`/`artists`) — tokenId, contract, slug | machine / spreadsheet | yes |
| **editorial** | same `data.ts` fields — `title`, `description`, curator notes, ordering | **human** | **no — never clobber** |
| **derived** | `src/lib/provenance.data.json`, `*.data.json` — CIDs, variants, LQIP, traits | machine (generated) | yes |

> ⚠️ **Never re-run `scripts/import-portfolio.mjs`.** It regenerates `data.ts`
> from scratch and would destroy all editorial content. It's guarded (refuses
> without `--force`). To add pieces, **append** to `data.ts` by hand (or via a
> future merge-only importer) — do not regenerate.

---

## Quick steps

```bash
# 1. Add the new piece object(s) to the `pieces` array in src/lib/data.ts
#    (and a `collections`/`artists` entry if it's a new collection/artist).
#    Minimum facts: id, slug, title, collectionSlug, artistSlug, medium,
#    contractAddress, tokenId. Editorial (description, notes) as available.

# 2. Run the asset pipeline for just the new pieces (idempotent):
npm run onboard -- --only new-slug-1,new-slug-2

# 3. Resolve any gaps the summary flags (see "Special cases").

# 4. If you changed ordering / names / added a collection:
npm run curate            # or the /curate skill (fix-curation + annotate)

# 5. Verify + deploy:
npm run build
```

`npm run onboard` chains the two pipeline scripts and prints a gap report:
1. **`npm run sources`** (`resolve-sources.mjs`) — reads each piece's on-chain
   `tokenURI` via Alchemy, captures the canonical `image` + `animation_url`,
   classifies storage. Writes `scripts/asset-sources.json`. *Needs `ALCHEMY_API_KEY`.*
2. **`npm run pin`** (`pin-assets.mjs`) — downloads each canonical original, pins
   it to the Filebase IPFS bucket (→ CID + sha256), generates **sharp** detail
   variants (768/1280/1920, webp q95) + a base64 **LQIP**, and writes
   `src/lib/provenance.data.json`. *Needs Filebase creds.*

Both skip pieces already done, so re-running is cheap and safe.

---

## How it renders (so you can spot-check)

- **Grid tiles** → Filebase **gateway** transform on the original CID
  (`…/ipfs/{cid}?img-width=N&img-format=webp`, auto-responsive, q90). Routed by
  `getArtworkImage` + the custom loader `src/lib/image-loader.js`.
- **Detail / hero** → our **sharp variants** via a plain `<img srcset>`
  (`getDetailVariants` in `provenance.ts` — server-only, rendered in `PieceLayout`),
  with **LQIP blur-up** (`getArtworkBlur`). Served raw so the gateway can't re-soften them.
- **CryptoPunks** → on-chain SVG, served from `/art/all/…svg` (no variants —
  vector). The gateway can't transform SVG.
- The genuine original stays pinned + reachable via the piece's **"View original"** link.

A correctly-onboarded raster piece shows a gateway URL in grid `<img srcset>` and
three `768w/1280w/1920w` variant CIDs on its detail page.

---

## Special cases / gotchas

- **No resolvable source** (e.g. some 1/1s where Alchemy returns nothing — like
  `cope-salada`): the gap report lists it. Get the canonical image (marketplace /
  artist / IPFS), then either add an `image` URL to its `asset-sources.json` entry
  and re-run `npm run pin --only <slug>`, or pin a local file manually. Then rebuild.
- **Video / interactive pieces**: the still image pins normally. The `animation_url`
  is *recorded and classified* (video vs interactive-HTML) but **not pinned here** —
  playback is handled by the E.1 work (see the plan). Don't block onboarding on it.
- **Centralized sources**: re-pinning to IPFS gives us our own CID + preservation
  even when the artist declared a centralized image. That's expected and good.
- **Large originals** (tens of MB): fine — they're pinned for preservation; the
  served variants are small. Variant generation just takes a few extra seconds.
- **Never hand-edit** `provenance.data.json` or `asset-sources.json` — they're
  generated. Fix inputs (`data.ts`, the source URL) and re-run.

---

## Agent prompt (reusable)

Paste this to an agent (or save as a slash command) to onboard new pieces. Fill in
the pieces being added.

```
You are onboarding new artwork into the DCF Gallery. Read docs/ADDING-PIECES.md
first. Goal: get the new piece(s) through the same asset pipeline as every other
piece, leaving the repo building cleanly.

NEW PIECES: <paste slugs, or contract+tokenId rows, or a description of what to add>

Do this:
1. Ensure each new piece exists in src/lib/data.ts `pieces` (and add a
   `collections`/`artists` entry if it's a new collection/artist). Required facts:
   id, slug, title, collectionSlug, artistSlug, medium, contractAddress, tokenId.
   Add editorial fields (description, curator notes) if provided.
   NEVER run scripts/import-portfolio.mjs — append by hand; it's destructive.
2. Run: npm run onboard -- --only <comma-separated new slugs>
3. Read the gap report. For any "no source" or pin error:
   - try to find the canonical image (marketplace / IPFS / Arweave / artist site),
   - if found, set it and re-run `npm run pin -- --only <slug>`,
   - if not findable, STOP and ask the human for a manual asset (name the piece).
4. If ordering / names / a new collection changed, update src/lib/curation.json
   and run: npm run curate
5. Run: npm run build  — fix any errors.
6. Verify the new piece(s): the detail page must show three sharp-variant CIDs
   (768w/1280w/1920w) and the grid must use a gateway URL. (Punks/SVG are exempt —
   they serve raw with no variants.)
7. Report: pieces added, CIDs pinned, any gaps still needing a human, and confirm
   the build is green.

Constraints: don't hand-edit provenance.data.json / asset-sources.json (generated);
video playback is out of scope (E.1) — just ensure the still pins.
```
