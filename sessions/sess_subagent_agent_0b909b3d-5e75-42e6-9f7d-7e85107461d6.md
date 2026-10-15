# 我需要理解一个 Next.js 项目里"答题页面第一个问题"的 UI 实现细节，目的是分析为什么手机端效果不如电脑...

- 会话 ID: `sess_subagent_agent_0b909b3d-5e75-42e6-9f7d-7e85107461d6`
- 时间: 2026-08-11 01:45:55 → 2026-08-11 01:47:53
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 6
- 归档状态: 未归档

---

## 👤 用户
我需要理解一个 Next.js 项目里"答题页面第一个问题"的 UI 实现细节，目的是分析为什么手机端效果不如电脑端（横向布局 vs 纵向布局的问题）。

工作目录：/Users/munich/Desktop/独立项目/magical-girls

请重点探索并报告以下内容：

1. **答题主组件**：`src/components/TestScreen.tsx` —— 完整读取这个文件，报告：
   - 整体布局结构（用了什么 flex/grid 布局）
   - 第一个问题（题目卡片）的 DOM 结构和布局类名
   - 横向（电脑）和纵向（手机）是如何区分的，用了哪些 Tailwind 响应式断点（如 md:, lg: 等）
   - 选项列表是横向排列还是纵向？有没有 grid-cols 或 flex-row/flex-col 的切换
   - 是否有左右分栏（如左侧题目+右侧插图，或左侧插图+右侧选项）

2. **相关子组件**：如果 TestScreen 引用了其他组件（如选项卡片、进度条、题目容器等），也请报告它们的布局方式。

3. **全局样式**：读取 `src/app/globals.css`，重点关注：
   - 与答题页面相关的自定义 CSS（媒体查询 @media、自定义类）
   - 响应式断点的定义
   - 是否有针对手机端的特殊样式覆盖

4. **Tailwind 配置**：查找 tailwind.config 或 postcss.config，报告断点配置（screens）。

请直接引用关键代码片段（带 file_path:line_number），不要概括。我需要看到具体的布局类名和 CSS 规则，以便分析手机端的布局问题。

## 🤖 助手
我来分析一下项目结构，并同时读取关键文件。

> 🔧 工具调用 4 次: Read, Bash

## 🤖 助手
我已经获取了主要文件。现在让我检查一下 `postcss` 配置、`test` 路由目录、`layout.tsx` 和 `AppShell`，以了解整体结构，并确认 `TestScreen` 是否引用了任何子组件。

> 🔧 工具调用 5 次: Read, Bash

## 🤖 助手
让我先查看测试页面的包装结构，以了解 `TestScreen` 是如何挂载的，因为这是关键所在。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
我现在已经掌握了所需的所有信息。这是一个基于 **Tailwind CSS v4** 的项目，但很重要的一点是，`TestScreen` 完全没有使用 Tailwind 的工具类来进行布局——所有功能都是通过 `globals.css` 中的自定义 CSS 类和原始 `@media` 查询来实现的。以下是详细报告。

---

## 关键背景：这个项目没用 Tailwind 响应式前缀

- `package.json:34,41` → `@tailwindcss/postcss: ^4`, `tailwindcss: ^4`（Tailwind **v4**）
- 没有 `tailwind.config.js/ts` 文件。配置全在 `globals.css` 顶部用 `@theme inline`（`globals.css:7-49`）
- `postcss.config.mjs` 只挂了 `@tailwindcss/postcss`，没有任何自定义 `screens` 断点
- **TestScreen.tsx 里的 className 全是自定义类**（`view-test` / `question-stage` / `options-stage` / `opt-block` / `opt-content` 等），**没有出现任何 `md:` / `lg:` / `grid-cols-*` / `flex-row` / `flex-col` 这类 Tailwind 工具类**

也就是说，电脑 vs 手机的横向/纵向切换，**完全由 `globals.css` 里的原生 `@media (max-width: 768px)` 完成**，不在 TSX 里。这是分析手机端问题时最容易看错的地方。

---

## 1. TestScreen.tsx 整体布局结构

### 1.1 根容器（`TestScreen.tsx:611-612`）

```tsx
<div className="view-test" style={{ position: "relative", width: "100%", height: "100%" }}>
```

