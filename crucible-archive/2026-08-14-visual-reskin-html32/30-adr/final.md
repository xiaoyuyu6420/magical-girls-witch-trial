# 30-adr · HTML 32 视觉重做 · 最终架构决策记录（融合 ADR）

> 角色：arbitrator（仲裁者）。融合 3 个变体 + 亲自查证代码/E2E/token 后的单一决策记录。
> 创建时间：2026-08-13
> 依据：`crucible/10-intent-contract.md`（V1-V35 + P1-P13 + 歧义 A1-A5）、`crucible/00-seed.md`（三决策+两约束）、`/Users/munich/Downloads/ai_studio_code (32).html`（金标）、现有代码实测。
> 下游 implementer **只读本文件**，不读变体。

---

## BLUF

融合 3 个变体：**变体1 的"骨架保留+定义点重定向"（低侵入）+ 变体2 的"@layer 级联边界"（结构修正）+ 变体3 的"class 锚点纪律"（E2E 保险）**，否决变体2 的 welcome 波及（前提错误）与变体3 的 13 组件大拆（时序风险）。

**最关键决策**：极光（aurora）替换 loading-spinner 间隙成为 32 同款转场，Reveal 层**骨架全部保留**（revealPhase/skip/focus/aria/edge-blur/`body.revealed`），但 6 段 stagger 文字序列**删除或精简为单一名字闪现**——既满足"和 32 完全一样"（32 只有极光），又守住 C2 的 a11y/skip 契约与 3 个 E2E 文件的跳过断言。

**最大新发现**：iframe（`/test`）内**无任何现存氛围层**——`#abyss-canvas`/`#cursor-dot`/`.noise-layer` 的 DOM 只存在于宿主 `public/index.html`，globals.css 里对应样式在 iframe 内是**死代码**。这意味着新 BackgroundLayers 可零冲突加入；同时否决了三变体共有的"iframe 与宿主氛围冲突"担忧（不成立）。

诚实标注：A4（分享卡/米白）保留为给人拍板项；Reveal 精简后的残留内容（空 gate vs 单名字闪现）留作实现者低风险选择。

---

## 决策比较

| 决策点 | 变体1「最小侵入」 | 变体2「分层重建」 | 变体3「组件化重组」 | → 选定 |
|---|---|---|---|---|
| **D1 极光 vs Reveal** | 替换 Reveal 视觉壳，保留骨架 | 极光消灭 Reveal，逻辑迁 mount effect | 两阶段：极光替 quiz-exit，Reveal 作名字揭晓 | **极光替 loading-spinner + Reveal 骨架保留 + stagger 精简**（融合 1+3，否决 2） |
| **D2 Token 组织** | 定义点重定向 + 硬编码批量替换 | 迁移替换 + welcome 同步 + @layer | remap 24 处 | **定义点重定向 + @layer**（融合 1+2），welcome 不动（否决 2） |
| **D3 组件拆分粒度** | 不拆（TestScreen 局部改） | 轻拆（背景层组件） | 大拆 13 组件 + test/result 目录 | **轻拆**：仅抽 BackgroundLayers/AuroraBurst（融合 1+2），否决 3 的大拆 |
| **D4 class 命名** | 未明确 | 未明确 | 保留 E2E 锚点 + 新增 32 名 | **采纳变体3**（全方案约束）：保留 `.opt-block/.balance-pan/.weight-stage/.result-layout/.r-name` 等，新增 `.hud-capsule/.editorial-grid/.tarot-card-frame` |
| **D5 桌面/手机分发** | 现有 @media | @layer mobile 覆盖 desktop | 现有 @media | **@layer + 现有 @media 双轨**：@layer 解决特异性战争，@media 保留端判定 |
| **A1 Canvas 降级** | 禁用 | 禁用 | 禁用 | **禁用**（三变体一致 + 契约推荐） |
| **A3 桌面挤压配色** | 金紫渐变+中性灰 | 金紫渐变+中性灰 | 金紫渐变+中性灰 | **金紫渐变 selected + 中性灰 dimmed**（三变体一致，弱证据但与 32/mobile 对齐） |
| **A5 天平/筹码端范围** | 全端 | 全端 | 全端 | **全端金紫黑**（三变体一致 + 00-seed 未分端） |

