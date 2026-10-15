# 你是 red-team，从**无障碍（a11y）**维度攻击「HTML 32 视觉重做」。硬配额：至少 **K=3...

- 会话 ID: `sess_subagent_agent_067047e5-6e8a-4555-8d79-10ec3a5b0579`
- 时间: 2026-08-13 15:05:12 → 2026-08-13 15:11:38
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 32
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**无障碍（a11y）**维度攻击「HTML 32 视觉重做」。硬配额：至少 **K=3** 个真实问题，或说明为什么更少。

## 实现（攻击对象）
项目根 `/Users/munich/Desktop/独立项目/magical-girls`。
- `src/components/BackgroundLayers.tsx`（canvas 粒子，reduced-motion 应禁用）
- `src/components/AuroraBurst.tsx`（极光转场，reduced-motion 应跳过 scale）
- `src/components/TestScreen.tsx`（HUD 双胶囊按钮、键盘映射、toast）
- `src/components/ResultScreen.tsx`（Reveal 骨架 aria-hidden/aria-live/focus、posture 柱图、按钮）
- `src/app/globals.css`（reduced-motion 守卫、focus-visible）

## 契约
- `crucible/10-intent-contract.md` P8（reduced-motion 全链路）、P7（键盘）、R29（focus-visible）、final.md 盲点#7（reduced-motion 覆盖严重不足，C2/P8 红线）、#10（focus-visible）

## 你的攻击面（a11y）
1. **reduced-motion 全链路（最关键，盲点#7 红线）**：现状只有 1 处覆盖。新增动效是否都有守卫？
   - BackgroundLayers canvas rAF（reducedMotion 时不渲染？）
   - AuroraBurst scale 1→250（reducedMotion 跳过 scale？CSS 是否钉 scale(1)？）
   - posture stat-fill width transition（reducedMotion 无过渡？）
   - 卡片 floatIn/staggerIn（reducedMotion 静态？）
   - 查 globals.css 的 `@media (prefers-reduced-motion: reduce)` 覆盖了哪些，漏了哪些。实际跑 `pnpm playwright test` 用 reducedMotion emulation 验证。
2. **键盘导航**：IM4 的 #btn-back tabIndex 守卫（Q1 时 -1）是否正确？HUD 按钮键盘可达？选项键盘（1/2/3）映射是否保留？ResultScreen 按钮 tabIndex（revealPhase done 才 0）是否正确？
3. **focus-visible**：新增可聚焦元素（.hud-capsule .hud-btn / .btn-neo-primary / .btn-neo-secondary）是否都有 focus-visible 焦点环？颜色对比够吗？
4. **aria**：BackgroundLayers canvas 有 aria-label/role？AuroraBurst aria-hidden？ResultScreen reveal overlay role=status/aria-live 是否正确？posture 柱图是否可访问（盲人能读到 A/B/C 占比）？
5. **对比度**：金紫黑深色主题下，文字（rgba(255,255,255,0.5) 等）对比度是否达 WCAG AA？金色字在黑底？
6. **prefers-reduced-motion 与极光时序**：reducedMotion 下极光跳过 scale，但 minDurationMs(1300) 等待是否还必要？会不会 reducedMotion 用户多等 1.3s？

## 方法
- Read 代码 + globals.css reduced-motion 段
- 跑 playwright reducedMotion emulation 截图/验证（webServer 配 playwright.config.ts，注意 reuseExistingServer 残留 server 问题）
- 每条发现：具体 a11y 缺陷 + 影响（哪类用户受影响）+ 复现 + 建议修复

## 输出
3+ 条发现，每条：`[严重度] 标题 | a11y缺陷 | 受影响用户 | 复现/位置 | 建议修复`。

## 🤖 助手
我将从无障碍维度攻击实现。先读代码和 spec。

> 🔧 工具调用 4 次: Read

## 🤖 助手
现在读 globals.css 的 reduced-motion 段和 focus-visible，以及 spec 契约。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
只有**一处** reduced-motion 媒体查询（line 1422）。读它的内容，以及关键动效定义。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
发现关键线索：reduced-motion 块只覆盖了 `.opt-block`，但 `.balance-pan` 和 `.weight-card` 也用了 `staggerIn` 动画。逐一核实。

> 🔧 工具调用 3 次: Read

