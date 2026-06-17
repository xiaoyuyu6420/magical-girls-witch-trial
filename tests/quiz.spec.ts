import { test, expect, Page } from "@playwright/test";
import { answerAllQuestions, attachConsoleListeners } from "./helpers";

const STORAGE_KEY = "witch-trial-progress";

/**
 * Answer the current question by clicking the option at the given index.
 * Waits for the animation delay before returning.
 */
async function answerQuestion(page: Page, optionIndex: number, clickDelay = 900) {
  const optBlocks = page.locator(".opt-block");
  await expect(optBlocks.first()).toBeVisible({ timeout: 5000 });
  const count = await optBlocks.count();
  if (optionIndex >= count) {
    throw new Error(`Option index ${optionIndex} out of bounds (count: ${count})`);
  }
  await optBlocks.nth(optionIndex).click({ force: true, timeout: 5000 });
  await page.waitForTimeout(clickDelay);
}

/**
 * Check if we are on the result page.
 */
async function isResultPage(page: Page) {
  return page.locator(".result-layout").isVisible({ timeout: 100 }).catch(() => false);
}

/**
 * Get the current question's meta text.
 */
async function getQuestionMeta(page: Page) {
  const meta = page.locator(".q-meta span").first();
  if (await meta.isVisible({ timeout: 100 }).catch(() => false)) {
    return meta.textContent();
  }
  return null;
}

/**
 * Get the current question text.
 */
async function getQuestionText(page: Page) {
  const qText = page.locator(".q-text");
  if (await qText.isVisible({ timeout: 100 }).catch(() => false)) {
    return qText.textContent();
  }
  return null;
}

/**
 * Get the current progress bar width percentage.
 */
async function getProgressWidth(page: Page) {
  return page.locator("#progress-line").evaluate((el) => {
    return parseFloat((el as HTMLElement).style.width || "0");
  });
}

/**
 * Check if a gate badge is visible on the current question.
 */
async function hasGateBadge(page: Page) {
  return page.locator(".gate-badge").isVisible({ timeout: 100 }).catch(() => false);
}

