import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude / agent tooling — not project source.
    ".claude/**",
    ".agents/**",
  ]),
  {
    rules: {
      // Perf hint, not a correctness error. We use intentional setState-in-effect
      // for hydration-safe theme reads + async aspect measurement.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // One-off data-pipeline scripts (fetch-*/build-*/import-*/pull-*). These
    // destructure spreadsheet columns and API response fields they don't all
    // consume — the unused names document the upstream shape and are load-bearing
    // as documentation. 21 warnings here were drowning out the handful that
    // actually mattered in src/, so scope the rule off rather than rename them.
    files: ["scripts/**/*.mjs"],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
]);

export default eslintConfig;
