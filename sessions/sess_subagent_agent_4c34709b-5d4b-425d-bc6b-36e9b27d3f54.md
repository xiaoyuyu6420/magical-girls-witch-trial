# 我在探索一个 Next.js 项目（魔法少女心理测试），路径在 /Users/munich/Desktop/独立项...

- 会话 ID: `sess_subagent_agent_4c34709b-5d4b-425d-bc6b-36e9b27d3f54`
- 时间: 2026-08-13 02:45:00 → 2026-08-13 02:47:46
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 15
- 归档状态: 未归档

---

## 👤 用户
我在探索一个 Next.js 项目（魔法少女心理测试），路径在 /Users/munich/Desktop/独立项目/magical-girls。

我需要彻底理解"答题页面"的实现架构。请探索并报告以下内容：

1. **答题页面入口**：src/app/test/page.tsx 的完整内容和结构
2. **核心答题组件**：src/components/TestScreen.tsx 的完整实现——它如何渲染题目、选项、切换动画、进度条/HUD、背景等
3. **样式方案**：项目用的是 Tailwind？CSS modules？全局 CSS？是否有 globals.css 里的相关样式？答题页相关的 CSS/样式都在哪
4. **手机端 vs 桌面端适配**：项目如何区分手机版和桌面版？是否有响应式断点、独立的手机组件、或媒体查询？答题页在手机上的布局如何
5. **动画系统**：题目切换、卡片进入退出动画怎么做的（fadeIn/fadeOut？framer-motion？CSS transition？）
6. **HUD/顶栏**：进度条、题号计数器、返回/重启按钮如何实现
7. **背景效果**：是否有 canvas 背景、grain 噪点、watermark 水印等

请给出关键文件路径、组件结构、样式类的命名约定，以及答题页面的完整渲染流程。请读 excerpts 来理解，不要只列文件名。搜索范围要包含 src/components、src/app、src/styles 等。

## 🤖 助手
现在我将并行读取答题页面、核心组件、样式和项目配置中的关键文件。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在让我读取 `globals.css`（可能很大）、布局，并检查 `AppShell` 以及相关的组件/背景。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
现在让我找到全局背景元素（`#abyss-canvas`、`.noise-layer`、`#cursor-dot/ring`、`#transition-blind`）是在哪里渲染的，检查根欢迎页面，并寻找任何移动端/桌面端检测逻辑。

> 🔧 工具调用 3 次: Bash

## 🤖 助手
这是一个关键发现——根目录路由是由 `public/index.html` (欢迎页) 提供的，它通过 iframe 嵌入了 `/test`。让我阅读一下该文件的关键部分，并检查富文本和 i18n 辅助工具。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
让我先读取 index.html 的关键部分（iframe 的展示逻辑和背景设置），以及 i18n helper，从而理解 test.* 的翻译键值。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
我来读取 welcome HTML 的 body 结构、iframe 的 CSS，以及 i18n 的 test keys。

> 🔧 工具调用 2 次: Read

## 🤖 助手
我来查找一下 iframe 的 CSS 规则和起始按钮的挂件，以及 welcome body 的标记（markup）。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
我现在已经有了完整的了解。让我最后检查一下欢迎页背景画布的渲染逻辑，以全面梳理背景效果，并确认 `FullscreenButton`。

> 🔧 工具调用 2 次: Read

## 🤖 助手
我已经全面了解了答题页面架构的全貌。以下是完整报告。

---

# 答题页面实现架构报告

## 0. 关键架构发现：双文档 + iframe 嵌套（load-bearing）

这是理解整个答题页面前必须先掌握的前提。**答题页不是单一文档，而是两个文档的嵌套**：

1. **宿主文档 `public/index.html`**（1672 行的独立静态 HTML，被 Next 当作静态文件在 `/` 路由直接返回）—— 欢迎落地页，承载 **所有氛围层**：`#abyss-canvas`（粒子画布）、`.noise`（噪点层）、`#cursor-dot` / `#cursor-ring`（自定义光标）、HUD 取景框。注意：`src/app/page.tsx` **不存在**，所以 `/` 完全由 `public/index.html` 接管。

