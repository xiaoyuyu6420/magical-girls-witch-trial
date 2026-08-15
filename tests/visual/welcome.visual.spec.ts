import { test, expect } from "@playwright/test";
import { maskWelcomeDynamic, prepareWelcomeForScreenshot } from "./visual-helpers";

/**
 * Welcome 页（首页 `/.png`）视觉回归基线。
 *
 * 覆盖（契约 R4/R5/R6 + A3 多语言）：
 *   - desktop zh-CN（默认 locale）
 *   - desktop en（验证英文布局不溢出）
 *   - desktop ja（验证日文布局不溢出）
 *   - mobile zh-CN（375x667，由 visual-mobile project 驱动）
 *
 * 稳定化（ADR）：
 *   - L1 mask：canvas/cursor/live-time/blink/stats（见 maskWelcomeDynamic）
 *   - L2 等终态：waitForScrambleSettled（textContent === data-scramble）
 *   - 截图范围：视口级全页（fullPage 默认 false）
 *
 * 首页是静态 HTML（public/index.html，next.config rewrite），非 React——
 * 其 DOM/动画与 globals.css 是两套体系，详见 tests/visual/README.md。
 *
 * mobile 只覆盖 zh-CN（A2 核心三屏起步）；en/ja 的多语言验证仅 desktop。
 */

test.describe("Welcome 视觉回归", () => {
  test("welcome zh-CN", async ({ page }, testInfo) => {
    await prepareWelcomeForScreenshot(page, "zh-CN");
    const tag = testInfo.project.name === "visual-mobile" ? "mobile" : "desktop";
    await expect(page).toHaveScreenshot(`welcome-${tag}-zh.png`, {
      mask: maskWelcomeDynamic(page),
      threshold: 0.2,
    });
  });

  test("welcome en（英文布局）", async ({ page }, testInfo) => {
    // mobile 只覆盖 zh-CN（A2），en/ja 仅 desktop
    test.skip(testInfo.project.name === "visual-mobile", "多语言仅 desktop 覆盖");
    await prepareWelcomeForScreenshot(page, "en");
    await expect(page).toHaveScreenshot("welcome-desktop-en.png", {
      mask: maskWelcomeDynamic(page),
      threshold: 0.2,
    });
  });

  test("welcome ja（日文布局）", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "visual-mobile", "多语言仅 desktop 覆盖");
    await prepareWelcomeForScreenshot(page, "ja");
    await expect(page).toHaveScreenshot("welcome-desktop-ja.png", {
      mask: maskWelcomeDynamic(page),
      threshold: 0.2,
    });
  });
});
