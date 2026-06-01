#!/usr/bin/env node
// Consolidate per-collection trait JSONs into src/lib/traits.data.json.
// Normalizes keys (Title Case, short names) so the display component can
// iterate a simple slug → {trait: value} map.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "src/lib/traits.data.json");

const out = {};

// Fidenza: flat keys at root
try {
  const fid = JSON.parse(readFileSync(resolve(__dirname, "fidenza-traits.json"), "utf-8"));
  for (const p of fid) {
    if (!p.slug || p.error) continue;
    const t = {};
    if (p.Colors) t["Palette"] = p.Colors;
    if (p.Scale) t["Scale"] = p.Scale;
    if (p.Spiral) t["Spiral"] = p.Spiral;
    if (p.Turbulence) t["Turbulence"] = p.Turbulence;
    if (p["Super Blocks"]) t["Super Blocks"] = p["Super Blocks"];
    if (p.Density) t["Density"] = p.Density;
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping fidenza:", e.message); }

// Ringers: lowercase keys, nested not needed
try {
  const r = JSON.parse(readFileSync(resolve(__dirname, "ringer-bg.json"), "utf-8"));
  for (const p of r) {
    if (!p.slug || p.error) continue;
    const t = {};
    if (p.body) t["Body"] = p.body;
    if (p.background) t["Background"] = p.background;
    if (p.pegs !== undefined) t["Pegs"] = p.pegs;
    if (p.size) t["Size"] = p.size;
    if (p.layout) t["Layout"] = p.layout;
    if (p.wrapStyle) t["Wrap style"] = p.wrapStyle;
    if (p.wrapOrientation) t["Wrap orientation"] = p.wrapOrientation;
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping ringers:", e.message); }

// Winds: nested in .traits with long - Categorical keys
try {
  const w = JSON.parse(readFileSync(resolve(__dirname, "winds-traits.json"), "utf-8"));
  for (const p of w) {
    if (!p.slug || !p.traits) continue;
    const s = p.traits;
    const t = {};
    if (s["Origin"]) t["Origin"] = s["Origin"];
    if (s["Color Temperature - Categorical"]) t["Color Temperature"] = s["Color Temperature - Categorical"];
    if (s["Wind Intensity - Categorical"]) t["Wind Intensity"] = s["Wind Intensity - Categorical"];
    if (s["Particle Type"]) t["Particle Type"] = s["Particle Type"];
    if (s["Generative Soundtrack"]) t["Soundtrack"] = s["Generative Soundtrack"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping winds:", e.message); }

// Human Unreadable: .features at root
try {
  const hu = JSON.parse(readFileSync(resolve(__dirname, "human-unreadable-traits.json"), "utf-8"));
  for (const p of hu) {
    if (!p.slug || !p.features) continue;
    const f = p.features;
    const t = {};
    if (f["Emotional Climate"]) t["Emotional Climate"] = f["Emotional Climate"];
    if (f["Vulnerability"]) t["Vulnerability"] = f["Vulnerability"];
    if (f["Signature Bone"]) t["Signature Bone"] = f["Signature Bone"];
    if (f["Improv"] && f["Improv"] !== "Absent") t["Improv"] = f["Improv"];
    if (f["Pause"] && f["Pause"] !== "No") t["Pause"] = f["Pause"];
    if (f["Slowness"] && f["Slowness"] !== "Slow") t["Slowness"] = f["Slowness"];
    if (f["Unique Moves"] !== undefined) t["Unique Moves"] = f["Unique Moves"];
    if (f["Sequence Length"] !== undefined) t["Sequence Length"] = f["Sequence Length"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping human-unreadable:", e.message); }

// Biome Lumina: nested in .traits (all uppercase keys)
try {
  const b = JSON.parse(readFileSync(resolve(__dirname, "biome-lumina-traits.json"), "utf-8"));
  for (const p of b) {
    if (!p.slug || !p.traits) continue;
    const s = p.traits;
    const t = {};
    if (s["TYPE"]) t["Type"] = titleCase(s["TYPE"]);
    if (s["CLUSTER"]) t["Cluster"] = titleCase(s["CLUSTER"]);
    if (s["LOCATION"]) t["Location"] = titleCase(s["LOCATION"]);
    if (s["STATUS"]) t["Status"] = titleCase(s["STATUS"]);
    if (s["MOVEMENT"]) t["Movement"] = titleCase(s["MOVEMENT"]);
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping biome-lumina:", e.message); }

// Synthetic Dreams: nested in .traits
try {
  const s = JSON.parse(readFileSync(resolve(__dirname, "synthetic-dreams-traits.json"), "utf-8"));
  for (const p of s) {
    if (!p.slug || !p.traits) continue;
    const tr = p.traits;
    const t = {};
    if (tr["Cluster"]) t["Cluster"] = titleCase(tr["Cluster"]);
    if (tr["Rarity"] !== undefined) t["Rarity"] = tr["Rarity"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping synthetic-dreams:", e.message); }

// Grifters: nested in .traits. Color is split across Type-named keys (Gouge/Wretch/Flimflam/Shady).
try {
  const g = JSON.parse(readFileSync(resolve(__dirname, "grifters-traits.json"), "utf-8"));
  for (const p of g) {
    if (!p.slug || !p.traits) continue;
    const s = p.traits;
    const t = {};
    if (s["Asset Type"]) t["Asset Type"] = s["Asset Type"];
    if (s["Type"]) t["Type"] = s["Type"];
    const color = s["Gouge"] || s["Wretch"] || s["Flimflam"] || s["Shady"];
    if (color) t["Color"] = color;
    if (s["Vision"]) t["Vision"] = s["Vision"];
    if (s["Noise"]) t["Noise"] = s["Noise"];
    if (s["Surface"]) t["Surface"] = s["Surface"];
    if (s["Atmosphere"]) t["Atmosphere"] = s["Atmosphere"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping grifters:", e.message); }

// Masks of Luci: nested in .traits
try {
  const m = JSON.parse(readFileSync(resolve(__dirname, "masks-traits.json"), "utf-8"));
  for (const p of m) {
    if (!p.slug || !p.traits) continue;
    const s = p.traits;
    const t = {};
    if (s["Attendee Type"]) t["Attendee Type"] = s["Attendee Type"];
    if (s["Category"]) t["Category"] = s["Category"];
    if (s["Material"]) t["Material"] = s["Material"];
    if (s["Region"]) t["Region"] = s["Region"].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (s["Adornments"]) t["Adornments"] = s["Adornments"];
    if (s["Bond"]) t["Bond"] = s["Bond"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping masks:", e.message); }

// QQL: only the 2 minted pieces have traits; mint passes are unminted
try {
  const q = JSON.parse(readFileSync(resolve(__dirname, "qql-traits.json"), "utf-8"));
  for (const p of q) {
    if (!p.slug || !p.traits || Object.keys(p.traits).length === 0) continue;
    const s = p.traits;
    const t = {};
    if (s["Color Palette"]) t["Palette"] = s["Color Palette"];
    if (s["Color Mode"]) t["Color Mode"] = s["Color Mode"];
    if (s["Structure"]) t["Structure"] = s["Structure"];
    if (s["Flow Field"]) t["Flow Field"] = s["Flow Field"];
    if (s["Turbulence"]) t["Turbulence"] = s["Turbulence"];
    if (s["Spacing"]) t["Spacing"] = s["Spacing"];
    if (s["Background Color"]) t["Background"] = s["Background Color"];
    if (Object.keys(t).length) out[p.slug] = t;
  }
} catch (e) { console.warn("Skipping qql:", e.message); }

// PXL DEX: Pixels + Allowance counters fetched ad-hoc (no per-collection json yet)
const PXL_DEX_TRAITS = {
  "pxl-dex-105-ecfb": { Pixels: 500000, Allowance: 500000 },
  "pxl-dex-107-ecfb": { Pixels: 450000, Allowance: 0 },
  "pxl-dex-130-ecfb": { Pixels: 500000, Allowance: 500000 },
  "pxl-dex-139-ecfb": { Pixels: 500000, Allowance: 500000 },
  "pxl-dex-141-ecfb": { Pixels: 0, Allowance: 0 },
};
for (const [slug, traits] of Object.entries(PXL_DEX_TRAITS)) {
  out[slug] = traits;
}

function titleCase(str) {
  return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${Object.keys(out).length} entries to src/lib/traits.data.json`);
