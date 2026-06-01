#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, "..", "src/lib/curation.json");

// Proposed ordering with group comments
const ORDERS = {
  "cryptopunks": [
    // Rare Females (Tiara)
    "cryptopunks-8779-3BBB", "cryptopunks-6932-3BBB", "cryptopunks-1775-3BBB",
    // Ultra-Rare Accessories
    "cryptopunks-9133-3BBB", "cryptopunks-7728-3BBB", "cryptopunks-5528-3BBB",
    "cryptopunks-9019-3BBB", "cryptopunks-9968-3BBB", "cryptopunks-9985-3BBB",
    // High Accessory Count (4)
    "cryptopunks-3017-3BBB", "cryptopunks-4853-13f6", "cryptopunks-4776-3BBB",
    // Hoodie Gang
    "cryptopunks-269-3BBB", "cryptopunks-1568-3BBB", "cryptopunks-4926-3BBB",
    "cryptopunks-2550-3BBB", "cryptopunks-7144-3BBB",
    // Fedora + Distinguished
    "cryptopunks-6435-3BBB", "cryptopunks-8259-3BBB", "cryptopunks-4253-3BBB",
    // Uniform / Authority
    "cryptopunks-1887-13f6", "cryptopunks-9665-3BBB",
    // Big Beard Brotherhood
    "cryptopunks-4081-3BBB", "cryptopunks-8564-13f6", "cryptopunks-4633-3BBB",
    "cryptopunks-5061-3BBB", "cryptopunks-6788-3BBB", "cryptopunks-3745-3BBB",
    "cryptopunks-6583-3BBB", "cryptopunks-7364-3BBB", "cryptopunks-9405-3BBB",
    "cryptopunks-6194-3BBB",
    // Cap Forward Crew
    "cryptopunks-2412-3BBB", "cryptopunks-4558-3BBB", "cryptopunks-2758-3BBB",
    "cryptopunks-4978-3BBB", "cryptopunks-6479-3BBB", "cryptopunks-8561-13f6",
    "cryptopunks-4063-3BBB", "cryptopunks-9363-3BBB",
  ],
  "fidenza": [
    // Super Blocks (Rarest Feature) + Luxe Palette
    "fidenza-5-d270", "fidenza-200-d270", "fidenza-593-d270",
    "fidenza-378-d270", "fidenza-253-d270", "fidenza-713-d270",
    "fidenza-60-d270", "fidenza-573-d270", "fidenza-169-d270", "fidenza-943-d270",
    // Tulip Palette
    "fidenza-19-d270", "fidenza-180-d270", "fidenza-342-d270", "fidenza-819-d270",
    // Isolde Palette
    "fidenza-28-d270", "fidenza-262-d270", "fidenza-609-d270", "fidenza-929-d270",
    // Autumn Palette
    "fidenza-98-d270", "fidenza-456-d270", "fidenza-650-d270",
    // Rad Palette
    "fidenza-90-d270", "fidenza-231-d270", "fidenza-437-d270",
    "fidenza-647-d270", "fidenza-984-d270",
    // Cement Palette
    "fidenza-145-d270", "fidenza-587-d270", "fidenza-256-d270", "fidenza-718-d270",
  ],
  "ringers": [
    // Row 1 Heroes (preserved)
    "ringers-13000273-d270", "ringers-13000708-d270",
    // Row 2 Feature (preserved)
    "ringers-13000972-d270", "ringers-13000117-d270",
    "ringers-13000654-d270", "ringers-13000064-d270",
    // Early Mints
    "ringers-13000014-d270", "ringers-13000025-d270", "ringers-13000058-d270",
    "ringers-13000075-d270", "ringers-13000086-d270", "ringers-13000089-d270",
    "ringers-13000108-d270",
    // Mid-Range
    "ringers-13000174-d270", "ringers-13000209-d270", "ringers-13000214-d270",
    "ringers-13000241-d270", "ringers-13000268-d270", "ringers-13000287-d270",
    "ringers-13000303-d270", "ringers-13000338-d270", "ringers-13000342-d270",
    "ringers-13000374-d270", "ringers-13000391-d270", "ringers-13000392-d270",
    // Upper-Range
    "ringers-13000492-d270", "ringers-13000505-d270", "ringers-13000520-d270",
    "ringers-13000523-d270", "ringers-13000549-d270", "ringers-13000680-d270",
    "ringers-13000696-d270", "ringers-13000698-d270", "ringers-13000715-d270",
    // Late Mints
    "ringers-13000792-d270", "ringers-13000952-d270",
  ],
  "grifters": [
    // Hero: Rotten (heroLayout handles this, but order matters)
    "grifters-170-c1f3",
    // Hero Sidebar (preserved)
    "grifters-368-c1f3", "grifters-66-c1f3", "grifters-166-c1f3",
    "grifters-88-c1f3", "grifters-522-c1f3", "grifters-308-c1f3",
    // Early Mints
    "grifters-8-c1f3", "grifters-37-c1f3", "grifters-51-c1f3",
    // Mid-Range
    "grifters-132-c1f3", "grifters-165-c1f3", "grifters-197-c1f3",
    "grifters-222-c1f3", "grifters-254-c1f3",
    // Mid-High
    "grifters-363-c1f3", "grifters-439-c1f3", "grifters-442-c1f3", "grifters-472-c1f3",
    // Upper Range
    "grifters-532-c1f3", "grifters-542-c1f3", "grifters-547-c1f3",
    "grifters-572-c1f3", "grifters-574-c1f3",
  ],
  "masks-of-luci": [
    // Row 1 Heroes (preserved)
    "masks-of-luci-591-249a", "masks-of-luci-240-249a",
    // Philosophical / Conceptual
    "masks-of-luci-442-249a", "masks-of-luci-476-249a", "masks-of-luci-518-249a",
    // Cosmic / Light
    "masks-of-luci-86-249a", "masks-of-luci-303-249a",
    "masks-of-luci-349-249a", "masks-of-luci-569-249a",
    // Narrative / Quest
    "masks-of-luci-94-249a", "masks-of-luci-435-249a",
    "masks-of-luci-504-249a", "masks-of-luci-609-249a",
    // Nature / Process
    "masks-of-luci-142-249a", "masks-of-luci-191-249a", "masks-of-luci-241-249a",
    "masks-of-luci-394-249a", "masks-of-luci-540-249a", "masks-of-luci-597-249a",
  ],
  "human-unreadable": [
    // Row 1 Heroes (preserved)
    "x-ray-machine-1", "human-unreadable-455000124-b069",
    // Early Range
    "human-unreadable-455000095-b069", "human-unreadable-455000140-b069",
    "human-unreadable-455000141-b069", "human-unreadable-455000150-b069",
    "human-unreadable-455000155-b069", "human-unreadable-455000156-b069",
    // Mid Range
    "human-unreadable-455000169-b069", "human-unreadable-455000180-b069",
    "human-unreadable-455000201-b069", "human-unreadable-455000216-b069",
    "human-unreadable-455000237-b069", "human-unreadable-455000245-b069",
    // Upper Range
    "human-unreadable-455000278-b069", "human-unreadable-455000328-b069",
    "human-unreadable-455000336-b069", "human-unreadable-455000339-b069",
  ],
  "dataland-biome-lumina": [
    // Final Mint lead
    "dataland-biome-lumina-999-1c9d",
    // Early Mints
    "dataland-biome-lumina-115-1c9d", "dataland-biome-lumina-127-1c9d",
    "dataland-biome-lumina-161-1c9d", "dataland-biome-lumina-179-1c9d",
    "dataland-biome-lumina-207-1c9d", "dataland-biome-lumina-242-1c9d",
    // Consecutive Cluster
    "dataland-biome-lumina-458-1c9d", "dataland-biome-lumina-461-1c9d",
    "dataland-biome-lumina-464-1c9d",
    // Mid Range
    "dataland-biome-lumina-524-1c9d", "dataland-biome-lumina-549-1c9d",
    "dataland-biome-lumina-632-1c9d", "dataland-biome-lumina-665-1c9d",
    "dataland-biome-lumina-670-1c9d", "dataland-biome-lumina-691-1c9d",
    // Near-Twin Pair
    "dataland-biome-lumina-789-1c9d", "dataland-biome-lumina-791-1c9d",
  ],
  "synthetic-dreams": [
    "synthetic-dreams-51-be3a",
    "synthetic-dreams-362-be3a", "synthetic-dreams-379-be3a",
    "synthetic-dreams-625-be3a", "synthetic-dreams-630-be3a", "synthetic-dreams-648-be3a",
    "synthetic-dreams-754-be3a", "synthetic-dreams-774-be3a",
    "synthetic-dreams-854-be3a", "synthetic-dreams-858-be3a",
    "synthetic-dreams-951-be3a", "synthetic-dreams-957-be3a",
  ],
  "qql": [
    // Minted Outputs (Tyler Hobbs compositions) - more valuable
    "qql-308-0c88", "qql-309-0c88",
    // Mint Passes
    "qql-160-1088", "qql-220-1088", "qql-458-1088", "qql-496-1088",
    "qql-534-1088", "qql-617-1088", "qql-714-1088", "qql-722-1088",
    "qql-915-1088", "qql-978-1088",
  ],
  "lightyears": [
    "lightyears-1-f3f5", "lightyears-13-f3f5", "lightyears-30-f3f5",
    "lightyears-42-f3f5", "lightyears-67-f3f5", "lightyears-72-f3f5",
  ],
  "pxl-pod": [
    "pxl-pod-42-88b3", "pxl-pod-55-88b3", "pxl-pod-61-88b3",
    "pxl-pod-108-88b3", "pxl-pod-122-88b3", "pxl-pod-175-88b3",
    "pxl-pod-209-88b3", "pxl-pod-215-88b3",
    // Duo Pods
    "pxl-pod-241-88b3", "pxl-pod-242-88b3",
  ],
  "pxl-dex": [
    "pxl-dex-105-ecfb", "pxl-dex-107-ecfb", "pxl-dex-130-ecfb",
    "pxl-dex-139-ecfb", "pxl-dex-141-ecfb",
  ],
};

