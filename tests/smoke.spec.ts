import { test, expect, type Page } from "@playwright/test";

// Fail any test whose page throws an uncaught exception (a stronger, less noisy
// signal than console.error, which is full of benign network chatter).
function guardPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("smoke", () => {
  // Suppress the one-time explorer tutorial so its popover doesn't intercept
  // clicks on the views beneath it (it's only shown on a genuine first visit).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem("dcf-explore-tip", "1"); } catch { /* ignore */ }
    });
  });

  test("homepage: masthead + view switcher render", async ({ page }) => {
    const errors = guardPageErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hivemind Digital Culture Fund/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /Explore views/i }).first()).toBeVisible();
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("explore index: search + grid", async ({ page }) => {
    const errors = guardPageErrors(page);
    await page.goto("/explore?view=index");
    await expect(page.getByPlaceholder(/Search the collection/i)).toBeVisible();
    await expect(page.locator('a[href^="/piece/"]').first()).toBeVisible();
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("chapters view: cinematic titles", async ({ page }) => {
    await page.goto("/explore?view=chapters");
    await expect(page.getByRole("heading", { name: "Generative Art" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Art" })).toBeVisible();
  });

  test("constellation: stars are interactive in every cluster + tag origin", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = guardPageErrors(page);
    await page.goto("/explore?view=constellation");
    const stars = page.locator('a[href^="/piece/"]');
    await expect(stars.first()).toBeVisible();
    // The pointer-events fix: every star (not just the top cluster) carries the
    // origin tag — sample several across the field.
    const count = await stars.count();
    expect(count).toBeGreaterThan(100);
    for (const i of [0, Math.floor(count / 2), count - 1]) {
      expect(await stars.nth(i).getAttribute("href")).toContain("from=constellation");
    }
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("back-to-origin: constellation → piece → back to Constellation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/explore?view=constellation");
    // Freeze the gentle cluster drift so the star is a stable click target.
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important;}" });
    await page.locator('a[href^="/piece/"]').first().click();
    await expect(page).toHaveURL(/\/piece\//);
    const back = page.getByRole("link", { name: /Constellation/ });
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute("href", /view=constellation/);
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
    await expect(page.locator('[title="Reel"]').first()).toBeVisible();
    // In "Auto" on desktop, an in-view tile mounts its <video> element.
    await expect(page.locator("video").first()).toBeAttached({ timeout: 15000 });
  });

  test("back-to-origin: salon tiles tag from=salon and back to Salon", async ({ page }) => {
    await page.goto("/");
    const tile = page.locator('a[href^="/piece/"]').first();
    await expect(tile).toBeVisible();
    expect(await tile.getAttribute("href")).toContain("from=salon");
    await tile.click();
    await expect(page).toHaveURL(/\/piece\//);
    await expect(page.getByRole("link", { name: /Salon/ }).first()).toHaveAttribute("href", "/");
  });
});
