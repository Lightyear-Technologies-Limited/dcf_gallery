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

## The two files

| File | Holds | Shows up on |
|---|---|---|
| `content/editorial/artists/<slug>.json` | one **artist** — `bio` (+ optional essay) | the artist page, the artists index |
| `content/editorial/collections/<slug>.json` | one **collection** — `curatorNote` (+ optional essay) | the collection page, under "Hivemind Commentary" |

One JSON file per entity; the filename is the slug (e.g. `fidenza.json`). **Only edit the
text inside the quotation marks. Do not rename the field names** (`bio`, `curatorNote`, …)
and keep the commas and braces as they are. (A visual editor — TinaCMS — can edit these
without touching JSON; see `docs/CMS-TINA.md`.)

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
| `essayUrl` | optional | "Read the essay →" link | Full `https://…` URL to the long-form essay (usually on hivemind.capital). Must be a valid URL. |
| `essayTitle` | optional | the essay link label | Short title, e.g. "Inside the Collection: Fidenza". |

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
- Don't add new fields — anything other than the ones above will be rejected.

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
