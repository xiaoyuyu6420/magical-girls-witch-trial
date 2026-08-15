# 10-intent-contract · HTML 32 视觉重做（EARS 意图契约 + 完成判定 + 歧义）

> 角色：discoverer（发现者）。产出物 = 锁定的意图契约 + 可验证的完成判定 + 浮现的歧义。
> 创建时间：2026-08-13
> 锚点：`crucible/00-seed.md`（事实依据）、`/Users/munich/Downloads/ai_studio_code (32).html`（逐像素金标）、`.zcode/plans/plan-sess_b1722a51-cd67-47da-8d30-5b08144626bb.md`（四阶段计划）。

---

## BLUF

这次把「审判庭·灵魂裁决与魔女降临」HTML 32 的视觉语言（金紫黑赛博哥特答题页 + 塔罗分栏结果页）移植进现有项目，**数据层/评分/5 角色完全不动**，只换皮 + 重构结果页布局。最关键风险是 **C2「不准有细节损失」**——现有 26 题、5 角色匹配、i18n、分享卡、批注、键盘交互、测试套件全不能降级，而视觉大改会冲击 DOM/选择器/配色变量，回归面很广。done 长这样：手机端答题页逐像素像 32、桌面保留挤压动效但配色统一金紫黑、结果页深色塔罗分栏且桌面不再裁切、`pnpm vitest run` + `pnpm playwright test` + `pnpm build` 三件套全绿。

---

## 用户已锁定（不可推翻）

### 三条方向决策（AskUserQuestion 已确认，源自 00-seed）

| 维度 | 决策 |
|------|------|
| 桌面答题动效 | **保留 flex 挤压动效**（1→1.8→8），**不**换成 32 的 3D Tilt；只升级配色到金紫黑 + 补 32 的背景层（Canvas 粒子/浮雕字/极光转场）。手机端完全复刻 32。 |
| 天平(Q8/Q22)/筹码(Q14) | **保留 SVG 真实天平 + 点阵点击视觉**，只把配色从香槟 `#d8c8b0` 改成金紫黑。**不得**回退成 32 的普通选项 / +/- 步进器。 |
| 结果页立绘 | **用 32 的五角星 SVG + 角色名占位符**（后续有图再换）。 |

### 两条硬约束（本次会话追加，源自 00-seed）

- **C1「不准提前结束」**：直到计划全部完成才结束（goal 循环语义——必须跑到 done）。
- **C2「不准有细节损失」**：计划允许的视觉改动之外，现有所有功能/细节不得意外降级。本契约把"现有功能"整理成回归保护清单（见完成判定 §3）。

---

## EARS 意图契约

### 核心意图

把 HTML 32 的视觉/动效/DOM/配色移植进现有 React/Next 项目，**手机端答题页逐像素复刻 32**、**桌面答题保留挤压动效只换金紫黑配色+补背景层**、**结果页完全重构为 32 的塔罗分栏深色金紫黑**，数据层与评分逻辑零改动。

### A. 答题页视觉（EARS）

> 适用范围：`src/components/TestScreen.tsx` + `src/app/globals.css`（手机端作用域 `@media (max-width:768px), (pointer:coarse)`；桌面端默认）。