`.view-test` 在 `globals.css:340`：
```css
.view-test { flex-direction: column; }
```
注意它是 **纵向 column**，并且高度靠内联 `height: 100%` 撑开（依赖父级有显式高度，见后文风险点）。

### 1.2 主舞台容器（`TestScreen.tsx:665-677`）

```tsx
<div ref={stageRef} id="test-stage-wrapper" className={stageFadeOut ? "stage-fade-out" : ""}>
  <div className="question-stage">
    <div className="q-meta"> ... </div>
    <div className="q-text" id={questionLabelId}>{renderRichText(current.text)}</div>
  </div>
  {renderOptions()}   // 渲染 <div className="options-stage">
</div>
```

`#test-stage-wrapper` 在 `globals.css:341`：
```css
#test-stage-wrapper { flex: 1; display: flex; flex-direction: column; width: 100%; height: 100%; }
```

所以整体是：**题目卡片在上、选项区在下，垂直堆叠**——并不是"左题右图"或"左图右选项"的分栏。

### 1.3 第一个问题的题目卡片 DOM（`TestScreen.tsx:666-675`）

```tsx
<div className="question-stage">
  <div className="q-meta">
    <span>{...} 审判 · 01 / XX</span>
    <span className="q-hint">{showKeyboardHint ? t("test.keyHint") : ""}</span>
  </div>
  <div className="q-text" id={questionLabelId}>{renderRichText(current.text)}</div>
</div>
```

`.question-stage` 在 `globals.css:344`：
```css
.question-stage {
  flex: 0 0 auto;
  display: flex; flex-direction: column; justify-content: center;
  padding: 6vh 8vw 3vh; position: relative; z-index: 2;
  min-height: 35vh;
}
```
注意 `min-height: 35vh`（桌面）——题目区至少占视口高度 35%。

`.q-text`（`globals.css:347`）：
```css
.q-text {
  font-size: clamp(1.3rem, 3.5vw, 2.2rem);
  font-weight: 500; line-height: 1.6;
  text-shadow: 0 4px 20px rgba(0,0,0,0.8);
  white-space: pre-line;
}
```

---

## 2. 选项列表的布局：横向 vs 纵向（核心）

`renderOptions()`（`TestScreen.tsx:368-422`）对所有非特殊题型（normal/gate/trigger/scale）输出同一个结构：

```tsx
<div className="options-stage" role="radiogroup" ...>
  {current.options.map((option, idx) => (
    <button className={`opt-block ${selectedOptionId===option.id ? "is-selected" : ""} ...`}>
      <div className="opt-content">
        <div className="opt-index">{ROMAN[idx]}</div>
        <div className="opt-text">{option.label}</div>
      </div>
    </button>
  ))}
</div>
```

### 2.1 桌面端（电脑）：选项是横向并排的大面板（`globals.css:351-356`）

```css
.options-stage {
  flex: 1; display: flex; width: 100vw;
  flex-direction: row;   /* ← 关键：横向 */
  z-index: 2;
}
.opt-block {
  flex: 1;               /* 每个选项等分填满剩余高度 */
  ...
}
```
桌面交互（`globals.css:372-385`）：hover 时 `flex: 1.8`，选中时 `flex: 8 !important`，未选的塌缩成 `flex: 0.01`。所以电脑上是 **占据整个视口下半部分的左右并排大色块**，鼠标悬停会有戏剧性的展开动画。

### 2.2 手机端（≤768px）：选项变成纵向、内容高度的小条（`globals.css:352` + `globals.css:521-542`）

第一处切换（行 352，紧跟在 `.options-stage` 定义之后）：
```css
@media (max-width: 768px) { .options-stage { flex-direction: column; } }
```

第二处是更详细的覆盖（`globals.css:521-542`，在 `@media (max-width: 768px)` 块内）：
```css
.options-stage {
  flex: 0 0 auto;            /* ← 关键：从 flex:1 改成内容高度 */
  flex-direction: column;
  width: 100%;
  padding: 0 4vw 2vh;
  gap: 0.6rem;
  justify-content: flex-start;
}
.opt-block {
  flex: 0 0 auto;            /* ← 关键：不再等分拉伸 */
  min-height: 0;
  border-radius: 6px;
}
.opt-content {
  position: relative; width: 100%; max-width: none;
  padding: 0.7rem 1rem;
  display: flex; flex-direction: row; align-items: center; gap: 0.8rem;  /* ← 罗马序号 + 文字横向排 */
}
.opt-index { font-size: 1.1rem; margin-bottom: 0; opacity: 0.45; flex: 0 0 auto; }
.opt-text   { font-size: clamp(0.85rem, 3.6vw, 1rem); text-align: left; flex: 1; }
```