> 每行"→ 选定"的理由见下文「最终 ADR · 决策」逐条。

---

## 共同盲点（最高价值）

> 已知 5 条（welcome 波及/字体 bug/硬编码 rgba/html-to-image 限制/视觉基线）+ 新挖 8 条。每条给处理方式。

### 已知（确认或修正）

1. **welcome 页 `--c-gold` 全局波及** —— ❌ **不成立，否决变体2 前提**。实测：无 `src/app/page.tsx`，welcome 是纯静态 `public/index.html`，自带 `:root --gold: #d4af37`，**不消费 globals.css 的 `--c-gold`**。改 globals.css `--c-gold` 对 welcome 零影响。**处理**：welcome 不动（符合 R31/非目标）。
2. **`--f-syne: 'Syne'` 字体 bug** —— ✅ 确认。`layout.tsx` 用 next/font `variable:"--font-syne"` 挂 `<html>`，生成的哈希字体族只能通过该 CSS 变量取到；写 `'Syne'` 会回退系统 sans。**处理**：`--f-syne: var(--font-syne), sans-serif;`（影响 balance-pan-key/weight-key/q-counter mobile 等约 6 处，自动随 var() 生效）。
3. **移动端硬编码 `rgba(216,200,176)`** —— 实测 **19 处**（balance-pan/weight-card/node-dot/opt-block mobile 状态/border-muted 定义）。**处理**：批量替换为金紫黑对应值；其中 `--border-muted`/`--border-highlight` 是变量定义，改定义点即可覆盖部分消费者。
4. **html-to-image backdrop-filter 限制** —— 分享卡当前用纯色 `#050308` + 实色（L650），无 backdrop-filter，**当前安全**。**处理**：结果页重构时，分享卡子树**禁用** backdrop-filter / mix-blend-mode / 纯 transparent（用实色 `rgba` 模拟玻璃态），否则 toPng 黑块。
5. **视觉基线全量重生成** —— `tests/visual/` 现有快照会因 DOM/配色大改变全部漂移。**处理**：实现完成后一次性 `pnpm playwright test --update-snapshots`（视觉用例），并人工 spot-check 5-10 张对照 32 金标。

### 新挖（三变体都漏）

6. **iframe 无现存氛围层（关键澄清）** —— `#abyss-canvas`/`#cursor-dot`/`#cursor-ring`/`.noise-layer` 的 **DOM 只在 `public/index.html`**，iframe 内无对应 DOM → globals.css 这些样式在 `/test` 内是**死代码**。**影响**：新 `<BackgroundLayers>`（Canvas 粒子+浮雕字）可零冲突挂载，无需处理"双层氛围"。**处理**：BackgroundLayers 挂 TestScreen 作用域（iframe 内），z-index 0-1 层。同时：`.hero-*`/`#cursor-*` 在 globals.css 也是死代码，可在本次顺手标注（不必删，超范围）。

7. **`prefers-reduced-motion` 覆盖严重不足（C2/P8 红线）** —— 实测 globals.css 只有 **1 个 reduced-motion 块（L904）**，且只 drop transform 类入场。新增动效（Canvas rAF / aurora scale 1→250 / posture width 1.2s / floatIn）**均无降级路径**。**处理**：每个新动效必须自带 `@media (prefers-reduced-motion: reduce)` 守卫——Canvas 不启动 rAF（R3）、aurora 跳过缩放直接淡出、posture 柱图直接显示终值无 width transition、floatIn 静态显示。列入 P8 验收硬检查项。

