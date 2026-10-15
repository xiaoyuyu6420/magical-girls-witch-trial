# 这是一个 Next.js 项目（magical-girls 主题测验应用），我正在重构手机版测试页的动画。我需要你...

- 会话 ID: `sess_subagent_agent_c61f9b78-5475-4764-b2f3-df3eec652193`
- 时间: 2026-08-11 17:41:12 → 2026-08-11 17:43:22
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
这是一个 Next.js 项目（magical-girls 主题测验应用），我正在重构手机版测试页的动画。我需要你盘点出**测试页（test 页面）相关的所有动画/过渡声明的完整清单**，作为"删除旧动画"的工作底稿。

请重点搜索以下三个文件，并给出每个文件中所有相关声明的精确位置（文件路径 + 行号 + 完整代码片段）：

1. `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`
   - 所有 `transition:` 声明
   - 所有 `animation:` / `@keyframes` 声明
   - 所有 `will-change:` 声明
   - 所有 `transform:` 声明（特别是 hover/active/state 变换用的）
   - 所有 `contain:` 声明
   - 重点区域：`.question-stage`、`.q-meta`、`.q-text`、`.options-stage`、`.opt-block`、`.opt-content`、`.opt-index`、`.opt-text`、`#test-stage-wrapper`、`.stage-fade-out`、`.test-header`、`.watermark-index` 这些选择器
   - 请按"桌面端规则（媒体查询外）"和"移动端规则（@media max-width:768px 块、@media pointer:coarse 块、@media max-width:480px 块）"分别归类

2. `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`
   - 所有涉及动画/过渡的状态变量（stageFadeOut、is-selected、is-dimmed、等）
   - selectOption / handleSelect / 切题逻辑的完整代码（我需要知道点击选项后的时序：什么时候加 class、什么时候 setTimeout、什么时候切下一题）
   - 任何 inline style 里的 transition/animation

3. 如果还有其他 CSS 文件或组件涉及测试页动画，也一并列出。

输出格式：按文件 → 按选择器/区域分组，每条给出"行号 + 代码 + 它当前在做什么动画"。最后给一段总结：当前测试页一共有几条动画/过渡规则，分别服务于什么交互（进场、选中、淡出切题、hover 等）。

只读取，不要修改任何文件。

## 🤖 助手
我将先探索项目结构，并并行读取关键文件。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我来完整读取这两个主文件，并检查测试页的路由结构。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
我已经获取了这两个主文件。现在让我检查一下测试页面路由、AppShell 以及其他任何可能驱动测试页动画的组件（光标、过渡遮罩、进度条）。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
我来检查一下 `ResultScreen` 中共享的关键帧依赖项，并确认没有其他 CSS 文件或模块。

> 🔧 工具调用 3 次: Bash

## 🤖 助手
我快速检查一下 `layout.tsx` 以查看全局的 `chrome` 元素（光标、遮罩）是否还在，并确认进度条和 `in-test` 类是测试页面专有的。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
我已经掌握了全局情况。以下是需要重构的测试页完整的动画/过渡清单。

---

# 测试页动画/过渡完整清单（工作底稿）

## 0. 范围与关键发现（先读这段）

- **唯一的 CSS 文件**是 `src/app/globals.css`（689 行），没有 CSS Module / SCSS。`layout.tsx` 第 8 行全局导入它。
- 测试页相关的 DOM 选择器全部在 `TestScreen.tsx` 里创建：`.view-test`、`.test-header`、`.watermark-index`、`#test-stage-wrapper`、`.stage-fade-out`、`.question-stage`、`.q-meta`、`.q-text`、`.options-stage`、`.opt-block`、`.opt-content`、`.opt-index`、`.opt-text`、`.gate-badge`、`#progress-line`。
- 全局 chrome 的 `#cursor-dot`/`#cursor-ring`/`#transition-blind`/`#abyss-canvas`/`.noise-layer`/`.view-layer`/`.view-welcome` 在 React 树里**没有任何 TSX 创建它们**（grep 全空），属于死 CSS —— 但不在本次"测试页动画"范围内，先不动。
- **重要依赖警告**：`@keyframes staggerIn`（globals.css 第 377 行）不仅服务于 `.opt-block` 进场，还被 `TestScreen.tsx` 的砝码题 UI（第 462、547 行）、批注插页 overlay（第 574 行）通过内联 `animation: staggerIn ...` 引用。删除/重命名时这三处会一起断。
- 移动端没有独立的 `@media (pointer: coarse)` 测试动画块；`pointer: coarse` 是和 `max-width: 768px` 合并在第 628 行那个块里的。