**这正是"手机端效果不如电脑端"的直接来源：**
- 电脑：`.options-stage` 是 `flex:1` + `flex-direction:row`，每个 `opt-block` 是 `flex:1` → 占满视口高度的沉浸式横向大面板，还有 hover/选中的 `flex 1→1.8→8` 戏剧展开。
- 手机：`.options-stage` 变成 `flex:0 0 auto` + `column`，`opt-block` 也是 `flex:0 0 auto; min-height:0` → 选项退化成紧贴在题目下方的几条窄横条（高度仅由 `padding: 0.7rem 1rem` 决定），完全失去了占满屏幕的沉浸感。

### 2.3 触屏进一步的简化（`globals.css:590-627`）

```css
@media (max-width: 768px), (pointer: coarse) {
  #test-stage-wrapper { ...; justify-content: center; }   /* ← 题目+选项整体垂直居中 */
  .opt-block {
    opacity: 1; transform: none; animation: none;         /* ← 禁掉入场动画 staggerIn */
    background: rgba(12,7,22,0.55);
    backdrop-filter: none; -webkit-backdrop-filter: none;  /* ← 关掉毛玻璃 */
    transition: background 0.16s ease, ...;                /* ← 过渡加快 */
    contain: layout paint;
  }
  ...
}
```
这里 `#test-stage-wrapper { justify-content: center }` 让内容垂直居中——配合上面 `.options-stage` 的 `flex:0 0 auto`，会出现「题目+几条窄选项」整体浮在屏幕中部、上下留大片空白的观感（电脑端则被 `flex:1` 撑满）。

### 2.4 更小屏（≤480px）字号再缩（`globals.css:566-588`）

```css
@media (max-width: 480px) {
  .q-text { font-size: clamp(0.95rem, 5vw, 1.2rem); }
  .opt-text { font-size: clamp(0.8rem, 4vw, 0.95rem); }
  .opt-index { font-size: 1.5rem; }
  ...
}
```

---

## 3. 没有独立子组件

`TestScreen.tsx` 的 import 只有逻辑模块（`TestScreen.tsx:3-7`）：
```tsx
import { useI18n } from "@/lib/i18n";
import type { AnnotationNode } from "@/lib/annotations";
import { ANNOTATION_FALLBACKS } from "@/lib/annotations";
import { renderRichText } from "@/lib/rich-text";
```
**没有任何 UI 子组件**——选项卡片、进度条、题目容器全部内联。进度条就是 `<div id="progress-line" />`（`TestScreen.tsx:613`），样式在 `globals.css:109-117`，由 JS 直接改 `style.width`（`TestScreen.tsx:348-351`、`232-234`）。所以"子组件布局"这一层不存在。

砝码题（`renderWeightUI`，`TestScreen.tsx:425-555`）和批注插页（`renderInterjection`，`TestScreen.tsx:558-609`）用的是**纯内联 style 对象**，没有任何 className，也不参与本次"第一题"分析。

---

## 4. 全局样式与断点（`globals.css`）

- 没有自定义 Tailwind `screens`，全部用原生 `@media`。断点只有两个：**`max-width: 768px`**（平板/手机主断点）和 **`max-width: 480px`**（小屏），外加特性查询 **`(pointer: coarse)`**（触屏）和 **`(hover: hover)`**。
- `body` 设了 `width:100vw; height:100vh; height:100dvh; overflow:hidden`（`globals.css:94-97`）——锁死视口、不滚动。

### 与答题页相关的关键 CSS（按行号汇总）

