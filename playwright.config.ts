import { defineConfig } from "@playwright/test";
import path from "node:path";

const databaseUrl = `file:${path.resolve(process.cwd(), "dev.db").replaceAll("\\", "/")}`;
const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
);

process.env.DATABASE_URL ??= databaseUrl;
process.env.ADMIN_PASSWORD ??= "test123";

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  retries: 0,
  webServer: {
    command: "npx prisma db push && FORCE_RESEED=1 npx prisma db seed && npm run build && node scripts/prepare-standalone.mjs && node .next/standalone/server.js",
    env: {
      ...webServerEnv,
      PORT: "3010",
      HOSTNAME: "0.0.0.0",
      DATABASE_URL: databaseUrl,
      FORCE_RESEED: "1",
    },
    url: "http://127.0.0.1:3010",
    reuseExistingServer: true,
    timeout: 300000,
  },
  use: {
    baseURL: "http://127.0.0.1:3010",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: "zh-CN",
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:3010",
          localStorage: [
            { name: "witch-trial-fs-prompted", value: "true" },
          ],
        },
      ],
    },
  },
  projects: [
    {
      // 普通 e2e：排除视觉回归目录，保持原有 121 个测试零接触（契约 R15）。
      name: "chromium",
      use: { browserName: "chromium" },
      testIgnore: ["**/visual/**"],
    },
    {
      // 视觉回归（desktop 1280x720）：只跑 tests/visual/ 下的 .visual.spec.ts。
      name: "visual",
      testDir: "./tests/visual",
      testMatch: /.*\.visual\.spec\.ts$/,
      // 基线统一存入 __screenshots__/ 目录（契约 R2），对齐 .gitignore 反向规则。
      // Playwright 1.62：{arg}=name 去扩展名，{ext}=扩展名含点（如 .png）。name 必须带 .png。
      snapshotPathTemplate:
        "{snapshotDir}/{testFileDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      // 视觉回归（mobile 375x667）：project 级 viewport，避免 goto 后 resize 抖动（ADR D2）。
      // mobile 只跑核心两屏（welcome zh + test）；en/ja 和 result 在 spec 内按 project 名跳过。
      name: "visual-mobile",
      testDir: "./tests/visual",
      testMatch: /.*\.visual\.spec\.ts$/,
      snapshotPathTemplate:
        "{snapshotDir}/{testFileDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
      },
    },
  ],
});