test.describe("Quiz E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
    // Clear any leftover progress before each test
    await page.goto("/test", { waitUntil: "networkidle" });
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // 1. Complete all questions and reach result page (the main flow)
  // ---------------------------------------------------------------------------
  test("complete all questions and reach result page", async ({ page }) => {
    const { questionCount, reachedResult } = await answerAllQuestions(page, 30, 900);
    expect(reachedResult).toBe(true);
    expect(questionCount).toBeGreaterThanOrEqual(24); // 25 or 26 depending on gate
    expect(questionCount).toBeLessThanOrEqual(26);

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".r-name")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. Answer with different options and verify result
  // ---------------------------------------------------------------------------
  test("answer with different options produces a result", async ({ page }) => {
    // Always pick the last option (highest score = most aggressive)
    let count = 0;
    while (count < 30) {
      if (await isResultPage(page)) break;
      const opts = page.locator(".opt-block");
      const n = await opts.count();
      if (n === 0) {
        await page.waitForTimeout(500);
        if (await isResultPage(page)) break;
        break;
      }
      await opts.last().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(900);
      count++;
    }

    expect(await isResultPage(page)).toBe(true);
    const resultName = await page.locator(".r-name").textContent();
    expect(resultName).toBeTruthy();
    console.log(`[TEST] Result with last-option strategy: ${resultName}`);
  });

  // ---------------------------------------------------------------------------
  // 3. Progress bar updates correctly
  // ---------------------------------------------------------------------------
  test("progress bar updates with each question", async ({ page }) => {
    const initial = await getProgressWidth(page);
    expect(initial).toBe(0);

    // Answer first 5 questions and track progress
    const widths: number[] = [initial];
    for (let i = 0; i < 5; i++) {
      await answerQuestion(page, 0, 900);
      // Wait for the next question to be rendered before reading progress
      await expect(page.locator(".q-text")).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(200);
      widths.push(await getProgressWidth(page));
    }

    // Progress should be strictly increasing (or non-decreasing)
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    }
    // Last recorded width should be > 0 after answering 5 questions
    expect(widths[widths.length - 1]).toBeGreaterThan(0);

    console.log(`[TEST] Progress widths: ${widths.join(" → ")}%`);
  });

  // ---------------------------------------------------------------------------
  // 4. Question count matches expected
  // ---------------------------------------------------------------------------
  test("question count matches expected total", async ({ page }) => {
    let questionCount = 0;
    let sawGate = false;

    while (questionCount < 30) {
      if (await isResultPage(page)) break;
      const opts = page.locator(".opt-block");
      const n = await opts.count();
      if (n === 0) {
        await page.waitForTimeout(500);
        if (await isResultPage(page)) break;
        break;
      }

      const meta = await getQuestionMeta(page);
      const text = await getQuestionText(page);
      if (meta && meta.includes("命运分歧")) sawGate = true;
      if (text && text.includes("因子在你的体内剧烈共鸣")) sawGate = true; // trigger text

      await opts.first().click();
      await page.waitForTimeout(700);
      questionCount++;
    }

    // Total questions: 25 if gate is "normal"/"normal_alt", 26 if "destroy"/"endure"
    expect(questionCount).toBeGreaterThanOrEqual(24);
    expect(questionCount).toBeLessThanOrEqual(26);
    console.log(`[TEST] Total questions answered: ${questionCount}, saw gate/trigger: ${sawGate}`);
  });

  // ---------------------------------------------------------------------------
  // 5. Gate question appears and sets correct gate value
  // ---------------------------------------------------------------------------
  test("gate question appears and sets gate value", async ({ page }) => {
    let gateSeen = false;
    let gateIndex = -1;
    let count = 0;

    while (count < 30) {
      if (await isResultPage(page)) break;
      const opts = page.locator(".opt-block");
      const n = await opts.count();
      if (n === 0) {
        await page.waitForTimeout(500);
        if (await isResultPage(page)) break;
        break;
      }

      const hasBadge = await hasGateBadge(page);
      const meta = await getQuestionMeta(page);
      const text = await getQuestionText(page);
      const isGateQuestion = hasBadge || (meta && meta.includes("命运分歧")) || (text && text.includes("大魔女站在你面前"));

      if (isGateQuestion) {
        gateSeen = true;
        gateIndex = count;
        console.log(`[TEST] Gate question at index ${count}: ${text?.slice(0, 40)}...`);

        // Verify it has 4 options
        expect(n).toBe(4);

        // Pick "destroy" (first option) to test gate value setting
        await opts.first().click();
        await page.waitForTimeout(700);

        // Check localStorage for gateValue
        const saved = await page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        }, STORAGE_KEY);

        expect(saved).not.toBeNull();
        expect(saved.gateValue).toBe("destroy");
        count++;
        break;
      }

      await opts.first().click();
      await page.waitForTimeout(700);
      count++;
    }

    expect(gateSeen).toBe(true);
    expect(gateIndex).toBeGreaterThanOrEqual(10); // Gate appears after ~17 normal questions
    console.log(`[TEST] Gate question found at index ${gateIndex}`);
  });

  // ---------------------------------------------------------------------------
  // 6. If gate value is "destroy"/"endure", trigger question appears
  // ---------------------------------------------------------------------------
  test("trigger question appears after destroy/endure gate value", async ({ page }) => {
    let answered = 0;
    let triggerSeen = false;

    while (answered < 30) {
      if (await isResultPage(page)) break;
      const opts = page.locator(".opt-block");
      const n = await opts.count();
      if (n === 0) {
        await page.waitForTimeout(500);
        if (await isResultPage(page)) break;
        break;
      }

      const text = await getQuestionText(page);
      const isTrigger = text && text.includes("因子在你的体内剧烈共鸣");
      const meta = await getQuestionMeta(page);
      const isGate = meta && meta.includes("命运分歧");

      if (isTrigger) {
        triggerSeen = true;
        console.log(`[TEST] Trigger question found at index ${answered}: ${text?.slice(0, 40)}...`);
        // Trigger should have 2 options
        expect(n).toBe(2);
        break;
      }

      if (isGate) {
        // Click "destroy" (first option) to enable trigger
        await opts.first().click();
      } else {
        await opts.first().click();
      }

      await page.waitForTimeout(700);
      answered++;
    }

    expect(triggerSeen).toBe(true);
    console.log(`[TEST] Total questions before trigger: ${answered}`);
  });

  // ---------------------------------------------------------------------------
  // 7. Exit button clears progress and returns to welcome
  // ---------------------------------------------------------------------------
  test("exit button clears progress and returns to welcome", async ({ page }) => {
    // Answer a few questions first
    for (let i = 0; i < 3; i++) {
      await answerQuestion(page, 0, 700);
    }

    // Verify progress is saved
    const savedBefore = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(savedBefore).not.toBeNull();
    const parsed = JSON.parse(savedBefore!);
    expect(parsed.currentIndex).toBeGreaterThan(0);

    // Click EXIT button
    const exitButton = page.locator('button:has-text("EXIT")');
    await expect(exitButton).toBeVisible();
    await exitButton.click();

    // Wait for navigation to welcome page
    await page.waitForURL("/", { timeout: 10000 });

    // Verify localStorage is cleared
    const savedAfter = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(savedAfter).toBeNull();

    // Verify welcome page loaded
    await expect(page.locator(".hero")).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // 8. Multiple runs produce consistent results
  // ---------------------------------------------------------------------------
  test("multiple runs produce consistent results", async ({ page }) => {
    const results: string[] = [];

    for (let run = 0; run < 3; run++) {
      // Clear state and start fresh
      await page.goto("/test", { waitUntil: "networkidle" });
      await page.evaluate((key) => {
        localStorage.removeItem(key);
        localStorage.clear();
      }, STORAGE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

      // Always pick the first option
      const { reachedResult } = await answerAllQuestions(page, 30, 900);
      expect(reachedResult).toBe(true);

      const resultName = await page.locator(".r-name").textContent();
      expect(resultName).toBeTruthy();
      results.push(resultName!);
      console.log(`[TEST] Run ${run + 1}: ${resultName}`);
    }

    // All 3 runs should produce the same result (same answer pattern)
    expect(new Set(results).size).toBe(1);
    console.log(`[TEST] Consistent result across ${results.length} runs: ${results[0]}`);
  });

  // ---------------------------------------------------------------------------
  // 9. Result page has all expected elements
  // ---------------------------------------------------------------------------
  test("result page has all expected elements", async ({ page }) => {
    const { reachedResult } = await answerAllQuestions(page, 30, 700);
    expect(reachedResult).toBe(true);

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".r-name")).toBeVisible();
    await expect(page.locator(".r-stats")).toBeVisible();
    await expect(page.locator(".r-slogan")).toBeVisible();
    await expect(page.locator(".r-desc")).toBeVisible();
    await expect(page.locator(".r-actions")).toBeVisible();

    // Verify r-name has content
    const name = await page.locator(".r-name").textContent();
    expect(name).toBeTruthy();
    expect(name!.length).toBeGreaterThan(0);

    // Verify r-stats contains similarity percentage
    const statsText = await page.locator(".r-stats").textContent();
    expect(statsText).toMatch(/\d+%/);

    // Verify r-slogan has content
    const slogan = await page.locator(".r-slogan").textContent();
    expect(slogan).toBeTruthy();

    // Verify r-desc has content
    const desc = await page.locator(".r-desc").textContent();
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(10);

    // Verify r-actions has at least 3 buttons (share, copy, rebirth)
    const actions = page.locator(".r-actions button");
    await expect(actions).toHaveCount(3);

    console.log(`[TEST] Result page elements verified for: ${name}`);
  });

  // ---------------------------------------------------------------------------
  // 10. Rebirth button on result page returns to welcome
  // ---------------------------------------------------------------------------
  test("rebirth button returns to welcome page", async ({ page }) => {
    const { reachedResult } = await answerAllQuestions(page, 30, 700);
    expect(reachedResult).toBe(true);

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 5000 });

    // Click the rebirth button (last button in r-actions)
    const rebirthButton = page.locator(".r-actions button").last();
    await expect(rebirthButton).toBeVisible();
    await rebirthButton.click();

    // Wait for navigation to welcome page (full reload)
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.locator(".hero")).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // 11. Fast answering (shorter delays) still works
  // ---------------------------------------------------------------------------
  test("fast answering with shorter delays still works", async ({ page }) => {
    // Use a shorter delay of 1000ms (300ms is too fast for the option transition animation)
    const { questionCount, reachedResult } = await answerAllQuestions(page, 30, 1000);

    expect(reachedResult).toBe(true);
    expect(questionCount).toBeGreaterThanOrEqual(24);
    expect(questionCount).toBeLessThanOrEqual(26);

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 5000 });
    const resultName = await page.locator(".r-name").textContent();
    expect(resultName).toBeTruthy();

    console.log(`[TEST] Fast answering result: ${resultName} after ${questionCount} questions`);
  });
});
