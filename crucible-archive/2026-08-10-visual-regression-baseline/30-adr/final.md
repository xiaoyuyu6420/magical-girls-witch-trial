# 30-adr/final.md — e2e 视觉回归基线架构决策（T2 单方案设计）

> architect 产出，2026-08-09。T2 级别单方案设计（无仲裁环节）。

## BLUF

用 Playwright 原生 `expect(page).toHaveScreenshot()` 在 `tests/visual/` 下建 7 条像素级基线。核心策略是**精准稳定化**：mask 永续动画区（canvas/cursor/live-time/blink/stats 计数）、等确定性终态（scramble innerText 回稳、opt-block computedStyle、result-layout reducedMotion 立即 done）、视口级全页截图（ResultScreen 例外用元素截图）。哲学：**只 mask 不可复现的随机像素源，保留所有可复现的视觉信号**。

## 核心抽象（5）

1. **visual project**（playwright.config.ts 新增第二个 project，`name:"visual"`，testMatch 限定 tests/visual/，普通 chromium project 加 testIgnore 排除 visual 目录）——隔离的承重点，普通 121 测试零接触。
2. **稳定化分层协议**（每个基线必选其一）：L1=mask 永续随机源；L2=等确定性终态标志；L3=容器级 reducedMotion 短路。不存在 L0 全屏裸截。
3. **`waitForScrambleSettled` helper**（visual 专用，新增到 `tests/visual/visual-helpers.ts`）——expect.poll 轮询所有 `[data-scramble]` 元素的 innerText === dataset.scramble。
4. **基线存储约定**：`tests/visual/__screenshots__/<spec-name>/<name>-chromium-<viewport>.png`，依赖 Playwright 默认 snapshotPathTemplate。
5. **可提交契约**：根 `.gitignore` 加反向规则块（R3 硬约束）。

## 关键决策（7）

| # | 决策 | 所选 | 否决 |
|---|---|---|---|
| D1 | 项目隔离 | 新增 visual project + 普通项目 testIgnore | 仅 testDir 物理隔离 / --grep 标签 |
| D2 | 移动端视口 | project 级 viewport（非 setViewportSize） | spec 内 setViewportSize（首帧 resize 抖动）|
| D3 | ResultScreen 稳定化 | context 级 `reducedMotion:'reduce'`（ResultScreen.tsx:116-120 命中跳过揭晓直接 done） | skipRevealAndWaitCard（时序竞态）/ 硬等 4.6s |
| D4 | 截图范围 | 视口级全页（fullPage:false 默认）；ResultScreen 例外用 `.result-layout` 元素截图 | 全元素截图（丢布局信号）/ fullPage:true（offscreen share-card 噪声）|
| D5 | 首页动态源 mask | mask 五类：`#abyss-canvas`/`#cursor-dot`/`#cursor-ring`/`#live-time`/`.status-blink`/`.hero__stats`；**不 mask** scramble 文本（确定终态，核心信号） | 激进 mask 全部（漏检标题字号变化）|
| D6 | 多语言注入 | `context.addInitScript` 注入 localStorage `witch-trial-locale` + goto 后等 +1500ms switchLang + waitForScrambleSettled | goto 后点 lang-btn（多一轮抖动）/ 仅 storageState（时序假设）|
| D7 | 容差 | `threshold:0.2` 全局默认（Playwright 默认 per-pixel），不引入 maxDiffPixelRatio；flaky 时按需逐条上调注释（R11） | 预设 maxDiffPixelRatio:0.01（掩盖漏 mask）/ threshold:0（跨机 flaky）|

## 7 条基线清单

| # | 基线 | project | 稳定化 | 截图范围 |
|---|---|---|---|---|
| 1 | Welcome desktop zh-CN | visual | L1 mask 五类 + L2 waitForScrambleSettled | 视口全页 |
| 2 | Welcome desktop en | visual | L2 addInitScript locale=en + 等 switchLang + waitForScrambleSettled | 视口全页 |
| 3 | Welcome desktop ja | visual | 同上 locale=ja | 视口全页 |
| 4 | Test 普通题 desktop | visual | L2 等 `.opt-block` computedStyle opacity===1 | 视口全页 |
| 5 | Result 档案卡 desktop | visual + reducedMotion:reduce | L3 reducedMotion 立即 done + 等 `.result-layout` aria-hidden="false" | `.result-layout` 元素截图 |
| 6 | Welcome mobile | visual-mobile | L1+L2 同 desktop welcome | 视口全页 375x667 |
| 7 | Test mobile | visual-mobile | L2 等 opt-block opacity===1 | 视口全页 375x667 |

## 验证方式（给审计者）

触发 FAIL 证明：改 `src/app/globals.css:78` `--accent:#d4af37` → `#ff0000`（影响 opt-index/稀有度条），跑 visual 测试应 FAIL，test-results 出现 -expected/-actual/-diff 三图（R14）。改 `public/index.html` 的 `--gold` 触发 welcome FAIL。验收后 git checkout 还原。

## 被拒绝的替代方案（3）

1. **reg-suit/lost-pixel 第三方库**——违背 R1 零新增依赖；原生 toHaveScreenshot 已支持 mask/threshold/三图，无功能缺口。
2. **全页 fullPage:true**——welcome/test 100vh 单屏等价，但 ResultScreen 会纳入 offscreen share-card（top:-9999px）噪声。
3. **spec 内 setViewportSize 做移动端**——goto 时 1280→375 触发 resize 重排，首帧不一致。project 级 viewport 在 context 创建时生效。

## 主要风险（3）

- **R1（最高）**：首页动态元素漏 mask 或过度 mask → flaky/漏检。缓解：完成判定第 8 条 welcome 连续 3 次一致性验证是硬闸。
- **R2（中）**：Playwright snapshotPathTemplate 默认行为变更导致基线路径漂移。缓解：config 显式设 `snapshotPathTemplate` 固化路径（推荐零成本）。
- **R3（中）**：addInitScript 注入 locale 与 +1500ms switchLang 时序竞态。缓解：waitForScrambleSettled 用 expect.poll 等终态判定，不依赖固定 sleep。

## 模块切分建议

**建议单人主上下文实现**——7 条基线共享 config 改动和 helper，切分会有 merge 冲突。文件级清单：

| 模块 | 文件 | 职责 | 禁区 |
|---|---|---|---|
| M1 配置 | `playwright.config.ts`、`.gitignore`、`tests/visual/README.md` | visual/visual-mobile project + testIgnore + 反向 gitignore + 策略文档 | 不改 webServer/use/storageState 既有字段 |
| M2 helper | `tests/visual/visual-helpers.ts` | 导出 `waitForScrambleSettled(page)`、`maskWelcomeDynamic(page)` 返回 Locator[] | 不改现有 helpers 导出 |
| M3 spec | `welcome.visual.spec.ts`、`test.visual.spec.ts`、`result.visual.spec.ts` | 7 条 toHaveScreenshot，每条注释 L1/L2/L3 策略 | 不修改 tests/ 下现有 15 spec |

**禁区（全局）**：不碰 `src/`、`public/index.html`、`tests/` 现有 15 spec——稳定化全在测试侧。
