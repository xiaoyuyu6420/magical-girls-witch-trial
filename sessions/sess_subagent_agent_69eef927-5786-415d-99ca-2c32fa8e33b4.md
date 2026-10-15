# 探查一个 Next.js 魔法少女性格测试项目的「答题页」当前实现现状。项目根目录：/Users/munich/D...

- 会话 ID: `sess_subagent_agent_69eef927-5786-415d-99ca-2c32fa8e33b4`
- 时间: 2026-08-13 11:05:46 → 2026-08-13 11:07:30
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
探查一个 Next.js 魔法少女性格测试项目的「答题页」当前实现现状。项目根目录：/Users/munich/Desktop/独立项目/magical-girls

需要你重点报告以下文件的内容（看实际代码，给出具体的类名、CSS 变量、关键动效名称、DOM 结构）：

1. `src/components/TestScreen.tsx` — 答题主组件。我要知道：
   - 普通题选项的 DOM 结构和类名（opt-block？opt-item？）
   - 天平题（Q8/Q22，renderType:"scale"）的当前渲染方式（是不是 SVG 天平？类名是什么？）
   - 筹码题（Q14，renderType:"weight"）的当前渲染方式（点阵 node-dot？还是步进器？类名？）
   - 顶部 HUD/进度条的 DOM 结构和类名
   - 切题动效（fadeIn/fadeOut？挤压？类名？）
   - 是否有 toast-verdict、grain 噪点、巨型水印数字、Canvas 粒子背景
   - 桌面端 vs 移动端是如何区分的（@media？两套 class？）

2. `src/app/globals.css` — 全局样式。重点找：
   - 配色变量：有没有 `--champagne-main:#d8c8b0` 这类香槟色 token？有没有金紫黑（#FFD700 / #D800FF / #7B2CBF / #030305）？
   - 字体：有没有 Syne / Cinzel / Noto Serif SC？
   - 答题页移动端作用域（@media max-width:768px）里的关键样式
   - 桌面端答题的挤压动效（flex 比例变化，如 flex:1.8→8）相关类名
   - 天平相关类（.balance-svg / .balance-stage / .balance-pan 等）
   - 筹码相关类（.weight-card / .node-dot 等）
   - .grain-overlay / .toast-verdict / bg-watermark 等

3. `src/app/layout.tsx` — 确认加载了哪些字体（Syne？Cinzel？）

请按「配色体系」「字体」「普通题选项」「天平题」「筹码题」「HUD/进度」「切题动效」「背景层（噪点/水印/canvas）」「桌面vs移动端区分方式」这几个维度整理报告，每个维度给出当前实际用到的类名/变量/值。不需要建议，只要事实。

## 🤖 助手
我将通过并行读取目标文件，高效地探查该项目的答题页。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
现在让我读取完整的 `globals.css` 文件。

> 🔧 工具调用 1 次: Read

## 🤖 助手
I have the three target files. Let me quickly verify the global background layers and the "iframe" references mentioned in the CSS comments to confirm whether the test page is rendered inside an iframe.

> 🔧 工具调用 2 次: Bash

## 🤖 助手
测试页面的路由配置为 `src/app/test/page.tsx`。我先查看一下该文件，以确认是否使用了 iframe/canvas，因为 CSS 中频繁提及了“iframe”。

> 🔧 工具调用 2 次: Read

## 🤖 助手
探查完成。以下是「答题页」当前实现现状的事实报告，按你要求的维度整理。所有路径为绝对路径。

涉及的文件：
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（650 行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（914 行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/layout.tsx`
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx`（路由 `/test`，TestScreen 在此挂载）

架构前提：答题页路由是 `/test`（`src/app/test/page.tsx`），它被作为 **iframe 嵌入** 到 `public/index.html` 欢迎壳层里（CSS 注释多处写"iframe 内"，page.tsx 里有 `window.parent !== window` + `postMessage("witch-trial-test-ready")` 的握手）。`page.tsx` 给 iframe 容器设了内联底色 `background:"#030303"`、字体 `'Space Mono', monospace`。

---

## 1. 配色体系（两套 token 并存于 `:root`）

