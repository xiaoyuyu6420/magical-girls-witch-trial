# 00-seed — e2e 视觉回归基线（Visual Regression）

## 目标

给 magical-girls-witch-trial（Next.js 16 人格测试）建立 **e2e 视觉回归（visual regression）基线**：为关键页面/状态补全截图，建立像素对比基线，后续 UI/样式改动能被自动检测，diff 可见、可审计、可一键更新。

用户已选方向（2026-08-09 AskUserQuestion 确认）：「截图 + 视觉回归基线」（非有头浏览器、非 HTML 报告、非三合一）。

## Spec 来源

- 项目根 `spec.md`（魔女审判人格测试规格书，sha256 前12位待记）
- `docs/REDESIGN.md`（重设计文档，含跨IP扩展、结果页揭晓时刻）
- `playwright.config.ts`（现有配置）

## 项目现状（编排者探明）

- **已有 e2e 体系**：15 个 spec 文件、约 121 个测试，Playwright 配置完整。
- **当前配置**（`playwright.config.ts`）：`headless: true`，chromium only，baseURL `http://127.0.0.1:3010`，webServer 自动 build+启动 standalone（timeout 300s），test timeout 120s，storageState 预置 `witch-trial-fs-prompted=true`，locale `zh-CN`。
- **现有截图**：只有 `tests/screenshot.spec.ts` 4 个测试，覆盖 homepage 多视口 + 元素细节 + layout 检查。**非断言式**（只 page.screenshot 输出到 test-results，不做对比）。截图输出到 `test-results/`（被 .gitignore 忽略）。
- **关键页面/组件**：
  - 首页 `/`（WelcomeScreen，canvas 粒子动画 + scramble 文字动画 + 4 语言 lang-switcher）
  - `/test`（TestScreen，26题答题，4 种题型：普通题 / 天平题 / 砝码题 / 批注插页 `.interjection-overlay`）
  - 结果页 `.result-layout`（ResultScreen 揭晓时刻：揭晓序列含粒子爆发最长 4.6s + 档案卡含稀有度/角色档案，**已按 REDESIGN 去掉相似度/雷达图/Top3**）
  - DisclaimerFooter（合规声明）、RadarChart、DimensionBar
- **已知挑战**：首页 canvas 粒子动画（随机）、scramble 文字动画、揭晓序列粒子爆发——视觉回归对动态内容敏感。
- **.gitignore**：`test-results/`、`playwright-report/`、根目录 `*.png` 都被忽略——基线截图需要可提交，要有专门目录（如 `tests/visual/__screenshots__/`）不被忽略。
- **包管理**：pnpm（不要用 npm/yarn）。devDependencies 已有 `@playwright/test ^1.59.1`。
- **可复用 helpers**：`tests/helpers.ts` 含 `answerAllQuestions`、`waitForWelcomeLoaded`；`tests/reveal.spec.ts` 含揭晓序列跳过逻辑 `skipRevealAndWaitCard`。

## 项目类型

已有项目（给现有 e2e 体系增加视觉回归能力）。

## 路由结果

- **level: T2**（单模块内——e2e/测试体系，边界清晰）
- **type: build**（新增视觉回归能力）
