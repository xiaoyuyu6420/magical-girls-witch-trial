# 你是 implementer，负责实现 C5：TestScreen 的 renderType 分发渲染 + 天平/...

- 会话 ID: `sess_subagent_agent_49309be2-9438-4c23-a753-7acb9faf1662`
- 时间: 2026-08-07 03:36:54 → 2026-08-07 03:44:49
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 25
- 归档状态: 未归档

---

## 👤 用户
你是 implementer，负责实现 C5：TestScreen 的 renderType 分发渲染 + 天平/砝码题 UI + 审判官批注插页 + localStorage 适配。

## 背景
这是一个 Next.js 16 人格测试项目"魔女审判→灵魂审判器"。阶段1 已完成 C1-C4：
- C1 维度改名（config.ts + zh-CN dims/dimGroups）
- C2 26题改写为审判官逼问 + 门控value重命名（destroy/seen/peace/undecided）
- C3 批注模块 `src/lib/annotations.ts`（pickAnnotation 纯函数已就绪）
- C4 变奏题数据：第8/22题=天平(scale,2option,W2)、第14题=砝码(weight,7option,F1)，prisma加了renderType列

现在 C5 要让 TestScreen 按 renderType 分发渲染，并集成批注插页。

## 必读文件（先读再改）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（主战场，293行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx`（questions 映射，需加renderType）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/annotations.ts`（批注模块，已就绪，调用其 pickAnnotation）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md`（ADR，D4/D5/B3 是你的核心约束）

## 任务清单

### 1. test/page.tsx：questions 映射加 renderType
L39-47 的映射加 `renderType: (q.renderType as string) || "normal"`。QuizQuestion 接口也要加 renderType 字段（在 TestScreen.tsx 的 interface QuizQuestion 里）。

### 2. TestScreen.tsx：按 renderType 分发渲染
ADR D5：`q.renderType ?? q.type` switch。现有渲染逻辑（opt-block 三选项纵向）只用于 normal/gate/trigger。新增：
- **renderType=scale（天平题）**：2 个 option，左右对峙（不是纵向）。复用 ease-out-expo 曲线 + is-selected/is-dimmed 推开逻辑（选中一个→另一个 is-dimmed）。点击→走现有 handleSelect。视觉：两个大块左右并排（flex 横向），不是纵向堆叠。
- **renderType=weight（砝码题）**：**这是全新交互**。三槽拖拽分配，每槽 {0,1,2}，总和必须=3。label 是 `weight::a|b|c` 编码（a/b/c 是三槽分配值）。UI 需求：
  - 解析当前题的 options，每个 option.label 是 `weight::x|y|z` 格式，提取分配组合。
  - 三槽 UI：三个槽（A/B/C），每槽显示当前分配值（初始 0/0/0 或均分 1/1/1）。用户点 +/- 按钮调整每槽值（每槽 0-2）。显示总和，总和≠3 时禁用确认按钮。
  - 三槽的主题文案：从 question.text 里解析（text 里有 `A：「...」\nB：「...」\nC：「...」` 三句话，分别对应三槽）。
  - 用户调到某个合法组合（总和=3）→ 查 options 找 label 匹配的 optionId → 走 handleSelect 提交。
  - **a11y（Q3 裁决：阶段1 不强制，但提供退化）**：+/- 按钮即可键盘操作（Tab 到按钮，Enter/Space 触发）。不做复杂拖拽，用 +/- 按钮代替（更简单且 a11y 友好）。
- **批注插页（renderType 不适用，是题间 overlay）**：ADR D4 + B3。当用户答完第 5/10/15 题（即 answers.length 命中 5/10/15 且对应 currentIndex 已推进）后，显示批注插页一屏。关键约束：
  - **不改 currentIndex**（B3：localStorage 进度恢复）。用独立 state `interjection: { node: 5|10|15 } | null`。
  - 批注文案：调用 `pickAnnotation(node, accumulatedDimScores, pack, rng)`。但 TestScreen 没有 dimScores 和 pack——需要从已答 answers 反算 dimScores。
  - **简化方案**：批注插页显示后，用户点击/按键继续→清除 interjection，currentIndex 正常推进。
  - **dimScores 计算**：从 questions + answers 反算每个 option 的 score（TestScreen 有 questions，但 option.score 不在 API 返回里——API 刻意不下发 score 防篡改）。**所以批注用不了真实 dimScores**。
  - **务实裁决**：批注插页用**固定档位 M**（中档）调用 pickAnnotation，或者直接用一个简化的本地批注文案（不调 pickAnnotation）。但这违背 A4"动态"。
  - **最佳方案**：新增一个轻量 API `/api/annotation?node=5&answers=...` 返回 pickAnnotation 结果（服务端有 score）。但这增加一个 endpoint。
  - **请你在实现时选择**：(a) 临时用固定档位调 pickAnnotation（客户端造一个 mock dimScores，不真实）；(b) 新增 /api/annotation endpoint（服务端算真实 dimScores 返回文案）。**推荐 (b)**，因为 A4 明确要"动态读答题数据"。如果选 (b)，新建 `src/app/api/annotation/route.ts`。

### 3. localStorage 适配（B3）
批注 interjection state 不持久化（刷新后=null，重新答第5/10/15会再触发，可接受）。currentIndex/answers/gateValue 持久化逻辑不变。砝码题部分分配不持久化（可接受）。

