import { test, expect } from "@playwright/test";
import { answerAllQuestions } from "./helpers";

// 回看场景验证（2026-08-31 用户反馈）：
// 1. 桌面后退到已答题，其他选项不得被 is-dimmed 折叠（原 bug：答案占满区域无法改选）
// 2. 回看时上次选择以 is-recap 轻量标记呈现
// 3. 前进键在后退后显现、可点击回到下一题
test("desktop recap + forward", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/test", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".opt-block").first()).toBeVisible({ timeout: 15000 });

  // 答前 3 题
  for (let i = 0; i < 3; i++) {
    await page.locator(".opt-block").first().click({ force: true });
    await page.waitForTimeout(1100);
  }
  await expect(page.locator("#btn-back.visible")).toBeVisible();
  const q4meta = await page.locator(".q-meta").innerText();

  // 后退到第 3 题（已答）
  await page.locator("#btn-back.visible").click();
  await page.waitForTimeout(800);

  // ① 其他选项不得折叠：is-dimmed 不允许存在
  await expect(page.locator(".opt-block.is-dimmed")).toHaveCount(0);
  // ② 上次选择以 recap 标记呈现
  await expect(page.locator(".opt-block.is-recap")).toHaveCount(1);
  // ③ recap 选项可点击区域正常（宽度不为 0）
  const recapBox = await page.locator(".opt-block.is-recap").boundingBox();
  expect(recapBox?.width ?? 0).toBeGreaterThan(200);
  // ④ 前进键显现
  await expect(page.locator("#btn-forward.visible")).toBeVisible();

  // 截图存档
  await page.screenshot({ path: "test-results/recap-desktop.png" });

  // ⑤ 点前进回到第 4 题（未答状态、无折叠）
  await page.locator("#btn-forward.visible").click();
  await page.waitForTimeout(800);
  await expect(page.locator(".opt-block.is-dimmed")).toHaveCount(0);
  await expect(page.locator(".opt-block.is-recap")).toHaveCount(0);
  await expect(page.locator(".q-meta")).toContainText(q4meta.slice(0, 4));
});

// 手机端：HUD 往里收 + 前进键
test("mobile hud spacing + forward", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/test", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".opt-block").first()).toBeVisible({ timeout: 15000 });

  // 答两题
  for (let i = 0; i < 2; i++) {
    await page.locator(".opt-block").first().click({ force: true });
    await page.waitForTimeout(1000);
  }
  await page.locator("#btn-back.visible").click();
  await page.waitForTimeout(800);
  await expect(page.locator("#btn-forward.visible")).toBeVisible();

  // HUD 胶囊不得贴视口边缘（左 padding 1.6rem ≈ 26px）
  const capsuleBox = await page.locator(".test-header .hud-capsule").first().boundingBox();
  expect(capsuleBox?.x ?? 0).toBeGreaterThanOrEqual(22);

  await page.screenshot({ path: "test-results/recap-mobile.png" });
});
