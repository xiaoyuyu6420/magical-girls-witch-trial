import { test, expect } from "@playwright/test";
import { answerAllQuestions, attachConsoleListeners } from "./helpers";

test.describe("Result Page", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
  });

  test("displays all expected elements after completing quiz", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    await expect(page.locator("#view-result")).toBeVisible();
    await expect(page.locator(".result-layout")).toBeVisible();
    await expect(page.locator(".r-left")).toBeVisible();
    await expect(page.locator(".r-right")).toBeVisible();
    await expect(page.locator(".r-name")).toBeVisible();
    await expect(page.locator(".r-arch")).toBeVisible();
    await expect(page.locator(".r-stats")).toBeVisible();
    await expect(page.locator(".r-slogan")).toBeVisible();
    await expect(page.locator(".r-desc")).toBeVisible();
    await expect(page.locator(".r-actions")).toBeVisible();
    await expect(page.locator(".r-actions .btn-restart")).toHaveCount(3);
  });

  test("personality name is visible and non-empty", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const nameEl = page.locator(".r-name");
    await expect(nameEl).toBeVisible();
    const name = await nameEl.textContent();
    expect(name).toBeTruthy();
    expect(name!.trim().length).toBeGreaterThan(0);
    console.log(`[RESULT NAME] ${name}`);
  });

  test("similarity percentage is shown and is a valid number", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const statsEl = page.locator(".r-stats");
    await expect(statsEl).toBeVisible();
    const statsText = await statsEl.textContent();
    expect(statsText).toBeTruthy();

    const match = statsText!.match(/(\d+\.?\d*)%/);
    expect(match).not.toBeNull();
    const similarity = parseFloat(match![1]);
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(100);
    console.log(`[SIMILARITY] ${similarity}%`);
  });

  test("slogan and description are visible", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const slogan = page.locator(".r-slogan");
    await expect(slogan).toBeVisible();
    const sloganText = await slogan.textContent();
    expect(sloganText).toBeTruthy();
    expect(sloganText!.trim().length).toBeGreaterThan(0);
    console.log(`[SLOGAN] ${sloganText!.slice(0, 50)}...`);

    const desc = page.locator(".r-desc");
    await expect(desc).toBeVisible();
    const descText = await desc.textContent();
    expect(descText).toBeTruthy();
    expect(descText!.trim().length).toBeGreaterThan(0);
    console.log(`[DESC] ${descText!.slice(0, 50)}...`);
  });

  test("keywords are rendered as tags when present", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const keywordsContainer = page.locator(".r-keywords");
    const hasKeywords = await keywordsContainer.isVisible().catch(() => false);

    if (hasKeywords) {
      const tags = page.locator(".r-keyword-tag");
      const count = await tags.count();
      expect(count).toBeGreaterThan(0);
      console.log(`[KEYWORDS] ${count} tags found`);

      for (let i = 0; i < count; i++) {
        const tagText = await tags.nth(i).textContent();
        expect(tagText).toBeTruthy();
        expect(tagText!.trim().length).toBeGreaterThan(0);
      }
    } else {
      console.log("[KEYWORDS] No keywords for this result type");
    }
  });

  test("analysis modal opens and closes", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const analysisBtn = page.locator(".r-right button", { hasText: /ANALYSIS/ });
    await expect(analysisBtn).toBeVisible();
    await analysisBtn.click();

    const modal = page.locator("div[style*='position: fixed'][style*='z-index: 10000']");
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(page.locator("text=DIMENSION ANALYSIS")).toBeVisible();

    const closeBtn = modal.locator("button", { hasText: "×" });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    await analysisBtn.click();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("rebirth button returns to welcome page", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const rebirthBtn = page.locator(".r-actions .btn-restart", { hasText: /REBIRTH/ });
    await expect(rebirthBtn).toBeVisible();

    await rebirthBtn.click();

    await page.waitForURL("**/", { timeout: 10000 });
    expect(page.url()).toBe("http://127.0.0.1:3010/");
    console.log(`[REBIRTH] Navigated to ${page.url()}`);
  });

  test("share button exists", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const shareBtn = page.locator(".r-actions .btn-restart", { hasText: /SHARE/ });
    await expect(shareBtn).toBeVisible();
    console.log("[SHARE BUTTON] Present");
  });

  test("copy link button exists", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const copyBtn = page.locator(".r-actions .btn-restart", { hasText: /COPY LINK/ });
    await expect(copyBtn).toBeVisible();
    console.log("[COPY LINK BUTTON] Present");
  });

  test("special result shows hidden label", async ({ page }) => {
    const mockResult = {
      code: "YUKI",
      name: "月代雪",
      subtitle: "大魔女",
      slogan: "「你们人类的悲剧……我全都看在眼里。所以，由我来终结」",
      desc: "你是跨越百年的复仇者。",
      keywords: "百年复仇、绝望的清醒、冰冷的终焉",
      similarity: 100,
      userVector: "HHH-HHH-HHH-HHH",
      templateVector: "HHH-HHH-HHH-HHH",
      top3: [{ code: "YUKI", name: "月代雪", similarity: 100 }],
      group: "special",
      borderType: false,
      special: true,
    };

    await page.route("/api/match", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResult),
      });
    });

    await page.route("/api/results", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recordId: 1,
          rank: 1,
          totalParticipants: 100,
          typeCount: 1,
          typePercentage: 1.0,
        }),
      });
    });

    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const arch = page.locator(".r-arch");
    await expect(arch).toBeVisible();
    const archText = await arch.textContent();
    expect(archText).toContain("HIDDEN");
    console.log(`[SPECIAL LABEL] Found in archetype: ${archText}`);
  });

  test("border result shows border label", async ({ page }) => {
    const mockResult = {
      code: "EMMA",
      name: "樱羽艾玛",
      slogan: "「即使全世界都放弃了，我也不会」",
      desc: "你是天生的信仰者。",
      keywords: "不灭的希望、绝对的信任、自我牺牲",
      similarity: 75.5,
      userVector: "LHH-LLM-HHH-LLL",
      templateVector: "LHH-LLM-HHH-LLL",
      top3: [
        { code: "EMMA", name: "樱羽艾玛", similarity: 75.5 },
        { code: "SHERRY", name: "橘雪莉", similarity: 75.0 },
      ],
      group: "standard",
      borderType: true,
      special: false,
    };

    await page.route("/api/match", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResult),
      });
    });

    await page.route("/api/results", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recordId: 1,
          rank: 1,
          totalParticipants: 100,
          typeCount: 1,
          typePercentage: 1.0,
        }),
      });
    });

    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const arch = page.locator(".r-arch");
    await expect(arch).toBeVisible();
    const archText = await arch.textContent();
    expect(archText).toContain("BORDER");
    console.log(`[BORDER LABEL] Found in archetype: ${archText}`);
  });

  test("dimension analysis section has correct structure", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    const analysisBtn = page.locator(".r-right button", { hasText: /ANALYSIS/ });
    await expect(analysisBtn).toBeVisible();
    await analysisBtn.click();

    const modal = page.locator("div[style*='position: fixed'][style*='z-index: 10000']");
    await expect(modal).toBeVisible({ timeout: 5000 });

    const radarChart = modal.locator("svg");
    await expect(radarChart.first()).toBeVisible({ timeout: 5000 });

    const modalText = await modal.textContent();
    expect(modalText).toContain("罪业之秤");
    expect(modalText).toContain("堕落之翼");
    expect(modalText).toContain("羁绊之锁");
    expect(modalText).toContain("因子觉醒");
    expect(modalText).toContain("你");
    expect(modalText).toContain("IDEAL");

    await modal.locator("button", { hasText: "×" }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