- **R1（手机端配色-全端语言）**：**在** 手机端答题页期间，系统应当呈现金紫黑赛博哥特配色（金 `#FFD700` / 霓虹紫 `#D800FF` / 深紫 `#7B2CBF` / 玫瑰红 `#FF0055` / 虚空黑 `#030305`），且不残留香槟色 `#d8c8b0`。
- **R2（Canvas 紫粒子）**：**在** 答题页挂载期间，系统应当渲染紫色粒子背景画布（≈45 粒子，`rgba(216,0,255,α)`，`shadowBlur≈10`，`requestAnimationFrame` 驱动）。 `[假设：粒子上限 45，可按性能 ±15 浮动，视觉密度接近即可]`
- **R3（Canvas 降级）**：**如果** 用户启用 `prefers-reduced-motion: reduce`，**则** 系统应当禁用 Canvas 粒子动画（不启动 rAF 循环）。 `[需澄清：禁用 vs 静态首帧？见 A1，推荐禁用]`
- **R4（浮雕字背景）**：**在** 答题页期间，系统应当显示巨型背景浮雕字（Syne 800、`≈28vw`、极低对比度 `rgba(255,255,255,0.012)`），**内容为当前题号**（`01`..`26`，随切题更新）。 `[假设：32 的初始 "JUDGMENT" 字样在 renderQuestion 后即被题号覆盖，实际可见态是题号]`
- **R5（HUD 双胶囊顶栏）**：**在** 答题页期间，系统应当在顶部呈现 HUD 双胶囊（左：`PREV` 返回 + 计数器 `NN/26` 含紫色斜杠；右：`RESTART`），`backdrop-filter: blur(20px)` 玻璃态 + 金边 + 内 inset 金光。Q1 时返回按钮隐藏，Q2+ 渐显。
- **R6（金色进度条）**：**在** 答题页期间，系统应当在顶部呈现 `2px` 进度条，fill 为 `violet-deep → purple-neon → gold-hyper` 三段渐变 + 紫光 `box-shadow`，宽度随题号线性推进（`(index+1)/26`）。
- **R7（玻璃态题卡）**：**在** 答题页期间，系统应当呈现玻璃态题卡（`backdrop-blur≥20px`、圆角 `≈24px`、内 `inset` 紫光 `rgba(123,44,191,0.15)` + 顶部 `1px` 金线 `::before` + `card-glare` 反光层）。
- **R8（tag-pill + toast-verdict）**：**在** 答题页期间，系统应当呈现金色脉冲点 + meta 标签（如 `Q1 · 晨光中的许愿`）；**当** 用户选中某选项，**则** 系统应当闪现 toast-verdict `✦ 契约已被记录 ✦`（紫色，≈400–600ms 后消失）。
- **R9（普通题选项-手机）**：**在** 手机端普通题（type A）期间，系统应当呈现 `01/02/03` 序号选项（Syne 字体），hover 时 `translateX(4px)` + 左侧 `3px` 金条 `::before`，selected 态为金紫渐变背景 `linear-gradient(135deg, rgba(255,215,0,0.15), rgba(216,0,255,0.15))` + 金边 + glow。
- **R10（普通题选项-桌面·保留挤压）**：**在** 桌面端普通题期间，系统应当**保留** flex 挤压动效（hover `flex:1.8→8`、选中放大、其余 dimmed 缩小），**不**使用 32 的 3D Tilt 鼠标跟随；并把挤压态配色从香槟升级为金紫黑。 `[需澄清：挤压 selected 用纯金还是金紫渐变？dimmed 具体色值？见 A3，推荐金紫渐变 + 中性灰 dimmed]`
- **R11（天平题 Q8/Q22·保留 SVG）**：**在** Q8/Q22 天平题期间，系统应当**保留** SVG 真实天平倾斜视觉（点托盘→该侧下沉/另侧上翘），**不得**回退为 32 的普通选项；并把天平配色从香槟升级为金紫黑。 `[需澄清：桌面天平是否也金紫黑？见 A5，推荐全端金紫黑]`
- **R12（筹码题 Q14·保留点阵）**：**在** Q14 筹码题期间，系统应当**保留** 点阵点击视觉（3 槽 × 3 圆点，总和=3 才能落锤），**不得**回退为 32 的 `slot-counter` 数字 + `+/-` 步进器；并把配色从香槟升级为金紫黑。
- **R13（卡片进出场）**：**当** 题目切换时，系统应当播放卡片 `floatIn`/`floatOut` 动画（`translateY(40px)→0` + `scale(0.95)→1` + `rotateX(-10deg)→0`）。
- **R14（极光转场）**：**当** 最后一题（Q26）被选中且即将进入结果页时，系统应当触发极光爆裂转场（`aurora-burst`：小圆点 `scale 1→≈250`，`radial-gradient` 金→紫→黑，持续 `≈800ms`）。 `[需澄清：与现有 Reveal 揭晓层的关系？见 A2，推荐替换]`

### B. 结果页重构（EARS）

> 适用范围：`src/components/ResultScreen.tsx`。**完全重构**，非局部改动。