2. **iframe 内文档 `src/app/test/page.tsx`** —— Next.js 客户端路由 `/test`，渲染在 `<iframe id="test-embed" src="/test">` 内部，背景是纯实色 `#030303`，**不含 canvas / 噪点 / 自定义光标**（那些只属于父文档）。

进入答题的时序（`public/index.html` 第 1571-1609 行 `initiateDive()`）：
- 用户点 `接受审判` 按钮 → body 过渡到 `#000`、hero 文字淡出、关闭光标追踪
- 调 `ensureEmbeddedTestFrame()` 创建/复用 iframe 并设 `src="/test"`
- 监听 `window.message`，等收到 `"witch-trial-test-ready"`（由 `/test` 在题目 fetch 完成后 `postMessage` 给 `window.parent`，见 `page.tsx` 第 66-70 行）才 `enterEmbeddedTest()` → 给 body 加 `test-embedded` class
- `body.test-embedded #test-embed { display: block }`（第 435-437 行）让 iframe 从 `display:none` 切到 `display:block`，`z-index:30000` 覆盖一切
- 兜底：2 秒超时强制 reveal，防止 `/test` 异常时永久黑屏

所以"答题页背景效果"和"答题页题目/HUD"分属两份代码，**改背景要去 `public/index.html`，改题目要去 `src/components/TestScreen.tsx`**。

---

## 1. 答题页面入口：`src/app/test/page.tsx`

`"use client"` 组件，是 iframe 内文档的根。职责是**状态编排**，不渲染任何题目 UI：

**State**（第 21-30 行）：`questions` / `result` / `stats` / `loading` / `showResult` / `loadError` / `submitError` / `lastCompletion`，加 `startedAtRef` 计时。

**生命周期**：
- 挂载时（第 58-61 行）记录 `startedAtRef` 并 `loadQuiz()` → `GET /api/quiz`，把后端返回映射成 `QuizQuestion[]`（第 39-48 行逐字段映射 `renderType`、`translations`、`options`）。
- 题目就绪后（第 66-70 行）向父窗口 `postMessage("witch-trial-test-ready", "*")`，触发宿主页揭幕 iframe。`window.parent !== window` 判断保证直接访问 `/test` 时不报错（no-op）。

**提交流程** `handleComplete`（第 72-125 行）：`POST /api/match` 拿匹配结果 → GA 埋点 → `POST /api/results` 落库（含 sessionId/userAgent/分辨率/时区/耗时）→ 写 `stats` → `setShowResult(true)`。失败保留 `lastCompletion` 支持"重新提交"。

**渲染分支**（第 136-234 行），外层是一个内联样式的 `div`（`background:#030303`, `minHeight:100vh`, `fontFamily:'Space Mono'`）：
- `showResult && result` → `<ResultScreen />`
- `loadError && 无题` → 中断重试页（内联样式，金字 "审判通道中断"）
- `submitError` → 提交中断重试页
- 否则 `questions.length > 0` → `<TestScreen questions onComplete onExit />`
- `loading` → 全屏遮罩 `zIndex:8000` + 红色 spinner（`@keyframes spin` 用 `<style>` 标签内联注入，第 227 行）
- 末尾恒挂 `<FullscreenButton />`（右下角悬浮，第 231 行）

`handleRestart` / `handleExit`（第 127-134 行）都清 `localStorage["witch-trial-progress"]` 然后 `location.href = "/"`（离开 iframe 回到宿主落地页）。

---

## 2. 核心答题组件：`src/components/TestScreen.tsx`（685 行）

这是答题体验的主体。**纯 CSS 动画 + 内联样式混合，无 framer-motion**。

### 数据模型与持久化
- 导出 `QuizQuestion` / `QuizOption` 接口（第 9-18 行），`page.tsx` 复用。
- `STORAGE_KEY = "witch-trial-progress"`（第 29 行）。`readSavedProgress()`（第 57-85 行）从 localStorage 恢复 `currentIndex` / `answers` / `gateValue`，支持刷新续答。每次 `currentIndex/answers/gateValue` 变化自动写回（第 129-133 行）。`flushPending` 完成最后一题时 `localStorage.removeItem`（第 235 行）。

