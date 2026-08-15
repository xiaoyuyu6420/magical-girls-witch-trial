import { test, expect, Page } from "@playwright/test";
import { answerAllQuestions, attachConsoleListeners } from "./helpers";

/**
 * 阶段3a 揭晓时刻 + 阶段1 变奏题专项 e2e。
 * 覆盖：揭晓序列播放/跳过、稀有度展示（无 similarity）、批注插页、砝码题。
 * 所有用例导航到 /test（与 quiz.spec 同），用 helper.answerAllQuestions 走完整流程。
 */

test.beforeEach(async ({ page }) => {
  await attachConsoleListeners(page);
  await page.goto("/test", { waitUntil: "networkidle" });
  await expect(page.locator(".q-text").first()).toBeVisible({ timeout: 10000 });
});

/** 跳过揭晓序列（如还在播放），等待档案卡稳定可见 */
async function skipRevealAndWaitCard(page: Page) {
  // 揭晓序列最长 4.6s；点中心跳过，再等档案卡
  await page.waitForTimeout(400);
  await page.mouse.click(640, 360).catch(() => {});
  await expect(page.locator(".result-layout")).toBeVisible({ timeout: 10000 });
}

test.describe("揭晓时刻 + 变奏题", () => {
  test("揭晓后档案卡可见且无 similarity%", async ({ page }) => {
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);
    await skipRevealAndWaitCard(page);

    // 角色名可见
    await expect(page.locator(".r-name").first()).toBeVisible();
    // 稀有度相关文案（全球/极少判定/收集中），无 similarity%
    const body = await page.locator("body").textContent() ?? "";
    expect(body).toMatch(/与你相同者|全球|极少判定/);
    expect(body).not.toMatch(/相似度\s*\d/);
    expect(body).not.toMatch(/RESONANCE/);
  });

  test("揭晓序列可被点击跳过，档案卡立即可见", async ({ page }) => {
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);
    // 揭晓刚启动时点中心跳过
    await page.waitForTimeout(500);
    await page.mouse.click(640, 360);
    await expect(page.locator(".result-layout")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".r-name").first()).toBeVisible();
  });

  test("分享按钮与重新审判按钮存在", async ({ page }) => {
    await answerAllQuestions(page);
    await skipRevealAndWaitCard(page);
    const actions = page.locator(".r-actions .btn-restart");
    await expect(actions.first()).toBeVisible({ timeout: 3000 });
    const count = await actions.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("作品介绍可见（pack.workIntro）", async ({ page }) => {
    await answerAllQuestions(page);
    await skipRevealAndWaitCard(page);
    const body = await page.locator("body").textContent() ?? "";
    expect(body).toMatch(/反复重启世界|死亡回溯/);
  });

  test("批注插页在第5题后出现并可关闭", async ({ page }) => {
    // 答完 5 题（用 helper 的内部逻辑会自动消化批注，这里手动验证批注出现）
    for (let i = 0; i < 5; i++) {
      // 先消化可能已出现的批注（前5题不应有，保险）
      while (await page.locator(".interjection-overlay").isVisible({ timeout: 100 }).catch(() => false)) {
        await page.locator(".interjection-overlay").click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
      }
      const opt = page.locator(".opt-block").first();
      await opt.waitFor({ state: "visible", timeout: 5000 });
      await opt.click({ force: true });
      await page.waitForTimeout(900);
    }
    // 第5题后批注插页应出现
    const inj = page.locator(".interjection-overlay");
    await expect(inj).toBeVisible({ timeout: 3000 });
    // 点击关闭
    await inj.click({ force: true });
    await expect(inj).not.toBeVisible({ timeout: 2000 });
    // 关闭后能继续答第6题
    await expect(page.locator(".opt-block").first()).toBeVisible({ timeout: 5000 });
  });

  test("砝码题（第14题）落锤确认可继续", async ({ page }) => {
    // 答到第14题（前13题含第5/10批注、第8天平）
    let answered = 0;
    while (answered < 13) {
      const inj = page.locator(".interjection-overlay");
      if (await inj.isVisible({ timeout: 100 }).catch(() => false)) {
        await inj.click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
      const weightStage = page.locator(".weight-stage");
      if (await weightStage.isVisible({ timeout: 150 }).catch(() => false)) {
        const wcards = page.locator(".weight-card");
        await wcards.nth(0).click({ force: true });
        await wcards.nth(0).click({ force: true });
        await wcards.nth(1).click({ force: true });
        await page.waitForTimeout(200);
        await page.locator(".btn-confirm-weight").click({ force: true });
        await page.waitForTimeout(900);
        answered++;
        continue;
      }
      const opt = page.locator(".opt-block, .balance-pan").first();
      await opt.waitFor({ state: "visible", timeout: 5000 });
      await opt.click({ force: true });
      await page.waitForTimeout(900);
      answered++;
    }
    // 第14题应是砝码题：检测点阵分配区
    const weightStage = page.locator(".weight-stage");
    await expect(weightStage).toBeVisible({ timeout: 5000 });
    // 分配 2|1|0 后落锤能继续
    const wcards = page.locator(".weight-card");
    await wcards.nth(0).click({ force: true });
    await wcards.nth(0).click({ force: true });
    await wcards.nth(1).click({ force: true });
    await page.waitForTimeout(200);
    await page.locator(".btn-confirm-weight").click({ force: true });
    await page.waitForTimeout(900);
    // 第15题后会有批注，消化掉确认能继续
    while (await page.locator(".interjection-overlay").isVisible({ timeout: 100 }).catch(() => false)) {
      await page.locator(".interjection-overlay").click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    await expect(page.locator(".opt-block").first()).toBeVisible({ timeout: 5000 });
  });
});
