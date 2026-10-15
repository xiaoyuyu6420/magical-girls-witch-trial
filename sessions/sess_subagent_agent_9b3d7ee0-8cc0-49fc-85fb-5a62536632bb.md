# 你是 architect（架构师），为「HTML 32 视觉重做」项目独立设计一个**「分层·视觉系统重建」**变...

- 会话 ID: `sess_subagent_agent_9b3d7ee0-8cc0-49fc-85fb-5a62536632bb`
- 时间: 2026-08-13 11:34:26 → 2026-08-13 11:38:18
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
你是 architect（架构师），为「HTML 32 视觉重做」项目独立设计一个**「分层·视觉系统重建」**变体的技术方案。你不参考其他 architect，独立产出。

## 项目
根目录 `/Users/munich/Desktop/独立项目/magical-girls`。Next.js 16（app router）+ React 19 + TS 5.9 + Tailwind v4 + Prisma/SQLite + Vitest + Playwright。答题页路由 `/test`，作为 iframe 嵌入 `public/index.html`。

## 必读（先全部读完再设计）
1. `crucible/10-intent-contract.md` —— 意图契约 + 完成判定（V1-V24 + P1-P13）+ 5 歧义。
2. `crucible/00-seed.md` —— 目标 + 三决策 + 现状。
3. `/Users/munich/Downloads/ai_studio_code (32).html` —— 逐像素金标（金紫黑赛博哥特答题页 + 塔罗分栏结果页）。
4. `.zcode/plans/plan-sess_b1722a51-cd67-47da-8d30-5b08144626bb.md`。
5. 现有代码：`src/components/TestScreen.tsx`、`src/components/ResultScreen.tsx`、`src/app/globals.css`（914行，双套token）、`src/app/layout.tsx`、`src/app/test/page.tsx`。
6. 前端方法论：`/Users/munich/.zcode/skills/interface-details/SKILL.md`。

## 不可推翻的三决策
1. 桌面答题保留 flex 挤压动效，只升级配色到金紫黑 + 补 32 背景层。手机端完全复刻 32。
2. 天平/筹码保留 SVG天平+点阵视觉，配色香槟→金紫黑。
3. 结果页用 32 五角星SVG占位符。

## 两硬约束
- C1 不准提前结束。
- C2 不准有细节损失（P1-P13）。

## 你的变体聚焦：「分层·视觉系统重建」
把 32 的视觉抽成**独立的设计系统层**，与现有结构清晰共存：
- **新建 token 层**：32 的金紫黑作为独立 token 集（如 `--neo-gold`/`--neo-purple`/`--neo-void`），与现有 `--c-gold`/`--champagne-*` 并存或迁移。回答：是新建并存还是迁移替换？香槟 token 是否完全废弃？
- **32 风格的视觉层**：答题页背景层（Canvas粒子/浮雕字/极光）、HUD、玻璃题卡作为独立的 CSS 作用域/组件，与"桌面挤压动效层"通过 `@media (hover:hover)+(pointer:fine)` vs 移动端 作用域清晰分层。
- **手机端赛博哥特 vs 桌面挤压**：明确两套视觉的层边界——同一套 DOM，CSS 作用域切换。回答：金紫黑 token 在桌面挤压区和手机赛博哥特区如何统一表达？挤压选中态（A3）如何用金紫渐变？

核心问题：**如何建立一套分层的视觉系统，让 32 的赛博哥特（手机）和现有挤压动效（桌面）在同一代码库里清晰共存且不互相污染？** 极光转场作为独立层如何与 Reveal 共处（A2）？

## 输出格式（最终消息，不落盘）
1. **BLUF**（3-5 行）。
2. **核心抽象（≤5）**：token 层组织、视觉作用域划分、背景层组件、结果页分层、与现有层的接缝。指出改/新增哪些文件。
3. **被拒绝的替代方案**（2-3 个）。
4. **主要风险（≤3）**。
5. **对 5 歧义的落地回答**。

诚实标注不确定性。写架构决策，不写代码。

