# 40-implementation — e2e 视觉回归基线（L4 实现日志）

> 2026-08-10。T2 级别，单人主上下文实现（模块紧耦合共享 config，强制切分会有 merge 冲突）。

## 构建了什么

用 Playwright 原生 `expect(page).toHaveScreenshot()` 为关键页面建立 7 条像素级视觉回归基线，后续 UI/样式改动自动检测视觉回归，失败产出 expected/actual/diff 三图。

## 模块切分 + 接口契约

| 模块 | 文件 | 职责 |
|---|---|---|
| M1 配置 | `playwright.config.ts` | 新增 visual/visual-mobile project；普通 chromium project 加 testIgnore 排除 visual 目录 |
| M1 gitignore | `.gitignore` | 反向规则确保基线 PNG 可提交 |
| M2 helper | `tests/visual/visual-helpers.ts` | 导出 `waitForScrambleSettled(page)`、`maskWelcomeDynamic(page)`、`prepareWelcomeForScreenshot(page, locale)` |
| M3 spec | `tests/visual/welcome.visual.spec.ts` | 4 条：desktop zh/en/ja + mobile zh |
| M3 spec | `tests/visual/test.visual.spec.ts` | 2 条：desktop + mobile 普通题 |
| M3 spec | `tests/visual/result.visual.spec.ts` | 1 条：desktop 档案卡（reducedMotion） |
| 文档 | `tests/visual/README.md` | 策略文档（运行/基线存储/稳定化协议/容差/验证） |

## 7 条基线

| # | 基线 | project | 稳定化 | 容差 |
|---|---|---|---|---|
| 1 | welcome-desktop-zh | visual | L1 mask 5类 + L2 scramble settle | threshold:0.2 |
| 2 | welcome-desktop-en | visual | L2 显式点 lang-btn + scramble settle | threshold:0.2 |
| 3 | welcome-desktop-ja | visual | L2 显式点 lang-btn + scramble settle | threshold:0.2 |
| 4 | test-question-desktop | visual | L2 等 opt-block opacity:1 | threshold:0.2 |
| 5 | result-profile-card | visual | L3 contextOptions.reducedMotion:reduce | threshold:0.2 + maxDiffPixelRatio:0.02 |
| 6 | welcome-mobile-zh | visual-mobile | L1+L2 同 desktop | threshold:0.2 |
| 7 | test-question-mobile | visual-mobile | L2 等 opt-block opacity:1 | threshold:0.2 |

## 偏离 ADR 的地方（诚实记录）

1. **snapshotPathTemplate 取消自定义**：ADR 原计划用显式 `{snapshotDir}/{testFileDir}/__screenshots__/{arg}-{projectName}-{platform}.{ext}` 固化路径（R2 风险缓解）。但 Playwright 1.62 的 `{arg}` 在 name 带 `.png` 时 `{ext}` 解析异常（双点）。改为用 **Playwright 默认** snapshotPathTemplate（`{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}-{platform}.{ext}`）。代价：版本升级时默认行为可能变；收益：零异常、路径干净。**R2 风险保留**，缓解改为 README 记录 `@playwright/test ^1.62.1` 依赖。

2. **en/ja 多语言切换用显式点击 lang-btn**（非 addInitScript）：ADR D6 原计划 addInitScript 注入 localStorage + 等 DOMContentLoaded +1500ms 自动 switchLang。实测：boot 序列初始 scramble（zh-CN）与自动 switchLang 竞态，scramble 在切换瞬间从中文乱码切目标语言，settle 判定不稳。改为 **goto 后显式 click lang-btn**：先完成 zh-CN 初始 scramble settle → 切目标语言 → 等新 scramble settle。更可靠但多一轮动画。

3. **scramble 完成判定用 textContent 而非 innerText**：innerText 受 CSS `text-transform:uppercase` 影响（`.hero__cta` 的 en "Enter the Trial" 渲染为 "ENTER THE TRIAL"，与 data-scramble 原始大小写不匹配）。改用 textContent（返回原始 DOM 文本，无样式干扰）。

4. **result 基线加 maxDiffPixelRatio:0.02**：ADR D7 原计划全基线 threshold:0.2 不设 maxDiffPixelRatio。实测 result 档案卡的稀有度百分比（typePercentage，来自 /api/results 统计）每次 seed 后微变（~1% 像素，115px）。按 R11 纪律放宽到 2% 并注释原因——真实布局回归改 5%+ 像素仍被捕获。

## 集成时引入的新假设

- **mobile 不覆盖 en/ja/result**：按 A2 核心三屏起步，用 `test.skip(testInfo.project.name === "visual-mobile")` 过滤。mobile 只保留 welcome zh + test。
- 基线路径用 Playwright 默认 `<spec>-snapshots/` 目录（非 `__screenshots__/`），.gitignore 反向规则已覆盖 `tests/visual/**`。

## 验证结果

- `npx playwright test --project=visual`：5 passed
- `npx playwright test --project=visual-mobile`：2 passed, 3 skipped（符合预期）
- welcome zh-CN 连续 3 次一致（不 flaky）
- 改 `--accent:#d4af37` → `#ff0000` 触发 result FAIL，产出 expected/actual/diff 三图
- 普通 chromium project：108 个 e2e，0 个 visual 混入（testIgnore 生效）
- `--update-snapshots` 能正常更新基线
- TS 类型检查无错

## 禁区遵守

- 未修改 `src/` 任何业务代码
- 未修改 `public/index.html`
- 未修改 `tests/` 下现有 15 个 spec
- 未引入新依赖（复用 @playwright/test ^1.62.1 原生 toHaveScreenshot）

## 审计后修复（rework_budget=1）

审计者发现 CRITICAL：welcome 4 条基线是纯粉色色块（4254B，SHA 相同），因为 `#abyss-canvas` 是 `width:100%;height:100%` 全屏元素，mask 它的 bounding box 覆盖整个视口。

**修复**：canvas 从 mask 改为 `hideCanvasForScreenshot`（截图前 `visibility:hidden`）。
- `maskWelcomeDynamic` 移除 canvas locator
- 新增 `hideCanvasForScreenshot` 函数
- 重新生成 4 条 welcome 基线（4KB→330-580KB 真实内容）
- 验证：zh/en/ja SHA 互不相同 + 连续 3 次一致 + 改 --fg 触发 FAIL（7455 pixels）

**教训**：Playwright `mask` 作用于元素的几何 bounding box，覆盖所有 z-index——全屏元素不能 mask，要用 visibility:hidden 或停止动画引擎。红方和编排者的验证都漏了基线 PNG 内容检查（只看"测试全绿"），审计者独立验证捕获了这个问题。
