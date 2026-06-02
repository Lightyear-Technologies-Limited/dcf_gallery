#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, "..", "src/lib/data.ts");
let data = readFileSync(file, "utf-8");

const descs = {
  "piano-blossoms": "Five 1/1 artworks presented at a.c.k.\\'s Piano Blossoms auction in Amsterdam, October 2024. Each piece is a unique narrative painting exploring the artist\\'s evolving relationship with the Muse.",
  "her-favorite-flowers": "A singular work from a.c.k.\\'s exploration of botanical and emotive imagery, extending his narrative practice into the language of flowers.",
  "superrare-beeple": "TIME: The Future of Business was created for a 2021 TIME magazine cover \- a collaboration between a digital-native artist and a legacy publication reflecting on a world accelerating into the digital age.",
  "cryptopunks": "Created in 2017, CryptoPunks is a 10,000-piece algorithmic collection that helped pioneer on-chain generative art and sparked the NFT movement. A foundational symbol blending crypto, art, and identity.",
  "tyler-hobbs": "A collection of Tyler Hobbs\\' 1/1 artworks showcasing his mastery of blending precise digital processes with the chaos that comes from human input and computational surprises. Includes Elektroanima, One One Overflow, and Return Zero.",
  "harbor-scene": "Harbor Scene #2 (after John Henry Twachtman) was acquired through a private sale via LACMA and Cactoid Labs \- a generative reinterpretation of Twachtman\\'s Impressionist harbor painting through Hobbs\\' algorithmic lens.",
  "fidenza": "Fidenza has helped define the generative art era, blending visual clarity with algorithmic depth. Visually elegant, endlessly variable, and instantly recognizable \- a landmark work in on-chain art. DCF holds 27 of 999.",
  "day-gardens": "Day Gardens extends Tyler Hobbs\\' generative practice into quieter, more contemplative territory \- algorithmic compositions that evoke natural light and seasonal rhythm.",
  "ringers": "Using simple pegs and strings, Cherniak\\'s Ringers algorithm emphasizes control through randomness. \\u2018The Goose\\u2019 sold for $6.2M at Sotheby\\'s in 2023, securing Ringers as a landmark in on-chain generative art. DCF holds 34 of 1,000.",
  "lightyears": "A collaboration with The Estate of L\\u00e1szl\\u00f3 Moholy-Nagy, Light Years bridges the Bauhaus tradition with on-chain computation \- generative art paying homage to 20th-century visual experimentation.",
  "superrare-dmitri-cherniak": "Dmitri Cherniak\\'s singular works explore the tension between systematic process and aesthetic surprise, extending his generative practice beyond the long-form series format.",
  "grifters": "XCOPY\\'s 666-piece Grifters collection, minted in December 2021, is rich with cultural commentary and remains one of the space\\'s most sought-after series \- revered for its symbolism, holder network, and connection to the artist\\'s broader universe.",
  "superrare-xcopy": "XCOPY\\'s 1/1 works on SuperRare represent some of the artist\\'s most direct statements \- raw, glitched, and uncompromising explorations of death, dystopia, and digital-era disillusionment.",
  "human-unreadable": "The acclaimed Human Unreadable series embodies the balance between human movement and machine logic. Operator\\'s practice transforms choreographic data into generative visual output, questioning where the human ends and the system begins.",
  "repeat-as-necessary": "Repeat as Necessary extends Operator\\'s investigation of algorithmic repetition and variation \- systematic compositions that reveal emergent complexity through constrained rule sets.",
  "masks-of-luci": "Masks of Luci is a chapter in Sam Spratt\\'s expansive Luci mythology \- an on-chain narrative ecosystem that reframes blockchain as a medium for myth-making and community participation.",
  "skulls-of-luci": "Skulls of Luci marks an earlier chapter in Spratt\\'s Luci universe, establishing the visual and narrative foundations for the mythology that would grow into one of digital art\\'s most ambitious storytelling projects.",
  "winds-of-yawanawa": "Winds of Yawanawa is a groundbreaking project that showcases the potential of AI and blockchain technology for social good and cultural exchange. DCF holds 45 of 1,000.",
  "dataland-biome-lumina": "Biome Lumina is the first series of unique living paintings for Dataland, Refik Anadol\\'s ambitious Museum of AI Arts. Each artwork is fully dynamic, shaped by incoming environmental data.",
  "synthetic-dreams": "Synthetic Dreams extends Refik Anadol\\'s AI-driven practice into the territory of machine imagination \- neural networks trained on vast datasets producing outputs that hover between the photographic and the hallucinatory.",
  "qql": "QQL is a generative art algorithm by Tyler Hobbs and Dandelion Wist that invites collectors to compose their own outputs \- blending the artist\\'s system with the collector\\'s creative input. DCF holds pieces minted directly by Tyler Hobbs.",
  "lights": "Kim Asendorf\\'s Lights explores the fundamental properties of digital illumination \- algorithmic compositions built from the raw behavior of light rendered through code.",
  "pxl-dex": "PXL DEX is part of Kim Asendorf\\'s systematic investigation of the pixel as a primary unit of digital expression \- precise, formally rigorous, and rooted in the language of computation.",
  "pxl-pod": "PXL POD extends Asendorf\\'s pixel-centric practice into a distinct formal territory, emphasizing modular composition and the tension between grid structure and visual emergence.",
};

let updated = 0;
for (const [slug, desc] of Object.entries(descs)) {
  // Find the collection block by slug and replace its empty description
  const escaped = slug.replace(/-/g, "\\-");
  const re = new RegExp(`(slug: '${escaped}',[\\s\\S]*?description: )''`);
  if (re.test(data)) {
    data = data.replace(re, `$1'${desc}'`);
    updated++;
  } else {
    console.error("MISS:", slug);
  }
}

writeFileSync(file, data);
console.log(`Updated ${updated} collection descriptions.`);
