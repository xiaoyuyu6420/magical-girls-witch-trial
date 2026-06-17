import { test, expect } from "@playwright/test";
import { waitForWelcomeLoaded, attachConsoleListeners } from "./helpers";

test.describe("Welcome Page", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
  });

  test("page loads and loader completes", async ({ page }) => {
    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    expect(response?.status()).toBe(200);

    // Loader is visible initially
    const loader = page.locator("#loader");
    await expect(loader).toBeVisible({ timeout: 5000 });

    // Wait for loader to slide away and hero to appear
    await waitForWelcomeLoaded(page);
    console.log("[LOADER] Loader completed, hero visible");
  });

  test("all key elements are visible after load", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    // Hero section
    await expect(page.locator(".hero")).toBeVisible({ timeout: 5000 });

    // Title
    const title = page.locator(".hero__title");
    await expect(title).toBeVisible({ timeout: 5000 });
    const titleText = await title.textContent();
    console.log(`[TITLE] ${titleText}`);
    expect(titleText?.trim().length).toBeGreaterThan(0);

    // Overline
    await expect(page.locator(".hero__overline")).toBeVisible({ timeout: 5000 });

    // Eyebrow
    await expect(page.locator(".hero__eyebrow")).toBeVisible({ timeout: 5000 });

    // Ornament and sigil
    await expect(page.locator(".hero__ornament")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".hero__sigil")).toBeVisible({ timeout: 5000 });

    // Taglines
    const taglines = page.locator(".hero__tagline");
    const taglineCount = await taglines.count();
    expect(taglineCount).toBeGreaterThan(0);
    for (let i = 0; i < taglineCount; i++) {
      await expect(taglines.nth(i)).toBeVisible({ timeout: 5000 });
    }

    // CTA button
    await expect(page.locator(".hero__cta")).toBeVisible({ timeout: 5000 });

    // Stats line
    await expect(page.locator("#hero-stats")).toBeVisible({ timeout: 5000 });

    console.log("[KEY ELEMENTS] All hero elements visible");
  });

  test("language buttons exist and can be clicked", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);
    // After the loader, a 3-second scramble animation runs over .hero text.
    // Wait for it to settle before interacting with the language switcher.
    await page.waitForTimeout(4000);

    const langSwitcher = page.locator(".lang-switcher");
    await expect(langSwitcher).toBeVisible({ timeout: 5000 });

    const langButtons = page.locator(".lang-btn");
    const count = await langButtons.count();
    expect(count).toBe(4); // zh, tw, en, jp

    // Verify each button has a data-lang attribute
    const expectedLangs = ["zh", "tw", "en", "jp"];
    for (const lang of expectedLangs) {
      const btn = page.locator(`.lang-btn[data-lang='${lang}']`);
      await expect(btn).toBeVisible({ timeout: 5000 });
    }

    // Default active language is zh
    await expect(page.locator(".lang-btn.active[data-lang='zh']")).toBeVisible({ timeout: 5000 });

    // Click English and verify active class switches
    const enBtn = page.locator(".lang-btn[data-lang='en']");
    await enBtn.click();
    // Wait for scramble animation on CTA to complete
    await page.waitForTimeout(2500);
    await expect(page.locator(".lang-btn.active[data-lang='en']")).toBeVisible({ timeout: 5000 });

    // Verify CTA text changed to English
    const ctaText = await page.locator(".hero__cta").textContent();
    console.log(`[CTA EN] ${ctaText?.trim()}`);
    expect(ctaText?.trim()).toBe("Enter the Trial");

    // Click Japanese and verify
    const jpBtn = page.locator(".lang-btn[data-lang='jp']");
    await jpBtn.click();
    await page.waitForTimeout(2500);
    await expect(page.locator(".lang-btn.active[data-lang='jp']")).toBeVisible({ timeout: 5000 });
    const jpCtaText = await page.locator(".hero__cta").textContent();
    console.log(`[CTA JP] ${jpCtaText?.trim()}`);
    expect(jpCtaText?.trim()).toBe("審判を受ける");

    console.log("[LANGUAGE] Language switcher works correctly");
  });

  test("clicking start button triggers embedded test", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    const startBtn = page.locator(".hero__cta");
    await expect(startBtn).toBeVisible({ timeout: 5000 });

    await startBtn.click();
    await page.waitForTimeout(2000);

    // The body should have the test-embedded class
    await expect.poll(
      async () => page.evaluate(() => document.body.classList.contains("test-embedded")),
      { timeout: 10000, message: "body did not get test-embedded class" },
    ).toBe(true);

    // The iframe should be visible (display: block when body has test-embedded)
    const iframe = page.locator("#test-embed");
    await expect(iframe).toBeAttached({ timeout: 10000 });

    // Verify iframe has src set to /test
    const iframeSrc = await iframe.getAttribute("src");
    expect(iframeSrc).toBe("/test");

    console.log("[EMBED] Test iframe embedded successfully");
  });

  test("HUD elements are visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    // HUD frame
    await expect(page.locator(".hud-frame")).toBeVisible({ timeout: 5000 });

    // HUD top bar
    const hudTop = page.locator(".hud-top");
    await expect(hudTop).toBeVisible({ timeout: 5000 });
    const hudTopText = await hudTop.textContent();
    console.log(`[HUD TOP] ${hudTopText?.trim()}`);

    // HUD bottom bar
    const hudBottom = page.locator(".hud-bottom");
    await expect(hudBottom).toBeVisible({ timeout: 5000 });
    const hudBottomText = await hudBottom.textContent();
    console.log(`[HUD BOTTOM] ${hudBottomText?.trim()}`);

    // Status blink dot
    await expect(page.locator(".status-blink")).toBeVisible({ timeout: 5000 });

    // Live time counter
    const liveTime = page.locator("#live-time");
    await expect(liveTime).toBeVisible({ timeout: 5000 });
    const timeText = await liveTime.textContent();
    expect(timeText?.length).toBeGreaterThan(0);

    // HUD corners
    await expect(page.locator(".hud-corners")).toBeAttached({ timeout: 5000 });

    console.log("[HUD] All HUD elements visible");
  });

  test("canvas background is present", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    const canvas = page.locator("#abyss-canvas");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Verify it's a canvas element with proper context
    const isCanvas = await canvas.evaluate((el) => el.tagName === "CANVAS");
    expect(isCanvas).toBe(true);

    // Check canvas has dimensions set
    const canvasWidth = await canvas.evaluate((el) => (el as HTMLCanvasElement).width);
    const canvasHeight = await canvas.evaluate((el) => (el as HTMLCanvasElement).height);
    expect(canvasWidth).toBeGreaterThan(0);
    expect(canvasHeight).toBeGreaterThan(0);

    console.log(`[CANVAS] Abyss canvas present: ${canvasWidth}x${canvasHeight}`);
  });

  test("participant count is fetched from /api/count", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    // Verify the API endpoint is accessible
    const countRes = await page.request.get("/api/count");
    expect(countRes.status()).toBe(200);
    const countData = await countRes.json();
    expect(countData).toHaveProperty("total");
    expect(typeof countData.total).toBe("number");
    console.log(`[API COUNT] ${countData.total}`);

    // Wait for the page to have fetched and updated the count
    await page.waitForTimeout(2000);

    // Check that the stats element has been updated (not the placeholder "—")
    const statsEl = page.locator("#hero-stats");
    await expect(statsEl).toBeVisible({ timeout: 5000 });
    const statsText = await statsEl.textContent();
    console.log(`[STATS] ${statsText?.trim()}`);

    // The stats should contain a number (or at minimum not be the raw placeholder)
    expect(statsText?.trim()).not.toBe("—  名 灵 魂 已 受 审");
    expect(statsText?.trim().length).toBeGreaterThan(0);
  });

  test("fullscreen button exists", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    const fsBtn = page.locator("#fs-btn");
    await expect(fsBtn).toBeVisible({ timeout: 5000 });

    // Verify it has the fs-btn class
    const hasClass = await fsBtn.evaluate((el) => el.classList.contains("fs-btn"));
    expect(hasClass).toBe(true);

    // Verify aria-label
    const ariaLabel = await fsBtn.getAttribute("aria-label");
    expect(ariaLabel).toBe("Toggle fullscreen");

    // Verify both icons are present inside the button
    const enterIcon = page.locator("#fs-icon-enter");
    const exitIcon = page.locator("#fs-icon-exit");
    await expect(enterIcon).toBeAttached({ timeout: 5000 });
    await expect(exitIcon).toBeAttached({ timeout: 5000 });

    console.log("[FULLSCREEN] Fullscreen button exists and is correctly configured");
  });

  test("no console errors during page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForWelcomeLoaded(page);
    await page.waitForTimeout(2000);

    // Filter out known harmless Next.js dev warnings and noisy network errors
    const criticalErrors = errors.filter((e) => {
      const lower = e.toLowerCase();
      if (lower.includes("fetch")) return false;
      if (lower.includes("network")) return false;
      if (lower.includes("deprecat")) return false;
      if (lower.includes("middleware to proxy")) return false;
      if (lower.includes("prisma config")) return false;
      if (lower.includes("powered-by-header")) return false;
      if (lower.includes("content security policy")) return false;
      if (lower.includes("style-src")) return false;
      if (lower.includes("fonts.googleapis.com")) return false;
      if (lower.includes("violates the following")) return false;
      return true;
    });
    console.log(`[CONSOLE ERRORS] ${errors.length} total, ${criticalErrors.length} critical`);
    if (criticalErrors.length > 0) {
      console.log(criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });
});