## 🤖 助手
核实 `.opt-block` 的初始 opacity（reduced-motion 设 `animation: none` 后，若基线 opacity:0 会变不可见）。

> 🔧 工具调用 2 次: Read

## 🤖 助手
关键疑点：`.opt-block` 基线是 `opacity:0`，reduced-motion 设 `animation: none` 后会停留在不可见状态。还要确认 `@layer` 优先级是否让守卫失效。查 layer 结构。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
layer 顺序确认 reduced-motion 是最高优先级层。现在核心疑点：`.opt-block` 在 reduced-motion 下 `animation: none`，但基线 `opacity:0` 未被覆盖 → 可能不可见。必须实际验证。先看 playwright 配置和是否有 reduced-motion 测试。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
有 reduced-motion 视觉测试但只覆盖 ResultScreen，TestScreen 选项在 reduced-motion 下完全没测。`.opt-block` 基线 opacity:0 确认。现在实际跑 playwright 验证核心疑点。先看配置和测试命令。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
检查是否已有 server 在 3010 运行，避免完整 build。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
server 已在运行（reuseExistingServer 会复用）。写一个最小测试验证 `.opt-block` 在 reduced-motion 下是否可见。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
没进入测试屏（optCount:0）。看现有测试怎么进入 test screen。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
看现有测试如何从 welcome 进入 test screen。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
直接 `/test` 路由。重写测试，导航到 `/test` 并验证 opt-block 可见性 + animation 状态。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
**确认 CRITICAL**：reduced-motion 下所有 `.opt-block` 的 `opacity=0`（动画被禁但基线 opacity:0 未恢复）→ 选项完全不可见。继续验证 balance-pan/weight-card（不在 reduced-motion 块里）的动画是否仍在跑。先找哪些题是 scale/weight 类型。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
Scale 题在 order 8/22，weight 在 order 14。用 localStorage 跳转验证 balance-pan/weight-card 在 reduced-motion 下的动画状态。先拿 questionId/optionId。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
3 条核心发现已确认。继续验证 interjection-overlay 内联动画（CSS 媒体查询管不到 inline style）和 canvas 隐藏状态。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
4 条已确认（超过 K=3）。canvas 和 toast 守卫正确。再快速核实 AuroraBurst 时序问题（reducedMotion 用户是否多等 1300ms）和对比度。先找 AuroraBurst 调用处。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
AuroraBurst 的 1300ms 在 reduced-motion 下仍等待（但仅 opacity 淡出，属允许范畴，记为线索）。现在验证对比度：interjection 的"点击继续"提示用 `rgba(255,255,255,0.25)`（TestScreen.tsx:581），是关键指令文本。实测对比度。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
5 条已验证。快速核对 spec 契约原文（P8/reduced-motion、盲点#7）以精确引用，然后清理临时测试文件。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
spec 引用齐全（R30/G5/P8/盲点#7）。清理临时测试文件。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
所有发现已实测验证。以下是 a11y 维度攻击报告。

---

### BLUF
5 条已验证的 a11y 缺陷，全部经 Playwright `reducedMotion:"reduce"` emulation 实测确认。最严重的是 **F1**：reduced-motion 守卫把 `.opt-block` 的 `animation: none` 了，却没把基线的 `opacity:0` 恢复成 1 —— **普通题的三个选项在 reduced-motion 下计算值 `opacity=0` 完全不可见**，前庭敏感/低视力用户正是最需要这份照顾的人，却被直接锁在问卷外。spec 的 P8/R30/G5 红线（"每个新动效必须自带 reduced-motion 守卫"、"用户能打开答题页并答完"）未忠实实现。

### 最严重问题
**F1**：`globals.css:1423` 的 `.opt-block { animation: none; }` 让 reduced-motion 用户的所有普通题选项停留在 `opacity:0` 不可见 —— G5 验收标准（"reduced-motion 下打开答题页并答完"）直接失败。

### 发现