---

## 1. `src/app/globals.css`

### 1.1 基础设施：缓动变量（被几乎所有测试动画引用）
- **第 62 行** `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);`
- **第 63 行** `--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);`
- **第 64 行** `--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);`

### 1.2 桌面端规则（媒体查询外）

**`#progress-line`（顶部进度条，测试页专属，由 `body.in-test` 控制可见）**
- **第 113 行** `transition: width 0.8s var(--ease-out-expo);`
  - 作用：答题推进时进度条宽度动画。`TestScreen.tsx` 第 351 行 `el.style.width = ${progress}%` 驱动它。
- （第 117 行 `body.in-test #progress-line { opacity: 1; }` 只切可见性，opacity 无 transition。）

**`#test-stage-wrapper`（题目+选项的外层容器）**
- **第 352 行** `transition: opacity 0.3s, transform 0.4s var(--ease-out-expo);`
  - 作用：切题时的整体淡出/缩放（配合 `.stage-fade-out` 类）。

**`.stage-fade-out`（切题时挂在 wrapper 上的类）**
- **第 353 行** `opacity: 0; transform: scale(0.98) translateY(-10px); pointer-events: none;`
  - 作用：定义"淡出态"的终值；transition 由第 352 行提供。**这是移动端要被第 630 行覆盖的目标。**

**`.watermark-index`（背景大号罗马数字水印）**
- **第 354 行** `transform: translate(10%, -10%);`
  - 作用：纯静态定位位移，**不是动画**（无 transition/animation）。重构时可保留，仅列出备查。

**`.opt-block`（每个选项按钮，桌面进场 + hover 基础）**
- **第 368 行** `transition: flex 0.5s var(--ease-out-expo), background 0.3s, border-color 0.3s;`
  - 作用：hover 时 `flex: 1.8` 横向推开其它选项、选中时 `flex: 8` 撑开的过渡。
- **第 370 行** `opacity: 0; transform: translateY(20px);`
  - 作用：`staggerIn` 进场动画的**初始态**。
- **第 371 行** `animation: staggerIn 0.6s var(--ease-out-expo) forwards;`
  - 作用：选项进场（从下方淡入）。延迟由 `TestScreen.tsx` 第 383/411 行内联 `animationDelay` 控制。

**`@keyframes staggerIn`**
- **第 377 行** `@keyframes staggerIn { to { opacity: 1; transform: translateY(0); } }`
  - 作用：进场终态。**被砝码题 UI、批注插页复用（见第 3 节依赖警告）。**

**`.opt-content`（选项内部文字容器）**
- **第 379 行** `transition: opacity 0.2s, transform 0.4s var(--ease-out-expo);`

**`.opt-index`（罗马序号）**
- **第 380 行** `transition: all 0.3s;`

**`.opt-text`（选项文字）**
- **第 381 行** `transition: all 0.3s;`

**桌面 hover（`@media (hover: hover) and (pointer: fine)`，第 383–387 行）**
- **第 384 行** `.opt-block:hover { flex: 1.8; background: ...; border-color: ...; z-index: 10; }` —— 用第 368 行的 flex transition。
- **第 385 行** `.opt-block:hover .opt-index { opacity: 0.3; transform: scale(1.2); color: var(--c-gold); }` —— hover 时序号放大。
- **第 386 行** `.opt-block:hover .opt-text { opacity: 1; font-weight: 500; }`

**选中态 `.is-selected`（第 389–394 行）**
- **第 390 行** `.opt-block.is-selected { flex: 8 !important; background: ... !important; box-shadow: inset 0 0 80px ...; border-color: var(--c-gold) !important; z-index: 20; }` —— 选中项横向撑满。
- **第 393 行** `.opt-block.is-selected .opt-index { opacity: 0.6; transform: scale(1.5); color: var(--c-gold); }`
- **第 394 行** `.opt-block.is-selected .opt-text { opacity: 1; transform: scale(1.05); font-weight: 700; color: #fff; text-shadow: ...; }`

