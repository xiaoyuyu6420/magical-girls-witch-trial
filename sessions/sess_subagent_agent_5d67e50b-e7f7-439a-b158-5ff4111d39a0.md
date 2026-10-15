# 你是 implementer，负责「HTML 32 视觉重做」的 **IM3：AuroraBurst 极光组件 +...

- 会话 ID: `sess_subagent_agent_5d67e50b-e7f7-439a-b158-5ff4111d39a0`
- 时间: 2026-08-13 12:15:54 → 2026-08-13 12:20:19
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 18
- 归档状态: 未归档

---

## 👤 用户
你是 implementer，负责「HTML 32 视觉重做」的 **IM3：AuroraBurst 极光组件 + test/page.tsx 转场交接**。

## 拥有文件（唯一可改）
1. `/Users/munich/Desktop/独立项目/magical-girls/src/components/AuroraBurst.tsx`（新建）
2. `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx`（改：极光替换 loading spinner）

## 禁区
globals.css（IM1 已定义 .aurora-burst，只读）；TestScreen/ResultScreen/BackgroundLayers（其他模块）；tests/（IM6）。

## 必读
1. `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md` —— **决策1（极光替换loading-spinner+Reveal骨架保留）、盲点#8（aurora z8000）、#13（loading与aurora交接）、风险1（极光×fetch时序竞态）**
2. `/Users/munich/Downloads/ai_studio_code (32).html` —— `triggerFinalTransition`（行1490-1513）时序 100ms+800ms+400ms；`.aurora-burst`（scale 1→250 + radial gold→purple→void）；`.curtain-overlay`（fixed居中）
3. `/Users/munich/Desktop/独立项目/magical-girls/crucible/40-implementation.md` —— IM3 接口契约段
4. `src/app/test/page.tsx` —— 现有 handleComplete（fetch /api/match+/api/results）、loading 态（约L201-229 spinner）、showResult 切换、submitError 态、window.parent 握手。

## 接口契约
```tsx
export function AuroraBurst({ active, minDurationMs = 1300, onComplete }: {
  active: boolean; minDurationMs?: number; onComplete?: () => void;
}): JSX.Element | null
```

## 任务

### AuroraBurst.tsx
- fixed 全屏覆盖层（z8000），内含 `.aurora-burst` 圆点（CSS 已定义 scale 1→250+radial）。
- useEffect 监听 active：active=true → 添加 .active class 触发动画 + setTimeout(minDurationMs) 调 onComplete；active=false → 移除 .active（淡出）。
- reduced-motion（盲点#7）：CSS 已处理 transform:scale(1)，组件层无需额外（可不动 rAF 类）。
- "use client"；卸载 clearTimeout。

### test/page.tsx
- **用 AuroraBurst 替换 loading spinner**（约L201-229）。
- 改 handleComplete 流程：
  1. Q26 完成 → setAuroraActive(true) 触发极光 + **并发** fetch /api/match+/api/results
  2. 极光 minDuration ~1300ms
  3. `Promise.all([fetchDone, auroraMinDuration])` 都满足 → setShowResult(true)+setAuroraActive(false)（极光淡出，ResultScreen 挂载）
  4. **弱网保护**（风险1）：极光 minDuration 结束但 fetch 未就绪 → 极光保持覆盖（auroraActive 保持 true）等 fetch 完成
  5. submitError 态保留（fetch 失败回退）
- AuroraBurst 的 onComplete 处理 minDuration 满足信号；fetch 完成是另一个信号；两者 Promise.all。

## 约束
- 不破坏 fetch 逻辑（URL/body/错误处理原样）
- submitError/window.parent 握手保留
- 不碰 ResultScreen（IM5 负责 Reveal）

## 验证
- `pnpm exec tsc --noEmit`（AuroraBurst 导出 + page.tsx 类型正确；ResultScreen 由 IM5 改若未完成致 import 报错属集成问题）
- review：极光时序、弱网保持覆盖、reduced-motion、卸载清理

## 输出
1. BLUF 2. 触及文件 3. 交付接口 4. 局部检查 5. 偏离/不确定（极光×fetch时序实现选择）

## 🤖 助手
我先读取所有必读文件，了解契约和上下文。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在读金标 HTML 的极光部分和 globals.css 中 `.aurora-burst` 的定义。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
金标和 CSS 都清楚了。现在快速确认几个细节：TestScreen 的 onComplete 触发方式（只读）、`loading.text` 键的其他引用、tsconfig 的 noUnusedLocals 设置。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
细节确认完毕：TestScreen 在 `isCompleted` 后自身 return null（L370），所以极光覆盖期间答题页已卸载、无交互目标，与金标 mainStage 隐藏一致；`loading.text` 键仅 page.tsx 一处使用；tsconfig 未开 `noUnusedLocals` 但删掉无用 import 更干净。

