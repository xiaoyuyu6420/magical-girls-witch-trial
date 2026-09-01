import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers";

test("annotations editable via admin, served to quiz", async ({ page }) => {
  const token = await adminLogin(page, process.env.ADMIN_PASSWORD || "test123");
  expect(token).toBeTruthy();

  // 整包保存：node5/H 一条自定义文案（M/L 留空 → 回退内置池）
  const put = await page.request.put("/api/admin/annotations", {
    headers: { "x-admin-token": token },
    data: [{ node: 5, tier: "H", text: "【E2E 自定义批注】你的回答快得可疑。", order: 0 }],
  });
  expect(put.ok()).toBeTruthy();

  // GET 确认入库
  const list = await (await page.request.get("/api/admin/annotations", { headers: { "x-admin-token": token } })).json();
  expect(list).toHaveLength(1);
  expect(list[0].text).toContain("E2E 自定义批注");

  // 公开 API：5 题同选项 → 单维集中 → H 档 → 返回自定义文案
  const quiz = await (await page.request.get("/api/quiz")).json();
  const q1 = quiz.questions[0];
  const answers = Array.from({ length: 5 }, () => ({ questionId: q1.id, optionId: q1.options[0].id }));
  const ann = await (await page.request.post("/api/annotation?node=5", { data: { answers } })).json();
  console.log("[ANNOTATION]", ann.text);
  expect(ann.text).toContain("E2E 自定义批注");
});

test("assets list + backup export", async ({ page }) => {
  const token = await adminLogin(page, process.env.ADMIN_PASSWORD || "test123");

  const assets = await (await page.request.get("/api/admin/assets", { headers: { "x-admin-token": token } })).json();
  expect(assets.length).toBeGreaterThanOrEqual(19);
  expect(assets[0].url).toContain("/api/asset/");

  // 公开素材路由回退内置图
  const img = await page.request.get("/api/asset/EMMA");
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toContain("image");

  // 全量备份导出：结构完整
  const res = await page.request.get("/api/admin/backup", { headers: { "x-admin-token": token } });
  expect(res.status()).toBe(200);
  const backup = await res.json();
  expect(backup.version).toBe(1);
  expect(backup.questions).toHaveLength(26);
  expect(backup.types.length).toBeGreaterThanOrEqual(24);
  expect(Array.isArray(backup.annotations)).toBeTruthy();
});

test("admin mobile viewport + codex removed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // 首页 Codex 文字已删
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hud-bottom div", { hasText: "CODEX" })).toHaveCount(0);

  // admin 手机版可登录、tab 横滑、批注 tab 渲染
  await page.goto("/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // 等 hydration：完成前点击 onClick 无效（React 事件委托未挂载）
  const pw = page.locator('input[type="password"]');
  await pw.fill(process.env.ADMIN_PASSWORD || "test123");
  await page.locator('button:has-text("登录")').click();
  await expect(page.locator('button:has-text("批注文案")')).toBeVisible({ timeout: 10000 });
  await page.locator('button:has-text("批注文案")').click();
  await expect(page.locator(".admin-card").first()).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: "test-results/admin-mobile-annotations.png", fullPage: true });
  await page.locator('button:has-text("素材库")').click();
  await expect(page.locator(".asset-grid").first()).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: "test-results/admin-mobile-assets.png", fullPage: true });
});
