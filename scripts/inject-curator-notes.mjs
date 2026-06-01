#!/usr/bin/env node
// Inject curator notes into data.ts for each collection. Uses the
// `slug: '<x>'` line preceding `curatorNote: ''` to identify which
// note to inject. Skips collections without an entry below (hidden ones).
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/lib/data.ts");

const NOTES = {
  "piano-blossoms": "a.c.k.'s narrative practice processes the digital condition through painterly figuration. The Piano Blossoms auction marked a pivotal moment in his maturation - five works that read as a coherent emotional arc.",
  "her-favorite-flowers": "A singular reference point in a.c.k.'s practice, bridging his crypto-native sensibility with traditional botanical painting. A reminder that digital art holds quiet, intimate registers.",
  "superrare-beeple": "Beeple's TIME cover collaboration is a watershed in the cultural legitimization of digital art - the moment a major legacy publication recognized crypto-native artists as their visual peers.",
  "dataland-biome-lumina": "Biome Lumina opens a new chapter for AI-driven art: works that breathe and respond rather than resolve as static outputs. As a founding piece in Anadol's Dataland, it anchors a new institutional framework for the medium.",
  "cryptopunks": "CryptoPunks established the cultural foundation for everything that followed in NFTs. DCF's 40-piece holding reflects the project's status as both art-historical artifact and ongoing identity primitive.",
  "day-gardens": "Day Gardens shows Hobbs returning to the painterly with the discipline of his algorithmic practice intact - gestural, observational works that document the artist's continued evolution.",
  "superrare-dmitri-cherniak": "Cherniak's two-part SuperRare diptych explores the formal interest in symmetry and asymmetry that runs through his Art Blocks practice, bringing his generative thinking into the 1/1 register.",
  "fidenza": "Fidenza is the canonical Art Blocks work and a cornerstone of the generative art canon. DCF's 30-piece holding is built around extreme palettes and rare scales - intended to read as a cohesive sub-collection rather than a representative sample.",
  "grifters": "Grifters is XCOPY's most ambitious systematic project - a generative cast of characters in his crypto-cynical visual language. The Legendary Edition centerpiece anchors DCF's set of the rarest and most expressive variants.",
  "human-unreadable": "Human Unreadable maps choreography onto generative algorithms, producing what Operator calls 'unreadable' bodies - figures shaped by code. The series is a milestone in performance-informed digital art.",
  "lightyears": "Light Years is one of Cherniak's quieter projects: a Bauhaus-informed exploration of color and form done in collaboration with the Estate of László Moholy-Nagy. It connects his algorithmic practice with 20th-century modernism.",
  "masks-of-luci": "Sam Spratt's most ambitious narrative work - a digital masquerade where each mask carries authored language and ritualized meaning. DCF holds both Council Mask 1/1s alongside a curated set of generative entries.",
  "lights": "Lights is Asendorf's earliest exploration of light-as-medium on-chain - a foundational entry point into pixel-native art and the throughline of his practice.",
  "pxl-dex": "PXL DEX is Kim Asendorf's most rigorous statement on pixel-as-currency. Each piece's pixel allowance is a finite, depletable resource - work that thinks of itself as both image and economic primitive.",
  "pxl-pod": "PXL POD continues Asendorf's pixel-native practice into modular composition, where each piece reads as both discrete artwork and node in a larger formal grammar.",
  "qql": "QQL turned generative art into a participatory medium: collectors compose their own outputs from Hobbs and Wist's algorithm. DCF holds two minted compositions alongside ten unspent Mint Passes - a position on both authorship and reserve.",
  "repeat-as-necessary": "Operator's continued investigation of the body as algorithmic input. The four-piece sequence forms a meditative arc around breath, presence, and dissolution.",
  "ringers": "Ringers is the algorithmic counterpart to Fidenza - proof that constraint produces inexhaustible variety. DCF's 36-piece holding is among the largest single-collector positions in the project, organized to read as a coherent visual taxonomy.",
  "synthetic-dreams": "Created for the Google Quantum Summer Symposium 2021, each piece is generated from quantum random states. The work documents an early collaboration between a major artist and bleeding-edge computational research.",
  "skulls-of-luci": "The precursor to Masks of Luci - Sam Spratt's earlier exploration of the same formal language with rawer, more elemental material. Historical anchors for the larger Masks practice.",
  "tyler-hobbs": "Hobbs' personal 1/1 practice - Return Zero, Elektroanima, One One Overflow - represents his most intentional standalone statements outside the generative editions. Each piece refines a different dimension of his algorithmic vocabulary.",
  "harbor-scene": "Acquired through a private LACMA exhibition - a contemporary generative response to American Impressionism. Belongs to a small body of works where Hobbs explicitly converses with art history.",
  "winds-of-yawanawa": "Anadol's data-painting practice paired with the Yawanawa community of the Brazilian Amazon. The project channels collector capital toward indigenous cultural preservation; DCF's 50-piece holding is among the largest single positions.",
  "superrare-xcopy": "DCF's XCOPY 1/1s span the artist's most-cited cultural moments - works that helped define crypto art's visual register: glitch, dread, and political commentary at compressed scale.",
};

let src = readFileSync(filePath, "utf-8");
let count = 0;

for (const [slug, note] of Object.entries(NOTES)) {
  // Match the collection block: slug, then up to 600 chars, then curatorNote: ''
  const re = new RegExp(
    `(slug: '${slug}',[\\s\\S]{0,800}?curatorNote: )''`,
    "m"
  );
  const escaped = note.replace(/'/g, "\\'");
  const before = src;
  src = src.replace(re, `$1'${escaped}'`);
  if (src !== before) {
    count++;
  } else {
    console.warn(`  [WARN] could not inject for ${slug}`);
  }
}

writeFileSync(filePath, src);
console.log(`Injected ${count} curator notes.`);