**A. 金紫黑（暗黑魔法）体系 —— 桌面端普通题 + 欢迎页主用**（globals.css 56-67 行）
- `--c-void: #0c0a14`（暗紫黑底）
- `--c-gold: #d4af37`
- `--c-blood: #8b0000`
- `--c-accent: rgba(255,255,255,0.85)` / `--c-accent-dim: rgba(255,255,255,0.35)`
- `--c-text: #ede9f3` / `--c-dim: rgba(255,255,255,0.2)`
- shadcn token 同源：`--primary:#d4af37`、`--secondary:#1a1028`、`--destructive:#8b0000`、`--background:#050308`、`--ring:#d4af37`

注意：你问的具体值 `#FFD700 / #D800FF / #7B2CBF / #030305` **均不存在**。金紫黑这套用的是 `#d4af37`(金)、`#8b0000`(血红)、`#0c0a14`/`#050308`/`#030303`(黑)，紫色仅以 `rgba(40,15,60,…)` 等径向渐变出现在 body 背景里，没有纯紫 token。

**B. 香槟暗黑体系 —— 移动端答题页 + 天平/筹码全端**（globals.css 94-102 行，注释明确写"香槟暗黑 token（HTML「审判庭」手机端答题页 / 天平·筹码全端）"）
- `--champagne-main: #d8c8b0` ← 存在
- `--champagne-light: #f2efe9`
- `--champagne-dim: #9e9282`
- `--champagne-bg: #0a0a0c`
- `--card-glass: rgba(18, 18, 22, 0.75)`
- `--border-muted: rgba(216, 200, 176, 0.15)`
- `--border-highlight: rgba(216, 200, 176, 0.4)`

移动端普通题卡片材质没有用上面任一变量，而是内联中性墨色：`background: rgba(18,18,22,0.55)`（注释自称 `#1c1b22`，饱和度~25%）。

---

## 2. 字体（layout.tsx）

三个 Google 字体 **全部加载**（layout.tsx 11-27 行）：
- `Noto_Serif_SC` → CSS 变量 `--font-noto-serif`，weights 300/500/700，body 默认
- `Cinzel` → `--font-cinzel`，weights 400/600/800
- `Syne` → `--font-syne`，weights 500/700/800

CSS 字体族变量（globals.css 63-64、102 行）：
- `--f-title: 'Cinzel', serif`（题号 meta、水印、罗马序号、按钮）
- `--f-body: 'Noto Serif SC', serif`（正文、选项文字）
- `--f-syne: 'Syne', sans-serif`（balance-pan-key、weight-key、移动端 opt-index、btn-confirm-weight、toast-verdict）

注意：page.tsx 容器内联写了 `fontFamily:'Space Mono', monospace` 和错误态的 `'Cinzel'/'Noto Serif SC'` 硬编码（未走变量）。

---

## 3. 普通题选项（TestScreen `renderOptions` default 分支，432-453 行）

DOM 结构：
```
<div class="options-stage" role="radiogroup">
  <button class="opt-block [is-selected] [is-dimmed]" style="animationDelay:…">
    <div class="opt-content">
      <div class="opt-index">{ROMAN}</div>   // ROMAN=["I","II","III","IV","V"]
      <div class="opt-text">{label}</div>
    </div>
  </button> ×N
</div>
```
类名是 **`opt-block`**（不是 `opt-item`），子级 `opt-content` / `opt-index` / `opt-text`。状态类 `is-selected`、`is-dimmed`。容器 `options-stage`（桌面 `flex-direction:row`，移动 column）。

---

## 4. 天平题（renderType "scale"，TestScreen 379-425 行）—— 是 SVG 天平

DOM 结构：
```
<div class="balance-stage" role="radiogroup">
  <svg class="balance-svg [tilt-left|tilt-right]" viewBox="0 0 220 130">
     支点 polygon + 横梁 line + 2 挂绳 line + 2 托盘 path(弧线)
  </svg>
  <div class="balance-beam-options">
    <button class="balance-pan [is-down|is-up]">
      <span class="balance-pan-key">{ROMAN}</span>
      <span class="balance-pan-text">{label}</span>
    </button> ×2
  </div>
</div>
```
关键类与值（globals.css 428-467 行）：
- `.balance-svg`：`color: var(--champagne-main)`，`transform-origin: 50% 31%`，transition transform 0.45s
- `.balance-svg.tilt-left` / `.tilt-right`：`rotate(-7deg)` / `rotate(7deg)`
- `.balance-pan`：`background: var(--card-glass)`，`backdrop-filter: blur(14px)`，`border:1px solid var(--border-muted)`，`border-radius:16px`，进场用 `staggerIn`
- `.balance-pan.is-down`：选中下沉 `translateY(20px)` + 香槟辉光 `box-shadow: 0 0 34px rgba(216,200,176,0.28)`
- `.balance-pan.is-up`：`opacity:0.42; transform:translateY(-14px)`
- `.balance-pan-key`：`font-family: var(--f-syne)`，香槟底 + 香槟描边小标签
- 键盘：`1`=左选项、`2`=右选项

