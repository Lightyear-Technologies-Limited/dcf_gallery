# Editorial layer

Long-form prose lives here as one JSON file per entity. Non-engineers can edit these files directly (or via a CMS mapped to the same structure). See [reference/ARCHITECTURE.md](../../.claude/skills/gallery/reference/ARCHITECTURE.md) if you're setting this up for the first time.

## Structure

```
content/editorial/
  artists/<artist-slug>.json     — bio, portrait credit, external links
  collections/<slug>.json        — curator note, essay link, context, artist statement
  pieces/<slug>.json             — per-piece prose overrides + context
```

## Voice rules

- **No em-dashes.** Use colon, comma, semicolon, period, parentheses.
- **Sentence-case** for anything that renders as a section header. Proper nouns keep their capitalisation.
- Editorial register: museum catalogue. Not marketing prose. Not emoji.

## Validation

Every file is Zod-validated at build time by `scripts/build-editorial.mjs` (wired as `prebuild`). A stray key or missing required field fails the build with a precise path. Fix the file, retry the build.

## Adding a new entity

1. Add the artist / collection / piece to `src/lib/data.ts` (or run the import pipeline).
2. Create a matching JSON file here.
3. Run `npm run content` to build the consolidated editorial data.

## Example

`content/editorial/collections/lights.json`:

```json
{
  "curatorNote": "Lights is Asendorf's earliest exploration of light-as-medium on-chain: a foundational entry point into pixel-native art and the throughline of his practice.",
  "context": [
    { "label": "Hivemind Acquisition Post", "url": "https://x.com/HivemindCap/status/..." }
  ]
}
```
