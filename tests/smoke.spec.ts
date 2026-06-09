import { test, expect, type Page } from "@playwright/test";

// Fail any test whose page throws an uncaught exception (a stronger, less noisy
// signal than console.error, which is full of benign network chatter).
function guardPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("smoke", () => {
  test("homepage: masthead + sidebar nav render", async ({ page }) => {
    const errors = guardPageErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hivemind Digital Culture Fund/i })).toBeVisible();
    // Primary sidebar nav now carries the Chapters destination (the old in-page
    // view-switcher is gone).
    await expect(page.getByRole("navigation", { name: /Primary/i }).getByRole("link", { name: "Chapters" })).toBeVisible();
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("chapters page: cinematic titles", async ({ page }) => {
    const errors = guardPageErrors(page);
    await page.goto("/chapters");
    await expect(page.getByRole("heading", { name: "Generative Art" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Art" })).toBeVisible();
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("back-to-origin: chapters filmstrip → piece → back to Chapters", async ({ page }) => {
    await page.goto("/chapters");
    const star = page.locator('a[href^="/piece/"]').first();
    await star.scrollIntoViewIfNeeded();
    expect(await star.getAttribute("href")).toContain("from=chapters");
    await star.click();
    await expect(page).toHaveURL(/\/piece\//);
    const back = page.getByRole("link", { name: /Chapters/ }).first();
    await expect(back).toHaveAttribute("href", "/chapters");
  });

  test("reels: motion toggle persists the preference", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Off" }).first().click();
    expect(await page.evaluate(() => localStorage.getItem("dcf-motion"))).toBe("off");
    await page.getByRole("radio", { name: "Auto" }).first().click();
    expect(await page.evaluate(() => localStorage.getItem("dcf-motion"))).toBe("play-all");
  });

  test("reels: video tiles show a reel marker and Auto autoplays in view", async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem("dcf-motion", "play-all"); } catch { /* ignore */ }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/collection/winds-of-yawanawa");
    await expect(page.locator('[title="Animated"]').first()).toBeVisible();
    // In "Auto" on desktop, an in-view tile mounts its <video> element.
    await expect(page.locator("video").first()).toBeAttached({ timeout: 15000 });
  });

  test("interactive: on-chain HTML runs in a sandboxed iframe on demand", async ({ page }) => {
    await page.goto("/piece/pxl-dex-105-ecfb");
    const run = page.getByRole("button", { name: /Run .* interactive/i });
    await expect(run).toBeVisible();
    await run.click();
    await expect(page.locator('iframe[sandbox="allow-scripts"]')).toBeVisible();
  });

  test("interactive: Auto runs on-chain HTML in galleries (sandboxed iframe)", async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem("dcf-motion", "play-all"); } catch { /* ignore */ }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/collection/pxl-dex");
    await expect(page.locator('iframe[sandbox="allow-scripts"]').first()).toBeAttached({ timeout: 15000 });
  });

  test("back-to-origin: salon tiles tag from=salon and back to Collection", async ({ page }) => {
    await page.goto("/");
    const tile = page.locator('a[href^="/piece/"]').first();
    await expect(tile).toBeVisible();
    expect(await tile.getAttribute("href")).toContain("from=salon");
    await tile.click();
    await expect(page).toHaveURL(/\/piece\//);
    await expect(page.getByRole("link", { name: /Collection/ }).first()).toHaveAttribute("href", "/");
  });
});