---

## 5. 筹码题（renderType "weight"，TestScreen 458-520 行）—— 是点阵 node-dot，不是步进器

DOM 结构：
```
<div class="weight-stage">
  <div class="weight-allocator">
    <div class="weight-card" role="button" tabIndex=0>   ×3 (A/B/C)
      <div class="weight-title">
        <span class="weight-key">{A|B|C}</span>
        <span>{theme}</span>
      </div>
      <div class="node-group">
        <span class="node-dot [active]"/>
        <span class="node-dot [active]"/>    // 每卡固定 2 个点（上限 2）
      </div>
    </div>
  </div>
  <div class="weight-footer">
    <div class="weight-status">{状态文案}</div>
    <button class="btn-confirm-weight [active]">落 锤 决 断</button>
  </div>
</div>
```
关键事实：
- 三槽主题**硬编码**在 TSX 里（459-461 行）：`["假装平静","暗中反抗","彻底放弃"]`（注释提到从 `question.text` 解析 `parseSlotThemes`，但渲染时实际用的是硬编码常量）
- 每张卡只有 2 个 `node-dot`，点击循环：未满(sum<3 且 slot<2)→+1，否则归 0；三槽总和必须 = 3 才能提交
- 提交匹配逻辑：拼 `weight::a|b|c` 字符串去 `current.options` 里查 optionId
- `.node-dot.active`：`background:var(--champagne-main)` + `box-shadow:0 0 10px rgba(216,200,176,0.55)`
- `.btn-confirm-weight.active`：香槟实底 + `box-shadow:0 0 24px`，字体 Syne
- 键盘数字键在此题型被禁用（TestScreen 335-338 行）

---

## 6. HUD / 进度条

- 顶部进度线：`<div id="progress-line" />`（TestScreen 578 行）。globals.css 122-130 行：`position:fixed; top:0; height:2px`，`background: linear-gradient(90deg, var(--c-void), var(--c-gold), var(--c-blood))`，`box-shadow:0 0 10px var(--c-gold)`，宽度由 JS（`progress`%）驱动，仅 `body.in-test` 时 `opacity:1`。
- 顶栏：`<div class="test-header">`（584 行），内含返回按钮（内联 SVG 双向箭头 ⇄）+ EXIT 按钮（文字 `t("test.exit")`）。
  - 桌面：`position:absolute; top:0; left/right:0`，两角对齐。
  - 移动 ≤768px：转成 flex 列成员（`position:relative; flex-shrink:0`），safe-area aware。
- 题目元信息：`<div class="q-meta">` 显示 `{meta} · {NN}/{NN}`，gate/trigger 题显示 `<span class="gate-badge">`，右侧 `q-hint`（键盘提示，移动端 `display:none`）。
- 巨型水印：`<div class="watermark-index">{ROMAN}</div>`（632 行），桌面 `font-size:35vw; color:rgba(255,255,255,0.015)`；移动 `15vw; color:rgba(216,200,176,0.06)`。

---

## 7. 切题动效

- 状态机：`stageFadeOut` → `#test-stage-wrapper` 加 `stage-fade-out` 类。
  - 桌面：`opacity:0; transform: scale(0.98) translateY(-10px)`（globals.css 366）
  - 移动：`transform: translateY(-8px)`（842 行，去掉 scale）
- **桌面挤压**（核心招牌动效）：`.opt-block` 的 `flex` 可动画。
  - hover：`flex:1.8`（411-415 行，仅 `@media (hover:hover) and (pointer:fine)`）
  - `is-selected`：`flex:8 !important` + `background:rgba(212,175,55,0.2)` + inset 金光（417-422）
  - `is-dimmed`：`flex:0.01 !important`（423）
  - transition：`flex 0.5s var(--ease-out-expo), background 0.3s, border-color 0.3s`
  - 移动端明确注释"flex never animates"，`is-selected/is-dimmed` 保持 `flex:none`，靠 bg/border/opacity 表达选中