### 题型分发（renderType）
三种渲染分支，由 `renderOptions()`（第 369-423 行）switch 分发：
- **`scale`（天平题）**：2 个选项左右对峙，复用 `opt-block`。
- **`weight`（砝码题）**：`renderWeightUI()`（第 426-556 行）——三槽 A/B/C 的 `+/-` 按钮 UI，权重和必须=3 才能落锤。label 用 `weight::a|b|c` 编码（`parseWeightLabel`，第 34 行），提交时反查匹配的 `optionId`（`handleWeightConfirm`，第 283 行）。整块几乎全是内联样式 + `clamp()` 流式字号，入场用 `staggerIn` keyframe 配 `animationDelay`。
- **默认（normal/gate/trigger）**：纵向/横向 `opt-block` 列表。

`gate` 题型的 `option.value` 会写入 `gateValue`，决定后续 `trigger` 题是否显示（`displayQuestions` 过滤逻辑，第 142-171 行）。

### i18n
`displayQuestions`（第 142-171 行）：`zh-CN` 直接用原文；其他 locale 解析 `q.translations` JSON 取对应语言文案。`renderRichText()`（`src/lib/rich-text.tsx`）解析 `**核心一刀**` → `.rich-punch`（粉色发光强调）、`*低语*` → `.rich-whisper`（暗色弱化），实现"断言→低语→重击"的视觉层次。

### 选中与切换时序（核心动画逻辑）
`handleSelect`（第 247-280 行）是心脏：
1. 若 `isAnimating`，先 `flushPending()` 跳过当前动画再处理新输入（支持连点/连按）。
2. 置 `isAnimating=true`、`selectedOptionId`、`document.body.classList.remove("hovering")`。
3. 触觉反馈：`navigator.vibrate()`（触屏 12ms / 鼠标 40ms）。
4. 把答案按 `safeIndex` 覆盖写入 `answers`（支持回看改答，第 260-261 行）。
5. 入 `pendingRef`，设两个定时器：
   - `fadeTimerRef`（触屏 320ms / 鼠标 400ms）→ `setStageFadeOut(true)` 给 `#test-stage-wrapper` 加 `stage-fade-out` class
   - `timerRef`（触屏 680ms / 鼠标 700ms）→ `flushPending()`

`flushPending`（第 226-245 行）：最后一题则把进度条推到 100%、清 localStorage、`onComplete`；否则推进 `currentIndex`、关闭 `stageFadeOut`、清 `selectedOptionId`。

### 回看 / 键盘
- `handleBack`（第 295 行）：回到上一题，已选高亮由 `useEffect[safeIndex]`（第 186-190 行）自动恢复。
- 键盘（第 303-346 行）：`1/2/3/4` 选对应选项、`scale` 题用 `1/2`、`weight` 题禁用数字键、批注插页任意键继续。动画中按键先 `flushPending` 再处理。

### 批注插页（interjection）
独立于 `currentIndex` 的插页系统（第 107-112 行 state）。`answers.length` 命中 5/10/15（`INTERJECTION_NODES`）且未展示过时触发（第 193-202 行），`POST /api/annotation` 拿动态文案（第 205-224 行），失败用 `ANNOTATION_FALLBACKS` 兜底。`renderInterjection()`（第 559-610 行）渲染全屏 `zIndex:40` 覆盖层，点击/按键关闭。`shownInterjectionsRef` 防止关闭后 useEffect 重开（注释明确标注这是修过的无限重开 bug）。

### 最终 JSX 结构（第 612-684 行）
```
div.view-test (100dvh)
├── #progress-line                          ← 顶部进度条
├── div.test-header                         ← 返回(⇄ SVG) + EXIT
├── div.watermark-index                     ← 巨型罗马数字水印
├── div#test-stage-wrapper (.stage-fade-out?)
│   ├── div.question-stage
│   │   ├── div.q-meta  (题号·分类 / 键盘提示)
│   │   └── div.q-text  (renderRichText)
│   └── renderOptions()  (.options-stage)
└── renderInterjection()  (条件覆盖层)
```
注意 `.view-test` 用 `100dvh`，`#test-stage-wrapper` `flex:1` 承接剩余高度。

