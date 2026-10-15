# 你是 crucible 流程的**发现者**。把目标当事实依据读，浮现歧义，产出锁定的 EARS 意图契约 + 完...

- 会话 ID: `sess_subagent_agent_d7a4f11d-854b-4ee7-8bcc-6576dc7ffc13`
- 时间: 2026-08-08 18:55:39 → 2026-08-08 18:59:11
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 6
- 归档状态: 未归档

---

## 👤 用户
你是 crucible 流程的**发现者**。把目标当事实依据读，浮现歧义，产出锁定的 EARS 意图契约 + 完成判定。

## 任务目标

给这个 Next.js 16 人格测试项目（magical-girls-witch-trial）建立 **e2e 视觉回归（visual regression）基线**：为关键页面/状态补全截图，建立像素对比基线，后续改动能自动检测视觉回归。

## Spec 来源

- 项目根 `spec.md`（魔女审判人格测试规格书）
- `docs/REDESIGN.md`（重设计文档，含跨IP扩展）
- `playwright.config.ts`（现有配置）

## 项目现状（编排者已探明）

- **已有 e2e 体系**：15 个 spec 文件、约 121 个测试，Playwright 配置完整。
- **当前配置**（`playwright.config.ts`）：`headless: true`，chromium only，baseURL `http://127.0.0.1:3010`，webServer 自动 build+启动 standalone，timeout 120s，有 storageState 预置 `witch-trial-fs-prompted=true`。
- **现有截图**：只有 `tests/screenshot.spec.ts` 4 个测试，覆盖 homepage 多视口 + homepage 元素细节 + layout 检查。截图输出到 `test-results/`（被 .gitignore 忽略）。当前 `test-results/` 只有 1 个 `quiz-result-success.png`。
- **关键页面/组件**：首页（WelcomeScreen，canvas 粒子动画）、TestScreen（26题答题）、ResultScreen（揭晓时刻，雷达图+维度条+top3+角色档案）、DisclaimerFooter（合规声明）、RadarChart、DimensionBar。
- **已知挑战**：首页有 canvas 粒子动画（`waitForTimeout(5000)` 等动画）——视觉回归对动画/动态内容敏感，需要处理（掩码 mask、固定 seed、或跳过动画区域）。
- **.gitignore**：`test-results/`、`playwright-report/`、根目录 `*.png` 都被忽略——基线截图需要可提交，要有专门目录（如 `tests/visual/__screenshots__/` 或类似）不被忽略。
- **包管理**：pnpm（不要用 npm/yarn）。devDependencies 已有 `@playwright/test ^1.59.1`。

## 你的产出要求（EARS 意图契约格式）

按以下结构产出，**每段都必填**：

### BLUF
一句话总结意图。

### 意图契约（EARS 需求）
用 EARS 格式（Ubiquitous / Event-driven / State-driven / Optional / Unwanted）写需求，编号 R1, R2...。覆盖：
- 哪些关键页面/状态要纳入视觉回归基线（首页/答题页/结果页/各隐藏角色结果/移动端视口/i18n 等——你判断范围）
- 基线截图如何存储、如何不被 .gitignore 误杀
- 视觉对比的容差策略（动画区域 mask、阈值、像素差百分比）
- 如何在 CI/本地一键跑视觉回归、如何更新基线（`--update-snapshots`）
- 失败时的产物（diff 图、实际图、期望图）
- 与现有 121 个 e2e 测试的关系（不破坏、共存）

### 歧义（每种两种合理读法）
列出你识别到的歧义点，每个给两种读法，标注 `[需澄清]`。特别关注：
- 视觉回归的实现方式：用 Playwright 原生 `expect(page).toHaveScreenshot()` vs 第三方（如 playwright-visual-report / reg-suit / percy）—— 推荐原生（零依赖、官方维护）
- 基线覆盖范围：全关键页面 vs 仅核心几个
- 动画/动态内容的处理策略
- 移动端是否纳入（现有有 mobile.spec.ts）
- 跨浏览器（现有只 chromium）

### 非目标
明确排除什么（如：不改业务代码、不重写现有 e2e、不接入付费 SaaS、不加多浏览器）。

### 完成判定（what done looks like —— 可验证的完成标准）
这是最重要的部分。列出可验证的标准，后续审计者会对照它判定 done。例如：
- 哪些页面/状态有视觉回归测试覆盖（具体清单）
- `pnpm exec playwright test` 跑视觉回归全绿
- 基线截图已提交到仓库（具体目录）
- 提供更新基线的命令并能成功运行
- 失败时产出 diff/actual/expected 三图
- 现有 121 e2e 测试不受影响

### 假设（你替用户做的合理假设，标注 [假设]）

## 自我管理 + 约束