## 🤖 助手
我先读完所有必读材料，再开始设计。

> 🔧 工具调用 2 次: Read

## 🤖 助手
意图契约已读完。现在读金标 HTML、现有代码和计划文件。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在读现有代码，了解当前架构。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在读 globals.css（双套 token 的关键）、layout.tsx 和 test/page.tsx。

> 🔧 工具调用 3 次: Read

## 🤖 助手
我已读完核心代码。最后读一下前端方法论 skill，确保设计对齐方法论要求。

> 🔧 工具调用 1 次: Read

## 🤖 助手
全部材料读完。我现在对这个变体的设计空间有清晰的认识。让我确认几个关键的代码事实，然后产出设计。

当前架构的核心事实（影响分层决策）：

1. **globals.css 已有双套 token**：全局 `--c-gold: #d4af37` / `--c-blood: #8b0000`（桌面挤压 + welcome）+ `--champagne-*: #d8c8b0`（手机 + 天平/筹码）。32 的金标是第三套：`--gold-hyper: #FFD700` / `--purple-neon: #D800FF`。
2. **ResultScreen 的 Reveal 层**（117-210 行）是纯视觉的 stagger 揭晓序列——不承载评分/API 逻辑（那在 page.tsx），只做焦点管理（accessibility）。
3. **分享卡已经是深色**（`background: "#050308"`），但 `#view-result` 容器是米白浅色（`rgba(250,250,250,0.85)`）。
4. **CSS 特异性战争已存在**（globals.css 840-897 行大量注释处理桌面 hover 泄漏到移动端）。
5. **page.tsx 是 iframe 内的页面控制器**——TestScreen 和 ResultScreen 都挂在这里，aurora 可以放在这层跨组件存活。

---

## BLUF

本变体把 32 的赛博哥特视觉抽成**单一 `--neo-*` token 层**（迁移而非并存——香槟和旧桌面金一并退役），用 **CSS `@layer` 级联层**在代码库中划出"桌面挤压皮"和"手机赛博哥特皮"的硬边界（同一 DOM、同一 token、不同 CSS 皮肤），把 Canvas/浮雕字/极光封装为**独立的氛围层组件**挂在 page.tsx 级（跨 TestScreen→ResultScreen 组件切换存活），并让**极光完全替换 Reveal**（Reveal 的 stagger 揭晓序列删除，焦点管理逻辑迁入 ResultScreen 挂载效果）。承重决策是"`@layer` 做层边界 + 单 token 体系"；最大风险是**全局 token 迁移的爆炸半径**——`--c-gold` 从 #d4af37 改到 #FFD700 会影响 welcome 页等所有消费者，不只是答题页。

---

## 变体

**分层·视觉系统重建**（Layered Visual System Reconstruction）——32 的赛博哥特和现有挤压动效不是"两套代码"，而是"同一套 token + 同一套 DOM 上的两层 CSS 皮肤"，由 CSS `@layer` 和设备能力媒体查询划清边界。

---

## 核心抽象（5）

### 1. NeoTokenLayer（单一金紫黑 token 体系）
`globals.css` `:root` 中新建 `--neo-*` token 集，**迁移替换**而非并存：
- `--neo-gold: #FFD700`（替换 `--c-gold: #d4af37`）
- `--neo-purple: #D800FF` / `--neo-violet: #7B2CBF` / `--neo-rose: #FF0055`（替换 `--c-blood: #8b0000`）
- `--neo-void: #030305`（替换 `--c-void: #0c0a14`）
- `--neo-card-glass: rgba(12,10,18,0.65)` / `--neo-border-gold: rgba(255,215,0,0.35)` / `--neo-border-purple: rgba(157,0,255,0.3)`（替换 `--card-glass` / `--border-muted` / `--border-highlight` / 全部 `--champagne-*`）

**立场：香槟 token 完全废弃。** `--champagne-main/light/dim/bg` 全部删除，其消费者（`.balance-*` / `.weight-*` / 手机 `.opt-block` / `.question-stage`）全部重指向 `--neo-*`。旧 `--c-gold` 同样退役——welcome 页一并升级到亮金（见风险 1）。