8. **z-index 已拥挤，aurora 落点需明确** —— 现状：abyss 0 / noise 1 / 内容 2-3 / q-counter 6 / opt hover 10-20 / 装饰 40-41 / **reveal overlay 100** / **loading 8000** / error 9000 / cursor 9999。**处理**：新 Canvas 粒子+浮雕字 → z 0-1（内容之下）；aurora-burst → **复用 loading overlay 的 8000 层**（它就是替换 loading spinner），覆盖答题内容但不盖 cursor；reveal overlay 保持 100。给出一张 z-index 分配表贴在 globals.css 注释。

9. **`body.revealed` 是 CSS 反向耦合（隐性依赖）** —— globals.css:534 `body.revealed .result-layout { opacity:1; transform:none }`。Reveal 层 mount 时加该类，卸载时移除（ResultScreen L118/147）。若有人"精简 Reveal"不知此钩子，result-layout 会保持透明。**处理**：Reveal 骨架保留时此耦合自动维持；在 ResultScreen 顶部注释标注"`body.revealed` ← globals.css:54 result-layout 可见性门控，勿拆"。

10. **新组件缺 focus-visible（键盘焦点环 R29）** —— 现有 `.opt-block/.balance-pan/.weight-card/.btn-restart` 都有 `:focus-visible` outline（token 重定向后自动变金）。但新增 `.hud-capsule` 按钮、`.btn-neo-primary`/`.btn-neo-secondary`（结果页操作）、`.tarot-card-frame` 内交互（若有）**无 focus-visible**。**处理**：所有新可聚焦元素必须加 `:focus-visible { outline: 2px solid var(--gold-hyper); outline-offset: 2px }`。列入 R29 验收。

11. **SSR/hydration 守卫** —— ResultScreen 已用 `typeof window !== "undefined"` 守 matchMedia/window.parent。BackgroundLayers 的 Canvas 需同样守卫（matchMedia 检测 reduced-motion + 拿 canvas 上下文）。**处理**：Canvas 组件 mount effect 内首行 `if (typeof window === 'undefined') return;`，且 rAF 循环在 reduced-motion 时不启动。Playwright headless 下 window 存在，正常。

12. **i18n 孤儿键** —— 删 stagger 后，`result.revealJudgement`/`result.revealTransition`/`result.skipHint` 在 4 个 locale 文件（`src/i18n/{zh-CN,en,ja,zh-TW}.ts`）成孤儿。**处理**：无害（i18n 回退），但实现末尾顺手清理；若保留"单名字闪现"则 `result.skipHint` 仍需要。

13. **loading overlay 与 aurora 的状态交接** —— page.tsx 的 `loading` 态（L201-229）是 fetch 期间显示。极光替换它后，极光生命周期 = `loading` 态 + 最小播放时长（32 是 100ms 触发 + 800ms 切换 + 400ms 淡出）。若 fetch 比 800ms 快，极光仍须播完最小时长才切结果；若 fetch 比 1300ms 慢，极光淡出后仍要等 fetch（或保持覆盖）。**处理**：AuroraBurst 组件接收 `{active, minDurationMs}`，内部 `Promise.all([fetchDone, minDuration])` 后才 `onComplete` 回调切结果。这是时序竞态点的具体缓解（变体1/2 都提了风险但没给机制）。

> 「没找到共同盲点」是不成立的——以上 8 条新挖均经实测确认。最危险的是 #1（变体2 基于错误前提设计了 welcome 升级，会引入超范围改动）和 #7（reduced-motion 不足直接违反 C2/P8）。

---

## 最终 ADR

### 背景

把 HTML 32 的金紫黑赛博哥特视觉移植进现有 React/Next 项目：手机端答题页逐像素复刻 32、桌面答题保留 flex 挤压只升配色+补背景层、结果页完全重构为塔罗分栏。约束：数据层/评分/5 角色/26 题/i18n/分享卡/批注/键盘/测试套件零降级（C2）；iframe 架构不动（R31）。三变体在极光 vs Reveal、token 策略、组件拆分粒度上分歧严重，且对 Reveal 的非视觉职责核查不一致。

### 决策

#### 决策 1 · 极光 + Reveal 骨架（融合变体1+3，否决变体2）

