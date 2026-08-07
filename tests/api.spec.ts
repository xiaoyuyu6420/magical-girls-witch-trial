import { test, expect } from "@playwright/test";
import { adminLogin, attachConsoleListeners } from "./helpers";

test.describe("API Tests", () => {
  // Use a fixed fake IP to isolate our API tests from other test files
  // that may share the same server and rate-limit buckets.
  const TEST_IP = "api-test.1.2.3.4";
  let quizData: { questions: Array<{ id: number; options: Array<{ id: number }> }> };
  let validAnswers: { questionId: number; optionId: number }[];

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/quiz", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.ok()).toBe(true);
    quizData = await res.json();
    validAnswers = quizData.questions.map((q) => ({
      questionId: q.id,
      optionId: q.options[0].id,
    }));
  });

  test("/api/quiz returns valid data with correct structure", async ({ page }) => {
    const res = await page.request.get("/api/quiz", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty("dimensions");
    // weights 是防篡改刻意不下发的（quiz API route 注释明确），检查实际下发的 pack 元信息
    expect(data).toHaveProperty("packId");
    expect(data).toHaveProperty("types");
    expect(data).toHaveProperty("questions");

    // Verify questions structure
    expect(Array.isArray(data.questions)).toBe(true);
    if (data.questions.length > 0) {
      const q = data.questions[0];
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("dim");
      expect(q).toHaveProperty("text");
      expect(q).toHaveProperty("order");
      expect(q).toHaveProperty("type");
      expect(q).toHaveProperty("meta");
      expect(q).toHaveProperty("translations");
      expect(q).toHaveProperty("options");

      expect(Array.isArray(q.options)).toBe(true);
      if (q.options.length > 0) {
        const opt = q.options[0];
        expect(opt).toHaveProperty("id");
        expect(opt).toHaveProperty("label");
      }
    }

    // Verify types structure
    expect(Array.isArray(data.types)).toBe(true);
    if (data.types.length > 0) {
      const t = data.types[0];
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("code");
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("group");
      expect(t).toHaveProperty("vector");
      expect(t).toHaveProperty("slogan");
      expect(t).toHaveProperty("desc");
      expect(t).toHaveProperty("keywords");
      expect(t).toHaveProperty("special");
      expect(t).toHaveProperty("translations");
    }
  });

  test("/api/quiz returns 200 with questions array > 0", async ({ page }) => {
    const res = await page.request.get("/api/quiz", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);
  });

  test("/api/count returns total > 2974", async ({ page }) => {
    const res = await page.request.get("/api/count", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("total");
    expect(typeof data.total).toBe("number");
    expect(data.total).toBeGreaterThan(2974);
  });

  test("/api/match with valid answers returns a result with required fields", async ({ page }) => {
    const res = await page.request.post("/api/match", {
      data: { answers: validAnswers },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty("code");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("slogan");
    expect(data).toHaveProperty("desc");
    expect(data).toHaveProperty("similarity");
    expect(data).toHaveProperty("userVector");
    expect(data).toHaveProperty("templateVector");
    expect(data).toHaveProperty("top3");
    expect(data).toHaveProperty("borderType");
    expect(data).toHaveProperty("special");
  });

  test("/api/match with invalid answers returns 400", async ({ page }) => {
    const res = await page.request.post("/api/match", {
      data: {
        answers: [{ questionId: 999999, optionId: 999999 }],
      },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(400);
  });

  test("/api/match with empty body returns 400", async ({ page }) => {
    const res = await page.request.post("/api/match", {
      data: {},
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(400);
  });

  test("/api/results with valid data returns record info", async ({ page }) => {
    const res = await page.request.post("/api/results", {
      data: {
        sessionId: `test-session-${Date.now()}`,
        answers: validAnswers,
        userAgent: "Playwright Test",
        screenRes: "1280x720",
        language: "zh-CN",
        timezone: "Asia/Shanghai",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        duration: 120,
      },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty("recordId");
    expect(data).toHaveProperty("rank");
    expect(data).toHaveProperty("totalParticipants");
    expect(data).toHaveProperty("typeCount");
    expect(data).toHaveProperty("typePercentage");
  });

  test("/api/results without answers returns 400", async ({ page }) => {
    const res = await page.request.post("/api/results", {
      data: {
        sessionId: `test-session-${Date.now()}`,
        answers: [],
      },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(400);
  });

  test("/api/admin/stats without auth returns 401", async ({ page }) => {
    const res = await page.request.get("/api/admin/stats", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/admin/stats with valid token returns statistics", async ({ page }) => {
    attachConsoleListeners(page);
    const password = process.env.ADMIN_PASSWORD || "test123";
    const token = await adminLogin(page, password);

    const res = await page.request.get("/api/admin/stats", {
      headers: {
        "x-admin-token": token,
        "x-forwarded-for": TEST_IP,
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty("totalParticipants");
    expect(data).toHaveProperty("todayCount");
    expect(data).toHaveProperty("avgSimilarity");
    expect(data).toHaveProperty("typeDistribution");
    expect(data).toHaveProperty("gateDistribution");
    expect(data).toHaveProperty("dailyTrends");
    expect(data).toHaveProperty("recentActivity");
  });

  test("/api/admin/login with wrong password returns 401", async ({ page }) => {
    const res = await page.request.post("/api/admin/login", {
      headers: {
        "x-admin-password": "wrong-password",
        "x-forwarded-for": TEST_IP,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/admin/login with correct password returns token", async ({ page }) => {
    const password = process.env.ADMIN_PASSWORD || "test123";
    const res = await page.request.post("/api/admin/login", {
      headers: {
        "x-admin-password": password,
        "x-forwarded-for": TEST_IP,
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("token");
    expect(typeof data.token).toBe("string");
    expect(data.token.length).toBeGreaterThan(0);
  });

  test("Rate limit on /api/match returns 429", async ({ page }) => {
    // Use a brand-new IP so the bucket starts full and is not affected by
    // earlier tests in this file.
    const fakeIp = "rate-limit-match.1.2.3.4";
    for (let i = 0; i < 30; i++) {
      const res = await page.request.post("/api/match", {
        data: { answers: validAnswers },
        headers: { "x-forwarded-for": fakeIp },
      });
      if (res.status() === 429) {
        return;
      }
    }
    expect(false, "Expected 429 but did not get rate limited").toBe(true);
  });

  test("Rate limit on /api/count returns 429", async ({ page }) => {
    // Use a brand-new IP so the bucket starts full.
    const fakeIp = "rate-limit-count.1.2.3.5";
    for (let i = 0; i < 40; i++) {
      const res = await page.request.get("/api/count", {
        headers: { "x-forwarded-for": fakeIp },
      });
      if (res.status() === 429) {
        return;
      }
    }
    expect(false, "Expected 429 but did not get rate limited").toBe(true);
  });

  test("/api/quiz questions have unique orders", async ({ page }) => {
    const res = await page.request.get("/api/quiz", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    const data = await res.json();
    const orders = data.questions.map((q: { order: number }) => q.order);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(orders.length);
  });

  test("/api/quiz personality types have unique codes", async ({ page }) => {
    const res = await page.request.get("/api/quiz", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    const data = await res.json();
    const codes = data.types.map((t: { code: string }) => t.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  test("/api/match result top3 has at least 1 entry", async ({ page }) => {
    const res = await page.request.post("/api/match", {
      data: { answers: validAnswers },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.top3)).toBe(true);
    expect(data.top3.length).toBeGreaterThanOrEqual(1);
  });

  test("/api/match similarity is between 0 and 100", async ({ page }) => {
    const res = await page.request.post("/api/match", {
      data: { answers: validAnswers },
      headers: { "x-forwarded-for": TEST_IP },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.similarity).toBeGreaterThanOrEqual(0);
    expect(data.similarity).toBeLessThanOrEqual(100);
  });
});
