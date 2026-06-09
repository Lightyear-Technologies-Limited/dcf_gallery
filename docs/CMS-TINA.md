# TinaCMS — visual editing for the editorial layer

The C.4 editorial layer is structured for [TinaCMS](https://tina.io) (a git-backed
CMS): **one JSON file per entity** under
`content/editorial/{artists,collections}/<slug>.json`, with the field schema in
`tina/config.ts`. Editing through Tina just writes those files — the existing
`prebuild` (Zod validation → `editorial.data.json`) and the PR/preview flow are
unchanged, so a bad edit still fails the build with a precise file path.

That foundation is in place. Turning on the editor is a few steps (deferred so the
heavy admin dependency can be vetted against Next 16 / React 19 first):

## Enable

1. **Install**
   ```
   npm install tinacms @tinacms/cli
   ```
   Confirm it resolves cleanly against Next 16 / React 19 (use `--legacy-peer-deps`
   only if a peer warning blocks it, and re-run the build to confirm nothing regressed).

2. **Local editing (no account)**
   - Add a script: `"tina": "tinacms dev -c \"next dev\""`
   - `npm run tina` → edit at `http://localhost:3000/admin/index.html`. Edits write the
     per-entity JSON files; commit them like any change.

3. **Editing from the deployed site (TinaCloud)**
   - Create a project at [app.tina.io](https://app.tina.io), point it at this repo + branch.
   - Set env vars (Vercel + `.env`): `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`.
   - Generate the admin in the build: `"build": "tinacms build && next build"`.
   - The admin serves at `/admin` on the deploy; edits commit to the branch / open a PR.

## What it edits
`tina/config.ts` exposes two collections — **Artist editorial** (bio + essay) and
**Collection editorial** (curator note + essay). Create/delete are disabled (entities
come from the asset pipeline); editors only change prose. See
`content/editorial/README.md` for the field meanings.
