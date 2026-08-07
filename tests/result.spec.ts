import { test, expect, type Page } from "@playwright/test";
import { answerAllQuestions, attachConsoleListeners } from "./helpers";

/**
 * Navigate to quiz, complete all questions, skip the reveal overlay,
 * and wait for the result card to be fully settled.
 *
 * The reveal sequence takes ~4.6s on mount. After answerAllQuestions
 * returns, the reveal is typically still in progress. We press Space
 * (window-level keydown listener in ResultScreen) to skip it, then
 * wait for the CSS fade-out transition (~0.8s) plus the result-layout
 * opacity-in transition (~0.8s).
 */
async function reachResultPage(page: Page) {
  await page.goto("/test", { waitUntil: "networkidle" });
  await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
  const { reachedResult } = await answerAllQuestions(page);
  expect(reachedResult).toBe(true);

  // Skip reveal overlay if still playing (any keydown triggers skip in ResultScreen)
  await page.keyboard.press("Space");
  // Wait for reveal layer fade-out + result-layout opacity transition (~1.6s total)
  await page.waitForTimeout(1200);
  await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });
}

test.describe("Result Page", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
  });

  test("completes quiz and reaches result page", async ({ page }) => {
    await reachResultPage(page);
    // reachResultPage already asserts .result-layout is visible
    console.log("[RESULT PAGE] Reached successfully");
  });

  test("personality name is visible", async ({ page }) => {
    await reachResultPage(page);

    const nameEl = page.locator(".r-name");
    await expect(nameEl).toBeVisible();
    const name = await nameEl.textContent();
    expect(name).toBeTruthy();
    expect(name!.trim().length).toBeGreaterThan(0);
    console.log(`[RESULT NAME] ${name}`);
  });

  test("slogan is visible", async ({ page }) => {
    await reachResultPage(page);

    const slogan = page.locator(".r-slogan");
    await expect(slogan).toBeVisible();
    const sloganText = await slogan.textContent();
    expect(sloganText).toBeTruthy();
    expect(sloganText!.trim().length).toBeGreaterThan(0);
    console.log(`[SLOGAN] ${sloganText!.slice(0, 50)}`);
  });

  test("description is visible", async ({ page }) => {
    await reachResultPage(page);

    const desc = page.locator(".r-desc");
    await expect(desc).toBeVisible();
    const descText = await desc.textContent();
    expect(descText).toBeTruthy();
    expect(descText!.trim().length).toBeGreaterThan(0);
    console.log(`[DESC] ${descText!.slice(0, 50)}`);
  });

  test("keywords rendered as tags", async ({ page }) => {
    await reachResultPage(page);

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

  test("rarity is shown (not similarity)", async ({ page }) => {
    await reachResultPage(page);

    const resultLayout = page.locator(".result-layout");
    const resultText = await resultLayout.textContent();
    expect(resultText).toBeTruthy();

    // Rarity display text is always present:
    //   - "全球仅 X%"  (standard result with stats)
    //   - "全球数据收集中"  (stats not yet available)
    //   - "极少判定 · X%"  (special/hidden result with stats)
    // The label "稀有度" is always shown, and display text contains "全球" or "极少判定"
    expect(resultText).toMatch(/全球|极少判定/);
    console.log("[RARITY] Rarity text found in result layout");

    // Similarity percentage was removed in 3a — UI must NOT show it
    expect(resultText).not.toContain("相似度");
    // Old "因子共鸣度" label also removed
    expect(resultText).not.toContain("因子共鸣度");
    console.log("[SIMILARITY] No similarity text on page (correctly removed)");
  });

  test("no radar chart or dimension bars", async ({ page }) => {
    await reachResultPage(page);

    // No radar chart SVG
    const radarSvg = page.locator("svg.radar");
    await expect(radarSvg).toHaveCount(0);

    // No archetype label (.r-arch removed in 3a)
    const arch = page.locator(".r-arch");
    await expect(arch).toHaveCount(0);

    // No left/right column layout (.r-left / .r-right removed in 3a)
    const rLeft = page.locator(".r-left");
    const rRight = page.locator(".r-right");
    await expect(rLeft).toHaveCount(0);
    await expect(rRight).toHaveCount(0);

    console.log("[NO RADAR/DIMENSIONS] Confirmed: no svg.radar, no .r-arch, no .r-left/.r-right");
  });

  test("rebirth button returns to welcome", async ({ page }) => {
    await reachResultPage(page);

    // zh-CN locale: t("result.rebirth") = "重新审判"
    const rebirthBtn = page.locator(".r-actions .btn-restart", { hasText: /重新审判/ });
    await expect(rebirthBtn).toBeVisible();

    await rebirthBtn.click();

    await page.waitForURL("**/", { timeout: 10000 });
    expect(page.url()).toBe("http://127.0.0.1:3010/");
    console.log(`[REBIRTH] Navigated to ${page.url()}`);
  });

  test("share button exists", async ({ page }) => {
    await reachResultPage(page);

    // zh-CN locale: t("result.share") = "分享我的审判"
    const shareBtn = page.locator(".r-actions .btn-restart", { hasText: /分享/ });
    await expect(shareBtn).toBeVisible();
    console.log("[SHARE BUTTON] Present");
  });

  test("reveal sequence plays and can be skipped", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    // Reveal overlay appears on mount. Timings (REVEAL_TIMINGS):
    //   judgementText: 800ms  → "审判结束了。"
    //   transitionText: 1800ms  → "而你是——"
    //   cardReady: 4600ms  → revealPhase="done"
    // answerAllQuestions returns shortly after ResultScreen mounts,
    // so reveal should still be in its early stages.

    // Wait for "审判结束了。" to appear (staggered at 800ms)
    const judgementText = page.getByText("审判结束了。", { exact: true });
    await expect(judgementText).toBeVisible({ timeout: 5000 });

    // Wait for "而你是——" to appear (staggered at 1800ms)
    const transitionText = page.getByText("而你是——", { exact: true });
    await expect(transitionText).toBeVisible({ timeout: 3000 });

    // Skip the reveal — any click or keydown triggers skipReveal()
    await page.keyboard.press("Space");

    // Wait for reveal layer fade-out + result-layout opacity transition
    await page.waitForTimeout(1200);

    // Result card should now be fully visible
    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });
    console.log("[REVEAL] Sequence played and skipped successfully");
  });

  test("work intro is shown", async ({ page }) => {
    await reachResultPage(page);

    // pack.workIntro = "一部关于「在死亡回溯中守住一个人」的故事"
    // Rendered as italic text inside .result-layout
    const resultLayout = page.locator(".result-layout");
    await expect(resultLayout).toContainText("死亡回溯");
    console.log("[WORK INTRO] Shown in result layout");
  });
});
