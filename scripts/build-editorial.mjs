#!/usr/bin/env node
/**
 * C.4 — Editorial content build join. Reads the hand-/CMS-edited editorial source —
 * one JSON file per entity under content/editorial/{artists,collections}/<slug>.json
 * (the per-entity layout TinaCMS edits) — validates each with Zod, and emits the
 * consolidated `src/lib/editorial.data.json` the app imports. Runs as a `prebuild`
 * step, so an invalid curator note fails `npm run build` with a precise file path.
 *
 * Usage: node scripts/build-editorial.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ArtistEditorial, CollectionEditorial, PieceEditorial } from "./content-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ED = resolve(ROOT, "content/editorial");

function loadDir(name, schema, { optional = false } = {}) {
  const dir = resolve(ED, name);
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    if (optional) return {};
    console.error(`✗ content/editorial/${name}/ : directory not found`);
    process.exit(1);
  }
  const out = {};
  for (const f of files) {
    const rel = `content/editorial/${name}/${f}`;
    let raw;
    try {
      raw = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
    } catch (e) {
      console.error(`✗ ${rel}: invalid JSON — ${e.message}`);
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
    out[f.replace(/\.json$/, "")] = res.data;
  }
  return out;
}

const artists = loadDir("artists", ArtistEditorial);
const collections = loadDir("collections", CollectionEditorial);
const pieces = loadDir("pieces", PieceEditorial, { optional: true });

writeFileSync(
  resolve(ROOT, "src/lib/editorial.data.json"),
  JSON.stringify({ artists, collections, pieces }) + "\n",
);
const emptyNotes = Object.entries(collections).filter(([, v]) => !v.curatorNote).map(([k]) => k);
console.log(`✓ editorial.data.json — ${Object.keys(artists).length} artists, ${Object.keys(collections).length} collections, ${Object.keys(pieces).length} pieces`);
if (emptyNotes.length) console.log(`  ⚠ ${emptyNotes.length} empty curatorNote(s) [C.6]: ${emptyNotes.join(", ")}`);