**未选中变暗 `.is-dimmed`（第 395–396 行）**
- **第 395 行** `.opt-block.is-dimmed { flex: 0.01 !important; background: transparent !important; border-color: transparent !important; }` —— 桌面端把未选项压成几乎 0 宽。
- **第 396 行** `.opt-block.is-dimmed .opt-content { opacity: 0 !important; transform: scale(0.8) !important; }`

> `.question-stage`（355）、`.q-meta`（356）、`.q-text`（358）、`.options-stage`（362）、`.test-header`（343）在桌面基线里**都没有 transition/animation**，只有布局。

### 1.3 移动端 `@media (max-width: 768px)` 块（第 497–602 行，测试部分 515–602）

**`.question-stage`（第 538–543 行）**
- **第 542 行** `transition: height 0.5s var(--ease-out-expo), opacity 0.4s ease;`
  - 作用：选中答案后题区从 116px 压缩到 50px 的高度动画。配合下面第 557 行的 `:has()` 目标。

**`.q-meta`（第 544–551 行）**
- **第 550 行** `transition: opacity 0.3s ease;`
  - 作用：选中后题号 meta 淡出。配合第 558 行目标。

**`:has()` 选中目标（第 557–558 行）** —— 上面两条 transition 的"终值"
- **第 557 行** `#test-stage-wrapper:has(.opt-block.is-selected) .question-stage { height: 50px; opacity: 0.28; }`
- **第 558 行** `#test-stage-wrapper:has(.opt-block.is-selected) .q-meta { opacity: 0; }`

**`.opt-block`（第 573–577 行）** —— 仅布局覆盖（flex/min-height/border-radius），**无 transition 覆盖**（transition 覆盖在 1.5 那个块）。

> `.watermark-index`（528–532）、`.q-text`（553）、`.opt-content`（578）、`.opt-index`（579）、`.opt-text`（580）这里都是字号/颜色调整，**无动画声明**。

### 1.4 移动端 `@media (max-width: 480px)` 块（第 604–626 行，测试部分 620–622）
- **第 620 行** `.q-text { font-size: ... }`
- **第 621 行** `.opt-text { font-size: ... }`
- **第 622 行** `.opt-index { font-size: 1.5rem; }`

> **本块只有字号，零动画/过渡声明。** 列出仅为完整性。

### 1.5 移动端动画核心块 `@media (max-width: 768px), (pointer: coarse)`（第 628–688 行）
这是移动端测试动画的真正主体，几乎所有声明都在覆盖桌面端。

**`#test-stage-wrapper`（第 629 行）**
- `transition: opacity 0.16s ease, transform 0.18s var(--ease-out-expo); justify-content: flex-start;`
  - 作用：**覆盖桌面第 352 行**（0.3s/0.4s → 0.16s/0.18s），让切题更快更轻。

**`.stage-fade-out`（第 630 行）**
- `transform: translateY(-4px);`
  - 作用：**覆盖桌面第 353 行**的 `scale(0.98) translateY(-10px)`，去掉缩放、减小位移。（`opacity:0` 仍继承自桌面第 353 行。）

**`.opt-block`（第 631–645 行）—— 移动端选项核心**
- **第 632 行** `opacity: 1;`
- **第 633 行** `transform: none;`
- **第 634 行** `animation: none;` —— **关闭桌面 staggerIn 进场**。
- **第 635–638 行** 背景边框/backdrop 覆盖（非动画）。
- **第 642 行** `transition: flex 0.4s var(--ease-out-expo), opacity 0.3s ease;` —— **覆盖桌面第 368 行**，移动端只过渡 flex+opacity（注释说明 flex 动画是 layout-bound，每帧 reflow）。
- **第 643 行** `will-change: flex;` —— **全文件唯一一条 `will-change`**。
- **第 644 行** `contain: layout;` —— **全文件唯一一条 `contain`**。

**`.opt-content`（第 646 行）**
- `transition: opacity 0.25s ease;` —— **覆盖桌面第 379 行**（去掉 transform 过渡）。

