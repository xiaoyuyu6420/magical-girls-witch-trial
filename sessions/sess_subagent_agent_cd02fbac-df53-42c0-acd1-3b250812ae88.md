# 我在分析一个 Next.js 项目里答题页面在手机端和电脑端显示效果不一致的问题（电脑端横向布局效果好，手机端纵向...

- 会话 ID: `sess_subagent_agent_cd02fbac-df53-42c0-acd1-3b250812ae88`
- 时间: 2026-08-11 01:45:55 → 2026-08-11 01:48:33
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 10
- 归档状态: 未归档

---

## 👤 用户
我在分析一个 Next.js 项目里答题页面在手机端和电脑端显示效果不一致的问题（电脑端横向布局效果好，手机端纵向效果差）。

工作目录：/Users/munich/Desktop/独立项目/magical-girls

请帮我搜索并报告以下内容：

1. **搜索所有响应式布局相关代码**：在整个 `src/` 目录下搜索：
   - Tailwind 响应式断点的使用：`md:`, `lg:`, `sm:`, `xl:` 这些前缀在哪些文件里出现，尤其是在 TestScreen 和答题相关组件里
   - `flex-row`, `flex-col`, `grid-cols`, `flex-wrap`, `grid-rows` 的使用
   - `@media` 媒体查询在 globals.css 和其他 css 文件里的出现
   - `hidden`, `block`, `flex` 配合 `md:` 使用的显隐切换

2. **答题页面的容器和外层布局**：
   - 搜索 `max-w-`, `min-h-`, `h-screen`, `min-h-screen`, `h-dvh`, `w-full` 等容器尺寸类
   - 报告答题页面的整体容器是如何撑满屏幕的，电脑端和手机端的尺寸约束分别是什么

3. **查找是否有专门的移动端样式文件**：搜索 `*.css`、`*.module.css`、`*.scss` 文件，以及 `@layer`、`@apply` 的使用。

4. **视觉回归测试基线**：我看到 git status 里有 `tests/visual/` 目录和 `crucible-archive/2026-08-10-visual-regression-baseline/`，请报告这些目录里有什么，是否有针对手机端/电脑端的截图对比或断言，能帮助我理解当前布局的预期效果。

5. **查找 viewport 配置**：在 `src/app/layout.tsx` 或其他地方查找 viewport meta、themeColor 等 Next.js metadata 配置。

请直接引用关键代码片段（带 file_path:line_number）。重点是布局的响应式切换逻辑和手机端的实际表现。

## 🤖 助手
我将探索项目结构并并行运行针对性的搜索，以高效地回答您的所有问题。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我已经了解了项目结构。现在我来并行运行所有针对性的搜索。

> 🔧 工具调用 6 次: Bash

## 🤖 助手
目前的调查结果很关键：`TestScreen.tsx` 完全没有使用 Tailwind 响应式断点，而且响应式行为是由 `globals.css` 中 `max-width: 768px` 处的原始 `@media` 查询驱动的。让我深入研究一下答题页面的布局、CSS，以及视觉测试基线。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
现在我已经清楚了架构。`TestScreen` 完全通过 `globals.css` 中的 CSS 类（如 `.options-stage`、`.opt-block` 等）来控制布局，响应式逻辑在 `@media (max-width: 768px)` 处切换。让我读取一下关键的 CSS 部分、可视化测试规范、`playwright` 配置以及基准 `crucible` 文档。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在让我读取一下视觉测试规范、playwright 配置以及基准 crucible 文档，以了解预期的行为和视口（viewport）设置。

> 🔧 工具调用 5 次: Read

## 🤖 助手
让我先阅读一下关于视觉回归基准（visual regression baseline）的关键文档，并查看 `git diff` 以了解可能导致移动端问题的近期未提交更改，同时检查 `/test` 页面是如何挂载 `TestScreen` 的。

> 🔧 工具调用 4 次: Read, Bash

