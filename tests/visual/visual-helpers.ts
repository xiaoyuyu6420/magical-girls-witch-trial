import { expect, type Locator, type Page } from "@playwright/test";

/**
 * 视觉回归（visual regression）专用 helper。
 *
 * 设计哲学（ADR D5）：只 mask 不可复现的随机像素源，保留所有可复现的视觉信号。
 * 稳定化分层协议——每个基线必选其一：
 *   L1 = mask 永续随机源（canvas 粒子、cursor、live-time、blink、异步计数）
 *   L2 = 等确定性终态标志（scramble innerText 回稳、opt-block computedStyle）
 *   L3 = 容器级 reducedMotion 短路（ResultScreen 命中后跳过揭晓直接 done）
 *
 * 这里的函数只服务于 tests/visual/ 下的 .visual.spec.ts，不改现有 tests/helpers.ts。
 */

/**
 * 等待首页所有 [data-scramble] 元素的文本回到 data-scramble 目标值。
 *
 * 首页（public/index.html）的 TextScramble 动画期间 innerHTML 含乱码 span，
 * 且没有终态 class/属性——唯一可靠的完成判定是文本 === dataset.scramble。
 * 语言切换会再次触发 scramble（switchLang 内 new TextScramble），所以多语言
 * 基线切语言后必须重新等 settle。
 *
 * 用 textContent 而非 innerText：innerText 受 CSS text-transform 影响
 *（.hero__cta 有 uppercase，en 的 "Enter the Trial" 渲染为 "ENTER THE TRIAL"，
 * 与 data-scramble 原始大小写不匹配）。textContent 返回原始 DOM 文本，无样式干扰。
 *
 * @param page 目标页（应已 goto("/") 且 loader 滑走）
 * @param timeout 轮询超时，默认 15s（覆盖语言切换后的 scramble 重跑）
 */
export async function waitForScrambleSettled(page: Page, timeout = 15000): Promise<void> {
  await expect.poll(
    async () => {
      const els = page.locator("[data-scramble]");
      const count = await els.count();
      if (count === 0) return false;
      const results = await els.evaluateAll((nodes) =>
        nodes.map((el) => {
          const target = el.getAttribute("data-scramble") ?? "";
          const text = (el.textContent ?? "").trim();
          return text === target.trim();
        }),
      );
      return results.every(Boolean);
    },
    { timeout, message: "scramble 文本未在超时内回到 data-scramble 终态" },
  ).toBe(true);
}

/**
 * 返回首页必须 mask 的动态元素 Locator 数组（L1 稳定化）。
 *
 * 判定标准（ADR D5）：该像素源在两次运行间是否不可复现。
 *   - #cursor-dot / #cursor-ring：鼠标跟随，headless 下位置不定（移动端被 @media pointer:coarse 隐藏，返回不存在的 locator 无害）
 *   - #live-time：每帧刷新的时间戳
 *   - .status-blink：无限 blink 动画
 *   - .hero__stats：由 /api/count 异步填充，null→数字跨环境不可复现
 *   - .giant-text.kanji：switchLang 对它 new TextScramble 但不设 data-scramble 属性
 *     （index.html:968-972 漏 setAttribute），waitForScrambleSettled 无法覆盖；
 *     opacity:0.06 视觉权重极低，mask 损失可忽略（红方 F5 处置）
 *
 * ⚠️ #abyss-canvas **不在 mask 列表**——它是 `width:100%;height:100%` 全屏背景层，
 * Playwright mask 作用于元素的几何 bounding box（覆盖所有 z-index），mask 全屏 canvas
 * 等于 mask 整个视口，会把 hero 等所有内容染成品红（审计 CRITICAL 处置）。
 * canvas 的随机粒子动画改用 hideCanvasForScreenshot（截图前 display:none 隐藏）处理。
 *
 * 不 mask：.hero__title/.hero__overline/.hero__tagline/.hero__cta——
 * 它们是 scramble 完成后的确定终态文本，是基线要保护的核心视觉信号。
 */
export function maskWelcomeDynamic(page: Page): Locator[] {
  return [
    page.locator("#cursor-dot"),
    page.locator("#cursor-ring"),
    page.locator("#live-time"),
    page.locator(".status-blink"),
    page.locator(".giant-text.kanji"),
  ];
}

/**
 * 截图前隐藏首页全屏 canvas 背景（#abyss-canvas）。
 *
 * canvas 是 absolute 定位、z-index:1、opacity:0.6 的背景粒子层（非布局元素），
 * 隐藏它不影响任何元素的位置/尺寸——hero（z-index:20）等仍正常可见。
 * 这比 mask 更安全：mask 全屏 canvas 会覆盖整个视口（Playwright mask 作用于 bounding box）。
 */
async function hideCanvasForScreenshot(page: Page): Promise<void> {
  await page.locator("#abyss-canvas").evaluate((el) => {
    (el as HTMLElement).style.visibility = "hidden";
  });
  // .hero__stats 同走隐藏而非 mask：mask 涂色按 bbox，计数数字实时变化时
  // 边缘会露出 ~30px 差异超阈值（2026-08-31 welcome 三语言全挂的根因）。
  await page.locator(".hero__stats").evaluateAll((els) => {
    els.forEach((el) => ((el as HTMLElement).style.visibility = "hidden"));
  });
}

/**
 * 等 loader 滑走后预置首页稳定条件：等 scramble settle + 隐藏 canvas。
 *
 * 多语言处理：goto 后显式点击 lang-btn 切换语言（绕开 DOMContentLoaded +1500ms
 * 的自动切换时序竞态——boot 序列初始 scramble 与自动 switchLang 竞态会导致
 * scramble 在自动切换瞬间从中文乱码切到目标语言，settle 判定不稳）。
 * 显式点击确保：先完成 zh-CN 初始 scramble settle → 再切目标语言 → 再等新 scramble settle。
 *
 * @param page 目标页
 * @param locale 目标语言；zh-CN 走默认路径，en/ja 先加载默认页再切换
 */
export async function prepareWelcomeForScreenshot(page: Page, locale: "zh-CN" | "en" | "ja" = "zh-CN"): Promise<void> {
  await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
  // 等 loader 滑走（复用现有判定逻辑：transform translateY(-100%)）
  await expect.poll(
    async () => {
      const transform = await page.locator("#loader").evaluate((el) => getComputedStyle(el).transform);
      return (
        transform.includes("translateY(-100%)") ||
        transform.includes("translateY(-") ||
        transform.includes("matrix(1, 0, 0, 1, 0, -")
      );
    },
    { timeout: 25000, message: "loader did not slide away" },
  ).toBe(true);
  await expect(page.locator(".hero")).toBeVisible({ timeout: 5000 });
  // 等初始 zh-CN scramble settle（boot 序列 loader 滑走后逐个 scramble）
  await waitForScrambleSettled(page);

  // 非 zh-CN：显式点击 lang-btn 切换，再等新 scramble settle。
  // lang-btn data-lang: zh/tw/en/jp（注意 jp 不是 ja）
  if (locale !== "zh-CN") {
    const langCode = locale === "ja" ? "jp" : locale;
    await page.locator(`.lang-btn[data-lang="${langCode}"]`).click();
    // switchLang 对每个 [data-scramble] new TextScramble().setText()，等全部回稳
    await waitForScrambleSettled(page);
  }

  // 截图前隐藏全屏 canvas 粒子背景（审计 CRITICAL 修复——不能用 mask，bounding box 全屏）
  await hideCanvasForScreenshot(page);
}