---

## 3. 样式方案

**技术栈**（`package.json` + `globals.css` 头部）：Tailwind CSS v4（`@import "tailwindcss"`）+ `tw-animate-css` + `shadcn/tailwind.css`。`postcss.config.mjs` 配 `@tailwindcss/postcss`。shadcn 组件在 `src/components/ui/`（button/card/dialog/progress 等）。

**但答题页几乎不用 Tailwind 工具类**，而是：
- **`src/app/globals.css`（814 行）** 定义全部答题页样式，用语义化自定义 class（`.view-test` / `.opt-block` / `.q-text` / `.watermark-index` / `.test-header` 等）。
- **设计 token** 在 `:root`（第 52-93 行）用 CSS 变量：`--c-gold:#d4af37`、`--c-blood:#8b0000`、`--c-void:#0c0a14`、`--f-title:'Cinzel'`、`--f-body:'Noto Serif SC'`、三个缓动 `--ease-out-expo` / `--ease-in-out-circ` / `--ease-spring`。
- **字体**（`src/app/layout.tsx`）：`next/font/google` 加载 Noto Serif SC + Cinzel，挂 `--font-noto-serif` / `--font-cinzel` 变量；`<html class="... dark">` 强制深色。
- TestScreen 内部对 `weight` 题和插页大量使用**内联 style 对象**（直接引用 `var(--c-gold)` 等 token）。
- `body { overflow:hidden; width:100vw; height:100dvh }` 锁死视口，配 `color-scheme:dark`（第 53-55 行注释说明这是修移动端浅色可读性的根因）。

相关样式分布：答题样式全部在 `globals.css` 第 342-813 行（`/* ===== Test ===== */` 起）；welcome 样式在 `public/index.html` 内联 `<style>`；Result 样式在 `globals.css` 第 418-511 行。

---

## 4. 手机端 vs 桌面端适配

**没有独立的手机组件**，也**没有 useIsMobile hook**。全局只两处 JS 检测触屏（`grep matchMedia` 结果）：
- `TestScreen.tsx:123` —— `window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window` → 写 `touchFeedbackRef`，用于：决定是否显示键盘提示、缩短选中反馈时长（320/680ms vs 400/700ms）、调整震动强度。
- `ResultScreen.tsx:93` —— 检测 `prefers-reduced-motion`。

**真正的响应式全靠 CSS 媒体查询**（`globals.css`）：
- `@media (max-width: 768px)`（第 515-700 行）—— 重灾区：`.view-test` 变 flex 列修复高度链、加 `::before` HUD 取景框（四角十字圆符文 SVG）、`.test-header` 从 absolute 改 relative flex 行、`.watermark-index` 缩到 15vw、`.question-stage` 固定 12rem 高 + absolute 飞出 `.q-meta`、`.options-stage` 改纵向列。
- `@media (max-width: 480px)`（第 702-724 行）—— 进一步缩字号。
- `@media (max-width: 768px), (pointer: coarse)`（第 734-798 行）—— 触屏专属材质重做：`.opt-block` 换不透明墨色 `#1c1b22`、禁用 backdrop-filter、改 `mobileOptIn` keyframe、`:active` 按压反馈、**显式覆盖桌面 `:hover` 泄漏**（注释详细说明触摸设备点击后 hover 残留会闪金色，第 759-766 行）。
- `@media (pointer: coarse)`（第 109 行）隐藏自定义光标。
- `@media (hover: hover) and (pointer: fine)`（第 401 行）才启用桌面 `.opt-block:hover` 的 flex:1.8 挤开效果。
- `@media (prefers-reduced-motion: reduce)`（第 804-813 行）关掉位移动画但保留 opacity/color 过渡。

