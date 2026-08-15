import { test } from "@playwright/test";

test("诊断 Q4 rich-text 渲染", async ({ page }) => {
  await page.goto("/test", { waitUntil: "networkidle" });
  await page.locator(".q-text").first().waitFor({ state: "visible", timeout: 10000 });
  for (let i = 0; i < 3; i++) {
    await page.locator(".opt-block").first().click();
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(500);

  const diag = await page.evaluate(() => {
    const el = document.querySelector(".q-text") as HTMLElement;
    if (!el) return { error: "no .q-text" };
    const cs = getComputedStyle(el);
    const spans = Array.from(el.querySelectorAll("span")).map((s) => {
      const sc = getComputedStyle(s);
      return {
        cls: s.className,
        text: s.textContent?.slice(0, 30),
        fontWeight: sc.fontWeight,
        color: sc.color,
        fontSize: sc.fontSize,
        letterSpacing: sc.letterSpacing,
      };
    });
    return {
      innerHTML: el.innerHTML.slice(0, 400),
      parent: { fontWeight: cs.fontWeight, color: cs.color, fontSize: cs.fontSize, fontFamily: cs.fontFamily.slice(0, 60) },
      spans,
      spanCount: spans.length,
    };
  });
  // eslint-disable-next-line no-console
  console.log("===Q4 DIAG===", JSON.stringify(diag, null, 2));
  await page.screenshot({ path: "tmp-rich-q4-v3.png" });
});