- **[F1] 严重度：Critical — `src/app/globals.css:1422-1426` + `:440-452`**
  - **影响：** `reducedMotion:"reduce"` 下实测三个 `.opt-block` 的 `getComputedStyle().opacity` 全部为 `"0"`、`animationName="none"`、`transform=translateY(20px)`。普通题（26 题中约 20 题）、gate 题、trigger 题的选项**对 reduced-motion 用户完全不可见**。前庭功能障碍、偏头痛、低视力用户——正是 reduced-motion 服务的群体——看不到任何可选项。违反 spec G5（"W 打开答题页 + 答完"）和 P8/R30。
  - **复现：** `test.use({ contextOptions: { reducedMotion: "reduce" } })` → `page.goto("/test")` → 任意普通题 → `getComputedStyle(locator('.opt-block').first()).opacity === "0"`。
  - **根因：** `.opt-block` 基线声明 `opacity:0; transform:translateY(20px); animation: staggerIn ... forwards;`（L445-446）。reduced-motion 块（L1423）只覆盖 `animation: none`，但 staggerIn 的终值（opacity:1）本靠 `forwards` 保持；动画被禁后元素回落到基线 `opacity:0`。守卫只删了动画，没补上终态。
  - **Spec 缺口？：** **是**——G5 要求 reduced-motion 用户"能答完"，P8/R30 要求降级；代码做了降级却把内容一起降没了。
  - **修复方向：** reduced-motion 块里给 `.opt-block`（以及 `.balance-pan`/`.weight-card`）补 `opacity: 1 !important; transform: none !important;`，或在基线用 `@starting-style`/无动画的可见终态。

- **[F2] 严重度：High — `src/app/globals.css:615-622`（`.balance-pan`）**
  - **影响：** reduced-motion 下天平题（order 8、22）的 `.balance-pan` 实测 `animationName="staggerIn"`、`animationDuration="0.6s"` 仍在跑——translateY(20px)→0 + opacity 0→1 的入场位移正是前庭敏感用户要求关闭的运动。reduced-motion 块（L1422-1443）只列了 `.opt-block`，**漏了 `.balance-pan`**。
  - **复现：** 同 F1 emulation，localStorage 跳到 currentIndex=7 → `.balance-pan` `animationName=staggerIn`。
  - **Spec 缺口？：** **是**——R30 明列"卡片 floatIn"须降级；P8"所有动效提供降级"。balance-pan 入场属同类 translateY+opacity 位移，未守卫。
  - **修复方向：** reduced-motion 块加 `.balance-pan { animation: none; opacity: 1; transform: none; }`。

- **[F3] 严重度：High — `src/app/globals.css:645-650`（`.weight-card`）**
  - **影响：** reduced-motion 下砝码题（order 14）的 `.weight-card` 实测 `animationName="staggerIn"`、`animationDuration="0.5s"` 仍跑，三张卡片依次 translateY(16px)→0 + 淡入。同 F2，reduced-motion 块完全没提 `.weight-card`。
  - **复现：** 同 F1 emulation，localStorage 跳到 currentIndex=13 → `.weight-card` `animationName=staggerIn`。
  - **Spec 缺口？：** **是**——同 F2，违反 R30/P8。
  - **修复方向：** reduced-motion 块加 `.weight-card { animation: none; opacity: 1; transform: none; }`。

- **[F4] 严重度：Medium — `src/components/TestScreen.tsx:545-553`（`.interjection-overlay`）**
  - **影响：** 审判官批注插页（第 5/10/15 题后）用**内联** `style={{ animation: "staggerIn 0.6s var(--ease-out-expo) forwards" }}`，reduced-motion 下实测 `animationName="staggerIn"`、`animationDuration="0.6s"` 仍播放。内联样式优先级高于 class 选择器，globals.css 的 `@media (prefers-reduced-motion)` 块即便加了 `.interjection-overlay` 也压不住——必须 `!important` 或组件层分支。前庭敏感用户每次遇到批注插页都被迫看一次滑入位移。
  - **复现：** 同 F1 emulation，答第 5 题触发插页 → `.interjection-overlay` `animationName=staggerIn`。
  - **Spec 缺口？：** **是**——盲点#7（final.md:55）"每个新动效必须自带 reduced-motion 守卫"；该内联动效无守卫。
  - **修复方向：** 组件层读 `reducedMotion` 状态（TestScreen 已有该 state），命中时内联 `animation: "none"` 并把 opacity 钉 1；或 CSS 用 `!important`。