**`:active` 触摸反馈（第 647–648 行）**
- **第 647 行** `.opt-block:active { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); }`
- **第 648 行** `.opt-block:active .opt-text { opacity: 1; }`

**`.is-selected` 移动端覆盖（第 649–657 行）**
- **第 652 行** `flex: 1 1 auto !important;` —— **覆盖桌面 `flex: 8`**（移动端纵向，选中项填满剩余空间）。
- **第 653 行** `background: rgba(212,175,55,0.18) !important;`
- **第 654 行** `box-shadow: inset 0 0 36px rgba(212,175,55,0.12);`
- **第 656 行** `.opt-block.is-selected .opt-index { opacity: 0.48; transform: none; }` —— **覆盖桌面 `transform: scale(1.5)`**。
- **第 657 行** `.opt-block.is-selected .opt-text { transform: none; }` —— **覆盖桌面 `transform: scale(1.05)`**。

**`.is-dimmed` 移动端覆盖（第 658–686 行）**
- **第 662 行** `flex: 0 0 44px !important;` —— **覆盖桌面 `flex: 0.01`**（移动端不压成 0，而是 44px 细条，保留序号+截断文字）。
- **第 663 行** `min-height: 44px;`
- **第 664 行** `opacity: 0.85;`
- **第 668–677 行** `.opt-block.is-dimmed .opt-content { opacity: 1 !important; transform: none !important; flex-direction: row !important; ... }` —— **覆盖桌面第 396 行**，改成横向行布局。
- **第 678 行** `.opt-block.is-dimmed .opt-index { font-size: 0.85rem; opacity: 0.55; margin: 0; flex-shrink: 0; }`
- **第 679–686 行** `.opt-block.is-dimmed .opt-text { font-size: 0.75rem; opacity: 0.55; ... text-overflow: ellipsis; }`

---

## 2. `src/components/TestScreen.tsx`

### 2.1 驱动动画的状态变量
- **第 91 行** `const [isAnimating, setIsAnimating] = useState(false);` —— 锁，选中后到切题完成期间为 true，期间禁用点击（第 383/411 行 `pointerEvents: isAnimating ? "none" : "auto"`）。
- **第 92 行** `const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);` —— 驱动 `.is-selected` / `.is-dimmed` 类（第 379/407 行三元判断）。
- **第 94 行** `const [stageFadeOut, setStageFadeOut] = useState(false);` —— 驱动 `.stage-fade-out` 类（第 663 行 `className={stageFadeOut ? "stage-fade-out" : ""}`）。
- **第 103 行** `const touchFeedbackRef = useRef(false);` —— 在挂载时（第 123–124 行）由 `matchMedia("(pointer: coarse)")` 判定，决定下方两组延时。
- **第 104 行** `const timerRef = useRef<number>(0);` —— 切题定时器（totalDelay）。
- **第 105 行** `const fadeTimerRef = useRef<number>(0);` —— 淡出定时器（feedbackDelay）。

### 2.2 `handleSelect`（第 247–280 行）—— 点击选项后的完整时序

```ts
// 247  const handleSelect = useCallback((option: QuizOption) => {
// 249    if (isAnimating) { flushPending(); return; }   // 动画中再次点击 → 跳过当前动画
// 254    setIsAnimating(true);
// 255    setSelectedOptionId(option.id);               // ← 立刻加 is-selected / is-dimmed 类（触发 flex/opacity 过渡）
// 256    document.body.classList.remove("hovering");   // 关闭自定义光标 hover 态
...
// 266    if (navigator.vibrate) navigator.vibrate(isTouchFeedback ? 12 : 40);  // 触感反馈
...
// 272    const feedbackDelay = isTouchFeedback ? 300 : 400;   // 触摸 300ms / 鼠标 400ms
// 273    const totalDelay   = isTouchFeedback ? 650 : 700;    // 触摸 650ms / 鼠标 700ms
// 274    fadeTimerRef.current = window.setTimeout(() => {
// 275      setStageFadeOut(true);                  // ← feedbackDelay 后挂 .stage-fade-out（整体淡出）
// 276    }, feedbackDelay);
// 277    timerRef.current = window.setTimeout(() => {
// 278      flushPending();                         // ← totalDelay 后真正切下一题
// 279    }, totalDelay);
// 280  }, [...]);
```

