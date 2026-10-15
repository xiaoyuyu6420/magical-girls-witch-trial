# 你是 architect（架构师），为「HTML 32 视觉重做」项目独立设计一个**「最小侵入·token+加层...

- 会话 ID: `sess_subagent_agent_4fe6ac56-9e3a-4fd8-a0b0-8f58b15eb25d`
- 时间: 2026-08-13 11:34:26 → 2026-08-13 11:37:46
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
你是 architect（架构师），为「HTML 32 视觉重做」项目独立设计一个**「最小侵入·token+加层」**变体的技术方案。你不参考其他 architect，独立产出。

## 项目
根目录 `/Users/munich/Desktop/独立项目/magical-girls`。Next.js 16（app router）+ React 19 + TS 5.9 + Tailwind v4 + Prisma/SQLite + Vitest + Playwright。答题页路由 `/test`，作为 iframe 嵌入 `public/index.html` 宿主。

## 必读（先全部读完再设计）
1. `crucible/10-intent-contract.md` —— 意图契约 + **完成判定（V1-V24 视觉对照 + P1-P13 回归保护）** + 5 歧义。这是你设计的依据。
2. `crucible/00-seed.md` —— 目标 + 三决策 + 项目现状。
3. `/Users/munich/Downloads/ai_studio_code (32).html` —— **逐像素金标**。答题页（金紫黑赛博哥特：Canvas 紫粒子/3D Tilt/极光转场/HUD双胶囊/浮雕字/玻璃题卡）+ 结果页（塔罗立绘框+杂志分栏+posture霓虹柱图）。
4. `.zcode/plans/plan-sess_b1722a51-cd67-47da-8d30-5b08144626bb.md` —— 四阶段计划。
5. 现有代码：`src/components/TestScreen.tsx`（答题页，当前香槟风+桌面flex挤压+SVG天平+点阵筹码）、`src/components/ResultScreen.tsx`（结果页，单栏米白）、`src/app/globals.css`（914行，双套token：桌面金紫黑#d4af37 + 移动香槟#d8c8b0）、`src/app/layout.tsx`（Syne/Cinzel/Noto Serif SC已加载）、`src/app/test/page.tsx`（iframe挂载，含Reveal揭晓层）。
6. 前端方法论：`/Users/munich/.zcode/skills/interface-details/SKILL.md`（设计决策门：克制、prefers-reduced-motion、一致性）。

## 不可推翻的三决策（用户已锁定）
1. **桌面答题保留 flex 挤压动效**（不换3D Tilt），只升级配色到金紫黑 + 补 32 背景层（Canvas粒子/浮雕字/极光转场）。手机端完全复刻 32。
2. **天平(Q8/Q22)/筹码(Q14)保留 SVG天平+点阵视觉**，只把配色香槟→金紫黑。不回退成普通选项/步进器。
3. **结果页用 32 五角星SVG占位符**。

## 两硬约束
- C1 不准提前结束（跑到 done）。
- C2 不准有细节损失——P1-P13 现有功能（26题/5角色/posture评分/i18n/分享卡/批注/键盘/reduced-motion/视觉测试/E2E/单测）不得降级。

## 你的变体聚焦：「最小侵入·token+加层」
优先**复用现有 DOM 结构和 CSS 类**，通过三层手段达成目标：
- (a) **改 CSS token**：把香槟 `--champagne-*` 引用点替换为金紫黑新 token（`#FFD700`/`#D800FF`/`#7B2CBF`/`#FF0055`/`#030305`）；现有桌面金紫黑 `#d4af37` 升级到更鲜艳的 32 配色。
- (b) **新增独立背景层组件**：Canvas 紫粒子、浮雕字 JUDGENT+题号、极光转场 aurora-burst 作为**新的叠加组件**加到 TestScreen/结果页，不动现有题卡/选项逻辑。
- (c) **结果页 ResultScreen 重写**：单栏米白 → 32 塔罗分栏金紫黑（这是必须重写的，无法最小侵入）。

核心问题：**如何用对 TestScreen 现有挤压/天平/筹码逻辑最小的触碰，达成 V1-V24 的 32 视觉？** 桌面挤压选中态配色怎么从金色升级到金紫渐变（A3）？极光转场如何与现有 Reveal 揭晓层共处（A2，需核查 Reveal 是否承载非视觉职责）？

