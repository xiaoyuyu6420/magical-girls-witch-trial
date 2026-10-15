# 你是 implementer，负责「HTML 32 视觉重做」的 **IM4：TestScreen.tsx 答题页...

- 会话 ID: `sess_subagent_agent_b841128f-5eb2-437c-b03e-353f3885e7fa`
- 时间: 2026-08-13 12:15:54 → 2026-08-13 12:23:30
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 27
- 归档状态: 未归档

---

## 👤 用户
你是 implementer，负责「HTML 32 视觉重做」的 **IM4：TestScreen.tsx 答题页视觉改造**（状态机零触碰，只改视觉层）。

## 拥有文件（唯一可改）
`/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`

## 禁区
- **状态机逻辑零触碰**：currentIndex/answers/gateValue/isAnimating/selectedOptionId/stageFadeOut/toastVerdict/showKeyboardHint/isCompleted/interjection/weightSlots + pendingRef/timerRef/fadeTimerRef/toastTimerRef + handleSelect/handleBack/handleExit/cycleSlot/handleWeightConfirm + 键盘映射 + 批注去重 shownInterjectionsRef + flushPending 时序。这些是 E2E 117 用例的隐式契约，动一个数字就 flaky。
- 天平 SVG（renderType scale）/筹码点阵（renderType weight）的 JSX 结构不动（只随 token 配色变化，IM1 已处理）。
- globals.css/BackgroundLayers.tsx/AuroraBurst.tsx/ResultScreen.tsx/page.tsx/tests/（其他模块）。

## 必读
1. `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md` —— **决策3（组件拆分/class纪律）、A3（挤压金紫渐变已由IM1在CSS处理）、盲点#9（body.revealed）、#10（focus-visible）**
2. `/Users/munich/Downloads/ai_studio_code (32).html` —— 答题页 DOM：`.hud-header`（双胶囊）+`.hud-capsule`+`#btn-back.visible`+`.hud-counter`+`.counter-slash`+`.tag-pill`+`.pulse-orb`+`.toast-verdict`+`.card`（玻璃题卡）
3. `/Users/munich/Desktop/独立项目/magical-girls/crucible/40-implementation.md` —— IM4 接口契约段 + IM1 交付的 class 清单
4. `src/components/TestScreen.tsx` —— 现有结构（650行，.test-header/.q-meta/.watermark-index/.toast-verdict 等）
5. `src/app/globals.css` —— IM1 已定义 .hud-capsule/.hud-btn/.hud-counter/.counter-slash/#btn-back/.tag-pill/.pulse-orb/.card/.toast-verdict 样式。

## 任务（只改视觉层 JSX/CSS class，逻辑不动）
1. **import BackgroundLayers**：`import { BackgroundLayers } from "./BackgroundLayers"`，挂在 `.view-test` 容器内最前面（z 低于题卡）。传 `questionIndex={currentIndex}` + `reducedMotion={reducedMotion状态}`（若现有无 reducedMotion 检测，加一个 matchMedia 检测的 useState/useRef，或从 window 读）。
2. **HUD 双胶囊**：把现有 `.test-header` 内的按钮（返回 SVG + EXIT）包进 `.hud-capsule` 结构：
   - 左胶囊：`#btn-back`（PREV，Q1 时加 .visible 控制显隐——对齐 currentIndex===0 判断）+ `.hud-counter`（`NN/26`，NN=currentIndex+1，紫色 `.counter-slash`）
   - 右胶囊：RESTART（原 EXIT 按钮，文案/onClick 保留）
   - **按钮 onClick/handleBack/handleExit 零触碰**，只包结构+加 class
3. **玻璃题卡**：题卡容器加 `.card` class（IM1 已定义玻璃态+紫色inset glow+顶部金线）。
4. **tag-pill + toast**：`.q-meta` 区用 `.tag-pill`+`.pulse-orb`（脉冲点）展示 meta 文案；选中闪现 `.toast-verdict`（现有 toast 机制/timer 保留，只确认 class 对）。
5. **浮雕水印**：现有 `.watermark-index` 若渲染罗马数字，改渲染阿拉伯题号 `String(currentIndex+1).padStart(2,'0')`（与 BackgroundLayers 的 bg-typography 协调，避免重叠——若 BackgroundLayers 已提供浮雕题号，可移除 .watermark-index 或改其用途）。

## 约束
- "use client"（已是）
- 所有 E2E 锚点 class 保留（.opt-block/.balance-pan/.weight-stage/.q-text/.q-meta/.interjection-overlay 等），只加新 class
- reduced-motion：BackgroundLayers 自己处理；其他动效随 CSS（IM1 已加守卫）
- 不引入新依赖

## 验证
- `pnpm exec tsc --noEmit`（注意 import BackgroundLayers——IM2 并行创建，签名见契约；若 IM2 未完成致 tsc 报 import 错，属集成问题，你保证自己改的类型正确）
- review：状态机未被触碰（diff 应只在 JSX 结构/CSS class/import，无逻辑改动）

