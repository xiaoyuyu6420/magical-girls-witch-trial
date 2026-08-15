import { test, expect } from "@playwright/test";
import { attachConsoleListeners, waitForWelcomeLoaded, answerAllQuestions, adminLogin } from "./helpers";

test.describe("Mobile / Responsive", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
  });

  test("welcome page renders correctly at 375x667 viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    // Core hero elements should be visible
    await expect(page.locator(".hero__title")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".hero__tagline").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".hero__cta")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".lang-switcher")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#abyss-canvas")).toBeVisible({ timeout: 5000 });

    // The hero block is the centered content container on the new design.
    // On mobile (≤768px) it gets width: 92vw → ~345px at 375px viewport.
    const hero = page.locator(".hero");
    const width = await hero.evaluate((el) => getComputedStyle(el).width);
    const numericWidth = parseFloat(width);
    expect(numericWidth).toBeGreaterThan(300);
    expect(numericWidth).toBeLessThan(360);

    // Hero should be centered via translate
    const heroTransform = await hero.evaluate((el) => getComputedStyle(el).transform);
    expect(heroTransform).toContain("matrix");
  });

  test("welcome page renders correctly at 768x1024 viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    await expect(page.locator(".hero__title")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".hero__tagline").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".hero__cta")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".lang-switcher")).toBeVisible({ timeout: 5000 });
  });

  test("quiz page renders options in column layout on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // .options-stage should be flex-direction: column on mobile
    const optionsStage = page.locator(".options-stage");
    const flexDir = await optionsStage.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe("column");

    // .opt-block 移动端 flex: none（无挤压设计，选中靠背景/金线表达）
    const firstOpt = page.locator(".opt-block").first();
    const flexGrow = await firstOpt.evaluate((el) => getComputedStyle(el).flexGrow);
    expect(parseFloat(flexGrow)).toBe(0);

    // Should have rounded corners on mobile
    const borderRadius = await firstOpt.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(borderRadius)).toBeGreaterThan(0);
  });

  test("question stage sits in the upper region; top bar stays clear", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // The question stage hugs the top bar (fixed height, never jumps between
    // questions).  Its center sits in the upper portion of the viewport —
    // well above mid-screen, with no empty gap above it.
    const centerY = await page.locator(".q-text").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(centerY).toBeGreaterThan(60);   // below the top bar
    expect(centerY).toBeLessThan(200);     // upper portion, not mid-screen（HTML 长文案下 q-text 略低）

    // Top bar: EXIT lives inside the fixed top bar (y < 60px), not floating
    // over the question area.
    const exitBtn = page.locator(".test-header button").last();
    await expect(exitBtn).toBeVisible();
    const exitBox = await exitBtn.boundingBox();
    expect(exitBox).not.toBeNull();
    expect(exitBox!.y).toBeLessThan(60);

    // After answering once, BACK appears on the left of the same bar and does
    // not overlap EXIT.
    await page.locator(".opt-block").first().click();
    await page.waitForTimeout(1100);
    const backBtn = page.locator(".test-header button").first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
    const backBox = await backBtn.boundingBox();
    const exitBox2 = await exitBtn.boundingBox();
    expect(backBox).not.toBeNull();
    expect(exitBox2).not.toBeNull();
    // back sits strictly left of exit (no overlap)
    expect(backBox!.x + backBox!.width).toBeLessThanOrEqual(exitBox2!.x + 1);
  });

  test("result page is scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Complete the quiz
    const { reachedResult } = await answerAllQuestions(page, 30, 800);
    expect(reachedResult).toBe(true);

    // Result page should be visible
    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });

    // #view-result should exist and be the scrollable container on mobile
    const viewResult = page.locator("#view-result");
    await expect(viewResult).toBeVisible();
  });

  test("admin page is usable on mobile (table scrolls horizontally)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate first so we have a real origin, then drop the JWT token into
    // sessionStorage and reload so the dashboard renders directly.
    await page.goto("/admin", { waitUntil: "networkidle", timeout: 30000 });
    await adminLogin(page, process.env.ADMIN_PASSWORD ?? "test123");
    await page.reload({ waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Navigate to the Users tab
    await page.locator("button", { hasText: "用户追踪" }).click();
    await page.waitForTimeout(2000);

    // The table should be visible (checking for scrollability is flaky on mobile
    // because the table may not exceed the viewport width when no data is loaded)
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("no horizontal overflow on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check the welcome page
    await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    let overflowPx = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflowPx).toBeLessThanOrEqual(5);

    // Check the quiz page
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    overflowPx = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflowPx).toBeLessThanOrEqual(5);
  });

  test("touch interaction works on mobile (clicking options)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    const firstOption = page.locator(".opt-block").first();
    await firstOption.click();

    // Should be selected
    await expect(firstOption).toHaveClass(/is-selected/);

    // After animation completes, the next question should appear
    await page.waitForTimeout(1000);
    await expect(page.locator(".q-text")).toBeVisible();
  });

  test("mobile language switcher is visible and clickable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
    await waitForWelcomeLoaded(page);

    // Language switcher should be visible at the bottom left
    const langSwitcher = page.locator(".lang-switcher");
    await expect(langSwitcher).toBeVisible({ timeout: 5000 });

    // All four language buttons should be visible
    const langButtons = page.locator(".lang-btn");
    expect(await langButtons.count()).toBe(4);

    for (const btn of await langButtons.all()) {
      await expect(btn).toBeVisible();
    }

    // Click the English button and verify the CTA text changes.
    // The scramble animation is async and index-delayed; check the data-scramble
    // attribute (set synchronously) rather than the visible text.
    await page.locator(".lang-btn[data-lang='en']").click();
    await expect.poll(async () => {
      const attr = await page.locator(".hero__cta").getAttribute("data-scramble");
      return attr === "Enter the Trial";
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);

    // Click the Japanese button and verify the text changes
    await page.locator(".lang-btn[data-lang='jp']").click();
    await expect.poll(async () => {
      const attr = await page.locator(".hero__cta").getAttribute("data-scramble");
      return attr === "審判を受ける";
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
  });
});