## 输出格式（你的最终消息，不落盘文件）
1. **BLUF**（3-5 行）：这个方案一句话核心 + 最关键权衡。
2. **核心抽象（≤5）**：方案的关键模块/层/机制，每个一句话。明确指出：改哪些文件、新增哪些文件、CSS token 怎么组织、背景层组件怎么挂。
3. **被拒绝的替代方案**（2-3 个）：你考虑过但否决的做法，每个一句话理由。
4. **主要风险（≤3）**：这个方案最可能出问题的地方。
5. **对 5 歧义的落地回答**：A1/A2/A3/A4/A5 在你这个方案里具体怎么做。

要诚实标注不确定性。不要写代码，写架构决策。

## 🤖 助手
我先读完所有必读资料，然后独立产出方案。先并行读核心文档。

> 🔧 工具调用 3 次: Read

## 🤖 助手
契约和 seed 读完了。plan 是旧版（香槟色+保留 ResultScreen），以 10-intent-contract 为准。现在并行读现状代码。

> 🔧 工具调用 3 次: Read

## 🤖 助手
关键发现：Reveal 层承载非视觉职责（状态机、aria-hidden、聚焦管理、edge blur 检测），且时间点在 ResultScreen 内部，与极光转场（TestScreen Q26 末尾）是先后关系，不是同点叠加。现在读 globals.css（token 结构）、layout.tsx（字体），并 grep 32 HTML 的关键实现片段。

> 🔧 工具调用 2 次: Read

## 🤖 助手
代码现状清晰了。关键发现：移动端大量硬编码色值（不只 token 引用），Reveal 层承载状态机/aria/聚焦/edge-blur 职责。现在针对性提取 32 HTML 的转场时序和关键结构（A2 决策依赖），并读 interface-details 方法论。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
确认 32 HTML 的极光转场在 `nextQuestion()` 里的精确时序（A2 决策核心）。

> 🔧 工具调用 2 次: Read

## 🤖 助手
全部必读资料消化完毕。关键确认：32 HTML 的 `triggerFinalTransition`（行 1490-1513）是单一极光过渡（100ms 触发 → 800ms 切换 → 400ms 淡出），**结果页直接显示，没有 ResultScreen 内部的 stagger 揭晓序列**。现有 Reveal 层（ResultScreen 4.6s 序列）承载 revealPhase 状态机、aria-hidden、聚焦管理、edge-blur 检测等非视觉职责。这两点共同决定了 A2 的落地方式。

---

# 架构提案 · 变体「最小侵入·token+加层」

## BLUF

这个方案的哲学是**换皮不换骨**：TestScreen 的挤压/天平/筹码/键盘/批注/进度逻辑全部零触碰，只通过三层手段达成 32 视觉——(a) globals.css 的 token 重映射 + 移动端硬编码色值批量替换、(b) 独立的 `<BackgroundLayers>`（Canvas 粒子 + 浮雕字）和 `<AuroraBurst>` 作为叠加组件挂进 TestScreen/test-page、(c) ResultScreen 是唯一必须重写的（米白单栏 → 金紫黑塔罗分栏）。**最关键的权衡是极光转场与现有 Reveal 层的关系**：极光替换 Reveal 的 stagger 视觉壳（用户要"和 32 一样"，32 只有极光、无揭晓序列），但保留 Reveal 承载的状态机骨架/aria-hidden/聚焦管理/edge-blur——否则 C2（a11y/键盘回归）必爆。**最大的单一风险**是移动端几十处硬编码 `rgba(216,200,176,...)`/`rgba(18,18,22,...)` 无法靠改 `:root` token 覆盖，批量替换易漏，残留香槟直接判 R1 失败。

---

## 核心抽象（5 个承重模块）