## 输出
1. BLUF 2. 触及文件 3. 交付接口（挂载的组件/新增class）4. 局部检查 5. 偏离/不确定（尤其确认状态机零触碰）

## 🤖 助手
我先读取必读文件，了解契约和现有结构。

> 🔧 工具调用 3 次: Read

## 🤖 助手
再看金标 HTML 的答题页 DOM、globals.css 中 IM1 已定义的 class，以及 BackgroundLayers 是否已被 IM2 创建。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
BackgroundLayers.tsx 尚未被 IM2 创建（目录里没有）。现在看 globals.css 中相关 class 的完整定义和金标 HTML 的答题页结构。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
金标 DOM 结构已明确。现在确认 globals.css 中 `.card` 基类、`.hud-header`、`.test-header`、`.question-stage`、`.watermark-index` 的定义情况。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
globals.css 里似乎没有 `.card` 基类（只有 `.card.enter/.exit` 动画），我需要确认 IM1 把玻璃态做在了哪里。

> 🔧 工具调用 2 次: Read

## 🤖 助手
关键发现：globals.css 没有 `.hud-header` 也没有 `.card` 基类（玻璃态做在 `.question-stage` 上），`.card` 只有 enter/exit 动画。现在检查 E2E 锚点、i18n 文案和 `.bg-typography` 样式，确定改动安全性。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
E2E 锚点关键信息已现：`.watermark-index` 锚定罗马数字（storage/keyboard spec）、EXIT 按钮锚定文案（/退出|EXIT/）。看这几个测试的具体断言，确定改动的安全边界。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
锚点全部确认。还有两个关键点要核实：`.question-stage`/`.card` 在测试中是否有锚点，以及现有 `.test-header` 桌面端定位方式。然后开始实现。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
所有锚点确认完毕。现在开始实现，三个改动：import、reducedMotion 检测、JSX 视觉层重构。

> 🔧 工具调用 1 次: Edit

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
现在替换 return 的 JSX 结构。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
改动完成。现在跑 tsc 检查类型。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
tsc 零错误通过。这说明 BackgroundLayers 已存在（IM2 已完成）。验证一下它的签名与我的调用匹配。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
BackgroundLayers 已由 IM2 创建，签名完全匹配。最后用 git diff 做状态机零触碰审查。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
工作区 diff 包含其他并行模块（IM1-IM5）的改动，这是并行工作区的正常状态。我需要确认 TestScreen.tsx 中**我的改动**只限于 JSX/class/import 层——看 diff 后半段（JSX 部分）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
diff 中大部分内容是接手前就存在的工作区状态（天平 SVG/砝码 UI 等是先前会话的成果），我的改动只有三处。看 diff 最后一段（我的 JSX 改动区）确认。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
diff 确认：我的三处改动就是预期内容，其余 diff 均为接手前工作区状态。跑 ESLint 验证我的文件。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
ESLint 报 error：`react-hooks/set-state-in-effect`——新 React hooks 规则不允许 effect 内同步 setState。用项目现有模式修复（queueMicrotask 异步读初始值，与文件内已有的 125 行 matchMedia 用法一致）。

> 🔧 工具调用 1 次: Edit

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
tsc 通过。ESLint 报的 error 在 198 行——需要确认这是不是我的代码（我的 effect 在 ~126 行）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
198/205 行的 lint error 是接手前就存在的代码（换题恢复高亮 effect、批注插页 effect——状态机逻辑），不在我职责范围。我的 reducedMotion effect 已不再报错。最后通读一遍我编辑后的关键区域做最终确认。

> 🔧 工具调用 2 次: Read

## 🤖 助手
全部就位。最终报告如下。

---

### BLUF

IM4 完成：TestScreen.tsx 视觉层改造全部落地（BackgroundLayers 挂载、HUD 双胶囊、玻璃题卡 `.card` 钩子、tag-pill+脉冲点、水印改阿拉伯题号），状态机零触碰。tsc 零错误；ESLint 无新增问题（剩余 2 error/2 warning 均为接手前既有代码）。无契约级偏离，5 处实现细节取舍已在下方标注。

### 触及的文件

- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` — 修改 — 仅视觉层：新增 BackgroundLayers 挂载 + reducedMotion 检测（独立 state/effect）、HUD 双胶囊结构、`.card` 钩子、tag-pill/pulse-orb、水印改阿拉伯题号。天平 SVG/砝码点阵/状态机全部未动。

### 交付的接口

- `<BackgroundLayers questionIndex={currentIndex} reducedMotion={reducedMotion} />` — 挂载于 `.view-test` 最前（z 0-1 低于题卡）— 匹配契约（IM2 组件签名已核实一致）
- `#btn-back`（`hud-btn` + `visible` 条件 class + `tabIndex` 守卫）— 始终渲染，`safeIndex>0` 时 `.visible` 显现；`onClick={handleBack}` 零触碰 — 匹配契约（任务书指示的对齐 currentIndex===0 判断）
- `.hud-capsule` 左胶囊（`#btn-back` + `.hud-counter`：NN + `.counter-slash` + 分母）— 匹配契约
- `.hud-capsule` 右胶囊（原 EXIT 按钮，`hud-btn` class，文案/onClick 保留）— 匹配契约
- `.question-stage.card` — 玻璃题卡 `.card` 钩子 — 匹配契约字面（见偏离 5）
- `.tag-pill` + `.pulse-orb` 包 meta 文案；gate 题保持独立 `.gate-badge` — 匹配契约
- `.watermark-index` 改渲染 `String(safeIndex+1).padStart(2,"0")` — 匹配契约（阿拉伯题号选项）
- `.toast-verdict`/`.show` — 确认与 IM1 CSS 匹配，机制/timer 零触碰
- 新增 `reducedMotion` state + matchMedia effect（queueMicrotask 模式，同文件既有写法）— 匹配契约（任务书授权新增）

### 局部检查

- `pnpm exec tsc --noEmit` — 通过（零错误；BackgroundLayers 已被 IM2 创建，签名 `{questionIndex:number; reducedMotion:boolean}` 与我的调用完全一致）
- `pnpm exec eslint src/components/TestScreen.tsx` — 通过（无我引入的 error/warning；剩余 2 error 在 198/205 行「换题恢复高亮/批注触发」effect、2 warning 为 parseWeightLabel/parseSlotThemes 未使用——均为接手前既有代码，属状态机禁区未修）
- git diff 审查 — 我的改动仅 3 处（import、reducedMotion 块、return JSX），天平 SVG（renderOptions scale 分支）、砝码点阵（renderWeightUI）、handleSelect/handleBack/handleExit/键盘映射/批注去重/flushPending 全部零触碰

### 契约偏离

无契约级偏离。以下为实现细节取舍，编排者定夺：

1. **counter 分母用 `displayQuestions.length` 而非任务书字面 26** — trigger/gate 题按 gateValue/语言过滤后数量动态（zh-CN 下不足 26），与现有 `.q-meta` 分母逻辑保持一致，避免 HUD 与题卡显示矛盾。金标 26 是固定题库字面。
2. **水印/计数器用 `safeIndex+1` 而非 `currentIndex+1`** — 常规相等；仅在语言切换 clamp 越界时不同，此时与题卡 meta（同样用 safeIndex）保持同步更正确。BackgroundLayers 严格按任务书传 `currentIndex`。
3. **EXIT 文案保留 `t("test.exit")` 而非金标「RESTART」** — 任务书「文案/onClick 保留」+ 3 个 E2E 文件（quiz.spec:407 /storage.spec:133 /admin.spec:287）锚定 `/退出|EXIT/` 文案，改 RESTART 会红 3 个测试。
4. **`#btn-back` 保留 SVG 双向箭头而非金标「← PREV」文本** — 任务书「只包结构+加 class」字面；SVG 是既有跨安卓字形方案（源注释说明）。
5. **`.card` 无基类样式，玻璃态实现在 `.question-stage` 上（IM1 决策），加 `.card` 为语义钩子**；**未启用 `.card.enter/.card.exit` 动画**（IM1 注释期望 IM4 使用，但契约只要求 `.card`，且 exit 动画与 `.stage-fade-out`（flushPending 视觉同步点）叠加有 E2E flaky 风险）。若编排者要启用，是单行 class 字符串改动。
6. **`#btn-back` 从条件渲染改为始终渲染 + `.visible`**（任务书明确指示）— 补充 `tabIndex={safeIndex>0?0:-1}` 守卫，保持 Q1 时键盘 a11y 契约（C2）零降级。mobile.spec 的 `.test-header button` first/last 定位与 y<60px 断言经推演仍通过。
7. **水印改阿拉伯题号使 storage.spec.ts 两处 `toHaveText("I")` 变红**（L163/L186）— 任务书授权 + IM6 负责适配；keyboard.spec 只断言「题号变化」（01→02 仍成立）不受影响。

### 诚实信心

高：状态机零触碰已逐行核对（我的 diff 只有 import/独立 state/JSX 结构）；未覆盖的是真实浏览器视觉验证（双胶囊窄屏表现、tag-pill 与 gate-badge 并存观感依赖 IM1 CSS，未实际跑 Playwright——E2E 全量在 IM6 且需全模块完成）；另注意 `.view-test` 的 viewTestEnter 入场动画期间（0.6s）fixed 定位的 canvas 会短暂跟随 transform，动画结束后恢复正常，若视觉验收发现入场抖动可后续微调。
