import { test, expect } from "@playwright/test";
import { answerAllQuestions } from "../helpers";

/**
 * Result 页档案卡视觉回归基线。
 *
 * 覆盖（契约 R4）：desktop 档案卡稳定态（1280x720，visual project）
 *
 * 稳定化（ADR D3）：
 *   - L3 容器级 reducedMotion:'reduce' —— ResultScreen.tsx:91-95 用 matchMedia 检测，
 *     命中后跳过揭晓序列直接 revealPhase="done"（ResultScreen.tsx:116-120），
 *     所有 transition 设 "none"，档案卡立即可见且无过渡。
 *   - 比 skipRevealAndWaitCard（mouse.click + 等 4.6s + overlay 0.8s 淡出竞态）快 6 倍且更稳。
 *
 * 截图范围（ADR D4）：`.result-layout` 元素截图（非视口全页）——
 *   档案卡是浅色背景（rgba(250,250,250,0.85)）居中卡片，视口全页会带大量空白噪声。
 *
 * 揭晓序列无粒子爆发（canvas-confetti 在 package.json 但 src 无 import）——
 * 揭晓是纯 DOM overlay 的文本 stagger，reducedMotion 直接跳过。
 */

// L3：reducedMotion 通过 contextOptions 开启（Playwright 1.62 写法），
// ResultScreen.tsx:91-95 的 matchMedia 命中后跳过揭晓直接 done。
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.describe("Result 视觉回归", () => {
  test("result 档案卡稳定态", async ({ page }, testInfo) => {
    // mobile 不覆盖结果页（R5：移动端只覆盖 welcome+test，结果页流程成本高暂缓）
    test.skip(testInfo.project.name === "visual-mobile", "结果页仅 desktop 覆盖");
    await page.goto("/test", { waitUntil: "networkidle" });
    await expect(page.locator(".q-text").first()).toBeVisible({ timeout: 10000 });

    // 走完整答题流程（默认点第一项，约 30s 含变奏题/批注消化）
    const { reachedResult } = await answerAllQuestions(page);
    expect(reachedResult).toBe(true);

    // reducedMotion 下 ResultScreen 直接 done，.result-layout aria-hidden 立即变 false。
    // 仍显式等，给 React 状态传播 + opacity 过渡（transition:none 时瞬时）余量。
    await expect(page.locator(".result-layout")).toHaveAttribute("aria-hidden", "false", {
      timeout: 10000,
    });
    // 等 ~300ms 让 React 状态传播 + DOM 重排完成（reducedMotion 下 transition:none 瞬时，
    // 但 React 批量更新需额外 tick，给余量避免截到中间态）。
    await page.waitForTimeout(300);

    // 放宽 #view-result 滚动容器（height:100vh + overflow-y:auto），让元素级截图
    // 能绘制视口外的 posture 柱图/按钮/声明（debugger 诊断：浏览器不绘制 overflow
    // 滚动容器视口外的内容，导致 bounding box 截图底部缺失。用户实际浏览器滚动可见全部）。
    await page.evaluate(() => {
      const v = document.querySelector("#view-result") as HTMLElement | null;
      if (v) {
        v.style.overflow = "visible";
        v.style.height = "auto";
        v.style.minHeight = "0";
        v.style.position = "relative";
      }
    });
    await page.waitForTimeout(100);

    // 元素级截图：档案卡（.result-layout）完整内容（塔罗分栏 + posture 柱图 + 按钮）。
    // maxDiffPixelRatio 放宽到 0.02（R11）：稀有度百分比（typePercentage）来自
    // /api/results 统计，每次 seed 后该数字微变（~2% 像素波动），属已知动态内容。
    // 真实布局回归（结构/字号变化）通常改 5%+ 像素，仍会被捕获。
    await expect(page.locator(".result-layout")).toHaveScreenshot("result-profile-card.png", {
      threshold: 0.2,
      maxDiffPixelRatio: 0.02,
    });
  });
});