### 2. CascadeLayerStack（CSS `@layer` 级联边界）
`globals.css` 顶部声明级联层优先级：
```
@layer reset, tokens, base, desktop-skin, mobile-skin, atmosphere, reduced-motion;
```
- **desktop-skin**：`@media (hover:hover) and (pointer:fine)` 作用域——挤压动效（flex 1→1.8→8）、金紫渐变选中态、大字号序号。
- **mobile-skin**：`@media (max-width:768px), (pointer:coarse)` 作用域——卡片堆叠、玻璃态题卡、HUD 双胶囊、01/02/03 序号。
- mobile-skin 在 desktop-skin 之后声明 → **同特异性下移动端规则自动胜出**，不再需要当前代码里 840-897 行那种"手动中和桌面 hover 泄漏"的防御性覆盖。
- **atmosphere**：Canvas/浮雕字/极光/胶片颗粒——独立层，不与皮肤层纠缠。
- **reduced-motion**：最后声明，最高优先级，覆盖所有动效。

**这是"分层"变体的承重决策。** 现有代码的特异性战争（注释里反复提到"覆盖全局第 411 行"）正是因为没有级联层边界。`@layer` 让"桌面皮"和"移动皮"成为架构层面的分层，而不是靠源码顺序和 `!important` 维持的脆弱平衡。Tailwind v4 原生支持 `@layer`。

### 3. TestAtmosphereLayer（氛围层组件）
**新建 `src/components/TestAtmosphere.tsx`**——自包含的背景层，挂在 TestScreen 内部（iframe 作用域，R31）：
- `<canvas>` 紫粒子（45 粒子，rAF，`rgba(216,0,255,α)`，shadowBlur=10）
- `.bg-typography` 浮雕字（Syne 800，28vw，内容=当前题号 `01..26`，由 prop 驱动）
- `.film-grain` 胶片颗粒（SVG noise，opacity 0.04）
- 设备感知：低端设备（`deviceMemory < 4` 或小屏）粒子上限降到 ~20
- reduced-motion 守卫：`prefers-reduced-motion: reduce` 时 Canvas 不渲染、不启动 rAF（A1 读法 A）

**与现有氛围层的接缝**：宿主页 `public/index.html` 的 abyss-canvas/noise/cursor 不动（非目标）。TestAtmosphere 只在 iframe 内（`/test` 作用域）渲染，z-index 在题卡之下、宿主页氛围层之上。

### 4. AuroraTransitionGate（极光转场门控）
**page.tsx 级的转场控制器**——极光层跨 TestScreen→ResultScreen 组件切换存活：
- 状态机：`transitionPhase: "idle" | "aurora-expanding" | "aurora-hold" | "aurora-fading" | "done"`
- Q26 被选中 → TestScreen 调 `onFinalAnswer` 回调（替代直接 `onComplete`）→ page.tsx 设 `aurora-expanding` + 同时开始 fetch `/api/match`（并行）
- 极光圆点 `scale 1→250`（~800ms）覆盖全屏 → 到峰值时若 match 就绪 → 挂载 ResultScreen（极光仍覆盖）→ `aurora-fading`（opacity→0，400ms）→ 揭晓结果
- **完全替换 Reveal**（A2 读法 A）：ResultScreen 的 `REVEAL_TIMINGS` stagger 序列、`revealVis` 状态机、skip 逻辑全部删除。结果内容改用简单的 mount fade-in（`opacity 0→1 + translateY`，0.8s）
- Reveal 的焦点管理（accessibility）迁入 ResultScreen 的 `useEffect`：挂载后 100ms focus 结果容器

**极光层与 Reveal 不共处——极光消灭 Reveal。** 理由：32 没有 stagger 揭晓；用户要"完全一样"；stagger 增加 4.6s 延迟是摩擦；极光本身已经是更强的戏剧转场。