## 🤖 助手
我已经掌握了足够的信息。让我做最后几次针对性的检查，以确认 `.view-test` 容器的显示模型（display model），并核实审计中是否有关于移动端布局（mobile layout）的说明。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我已经掌握了完整的情况。以下是整理好的报告。

---

# 答题页面响应式布局分析报告

## 核心结论（先看这个）

答题页面的响应式切换**完全由 `src/app/globals.css` 中的原生 `@media` 查询驱动**，断点为 `max-width: 768px`。`TestScreen.tsx` 本身**没有任何 Tailwind 响应式断点**（`md:`/`lg:`/`sm:`/`xl:`）。整个项目里 Tailwind 响应式前缀只出现在 shadcn/ui 通用组件（`button.tsx`/`dialog.tsx`/`input.tsx`/`textarea.tsx`），与答题页无关。

电脑端"横向"和手机端"纵向"的差异，根源就是一行 CSS：

`src/app/globals.css:351-352`
```css
.options-stage { flex: 1; display: flex; width: 100vw; flex-direction: row; z-index: 2; }
@media (max-width: 768px) { .options-stage { flex-direction: column; } }
```

- 桌面（>768px）：`.options-stage` 是 `flex-direction: row`，选项是并排的横向面板（"横向布局效果好"）。
- 手机（≤768px）：翻成 `flex-direction: column`，选项纵向堆叠成卡片列表。

---

## 1. 响应式布局相关代码

### 1a. Tailwind 响应式断点（`md:`/`lg:`/`sm:`/`xl:`）

全 `src/` 只有 5 个文件用到，且**全部是 shadcn/ui 通用组件**，与答题页无关：

- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/lib/jwt.ts`（误匹配，非样式）

**`src/components/TestScreen.tsx` 中 `md:`/`lg:`/`sm:`/`xl:` 出现次数：0**

### 1b. flex/grid 方向类

答题相关组件里**没有** `flex-row`/`flex-col`/`grid-cols` 的 Tailwind 用法。`TestScreen` 的方向控制全部走内联 `style` + CSS 类：

- `src/components/TestScreen.tsx:612` — `<div className="view-test" style={{ position: "relative", width: "100%", height: "100%" }}>`
- `src/components/TestScreen.tsx:373,401` — `<div className="options-stage" ...>`（天平题和普通题都复用此类）
- 砝码题（`renderWeightUI`，TestScreen.tsx:441-554）的三槽布局用**内联 `display:flex` + `gap:3vw`**，`maxWidth:600`，没有断点切换，手机端三槽会被 `flex:1` 挤压但仍是横向三列。

仅在 `layout.tsx:67` 的 `<body>` 用了 Tailwind：`className="min-h-full flex flex-col ..."`（但被 globals.css 的 `body { width:100vw; height:100vh; height:100dvh; overflow:hidden }` 覆盖了尺寸）。

### 1c. `@media` 查询（全部在 `src/app/globals.css`，共 636 行单文件）

所有 `@media` 都集中在这一个文件。答题/选项相关的关键查询：

| 行号 | 查询 | 作用 |
|---|---|---|
| `globals.css:106` | `@media (pointer: coarse)` | 隐藏自定义光标 dot/ring |
| `globals.css:352` | `@media (max-width: 768px)` | **`.options-stage` → column（核心切换）** |
| `globals.css:372` | `@media (hover: hover) and (pointer: fine)` | 桌面 `.opt-block:hover` 展开 `flex:1.8`（手机无此交互） |
| `globals.css:403,420,429` | `@media (max-width: 768px)` | 结果页 `.result-layout` → column |
| `globals.css:486-564` | `@media (max-width: 768px)` | **手机端答题页大段重写**（见下方第 4 节） |
| `globals.css:566-588` | `@media (max-width: 480px)` | 小屏字号再缩 |
| `globals.css:590-627` | `@media (max-width: 768px), (pointer: coarse)` | **禁用 staggerIn 动画 + 触摸态按压样式** |
| `globals.css:629-635` | `@media (pointer: coarse) and (max-width: 768px)` | 触摸态 dimmed 选项恢复可见 |

### 1d. 显隐切换（`hidden`/`block`/`flex` 配合断点）

答题页**没有**基于断点的显隐切换。唯一的断点显隐是 shadcn 的 `dialog.tsx:105`（`flex flex-col-reverse ... sm:flex-row`）和 input/textarea 的 `md:text-sm`。`TestScreen` 的键盘提示是用 JS 控制的：`TestScreen.tsx:123-125` 检测 `pointer:coarse` 后 `setShowKeyboardHint(false)`，CSS 端再用 `.q-hint { display: none }`（globals.css:518）兜底。

---

## 2. 答题页面容器与外层布局（电脑 vs 手机尺寸约束）

### 2a. 屏幕撑满链路

- **根**：`src/app/layout.tsx:63-67`
  - `<html className="... h-full antialiased dark">`
  - `<body className="min-h-full flex flex-col ...">`
- **body 实际尺寸**（globals.css:94-97，覆盖 Tailwind）：
  ```css
  body { ... overflow: hidden; width: 100vw; height: 100vh; height: 100dvh; ... }
  ```
  注意 `overflow: hidden` —— **答题页是固定单屏，不能滚动**。
- **`/test` 路由包装层**：`src/app/test/page.tsx:129-134`
  ```jsx
  <div style={{ background:"#030303", minHeight:"100vh", color:"#EFEFEF", fontFamily:"'Space Mono', monospace" }}>
  ```
  这里有个潜在隐患：包装层只有 `minHeight:100vh`，没有显式 `height`/`width:100%`，而 `.view-test`（TestScreen.tsx:612）用内联 `height:100%`。`height:100%` 解析父级高度时，`min-height` 不构成确定的百分比基准 → `.view-test` 的 `height:100%` 实际可能塌成内容高度（桌面/手机同样受影响，但手机内容更长时更容易暴露问题）。
- **`.view-test`**（globals.css:340）：只有 `flex-direction: column`，**没有 `display:flex`**，所以这个 `flex-direction` 实际是 no-op；真正的 flex 容器是下一层 `#test-stage-wrapper`。

