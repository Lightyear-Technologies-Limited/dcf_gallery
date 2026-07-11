#!/usr/bin/env node
/**
 * gallery scaffold — creates a fresh gallery project from templates.
 *
 * Usage:
 *   node scaffold.mjs <target-dir> \
 *     --fund-name "Hivemind Digital Culture Fund" \
 *     --fund-short "Hivemind" \
 *     --site-url "https://dcf.hivemind.capital" \
 *     --description "A curated portfolio of digital art's first decades." \
 *     --gateway "lightyear.myfilebase.com" \
 *     --slug "dcf_gallery"
 *
 * All flags required. The script refuses to overwrite a non-empty target
 * directory unless --force is passed.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'templates');

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1]?.startsWith('--') ? true : argv[++i];
      args[k] = v;
    } else args.positional.push(a);
  }
  return args;
}

const args = parseArgs(process.argv);
const targetDir = args.positional[0];
if (!targetDir) fail('Target directory required. Usage: node scaffold.mjs <target-dir> [flags]');

const REQUIRED = ['fund-name', 'fund-short', 'site-url', 'description', 'gateway', 'slug'];
for (const r of REQUIRED) if (!args[r]) fail(`Missing required flag: --${r}`);

const substitutions = {
  '{{FUND_NAME}}': args['fund-name'],
  '{{FUND_SHORT}}': args['fund-short'],
  '{{SITE_URL}}': args['site-url'],
  '{{SITE_DESCRIPTION}}': args['description'],
  '{{GATEWAY_HOST}}': args['gateway'],
  '{{PROJECT_SLUG}}': args['slug'],
};

async function main() {
  // Refuse to overwrite non-empty existing directory
  try {
    const entries = await readdir(targetDir);
    if (entries.length > 0 && !args.force) {
      fail(`Target directory ${targetDir} is not empty. Use --force to overwrite (dangerous).`);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    await mkdir(targetDir, { recursive: true });
  }

  const files = await walk(TEMPLATES_DIR);
  let copied = 0;
  for (const abs of files) {
    const rel = relative(TEMPLATES_DIR, abs);
    const dst = join(targetDir, rel);
    await mkdir(dirname(dst), { recursive: true });
    let content = await readFile(abs, 'utf-8');
    for (const [placeholder, value] of Object.entries(substitutions)) {
      content = content.split(placeholder).join(value);
    }
    await writeFile(dst, content);
    copied++;
  }

  console.log(`✓ Copied ${copied} template files to ${targetDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${targetDir}`);
  console.log(`  npm install`);
  console.log(`  npm run content   # build initial editorial data`);
  console.log(`  npm run build     # verify scaffold compiles`);
  console.log(`  npm run dev       # start dev server\n`);
  console.log(`Then follow reference/ARCHITECTURE.md to add your first artist, collection, and piece.`);
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(abs));
    else out.push(abs);
  }
  return out;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
