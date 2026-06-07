import { defineConfig } from "tinacms";

// TinaCMS — a git-backed visual editor over the C.4 editorial content layer
// (content/editorial/{artists,collections}/<slug>.json, validated by Zod in
// scripts/build-editorial.mjs, read by the app via src/lib/editorial.ts).
//
// Local editing works with no account: `npm run tina` (wraps next dev). Editing
// from the deployed site needs a TinaCloud project — set NEXT_PUBLIC_TINA_CLIENT_ID
// + TINA_TOKEN (see docs/CMS-TINA.md). Entities are created by the asset pipeline,
// so the CMS only edits prose (create/delete disabled).
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "master";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "uploads", publicFolder: "public" } },
  schema: {
    collections: [
      {
        name: "artist",
        label: "Artist editorial",
        path: "content/editorial/artists",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: "string", name: "bio", label: "Bio", required: true, ui: { component: "textarea" } },
          { type: "string", name: "essayUrl", label: "Essay URL" },
          { type: "string", name: "essayTitle", label: "Essay title" },
        ],
      },
      {
        name: "collection",
        label: "Collection editorial",
        path: "content/editorial/collections",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: "string", name: "curatorNote", label: "Curator note (Hivemind Commentary)", ui: { component: "textarea" } },
          { type: "string", name: "essayUrl", label: "Essay URL" },
          { type: "string", name: "essayTitle", label: "Essay title" },
        ],
      },
    ],
  },
});