**事实核查结论**（亲自读 ResultScreen.tsx / test/page.tsx / reveal.spec.ts / result.spec.ts）：
- Reveal **不**承载 API/评分/埋点（这些在 page.tsx `handleComplete` 内、ResultScreen 挂载前完成）。
- Reveal **承载**：revealPhase 状态机、skipReveal（click/Space/touch 三路）、焦点管理（A-F1，done 后 focus resultLayoutRef）、aria-hidden/aria-live、edge-blur 滚动门控、`body.revealed` 类（CSS 反向门控 result-layout 可见性）。
- E2E 锚点：result.spec.ts L158-188 硬锚 stagger 文本；reveal.spec.ts 锚 click-skip(640,360)+`.result-layout`；reachResultPage 锚 Space-skip。

**选定方案**：
- **极光替换 loading-spinner 间隙**（变体3 第一阶段）：Q26 选中 → 触发 `<AuroraBurst>` 覆盖层（z 8000，复用现 loading 层位置）→ 播放 32 同款 `scale 1→250` + `radial gold→purple→void`（≈100ms+800ms+400ms）→ 期间并发 fetch → `Promise.all([fetchDone, minDuration])` 后切结果。这是"和 32 完全一样"的部分。
- **Reveal 骨架全部保留**（变体1）：revealPhase/skipReveal/焦点/aria/edge-blur/`body.revealed` 原样留 ResultScreen。守住 C2 的 a11y/skip 契约 + reveal.spec.ts click-skip + reachResultPage Space-skip（最小改写甚至零改写）。
- **stagger 文字精简**：删除 6 段 4.6s 序列（judgementText/transitionText/slogan/fromWork/hiddenReveal 的 stagger）。Reveal overlay 退化为**短名字闪现**（角色名 blur crossfade，≤800ms）或**空 gate**（极光已揭晓，overlay 透明仅做 aria/焦点门控）。实现者二选一（见开放问题 O1）。
- **E2E 改写（R34 授权）**：result.spec.ts L158-188（"reveal sequence plays"）改写为断言 aurora active + `.r-name` 可见，不再断言"审判结束了。"/"而你是——"。skip-via-Space（reachResultPage）+ skip-via-click（reveal.spec.ts）**保留**。

**否决变体2（消灭 Reveal）理由**：会破坏 3 个 E2E 文件的跳过断言 + 丢失 a11y 焦点/skip 契约 → 违反 C2。变体2 称"Reveal 只做焦点管理"——核查确认它还做 skip/aria/edge-blur/CSS 门控，迁移到 mount effect 不是一行能搞定的。

**否决纯变体1（保留完整 stagger）理由**：32 结果页无 stagger，保留 4.6s 序列 = 在极光后再加一段冗长动效，违反"和 32 完全一样"。

#### 决策 2 · Token：定义点重定向 + @layer（融合变体1+2，否决变体2 welcome 升级）

**事实核查结论**（grep globals.css/public/index.html）：
- `--c-gold: #d4af37`（globals.css:57）的活跃消费者全在答题页（opt-block/q-meta/gate-badge/btn-restart focus/progress 渐变）；`.hero-*`/`#cursor-*` 消费者是**死代码**（无 DOM、无 Next welcome 路由）。
- welcome = 纯静态 `public/index.html`，自带 `--gold`，**不受 globals.css 影响**。变体2"welcome 波及"前提错误。
- `--champagne-*`（globals.css:95-98）有 24 个 var() 消费者；另有 19 处硬编码 `rgba(216,200,176)` 绕过变量。

**选定方案**：
- **新增 32 token 集**（globals.css :root）：`--gold-hyper:#FFD700`/`--purple-neon:#D800FF`/`--violet-deep:#7B2CBF`/`--rose:#FF0055`/`--void:#030305`。
- **定义点重定向（变体1，4 行改批量翻转）**：
  - `--c-gold: var(--gold-hyper)`（桌面答题页消费者全翻金；死代码无害）。
  - `--champagne-main: var(--gold-hyper)` / `--champagne-light: #F2EFE9→浅金紫` / `--champagne-dim: var(--violet-deep)` / `--champagne-bg: var(--void)`。24 个 var() 消费者自动翻转。
