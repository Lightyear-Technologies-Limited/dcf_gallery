# Curating the gallery — order, names & grouping

This is the companion to [`content/editorial/README.md`](../content/editorial/README.md).
That guide is about the **words**; this one is about the **arrangement** — the
order works appear in, the names shown for artists and collections, how pieces
group into rows on the wall, and what's hidden.

**One file controls all of it: [`src/lib/curation.json`](../src/lib/curation.json).**
You edit that file, run one command, and the site updates. Curation never changes
*what* art exists (that's the data layer) or the *prose* (that's the editorial
layer) — only how the existing works are arranged and labelled.

> ⚠️ Two files look similar — only edit one:
> - **`curation.json`** ← you edit this.
> - **`curation.data.json`** ← generated. Never touch it.

---

## The workflow

1. Edit `src/lib/curation.json`.
2. Apply your changes:
   ```bash
   npm run curate        # validates + regenerates what the site reads
   ```
3. *(optional)* bring back the helpful `[3/30] …` hints in the file:
   ```bash
   node scripts/annotate-curation.mjs
   ```
4. Check it:
   ```bash
   npm run build
   ```
5. Open a pull request → read the **preview link** → merge to `master` to deploy.

The `/curate` skill runs steps 2 + 3 together.

> **`curation.json` is not plain JSON.** It carries little `(1)` row tags and
> `// notes` that a strict JSON checker would reject — that's intentional, and the
> `curate` step understands them. (It also tidies and re-formats the file for you.)

---

## What you can change

| Section in the file | Controls | Example |
|---|---|---|
| `collectionNames` | The label shown for a collection | `"pxl-dex": "PXL DEX"` |
| `artistNames` | The label shown for an artist | `"a-c-k": "a.c.k."` |
| `artistOrder` | Order artists appear down the home wall | `["xcopy", "tyler-hobbs", …]` |
| `collectionOrder` | For each artist, the order of their collections | see below |
| `pieceOrder` | For each collection, the order of its works | see below |
| `(1)` row tags inside `pieceOrder` | Which **row** a work sits on (grouping) | see below |
| `hideCollections` | Collections to hide from the entire site | `["meebit", "x0x"]` |
| `piecesPerRow` | Force *N* works across for a collection | `"winds-of-yawanawa": 8` |
| `editions` | The "1 of N" edition label for a series | `"fidenza": "1/1/999"` |
| `heroLayouts` | *(advanced)* a feature hero + sidebar layout | — |
| `artistSiteTemplates` | *(technical)* the "View on …" link pattern | — |

> **Not here:** which traits are clickable filters is set in code
> (`src/lib/curation.ts`), not in this file — ask an engineer for those.

---

## Ordering — the most common task

Everything nests: **artists → collections → pieces.** Each level is just a list of
**slugs** (the unique ids like `fidenza-145-d270`). The rule is always the same:
**first in the list = shown first; anything you leave out goes to the end.**

### Reorder works within a collection

Find the collection under `pieceOrder` and move whole lines up or down:

```jsonc
"pxl-dex": [
  "pxl-dex-105-ecfb", (1)
  "pxl-dex-130-ecfb", (1)
  "pxl-dex-139-ecfb", (1)
  "pxl-dex-107-ecfb", (1)
  "pxl-dex-141-ecfb" (1)
]
```

To show `pxl-dex-141` first, cut its line and paste it at the top (mind the
commas — every line except the last ends in a comma).

> **What's a slug?** The id in quotes, e.g. `fidenza-145-d270`. They're already in
> the file — **reorder the existing lines, don't retype slugs by hand.** If one is
> misspelled, the `curate` step warns you and skips it; the site won't break.

### Reorder collections, or artists

- **Collections within an artist** → `collectionOrder` (one list per artist).
- **Artists down the home wall** → `artistOrder`, a single top-level list of
  artist slugs. *There's currently no `artistOrder` set, so artists appear
  alphabetically by display name.* Add the list to pin a deliberate order.

---

## Grouping works into rows — the `(N)` tags

Inside `pieceOrder`, each line can end with a **row number in parentheses**. Works
that share a number sit on the **same row** on the wall; an empty `()` lets the
layout place it automatically.

```jsonc
"ringers": [
  "ringers-13000273-d270", (1)
  "ringers-13000708-d270", (1)    // ← these two share row 1
  "ringers-13000972-d270", (2)    // ← row 2 starts here
  "ringers-13000117-d270", (2)
  …
]
```

You only ever change **the order of the lines** and **the numbers in `( )`**.

> Two things in the file are **generated from these tags** — don't hand-edit them,
> they're rebuilt every time you run `curate`:
> - the `// [7/30] Palette, Scale` hints after each line, and
> - the separate `pieceRows` block higher up in the file.
>
> After `npm run curate` strips the `// […]` hints, run
> `node scripts/annotate-curation.mjs` to bring them back.

---

## Renaming an artist or collection

Change the text in quotes under `artistNames` / `collectionNames`. **Keep the slug
(the key on the left) exactly as-is** — only edit the name on the right:

```jsonc
"collectionNames": {
  "pxl-dex": "PXL DEX",          // ← change only this side
  "her-favorite-flowers": "Her favorite flowers"
}
```

## Hiding a collection

Add its slug to `hideCollections`. It disappears from the whole site (it still
exists in the data — it's just not shown). Currently hidden: `ack-editions`,
`notable-pepes`, `meebit`, `x0x`, `cope-salada`.

## Edition labels

`editions` sets the "1 of N" framing for a generative series, e.g.
`"fidenza": "1/1/999"`. The default for anything not listed is `1/1` (a unique
one-of-one).

---

## If something goes wrong

- **Typo in a slug** → the `curate` step prints a warning and skips that entry. It
  does **not** stop the build — but the piece won't appear / the order is ignored
  until you fix the spelling.
- **JSON punctuation error** (a missing or extra comma, an unclosed `]`) → the
  `curate` step **stops** and prints the exact line to look at, e.g.
  `→ 462:  "piano-blossoms-2-40f9", (1)`. Fix that line and re-run.
- **Never edit** `curation.data.json` or the `pieceRows` block — both are generated
  and your changes there will be overwritten.
- Keep the `(N)` row tags **only** inside `pieceOrder`; they mean nothing elsewhere.

---

*Technical note: `scripts/fix-curation.mjs` (`npm run curate`) strips the tags,
validates every slug against `src/lib/data.ts`, and writes the valid-JSON
`curation.data.json` the app imports. `scripts/annotate-curation.mjs` re-adds the
`[position/total]` + trait hints. The app reads names and ordering via
`src/lib/curation.ts`. See [`CLAUDE.md`](../CLAUDE.md) for the engineering view.*
