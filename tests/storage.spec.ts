import { test, expect } from "@playwright/test";
import { attachConsoleListeners, answerAllQuestions } from "./helpers";

const STORAGE_KEY = "witch-trial-progress";

/**
 * Dismiss any pending interjection overlay and handle weight questions.
 * For fine-grained tests that answer questions one at a time.
 */
async function dismissInterjection(page: import("@playwright/test").Page) {
  while (await page.locator(".interjection-overlay").isVisible({ timeout: 100 }).catch(() => false)) {
    await page.locator(".interjection-overlay").click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/**
 * Click the first option, handling interjection overlays and weight questions.
 */
async function answerFirstOption(page: import("@playwright/test").Page, delay = 700) {
  // Dismiss interjection overlays first
  await dismissInterjection(page);

  // Weight question: click "落锤" button
  const hammer = page.locator("button", { hasText: "落锤" });
  if (await hammer.first().isVisible({ timeout: 100 }).catch(() => false)) {
    await hammer.first().click({ force: true });
    await page.waitForTimeout(delay);
    return;
  }

  // Normal/scale/gate/trigger: click first opt-block
  const optBlocks = page.locator(".opt-block");
  const count = await optBlocks.count();
  if (count > 0) {
    await optBlocks.first().click({ force: true });
    await page.waitForTimeout(delay);
  }

  // Dismiss any interjection that appeared after answering
  await dismissInterjection(page);
}

test.describe("localStorage Progress Persistence", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
    // Ensure a clean slate before each test
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test("refreshing mid-quiz resumes at the same question", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Read the first question text
    const qText = page.locator(".q-text");
    const firstQuestionText = await qText.textContent();

    // Answer one question (handles interjection + weight)
    await answerFirstOption(page, 1000);

    // After answering, the next question should be showing
    const secondQuestionText = await qText.textContent();
    expect(secondQuestionText).not.toBe(firstQuestionText);

    // Reload the page
    await page.reload({ waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // We should resume at the same question (the second one, since currentIndex was saved as 1)
    const resumedText = await qText.textContent();
    expect(resumedText).toBe(secondQuestionText);
  });

  test("progress is saved after answering each question", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // No progress before answering
    let saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).toBeNull();

    // Answer one question (handles interjection + weight)
    await answerFirstOption(page, 1000);

    // Progress should now be saved
    saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).not.toBeNull();
    const data = JSON.parse(saved!);
    expect(data.currentIndex).toBe(1);
    expect(data.answers).toHaveLength(1);
    expect(data.answers[0]).toHaveProperty("questionId");
    expect(data.answers[0]).toHaveProperty("optionId");
  });

  test("localStorage contains correct data structure", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Answer two questions (handles interjection + weight)
    await answerFirstOption(page, 1000);
    await answerFirstOption(page, 1000);

    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).not.toBeNull();

    const data = JSON.parse(saved!);
    // Schema check
    expect(typeof data.currentIndex).toBe("number");
    expect(data.currentIndex).toBeGreaterThan(0);
    expect(Array.isArray(data.answers)).toBe(true);
    expect(data.answers).toHaveLength(2);
    expect(data.answers[0]).toMatchObject({
      questionId: expect.any(Number),
      optionId: expect.any(Number),
    });
    // gateValue may be undefined or a string depending on gate question hit
    expect(typeof data.gateValue === "undefined" || typeof data.gateValue === "string").toBe(true);
  });

  test("EXIT button clears localStorage", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Answer a question to create progress (handles interjection + weight)
    await answerFirstOption(page, 1000);

    let saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).not.toBeNull();

    // Click the EXIT button (top-right of the quiz, text from t("test.exit"))
    await page.locator("button", { hasText: /EXIT|退出|離開|終了/ }).click();
    await page.waitForTimeout(500);

    // After exit, localStorage should be cleared
    saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).toBeNull();
  });

  test("completing the quiz removes progress from localStorage", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Complete the quiz using the helper
    const { reachedResult } = await answerAllQuestions(page, 30, 800);
    expect(reachedResult).toBe(true);

    // After completion, localStorage should be cleared
    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(saved).toBeNull();
  });

  test("starting fresh (no localStorage) begins at question 1", async ({ page }) => {
    // Explicitly clear any residual storage
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Should be at the first question (watermark shows "I")
    const watermark = page.locator(".watermark-index");
    await expect(watermark).toHaveText("I");

    // Should show question 1 / total
    const meta = page.locator(".q-meta span").first();
    const metaText = await meta.textContent();
    expect(metaText).toMatch(/01\s*\/\s*\d{2}/);
  });

  test("manually corrupting localStorage gracefully resets to question 1", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Inject corrupted data
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ currentIndex: 5, answers: "not-an-array" }));
    }, STORAGE_KEY);

    // Reload — the corrupted data should be rejected and reset to question 1
    await page.reload({ waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Should be at the first question
    const watermark = page.locator(".watermark-index");
    await expect(watermark).toHaveText("I");
  });

  test("localStorage persists across page reloads", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Answer two questions (handles interjection + weight)
    await answerFirstOption(page, 1000);
    await answerFirstOption(page, 1000);

    // Capture progress before reload
    const beforeReload = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(beforeReload).not.toBeNull();
    const beforeData = JSON.parse(beforeReload!);
    expect(beforeData.currentIndex).toBe(2);
    expect(beforeData.answers).toHaveLength(2);

    // Reload multiple times
    await page.reload({ waitUntil: "networkidle", timeout: 30000 });
    await page.reload({ waitUntil: "networkidle", timeout: 30000 });

    // Progress should still be intact
    const afterReload = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(afterReload).not.toBeNull();
    const afterData = JSON.parse(afterReload!);
    expect(afterData.currentIndex).toBe(2);
    expect(afterData.answers).toHaveLength(2);
    expect(afterData.answers).toEqual(beforeData.answers);
  });
});