- **R15（结构分栏）**：**当** 视口宽度 `≥850px` 时，系统应当呈现 `editorial-grid` 左右分栏（左 `380px` 塔罗立绘框 + 右 `1fr` 详情）；**当** 视口 `<850px` 时，系统应当退化为单列堆叠。
- **R16（修复桌面显示不全-C2 关键）**：**在** 桌面结果页期间，系统应当允许内容自然滚动，**不得**使用 `height:100vh; overflow:hidden` 锁死导致内容被裁切。 `[假设：当前"显示不全"根因是 height:100vh 不滚动，重构后改 min-height:100vh + 允许滚动]`
- **R17（深色金紫黑）**：**在** 结果页期间，系统应当采用金紫黑深色主题（`#030305` 底 + 玻璃态卡片 `rgba(12,10,18,0.65)`），**完全废弃** 米白浅色主题 `rgba(250,250,250,0.85)`。 `[需澄清：分享卡（离屏 html-to-image）是否同步改深色？米白是否完全废弃？见 A4，推荐同步深色]`
- **R18（塔罗立绘框·占位）**：**在** 结果页期间，系统应当在左栏呈现 `3:4` 比例塔罗立绘框（金边 `1px solid #FFD700` + 紫 glow `box-shadow 0 0 40px rgba(216,0,255,0.25)` + 渐变深紫底），内含五角星 SVG（`stroke=#FFD700` + drop-shadow 金光）+ 角色名占位符（后续换真图）。 `[假设：32 的 tarot-icon 是五角星 polygon，按原样移植]`
- **R19（渐变标题）**：**在** 结果页期间，系统应当呈现角色名标题为渐变文字（`linear-gradient(135deg, #FFF 30%, #FFD700 70%, #D800FF 100%)` + `background-clip:text`，`≈2.2rem weight 900`）。
- **R20（tag-cloud）**：**在** 结果页期间，系统应当呈现角色 tags 为 `neo-chip` 玻璃态标签云（`flex-wrap`、透明背景 + 浅边）。
- **R21（verdict 卡片）**：**在** 结果页期间，系统应当呈现 `verdict-editorial-card`，含"审判官的逼视"（金色 section-label）和"温柔的落点"（紫色 section-label）两段文案，文案来自匹配角色的 `prosecution` / `softlanding` 字段。
- **R22（posture 霓虹柱图）**：**当** 结果页挂载时，系统应当渲染 posture A/B/C 三行霓虹柱图（stat-fill `violet-deep → purple-neon → gold-hyper` 渐变 + 紫光 `box-shadow`），并播放宽度入场动画（`0%` → 实际百分比，`transition: width 1.2s`）。
- **R23（操作按钮）**：**在** 结果页期间，系统应当呈现 `action-row`：主按钮（`linear-gradient(135deg, gold, purple)` + 深色文字 + 金光阴影，"保存契约卡片"）+ 次按钮（透明 + 浅边，"重新审判"）。

### C. 回归保护（EARS · C2 落地）

> 这些是"现有功能不得降级"的硬验收点。每条都可执行验证（见完成判定 §3）。

- **R24（26 题数据）**：系统应当保留全部 26 题原文文案（与 32 的 `quizData` 逐题对应），**不得**删题/改题/加题/改题型。
- **R25（5 角色匹配）**：系统应当保留 5 角色匹配逻辑（`homura_devil` 晓美焰 / `madoka_god` 鹿目圆 / `sayaka_siren` 美树沙耶香 / `kyoko_pragmatist` 佐仓杏子 / `emma_truth` 樱羽艾玛），posture(A/B/C) + path + tendency + keyUnlocked 评分算法不得改变。 `[需澄清：32 的 characterDatabase 实际含第 6 角色 mami_facade（巴麻美，path=BE_SEEN 且 p.A>p.B 且 p.A>p.C 时触发）；00-seed 锁定 5 角色"不变"。本契约按 00-seed 维持 5 角色，不新增第 6 角色。如需同步请显式示下——这超出"视觉重做"范围，默认不动]`
- **R26（i18n）**：系统应当保留 zh-CN / en / ja / zh-TW 四语言框架（zh-CN 填实，其余可回退中文）。
- **R27（分享卡生成）**：系统应当保留分享卡生成功能（离屏 `html-to-image` 截图）。 `[需澄清：分享卡配色是否随结果页改深色金紫黑？见 A4]`
- **R28（批注插页）**：系统应当保留批注插页功能（答题流程中的内容插页）。
- **R29（键盘交互）**：系统应当保留键盘交互（数字键选选项、左右/上下切换等既有绑定）。
- **R30（prefers-reduced-motion）**：系统应当尊重 `prefers-reduced-motion`，对所有新增动效（Canvas 粒子/极光转场/卡片 floatIn/posture 柱图动画）提供降级或禁用路径。
- **R31（iframe 架构）**：系统应当保留 `public/index.html` 宿主 + `/test` iframe 架构；新增的背景层（Canvas/浮雕字/极光）加在 iframe 内部（TestScreen 作用域），**不**加到宿主页。
- **R32（字体已加载）**：系统应当复用 `src/app/layout.tsx` 已加载的 Syne / Cinzel / Noto Serif SC（不重复加载）。
- **R33（单测）**：系统应当保持 `pnpm vitest run` 全绿（现有 36 用例 + 新增视觉/回归用例）。
- **R34（E2E）**：系统应当保持 `pnpm playwright test` 全绿（现有 117 用例，选择器/断言适配新 DOM 后通过）。
- **R35（构建）**：系统应当 `pnpm build` 通过（无 TS 错误、无 lint 阻断）。