- **批量替换 19 处硬编码 `rgba(216,200,176,α)`** → `rgba(255,215,0,α)`（金）或语义化新变量。手动，不可避免。
- **采纳 @layer 级联边界（变体2）**：`@layer reset, tokens, base, desktop-skin, mobile-skin, atmosphere, reduced-motion`。mobile-skin 自动覆盖 desktop-skin，**消除现存特异性战争**（globals.css:869-871 手动中和 hover 泄漏的 `!important` 拉锯）。这是变体1/3 都漏的结构性修正。
- **welcome 页不动**（R31/非目标）。变体2 welcome 升级**否决**（前提错误 + 超范围）。
- **修 `--f-syne: var(--font-syne), sans-serif`**（变体1）。

**否决变体3（remap 24 处）理由**：定义点重定向 4 行搞定 24 消费者，remap 24 处是无谓的手工。

#### 决策 3 · 组件拆分：轻拆（变体2 粒度 + 变体3 class 纪律）

**事实核查结论**：TestScreen 650 行，状态机密集（currentIndex/answers/gateValue/isAnimating/selectedOptionId/stageFadeOut/toastVerdict/showKeyboardHint/isCompleted/interjection/weightSlots + pendingRef/timerRef/fadeTimerRef/toastTimerRef 时序交织 + 多 effect）。E2E 锚定大量 class。

**选定方案**：
- **抽 BackgroundLayers 组件**（变体1+2 共识）：Canvas 粒子 + 浮雕字 + grain。纯展示、零状态、零 E2E 锚点，安全抽离。挂 TestScreen 作用域，z 0-1。
- **抽 AuroraBurst 组件/hook**（新）：自包含时序（active + minDuration + onComplete）。纯展示 + 自定时，安全。
- **TestScreen 状态机不抽**（否决变体3 大拆）：orchestrator 留 TestScreen 单一时间权威。变体3"13 组件 + 强制 TestStage orchestrator"原则对，但 13 拆过细，密集时序机抽离 = E2E flaky 高风险（变体3 自承最高风险）。
- **ResultScreen 完全重构**（契约 B 授权，三变体一致）：可拆纯展示子叶（TarotFrame/PostureBars/VerdictCard/TagCloud）入 `src/components/result/` 或同文件，但 reveal 骨架 + 分享逻辑 + i18n 留 ResultScreen。
- **保留全部 E2E 锚点 class**（变体3，全方案约束）：`.opt-block/.balance-pan/.weight-stage/.weight-card/.btn-confirm-weight/.interjection-overlay/.result-layout/.r-name/.r-slogan/.r-desc/.r-keywords/.r-keyword-tag/.r-actions/.btn-restart/.q-text` 改样式不改名。新增 32 class 并存：`.hud-capsule/.editorial-grid/.tarot-card-frame/.stat-bars-container/.btn-neo-primary`。

#### 决策 4 · 5 歧义终裁

| 歧义 | 终裁 | 理由 |
|---|---|---|
| **A1** Canvas 降级 | **禁用**（不渲染画布、不启 rAF） | 三变体一致 + 契约推荐；静态首帧视觉价值低 |
| **A2** 极光 vs Reveal | **极光为主转场 + Reveal 骨架保留 + stagger 精简**（见决策1） | 融合，平衡"和32一样"与 C2 |
| **A3** 桌面挤压配色 | **金紫渐变 selected + 中性灰 dimmed** | 三变体一致（弱证据但与 32/mobile 对齐）；selected=`linear-gradient(135deg,rgba(255,215,0,.15),rgba(216,0,255,.15))`，dimmed=`rgba(18,18,22,.4)` |
| **A4** 分享卡 + 米白 | **默认同步深色金紫黑（读法A）**，但**留作给人拍板（O2）** | R17 明确"完全废弃米白"；分享卡当前已是 `#050308` 深色（L650），事实上已同步。唯一产品变量：分享传播场景浅色是否更醒目 |
| **A5** 天平/筹码端 | **全端金紫黑** | 三变体一致 + 00-seed 未分端 + 视觉一致性 |

