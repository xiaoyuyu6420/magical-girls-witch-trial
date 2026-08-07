import { test, expect } from "@playwright/test";
import { answerAllQuestions } from "./helpers";

test("clear storage and test fresh", async ({ page }) => {
  page.on("console", (msg) => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // 先访问页面
  await page.goto("/test", { waitUntil: "networkidle" });

  // 清除 localStorage
  await page.evaluate(() => {
    localStorage.removeItem("witch-trial-progress");
    console.log("Cleared witch-trial-progress from localStorage");
  });

  // 刷新页面
  await page.reload({ waitUntil: "networkidle" });

  // 等待第一个问题
  await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
  console.log("[TEST] First question loaded after clearing storage");

  // 使用 helper 答题（自动处理批注插页和砝码题）
  const { questionCount, reachedResult } = await answerAllQuestions(page, 30, 900);
  console.log(`[TEST] Answered ${questionCount} questions, reachedResult: ${reachedResult}`);

  if (reachedResult) {
    // 等待揭晓序列完成
    await page.waitForTimeout(5000);
    const name = await page.locator(".r-name").textContent();
    console.log(`[RESULT] ${name}`);
    expect(name).toBeTruthy();
  }

  expect(reachedResult).toBe(true);
});