### 明确的非目标（不做清单）

- **不新增第 6 角色** mami_facade（巴麻美）—— 00-seed 明确"5 角色不变"，且本任务范围是视觉重做。
- **不改题目数量/题型结构** —— 严格 26 题一一对应（type A 普通 / type B 筹码 / 天平 Q8/Q22 / gate Q18 / trigger Q19）。
- **不改评分算法** —— posture 计分、path/tendency/keyUnlocked 逻辑、matchCharacter 遍历顺序不变。
- **桌面端不复刻 32 的 3D Tilt** —— 保留挤压动效（用户决策）。
- **天平/筹码不回退为 32 的普通选项/+/- 步进器** —— 保留 SVG 天平 + 点阵（用户决策）。
- **不做 en/ja/zh-TW 翻译** —— 本次仅中文（00-seed）。
- **不动宿主落地页 `public/index.html` 的氛围层**（abyss-canvas/noise/cursor）—— 除非答题页视觉必需。
- **不引入真角色立绘图** —— 用五角星 SVG + 角色名占位（用户决策）。

### 验收示例（Given/When/Then）

1. **G** 手机端（375×812）打开 `/test`，**W** 从 Q1 答到 Q26 全选第一项，**T** 结果页显示匹配角色 + posture 柱图动画播放 + 内容无裁切（可滚动）。
2. **G** 桌面端（1440×900）打开 `/test`，**W** hover 普通题选项，**T** 见挤压动效（选中放大、其余 dimmed）+ 金紫黑配色，且**无** 3D Tilt 鼠标跟随（卡片不随鼠标 rotateY/X）。
3. **G** 答题到 Q26 选中最后一项，**W** 触发最终转场，**T** 见极光爆裂覆盖层（小圆点放大至全屏）后再进入结果页。
4. **G** 桌面结果页（≥850px），**W** 截图对比 32 的 editorial-grid，**T** 左 380px 塔罗立绘框（3:4）+ 右 1fr 详情，布局结构与 32 一致，无内容裁切。
5. **G** 浏览器启用 `prefers-reduced-motion: reduce`，**W** 打开答题页 + 答完，**T** Canvas 粒子不渲染/极光跳过/柱图无宽度动画（直接显示终值）。
6. **G** 现有 26 题数据 + 5 角色评分，**W** `pnpm vitest run`，**T** 全绿。
7. **G** 新 DOM 结构（hud-capsule/editorial-grid/tarot-card-frame/stat-bars-container 等），**W** `pnpm playwright test`，**T** E2E 全绿（选择器已适配）。
8. **G** Q8 天平题 / Q14 筹码题，**W** 桌面+手机分别交互，**T** 见 SVG 天平倾斜 / 点阵点击（非步进器），且配色为金紫黑（非香槟）。

### 开放假设（汇总，供最终确认/推翻）

- **H1**：Canvas 粒子上限 `45`（可按性能 ±15 浮动）。
- **H2**：极光转场总持续 `≈800ms`（对齐 32 的 setTimeout 时序：100ms 触发 + 800ms 切换 + 400ms 淡出）。
- **H3**：浮雕字对比度 `rgba(255,255,255,0.012)`（近乎不可见，仅纹理感）。
- **H4**：塔罗框 `aspect-ratio: 3/4`（与 32 一致）。
- **H5**：posture 柱图 stat-fill 为 `violet-deep → purple-neon → gold-hyper` 三段线性渐变。
- **H6**：HUD 计数器格式 `NN/26`（两位补零，紫色斜杠分隔）。
- **H7**：Q1 时 PREV 按钮隐藏（`opacity:0; pointer-events:none`），Q2+ 渐显。

