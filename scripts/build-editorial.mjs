#!/usr/bin/env node
/**
 * C.4 — Editorial content build join. Reads the hand-edited editorial source
 * (content/editorial/*.json), validates it with Zod, and emits the consolidated
 * `src/lib/editorial.data.json` the app imports. Runs as a `prebuild` step, so an
 * invalid curator note fails `npm run build` with a precise field path instead of
 * shipping broken copy.
 *
 * Usage: node scripts/build-editorial.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ArtistsFile, CollectionsFile } from "./content-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ED = resolve(ROOT, "content/editorial");

function load(name, schema) {
  const rel = `content/editorial/${name}.json`;
  let raw;
  try {
    raw = JSON.parse(readFileSync(resolve(ED, `${name}.json`), "utf8"));
  } catch (e) {
    console.error(`✗ ${rel}: ${e.code === "ENOENT" ? "file not found" : `invalid JSON — ${e.message}`}`);
    process.exit(1);
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    console.error(`✗ ${rel} failed validation:`);
    for (const issue of res.error.issues) {
      console.error(`    ${rel} → ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }
  return res.data;
}

const artists = load("artists", ArtistsFile);
const collections = load("collections", CollectionsFile);

writeFileSync(
  resolve(ROOT, "src/lib/editorial.data.json"),
  JSON.stringify({ artists, collections }) + "\n",
);
const emptyNotes = Object.entries(collections).filter(([, v]) => !v.curatorNote).map(([k]) => k);
console.log(`✓ editorial.data.json — ${Object.keys(artists).length} artists, ${Object.keys(collections).length} collections`);
if (emptyNotes.length) console.log(`  ⚠ ${emptyNotes.length} empty curatorNote(s) [C.6]: ${emptyNotes.join(", ")}`);