### 5. EditorialResultLayout（结果页分层重构）
**ResultScreen.tsx 完全重写**为 32 的塔罗分栏深色布局：
- `#view-result`：`--neo-void` 底，`min-height:100vh`（**不** `height:100vh` + `overflow:hidden`，C2 修复），允许自然滚动
- `.editorial-grid`：`≥850px` → `grid-template-columns: 380px 1fr`；`<850px` → 单列
- `.tarot-card-frame`：`aspect-ratio:3/4`，金边 + 紫 glow + 渐变深紫底，内含五角星 SVG（`polygon` 10 点）+ 角色名占位
- `.stat-bars-container`：posture A/B/C 三行霓虹柱图（`--neo-violet → --neo-purple → --neo-gold` 渐变 + glow），入场宽度动画（`width 1.2s`）
- `.verdict-editorial-card`：prosecution（金标）+ softlanding（紫标）
- `.action-row`：主按钮（金紫渐变 + 深色字）+ 次按钮（透明浅边）
- 分享卡子层保留（**已是深色** `#050308`，无需改动——A4 读法 A 的冲突点其实不存在）

**结果页的分层**：背景层（`--neo-void`）→ 内容层（editorial-grid）→ 分享卡层（离屏 html-to-image）。不再有 Reveal overlay 层。

---

## 数据流（Q26 → 结果揭晓，端到端）

```
Q26 选中
  → TestScreen.handleSelect: isLast=true, pendingRef 设好
  → flushPending: 检测 isLast → 调 onFinalAnswer（不直接 onComplete）
  → page.tsx: transitionPhase="aurora-expanding"
     ├── 极光 <div class="aurora-burst active"> 开始 scale 1→250（CSS transition 1.2s）
     └── 并行 fetch /api/match + /api/results
  → ~800ms 后极光覆盖全屏，match 通常已返回
  → page.tsx: setShowResult(true) → ResultScreen 挂载（极光仍覆盖在上）
  → page.tsx: transitionPhase="aurora-fading" → 极光 opacity→0（400ms）
  → ResultScreen: editorial-grid 渲染，stat-bars 入场动画，mount fade-in
  → 极光消失 → 用户看到深色塔罗分栏结果页
```

---

## 关键决策（6 条，归入 4 类）

### 类一：Token 体系

- **Token：迁移替换，非并存** → `--neo-*` 单一体系，香槟 + 旧桌面金全部退役
  - **原因：** 三套金色（#d4af37 / #d8c8b0 / #FFD700）并存是视觉混沌的根源；interface-details 方法论的 consistency 原则（"不一致的细节比没有更糟"）强制统一。
  - **否决：** ① **并存方案**（`--neo-*` 与 `--champagne-*` 共存，按页面切换）——输在维护成本翻倍 + grep 断言（完成判定 §2 第 4 条）无法通过。② **只迁移答题页、welcome 保留 #d4af37**——输在两套金色跨页面跳变，iframe 内 welcome→test 切换时金色突变用户可感知。

- **挤压选中态用金紫渐变（A3 读法 B）** → `.opt-block.is-selected` = `linear-gradient(135deg, rgba(255,215,0,0.15), rgba(216,0,255,0.15))` + 金边 + glow；dimmed = 中性灰 `rgba(255,255,255,0.03)`
  - **原因：** 与手机端 `.opt-btn.selected`（32 原版）同一渐变公式，视觉语言跨端统一；dimmed 用中性灰避免未选中项被紫色污染。
  - **否决：** ① **纯金 #FFD700 选中**（A3 读法 A）——输在桌面 selected 是大面积填充，纯金过亮刺眼，渐变更接近 32 的微妙质感。

### 类二：层边界

