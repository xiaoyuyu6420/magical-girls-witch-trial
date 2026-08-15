# 10-intent-contract — e2e 视觉回归基线（检查点①）

> 发现者产出，2026-08-09。锁定意图 + 完成判定。审计者将对照本文判定 done。

## BLUF

用 Playwright 原生 `expect(page).toHaveScreenshot()` 为关键页面/状态（welcome/test/result 三屏 + 移动端两屏）建立**像素级可复现的视觉回归基线**，使后续 UI/样式改动能被自动检测，diff 可见、可审计、可一键更新。最关键的歧义是**动画/动态内容的处理策略**（首页 canvas、揭晓序列、scramble 文字）。

---

## 意图契约（EARS 需求）

### 实现方式
- **R1** 视觉回归测试应当使用 Playwright 原生 `expect(page).toHaveScreenshot()`（零新增依赖、与现有 `@playwright/test ^1.59.1` 复用同一运行器）。`[假设：原生 API 满足容差/mask/更新需求]`

### 基线存储与可提交性
- **R2** 基线截图应当存储在 `tests/visual/__screenshots__/`（Playwright 默认快照目录约定）。
- **R3** **当** `.gitignore` 存在 `test-results/`、`playwright-report/`、`*.png` 忽略规则时，**则** 必须为基线目录添加反向规则（如 `!tests/visual/__screenshots__/`），确保基线 PNG 能提交。`[需澄清：具体写法由实现者定，"基线可提交"是硬要求]`

### 覆盖范围（核心三屏 + 关键状态变体）
- **R4** 基线应当覆盖以下核心页面/状态（视口统一 chromium 1280x720）：
  - Welcome 页 `/`（hero 加载完成、loader 滑走后）
  - Test 页 `/test` 普通题（3 选项 `.opt-block` 可见态）
  - Result 页档案卡（答完全流程 + 跳过揭晓后，`.result-layout` 可见态）
- **R5** **在** 移动端视口（375x667）期间，应当为 Welcome 和 Test 各保留一条基线（与 `mobile.spec.ts` 共存，不重复断言逻辑）。`[假设：移动端只覆盖核心两屏，结果页移动端因流程成本高暂缓]`
- **R6**（可选）**如果** 成本允许，**则** 可追加：Test 页天平题/砝码题/批注插页、揭晓序列中间帧、lang-switcher 4 语言各一帧。`[需澄清：stretch goal 还是必须项？见歧义 A2]`

### 动画/动态内容处理（最关键）
- **R7** **当** 页面存在持续动画（welcome canvas 粒子、scramble 文字、loader）时，**则** 必须采取稳定化手段之一（由实现者择优并文档化）：
  - (a) `mask: [locator]` 屏蔽动态区域，仅对比静态结构；或
  - (b) 等待动画终态稳定后再截图（`waitForFunction` 检查 canvas 帧停止/scramble 完成）；或
  - (c) 对该区域单独放宽 `maxDiffPixelRatio` / `threshold`。`[需澄清：见歧义 A1——推荐 mask canvas + 等终态]`
- **R8** **在** Result 揭晓序列（最长 4.6s）期间，**则** 基线应当只截档案卡稳定态（跳过揭晓后），不截揭晓过程帧（含粒子爆发，不可复现）。
- **R9** **如果** scramble 文字动画导致 hero CTA 文案截图瞬间未定格，**则** 测试应当等待 `data-scramble` 属性稳定或改截不含该元素的子区域。

### 容差策略
- **R10** 每个基线应当明确配置容差——静态区域默认 `threshold: 0.2`（Playwright 默认），被 mask 的动态区域不计入 diff。
- **R11** **如果** 某基线 flaky，**则** 应上调该基线的 `maxDiffPixelRatio` 或增加 mask，并在测试名旁注释原因（不静默放任）。

### 运行与更新
- **R12** 视觉回归测试应当通过 `pnpm exec playwright test tests/visual/` 单独运行，与现有 121 个 e2e 测试隔离。
- **R13** **当** 基线需要更新时，开发者运行 `pnpm exec playwright test tests/visual/ --update-snapshots`，更新后的 PNG 应能正常提交。

### 失败产物
- **R14** **当** 视觉回归测试失败时，Playwright 应自动产出 expected/actual/diff 三图（`toHaveScreenshot` 原生行为），写入 `test-results/`（已 gitignore，本地查看）。

