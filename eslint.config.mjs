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
]);

export default eslintConfig;