时序解读：
1. **t=0**：`selectedOptionId` 设值 → CSS 立刻给选中项加 `is-selected`（flex 撑开）、其它项加 `is-dimmed`（flex 压扁）。这是"推开/挤压"动画的起点，由 globals.css 的 `transition: flex ...` 驱动（桌面第 368 行 / 移动第 642 行）。
2. **t=300ms（触摸）/400ms（鼠标）**：`setStageFadeOut(true)` → `#test-stage-wrapper` 加 `.stage-fade-out`，整体淡出+位移（桌面第 353 行 / 移动第 630 行）。
3. **t=650ms（触摸）/700ms（鼠标）**：`flushPending()` 真正切题。

### 2.3 `flushPending`（第 226–245 行）—— 切题与状态复位
- **第 240 行** `setCurrentIndex((i) => i + 1);` —— 推进到下一题。
- **第 241 行** `setStageFadeOut(false);` —— **移除 `.stage-fade-out`**，新题目以正常态出现（注：新题的选项进场靠桌面 `staggerIn`；移动端 `animation:none` 所以无进场动画）。
- **第 243 行** `setIsAnimating(false);`
- **第 244 行** `setSelectedOptionId(null);` —— 清掉选中态。
- （最后一题分支第 232–237 行：进度条拉满 100%、清 localStorage、`onComplete`。）

### 2.4 `handleBack`（第 295–300 行）—— 返回上一题
- **第 298 行** `setStageFadeOut(false);`
- **第 299 行** `setCurrentIndex(safeIndex - 1);`
- 返回时**不走 fade-out**，直接瞬切。

### 2.5 内联 `transition` / `animation` 声明

**选项按钮（scale/weight 两种 renderType 都有，第 383 与 411 行）**
- **第 383 行 / 第 411 行** `style={{ animationDelay: \`${idx * 0.1}s\`, pointerEvents: isAnimating ? "none" : "auto" }}`
  - 作用：给桌面 `staggerIn` 进场提供逐项 0.1s 错峰延迟。（移动端 `animation:none` 后此 delay 无效。）

**砝码题 `renderWeightUI`（第 426–556 行）**
- **第 461–462 行** 三槽容器：`opacity: 0, transform: "translateY(20px)"` + `animation: staggerIn 0.6s var(--ease-out-expo) ${slotIdx * 0.1}s forwards` —— **复用 globals.css 的 staggerIn**。
- **第 494 行** `−` 按钮：`transition: "all 0.2s"`。
- **第 510 行** `+` 按钮：`transition: "all 0.2s"`。
- **第 530 行** 总和文字：`transition: "color 0.3s"`。
- **第 545–547 行** 落锤确认按钮：`transition: "all 0.3s"` + `opacity: 0, transform: "translateY(20px)"` + `animation: "staggerIn 0.6s var(--ease-out-expo) 0.3s forwards"` —— **复用 staggerIn**。

**批注插页 overlay（第 559–610 行）**
- **第 574 行** `animation: "staggerIn 0.6s var(--ease-out-expo) forwards"` —— **复用 staggerIn**。

**顶栏按钮（test-header 内，第 619–661 行）**
- **第 631 行** 返回按钮：`transition: "all 0.3s ease"`（配合第 633/634 行 onMouseEnter/Leave 改 color）。
- **第 650 行** EXIT 按钮：`transition: "all 0.3s ease"`（配合第 652/655 行 onMouseEnter/Leave 改 color）。

---

## 3. `src/app/test/page.tsx`

- **第 210 行** 加载 spinner：`animation: "spin 1s linear infinite"`
- **第 218 行** 内联定义：`<style>{\`@keyframes spin { to { transform: rotate(360deg); } }\`}</style>`
  - 作用：提交答案时的全屏 loading 转圈。**独立于测试题交互动画**，重构测试题动画时一般不动它，但列出备查。

---

## 4. 跨文件依赖警告（删动画时务必一并处理）

