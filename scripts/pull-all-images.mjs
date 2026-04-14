/**
 * Pull artwork images for all pieces in the DCF collection.
 * Uses Art Blocks API for Art Blocks pieces, Alchemy NFT API for everything else.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const ART_DIR = join(process.cwd(), 'public', 'art', 'all');
if (!existsSync(ART_DIR)) mkdirSync(ART_DIR, { recursive: true });

// Art Blocks contract
const ART_BLOCKS = '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270';

// Read pieces from data.ts - extract contract + tokenId + slug
const dataFile = readFileSync(join(process.cwd(), 'src', 'lib', 'data.ts'), 'utf-8');

// Parse pieces - find all contractAddress + tokenId + slug combos
const pieces = [];
const pieceRegex = /slug: '([^']+)'[\s\S]*?collectionSlug: '([^']+)'[\s\S]*?contractAddress: '([^']*)'[\s\S]*?tokenId: '([^']*)'/g;
let match;
// Simpler approach: extract from the compiled data
// Let's just use the piece slugs and contract info

// Actually, let's parse the CSV output from the import script
const xlsxOutput = execSync('npx xlsx-cli "C:\\Users\\MichaelDavison\\Hivemind Capital Partners LLC\\Trading SharePoint Site Group - Documents\\NFTs\\Portfolio\\20260408_DCF_Portfolio.xlsx" 2>/dev/null', { encoding: 'utf-8', timeout: 30000 });

const lines = xlsxOutput.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

// Parse CSV properly (handles quoted fields)
function parseCSV(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

const seen = new Set();
const allPieces = [];

for (const line of rows) {
  const fields = parseCSV(line);
  const [tokenId, artist, title, collection, movement, walletName, walletAddr, contractAddr] = fields;
  const key = `${contractAddr}-${tokenId}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const slug = `${collection.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tokenId}`;
  allPieces.push({ tokenId, artist, title, collection, contractAddr: contractAddr?.toLowerCase(), slug });
}

console.log(`Found ${allPieces.length} unique pieces`);

// Check which already have images
const existingImages = new Set();
function checkExisting(dir) {
  try {
    const files = execSync(`find "${dir}" -name "*.png" -o -name "*.jpg" -o -name "*.webp" 2>/dev/null`, { encoding: 'utf-8' });
    files.trim().split('\n').filter(Boolean).forEach(f => existingImages.add(f));
  } catch(e) {}
}
checkExisting(join(process.cwd(), 'public', 'art'));

console.log(`Already have ${existingImages.size} images`);

// Batch download - Art Blocks pieces first
const artBlocksPieces = allPieces.filter(p => p.contractAddr === ART_BLOCKS.toLowerCase());
const otherPieces = allPieces.filter(p => p.contractAddr !== ART_BLOCKS.toLowerCase());

console.log(`Art Blocks: ${artBlocksPieces.length}, Other: ${otherPieces.length}`);

// Download Art Blocks images
let downloaded = 0;
const BATCH = 10;

async function downloadArtBlocks() {
  for (let i = 0; i < artBlocksPieces.length; i += BATCH) {
    const batch = artBlocksPieces.slice(i, i + BATCH);
    const promises = batch.map(async (p) => {
      const outFile = join(ART_DIR, `${p.contractAddr}-${p.tokenId}.png`);
      if (existsSync(outFile)) return;
      const url = `https://media-proxy.artblocks.io/1/${p.contractAddr}/${p.tokenId}.png`;
      try {
        execSync(`curl -sL "${url}" -o "${outFile}" --max-time 15`, { timeout: 20000 });
        downloaded++;
        if (downloaded % 10 === 0) console.log(`  Downloaded ${downloaded}...`);
      } catch(e) {
        // skip
      }
    });
    await Promise.all(promises);
  }
}

async function downloadAlchemy() {
  for (let i = 0; i < otherPieces.length; i += BATCH) {
    const batch = otherPieces.slice(i, i + BATCH);
    for (const p of batch) {
      const outFile = join(ART_DIR, `${p.contractAddr}-${p.tokenId}.png`);
      if (existsSync(outFile)) continue;
      try {
        const metaJson = execSync(
          `curl -s "https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${p.contractAddr}&tokenId=${p.tokenId}" --max-time 10`,
          { encoding: 'utf-8', timeout: 15000 }
        );
        const meta = JSON.parse(metaJson);
        const imgUrl = meta?.image?.cachedUrl || meta?.image?.originalUrl || '';
        if (imgUrl) {
          execSync(`curl -sL "${imgUrl}" -o "${outFile}" --max-time 15`, { timeout: 20000 });
          downloaded++;
          if (downloaded % 10 === 0) console.log(`  Downloaded ${downloaded}...`);
        }
      } catch(e) {
        // skip
      }
    }
  }
}

console.log('Downloading Art Blocks pieces...');
await downloadArtBlocks();
console.log('Downloading other pieces...');
await downloadAlchemy();
console.log(`Done. Downloaded ${downloaded} new images.`);

// Generate image map
const imageMap = {};
const artDir = join(process.cwd(), 'public', 'art', 'all');
try {
  const files = execSync(`find "${artDir}" -name "*.png" -o -name "*.jpg" -o -name "*.webp" 2>/dev/null`, { encoding: 'utf-8' });
  files.trim().split('\n').filter(Boolean).forEach(f => {
    const basename = f.split('/').pop().replace(/\.(png|jpg|webp)$/, '');
    imageMap[basename] = `/art/all/${f.split('/').pop()}`;
  });
} catch(e) {}

writeFileSync(join(process.cwd(), 'src', 'lib', 'image-map.json'), JSON.stringify(imageMap, null, 2));
console.log(`Image map: ${Object.keys(imageMap).length} entries`);
