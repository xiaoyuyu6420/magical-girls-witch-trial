import { expect, type Page } from "@playwright/test";

/**
 * Common console/page-error listeners for all tests.
 * Logs any browser console errors or page-level JS errors to the terminal.
 */
export function attachConsoleListeners(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    console.log(`[PAGE ERROR] ${err.message}\n${err.stack}`);
  });
}

/**
 * Answer all quiz questions by clicking the first option each time.
 * Returns the number of questions answered and whether the result page was reached.
 */
export async function answerAllQuestions(
  page: Page,
  maxQuestions = 30,
  clickDelay = 900,
) {
  let questionCount = 0;
  let reachedResult = false;

  while (questionCount < maxQuestions) {
    const resultLayout = page.locator(".result-layout");
    if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
      reachedResult = true;
      break;
    }

    const optBlocks = page.locator(".opt-block");
    const count = await optBlocks.count();

    if (count === 0) {
      await page.waitForTimeout(500);
      if (await resultLayout.isVisible({ timeout: 100 }).catch(() => false)) {
        reachedResult = true;
        break;
      }
      break;
    }

    await optBlocks.first().waitFor({ state: "visible", timeout: 5000 });
    await optBlocks.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(clickDelay);
    questionCount++;
  }

  return { questionCount, reachedResult };
}

/**
 * Admin login helper — sends password to /api/admin/login and stores the JWT
 * token in sessionStorage for the rest of the test.  If the page hasn't
 * navigated yet, just returns the token (caller can pass it as a header).
 */
export async function adminLogin(page: Page, password: string) {
  const res = await page.request.post("/api/admin/login", {
    headers: { "x-admin-password": password },
  });
  if (!res.ok()) throw new Error(`Admin login failed: ${res.status()}`);
  const data = await res.json() as { token: string };
  if (!data.token) throw new Error("Admin login response missing token");
  // Only store in sessionStorage if the page has navigated to a real origin
  if (page.url() !== "about:blank") {
    await page.evaluate((token) => {
      sessionStorage.setItem("admin-token", token);
    }, data.token);
  }
  return data.token;
}

/**
 * Admin API helper — returns a fetch-like function that sends the stored JWT
 * token in the x-admin-token header.
 */
export function adminApi(page: Page) {
  return async (path: string, opts?: { headers?: Record<string, string> } & Omit<RequestInit, "headers">) => {
    const token = await page.evaluate(() => sessionStorage.getItem("admin-token") || "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...opts?.headers,
    };
    return page.request.fetch(`http://127.0.0.1:3010/api/admin${path}`, {
      ...opts,
      headers,
    });
  };
}

/**
 * Wait for the welcome-page loader to finish and the hero section to become
 * visible.  Call this after page.goto("/").
 */
export async function waitForWelcomeLoaded(page: Page, timeout = 25000) {
  const loader = page.locator("#loader");
  await page.waitForTimeout(1000); // give loader a chance to start
  await expect.poll(
    async () => {
      const transform = await loader.evaluate((el) => getComputedStyle(el).transform);
      return transform.includes("translateY(-100%)")
        || transform.includes("translateY(-")
        || transform.includes("matrix(1, 0, 0, 1, 0, -");
    },
    { timeout, message: "loader did not slide away" },
  ).toBe(true);
  await expect(page.locator(".hero")).toBeVisible({ timeout: 5000 });
}