| globals.css 中的定义 | 被 TSX 内联引用的位置 | 删除后果 |
|---|---|---|
| `@keyframes staggerIn`（第 377 行） | TestScreen 第 462、547、574 行 | 砝码题三槽、落锤按钮、批注插页进场全部失效 |
| `--ease-out-expo`（第 62 行） | TestScreen 第 462、547、574 行；globals.css 第 113/352/368/371/379/542/629/642 行 | 所有缓动声明失效 |
| `--ease-in-out-circ`（第 63 行） | globals.css 第 135、142 行（view-layer/transition-blind，全局 chrome） | 全局过渡失效 |

---

## 5. 总结：当前测试页一共有多少条动画/过渡规则，分别服务什么交互

按"交互目的"归类，测试页当前共有 **约 7 类、30+ 条**动画/过渡声明：

1. **进场（entrance）—— 桌面专属，移动端被关掉**
   - `@keyframes staggerIn`（globals 377）+ `.opt-block` 的 `animation: staggerIn ...`（371）+ 初始 `opacity:0; transform:translateY(20px)`（370）+ `TestScreen` 内联 `animationDelay`（383/411）。
   - 移动端在 628 块用 `animation:none; opacity:1; transform:none`（632–634）显式关闭。
   - 服务：每道新题选项逐个淡入。

2. **hover 推开（桌面专属）**
   - `@media (hover:hover)` 块（383–387）：hover 时 `flex:1.8`、序号 `scale(1.2)`、文字加粗。靠 `.opt-block` 的 `transition: flex/background/border-color`（368）和 `.opt-index/.opt-text` 的 `transition: all .3s`（380/381）驱动。
   - 服务：鼠标悬停时选项横向扩张预览。

3. **选中挤压（is-selected / is-dimmed）—— 桌面+移动各有版本**
   - 桌面：`flex:8`（390）/ `flex:0.01`（395）/ 序号 `scale(1.5)`（393）/ 文字 `scale(1.05)`（394）/ dimmed content `scale(0.8)`（396）。
   - 移动（628 块）：`flex:1 1 auto`（652）/ `flex:0 0 44px`（662）/ 全部 `transform:none`（656/657/670）/ dimmed 改横向行布局（668–686）。
   - 触发：`handleSelect` 第 255 行 `setSelectedOptionId`。
   - 服务：点选后选中项撑开、其它项压缩的"聚焦"反馈。

4. **触摸 :active 反馈（移动专属）**
   - 628 块第 647–648 行。
   - 服务：手指按下瞬间的背景/文字提亮。

5. **淡出切题（stage-fade-out）**
   - `.stage-fade-out` 桌面（353）：`scale(0.98) translateY(-10px)` + opacity:0；移动覆盖（630）：仅 `translateY(-4px)`。
   - `#test-stage-wrapper` transition 桌面（352）：`opacity .3s, transform .4s`；移动覆盖（629）：`opacity .16s, transform .18s`。
   - 触发：`handleSelect` 第 275 行 `setStageFadeOut(true)`（延时 300/400ms）→ `flushPending` 第 241 行复位。
   - 服务：切下一题前的整体淡出。

6. **题区压缩（移动专属）**
   - `.question-stage` 的 `transition: height .5s, opacity .4s`（542）+ `:has(.is-selected)` 目标 `height:50px; opacity:.28`（557）；`.q-meta` 的 `transition: opacity .3s`（550）+ 目标 `opacity:0`（558）。
   - 服务：移动端选中答案后，题区高度坍缩、meta 淡出，把空间让给选项。

7. **进度条**
   - `#progress-line` 的 `transition: width .8s`（113）。
   - 触发：`TestScreen` 第 351 行写 `el.style.width`。
   - 服务：顶部进度条随答题推进。

**移动端性能优化相关（非交互，但属于"动画声明"）**：`will-change: flex`（643）+ `contain: layout`（644），仅作用于移动端 `.opt-block`，注释明确是为了缓解 flex 动画每帧 reflow。删 flex 动画时这两条可一并去掉。

**建议删除优先级（按"移动端重构"目标）**：1.5 节整个 628–688 块（移动端选项动画核心）→ 1.3 节第 542/550/557/558 行（题区压缩）→ 2.2 节的 `touchFeedbackRef` 双延时逻辑（272–273 行）可简化为单一时序。桌面端（1.2 节）若保留桌面体验则不动；若要统一则 1.2 + 2.5 内联 `animationDelay` 一起清。**务必同步处理第 4 节的 staggerIn 跨文件依赖。**
