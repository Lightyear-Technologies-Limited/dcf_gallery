---
name: curate
description: Refresh the DCF Gallery curation after editing curation.json. Runs fix-curation.mjs (strips inline (N) tags + // comments, validates against data.ts, regenerates curation.data.json that the app reads) then annotate-curation.mjs (re-adds [position/total] + trait comments for the editor). Use whenever curation.json has been saved with new row tags, reordering, or piece changes.
user-invocable: true
---

Refresh the DCF Gallery curation pipeline after saved edits to `src/lib/curation.json`.

## What this does

1. **`node scripts/fix-curation.mjs`** - reads the editable curation.json, strips inline `(N)` row tags and `// trait` comments, validates slugs against `src/lib/data.ts`, reorders `pieceOrder` keys to match the artist-page display order, and writes:
   - `src/lib/curation.json` - reformatted source (tags + comments preserved)
   - `src/lib/curation.data.json` - clean JSON the app imports at runtime
2. **`node scripts/annotate-curation.mjs`** - re-injects `// [position/total] trait-summary` annotations onto every piece line in `curation.json` so the editor can see position and trait at a glance. Reads `scripts/trait-map.json` for trait data.

## Steps

1. From the project root, run both scripts sequentially:
   ```bash
   cd "c:/Users/MichaelDavison/Hourglass Digital Group/Lightyear - Documents/github/dcf_gallery"
   node scripts/fix-curation.mjs
   node scripts/annotate-curation.mjs
   ```

2. Report back to the user:
   - Total pieces
   - Total collections
   - Row tag count (how many pieces across how many collections)
   - Any warnings from fix-curation.mjs (unknown slugs, belongs-to mismatches)

3. If `fix-curation.mjs` reports a JSON parse error, locate it (the error points to a line number), fix the syntax (usually a missing/extra comma or an unclosed bracket), then re-run.

4. Do NOT regenerate `trait-map.json` unless explicitly asked - that requires on-chain fetches and is expensive. If a piece in `pieceOrder` has no trait annotation after running annotate-curation.mjs, it just means the trait isn't in the map yet (fine to leave).

## Common edits the user makes before invoking /curate

- **Reordering pieces** - swap lines in a `pieceOrder` array
- **Adding row tags** - change `()` to `(1)`, `(2)` etc. to group pieces into visual rows
- **Moving pieces between rows** - reassign the `(N)` number
- **Hiding a collection** - add its slug to `hideCollections` array
- **Renaming a collection** - add/change entry in `collectionNames`

## Do not

- Do not edit `curation.data.json` directly - it's the machine-readable output.
- Do not add `(N)` tags outside the `pieceOrder` section - they only have meaning on piece slug lines.
- Do not remove the `// [position/total]` annotations manually - they're regenerated each run.
- Do not invoke this skill when no edits have been made; it's a no-op but wastes the user's time.

## Related files

- `scripts/fix-curation.mjs` - the formatter (source of truth for the (N) tag spec)
- `scripts/annotate-curation.mjs` - the annotator (trait + position injector)
- `scripts/trait-map.json` - trait summary per piece slug
- `src/lib/curation.ts` - runtime helpers that read `curation.data.json`