### 2b. 答题舞台结构（TestScreen.tsx:665-677）

```
#test-stage-wrapper (flex:1; display:flex; flex-direction:column)   [globals.css:341]
 ├─ .question-stage (flex:0 0 auto; min-height:35vh)                [globals.css:344]
 │    ├─ .q-meta
 │    └─ .q-text  ← 题干
 └─ .options-stage (flex:1)  ← 选项区，桌面 row / 手机 column
```

### 2c. 桌面端约束（>768px）

- `.options-stage`：`flex:1; width:100vw; flex-direction:row`（globals.css:351）→ 选项是等宽横向面板，撑满剩余视口高度。
- `.opt-block`：`flex:1`（globals.css:355），hover 时 `flex:1.8`（globals.css:373），选中 `flex:8`，未选 `flex:0.01`（globals.css:378-385）→ 横向推开/折叠动画。
- `.opt-content`：`position:absolute; max-width:400px`（globals.css:368），居中浮在面板上。
- `.question-stage`：`padding:6vh 8vw 3vh; min-height:35vh`（globals.css:344）。
- `.q-text`：`font-size:clamp(1.3rem, 3.5vw, 2.2rem)`（globals.css:347）。

### 2d. 手机端约束（≤768px）—— 这就是"纵向效果差"的重写区

`globals.css:504-542`（`@media max-width:768px`）：
```css
.question-stage { padding: 3vh 6vw 1.5vh; min-height: 0; }   /* 砍掉 min-height */
.q-hint { display: none; }
.q-text { font-size: clamp(1.05rem, 4.5vw, 1.4rem); line-height: 1.6; }
.options-stage {
  flex: 0 0 auto;          /* 不再拉伸撑满，改为内容尺寸 */
  flex-direction: column;
  width: 100%;
  padding: 0 4vw 2vh;
  gap: 0.6rem;
  justify-content: flex-start;
}
.opt-block { flex: 0 0 auto; min-height: 0; border-radius: 6px; }
.opt-content { position: relative; width: 100%; max-width: none; padding: 0.7rem 1rem; display: flex; flex-direction: row; align-items: center; gap: 0.8rem; }
.opt-index { font-size: 1.1rem; ... flex: 0 0 auto; }     /* 罗马数字变行内小字 */
.opt-text { font-size: clamp(0.85rem, 3.6vw, 1rem); text-align: left; flex: 1; }
```

