# 你是 implementer，负责「HTML 32 视觉重做」的 **IM2：BackgroundLayers 背...

- 会话 ID: `sess_subagent_agent_c3a28cf3-2388-477b-8cc1-8f2444c5930f`
- 时间: 2026-08-13 12:15:54 → 2026-08-13 12:18:36
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 15
- 归档状态: 未归档

---

## 👤 用户
你是 implementer，负责「HTML 32 视觉重做」的 **IM2：BackgroundLayers 背景层组件**（纯展示，零状态）。

## 拥有文件（唯一创建）
`/Users/munich/Desktop/独立项目/magical-girls/src/components/BackgroundLayers.tsx`（新建）

## 禁区
不改其他任何文件（globals.css 由 IM1 完成；TestScreen.tsx 由 IM4 负责挂载你的组件）。

## 必读
1. `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md` —— 盲点#7（reduced-motion C2/P8红线）、#11（SSR守卫）
2. `/Users/munich/Downloads/ai_studio_code (32).html` —— `<script>` 的 `initCanvas`/`drawCanvas`（Canvas 紫粒子 45 个 rAF，rgba(216,0,255,α)，shadowBlur=10）+ `.bg-typography`（浮雕题号）+ `.film-grain`
3. `/Users/munich/Desktop/独立项目/magical-girls/crucible/40-implementation.md` —— IM2 接口契约段 + IM1 交付的 class 清单
4. `src/app/globals.css` —— IM1 已定义 `#bg-canvas`/`.bg-typography`/`.film-grain`（z1，reduced-motion 下 #bg-canvas display:none）。你只写组件逻辑。

## 接口契约（严格遵守）
```tsx
export function BackgroundLayers({ questionIndex, reducedMotion }: {
  questionIndex: number;
  reducedMotion: boolean;
}): JSX.Element | null
```

## 任务
渲染三层（z 低→高）：
1. **`<canvas id="bg-canvas">`**：移植 HTML 32 的 initCanvas/drawCanvas——~45 粒子，rgba(216,0,255,α)，shadowBlur=10+shadowColor='#D800FF'，rAF 循环，边界反弹，resize 监听重设尺寸。
   - **reducedMotion=true → return null 不渲染 canvas、不启 rAF**（盲点#7）
   - **SSR 守卫**：typeof window==='undefined' return null（盲点#11）
   - 卸载时 cancelAnimationFrame + removeEventListener resize（防泄漏）
2. **`<div className="bg-typography">`**：文本 = `String(questionIndex+1).padStart(2,'0')`（"01".."26"）。questionIndex 变化更新。
3. **`<div className="film-grain">`**：空 div（CSS 已定义 SVG noise）。

## 约束
- "use client"（用了 window/canvas/rAF）
- useRef/useEffect，不引入新依赖
- 卸载必须清理（红方查泄漏）

## 验证
- `pnpm exec tsc --noEmit`（保证导出签名正确；兄弟模块 IM4 会 import 你的组件，若 IM4 在建导致 tsc 报错属集成问题）
- review：reducedMotion/SSR/卸载清理三路径

## 输出
1. BLUF 2. 触及文件 3. 交付接口 4. 局部检查 5. 偏离/不确定

## 🤖 助手
IM1 的样式契约已确认（`#bg-canvas`/`.bg-typography`/`.film-grain` 都在 atmosphere 层 z1，reduced-motion 层有 `#bg-canvas{display:none}` 兜底）。现在读金标 HTML 的 canvas 实现和项目结构。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
金标实现已拿到（45 粒子、`rgba(216,0,255,α)`、shadowBlur=10、边界反弹、resize→initCanvas）。现在确认 React 19 types 下 `JSX.Element` 全局命名空间是否可用，以及组件目录风格。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
`JSX.Element` 全局可用（@types/react 19.2.18 的 `declare global` 兼容块）。契约签名可直接写。现在创建组件。

> 🔧 工具调用 1 次: Write

## 🤖 助手
组件已创建。跑局部检查（tsc + eslint）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
`JSX.Element` 全局命名空间在 @types/react 19 已移除（React 19 官方迁移：改用 `React.JSX`）。检查 react 包的导出形式，选择最小偏离方案。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
确认：@types/react 19 中 `JSX` 命名空间只在 `React` 命名空间内部（`export = React`），全局 `JSX` 已移除。用 `import type { JSX } from "react"` 保持契约签名逐字不变（`JSX.Element | null`）。