- **有界**：只做发现，不写代码、不改文件、不跑测试。
- **防漂移**：聚焦"视觉回归基线"这一目标，不要扩展到性能测试/a11y 测试等其他维度。
- **诚实退出**：如果信息不足以判断某项，标 `[需澄清]`，不要编造。
- **边界**：你是发现者，不是架构师——不要设计实现方案，只锁定意图。

保持简洁，重点在意图契约和完成判定的可验证性。

## 🤖 助手
我先锚定到原文。让我并行读取关键文件，确保意图契约基于事实而非臆测。

> 🔧 工具调用 4 次: Read

## 🤖 助手
让我并行查看现有截图测试和 tests 目录结构，理解现状的覆盖范围。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
让我看现有的 quiz/result/welcome/mobile spec 如何驱动到结果页，以及 i18n 实际是否生效——这些决定基线的可行覆盖范围。

> 🔧 工具调用 3 次: Read

## 🤖 助手
我已经锚定到事实。关键发现：实际路由是 `/`（welcome，含 4 语言 lang-switcher + canvas 粒子）、`/test`（quiz，含 4 种题型变奏：普通题/天平/砝码/批注插页）、结果页 `.result-layout`（含揭晓序列 + 档案卡，**已按 REDESIGN 去掉了相似度/雷达图/Top3**，改用稀有度）。现有动态内容很多（canvas、loader、揭晓序列、scramble 文字动画）——这些是视觉回归的主要敌人。下面是锁定的意图契约。

---

## BLUF

目标清晰且可实现：用 Playwright 原生 `toHaveScreenshot()` 为关键页面/状态建立可提交的视觉回归基线，覆盖 welcome/test/result 三屏 + 关键状态变体。最关键的歧义是**动画/动态内容的处理策略**（首页 canvas、揭晓序列、scramble 文字）——这决定了基线是稳定可复现还是持续 flaky；其次是覆盖范围（仅核心三屏 vs 含隐藏角色/i18n 全量）。

---

## 意图契约（EARS 需求）

### 核心意图

为 magical-girls-witch-trial 的关键页面与关键状态建立**像素级可复现的视觉回归基线**，使后续 UI/样式改动能被自动检测，diff 可见、可审计、可一键更新。

### 需求（EARS）

**实现方式**

- **R1** 全称性：视觉回归测试应当使用 Playwright 原生 `expect(page).toHaveScreenshot()`（零新增依赖、与现有 `@playwright/test ^1.59.1` 复用同一运行器）。 `[假设：原生 API 满足本项目的容差/mask/更新需求，无需引入第三方]`

**基线存储与可提交性**

- **R2** 全称性：基线截图应当存储在 `tests/visual/__screenshots__/`（Playwright 默认快照目录约定）。
- **R3** 事件驱动：**当** `.gitignore` 中存在 `test-results/`、`playwright-report/`、`*.png` 的忽略规则时，**则** 新建基线目录必须显式添加 `!tests/visual/__screenshots__/` 之类的反向规则，确保基线 PNG 能被提交到仓库。 `[需澄清：具体反向规则的写法与目录路径由实现者定，但"基线可提交"是硬要求]`

**覆盖范围（核心三屏 + 关键状态变体）**

- **R4** 全称性：视觉回归基线应当覆盖以下核心页面/状态（视口统一 chromium 1280x720）：
  - Welcome 页 `/`（hero 加载完成、loader 滑走后）
  - Test 页 `/test` 普通题（3 选项 `.opt-block` 可见态）
  - Result 页档案卡（答完全流程 + 跳过揭晓后，`.result-layout` 可见态）
- **R5** 状态驱动：**在** 移动端视口（375x667）期间，系统应当为 Welcome 和 Test 各保留一条基线（与现有 `mobile.spec.ts` 共存，不重复其断言逻辑）。 `[假设：移动端纳入但只覆盖核心两屏，结果页移动端因走完流程成本高暂不强求]`
- **R6** 可选：**如果** 成本允许，**则** 可以追加覆盖：Test 页天平题态、Test 页砝码题态、批注插页 `.interjection-overlay`、揭晓序列中间帧、lang-switcher 4 语言各一帧。 `[需澄清：这是 stretch goal 还是必须项？见歧义 A2]`

**动画/动态内容处理（最关键）**

- **R7** 事件驱动：**当** 页面存在持续动画元素（welcome canvas 粒子、scramble 文字、loader）时，**则** 视觉回归必须采取以下任一稳定化手段之一（由实现者择优，但必须明确选择并文档化）：
  - (a) 用 `mask: [locator]` 屏蔽动态区域，仅对比静态结构；或
  - (b) 等待动画终态稳定后再截图（如 `waitForFunction` 检查 canvas 帧停止/scramble 完成）；或
  - (c) 对该区域单独放宽 `maxDiffPixelRatio` / `threshold`。 `[需澄清：见歧义 A3——推荐 mask canvas + 放宽文字动画]`