// Read curation.json, strip (N) tags, parse, replace pieceOrder, rewrite
let raw = readFileSync(file, "utf-8");

// Extract existing row tags before stripping
const rowMap = {};
const lines = raw.split("\n");
let inPieceOrder = false, poDepth = 0, currentCol = null;
for (const line of lines) {
  if (line.includes('"pieceOrder"')) inPieceOrder = true;
  if (!inPieceOrder) continue;
  for (const ch of line) { if (ch === "{") poDepth++; if (ch === "}") poDepth--; }
  if (poDepth === 0 && inPieceOrder && line.includes("}")) { inPieceOrder = false; continue; }
  const colMatch = line.match(/^\s*"([a-z0-9-]+)"\s*:\s*\[/);
  if (colMatch && !colMatch[1].startsWith("_")) { currentCol = colMatch[1]; continue; }
  if (line.match(/^\s*\]/)) { currentCol = null; continue; }
  if (currentCol) {
    const pm = line.match(/"([^"]+)"\s*,?\s*\((\d+)\)/);
    if (pm) {
      if (!rowMap[currentCol]) rowMap[currentCol] = {};
      rowMap[currentCol][pm[1]] = parseInt(pm[2], 10);
    }
  }
}

// Strip tags to get valid JSON
const stripped = raw.replace(/\s*\(\d*\)/g, "");
const curation = JSON.parse(stripped);

