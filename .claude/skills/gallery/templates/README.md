# {{FUND_NAME}}

Static museum-catalogue site for {{FUND_SHORT}}'s digital art holdings. Built with the `gallery` skill (see the source project's `.claude/skills/gallery/` for architecture docs).

## Quickstart

```bash
npm install
npm run content   # build editorial data
npm run dev       # http://localhost:3000
```

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (fails if any generateStaticParams page errors)
- `npm run start` — serve production build
- `npm run lint` — eslint
- `npm run typecheck` — tsc --noEmit
- `npm run content` — rebuild editorial data from `content/editorial/*.json`

## Layers

Four layers, don't cross-contaminate. See the skill's reference/ARCHITECTURE.md:

1. **On-chain source** — `src/lib/data.ts` (generated)
2. **Curation** — `src/lib/curation.json` (human-editable display rules)
3. **Editorial** — `content/editorial/{artists,collections,pieces}/*.json` (prose)
4. **Rendering** — `src/app/*` + `src/components/*` (server components)

## Conventions

- No em-dashes anywhere in user-facing copy.
- Sentence-case section headers ("Collection details", not "Collection Details").
- Eyebrow labels: `text-[10px] tracking-[0.1em] uppercase font-medium text-muted`.
- Argent Thin serif + Instrument Sans body via `next/font/local`.
- OKLCH warm-eggshell palette. Light-mode first. Dark mode is a `.dark` class toggle.

## Fonts

Drop the following into `/public/fonts/` before the first build:

- `Argent-Thin.woff2`
- `Argent-Regular.woff2`
- `InstrumentSans-Variable.woff2`

License Argent from the type foundry; Instrument Sans is SIL OFL and free (Google Fonts / fontsource).

## Deployment

Static export via `next build`. Push to Vercel / Cloudflare Pages / any static host.

Every content change requires a rebuild + redeploy — this is a static catalogue, not a live-updating dashboard.