| 选择器 | 行号 | 桌面行为 | 手机行为（≤768px） |
|---|---|---|---|
| `.view-test` | 340 | `flex-direction: column` | 同 |
| `#test-stage-wrapper` | 341 | `flex:1; flex-direction:column` | + `justify-content:center`（591行） |
| `.question-stage` | 344 | `padding:6vh 8vw 3vh; min-height:35vh` | `padding:3vh 6vw 1.5vh; min-height:0`（510行） |
| `.q-text` | 347 | `clamp(1.3rem,3.5vw,2.2rem)` | `clamp(1.05rem,4.5vw,1.4rem)`（519行） |
| `.options-stage` | 351-352 | `flex:1; flex-direction:row` | `flex:0 0 auto; flex-direction:column; gap:.6rem`（523-530行） |
| `.opt-block` | 354 | `flex:1`（等分高度），hover→`1.8`，selected→`8` | `flex:0 0 auto; min-height:0`（531-535行） |
| `.opt-content` | 368 | `position:absolute; max-width:400px; text-align:center` | `position:relative; flex-direction:row; padding:.7rem 1rem`（536行） |
| `.q-hint` | 346 | 显示快捷键提示 | `display:none`（518行） |
| `.opt-block` 动效 | 359-366 | `opacity:0; translateY(20px); staggerIn` 入场 | `animation:none; opacity:1; transform:none`（593-604行） |

---

## 5. 潜在风险点（额外发现，可能与手机端"不对劲"有关）

### 5.1 高度链可能断裂：`minHeight` 父 + `height:100%` 子

`src/app/test/page.tsx:128-134` 的包裹层用的是内联 `minHeight: "100vh"`（不是 `height`）：
```tsx
<div style={{ background: "#030303", minHeight: "100vh", color: "#EFEFEF", fontFamily: ... }}>
  ...
  <TestScreen ... />
</div>
```
而 `TestScreen.tsx:612` 的根是 `style={{ ... height: "100%" }}`，`.view-test` + `#test-stage-wrapper` 也都依赖 `flex:1` / `height:100%` 撑高。**`height:100%` 在只有 `min-height` 的父容器里通常解析为 `auto`（即内容高度）**，加上 `layout.tsx:67` 的 `<body className="min-h-full flex flex-col">` 也是 `min-h-full` 而非 `h-full`。这意味着在某些移动浏览器上，`#test-stage-wrapper` 的 `flex:1` 没有一个明确的"剩余高度"可分配，可能导致桌面端那种"题目占顶部 35vh + 选项填满剩余"的布局在手机上退化为"按内容堆在一起、上下留白"——叠加 2.3 的 `justify-content:center` 就是浮在中部。

### 5.2 `.opt-block.is-dimmed` 在手机端的双重重写

- `globals.css:541-542`：在 `max-width:768px` 下 `.opt-block.is-dimmed .opt-content { max-height:0; padding:0; overflow:hidden }`（把未选项内容藏起来）
- 但 `globals.css:629-635` 又有 `@media (pointer:coarse) and (max-width:768px) { .opt-block.is-dimmed .opt-content { max-height:none; padding:.7rem 1rem; overflow:visible } }`（再放出来）

两条规则都作用在同一类手机上，靠选择器特异性决定胜负。如果某台手机 UA 同时满足 `pointer:coarse` 且 `max-width:768px`，选完一项后未选项**不会**塌缩隐藏，而是保持可见但变暗——和桌面端的"选中项膨胀、其余塌成细缝"观感完全不同，可能也是"手机不如电脑"的体感来源之一。

---

## 6. 结论：手机端布局问题的根因

1. **没有用 Tailwind 响应式工具类**，所有响应式都在 `globals.css` 的 `@media (max-width:768px)` 里手写。
2. **选项区在桌面是 `flex:1 / row` 的全屏并排大面板**（带 hover 展开动画），**手机被改成 `flex:0 0 auto / column` 的内容高度窄条**（`globals.css:352` 和 `globals.css:521-542`），这是观感落差的最大来源——沉浸式色块变成了贴底的列表项。
3. **`#test-stage-wrapper` 在触屏下被 `justify-content:center`**（`globals.css:591`），加上 `min-height:0` 的选项不再撑高，整个内容浮在屏幕中部留白。
4. **入场动画 `staggerIn` 在手机被整体关掉**（`globals.css:593-604`），失去电脑端的逐项浮现节奏。
5. **高度链** `minHeight:100vh`(page) → `height:100%`(view-test) 在移动端可能解析为内容高度，使 `flex:1` 失去分配基准（见 5.1）。

要定位/修复手机端，重点应放在 `globals.css:351-352`、`globals.css:521-542`、`globals.css:590-604` 这三段，以及 `test/page.tsx:129-134` 的包裹层高度。
