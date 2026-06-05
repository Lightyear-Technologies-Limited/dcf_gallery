#!/usr/bin/env node
/**
 * C.4 — One-time extraction of human-written editorial prose out of the generated
 * `src/lib/data.ts` and into a segregated, CMS-editable source of truth.
 *
 * Pulls the editorial fields (artist `bio` + essay refs, collection `curatorNote`
 * + essay refs) into `content/editorial/{artists,collections}.json`. After this,
 * the app reads editorial from those files (see `src/lib/editorial.ts`), so a
 * re-run of the portfolio importer can no longer clobber curator copy.
 *
 * Idempotent re-extraction is destructive (it overwrites the content files with
 * data.ts's values) — only run it for the initial migration, then hand-edit the
 * content files. Usage: node scripts/extract-editorial.mjs [--force]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "src/lib/data.ts");
const OUT_DIR = resolve(ROOT, "content/editorial");

const FORCE = process.argv.includes("--force");
const text = readFileSync(DATA, "utf8");

// Bracket-aware extraction of a top-level `export const NAME: Type[] = [ … ]`
// array literal, then evaluate it as JS (our own data file — pure literals).
function extractArray(varName) {
  const re = new RegExp(`export const ${varName}\\s*:\\s*[\\w<>,\\[\\] ]+=\\s*`);
  const m = re.exec(text);
  if (!m) throw new Error(`${varName} not found in data.ts`);
  let i = m.index + m[0].length;
  while (i < text.length && text[i] !== "[") i++;
  const start = i;
  let depth = 0, inStr = null, esc = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === inStr) inStr = null;
    } else if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) { i++; break; } }
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return (${text.slice(start, i)})`)();
}

const artists = extractArray("artists");
const collections = extractArray("collections");

const artistsOut = {};
for (const a of artists) {
  const e = { bio: a.bio ?? "" };
  if (a.essayUrl) e.essayUrl = a.essayUrl;
  if (a.essayTitle) e.essayTitle = a.essayTitle;
  artistsOut[a.slug] = e;
}
const collectionsOut = {};
for (const c of collections) {
  const e = { curatorNote: c.curatorNote ?? "" };
  if (c.essayUrl) e.essayUrl = c.essayUrl;
  if (c.essayTitle) e.essayTitle = c.essayTitle;
  collectionsOut[c.slug] = e;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, data] of [["artists", artistsOut], ["collections", collectionsOut]]) {
  const path = resolve(OUT_DIR, `${name}.json`);
  if (existsSync(path) && !FORCE) {
    console.log(`! ${name}.json exists — skipping (pass --force to overwrite)`);
    continue;
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ wrote content/editorial/${name}.json (${Object.keys(data).length} entries)`);
}
