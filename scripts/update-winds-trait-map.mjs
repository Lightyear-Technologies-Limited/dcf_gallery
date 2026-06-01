#!/usr/bin/env node
// Rewrite Winds entries in scripts/trait-map.json with a concise trait summary.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapPath = resolve(__dirname, "trait-map.json");
const windsPath = resolve(__dirname, "winds-traits.json");

const winds = JSON.parse(readFileSync(windsPath, "utf-8"));
const map = JSON.parse(readFileSync(mapPath, "utf-8"));

for (const w of winds) {
  if (!w.traits) continue;
  const t = w.traits;
  const origin = (t["Origin"] || "").split(" - ")[1] || "?";
  const temp = t["Color Temperature - Categorical"] || "?";
  const wind = t["Wind Intensity - Categorical"] || "?";
  const particle = t["Particle Type"] || "";
  const parts = [temp, origin];
  if (wind && wind !== "Moderate") parts.push(wind);
  if (particle === "Spherical") parts.push("Spherical");
  map[w.slug] = parts.join(", ");
}

writeFileSync(mapPath, JSON.stringify(map, null, 2) + "\n");
console.log(`Updated ${winds.length} Winds entries in trait-map.json`);