### 与现有 e2e 共存
- **R15** 视觉回归测试应当作为新增独立 spec 文件（`tests/visual/*.spec.ts`），**不修改**现有 15 个 spec 文件。
- **R16** **如果** 现有 `screenshot.spec.ts`（非断言式）与新基线功能重叠，**则** 保留旧文件不变——是否废弃交由后续决策。`[需澄清：见歧义 A4]`

---

## 非目标（明确不做）

- **不做** 跨浏览器基线（现有只 chromium）。
- **不做** 接入付费 SaaS（Percy/Chromatic/Applitools）。
- **不做** 性能测试、a11y 测试、交互测试。
- **不做** 改业务代码或重构现有组件。
- **不做** 强求所有 16 种角色结果的基线（只覆盖默认路径 1 条）。
- **不做** 把现有 `screenshot.spec.ts` 改造成断言式。

---

## 歧义（先决定这些，按风险排序）

### A1 — 动画/动态内容处理策略（最高风险）
- **读法1**（激进 mask）：canvas、scramble 文字、所有动画元素全 mask，只对比纯静态结构。基线极稳定，但漏检动画相关视觉变化。
- **读法2**（精准稳定化）：只 mask canvas（粒子随机），对 scramble 等待 `data-scramble` 终态后再截，对揭晓序列只截档案卡终态。基线覆盖更多视觉信号，实现成本更高。
- ✅ **决策（用户确认）：读法2 精准稳定化**。

### A2 — 基线覆盖范围（核心 vs 全量）
- **读法1**（核心三屏 + 移动端两屏，约 5-6 条基线）：快速落地。
- **读法2**（核心 + Test 4 题型变奏 + 揭晓序列 + 4 语言各一帧，约 15-20 条）：覆盖全但维护成本高。
- ✅ **决策（用户确认）：读法1 核心三屏起步**。后续按需扩。

### A3 — i18n 是否每个语言都要基线
- **读法1**：只截 zh-CN（默认 locale）。
- **读法2**：zh/en/ja 各截一帧 welcome。
- ✅ **决策（用户确认）：读法2 多语言各一帧**（比推荐更广——验证多语言布局不溢出）。

### A4 — 现有 `screenshot.spec.ts`（非断言式）如何处置
- **读法1**：保留不动（与新基线无冲突）。
- **读法2**：废弃删除。
- ✅ **决策（用户确认）：读法1 保留不动**。

---

## 完成判定（what done looks like —— 可验证）

后续审计者对照以下清单判定 done：

1. **新增独立 visual 测试文件**：`tests/visual/` 下有至少 1 个 spec 文件，使用 `toHaveScreenshot()`，**不修改**现有 15 个 spec。
2. **基线覆盖**（至少）：`/` Welcome desktop（zh-CN 默认）+ Welcome desktop 多语言各一帧（en/ja，验证布局不溢出）+ `/test` Test 普通题（desktop）+ Result 档案卡终态（desktop）+ `/` Welcome mobile 375x667 + `/test` Test mobile 375x667——共 ≥7 条基线。
3. **基线可提交**：`tests/visual/__screenshots__/` 下 PNG 经 `git status` 确认未被 `.gitignore` 忽略。
4. **`.gitignore` 反向规则**：根 `.gitignore` 明确含针对 visual 基线目录的反向规则。
5. **运行命令可用**：`pnpm exec playwright test tests/visual/` 在干净仓库跑通全绿（基线已生成提交后）。
6. **更新命令可用**：`pnpm exec playwright test tests/visual/ --update-snapshots` 能成功更新基线 PNG。
7. **失败产物**：故意改 CSS 触发失败后，`test-results/` 下出现对应测试的 `-expected.png` / `-actual.png` / `-diff.png` 三图。
8. **动画稳定**：welcome 基线连续运行 3 次结果一致（不 flaky）——证明 canvas/dynamic 内容已 mask 或稳定化。
9. **现有 e2e 不受影响**：`pnpm exec playwright test`（全量）运行后，原 121 个测试通过数与改造前一致（不新增失败）。
10. **策略文档化**：测试文件顶部或 `tests/visual/README.md` 注明动画处理策略（哪个区域 mask、哪个等终态）。

---

## 相关文件路径（供下游参考）

- `playwright.config.ts`（配置入口，评估是否加 snapshotDir/project 拆分）
- `.gitignore`（需加反向规则）
- `tests/screenshot.spec.ts`（现有非断言式截图，参考不改）
- `tests/helpers.ts`（含 `answerAllQuestions`、`waitForWelcomeLoaded`，可复用）
- `tests/mobile.spec.ts`（移动端视口参考）
- `tests/reveal.spec.ts`（揭晓序列跳过逻辑 `skipRevealAndWaitCard`）