1. **Token 重映射层（`src/app/globals.css`）**
   - 在 `:root` 新增 32 token：`--gold-hyper:#FFD700` / `--purple-neon:#D800FF` / `--violet-deep:#7B2CBF` / `--rose:#FF0055` / `--void:#030305`。把旧 `--c-gold:#d4af37` 升级为 `#FFD700`，`--c-blood:#8b0000` 退役（改用 `--purple-neon`/`--rose`）。
   - 香槟 token（`--champagne-*`）不保留切换能力，直接把定义点改成指向新金紫 token（`--champagne-main: var(--gold-hyper)` 等）——这样所有 `var(--champagne-main)` 引用自动跟随，零改动。
   - **但移动端 `@media(max-width:768px)` 块内有几十处硬编码 `rgba(216,200,176,...)`/`rgba(18,18,22,...)`/`rgba(212,175,55,...)`（见 globals.css 行 675-895），必须批量 sed 替换为 `rgba(255,215,0,...)`/`rgba(216,0,255,...)` + 中性墨色。这是 token 层最重的工作量。**
   - 顺手修一个潜在 bug：`--f-syne:'Syne',sans-serif` 不会命中 next/font 加载的字体（next/font 注入的是带 hash 的 `__Syne_xxxx`），应改 `var(--font-syne)`。否则 V6/V8 的 Syne 序号实际回退到系统 sans-serif。

2. **`<BackgroundLayers>` 背景层组件（新增 `src/components/test/BackgroundLayers.tsx`）**
   - 封装 Canvas 紫粒子（rAF，~45 粒子，`rgba(216,0,255,α)`，`shadowBlur=10`）+ 浮雕题号（Syne 800、28vw、`rgba(255,255,255,0.012)`）。
   - props：`questionIndex:number`（浮雕字渲染 `String(index+1).padStart(2,'0')`）、`reducedMotion:boolean`（true 时不挂 canvas、不启 rAF，浮雕字保留）。
   - 挂载点：TestScreen 的 `.view-test` 内、z-index 低于题卡。**不动现有 `.watermark-index`**——直接复用这个 DOM 节点改渲染内容（ROMAN → 阿拉伯题号）+ 升级 className 接入新浮雕样式，避免新增重叠层。

3. **`<AuroraBurst>` 极光转场组件（新增 `src/components/test/AuroraBurst.tsx`）**
   - 纯视觉覆盖层：10px 圆点 `scale(1→250)`，`radial-gradient(gold→purple→void)`，1.2s transition。
   - **挂在 `src/app/test/page.tsx` 根 div，不属于任何 screen**——它是答题→结果的桥。由 test/page.tsx 新增的 `phase: 'testing'|'aurora'|'result'` 状态机驱动。
   - 时序（对齐 32 的 triggerFinalTransition）：Q26 选中 → TestScreen `onComplete` → test/page.tsx `setPhase('aurora')` 并**同时** fire `/api/match`（极光与 API 并行，极光掩盖网络延迟）→ `max(极光 800ms, API 就绪)` 满足后 `setPhase('result')` → ResultScreen 挂载、极光淡出。

4. **HUD 双胶囊（TestScreen header 局部重构，改 `src/components/TestScreen.tsx` 行 584-631）**
   - 把现有两个裸 button（返回 SVG + EXIT）包进 `.hud-capsule` 玻璃态胶囊。左胶囊：PREV（返回，Q1 隐藏）+ 计数器 `NN/26`（紫色斜杠）。右胶囊：RESTART（原 EXIT）。
   - **改动局限在 header 的 JSX 结构**，按钮 onClick/handleBack/handleExit 零触碰，进度条 `#progress-line` DOM 不动只改 CSS（三段渐变 `violet-deep→purple-neon→gold-hyper` + 紫光 shadow）。

5. **ResultScreen 重写（`src/components/ResultScreen.tsx` 完全重构）**
   - 结构：`editorial-grid`（≥850px：`380px 1fr`；<850px：单列）+ 左栏塔罗立绘框（3:4、金边、紫 glow、五角星 polygon SVG + 角色名占位）+ 右栏（result-header-badge / 渐变标题 / tag-cloud / verdict 卡 / posture 霓虹柱图 / action-row）。
   - **滚动修复（V16/V24 根因）**：移除 `#view-result` 的 `height:100vh` + `overflow:hidden` + `align-items:center`，改 `min-height:100vh` + 正常文档流滚动 + `align-items:flex-start`。同时移除 profileRef 的 `maxHeight:100vh` 内部 overflow 方案（那是补丁，治标）。
   - **Reveal 层简化**：移除 stagger 文字序列（审判结束/而你是/角色名 blur cross-fade，对应行 560-636），保留 `revealPhase` 状态机、`revealVis`→简化为即时 done、`aria-hidden` 切换、`resultLayoutRef` 聚焦、`skipReveal`（现跳过极光）、edge-blur 检测。极光已在 test/page.tsx 播完，ResultScreen 挂载即接近 done。
   - 数据契约 `ResultData`（prosecution/softlanding/tags/posturePct）不变，评分/5 角色/i18n 零触碰。