---

## 完成判定

### §1 视觉对照清单（逐项，从 32 HTML 提取）

> 每项含「32 的实现细节」+「验收方式」。验收方式优先可执行（截图/grep/DOM 断言），不只靠读代码。

#### 答题页（TestScreen + globals.css）

| # | 要素 | 32 实现细节 | 验收方式 |
|---|------|------------|---------|
| V1 | Canvas 紫粒子 | `#bg-canvas`，45 粒子，`rgba(216,0,255,α)`，`shadowBlur=10`，rAF | 手机端截图见紫色微粒；grep `requestAnimationFrame` + `D800FF` 在 TestScreen 作用域 |
| V2 | 巨型浮雕字（题号） | `.bg-typography`，Syne 800，`28vw`，`rgba(255,255,255,0.012)`，内容=当前题号 | 截图见极淡题号水印；DOM 断言文本随切题更新 |
| V3 | HUD 双胶囊 | `.hud-header` 含两 `.hud-capsule`：左 `PREV`+计数器（`NN`+紫`/`+`26`），右 `RESTART`；`blur(20px)` 金边 | Playwright 断言两个 capsule；Q1 时 PREV 隐藏 |
| V4 | 金紫进度条 | `.progress-track` 2px，fill 三段渐变 `violet-deep→purple-neon→gold-hyper` + 紫光 shadow | 截图；DOM 断言 width 随题号推进 |
| V5 | 玻璃态题卡 | `.card` `backdrop-blur(30px) saturate(180%)`，圆角 24，`inset rgba(123,44,191,0.15)` + 顶部金线 `::before` + `.card-glare` 反光层 | 截图对比玻璃质感；grep `backdrop-filter` |
| V6 | tag-pill + pulse-orb | 金色胶囊 + 紫色脉冲点（`orbPulse` 动画）+ meta 文案 | DOM 断言 meta 文本（如 `Q1 · 晨光中的许愿`） |
| V7 | toast-verdict | 紫色 `✦ 契约已被记录 ✦`，选中后 `.show` 闪现 ≈400-600ms | Playwright 点选项后断言 toast 出现再消失 |
| V8 | 普通题选项-手机 | `.opt-btn` `01/02/03`（Syne）+ `translateX(4px)` hover + 左侧 3px 金条 + selected 金紫渐变 | 手机端截图；DOM 断言 opt-index 文本格式 |
| V9 | 普通题选项-桌面 | **本项目特殊**：保留 flex 挤压（非 32 Tilt），配色金紫黑 | 桌面截图见挤压；鼠标移动卡片不 rotateY |
| V10 | 极光转场 | `.aurora-burst` 10px 圆点 `scale 1→250`，`radial gold→purple→void` | Playwright 监听 Q26 选中后 aurora active 类 |
| V11 | 卡片进出场 | `floatIn`/`floatOut`：translateY+scale+rotateX | 切题时截图/录屏确认动画 |
| V12 | 筹码题（本项目特殊） | **保留点阵**（3×3 圆点），非 32 的 `slot-counter`+`+/-` | DOM 断言无 `.btn-ctrl`（步进器）；见点阵结构 |
| V13 | 天平题（本项目特殊） | **保留 SVG 天平倾斜**，非普通选项 | DOM 断言含 `<svg>` 天平结构；非 `.opt-btn` |
| V14 | 胶片颗粒（可选） | `.film-grain` SVG noise `opacity:0.04` | 截图见轻微噪点；`[假设：可选层，未硬性要求]` |

#### 结果页（ResultScreen 完全重构）