// Apply new ordering
for (const [slug, order] of Object.entries(ORDERS)) {
  curation.pieceOrder[slug] = order;
}

// Rebuild pieceRows from rowMap
curation.pieceRows = rowMap;

// Write back with inline tags
const pieceOrderBackup = curation.pieceOrder;
const pieceRowsBackup = curation.pieceRows;
delete curation.pieceOrder;
let outHead = JSON.stringify(curation, null, 2);
curation.pieceOrder = pieceOrderBackup;

const lastBrace = outHead.lastIndexOf("}");
outHead = outHead.substring(0, lastBrace).trimEnd();
if (outHead.endsWith(",")) outHead = outHead.slice(0, -1);

const pieceOrderLines = ['  "pieceOrder": {'];
const colKeys = Object.keys(pieceOrderBackup);
colKeys.forEach((colSlug, ci) => {
  pieceOrderLines.push(`    "${colSlug}": [`);
  const piecesList = pieceOrderBackup[colSlug];
  const colRows = pieceRowsBackup[colSlug] || {};
  piecesList.forEach((piece, pi) => {
    const isLast = pi === piecesList.length - 1;
    const comma = isLast ? "" : ",";
    const tag = typeof colRows[piece] === "number" ? ` (${colRows[piece]})` : " ()";
    pieceOrderLines.push(`      "${piece}"${comma}${tag}`);
  });
  pieceOrderLines.push(`    ]${ci === colKeys.length - 1 ? "" : ","}`);
});
pieceOrderLines.push("  }");

const out = outHead + ",\n" + pieceOrderLines.join("\n") + "\n}\n";
writeFileSync(file, out);

console.log("Applied new ordering to curation.json.");
console.log("Collections updated:", Object.keys(ORDERS).length);
console.log("Run `node scripts/fix-curation.mjs` to validate.");