**桌面 vs 移动布局差异（答题页）**：
- 桌面：`.options-stage` 横向 `flex-direction:row`，选项 `flex:1` 均分，hover 时 `flex:1.8` 挤开，选中 `flex:8` 挤压其余到 `flex:0.01`（戏剧化挤压动画）。
- 移动：`.options-stage` 纵向列，选项 `flex:none` 固定高 `clamp(5.5rem,13.5vh,7.5rem)`，**无挤压**，选中/未选中靠背景明度阶梯（`#26252e` 选中 / `#1c1b22` 中性 / `#100f15` dimmed）+ 金线表达，金色只作 1px 线/序号提亮（"线即珍贵，漆即廉价"的设计哲学，注释第 769-786 行详述）。

---

## 5. 动画系统

**纯 CSS 动画，无 framer-motion**。关键 keyframes 全在 `globals.css`：

- **题目切换**：JS 定时器驱动 `stage-fade-out` class（`globals.css` 第 355-356 行）：`#test-stage-wrapper { transition: opacity 0.3s, transform 0.4s var(--ease-out-expo) }`，`.stage-fade-out { opacity:0; transform: scale(0.98) translateY(-10px) }`。移动端（第 735-736 行）改成更短的 0.25s + 仅 `translateY(-8px)`。
- **选项入场（桌面）**：`staggerIn`（第 395 行）`opacity:0 + translateY(20px) → 1`，每个 `.opt-block` 内联 `animationDelay: idx*0.05s` 错峰。
- **选项入场（移动）**：`mobileOptIn`（第 729-732 行）`translateY(8px) scale(0.98) → none`，0.3s。靠每次切题 `option.id` 变化触发 remount 重放（注释第 726-728 行）。
- **整个 test 视图首进场**：`viewTestEnter`（第 370-371 行）0.6s `opacity+translateY`，`both` fill —— 专门为桥接 iframe 的 `display:none→block` 硬切 + 题目区突然成型而加（注释第 358-369 行详述动机）。
- **进度条**：`#progress-line { transition: width 0.8s var(--ease-out-expo) }`，JS 在 useEffect 里直接写 `el.style.width`（第 349-352 行）。
- **按钮 pulse**：welcome 页 `btn-pulse` keyframe（`globals.css` 第 301-304 行）。
- **loading spinner**：内联 `<style>` 注入 `@keyframes spin`（`page.tsx` 第 227 行）。
- **宿主页 dive 过渡**：`public/index.html` 内联 JS，body `background-color 0.45s ease-out-expo` 从原色→`#000`，hero/bg-text `opacity 0.4s` 淡出（第 1580-1585 行）。

---

## 6. HUD / 顶栏

- **进度条** `#progress-line`（`globals.css` 第 112-120 行）：fixed 顶部 2px 高，渐变 `var(--c-void)→var(--c-gold)→var(--c-blood)`，`box-shadow:0 0 10px gold`，`z-index:9999`。默认 `opacity:0`，靠 `body.in-test #progress-line { opacity:1 }` 显隐 —— TestScreen 挂载时 `document.body.classList.add("in-test")`（第 355-360 行），卸载移除。JS 直接操作 `el.style.width`。
- **题号计数器** `.q-meta`（第 374 行）：左侧 `${current.meta||"审判"} · ${nn} / ${nn}`（TestScreen 第 673 行），`gate/trigger` 题改成 `.gate-badge` 药丸；右侧 `.q-hint` 键盘提示（触屏隐藏）。移动端 `.q-meta` 被 absolute 飞出到 HUD 取景框线下方居中（第 625-633 行）。
- **水印** `.watermark-index`（第 372 行）：右上角巨型罗马数字（`ROMAN[safeIndex]`，35vw，`color:rgba(255,255,255,0.015)` 极淡），`pointer-events:none`，移动端缩到 15vw + 金色。
- **返回按钮**（TestScreen 第 620-643 行）：`safeIndex>0` 才显示，内联 SVG 双向箭头 `⇄`（注释说明用 SVG 而非字符是因为部分安卓缺字形，第 633-634 行），`onMouseEnter/Leave` 内联改色。
- **EXIT 按钮**（第 645-665 行）：清 localStorage + `onExit()`，Cinzel 字体小金字。两个按钮包在 `.test-header`（第 346-354 行）—— 桌面 absolute 顶角、移动端 flex 行（`button:only-child { margin-left:auto }` 处理首题无返回按钮时 EXIT 右贴）。
- **全屏按钮** `src/components/FullscreenButton.tsx`：右下角 fixed 悬浮（`z-index:100`），用 `useSyncExternalStore` 订阅 fullscreenchange，**关键**：同时监听 `window.parent.document`（第 68-74 行），因为 `/test` 在 iframe 内，全屏状态可能挂在父文档 —— `getParentDocument()` 跨域容错。`getParentDocument` 用 try/catch 包 `window.parent.document`。