代码里 line 521-522 还留了一段说明性注释，承认这是个折中：
> options column sits right under the question, content-sized rather than stretched to viewport height — kills the huge empty gaps between options.

进一步叠加 `globals.css:590-602`（`@media max-width:768px, pointer:coarse`）：**禁用 staggerIn 动画**（`opacity:1; transform:none; animation:none`），改成快速 transition，并加 `:active` 按压态。

**手机端"纵向效果差"的可能成因**（基于代码推断）：
1. `body { overflow:hidden }` + `#test-stage-wrapper { flex:1 }` 让答题页是固定单屏；手机端题目文字 + 4 个选项卡片若超出 667px 高度，**无法滚动**，底部选项可能被裁切或挤压。
2. `.question-stage` 手机端 `min-height:0`，但 `.q-text` 用 `white-space: pre-line`（globals.css:347，且是本次未提交改动新增的）—— 长题干会占很多行，挤压下方选项区。
3. 选项卡片 `flex:0 0 auto` + `gap:0.6rem` 是内容尺寸堆叠，没有垂直居中/自适应分配，多选项时容易顶满或留空。

---

## 3. 移动端样式文件 / @layer / @apply

- **CSS 文件只有 1 个**：`src/app/globals.css`（636 行）。**没有** `*.module.css`、`*.scss`。
- **`@layer` 用法：0 处**（grep 全 src 无结果）。
- **`@apply` 用法：0 处**（grep 全 src 无结果）。

所以这个项目对 Tailwind 的使用是"混合模式"：layout.tsx 用了少量 Tailwind 工具类，但所有业务页面的视觉/布局/响应式都写在 `globals.css` 的原生 CSS + `@media` 里，没有走 Tailwind 的响应式体系，也没有 CSS Modules。

---

## 4. 视觉回归测试基线

### 4a. 目录结构

- `tests/visual/`（新增，git status 显示为 `??` 未跟踪）
  - `test.visual.spec.ts` — 答题页基线
  - `welcome.visual.spec.ts`
  - `result.visual.spec.ts`
  - `visual-helpers.ts` — 稳定化 helper
  - `README.md` — 策略文档
  - `_tmp-rich-preview.visual.spec.ts` — 临时（-rich 预览，对应根目录 `tmp-rich-q4.png`/`tmp-rich-q6.png`）
  - `__screenshots__/` — **7 条已提交基线 PNG**：
    - `test-question-desktop-visual-darwin.png`（119KB）
    - `test-question-mobile-visual-mobile-darwin.png`（71KB）← **手机端答题页期望效果**
    - `welcome-desktop-{en,ja,zh}-visual-darwin.png`
    - `welcome-mobile-zh-visual-mobile-darwin.png`
    - `result-profile-card-visual-darwin.png`

- `crucible-archive/2026-08-10-visual-regression-baseline/` — 这次基线工作的完整 crucible 记录：
  - `10-intent-contract.md`（EARS 需求 R1-R16）
  - `30-adr/final.md`（7 条基线清单 + 决策表 D1-D7）
  - `40-implementation.md`（实现记录）
  - `60-audit.md`（审计：发现并修复了 welcome 基线全是粉色色块的 CRITICAL bug）

### 4b. 手机/电脑端对比断言

**视觉基线（像素级）**：`tests/visual/test.visual.spec.ts:25-43` 对同一题分别截 desktop 和 mobile 两张图，断言 `toHaveScreenshot`：