- **CSS `@layer` 做桌面/移动皮肤边界** → 级联层 `reset → tokens → base → desktop-skin → mobile-skin → atmosphere → reduced-motion`
  - **原因：** 现有代码的特异性战争（840-897 行手动中和 hover 泄漏）证明"靠源码顺序 + `!important`"不可持续；`@layer` 让层边界成为架构决策而非实现技巧，mobile-skin 自动覆盖 desktop-skin。
  - **否决：** ① **两套独立 CSS 文件**（desktop.css / mobile.css）——输在 Tailwind v4 的 `@import "tailwindcss"` 已接管全局，拆文件破坏构建链 + 增加加载复杂度。② **CSS Modules 按端隔离**——输在同一 DOM 节点需要两个 class 名（`.opt-block-desktop` / `.opt-block-mobile`），JSX 要条件渲染，违反"同一 DOM、CSS 切换"的核心哲学。

- **极光放在 page.tsx 级，不放 TestScreen 级** → AuroraTransitionGate 是页面控制器的一部分
  - **原因：** 极光需要跨 TestScreen→ResultScreen 组件切换存活（覆盖 DOM swap 瞬间）；放 TestScreen 里会在 unmount 时消失，露出 swap 空白。page.tsx 是两个组件的共同父级，满足 R31"iframe 内部"约束。
  - **否决：** ① **放 TestScreen 里，用 `position:fixed` + `z-index:200` 试图存活**——输在 React unmount 会移除 DOM，fixed 定位救不了。② **放宿主页 public/index.html**——输在违反 R31（背景层加在 iframe 内）。

### 类三：转场

- **极光替换 Reveal（A2 读法 A）** → stagger 揭晓序列删除，焦点管理迁入 mount effect
  - **原因：** Reveal 经核查不承载评分/API 逻辑（那在 page.tsx 的 `handleComplete`），只做焦点管理——可安全迁出；32 没有 stagger；4.6s 延迟是摩擦。
  - **否决：** ① **极光叠加在 Reveal 上**（A2 读法 B）——输在两层动效视觉冲突 + 总时长 5.4s（800ms 极光 + 4.6s Reveal）不可接受。② **保留 Reveal 文字、只换背景为极光**——输在"审判结束了"/"而你是——"这套文案不在 32 里，加了就不"完全一样"。

### 类四：结果页

- **米白主题完全废弃，分享卡同步深色（A4 读法 A）** → `#view-result` 改 `--neo-void`，分享卡保持已有深色
  - **原因：** 分享卡代码核查发现**已经是深色**（`background: "#050308"`），所以"同步深色"零成本；`rgba(250,250,250,0.85)` 米白是唯一的浅色残留，直接删除。
  - **否决：** ① **分享卡保留米白**（A4 读法 B）——输在用户截屏分享时深色结果页 + 浅色分享卡视觉断裂，且需要维护两套配色。

- **天平/筹码全端金紫黑（A5 读法 A）** → `.balance-*` / `.weight-*` 的 `--champagne-*` 全换 `--neo-*`
  - **原因：** 决策表未区分端；桌面普通题（金紫黑）+ 手机天平（金紫黑）+ 桌面天平若保留香槟会三色割裂。
  - **否决：** ① **桌面天平保留香槟玻璃态**（A5 读法 B）——输在与桌面普通题的金紫黑冲突。

---

## 被拒绝的替代方案（2-3 个）

1. **"三 token 并存 + 按页面/组件切换"方案** —— 保留 `--c-gold`（welcome）/ `--champagne-*`（天平筹码）/ 新增 `--neo-*`（32 答题+结果），用 CSS 作用域或 body class 切换。**拒绝理由：** 三套金色（#d4af37 / #d8c8b0 / #FFD700）意味着三个"金色"语义，维护时每个新组件要猜"该用哪个金"；完成判定 §2 的 grep 断言（`rg 'd8c8b0|champagne'` 期望 0 命中）直接失败。这个方案是"最小改动"的诱惑，但它是技术债的起点。

