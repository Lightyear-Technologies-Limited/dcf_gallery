# Editorial content — authoring guide

**This folder holds the words on the gallery site** — the artist biographies and
the "Hivemind Commentary" curator notes. It is the single source of truth for that
prose. Editing a file here changes the live site after the next deploy; nothing
else needs to be touched.

> Why it lives here: previously this copy was buried inside a large generated data
> file, where re-importing the portfolio spreadsheet would silently overwrite it.
> Now it is separate and safe — and a point-and-click editor (TinaCMS) will be
> wired on top of these files later, so eventually you won't edit JSON by hand.

---

## The three folders

| File | Holds | Shows up on |
|---|---|---|
| `content/editorial/artists/<slug>.json` | one **artist** — `bio` (+ optional `curatorNote`, essay) | the artist page, the artists index |
| `content/editorial/collections/<slug>.json` | one **collection** — `curatorNote` (+ optional essay, links, context) | the collection page, under "Hivemind Commentary" |
| `content/editorial/pieces/<slug>.json` | one **piece** — optional external links + context only | the piece page, under "Context" and the links block |

One JSON file per entity; the filename is the slug (e.g. `fidenza.json`,
`masks-of-luci-442.json`). **Only edit the text inside the quotation marks. Do not
rename the field names** (`bio`, `curatorNote`, …) and keep the commas and braces as
they are. (A visual editor — TinaCMS — can edit these without touching JSON; see
`docs/CMS-TINA.md`.)

The `pieces/` folder is **optional and sparse** — only create a file for a piece
that has actually accumulated external references. Artists and collections need a
file each; pieces do not.

### What a file looks like

`content/editorial/collections/fidenza.json`:
```json
{
  "curatorNote": "Fidenza is the canonical Art Blocks work and a cornerstone of the generative art canon. Hivemind's 30-piece holding is built around extreme palettes and rare scales — intended to read as a cohesive sub-collection rather than a representative sample.",
  "essayUrl": "https://www.hivemind.capital/content/inside-the-collection-...",
  "essayTitle": "Inside the Collection: Fidenza"
}
```

`content/editorial/artists/xcopy.json`:
```json
{
  "bio": "XCOPY's instantly recognizable glitch aesthetic explores death, dystopia, and apathy — delivering a raw critique of capitalism and technology."
}
```

---

## Field reference

| Field | Required? | Where it appears | Guidance |
|---|---|---|---|
| `bio` (artists) | **yes** | Artist page (large) + artists index | The artist, in third person. ~2–4 sentences (~40–70 words). Who they are and why they matter. |
| `curatorNote` (collections) | optional* | Collection page, under "**Hivemind Commentary**" | DCF's own voice on *this holding* — what it is and why Hivemind holds it. ~1–3 sentences (~40–80 words). |
| `curatorNote` (artists) | optional | **nothing yet** — see below | DCF's voice on *why we collect this artist*, as distinct from the neutral `bio`. Accepted and validated, but the artist-page render is intentionally commented out pending that surface being designed. Safe to author ahead of time; just don't expect it on the site yet. |
| `essayUrl` | optional | "Read the essay →" link | Full `https://…` URL to the long-form essay (usually on hivemind.capital). Must be a valid URL. |
| `essayTitle` | optional | the essay link label | Short title, e.g. "Inside the Collection: Fidenza". |
| `links` | optional | collection page, under the commentary; piece page, in "Other resources" | Miscellaneous external references — artist site profile, catalogue page, credited collaborator. Array of `{ "label": "…", "url": "https://…" }`. Collections and pieces only. |
| `context` | optional | same places as `links` | Externally-referenced signals about the work — announcement posts, artist/critic responses, press write-ups. Same `{ label, url }` shape. Collections and pieces only. |
| `xUrl` / `xLabel` | optional | **nothing** — see below | An X (Twitter) thread. Accepted by the validator but currently rendered nowhere. |

> **Two fields are accepted but not displayed:** `curatorNote` on *artists*, and
> `xUrl`/`xLabel` everywhere. They validate fine and won't break the build — they
> simply have no render site yet. If you need an X thread to appear today, put it in
> `links` (or `context`) with an explicit label instead.
>
> **`links` and `context` currently look the same to a reader.** On the piece page
> both are merged into one "Other resources" list (`links` first, then `context`);
> on the collection page both render as plain links under the commentary. The
> intended distinction — `context` as its own titled block — hasn't been built, so
> pick whichever reads better and don't expect visual separation.

A piece file is *all* optional fields, so the smallest valid one is a single link:

```json
{
  "links": [
    { "label": "Sam Spratt — artist site", "url": "https://samspratt.com/..." }
  ]
}
```

\* A curator note may be empty (`""`) while it's being written — but the five below
should be filled.

### Voice
Institutional and restrained — the register of a serious gallery (think Gagosian /
Pace wall text), not marketing. State what the work is and what the holding
represents; avoid hype. The existing Fidenza / Ringers / Grifters notes are the
reference for tone. Curator notes are *DCF's view*, so it's fine (good, even) to say
why Hivemind assembled the set the way it did.

---

## ✅ To do (plan item C.6)

**1. Fill these five empty curator notes** (each is `content/editorial/collections/<id>.json`
with `"curatorNote": ""`):

| Edit the file `collections/<id>.json` | Collection | Artist |
|---|---|---|
| `ack-editions` | ACK Editions | Alpha Centauri Kid (a.c.k.) |
| `notable-pepes` | Notable Pepes | Alpha Centauri Kid (a.c.k.) |
| `meebit` | Meebit | Larva Labs |
| `x0x` | X0X | Kim Asendorf |
| `cope-salada` | Cope Salada | XCOPY |

**2. Audit the artist bios** in `content/editorial/artists/<slug>.json` — read all 11,
confirm each is current, accurate, and in the right voice; revise as needed.

---

## Formatting notes (so the validator is happy)

These files are **JSON**, which is fussy about punctuation:

- Put text between **double** quotes: `"curatorNote": "…text…"`.
- Apostrophes are fine inside (`Hivemind's`). A literal double-quote inside the
  text must be written as `\"`.
- For a **paragraph break** inside a note, use `\n` (e.g. `"First paragraph.\n\nSecond."`).
- Keep the trailing commas and braces exactly as they are; don't remove the `{ }`.
- Don't add new fields — anything other than the ones above will be rejected. The
  check is strict and **fails the build**, including on a misspelling: `essayURL`
  or `curatorNotes` will stop the deploy rather than being quietly ignored. That is
  deliberate (a typo can't silently drop your copy from the site), but it means the
  field names above have to match exactly.
- Avoid a literal `</script>` inside any note. The site escapes it safely, so it
  won't break the page — but it will read oddly. Describe the tag instead.

When in doubt, copy the shape of a neighbouring entry that already works.

---

## How an edit goes live

1. Edit the file (or, soon, via the CMS) and open a pull request.
2. The build **validates** the content automatically (`npm run content`). If a
   required field is empty, a URL is malformed, or a stray field sneaks in, the
   build fails with the exact location — so broken copy can't ship.
3. The pull request gets a **preview link** to read the change in context before it
   merges.
4. Merging to `master` deploys it.

*Technical note: validation is `scripts/content-schema.mjs` (Zod) run by
`scripts/build-editorial.mjs`; the app reads the result via `src/lib/editorial.ts`.*