- **R8** 状态驱动：**在** Result 揭晓序列（最长 4.6s）期间，**则** 视觉基线应当只截档案卡稳定态（跳过揭晓后），不截揭晓过程帧（揭晓本身含粒子爆发，不可复现）。
- **R9** 防御性：**如果** scramble 文字动画导致 hero CTA 文案在截图瞬间未定格，**则** 测试应当等待 `data-scramble` 属性稳定或改截不含该元素的子区域。

**容差策略**

- **R10** 全称性：每个基线应当明确配置容差——静态区域默认 `threshold: 0.2`（Playwright 默认），被 mask 的动态区域不计入 diff。
- **R11** 防御性：**如果** 某基线 flaky（跨运行不稳定），**则** 应当上调该基线的 `maxDiffPixelRatio` 或增加 mask，并在测试名旁注释原因（不静默放任）。

**运行与更新**

- **R12** 全称性：视觉回归测试应当通过 `pnpm exec playwright test tests/visual/` 单独运行，与现有 121 个 e2e 测试隔离。
- **R13** 事件驱动：**当** 基线需要更新时，开发者应当运行 `pnpm exec playwright test tests/visual/ --update-snapshots`，更新后的 PNG 应能正常提交。

**失败产物**

- **R14** 事件驱动：**当** 视觉回归测试失败时，Playwright 应当自动产出 expected/actual/diff 三图（`toHaveScreenshot` 原生行为），并写入 `test-results/`（已 gitignore，本地查看）。

**与现有 e2e 共存**

- **R15** 全称性：视觉回归测试应当作为新增的独立 spec 文件（如 `tests/visual/*.spec.ts`），不修改现有 15 个 spec 文件。
- **R16** 防御性：**如果** 现有 `screenshot.spec.ts`（4 个非断言式截图测试）与新的 `toHaveScreenshot` 基线功能重叠，**则** 应保留旧文件不变（避免破坏），新基线独立成文件——是否删除旧文件交由后续决策。 `[需澄清：是否要求废弃 screenshot.spec.ts？见歧义 A4]`

### 明确的非目标（不做清单）

- **不做** 跨浏览器基线（现有只 chromium，`playwright.config.ts` projects 也只配了 chromium——扩 firefox/webkit 超出本目标）。
- **不做** 接入付费 SaaS（Percy/Chromatic/Applitools）——零依赖优先。
- **不做** 性能测试、a11y 测试、交互测试（视觉回归只管"像素是否变化"）。
- **不做** 改业务代码或重构现有组件（除非为配合动画稳定化需要加测试 hook，那也属于测试侧改动）。
- **不做** 强求所有 16 种角色结果的基线（每条结果流程跑完约 30s+，全量成本过高；只覆盖默认路径 1 条）。
- **不做** 把现有 `screenshot.spec.ts` 的非断言式截图改造成断言式（那属于"改造"，本目标是"补全"）。

### 验收示例（Given/When/Then）

- **V1** Given 仓库干净 / When 运行 `pnpm exec playwright test tests/visual/` / Then 全部基线测试 PASS，首次运行自动生成基线 PNG。
- **V2** Given 基线已提交 / When 故意改动 `src/app/globals.css` 中 `--accent` 颜色 / Then 视觉回归测试 FAIL，`test-results/` 下出现 expected/actual/diff 三图。
- **V3** Given 基线已提交 / When 运行 `pnpm exec playwright test --update-snapshots` / Then 基线 PNG 被更新为新截图，再次运行 PASS。
- **V4** Given 任意改动 / When 运行 `pnpm exec playwright test`（不带路径过滤）/ Then 121 个现有 e2e 测试结果不受新基线影响（不新增失败、不互相阻塞）。
- **V5** Given `.gitignore` 含 `*.png` / When `git status` / Then `tests/visual/__screenshots__/` 下的基线 PNG 显示为可提交（不被忽略）。

### 开放假设（汇总供确认/推翻）

- `[假设]` Playwright 原生 `toHaveScreenshot()` 足够，不引入第三方库。
- `[假设]` 移动端只覆盖 Welcome + Test 两屏（结果页移动端因流程成本高暂缓）。
- `[假设]` 角色结果只覆盖默认走完流程得到的那 1 个角色（不覆盖全部 16 种）。
- `[假设]` 现有 `screenshot.spec.ts` 保留不动，新基线独立成文件。

---

## 歧义（先决定这些，按风险排序）