### 后果

**得到**：手机端答题页逐像素对齐 32；桌面挤压动效保留且配色统一金紫黑；结果页塔罗分栏深色可滚动；token 4 行翻转 + @layer 消除特异性债；a11y/skip 契约零损失；E2E 跳过断言最小改写。

**牺牲**：stagger 文字序列（"审判结束了。"/"而你是——"等戏剧性逐字揭晓）删除——这是用 32 极光语言换掉的；result.spec.ts L158-188 须改写；视觉基线全量重生成；welcome 与答题页的金色不一致（`#d4af37` vs `#FFD700`）按 R31 接受。

---

## 给人的开放问题

### O1 · Reveal 残留内容：空 gate vs 单名字闪现（低风险，可授权实现者）
- **问题**：极光已揭晓结果后，ResultScreen 的 Reveal overlay 还要不要播一个短名字闪现？
- **选项 A（空 gate）**：overlay 透明，仅做 aria-hidden/焦点/skip 门控，revealPhase 几乎瞬间 revealing→done。最接近 32（32 结果页直接显示）。
- **选项 B（单名字闪现）**：保留角色名 blur crossfade ≈600-800ms，提供"揭晓名字"戏剧节拍。保留 `result.skipHint` 键。
- **代价**：A 更贴近 32 但少一个戏剧节拍；B 更有仪式感但多一段 32 没有的动效。**推荐 B**（兼顾 C2"不损失现有名字揭晓体验"，且 ≤800ms 不冗长）。**可不拍板，授权实现者按 B 默认**。

### O2 · 分享卡配色（产品取舍，建议拍板）
- **问题**：分享卡（社交传播 PNG）是否随结果页改深色金紫黑？
- **选项 A（同步深色）**：与结果页统一，符合 R17"完全废弃米白"。**当前分享卡已是 `#050308` 深色**，事实上倾向 A。
- **选项 B（保留浅色）**：社交平台传播更醒目，但需维护两套配色。
- **代价**：A 一致性高、维护省；B 传播力可能更强但违反"和 32 完全一样"。**推荐 A**（且现状已是深色，改 B 反而多工作）。

### O3 · welcome 金色不一致（低优先，可不动）
- **问题**：welcome（`public/index.html`，`#d4af37` 旧金）与答题页（`#FFD700` 超金）过渡时金色色差。
- **选项 A（不动）**：遵守 R31/非目标，接受色差。用户原诉仅针对答题/结果页。
- **选项 B（同步升级 welcome 金）**：视觉一致，但超范围（动宿主落地页氛围层）。
- **代价**：A 合规但有色差；B 一致但违反 R31。**推荐 A**（守约束，除非用户主动扩范围）。

---

## 模块切分预告（给 3b 编排者）

### 建议模块边界

| 模块 | 职责 | 主要文件 | 依赖 |
|---|---|---|---|
| **M1 Token + @layer 地基** | 新增 32 token、定义点重定向、@layer 重排、`--f-syne` 修复、19 处硬编码替换 | `src/app/globals.css` | 无（最先做） |
| **M2 BackgroundLayers** | Canvas 紫粒子 + 浮雕字（题号）+ grain，reduced-motion 守卫 | 新 `src/components/BackgroundLayers.tsx` + TestScreen 挂载 | M1（token） |
| **M3 AuroraBurst + 转场时序** | 极光组件 + 替换 page.tsx loading spinner + fetch/minDuration 交接 | 新 `src/components/AuroraBurst.tsx` + `src/app/test/page.tsx` | M1 |
| **M4 答题页配色（桌面挤压+mobile）+ HUD/进度条/tag-pill/toast** | opt-block 金紫黑 + HUD 双胶囊 + 进度条 + tag-pill + toast-verdict + 天平/筹码配色 | `globals.css` + `TestScreen.tsx`（仅 class/结构，状态机不动） | M1 |
| **M5 结果页重构** | editorial-grid + 塔罗框 + 渐变标题 + tag-cloud + verdict 卡 + posture 柱图 + 操作按钮 + min-height 滚动修复 + Reveal 骨架精简 | `ResultScreen.tsx`（+ 可选 `result/` 子叶） | M1, M3（极光交接） |
| **M6 测试适配** | E2E 选择器/断言改写（result.spec L158-188 等）+ reduced-motion 用例 + 视觉基线重生成 | `tests/*.spec.ts` + `tests/visual/` | M2-M5 全完成 |

