import { test, expect } from "@playwright/test";
import { answerAllQuestions } from "./helpers";

test.describe("Quiz Flow Test", () => {
  test("complete all questions and reach result page", async ({ page }) => {
    // 监听控制台
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      console.log(`[PAGE ERROR] ${err.message}`);
    });

    console.log("[TEST] Navigating to /test directly...");
    await page.goto("/test", {
      waitUntil: "networkidle",
      timeout: 30000
    });

    // 等待问题加载
    const questionText = page.locator(".q-text");
    await expect(questionText).toBeVisible({ timeout: 10000 });
    console.log("[TEST] First question loaded");

    // 使用 helper 答题（自动处理批注插页和砝码题）
    const { questionCount, reachedResult } = await answerAllQuestions(page, 30, 900);
    console.log(`[TEST] Answered ${questionCount} questions, reachedResult: ${reachedResult}`);

    // 最终检查
    // 等待揭晓序列完成
    await page.waitForTimeout(5000);
    const resultLayout = page.locator(".result-layout");
    const isResultVisible = await resultLayout.isVisible({ timeout: 5000 }).catch(() => false);

    if (isResultVisible) {
      console.log(`[TEST] SUCCESS: Result page visible after ${questionCount} questions`);

      // 获取结果名称
      const resultName = await page.locator(".r-name").textContent();
      console.log(`[TEST] Result: ${resultName}`);

      await page.screenshot({ path: "test-results/quiz-result-success.png" });
    } else {
      console.log(`[TEST] FAILED: Did not reach result page after ${questionCount} questions`);
      await page.screenshot({ path: "test-results/quiz-result-failed.png" });
    }

    expect(isResultVisible).toBe(true);
  });
});