2. **"Canvas 粒子全端启用 + 桌面也复刻 32 玻璃题卡"方案** —— 不只手机端，桌面也上 Canvas + 玻璃题卡 + HUD 双胶囊，完全统一。**拒绝理由：** 决策 1 明确"桌面保留挤压动效，只升级配色 + 补背景层"——桌面上玻璃题卡（`backdrop-blur 30px`）会和挤压动效（flex 变化 + backdrop-blur 8px 的 opt-block）两层 backdrop-blur 叠加，GPU 负担 + 视觉层次混乱。挤压动效需要干净的背景才能让"选中放大、其余缩小"的布局变化清晰可读；Canvas 粒子在桌面会分散注意力。**但** Canvas 粒子和浮雕字作为氛围层在桌面"可以有"（低密度），只是不作为主角——这是刻意留的扩展点。

3. **"极光 + Reveal 两层动效串行"方案** —— 极光先覆盖（800ms），然后 Reveal stagger 在结果内容上播放（4.6s），总过渡 5.4s。**拒绝理由：** 32 没有 stagger 揭晓；5.4s 过渡对于"答完题想看结果"的用户是纯摩擦（interface-details 方法论 motion 章节的高频暴露应更安静）；极光已经是足够强的戏剧转场，stagger 是画蛇添足。

---

## 主要风险（3，按风险排序）

### 风险 1（最高）：全局 token 迁移的爆炸半径
`--c-gold: #d4af37` → `--neo-gold: #FFD700` 是**全局变更**——welcome 页的 hero-badge、art-btn-enter、cursor-dot、progress-line 等所有消费者都会从哑光古金变成超亮黄金。#d4af37（RGB 212,175,55）和 #FFD700（RGB 255,215,0）色相相近但饱和度/明度差异显著，welcome 页如果曾围绕哑光质感精调，亮金可能显得刺眼。
**缓解：** 迁移后跑一次 welcome 页视觉回归（手动截图对比）；如果 welcome 不可接受，退路是把 welcome 的 hero 元素局部 override 回哑光金（`--welcome-gold: #d4af37` 作用域 token），但这只影响 welcome，不影响 test/result 的 `--neo-gold` 统一。标注为"低风险默认"——welcome 页升级到亮金大概率是改善而非回归，因为整个项目的视觉语言正在统一到 32 的赛博哥特。

### 风险 2（中）：Canvas rAF + backdrop-blur 在 iframe 内的 GPU 竞争
TestAtmosphere 的 Canvas（45 粒子 rAF + shadowBlur）和玻璃题卡（`backdrop-blur 30px saturate 180%`）在手机端同时运行，两层 GPU 重计算。iframe 环境下浏览器可能已经对 backdrop-filter 做了优化降级，叠加 Canvas 可能导致掉帧。
**缓解：** ① 低端设备检测（`navigator.deviceMemory < 4` 或 `hardwareConcurrency <= 4`）粒子上限降到 20；② `document.hidden` 时暂停 rAF（Page Visibility API）；③ Canvas 用 `will-change: transform` 提示合成层；④ 如果真机测试仍掉帧，退路是手机端 Canvas 降级为 CSS 静态紫色光点（几个 `radial-gradient` 定位元素），牺牲动感保流畅。

### 风险 3（中）：极光转场时序与网络请求的竞态
极光 800ms 扩展 + 400ms 淡出 = 1.2s 总过渡。`/api/match` + `/api/results` 两个串行 fetch 在弱网下可能 >1.2s，导致极光淡出后 ResultScreen 还没挂载（用户看到黑屏空白）。
**缓解：** 极光扩展到峰值后**保持覆盖**（`aurora-hold` 态），直到 match 就绪才开始淡出——即"极光等网络"而非"网络赶极光"。设一个最长 hold 上限（如 3s），超时显示一个极简加载提示（金紫进度环）在极光覆盖层上。这样弱网下用户看到的是"极光停在满屏 → 结果浮现"，而非黑屏。

---

## 对 5 歧义的落地回答

