import { defineConfig, devices } from "@playwright/test";

/**
 * D.4 — Playwright smoke/e2e. Boots the production build (`npm run start`) and
 * exercises the key routes, the Constellation interactivity fix, and the
 * back-to-origin navigation. Kept to fast, deterministic smoke checks (no pixel
 * snapshots — those are brittle across OSes); CI runs it after the build step.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
