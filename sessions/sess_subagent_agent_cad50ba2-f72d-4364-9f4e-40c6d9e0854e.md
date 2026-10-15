# 你是 red-team，从**可维护性**维度攻击阶段1的实现。硬配额：至少报告 2 个真实问题，或明确说明为什么...

- 会话 ID: `sess_subagent_agent_cad50ba2-f72d-4364-9f4e-40c6d9e0854e`
- 时间: 2026-08-07 03:50:43 → 2026-08-07 03:55:59
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 26
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**可维护性**维度攻击阶段1的实现。硬配额：至少报告 2 个真实问题，或明确说明为什么更少。

## 攻击目标
魔女审判→灵魂审判器 阶段1。这是一个要长期演进的项目（阶段2跨IP、阶段3多语言+结果页重做）。阶段1的代码质量直接影响后续阶段的可维护性。

## 实现位置（必读）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` — 293→640行，C5主力
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts` — 267→约300行，题目+角色
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/annotations.ts` — 批注模块（新）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts` — 批注API（新）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts` — 文案（C1/C2同步）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/` — pack目录

## 契约可维护性要求
- ADR D1：renderType 字段与 DB type 解耦，为零迁移和阶段2可扩展服务
- ADR 模块切分：批注独立模块、变奏内容放pack目录（为阶段2跨IP）
- R7：zh-CN.ts 与 quiz-content.ts 同步（双source of truth风险）

## 攻击方向（可维护性）
1. **TestScreen膨胀**：640行单文件。renderType分发、scale渲染、weight渲染、批注overlay、键盘、localStorage全在一个组件。阶段2加新变体会怎样？是否该拆分？拆分的代价vs收益？
2. **魔法数字/字符串**：砝码题的 weight::a|b|c 编码、批注节点5/10/15、INTERJECTION_NODES 常量——是否有未命名的魔法值？label编码格式是否易碎（改一处忘改另一处）？
3. **双source of truth**：quiz-content.ts（入DB）和 zh-CN.ts（i18n导出）的 questions 数组必须手动同步。C5已发现 zh-CN 的 questions 无运行时消费者（只i18n导出用）。这个双写是债务还是必要？阶段3多语言时会更痛吗？
4. **变奏题数据可读性**：砝码题7个option的label是 weight::2|1|0 这种编码串，score是裸数字。内容作者（非工程师）想改砝码题三槽主题或调整score映射，能看懂吗？
5. **批注文案池维护**：annotations.ts 的 POOLS 是嵌套Record。阶段3翻译时怎么搬？加新节点/档位容易吗？
6. **测试覆盖盲区**：C5的TestScreen渲染逻辑（scale/weight/interjection）没有任何单测覆盖。阶段2改渲染时如何防回归？
7. **错误处理一致性**：批注API有fallback，TestScreen的fetch也有fallback。错误处理风格是否一致？日志是否够debug？

## 产出格式
每条发现：标题 + 具体影响（未来改什么会痛）+ 代码位置 + spec缺口 + 严重度（High/Medium/Low，可维护性通常无Critical）。

开始攻击。

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
我已经完成了所有文件的完整审查。以下是已验证的可维护性发现。

### BLUF
3 条已验证发现，最严重的是 fallback 文案在 3 文件 4 处独立定义（无共享源）——改一处忘改其余会直接导致用户在不同代码路径下看到不同文案。i18n questions 数组无运行时消费者，是纯债务。Spec 中 renderType 解耦的 ADR D1 在实现层面有隐性耦合。

### 最严重问题
批注 fallback 文案在 3 个文件中被独立定义了 4 次（annotations.ts FALLBACK / route.ts 两处 / TestScreen.tsx 一处），无任何一处 import 另一处——改任何一处对其余三处零感知，阶段3翻译时此问题放大4倍。

### 发现

- **[F1] 严重度：High — annotations.ts:73-77, route.ts:44-48+78-82, TestScreen.tsx:211-213**
  - **影响：** 3 条 fallback 文案（"前五题，你已经在审讯室里坐定。让我们继续。"等）在 3 个文件中被复制粘贴了 4 次。`annotations.ts` 定义了 `const FALLBACK` 并 export，但 `route.ts` 和 `TestScreen.tsx` 均未 import 它——各自内联了自己的副本。具体后果：（1）修改 `annotations.ts` 的 FALLBACK 文案后，API 和客户端仍显示旧文案，零感知不一致；（2）`route.ts` 在同一文件内有**两处** fallback 定义（第 44-48 行空 answers 场景 vs 第 78-82 行 catch 错误场景），改一处忘改另一处会使得这两个代码路径返回不同文案；（3）阶段3多语言时，4 处 fallback 必须分别翻译，且没有单一入口点注入 locale。
  - **复现：** 在 `annotations.ts` 的 FALLBACK 中将 node=5 的文案改为 "XXX"，重新运行：服务端 route.ts 和客户端 TestScreen.tsx 仍返回原始文案"前五题……"。三方完全解耦，无编译时/运行时校验。
  - **Spec 缺口？：** 否——纯代码缺陷。但 ADR 模块切分要求批注独立模块，而 fallback 文案是该模块的一部分却被泄漏到消费者中内联。
  - **修复方向：** `route.ts` 和 `TestScreen.tsx` 均从 `@/lib/annotations` import 一个 `ANNOTATION_FALLBACKS` 常量（annotations.ts 已 export `FALLBACK`，改名即可），消灭 3 处内联副本。`route.ts` 内的两处也统一引用同一常量。

- **[F2] 严重度：High — zh-CN.ts:73-98, ja.ts, en.ts, zh-TW.ts（对应 questions 段）**
  - **影响：** `quiz-content.ts` 的 `QUESTIONS` 数组是 DB 种子源（权威 source of truth）。`zh-CN.ts`（及 ja.ts/en.ts/zh-TW.ts）各自维护了一份 `questions` 数组作为 i18n 导出。经 `rg "t\.questions|i18n.*questions"` 全源码搜索确认：**i18n questions 数组零运行时消费者**——TestScreen 从 `/api/quiz` API 获取题目，从不读取 `t.questions`。这是一份 25 行的死代码副本，且与权威源在结构上不同步（quiz-content.ts 有 dim/type/renderType/score/value/trigger，i18n 副本仅 meta/text/options 字符串数组）。更危险的是：zh-CN.ts 第 87 行将砝码题 7 个 option 原样复制为 `weight::2|1|0` 编码串——翻译者可能"翻译"这些编码串，直接破坏 `parseWeightLabel` 的解析逻辑。阶段3新增 4+ 语言时，每加一个 locale 就多一份必须手工同步的死代码副本。
  - **复现：** 在 `quiz-content.ts` 中修改第 1 题的 text 文案，重新构建运行——i18n 的 zh-CN.ts 中的第 1 题文案不变。无任何编译时或运行时机制检测此不一致。
  - **Spec 缺口？：** 是——R7 规定"zh-CN.ts 与 quiz-content.ts 同步"，但实现中无任何自动化保障此同步，且 i18n questions 无消费者使得同步本身失去意义。R7 本身是债务而非必要约束。
  - **修复方向：** 删除所有 i18n 文件中的 `questions` 字段（它们无消费者）。题目翻译已由 quiz-content.ts 的 `translations` JSON 字段承载，经 TestScreen displayQuestions useMemo 在运行时合并——i18n questions 是多余的早期设计残留。

- **[F3] 严重度：Medium — TestScreen.tsx:348,352,301,309,176,631**
  - **影响：** ADR D1 要求"renderType 字段与 DB type 解耦，为零迁移和阶段2可扩展服务"。数据层确实解耦了（quiz-content.ts 的 renderType 是独立字段），但**渲染层耦合**：TestScreen 内有 6 处 renderType 条件分支——（1）L348 计算 renderType；（2）L352 switch(renderType) 渲染分发；（3）L301 键盘 `if(rt==="scale")`；（4）L309 键盘 `if(rt==="weight")`；（5）L176 useEffect `if(current?.renderType==="weight")` 重置 slot；（6）L631 键盘提示 `renderType==="weight"?...`。新增一个 renderType（阶段2跨 IP 几乎必然需要，如 ranking/slider/drag）需同时修改这 6 处，且全部在同一个 640 行文件的 6 个不同位置。遗漏任何一处（如键盘处理或 slot 重置）不会编译报错，只会在运行时静默失败（按键无响应 / 状态残留）。
  - **复现：** 假设添加 renderType="ranking"：开发者必须在 renderOptions switch 加 case、键盘 handler 加 ranking 分支、可能加新 state 和 useEffect。遗漏键盘分支时，ranking 题的数字键将穿透到 default 分支的 1/2/3/4 映射，选中错误选项——无编译错误，仅运行时错选。
  - **Spec 缺口？：** 是——ADR D1 要求 renderType 可零迁移扩展，但实现中 renderType 的消费散布在 6 处 if/switch，新增变体无法"零修改"接入。
  - **修复方向：** 将 renderType 逻辑提取为 strategy map：`const RENDER_STRATEGIES: Record<string, { render: ()=>JSX, handleKey: (e)=>void, onEnter?: ()=>void }>`，新增变体只需加一个 strategy 对象，不触碰其他分支。

### Spec 覆盖检查
- ADR D1（renderType 与 DB type 解耦）：**部分** — 数据层解耦达成，但渲染层有 6 处硬编码分支，新增变体需改 6 处而非零修改。
- ADR 模块切分（批注独立模块）：**部分** — pickAnnotation 纯函数和 POOLS 数据确实独立，但 fallback 文案泄漏到 3 个消费者文件内联，破坏了模块边界。
- R7（zh-CN.ts 与 quiz-content.ts 同步）：**缺失** — 无任何自动化同步机制；更深一层，i18n questions 无运行时消费者，R7 本身是债务。

### 值得追的线索（不计入 K）
- `INTERJECTION_NODES = [5, 10, 15]` 在 TestScreen.tsx 定义，`AnnotationNode = 5 | 10 | 15` 在 annotations.ts 定义，`route.ts` 用 `node !== 5 && node !== 10 && node !== 15` 硬编码校验——三处定义了同一组节点值，无共享常量。扩展节点（如阶段2加第20题批注）需改三处。
- `nodeLabels: Record<number, string> = { 5: "I", 10: "II", 15: "III" }`（TestScreen.tsx:543）又是另一份节点→标签映射，与 INTERJECTION_NODES 和 AnnotationNode 三重定义。

### 裁决
3 条真实发现已报告。可维护性攻击面已深入覆盖：DRY 违反（4 处 fallback 副本）、死代码债务（i18n questions 零消费者）、扩展性缺口（renderType 6 处硬编码分支）。
