import { test, expect } from "@playwright/test";
import { attachConsoleListeners } from "./helpers";

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleListeners(page);
  });

  test("pressing 1 selects the first option", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("1");

    const firstOption = page.locator(".opt-block").first();
    await expect(firstOption).toHaveClass(/is-selected/);

    // Wait for animation to complete so the next test can start fresh
    await page.waitForTimeout(800);
  });

  test("pressing 2 selects the second option", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    const options = page.locator(".opt-block");
    const count = await options.count();
    if (count < 2) {
      test.skip(true, "Question has fewer than 2 options");
      return;
    }

    await page.keyboard.press("2");
    await expect(options.nth(1)).toHaveClass(/is-selected/);

    await page.waitForTimeout(800);
  });

  test("pressing 3 selects the third option if available", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    const options = page.locator(".opt-block");
    const count = await options.count();
    if (count < 3) {
      test.skip(true, "Question has fewer than 3 options");
      return;
    }

    await page.keyboard.press("3");
    await expect(options.nth(2)).toHaveClass(/is-selected/);

    await page.waitForTimeout(800);
  });

  test("pressing 4 selects the fourth option if available", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    const options = page.locator(".opt-block");
    const count = await options.count();
    if (count < 4) {
      test.skip(true, "Question has fewer than 4 options");
      return;
    }

    await page.keyboard.press("4");
    await expect(options.nth(3)).toHaveClass(/is-selected/);

    await page.waitForTimeout(800);
  });

  test("completing the quiz using only keyboard keys works", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    let answered = 0;
    const maxQuestions = 30;

    while (answered < maxQuestions) {
      const resultLayout = page.locator(".result-layout");
      if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
        break;
      }

      const options = page.locator(".opt-block");
      const optCount = await options.count();
      if (optCount === 0) {
        await page.waitForTimeout(500);
        if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
          break;
        }
        break;
      }

      await page.keyboard.press("1");
      await page.waitForTimeout(1000);
      answered++;
    }

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });
    console.log(`[KEYBOARD QUIZ] Completed after ${answered} questions`);
  });

  test("pressing Escape closes the analysis modal on result page", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    let answered = 0;
    const maxQuestions = 30;

    while (answered < maxQuestions) {
      const resultLayout = page.locator(".result-layout");
      if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
        break;
      }

      const options = page.locator(".opt-block");
      const optCount = await options.count();
      if (optCount === 0) {
        await page.waitForTimeout(500);
        if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
          break;
        }
        break;
      }

      await page.keyboard.press("1");
      await page.waitForTimeout(1000);
      answered++;
    }

    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });

    // Click the analysis button in the result page (the only button in .r-right)
    await page.locator(".r-right button").first().click();
    await page.waitForTimeout(500);

    // The modal close button should be visible (Unicode multiplication sign)
    const closeButton = page.locator("button", { hasText: /×/ });
    await expect(closeButton).toBeVisible({ timeout: 5000 });

    // Press Escape to close the modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // The modal close button should be gone
    await expect(closeButton).not.toBeVisible({ timeout: 5000 });
  });

  test("invalid keys do not select options", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Press "a" — should not select anything
    await page.keyboard.press("a");
    await page.waitForTimeout(300);

    const selected = page.locator(".opt-block.is-selected");
    expect(await selected.count()).toBe(0);

    // Press "Enter" — should not select anything
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    expect(await selected.count()).toBe(0);

    // Press "5" — should not select anything (only 1–4 are mapped)
    await page.keyboard.press("5");
    await page.waitForTimeout(300);

    expect(await selected.count()).toBe(0);

    // Press "0" — should not select anything
    await page.keyboard.press("0");
    await page.waitForTimeout(300);

    expect(await selected.count()).toBe(0);
  });

  test("keyboard navigation works after animation", async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });

    // Read the watermark Roman numeral for the current question
    const watermark = page.locator(".watermark-index");
    const initialMark = await watermark.textContent();

    // Press "1" to answer the first question
    await page.keyboard.press("1");
    // Wait for the full animation cycle to finish
    await page.waitForTimeout(1000);

    // Verify we have moved to the next question
    const afterFirstMark = await watermark.textContent();
    expect(afterFirstMark).not.toBe(initialMark);

    // Press "1" again on the second question — keyboard should still work
    await page.keyboard.press("1");
    await page.waitForTimeout(1000);

    // Verify we have moved to the third question
    const afterSecondMark = await watermark.textContent();
    expect(afterSecondMark).not.toBe(afterFirstMark);
  });
});