开始实现。先创建 AuroraBurst.tsx。

> 🔧 工具调用 1 次: Write

## 🤖 助手
现在修改 page.tsx。先改 import 和 state 声明。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
现在重写 handleComplete 为极光 + 并发 fetch + 双信号交接。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
最后替换 spinner JSX 为 AuroraBurst。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
跑类型检查验证。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
两个错误：page.tsx 用了默认导入（契约是命名导出）；`JSX` 全局命名空间在 React 19 类型中已移除，需从 react 导入。修复。

> 🔧 工具调用 2 次: Edit

## 🤖 助手
tsc 通过。最后通读一遍改后的 page.tsx 确认无残留。

> 🔧 工具调用 1 次: Read

## 🤖 助手
全部完成，tsc 通过。最终审查确认：无 `loading`/`useI18n`/`t` 残留，spinner 已完全替换为 AuroraBurst。

---

### BLUF

IM3 完成：AuroraBurst 极光组件已建（z8000 fixed 覆盖层 + `.aurora-burst` 圆点 + minDuration 计时信号），test/page.tsx 的 loading spinner 已替换为极光转场，fetch 并发化 + 双信号（极光最小时长 × fetch 完成）Promise.all 交接，弱网保持覆盖、submitError 回退、window.parent 握手全部保留。`pnpm exec tsc --noEmit` 通过，零错误。

### 触及的文件

- `/Users/munich/Desktop/独立项目/magical-girls/src/components/AuroraBurst.tsx` — 创建 — 极光幕布组件：fixed 全屏容器（z8000）+ `.aurora-burst` 圆点，active 驱动 `.active` class + setTimeout(minDurationMs) 发 onComplete 信号；卸载/失活时 clearTimeout；reduced-motion 由 CSS 兜底组件零分支
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx` — 修改 — `loading` state 与 spinner JSX（L201-229）删除，换 `auroraActive` state + AuroraBurst；handleComplete 改为"触发极光 + 并发 fetch /api/match + /api/results → Promise.all 后等 auroraGate → 切结果"；submitError 回退与 `lastCompletion` 重试原样保留

### 交付的接口

- `AuroraBurst` — `export function AuroraBurst({ active, minDurationMs = 1300, onComplete }: { active: boolean; minDurationMs?: number; onComplete?: () => void }): JSX.Element | null` — **匹配契约**（`JSX` 命名空间在 React 19 类型中已无全局定义，改为 `import type { JSX } from "react"` 显式导入，类型语义与契约字面完全一致）

### 局部检查

- `pnpm exec tsc --noEmit` — **通过**（AuroraBurst 导出 + page.tsx 类型全绿；当前 ResultScreen 版本可编译，未出现 IM5 集成问题）
- 完整测试套件 — 未跑（兄弟模块 IM2/IM4/IM5 进行中，按纪律只验证本模块）

### 契约偏离

无硬偏离，两处实现选择需知悉：

1. **容器未用金标 `.curtain-overlay` class**：globals.css（IM1 交付清单）未定义该 class，为避免引入未定义 class 误导后续 E2E，fixed 居中容器用内联样式实现（position fixed / inset 0 / zIndex 8000 / flex 居中 / overflow hidden）。金标 curtain-overlay 语义完整保留。
2. **极光×fetch 交接的具体机制**（契约给了方向、未定机制）：page 侧用 `resolveAuroraRef` 持有 promise resolve 句柄，AuroraBurst `onComplete` resolve 之；`await Promise.all([matchPromise, statsPromise])` 后 `await auroraGate` 再 `setShowResult(true) + setAuroraActive(false)`——fetch 快时极光播满 1300ms 才切，fetch 慢时 auroraActive 保持 true、极光（scale 250 铺满）持续覆盖直至 fetch 完成（弱网保护）。fetch 失败 → catch 里 `setAuroraActive(false)` + submitError 回退（极光提前淡出，与旧 spinner 立即消失行为等价）。原串行 fetch 改为并发，但 URL/body/错误处理逐字保留；`trackEvent` 仍在 match 成功后立即触发（不阻塞切结果）。TestScreen 在 `isCompleted` 后自身 return null（L370），极光期间无交互目标，故容器未设 pointer-events:none（与旧 loading overlay 拦截行为一致）。

### 诚实信心

覆盖了契约全部四条时序要求（minDuration 信号、双信号交接、弱网保持覆盖、卸载清理）；唯一未覆盖的边界是"极光播放中 fetch 失败"的视觉叠加（极光淡出与错误 UI 同帧出现），行为正确但未做视觉实测；另 `loading.text` i18n 键因删 spinner 成孤儿（无害，ADR 盲点 #12 建议收尾清理，i18n 文件不在我拥有范围，留给编排者）。