- 进场动效：
  - `staggerIn` keyframe（opacity 0→1, translateY 20px→0），用内联 `animationDelay` 错峰（opt 0.05s × idx，balance-pan/weight-card 0.08s × idx）
  - 视图首挂：`viewTestEnter` 0.6s
  - 移动端选项：`mobileOptIn` 0.3s（translateY 8px + scale 0.98）
- 选中 toast：`<span class="toast-verdict">✦ 契约已被记录 ✦</span>`，`show` 时 `opacity:0.92`，闪现 400ms（TestScreen 262-264）。
- 时序（TestScreen 280-287）：鼠标 feedbackDelay 400ms / 总 700ms；触控 320ms / 680ms。震动 `navigator.vibrate`：鼠标 40ms / 触控 12ms。
- reduced-motion：禁掉所有 transform 位移，仅留 opacity（904-913 行）。

---

## 8. 背景层（噪点 / 水印 / canvas / toast）

答题页（iframe 内）实际存在的层：
- `.grain-overlay-test` —— **有**。TestScreen 579 行渲染，胶片噪点（SVG feTurbulence），`opacity:0.035`，`z-index:3`（globals.css 508-511）。
- `.watermark-index` —— **有**（见上）。
- `.toast-verdict` —— **有**（见上），且 `@media (min-width:769px) and (pointer:fine)` 下 `display:none`（桌面靠挤压反馈，不显示文字 toast）。
- 移动端额外装饰：`.view-test::before` 伪元素（globals.css 645-660），画一圈 1px 淡金取景框 `rgba(212,175,55,0.07)` + 四角 cross-in-circle 符文 SVG，`z-index:40`，纯静态无动画。

**不**在答题页 iframe 内的层（虽在 globals.css 有定义）：
- `#abyss-canvas`（模糊粒子 canvas，blur 40px、opacity 0.6、screen 混合）—— 定义在 globals.css 133 行，但 TestScreen / page.tsx 都**没有渲染该 DOM 元素**，它属于父级欢迎壳层 `public/index.html`。
- `.noise-layer`（全局 overlay 噪点）—— 同上，仅定义未在答题页渲染。

即：答题页自身**没有** canvas 粒子背景，只有 `.grain-overlay-test` 一层 SVG 噪点。

---

## 9. 桌面 vs 移动端区分方式

**用 `@media` 查询 + `pointer/hover` 媒体特性区分，不是两套独立 class 体系**（同一套 `.opt-block` 等类名，靠媒体查询覆盖）。断点：

- `@media (max-width: 768px)` —— 主移动断点（616-806 行）：选项变纵向 column、卡片固定高度、q-meta 飞出到 HUD 边框下、水印缩小、题目卡变玻璃态固定高 12rem 等。
- `@media (max-width: 480px)` —— 小屏微调（808-830）。
- `@media (hover: hover) and (pointer: fine)` —— **仅桌面**交互：hover 挤压 `flex:1.8`、balance-pan/weight-card hover 描边。
- `@media (pointer: coarse)` —— 触控：隐藏自定义光标 `#cursor-dot/#cursor-ring`。
- `@media (min-width: 769px) and (pointer: fine)` —— 桌面隐藏 toast-verdict。
- `@media (max-width: 768px), (pointer: coarse)` —— 复合块（840-898 行）：中性化桌面 hover 泄漏（把 hover 钉回休息态）、改卡片为中性墨色实底、`:active scale(0.97)`、`is-selected` 改用香槟 bg/border 而非 flex 挤压。

JS 侧也做了区分：`touchFeedbackRef` 由 `window.matchMedia("(pointer: coarse)")` + `"ontouchstart" in window` 判定（TestScreen 125-127），用来决定震动时长与切题时序。

核心行为差异：**桌面 = 横向 flex 挤压（1→1.8→8 / 0.01）；移动 = 纵向无挤压卡片（flex:none），选中靠 bg+border+opacity 表达**。

---

补充一点：普通题选项容器 `.options-stage` 在桌面默认是 `flex-direction:row`（横向铺开，所以挤压动效成立），`@media(max-width:768px)` 才转 `column`。而天平 `.balance-stage` 和筹码 `.weight-stage` 始终是 `flex-direction:column`、居中，全端共用香槟玻璃态（注释称"全端香槟"），即天平/筹码题在桌面端也不走金紫黑挤压体系。