- **[F5] 严重度：Medium — `src/components/TestScreen.tsx:579-584`（"按任意键继续"提示）**
  - **影响：** 批注插页底部的**操作指令**文本"按任意键继续"用 `color: rgba(255,255,255,0.25)`、`fontSize: 10.4px`，落在背景 `rgba(3,3,3,0.95)` 上，实测对比度 **2.05:1**。WCAG AA 正常文本要求 4.5:1（连大字 3:1 都不达标）。这是告诉用户如何关闭 `role="dialog"` 阻塞覆盖层的**关键指令**——低视力用户读不到就可能卡在插页。同文件 `:581` 的 disclaimer `rgba(255,255,255,0.35)` 实测 3.02:1 也未达 AA（小字 0.6rem），但属装饰性版权，危害较低。
  - **复现：** 触发批注插页 → 取底部 div → `getComputedStyle().color="rgba(255,255,255,0.25)"`，对比度 2.05:1。
  - **Spec 缺口？：** 否——纯代码缺陷（spec 未给对比度数值，但 WCAG AA 是 a11y 基线）。
  - **修复方向：** 提示文本 alpha 提到 ≥0.55（实测 6.27:1 达 AA），或直接用 `var(--text-dim)`。

### Spec 覆盖检查
- **R3（Canvas 降级）**：✓ 覆盖——BackgroundLayers 在 reducedMotion 时不渲染 canvas（实测 `#bg-canvas` domCount=0），globals.css `#bg-canvas{display:none}` 兜底。
- **R30（所有新动效降级）**：✗ **缺失**——floatIn/卡片(`.card.enter/.exit`)、aurora、posture stat-fill、pulse-orb、opt-block 有守卫，但 **balance-pan(F2)、weight-card(F3)、interjection-overlay(F4) 三类入场动效漏守卫**。
- **P8（reduced-motion 验收）**：✗ **失败**——F1 让选项不可见，验收项"DevTools 开启 reduced-motion 截图对比"若真做了不可能没发现选项消失。
- **G5（reduced-motion 用户能答完）**：✗ **失败**——F1 直接使选项不可见，鼠标/低视力用户无法答普通题。
- **盲点#7（每个新动效自带守卫）**：⚠ 部分——aurora/stat-fill/canvas 有，balance-pan/weight-card/interjection-overlay 没有。
- **R29/focus-visible（盲点#10）**：✓ 覆盖——`.hud-btn`/`.btn-neo*`/`.balance-pan`/`.weight-card`/`.btn-restart`/`.opt-block` 均有 `:focus-visible` 焦点环（globals.css L451/495/626/652/725/1045）。

### 值得追的线索（不计入 K）
- **AuroraBurst 1300ms 等待**（`AuroraBurst.tsx:38-41` + `test/page.tsx:84-86,220`）：reduced-motion 下 CSS 把 aurora 钉 `scale(1)`（10px 静止圆点），但 JS `setTimeout(minDurationMs=1300)` 仍执行，用户盯着静止小圆点等 1.3s。因 reduced-motion 允许 opacity 淡出、且无运动，未达红线，但体验怪异——可考虑 reducedMotion 时把 minDurationMs 降到 ~300ms。未充分验证 fetch 慢于 1300ms 时的实际体感，留待跟进。
- **keyboard.spec 在 reduced-motion 下是否仍绿**：F1 让选项不可见但 `display` 仍 `block`、可 force-click/键盘 1/2/3 仍映射到 `.opt-block`，所以现有 keyboard 测试（不强制 reduced-motion）不会捕获 F1。建议加一条 reduced-motion 专用 e2e（visual README 只测了 ResultScreen 的 L3，没测 TestScreen）。

### 裁决
5 条真实发现已报告（F1 Critical + F2/F3 High + F4/F5 Medium），超过 K=3。reduced-motion 全链路攻击面**未耗尽但已击穿红线**：F1 是直接违反 G5/P8 验收的 Critical 内容不可见缺陷，F2-F4 是盲点#7 明确要求却漏掉的三处入场动效守卫。所有发现均经 Playwright `reducedMotion:"reduce"` emulation 实测（opacity/animationName/contrast 数值），非推测。临时测试文件已清理。

相关文件（绝对路径）：
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（reduced-motion 块 L1416-1445；opt-block L440-452；balance-pan L615-637；weight-card L645-656）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（interjection-overlay L545-553；提示文本 L579-584）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（R3 L44、R30 L81、G5 L105、P8 L198）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md`（盲点#7 L55、风险2 L199）