### 接口契约要点
- **AuroraBurst**：props `{ active: boolean; minDurationMs?: number (=1300); onComplete?: () => void }`。内部 `Promise.all([fetchSignal, minDuration])`。
- **BackgroundLayers**：props `{ questionIndex: number; reducedMotion: boolean }`。Canvas 在 reducedMotion 时返回静态/null。
- **Reveal 骨架**：保留 `revealPhase`/`skipReveal`/`resultLayoutRef`/`body.revealed` 对外行为不变（E2E skip 仍有效），仅 overlay 内部 stagger 精简。
- **E2E class 契约**：保留 class 清单见决策 3，新增 class 不冲突。

### 并行度建议
- **串行必经**：M1（地基）→ 其余。M1 未完前 M2-M5 的配色都漂移。
- **M1 后可并行**：M2 / M3 / M4 / M5 四路并行（不同文件，无冲突）。M5 依赖 M3 的极光交接契约（接口先定即可并行）。
- **M6 必须最后**：所有视觉模块稳定后才能改 E2E + 重生成基线。
- **关键路径**：M1 → M3（极光时序是竞态点）→ M5（结果页）→ M6。M2/M4 可与关键路径并行。

---

## 主要风险（≤3）

1. **极光 × fetch 时序竞态（最高）** —— 极光最小播放时长与 fetch 实际耗时的交接。fetch 快于 800ms 会切太快，慢于 1300ms 会黑屏等待。**缓解**：AuroraBurst 用 `Promise.all` + 极光淡出态保持覆盖直至 fetch 完成；E2E 加 `await fetch` 断言 + 慢网 mock 用例。

2. **reduced-motion 全链路遗漏（C2/P8 红线）** —— 现状仅 1 处覆盖，新增 4 类动效（Canvas/aurora/posture/floatIn）任一漏守卫即违反 P8。**缓解**：M2-M5 每个新动效 PR 必须带 reduced-motion 守卫 + 一个 DevTools 开启截图验收；M6 加专用 E2E 用例（`prefers-reduced-motion: reduce` emulation）。

3. **E2E 117 用例因 DOM/时序改变 flaky（C2 红线）** —— class 改名、极光交接改变 ResultScreen 挂载时序、stagger 删除改变跳过断言。**缓解**：决策 3 的 class 保留纪律（零改名）+ 决策 1 的骨架保留（skip 断言最小改写）+ M6 预留充足调试预算；先跑现有 117 用例定位红点，再逐个适配。

---

## 附：变体立场速查（被否决项归档）

- **变体2「welcome 升级」**：否决。前提错误（welcome 不消费 globals.css `--c-gold`）+ 超范围（R31）。
- **变体2「消灭 Reveal」**：否决。破坏 3 个 E2E + 丢 a11y/skip 契约（C2）。
- **变体3「13 组件大拆」**：否决。TestScreen 密集时序机抽离 = E2E flaky 高风险（变体3 自承）。仅采纳其 class 锚点纪律 + 两阶段时序思路（且第二阶段精简）。
- **变体1「保留完整 stagger」**：部分否决。stagger 与"和 32 完全一样"冲突，精简为单名字闪现或空 gate。
- **变体3「remap 24 处」**：否决。定义点重定向 4 行等效，remap 无谓手工。