```ts
await expect(page).toHaveScreenshot(
  `test-question-${testInfo.project.name === "visual-mobile" ? "mobile" : "desktop"}.png`,
  { threshold: 0.2 },
);
```

视口由 `playwright.config.ts` 的 project 配置（`playwright.config.ts:54-80`）：
- `visual`：`viewport: { width: 1280, height: 720 }`（桌面）
- `visual-mobile`：`viewport: { width: 375, height: 667 }`（手机，iPhone SE 尺寸）

**结构断言（非像素）**：`tests/mobile.spec.ts:45-64` "quiz page renders options in column layout on mobile" 明确断言手机端是纵向：
```ts
const flexDir = await optionsStage.evaluate((el) => getComputedStyle(el).flexDirection);
expect(flexDir).toBe("column");
// .opt-block should be flex: 0 0 auto (content-sized, not stretched)
const flex = await firstOpt.evaluate((el) => getComputedStyle(el).flex);
expect(flex).toMatch(/0\s+0\s+auto|none/);
```
即：**"手机端选项纵向堆叠 + 内容尺寸"是被测试固化的预期行为**，不是 bug。`mobile.spec.ts:103-123` 还断言手机端无横向溢出。

所以 `tests/visual/__screenshots__/test-question-mobile-visual-mobile-darwin.png` 就是当前"手机端纵向布局"的官方期望基线。如果你的目标是改善手机端效果，需要同步更新这张基线（`pnpm exec playwright test --project=visual-mobile --update-snapshots`，见 README.md:11-16）。

---

## 5. Viewport 配置

在 `src/app/layout.tsx:21-26`，用 Next.js 的 `Viewport` export（App Router 推荐方式）：

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030303",
};
```

- `viewportFit: "cover"` 配合代码里大量 `env(safe-area-inset-*)`（如 TestScreen.tsx:619,642 的返回/退出按钮定位），适配刘海屏。
- `themeColor: "#030303"` 深色主题。
- 没有设 `maximumScale`/`userScalable`（即允许用户缩放）。

---

## 关键文件路径汇总（绝对路径）

- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（答题页，无 Tailwind 断点）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（全部响应式逻辑：行 351-352 切换点，486-564 手机重写，590-627 触摸态）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/layout.tsx`（viewport 配置在 21-26；body/html 在 63-67）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx`（`/test` 路由包装层，129-134 的 `minHeight:100vh` 包装）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/AppShell.tsx`（仅包 I18nProvider，无布局）
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（视口 project 配置 54-80）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/mobile.spec.ts`（手机端结构断言）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`（答题页像素基线）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/__screenshots__/test-question-mobile-visual-mobile-darwin.png`（手机端期望基线图）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible-archive/2026-08-10-visual-regression-baseline/`（基线决策与审计记录）

## 给你排查"手机端纵向效果差"的几个着力点

1. **唯一的断点是 768px**，且切换非常激进（横向面板 ↔ 纵向卡片是完全不同的两套 `.opt-*` 规则）。若想微调手机端，主要改动点在 `globals.css:486-564` 和 `590-627`。
2. **`body { overflow:hidden }`（globals.css:96）+ 固定单屏**：手机端内容溢出时无法滚动，这是"效果差"的高发原因。`.question-stage` 手机端已 `min-height:0`，但 `.q-text` 的 `white-space:pre-line`（globals.css:347，本次未提交改动新增）会让长题干占满高度。
3. **`/test/page.tsx:129-134` 包装层缺确定高度**：`minHeight:100vh` 不为子元素 `height:100%` 提供基准，`.view-test` 的 `height:100%` 可能失效。
4. **砝码题三槽 UI**（TestScreen.tsx:441-554）用内联 `maxWidth:600` + `gap:3vw`，没有手机端断点，三列在 375px 下会被挤压——这是另一处手机端隐患，但不在普通题范围内。
5. 任何手机端改动都要同步更新 `tests/visual/__screenshots__/test-question-mobile-visual-mobile-darwin.png` 基线，否则 `test.visual.spec.ts` 会 FAIL。