| # | 要素 | 32 实现细节 | 验收方式 |
|---|------|------------|---------|
| V15 | result-header-badge | `SOUL ARCHETYPE · VERDICT SEALED` 金色胶囊 | DOM 断言文本 |
| V16 | editorial-grid 分栏 | `≥850px`：`380px 1fr`；`<850px`：单列 | 桌面+手机分别截图；grep `grid-template-columns` |
| V17 | 塔罗立绘框 | `.tarot-card-frame` `aspect-ratio:3/4`，金边 + 紫 glow + 渐变深紫底；五角星 SVG（`polygon` 10 点）+ 角色名占位 | 截图；DOM 断言 `<svg><polygon>` |
| V18 | res-ip-tag | 紫色 `作品：《...》` | DOM 断言 |
| V19 | 渐变标题 | `.res-title` `linear-gradient(#FFF 30%, gold 70%, purple 100%)` clip-text，`2.2rem 900` | 截图；grep `background-clip: text` |
| V20 | tag-cloud | `.neo-chip` 玻璃态标签（角色 tags） | DOM 断言角色 tags 数量 |
| V21 | verdict 卡片 | `.verdict-editorial-card`：审判官逼视（金标）+ 温柔落点（紫标） | DOM 断言两段文案（prosecution/softlanding） |
| V22 | posture 霓虹柱图 | 3 行（A 粉饰/B 清醒/C 扭曲），stat-fill 紫金渐变 + glow，入场宽度动画 | 截图；Playwright 断言 fill width>0 + 百分比文本 |
| V23 | 操作按钮 | 主按钮金紫渐变 + 深色字 + 金光；次按钮透明浅边 | 截图；DOM 断言两类按钮 |
| V24 | 桌面可滚动（C2 关键） | 不再 `height:100vh` 锁死 | 桌面长内容截图无裁切；page evaluate 检查 scrollHeight>clientHeight |

### §2 可跑的验收命令

```bash
# 1. 单测全绿（评分/数据/匹配等数据层不变 + 新增视觉用例）
pnpm vitest run

# 2. E2E 全绿（选择器/断言适配新 DOM：hud-capsule/editorial-grid/tarot/stat-bars 等）
pnpm playwright test

# 3. 构建通过（TS + lint + Next build）
pnpm build

# 4.（辅助）grep 断言香槟色已清除（手机作用域）
rg -n 'd8c8b0|champagne' src/app/globals.css src/components/TestScreen.tsx
# 期望：手机作用域内 0 命中（或仅作为废弃注释）

# 5.（辅助）grep 断言米白主题已清除
rg -n 'rgba\(250,\s*250,\s*250' src/components/ResultScreen.tsx
# 期望：0 命中

# 6.（辅助）DOM 结构断言（Playwright 内）
# - 答题页：两个 .hud-capsule / .progress-fill / .bg-typography
# - 结果页：.editorial-grid / .tarot-card-frame / .stat-bars-container / .btn-neo-primary
```

### §3 回归保护清单（C2 逐条 · 现有功能不得降级）

| # | 现有功能 | 验收点 | 验收方式 |
|---|---------|--------|---------|
| P1 | 26 题原文数据 | 题数=26，题干/meta/选项文案与 32 的 quizData 逐题对应 | `pnpm vitest run`（quiz-content 测试）；grep 关键字（`晨光中的许愿`/`审判终章确认`/`灵魂的路径抉择`等）应 26 条命中 |
| P2 | 5 角色匹配 | homura_devil/madoka_god/sayaka_siren/kyoko_pragmatist/emma_truth 的 check 函数 + 兜底 emma 逻辑不变 | `pnpm vitest run`（match.test）；手算若干答案组合验证匹配 |
| P3 | posture 评分 | postureA/B/C 聚合 + q18_path + q19_keyUnlocked + tendency 提取逻辑不变 | `pnpm vitest run`（scores.test / answer-processor.test） |
| P4 | i18n 框架 | zh-CN/en/ja/zh-TW 四语言可切换（zh-CN 填实，其余回退） | 手动切语言；grep i18n key 完整性 |
| P5 | 分享卡生成 | 离屏 html-to-image 截图功能可用 | 手动触发分享卡生成；`[需澄清 A4：配色是否同步深色]` |
| P6 | 批注插页 | 答题流程中的内容插页保留 | 手动跑流程；DOM 断言 |
| P7 | 键盘交互 | 数字键选选项 / 方向键切换 等绑定有效 | 手动键盘操作；Playwright keyboard 断言 |
| P8 | prefers-reduced-motion | 所有动效（含新增 Canvas/极光/floatIn/柱图）提供降级 | DevTools 开启 reduced-motion 截图对比 |
| P9 | iframe 架构 | public/index.html 宿主 + /test iframe 不变 | 手动访问 /test 与宿主页；grep iframe 标签 |
| P10 | 字体加载 | Syne/Cinzel/Noto Serif SC 已在 layout.tsx 加载，不重复 | grep `next/font/google` in layout.tsx |
| P11 | 视觉回归测试 | 现有视觉快照（若有）不意外漂移 | 跑视觉回归（若配置） |
| P12 | 现有 E2E 用例 | 117 用例全绿（选择器适配新 DOM 后） | `pnpm playwright test` |
| P13 | 现有单测用例 | 36 用例全绿（评分/数据用例重写适配 posture 后） | `pnpm vitest run` |