---

## 7. 背景效果

**全部在宿主文档 `public/index.html`，不在 `/test`**：

- **`#abyss-canvas`**（`globals.css` 第 123 行 + index.html 第 1088 行起）：2D Canvas（无 WebGL）粒子场，约 1300 个"dash"短线。每个 dash 有固定晶格 refPos，可见性是鼠标周围的 smoothstep 环带，位置 = refPos + 噪声位移（~30px），方向沿鼠标径向，颜色在 3 色调色板间用慢噪声混合（第 1080-1086、1334 行注释）。canvas 本体 `filter:blur(40px); opacity:0.6; mix-blend-mode:screen`。鼠标 1.5 秒无移动判为离开（`IDLE_TIMEOUT`，第 1102 行）。
- **`.noise-layer` / `.noise`**（`globals.css` 第 124 行 / index.html 第 96 行）：内联 SVG `feTurbulence fractalNoise` 生成的颗粒，`mix-blend-mode:overlay`，`z-index:1`，`pointer-events:none`。
- **`#cursor-dot` / `#cursor-ring`**（`globals.css` 第 127-131 行）：自定义光标，`mix-blend-mode:difference`，`body.hovering` 时 ring 放大到 70px + 金色。`@media (pointer:coarse)` 隐藏。**注意**：`globals.css` 用 `body.hovering`，index.html 用 `body.hover-active`（两份文档 class 名不同，各自独立）。
- **`#transition-blind`** / **`.view-layer`**（`globals.css` 第 134-148 行）：`scaleY` 黑幕转场 + 视图层 opacity 切换框架。这是为多视图 SPA 设计的，但 `/test` 实际用 iframe 嵌套，所以这套在答题流里**未直接使用**（属历史/其他路由遗留）。
- **`.watermark-index`** 罗马数字水印（见上节）属于 `/test` iframe 内部。
- **body 径向渐变背景**（`globals.css` 第 102-106 行）：4 层 `radial-gradient` 椭圆叠加营造紫黑深空感。但 `/test` 的 `page.tsx` 用内联 `background:#030303` 覆盖了它（第 139 行），所以 iframe 内是纯黑。

---

## 关键文件清单（绝对路径）

核心：
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx` —— iframe 内根，状态编排
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` —— 答题主体（题型/动画/HUD/键盘/持久化/插页）
- `/Users/munich/Desktop/独立项目/magical-girls/public/index.html` —— 宿主落地页，含氛围层(canvas/noise/cursor) + iframe 揭幕逻辑(`initiateDive`/`revealTest`)

样式：
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css` —— 全部答题页样式 + 设计 token（第 342-813 行为 Test 区，第 513-798 行为移动端适配）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/layout.tsx` —— 字体加载 + dark class + AppShell

辅助：
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/rich-text.tsx` —— 富文本 `**`/`*` 标记解析
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/annotations.ts` —— 批注插页兜底文案 `ANNOTATION_FALLBACKS`
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/i18n.tsx` + `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts` —— `test.exit/keyHint/weightHint/gateBadge/triggerBadge` 等 key（zh-CN 里这些值是空串，说明主要靠中文原文）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/FullscreenButton.tsx` —— 跨 iframe/父文档的全屏按钮
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/AppShell.tsx` —— 仅包 `I18nProvider`

样式类命名约定（语义化前缀，非 BEM）：`view-*`（视图根）、`q-*`（题目区）、`opt-*`（选项）、`hero-*`（落地页）、`r-*`（结果页）、状态修饰用 `is-*`（is-selected/is-dimmed/is-active）或 body class（in-test/hovering/test-embedded）。