---

## 被拒绝的替代方案

1. **全局重写 TestScreen 为 32 的 DOM 结构（.opt-btn/.card/.hud-header 全套）** —— 否决：直接违反"最小侵入"变体哲学；会冲击桌面 flex 挤压（`.opt-block` flex:1.8→8）、天平 SVG、筹码点阵、键盘映射（keyMap 依赖 `.opt-block` querySelectorAll）、批注插页 overlay、i18n filter——回归面太大，C2（P7 键盘/P6 批注/P12 E2E 117 用例）几乎必爆。当前 DOM 通过 className 作用域 + token 替换即可达成 V1-V14，不值得推倒。

2. **用 data-theme 属性保留香槟/金紫双套主题切换** —— 否决：用户明确要废弃香槟、统一金紫黑。保留切换能力是技术自嗨（serves the ego, not the user——违反 interface-details 决策门第 1 条），双套 token 并存加倍维护负担且增加"残留香槟"的失败模式。香槟直接退役。

3. **极光转场叠加在 Reveal stagger 之上两层并存** —— 否决：极光(800ms) + Reveal(4600ms) = 5.4s 过渡，冗长且两段"揭晓"语义冲突（极光已全屏爆裂覆盖，其下再播"审判结束了/而你是"文字序列读起来错位）。32 只有极光，用户要"完全一样"。

---

## 主要风险（按风险排序，≤3）

1. **移动端硬编码色值遗漏 → R1 香槟残留（C2 高危）**
   globals.css 移动端块（行 675-895）有几十处 `rgba(216,200,176,...)`/`rgba(18,18,22,...)`/`rgba(212,175,55,...)` 硬编码，不全是 token 引用。批量 sed 替换易漏，漏一处就残留香槟/脏铜色，R1（手机端不残留香槟）直接失败。
   **缓解**：分两步——(1) `rg -n '216, ?200, ?176|d8c8b0|champagne' src/` 批量定位后逐处替换为 `var(--gold-hyper)`/`var(--purple-neon)` 或对应 rgba；(2) 完成判定 §2 的 grep 零命中门 + 手机端 375×812 逐题截图对比 32 作为关闭条件。这是 token 层最重、最易翻车的部分，必须留独立的验收子任务。

2. **极光与 API 时序竞态 → 过渡卡顿或白屏**
   慢网络下极光 800ms 结束但 `/api/match` 未返回；快网络下 API 秒回但极光还在播。处理不当会出现极光后白屏等待，或结果闪现在极光之下。
   **缓解**：`phase:'aurora'` 的退出条件是 `max(极光最小展示 800ms, API 就绪)` 两者都满足（Promise.all 思路）。极光最小展示结束后若 API 仍未就绪，极光保持全屏覆盖（不淡出）直到 API 返回——极光本身就是优雅的 loading 态。降级路径：极光组件独立，API 失败回退现有 submitError 态不受影响。

3. **Reveal 简化误伤 a11y/聚焦链/edge-blur（C2 P7/P8）**
   移除 stagger 文字 JSX 时，若顺手删了 `revealPhase` 状态机、`aria-hidden={revealPhase!=='done'}`、`resultLayoutRef.focus()`、`needsEdgeBlur` 检测，会导致结果页 tab 顺序错乱、读屏读到隐藏内容、长内容边缘无 blur 提示——这些都是现有 a11y 细节，C2 不准降级。
   **缓解**：只删 stagger 文字相关的 JSX 节点 + 对应的 REVEAL_TIMINGS setTimeout 调度，**保留所有 useRef/useEffect/状态机骨架**。revealPhase 在 ResultScreen 挂载时快速（或即时）翻到 done，aria-hidden/聚焦/edge-blur 链路原样保留。改完后跑 P7（键盘 tab）/P8（reduced-motion）/读屏抽查三道关闭门。

---

## 对 5 歧义的落地回答

- **A1（Canvas 降级）→ 读法 A 禁用。** `<BackgroundLayers>` 收到 `reducedMotion=true` 时**不渲染 canvas 元素、不启动 rAF**（与现有 `@media(prefers-reduced-motion)` 禁动效一致）。浮雕字保留（纯静态文字，无动画，不触发 reduced-motion）。低端非-reduced 设备粒子上限可降到 ~20 保性能（H1 允许 ±15）。