> 🔧 工具调用 1 次: Edit

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
全部验证完成。tsc 中 `BackgroundLayers.tsx` 自身零错误；剩余 3 个错误全部在兄弟模块（IM3 的 `AuroraBurst.tsx` 和 `test/page.tsx`，其中 AuroraBurst 也有同样的全局 `JSX` 问题——那是 IM3 的文件，我不碰，标记给编排者）。eslint 通过。

### BLUF
IM2 BackgroundLayers 已构建完成：金标 canvas 紫粒子（45 个、rAF、边界反弹、resize 重置）+ 浮雕题号 + film-grain 三层，reducedMotion/SSR/卸载清理三守卫齐备。tsc 本文件零错误（eslint 通过），唯一实现性调整是 `import type { JSX } from "react"`（React 19 types 移除全局 JSX 命名空间，契约签名 `JSX.Element | null` 逐字保留）。

### 触及的文件
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/BackgroundLayers.tsx` — 创建 — 纯展示背景层组件：`#bg-canvas` 粒子动画 + `.bg-typography` 题号 + `.film-grain`，三守卫 + 卸载清理

### 交付的接口
- `BackgroundLayers({ questionIndex, reducedMotion })` — `({ questionIndex: number; reducedMotion: boolean }) => JSX.Element | null` — 匹配契约（props 用命名 `BackgroundLayersProps` 接口而非内联字面量，结构类型对 IM4 调用侧完全等价，且匹配 TestScreen 现有风格）

### 局部检查
- `pnpm exec tsc --noEmit` — 通过（本文件零错误；剩余 3 个错误全在兄弟模块：`src/components/AuroraBurst.tsx(24,5)` 与 `src/app/test/page.tsx` 的 IM3 问题，属集成问题，未触碰）
- `pnpm exec eslint src/components/BackgroundLayers.tsx` — 通过

三路径 review：
- reducedMotion=true → `!reducedMotion && <canvas>` 不渲染 canvas；effect 首行 return 不启 rAF；题号浮雕与 grain 照常渲染（静态层，CSS reduced-motion 层已降级）✓
- SSR（`typeof window === "undefined"`）→ render return null + effect 首行 return ✓
- 卸载 → cleanup `cancelAnimationFrame(rafId)` + `removeEventListener("resize", initCanvas)`（同引用、同引用函数，正确配对）✓

### 契约偏离
1. **`JSX.Element` 需显式 import**：契约写裸 `JSX.Element`，依赖全局 JSX 命名空间——@types/react 19（19.2.18）已移除全局 `JSX`（仅 `React.JSX` 存在），裸写会报 TS2503。已加 `import type { JSX } from "react"`，签名文本 `JSX.Element | null` 逐字不变。IM3 的 AuroraBurst.tsx 有同样问题，建议编排者同步告知。
2. **reducedMotion 的 return null 范围**：契约两处措辞（任务消息「return null 不渲染 canvas」挂在 canvas 条目下；40-implementation「渲染：canvas（reducedMotion 时 return null 不渲染、不启 rAF）+ bg-typography + film-grain」并列三层）存在歧义。我取交集解读：**reducedMotion 只跳过 canvas 层，typography/grain 保留渲染**（与 IM1 的 CSS 守卫一致——`.bg-typography{transition:none}`/`.film-grain{opacity:.03}` 均假设元素在 DOM，且题号静态文字对 reduced-motion 用户仍可用）。整个组件 return null 仅 SSR。若编排者意图是 reducedMotion 时三层全 null，改一行即可。

### 诚实信心
- 边界情况：hydration 时 SSR(null) → client(有 canvas) 会产生 React hydration mismatch 警告（客户端重渲染后正常），这是契约指定守卫方式的固有行为（盲点 #11 原文亦如此），已在代码注释标注。
- 未覆盖：组件未自带 matchMedia 检测——reducedMotion 由 IM4 传入（契约如此设计），若 IM4 未正确检测 `prefers-reduced-motion` 并传 prop，CSS 层 `#bg-canvas{display:none}` 兜底仍会隐藏画布但 rAF 会空转（不画任何可见内容，仅 CPU 浪费）；集成时请确认 IM4 的 matchMedia 逻辑。
- 猜测部分：resize 时重建粒子（金标行为：`resize → initCanvas` 全量重建而非仅重设尺寸），严格按金标移植。
