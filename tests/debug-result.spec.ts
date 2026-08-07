import { test, expect } from "@playwright/test";
import { answerAllQuestions } from "./helpers";

test("debug result page transition", async ({ page }) => {
  page.on("console", (msg) => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    console.log(`[PAGE ERROR] ${err.message}\n${err.stack}`);
  });

  // 直接访问测试页面
  await page.goto("/test", { waitUntil: "networkidle" });

  // 等待第一个问题
  await expect(page.locator(".q-text")).toBeVisible({ timeout: 10000 });
  console.log("[TEST] First question loaded");

  // 使用 helper 答题（自动处理批注插页和砝码题）
  const { questionCount, reachedResult } = await answerAllQuestions(page, 30, 900);
  console.log(`[TEST] Answered ${questionCount} questions, reachedResult: ${reachedResult}`);

  // 最终检查
  await page.waitForTimeout(5000);
  const resultLayout = page.locator(".result-layout");
  const isVisible = await resultLayout.isVisible({ timeout: 5000 }).catch(() => false);

  if (isVisible) {
    const name = await page.locator(".r-name").textContent();
    console.log(`[SUCCESS] Result: ${name}`);
  } else {
    console.log("[FAILED] Result page not visible");
    await page.screenshot({ path: "test-results/debug-final.png" });

    // 打印页面内容
    const html = await page.content();
    console.log(`[DEBUG] Page contains result-layout: ${html.includes("result-layout")}`);
    console.log(`[DEBUG] Page contains opt-block: ${html.includes("opt-block")}`);
  }

  expect(isVisible).toBe(true);
});
