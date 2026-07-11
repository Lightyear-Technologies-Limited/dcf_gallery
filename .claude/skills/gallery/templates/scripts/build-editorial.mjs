#!/usr/bin/env node
/**
 * Consolidate content/editorial/{artists,collections,pieces}/*.json into
 * src/lib/editorial.data.json. Zod-validates every file at the entrance;
 * a stray key or missing required field fails the build with a precise
 * path. Wired as `prebuild` in package.json.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ArtistEditorial, CollectionEditorial, PieceEditorial } from "./content-schema.mjs";

const ROOT = process.cwd();

async function loadDir(dir, schema) {
  const out = {};
  const entries = await readdir(dir).catch(() => []);
  for (const fname of entries) {
    if (!fname.endsWith(".json")) continue;
    const slug = fname.slice(0, -5);
    const raw = JSON.parse(await readFile(join(dir, fname), "utf-8"));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      console.error(`✗ ${dir}/${fname} failed validation:`);
      for (const err of parsed.error.issues) {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      }
      process.exit(1);
    }
    out[slug] = parsed.data;
  }
  return out;
}

async function main() {
  const artists = await loadDir(join(ROOT, "content/editorial/artists"), ArtistEditorial);
  const collections = await loadDir(join(ROOT, "content/editorial/collections"), CollectionEditorial);
  const pieces = await loadDir(join(ROOT, "content/editorial/pieces"), PieceEditorial);

  const out = { artists, collections, pieces };
  await mkdir(join(ROOT, "src/lib"), { recursive: true });
  await writeFile(join(ROOT, "src/lib/editorial.data.json"), JSON.stringify(out, null, 2));

  const empty = [];
  for (const [slug, ed] of Object.entries(collections)) {
    if (!ed.curatorNote || !ed.curatorNote.trim()) empty.push(slug);
  }
  console.log(
    `✓ editorial.data.json — ${Object.keys(artists).length} artists, ${Object.keys(collections).length} collections, ${Object.keys(pieces).length} pieces`,
  );
  if (empty.length) console.log(`  ⚠ ${empty.length} empty curatorNote(s): ${empty.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