---

## 歧义（分叉 · 先决定这些）

> 按 risk 排序。每条给推荐读法以减少 review 成本。

### A1 — Canvas 粒子的降级策略（risk: 中）

- **读法 A**：`prefers-reduced-motion: reduce` 时**完全禁用** Canvas（不渲染画布、不启动 rAF）。
- **读法 B**：`reduced-motion` 时渲染**静态首帧**（粒子定格、不 rAF）。
- **推荐**：**读法 A（禁用）**。
- **理由**：现有项目已支持 reduced-motion 禁用动效，保持一致；静态首帧视觉价值低且增加分支复杂度。低端设备（非 reduced-motion）可把粒子上限降到 ~20 保性能。

### A2 — 极光转场与现有 Reveal 揭晓层的关系（risk: 高）

- **读法 A**：极光转场**替换**现有 Reveal 揭晓层（成为唯一的答题→结果过渡视觉）。
- **读法 B**：极光转场**叠加**在 Reveal 之上（两层动效并存）。
- **推荐**：**读法 A（替换）**。
- **理由**：32 的极光就是结果揭晓动效，叠加会冲突/冗余；用户要"和 32 完全一样"，统一为极光更接近目标。**但需确认**：现有 Reveal 层是否承载非视觉职责（状态切换/埋点/评分触发），若有需把逻辑迁出、只换视觉壳。这点交给 architect 在实现时核查。

### A3 — 桌面挤压动效与金紫黑的融合边界（risk: 中）

- **读法 A**：挤压 selected 态用**纯金** `#FFD700`，dimmed 态用半透明深紫。
- **读法 B**：挤压 selected 态用**金紫渐变**（与 32 的 `.opt-btn.selected` 一致），dimmed 态用**中性灰**。
- **推荐**：**读法 B（金紫渐变 + 中性灰 dimmed）**。
- **理由**：决策要求"升级配色到金紫黑"，selected 用渐变能和手机端/32 保持视觉一致；dimmed 用中性灰避免色彩污染未选中项。

### A4 — 分享卡配色 + 米白主题废弃范围（risk: 高）

- **读法 A**：分享卡**同步改为深色金紫黑**，米白主题**完全废弃**（结果页与分享卡视觉统一）。
- **读法 B**：分享卡**保留米白浅色**（分享传播友好），仅结果页改深色。
- **推荐**：**读法 A（同步深色）**，但**建议用户拍板**。
- **理由**：用户原话"结果页面没有设计感"针对整体，深色金紫黑是新视觉语言，两套配色并存违反"和 32 完全一样"。但分享卡常用于社交传播，浅色在某些平台更醒目——这是产品取舍，不是技术问题，值得用户显式确认。

### A5 — 天平(Q8/Q22)/筹码(Q14) 改金紫黑的端范围（risk: 中）

- **读法 A**：天平/筹码**全端**（桌面+手机）统一改金紫黑。
- **读法 B**：仅手机端改金紫黑，桌面天平/筹码**保留现有香槟玻璃态**。
- **推荐**：**读法 A（全端金紫黑）**。
- **理由**：00-seed 决策表格明确"把配色从香槟 `#d8c8b0` 改成金紫黑"未区分端；若桌面天平保留香槟，会与桌面普通题（金紫黑）+ 手天地平（金紫黑）割裂，视觉不一致。

---

## 附：discoverer 自检

- **有界**：三遍扫描（锚定→歧义→锁定），歧义 5 条（不超限）。
- **防漂移**：所有视觉要素从 32 HTML 原文提取，未发明新需求；歧义只点分歧不写完整替代方案。
- **诚实退出**：`[需澄清]` 4 处（R3/R10/R11/R17/R25/R27 涉及歧义点）、`[假设]` 7 处（H1–H7）均显式标注，未默默填空。
- **边界**：未提架构/实现方案（那是 architect 的事）；只锁定"要达成什么 + 怎么算 done + 哪里模糊"。