- **A2（极光 vs Reveal）→ 读法 A 替换，但"替换视觉壳、保留非视觉骨架"。** 这是本方案最关键的决策。核查确认：Reveal 层**确实承载非视觉职责**（revealPhase 状态机、aria-hidden、resultLayoutRef 聚焦、skipReveal、edge-blur 检测），不能整个删。落地：极光 `<AuroraBurst>` 挂在 test/page.tsx 作为 `phase` 转场（与 API 并行，掩盖延迟），**替换 Reveal 的 stagger 文字视觉**（移除"审判结束/而你是/角色名 blur"4.6s 序列），**保留 revealPhase 状态机骨架与所有 ref/effect**——ResultScreen 挂载时 revealPhase 快速/即时翻 done，aria-hidden/聚焦/edge-blur 链路原样工作。这样视觉上只有一段极光（符合 32），非视觉职责零损失。

- **A3（桌面挤压金紫）→ 读法 B 金紫渐变 + 中性灰 dimmed。** `.opt-block.is-selected`（globals.css 行 417-422）背景从 `rgba(212,175,55,0.2)` 改为 `linear-gradient(135deg, rgba(255,215,0,0.15), rgba(216,0,255,0.15))` + 金边 `#FFD700` + 金紫 glow；`.is-dimmed` 从 `background:transparent` 改为**中性灰** `rgba(255,255,255,0.04)` + `opacity:0.4`（不用深紫，避免未选中项被色彩污染）。hover 态（行 412-414）的 `rgba(212,175,55,...)` 同步升级到金紫。挤压动效 flex 值（1.8/8/0.01）零触碰。

- **A4（分享卡 + 米白废弃）→ 读法 A 同步深色（标注：spec 推荐用户拍板，我按推荐执行）。** 分享卡离屏 DOM（ResultScreen 行 643-754）改金紫黑深色（`#030305` 底 + 金紫文字），米白 `rgba(250,250,250,0.85)` 完全废弃。**注意实现坑**：html-to-image 对 `backdrop-filter` 支持差，分享卡必须用**实色背景**（不用玻璃态），五角星/文字用实色 + box-shadow，避免截图丢层。这是低风险默认——若用户最终选 B（分享卡保米白），仅需回退分享卡这一个 DOM 节点的配色，ResultScreen 主体不受影响。

- **A5（天平/筹码端范围）→ 读法 A 全端金紫黑。** 天平 SVG（TestScreen 行 383-402）`color` 从 `var(--champagne-main)` 改 `var(--gold-hyper)`（注：token 重映射后 `--champagne-main` 已指向 `--gold-hyper`，此处自动跟随，但显式写更清晰）；`.balance-pan`/`.balance-pan.is-down`/`.node-dot.active`/`.btn-confirm-weight.active` 的香槟引用（globals.css 行 460-505）全部跟随 token 重映射到金紫。SVG 天平倾斜动效（rotate ±7deg）、筹码点阵 cycleSlot 逻辑、落锤校验（总和=3）零触碰。

---

## 扩展点（刻意留/刻意不留）

- **留开放**：`<BackgroundLayers>` prop 化（questionIndex/reducedMotion），未来可加胶片颗粒、极光常态等更多背景层而不动 TestScreen。塔罗框五角星 SVG 是独立占位组件，未来换真角色立绘只换组件内部。
- **关闭（YAGNI）**：不抽象"主题系统"（data-theme 切换）——香槟直接退役，不保留切换能力（双套 token 是维护负担 + 残留风险源）。不为 en/ja/zh-TW 翻译新增视觉文案（00-seed 仅中文）。不引入第 6 角色 mami_facade（明确非目标）。

---

**不确定性的诚实标注**：A4 是产品取舍非技术问题（spec 明确建议用户拍板），我按推荐读法 A 执行，回退成本极低（单 DOM 节点）。极光与 API 的 `max()` 时序具体阈值（800ms 是否在所有机型够极光动画跑完）需实现时在真机校准——标为低风险默认。`--f-syne` 字体变量 bug 是实现层细节，不影响架构，但影响 V6/V8 的 Syne 序号是否真的生效，实现时必须修。
