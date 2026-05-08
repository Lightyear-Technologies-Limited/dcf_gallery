import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

// Find the "pieces" array (not "Piece[]" type)
const marker = "export const pieces: Piece[] =";
const start = data.indexOf(marker);
if (start === -1) { console.error("marker not found"); process.exit(1); }
const arrStart = data.indexOf("[", start + marker.length);
console.log("start offset:", start, "arrStart:", arrStart);
console.log("sample:", data.slice(arrStart, arrStart + 60));

let depth = 0, i = arrStart;
for (; i < data.length; i++) {
  if (data[i] === "[") depth++;
  else if (data[i] === "]") { depth--; if (depth === 0) break; }
}
console.log("array end offset:", i);
const body = data.slice(arrStart + 1, i);
console.log("body length:", body.length);

const pieces = [];
depth = 0;
let objStart = -1;
for (let k = 0; k < body.length; k++) {
  if (body[k] === "{") { if (depth === 0) objStart = k; depth++; }
  else if (body[k] === "}") {
    depth--;
    if (depth === 0 && objStart !== -1) {
      const block = body.slice(objStart, k + 1);
      const obj = {};
      const re = /(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
      let m;
      while ((m = re.exec(block)) !== null) if (obj[m[1]] === undefined) obj[m[1]] = m[2];
      pieces.push(obj);
      objStart = -1;
    }
  }
}
console.log("parsed pieces:", pieces.length);

const missing = pieces.filter((p) => p.contractAddress && p.tokenId && !p.originalUri);
const byCol = {};
missing.forEach((p) => { byCol[p.collectionSlug] = (byCol[p.collectionSlug] || 0) + 1; });

console.log(`\nTotal: ${pieces.length}`);
console.log(`Missing originalUri: ${missing.length}`);
console.log("\nBy collection:");
Object.entries(byCol).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c.padEnd(28)} ${n}`));

console.log("\nFirst 20 missing:");
missing.slice(0, 20).forEach(p => console.log(`  ${p.slug.padEnd(40)} ${p.collectionSlug}`));