### 4. 键盘支持适配
现有键盘 1/2/3/4 只对 normal 题。scale 题：1=左、2=右。weight 题：禁用数字键（用 +/- 按钮）。批注插页：任意键继续。

## 关键约束（不可违反）
- **R12**：700ms 单题时序、cubic-bezier(0.16,1,0.3,1) 曲线、opt-block 推开视觉必须保留。scale 题复用这套时序和推开。
- **B3**：currentIndex 不被批注插页改动。localStorage 的 {currentIndex, answers, gateValue} 结构不变。
- **防篡改**：砝码题提交的是 optionId（服务端从 DB 读 score），不是客户端算的分数。
- **R9**：批注不输出维度标签/角色/百分比。

## 你的产出
1. **BLUF**。
2. 直接修改文件（TestScreen.tsx, test/page.tsx，如选批注方案b则新建 api/annotation/route.ts）。
3. **触及的文件**。
4. **局部检查**：`pnpm test` 全绿；`pnpm build` 或 `npx tsc --noEmit` 无新增类型错误（pre-existing playwright helpers 错误可忽略）。
5. **任何偏离契约的地方**（特别是批注方案的选择）。

## 禁区
- 不改 match.ts、answer-processor.ts、config.ts、WEIGHTS、ALGO_CONFIG、角色 vector。
- 不改维度 code、scores 数值。
- 不改 quiz-content.ts 的题目数据（C4 已定）。
- 不改批注模块 annotations.ts 的 pickAnnotation 签名（C3 已定）。
- 不动 zh-CN.ts（编排者会同步变奏题文案）。

开始吧。先读所有必读文件，再动手。

## 🤖 助手
好的，所有必读文件已读完。让我继续查看几个关键依赖文件。

> 🔧 工具调用 4 次: Read, Bash

## 🤖 助手
很好，API 已经返回 `renderType`。让我看看 match route 和 answer-processor。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
让我查看 CSS 样式和现有 i18n key 模式。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
开始实现。先改 test/page.tsx 映射加 renderType。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
现在重写 TestScreen.tsx。这是主战场，需要一次性完成所有改动：接口加 renderType、renderType 分发、天平题、砝码题、批注插页、键盘适配。

> 🔧 工具调用 1 次: Read

## 🤖 助手
现在创建 `/api/annotation` 路由。服务端从 DB 读 options 的 score 算真实 dimScores，调用 pickAnnotation。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
现在跑局部检查。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
唯一的类型错误是 pre-existing 的 playwright helpers 问题（契约明确说可忽略）。跑单元测试。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
全部 58 个测试通过。让我再验证一下构建是否正常。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
构建编译成功（21.8s），唯一报错是 pre-existing 的 `tests/helpers.ts` 类型问题（不是我的文件），契约明确可忽略。让我做一次针对性的 import 验证，确认我的新文件引用都正确。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
排除 helpers.ts 后无其他类型错误。所有局部检查通过。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
### BLUF

C5 模块已构建，局部检查全部通过（tsc 无新增错误、pnpm test 58/58 绿）。批注方案选 (b)——新建 `/api/annotation` endpoint 服务端算真实 dimScores。无契约偏离。

### 触及的文件

- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` — **修改** — 加 renderType 字段到接口、renderType switch 分发、天平题(scale)左右对峙、砝码题(weight)三槽+/- UI、批注插页 overlay、键盘适配
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx` — **修改** — questions 映射加 `renderType: (q.renderType as string) || "normal"`
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts` — **创建** — POST endpoint，服务端从 DB 读 options score → processAnswers 算真实 dimScores → pickAnnotation 返回文案

### 交付的接口

- `QuizQuestion.renderType` — `string` — 匹配契约（D5：`q.renderType ?? q.type` switch）
- `renderType=scale` 渲染 — 2 个 option，左右并排 flex 横向，复用 opt-block 时序推开 — 匹配契约
- `renderType=weight` 渲染 — 三槽+/- UI，`parseWeightLabel("weight::a|b|c")` 解析，总和=3 时查找匹配 optionId 提交 — 匹配契约（D2）
- 批注插页 — 独立 state `interjection`，命中 answers.length=5/10/15 触发，调用 `/api/annotation` POST — 匹配契约（D4 + B3）
- `/api/annotation` POST — `(node: 5|10|15, body: {answers})` → `{text: string}` — 服务端算真实 dimScores，匹配 A4"动态"
- 键盘适配 — scale: 1=左 2=右；weight: 禁用数字键；interjection: 任意键继续 — 匹配契约

### 局部检查

- `npx tsc --noEmit` — 通过（仅 pre-existing `tests/helpers.ts` playwright 类型错误，契约允许忽略）
- `pnpm test` — 通过（58/58 全绿）
- `pnpm build` — 编译成功（21.8s），类型检查失败仅因 pre-existing helpers.ts 问题

### 契约偏离

无。

### 诚实信心

砝码题的 `parseSlotThemes` 依赖 `question.text` 中的 `A：「...」\nB：「...」\nC：「...」` 格式——如果 C4 的题目数据不完全符合此格式，会 fallback 到 "审判之秤 · A/B/C" 通用文案。批注插页的 rng 用 answerHash 做种子保证同一用户同一组答案看到相同文案，但不同顺序的等价答案可能产生不同种子（可接受的行为差异）。
