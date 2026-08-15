import { test, expect } from "@playwright/test";

/**
 * Test 页（`/test.png`）视觉回归基线。
 *
 * 覆盖（契约 R4/R5）：
 *   - desktop 普通题（1280x720，visual project）
 *   - mobile 普通题（375x667，visual-mobile project）
 *
 * 稳定化（ADR）：
 *   - L2 等终态：等 `.opt-block.png` computedStyle opacity === "1"（staggerIn forwards 终态）
 *     mobile（≤768px）动画被 globals.css:591-602 禁用，opacity 直接为 1，轮询立即通过
 *   - 截图范围：视口级全页（含 #progress-line + .q-text + .options-stage 布局关系）
 *
 * 只截首题——切题动画（.stage-fade-out 700ms）会让后续题帧不一致。
 */

test.describe("Test 视觉回归", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test", { waitUntil: "networkidle" });
    // 等首题渲染
    await expect(page.locator(".q-text").first()).toBeVisible({ timeout: 10000 });

    // L1：彻底移除 #bg-canvas（IM2 Canvas 紫粒子，JS rAF 永续随机像素源——
    // Playwright 稳定检测禁不掉 JS 动画）。rework（crucible 60-audit）：原 visibility:hidden
    // 仍占布局且 rAF 继续离屏渲染，导致 ~1% 像素漂移（test-question-mobile flaky）。
    // display:none 彻底移出布局 + 不渲染，消除漂移，截图确定性。
    // film-grain 是静态 SVG 噪点可复现，保留。
    // 2026-08-14 桌面回滚：桌面 BackgroundLayers 直接不渲染（无 #bg-canvas），仅移动端存在。
    const canvas = page.locator("#bg-canvas");
    if ((await canvas.count()) > 0) {
      await canvas.evaluate((el) => {
        (el as HTMLElement).style.display = "none";
      });
    }
  });

  test("test 普通题", async ({ page }, testInfo) => {
    // L2：等所有 .opt-block 的 staggerIn 终态（opacity:1）。
    // TestScreen.tsx:392 每个选项 animationDelay: idx*0.1s，3 选项时 opt[2] 比 opt[0] 晚 0.2s 完成。
    // 必须全量检查，否则 opt[0] 到终态时 opt[2] 仍在动画中，截图 flaky。
    await expect.poll(
      async () => {
        const opacities = await page.locator(".opt-block").evaluateAll((els) =>
          els.map((el) => window.getComputedStyle(el).opacity),
        );
        if (opacities.length === 0) return false;
        return opacities.every((o) => o === "1");
      },
      { timeout: 5000, message: ".opt-block staggerIn 未全部到终态 opacity:1" },
    ).toBe(true);

    // L3：等 floatIn 进场动画完成（.card.enter backwards fill；toHaveScreenshot 会禁用
    // CSS animations，若 floatIn 未完成会 paused 在中间帧，transform/opacity 残留致像素
    // 差异。L2 的 .opt-block opacity 不反映父级 .question-stage 的 floatIn 进度，须单独等。
    // getAnimations() 全 finished 或空（reduced-motion / 移动端无动画）即完成）
    await expect.poll(
      async () =>
        page.locator(".question-stage.card").evaluate((el) => {
          const anims = (el as HTMLElement).getAnimations();
          return anims.length === 0 || anims.every((a) => a.playState === "finished");
        }),
      { timeout: 5000, message: "floatIn 进场动画未完成" },
    ).toBe(true);

    await expect(page).toHaveScreenshot(`test-question-${testInfo.project.name === "visual-mobile" ? "mobile" : "desktop"}.png`, {
      threshold: 0.2,
    });
  });
});
