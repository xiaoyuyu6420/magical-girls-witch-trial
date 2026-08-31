import { test, expect, type Page } from "@playwright/test";
import { waitForWelcomeLoaded } from "./helpers";

// 手机走查专用：390x844（iPhone 12/13/14 视觉尺寸）。截图逐屏检查 UI。
const OUT = "test-results/mobile";

async function shot(page: Page, name: string, full = false) {
  try {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    console.log(`[SHOT] ${name}${full ? " (full)" : ""}`);
  } catch (e) {
    console.log(`[SHOT FAIL] ${name}: ${(e as Error).message}`);
  }
}

async function pageAlive(page: Page): Promise<boolean> {
  try {
    await page.evaluate(() => 1);
    return true;
  } catch {
    return false;
  }
}

test("mobile UI walkthrough", async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 390, height: 844 });

  // 1) 欢迎页
  await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
  await waitForWelcomeLoaded(page);
  await page.waitForTimeout(2000);
  await shot(page, "01-welcome");

  // 2) 测试页直接进（/test 即 quiz 主体）
  await page.goto("/test", { waitUntil: "domcontentloaded", timeout: 30000 });
  await expect(page.locator(".opt-block, .balance-pan, .weight-card").first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1200);
  await shot(page, "02-test-normal-q1");

  // 逐题答；在关键题/特殊屏截图
  let idx = 1;
  const seen = new Set<string>();
  while (idx < 30) {
    if (!(await pageAlive(page))) {
      console.log("[ABORT] page/browser closed at idx", idx);
      break;
    }

    // 先消化批注插页
    try {
      const overlay = page.locator(".interjection-overlay");
      if ((await overlay.count()) > 0 && !seen.has("interjection")) {
        await page.waitForTimeout(700);
        await shot(page, "05-interjection");
        seen.add("interjection");
        await overlay.click({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
    } catch { /* page may be dead */ }

    // 结果页
    try {
      if (await page.locator(".result-layout").isVisible({ timeout: 80 }).catch(() => false)) {
        await page.waitForTimeout(1500);
        await shot(page, "10-result");
        await shot(page, "10-result-full", true);
        break;
      }
    } catch { /* page may be dead */ }

    // 砝码题
    try {
      if (await page.locator(".weight-stage").isVisible({ timeout: 80 }).catch(() => false)) {
        if (!seen.has("weight")) { await page.waitForTimeout(600); await shot(page, "07-weight"); seen.add("weight"); }
        const cards = page.locator(".weight-card");
        await cards.nth(0).click({ force: true, timeout: 3000 }); await page.waitForTimeout(150);
        await cards.nth(0).click({ force: true, timeout: 3000 }); await page.waitForTimeout(150);
        await cards.nth(1).click({ force: true, timeout: 3000 }); await page.waitForTimeout(200);
        await page.locator(".btn-confirm-weight").click({ force: true, timeout: 5000 });
        await page.waitForTimeout(900);
        idx++;
        continue;
      }
    } catch { /* page may be dead */ }

    // 天平题
    try {
      if ((await page.locator(".balance-pan").count()) > 0) {
        if (!seen.has("scale")) { await page.waitForTimeout(600); await shot(page, "06-scale"); seen.add("scale"); }
      }
    } catch { /* page may be dead */ }

    // gate / trigger — 用 evaluate 代替 locator.count 避免 page closed 崩溃
    let isGate = false;
    let isTrigger = false;
    try {
      const badgeText = await page.evaluate(() => {
        const g = document.querySelector(".gate-badge");
        const t = document.querySelector(".trigger-badge");
        return { gate: !!g, trigger: !!t };
      });
      isGate = badgeText.gate;
      isTrigger = badgeText.trigger;
    } catch { /* page may be dead */ }

    if (isGate && !seen.has("gate")) { await page.waitForTimeout(600); await shot(page, "08-gate"); seen.add("gate"); }
    if (isTrigger && !seen.has("trigger")) { await shot(page, "09-trigger"); seen.add("trigger"); }

    // 点选项
    try {
      const opts = page.locator(".opt-block, .balance-pan");
      const n = await opts.count();
      if (n === 0) {
        await page.waitForTimeout(600);
        if (await page.locator(".result-layout").isVisible({ timeout: 200 }).catch(() => false)) {
          await shot(page, "10-result"); await shot(page, "10-result-full", true); break;
        }
        continue;
      }
      await opts.first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(900);
      idx++;
    } catch (e) {
      console.log("[CLICK FAIL] idx", idx, (e as Error).message);
      break;
    }
  }
});