| 歧义 | 我的决定 | 理由 / 不确定性 |
|------|---------|----------------|
| **A1** Canvas 降级 | **读法 A（reduced-motion 时完全禁用）** | 与现有项目一致（已有 reduced-motion 禁用动效路径）。低端设备（非 reduced-motion）粒子上限降到 20 保性能。低风险默认。 |
| **A2** 极光 vs Reveal | **读法 A（极光替换 Reveal）** | 已核查：Reveal 不承载评分/API 逻辑（在 page.tsx），只做焦点管理 → 迁入 ResultScreen mount effect。stagger 文案删除（32 没有）。极光放 page.tsx 级跨组件存活。 |
| **A3** 挤压配色融合 | **读法 B（金紫渐变 selected + 中性灰 dimmed）** | selected 用 `linear-gradient(135deg, rgba(255,215,0,0.15), rgba(216,0,255,0.15))`——与手机端 `.opt-btn.selected` 同一公式，跨端统一。dimmed 中性灰避免紫色污染。 |
| **A4** 分享卡 + 米白废弃 | **读法 A（同步深色，米白完全废弃）** | **代码核查发现分享卡已经是深色**（`background: "#050308"`），所以"同步深色"零改动。唯一的浅色残留是 `#view-result` 的 `rgba(250,250,250,0.85)`，直接删。A4 标注的"产品取舍"在我核查后技术层面不成立——没有浅色分享卡需要保留。 |
| **A5** 天平/筹码端范围 | **读法 A（全端金紫黑）** | `--champagne-*` 全退役，`.balance-*` / `.weight-*` 重指向 `--neo-*`。决策表未区分端，统一最安全。 |

---

## 扩展点

- **留开放：** Canvas 粒子密度通过 prop 可调（`TestAtmosphere` 接受 `particleCount` prop），未来桌面端如果想加低密度粒子氛围只需传一个较小值，不用改组件结构。塔罗框的 `<img className="character-img">`（32 原版有此元素，`display:none`）保留在 DOM 里，后续换真立绘只需设 src + display。
- **关闭（YAGNI）：** ① 不给极光层做多色彩主题切换（金紫黑是唯一语言）；② 不给 `@layer` 做运行时动态重排（级联层顺序编译期固定）；③ 不引入第 6 角色 mami_facade（00-seed 锁定 5 角色）；④ 不做 en/ja/zh-TW 翻译（仅中文）；⑤ 不给桌面端加 3D Tilt（决策 1 已否决）。

---

## 改/新增文件清单

| 文件 | 动作 | 核心变更 |
|------|------|---------|
| `src/app/globals.css` | **大改** | token 迁移（`--neo-*` 替换 `--c-*`/`--champagne-*`）+ `@layer` 级联层重构 + 新增 HUD 双胶囊/玻璃题卡/极光/editorial-grid/tarot/stat-bars 样式 + 删除米白结果页主题 |
| `src/components/TestScreen.tsx` | **大改** | HUD 双胶囊顶栏替换 test-header、玻璃题卡包裹、progress-fill 金紫渐变、watermark 改题号 01..26、集成 TestAtmosphere、最后一题触发 `onFinalAnswer`（非 onComplete）、天平/筹码 token 迁移 |
| `src/components/TestAtmosphere.tsx` | **新建** | Canvas 紫粒子 + bg-typography 浮雕字 + film-grain + aurora-burst 氛围层组件 |
| `src/components/ResultScreen.tsx` | **完全重写** | editorial-grid 深色塔罗分栏、tarot-card-frame 五角星占位、stat-bars 霓虹柱图、verdict-editorial-card、删除 Reveal stagger 序列（REVEAL_TIMINGS/revealVis/skipReveal 全删）、焦点管理迁入 mount effect、分享卡保留 |
| `src/app/test/page.tsx` | **中改** | AuroraTransitionGate 状态机（transitionPhase）、`onFinalAnswer` 回调协调极光与 fetch、移除 loading spinner 与极光的视觉冲突 |

**不动的文件**：数据层（`src/data/quiz-content.ts`）、评分（`src/lib/answer-processor.ts` / `match.ts`）、API 路由、prisma schema、宿主页 `public/index.html`、layout.tsx（字体已就绪）。
