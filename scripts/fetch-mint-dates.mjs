#!/usr/bin/env node
/**
 * Fetch on-chain mint dates for every piece in data.ts and inject as
 *   mintDate: 'DD-MMM-YYYY'
 * right after `contractAddress:` on each piece object.
 *
 * Approach:
 *   - Group pieces by contract.
 *   - For each contract, paginate `alchemy_getAssetTransfers` filtered to
 *     fromAddress = 0x0 (i.e. mints), category = erc721, order = asc.
 *   - Build a tokenId -> blockTimestamp map from the transfers.
 *   - Overrides:
 *       CryptoPunks V2 (0xb47e…193BBB) → hard-coded to the airdrop date
 *         so all 40 V2 pieces read the same, matching the user's brief.
 *         (Also applies to the V1 punks in the fund since they share the
 *          same collection identity.)
 *       x-ray-machine-1 → hard-coded to "July 2025" (physical work; no
 *         on-chain mint).
 *   - Any piece missing after those steps: prints a warning; leaves as-is.
 *
 * Usage:
 *   node scripts/fetch-mint-dates.mjs [--dry-run] [--only slug1,slug2]
 *
 * Requires ALCHEMY_API_KEY in .env.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ROOT = ".";
const DATA_PATH = `${ROOT}/src/lib/data.ts`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyArgIdx = args.indexOf("--only");
const onlyList = onlyArgIdx >= 0 && args[onlyArgIdx + 1]
  ? new Set(args[onlyArgIdx + 1].split(",").map((s) => s.trim()))
  : null;

const env = {};
if (existsSync(`${ROOT}/.env`)) {
  for (const line of readFileSync(`${ROOT}/.env`, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const KEY = env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
if (!KEY) { console.error("ALCHEMY_API_KEY missing from .env"); process.exit(1); }

const CRYPTOPUNKS_V2 = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const CRYPTOPUNKS_V1 = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";
const CRYPTOPUNKS_AIRDROP_DATE = "22-Jun-2017"; // V2 contract launch / airdrop of new tokens to V1 holders
const X_RAY_MACHINE_DATE = "July 2025";        // physical work; ownership start, no on-chain mint

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatDMY(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getUTCDate()).padStart(2,"0")}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

// ------------------------------------------------------------
// Parse pieces from data.ts (id + tokenId + contract)
// ------------------------------------------------------------
const src = readFileSync(DATA_PATH, "utf8");
const pieceBlockRe = /\bid:\s*'([^']+)'[\s\S]*?contractAddress:\s*'([^']+)'/g;
const pieces = [];
const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
for (const m of src.matchAll(pieceBlockRe)) {
  const id = m[1];
  const contract = m[2].toLowerCase();
  const seg = m[0];
  const tokMatch = seg.match(/tokenId:\s*'([^']*)'/);
  let tokenId = tokMatch ? tokMatch[1] : "";
  // Art Blocks token IDs are stored on-chain as project * 1_000_000 + serial.
  // Some pieces in data.ts hold the raw serial ("145"), others already hold
  // the full ID ("78000145"). Normalise to the full ID so it matches what
  // Alchemy returns in transfer records.
  if (contract === ART_BLOCKS && tokenId) {
    const n = parseInt(tokenId, 10);
    if (Number.isFinite(n) && n < 1_000_000) {
      const project =
        id.startsWith("fidenza-") ? 78 :
        id.startsWith("ringers-") ? 13 :
        null;
      if (project !== null) tokenId = String(project * 1_000_000 + n);
    }
  }
  pieces.push({ id, contract, tokenId });
}
console.log(`Parsed ${pieces.length} pieces from data.ts`);

// Filter by --only if given.
const scope = onlyList ? pieces.filter((p) => onlyList.has(p.id)) : pieces;
console.log(`Scope: ${scope.length} pieces to process`);

// ------------------------------------------------------------
// Alchemy paginated mint-transfer fetch per contract
// ------------------------------------------------------------
async function fetchAllMints(contract) {
  const all = [];
  let pageKey = null;
  const url = `https://eth-mainnet.g.alchemy.com/v2/${KEY}`;
  do {
    const body = {
      jsonrpc: "2.0", id: 1, method: "alchemy_getAssetTransfers",
      params: [{
        fromAddress: "0x0000000000000000000000000000000000000000",
        contractAddresses: [contract],
        category: ["erc721", "erc1155"],
        withMetadata: true,
        maxCount: "0x3e8",
        order: "asc",
        ...(pageKey ? { pageKey } : {}),
      }],
    };
    const res = await fetch(url, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Alchemy HTTP ${res.status}: ${await res.text()}`);
    const j = await res.json();
    if (j.error) throw new Error(`Alchemy: ${JSON.stringify(j.error)}`);
    const rows = j?.result?.transfers || [];
    all.push(...rows);
    pageKey = j?.result?.pageKey || null;
    if (pageKey) process.stdout.write(".");
  } while (pageKey);
  return all;
}

// Normalise Alchemy hex tokenId -> decimal string.
function toDecTokenId(hex) {
  if (!hex) return "";
  return BigInt(hex).toString(10);
}

// Group pieces by contract.
const byContract = new Map();
for (const p of scope) (byContract.get(p.contract) ?? byContract.set(p.contract, []).get(p.contract)).push(p);

const mintDateBySlug = {};
const failedSlugs = [];

for (const [contract, contractPieces] of byContract) {
  // Punks + physical override — skip the fetch.
  if (contract === CRYPTOPUNKS_V2 || contract === CRYPTOPUNKS_V1) {
    for (const p of contractPieces) mintDateBySlug[p.id] = CRYPTOPUNKS_AIRDROP_DATE;
    console.log(`✓ ${contract} — Punks override applied to ${contractPieces.length} pieces (${CRYPTOPUNKS_AIRDROP_DATE})`);
    continue;
  }
  process.stdout.write(`Fetching ${contract} (${contractPieces.length} pieces): `);
  let transfers;
  try {
    transfers = await fetchAllMints(contract);
  } catch (e) {
    console.log(` FAIL — ${e.message}`);
    for (const p of contractPieces) failedSlugs.push(p.id);
    continue;
  }
  console.log(` ${transfers.length} mints`);
  // Map tokenId -> timestamp
  const dateByToken = new Map();
  for (const t of transfers) {
    const tid = toDecTokenId(t.tokenId);
    if (!dateByToken.has(tid)) dateByToken.set(tid, t.metadata?.blockTimestamp);
  }
  for (const p of contractPieces) {
    const iso = dateByToken.get(p.tokenId);
    if (iso) {
      const fmt = formatDMY(iso);
      if (fmt) mintDateBySlug[p.id] = fmt;
      else failedSlugs.push(p.id);
    } else {
      failedSlugs.push(p.id);
    }
  }
}

// x-ray-machine physical override (no on-chain token).
if (mintDateBySlug["x-ray-machine-1"] === undefined) {
  mintDateBySlug["x-ray-machine-1"] = X_RAY_MACHINE_DATE;
  console.log(`✓ x-ray-machine-1 — physical override applied (${X_RAY_MACHINE_DATE})`);
}

console.log();
console.log(`Resolved mint dates for ${Object.keys(mintDateBySlug).length}/${scope.length} pieces`);
if (failedSlugs.length) {
  console.log(`Unresolved (${failedSlugs.length}): ${failedSlugs.slice(0, 10).join(", ")}${failedSlugs.length > 10 ? "..." : ""}`);
}

// ------------------------------------------------------------
// Inject mintDate into data.ts
// ------------------------------------------------------------
if (dryRun) {
  console.log("\n(dry-run — data.ts not modified)");
  process.exit(0);
}

let out = src;
let inserted = 0, replaced = 0;
for (const [pid, date] of Object.entries(mintDateBySlug)) {
  // Anchor: find piece block by id, look for the contractAddress line to
  // position the insertion. mintDate optional; may already exist.
  const anchorRe = new RegExp(
    `(id:\\s*'${pid.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}'[\\s\\S]*?contractAddress:\\s*'[^']+',)`
  );
  const m = out.match(anchorRe);
  if (!m) continue;
  const anchor = m[0];
  const hasExisting = /mintDate:\s*'[^']*'/.test(anchor);
  if (hasExisting) {
    const next = anchor.replace(/mintDate:\s*'[^']*'/, `mintDate: '${date}'`);
    out = out.replace(anchor, next);
    replaced++;
  } else {
    out = out.replace(anchor, `${anchor}\n    mintDate: '${date}',`);
    inserted++;
  }
}
writeFileSync(DATA_PATH, out);
console.log(`\nWrote data.ts — inserted: ${inserted}, replaced: ${replaced}, unchanged: ${scope.length - inserted - replaced}`);