### A1 — 动画/动态内容处理策略（最高风险）
- **读法1**：激进 mask——把 canvas、scramble 文字、所有动画元素全部 mask 掉，只对比纯静态结构（按钮位置、卡片布局）。基线极稳定，但漏检动画相关的视觉变化。
- **读法2**：精准稳定化——只 mask canvas（粒子本就随机），对 scramble 等待 `data-scramble` 终态后再截，对揭晓序列只截档案卡终态。基线覆盖更多视觉信号，但实现成本更高。
- **提问：**采用哪种策略？ **推荐读法2**——canvas 用 mask（粒子是已知不可复现），其余动态元素用"等终态"处理（scramble 有明确的 `data-scramble` 属性可轮询），这样既能稳定又保留视觉信号。

### A2 — 基线覆盖范围（核心 vs 全量）
- **读法1**：核心三屏 + 移动端两屏（共约 5-6 条基线），快速落地。
- **读法2**：核心 + Test 页 4 种题型变奏（普通/天平/砝码/批注）+ 揭晓序列 + 4 语言各一帧（共约 15-20 条基线），覆盖更全但维护成本高。
- **提问：**基线覆盖核心三屏即可，还是要覆盖所有题型变奏和 i18n？ **推荐读法1 起步**，后续按需扩——首批基线先立起来比全量更重要。

### A3 — i18n 是否每个语言都要基线
- **读法1**：只截 zh-CN（默认 locale，`playwright.config.ts` 已配 `locale: "zh-CN"`）。
- **读法2**：zh/en/jp/??（lang-switcher 4 按钮）各截一帧 welcome。
- **提问：**i18n 视觉回归是必须的吗？ **推荐读法1**——文字内容差异由现有 `mobile.spec.ts` 的 lang-switcher 测试已部分覆盖，视觉基线聚焦布局而非文案。

### A4 — 现有 `screenshot.spec.ts`（非断言式）如何处置
- **读法1**：保留不动（它只是产出 PNG 到 test-results，不做断言，与新基线无冲突）。
- **读法2**：废弃并删除（功能被新的 `toHaveScreenshot` 取代）。
- **提问：**保留还是删除？ **推荐读法1 保留**——本目标是"补全基线"而非"重构现有"，删除属于额外改动，留作后续决策。

---

## 完成判定（what done looks like —— 可验证）

后续审计者对照以下清单判定 done：

1. **新增独立 visual 测试文件**：`tests/visual/` 目录下有至少 1 个 spec 文件，使用 `expect(page).toHaveScreenshot()`，**不修改** `tests/` 下现有 15 个 spec 文件。
2. **基线覆盖**（至少）：`/` Welcome（chromium desktop）、`/test` Test 普通题（chromium desktop）、`/result` 档案卡终态（chromium desktop）、`/` Welcome mobile 375x667、`/test` Test mobile 375x667——共 ≥5 条基线。
3. **基线可提交**：`tests/visual/__screenshots__/` 下的 PNG 经 `git status` 确认未被 `.gitignore` 忽略，可正常 `git add`。
4. **`.gitignore` 反向规则**：仓库根 `.gitignore` 明确含针对 visual 基线目录的反向规则（`!tests/visual/__screenshots__/` 或等价）。
5. **运行命令可用**：`pnpm exec playwright test tests/visual/` 在干净仓库跑通全绿（基线已生成并提交后）。
6. **更新命令可用**：`pnpm exec playwright test tests/visual/ --update-snapshots` 能成功更新基线 PNG。
7. **失败产物**：故意改 CSS 触发失败后，`test-results/` 下出现对应测试的 `-expected.png` / `-actual.png` / `-diff.png` 三图。
8. **动画稳定**：welcome 基线连续运行 3 次结果一致（不 flaky）——证明 canvas/dynamic 内容已被 mask 或稳定化。
9. **现有 e2e 不受影响**：`pnpm exec playwright test`（全量）运行后，原 121 个测试的通过数与改造前一致（不新增失败）。
10. **策略文档化**：测试文件顶部或 `tests/visual/README.md` 注明动画处理策略（哪个区域 mask、哪个等终态），供后续维护者理解容差选择。

---

**相关文件路径**（供下游架构师/实现者参考）：
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（配置入口，需评估是否加 snapshotDir/project 拆分）
- `/Users/munich/Desktop/独立项目/magical-girls/.gitignore`（需加反向规则）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/screenshot.spec.ts`（现有非断言式截图，参考但不改）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/helpers.ts`（含 `answerAllQuestions`、`waitForWelcomeLoaded`，可复用）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/mobile.spec.ts`（移动端视口参考）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/reveal.spec.ts`（揭晓序列跳过逻辑参考：`skipRevealAndWaitCard`）

**自我约束确认**：我未写代码、未改文件、未跑测试——只锁定意图。范围严格限定在"视觉回归基线"，未漂移到 a11y/性能/重构。最高风险歧义（A1 动画策略）已显式标注 `[需澄清]`，未默默用假设填空。
