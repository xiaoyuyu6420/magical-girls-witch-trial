# 你是 architect，为"魔女审判→灵魂审判器 阶段1"独立设计一个**最小侵入**的技术方案。不要参考其他架...

- 会话 ID: `sess_subagent_agent_809dc150-cd6c-48cc-8b84-221f67b93a99`
- 时间: 2026-08-07 01:14:44 → 2026-08-07 01:23:24
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
你是 architect，为"魔女审判→灵魂审判器 阶段1"独立设计一个**最小侵入**的技术方案。不要参考其他架构师——你只看意图契约。

## 变体标签：最小侵入（Minimal Intrusion）
你的设计哲学：复用现有数据模型和架构到极限，把改动局限在"内容替换 + 少量增量扩展"，绝不引入新框架、新状态管理、新数据结构。能用现有字段就用，不能就做最小扩展。

## 任务背景
Next.js 16.2.4 + React 19 + TS + Prisma + Vitest 的人格测试项目。现有结构：
- `src/data/quiz-content.ts`：26 题题库（用 `Q(dim,meta,text,options,scores?)` 工厂 + gate/trigger 独立结构）+ 15 角色定义。
- `src/content/packs/witch-trial/config.ts`：12 维度 DIMENSIONS（code/name/model/modelName/dir）+ WEIGHTS + ALGO_CONFIG。
- `src/content/packs/witch-trial/index.ts`：QuizPack rules（gateValues/gateBonus/specialTriggers/triggerGates）。
- `src/lib/match.ts`：加权曼哈顿匹配（**与维度命名解耦，只依赖 code/weights/algo**）。
- `src/lib/answer-processor.ts`：服务端处理，只用维度 code。
- `src/components/TestScreen.tsx`：答题页，700ms 时序 + opt-block 推开 + 键盘支持 + localStorage 进度。
- `src/i18n/zh-CN.ts`：文案（dims/dimGroups/questions/gate/trigger）。
- DB：prisma seed 从 quiz-content.ts 读，Question 有 type 字段（normal/gate/trigger）。

## 意图契约（你的依据，必须读 crucible/10-intent-contract.md）
路径：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`

关键需求摘要（详见契约）：
- **R1-R4 题目改写**：26 题干改"审判官断言式逼问"，选项改"承认/否认/狡辩"三态。zh-CN only。
- **R5-R7 维度改名**：12 维度 name/modelName/dir 按 REDESIGN §3 表改，code/WEIGHTS/ALGO_CONFIG 不动，角色 vector 不动，match.ts 不动。zh-CN 同步。
- **R8-R9 审判官批注（动态）**：第5/10/15题后插页，**用维度总分档位(H/M/L)选池中文案**（A4 决策），不输出维度标签/角色/百分比。
- **R10 天平题**：第8、22题位置，左右二选一迫选，复用 ease-out-expo + is-selected/is-dimmed。
- **R11 砝码题**：第14题位置，三槽拖拽，每槽{0,1,2}总和=3。
- **A1 决策：替换26题内+继续打分**。第8/22题原测W2、第14题原测F1反向。变奏题硬编码 score 挂回原维度（W2/F1）。
- **A5 决策：门控value重定义**。destroy(保持)/endure→seen/normal→peace/normal_alt→undecided。同步：rules(gateValues/gateBonus/specialTriggers/triggerGates)、TestScreen两处过滤、quiz-content门控题value字段、scripts/smoke-check.mjs。
- **A6 触发题**：改文案保留 SPECIAL_A 逻辑。
- **R12 保留**：700ms时序/cubic-bezier/opt-block推开/服务端匹配/防篡改/feature flag。
- **R13 git**：按改动单元 commit（约5类：题目/维度/批注/天平/砝码）。

## 你的产出（严格按此结构）
1. **BLUF**（一句话方案）。
2. **核心抽象（≤5个）**：你识别出的关键设计决策点，每个一句话。
3. **数据模型决策**：
   - 天平题/砝码题用什么 QuestionType？（复用 "normal" 还是新增 type？）最小侵入优先复用。
   - 砝码题的"三槽分配"如何在现有数据模型表达？（现有 QuestionDef 选项是平铺数组）
   - 批注插页如何表达？（新增 type？还是 TestScreen 内部按题号判断？）
   - 动态批注的维度总分档位算法放哪？（match.ts 已有 scoreToTier）
4. **改动清单（按 R13 的 commit 单元）**：每个 commit 触及哪些文件、改什么。标明"锁死区"（match.ts/角色 vector/WEIGHTS/ALGO_CONFIG）绝不碰。
5. **被拒绝的替代方案（≥2）**：你考虑过但否决的设计，每个一句理由。
6. **主要风险（≤3）**：每个带缓解措施。

请先读意图契约文件再产出。保持方案聚焦、可执行。

## 🤖 助手
我已经读完意图契约。现在快速核对几个关键源文件，确认数据模型的真实形态，再产出设计。

> 🔧 工具调用 1 次: Read

## 🤖 助手
我已掌握核心数据模型。再快速核对 `pack/types.ts`、`scripts/smoke-check.mjs` 和 prisma seed 三处下游引用，确保改动清单完整。

> 🔧 工具调用 3 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
数据模型已完全掌握。再核对 REDESIGN §3 的维度对照表，确保维度改名有依据。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
已掌握全部数据模型与下游引用。关键发现已确认：第8题=QUESTIONS[7]=W2见证、第14题=QUESTIONS[13]=F1悖论、第22题=QUESTIONS[21]=W2理性，与 A1/A3 完美对齐；`match.ts` 确实只读 `code` 不读 `name`；`answer-processor` 只按 `type` 分支；TestScreen 第106/129行的 `gateValue` 过滤是 A5 必改点。下面产出最小侵入设计。

---

### BLUF

**把所有改动压成"内容替换 + TestScreen 内部按题号分支"——零新数据结构、零 schema 变更、零服务端逻辑改动、零新框架。** 天平题/砝码题复用 `type:"normal"` 走现有 score 管道，批注插页是 TestScreen 内部 state + 复用 `match.ts` 的 `scoreToTier`，维度改名是纯字符串替换，门控 value 是纯 key 重命名 + 下游同步。承重决策是**variant 不入库、按题号硬编码**；最大单一风险是 TestScreen 在一个文件里堆叠"批注插页时序 + 天平布局 + 砝码交互"三类新分支，状态机复杂度上升。

### 变体

**最小侵入（Minimal Intrusion）** — 复用现有数据模型到极限，把改动局限在"内容替换 + 单组件内部增量分支"，绝不为单次需求引入新框架/新状态管理/新 schema 列。

### 核心抽象（4 个）

1. **`type` 字段的三态契约不动** — `normal|gate|trigger` 是 answer-processor 的唯一分支依据。天平/砝码/批注**全部**复用 `normal` 路径打分，绝不新增 type 值（否则要改 answer-processor + DB + 测试，违反最小侵入）。
2. **`variant` 是 TestScreen 私有概念，不入库** — UI 变奏（天平左右布局、砝码三槽、批注插页）通过 `order` 硬编码映射到渲染分支，不污染数据层。这是本变体的灵魂。
3. **`scoreToTier` 单一档位算法** — 复用 `match.ts` 既有纯函数做批注 H/M/L 判断，零新算法。前端直接 import（它是无副作用的）。
4. **门控 value 是 key 重命名，非逻辑变更** — `endure→seen` / `normal→peace` / `normal_alt→undecided` 是字符串 token 替换，下游 5 处机械同步，特殊触发链路（destroy/seen→YUKI/ETL）逻辑不变。

### 数据流（一道天平题的端到端旅程）

用户在第8题左右二选一 → TestScreen 按 `order===8` 渲染天平布局（2 个 `opt-block` 左右对峙）→ 点击触发 700ms `is-selected`/`is-dimmed` 推开 → `handleSelect` 把选中的 option 存入 `answers`（与普通题完全相同的 `{questionId, optionId}`）→ 提交到 `/api/results` → `processAnswers` 看到 `type==="normal"`，`dimScores.W2 += opt.score`（score 在 quiz-content.ts 里硬编码）→ `match` 走加权曼哈顿。**数据层完全不知道这是天平题。** 砝码题多一步：TestScreen 砝码组件把三槽分配 `[a,b,c]` 归一化到 `{1,2,3}` 之一再 `handleSelect`。

### 数据模型决策

- **天平题 QuestionType？** → **复用 `"normal"`**。原因：天平题仍要给 W2 打分，必须走 `dimScores` 路径；若新增 type，answer-processor 第47-57行的 `if(qType==="gate")`/`if(qType==="trigger")` 分支要加 else-if，且 DB schema、seed、match 透传全要跟。否决：新增 `"scale"` type——侵入 answer-processor + schema + 3 个测试文件。
- **砝码题三槽如何在平铺 options 数组表达？** → **退化为 3-option normal 题，UI 归一化**。QUESTIONS[13] 的 options 改为 3 个隐藏 option（对应 F1 低/中/高三档，score=1/2/3），TestScreen 砝码组件把合法分配映射到 optionId。原因：answer-processor 对 normal 题只做 `dimScores[dim] += opt.score`，无法处理"多槽多 score 累加同一维度"；归一化把交互复杂度封在 UI 层，数据层零感知。否决：扩展 option 为 `{slots:[0,1,2]}`——要改 QuestionDef 类型、DB、seed、answer-processor 的累加语义，且合法组合只有 7 种（6 种 012 排列 + 111），用 3 桶归一化已足够表达 F1 倾向。
- **批注插页如何表达？** → **不入 QUESTIONS 数组，TestScreen 内部 state**。`const ANNOTATION_AFTER = [5,10,15]`；答完第5题的 700ms 动画结束后，若 `order` 命中，进入 `annotation` state 渲染插页，用户确认后进下一题。原因：批注不计分、不入库、不计入 26 题，塞进 QUESTIONS 会污染 order/total 计算。否决：新增 `"annotation"` type 入 QUESTIONS——破坏"26题总数"契约，displayQuestions.length 会变 29，进度条/编号全乱。
- **档位算法放哪？** → **前端 `import { scoreToTier } from "@/lib/match"`**。新建 `src/lib/annotation.ts` 封装 `getAnnotation(node, answers, questions): string`，内部聚合 dimScores → 找主导维度 → `scoreToTier` → 选文案池。否决：在批注里重新实现档位——重复代码；否决：批注走服务端——R8 是纯前端体验，无防篡改需求（批注不剧透结果）。

### 改动清单（按 R13 的 commit 单元）

**锁死区（任何 commit 都不碰）：** `src/lib/match.ts` · `WEIGHTS` · `ALGO_CONFIG` · 15 个角色 `vector` · `dimCode`(S1..W3) · `answer-processor.ts` 的分支逻辑 · prisma schema。

**Commit 1 — 题目改写（R1-R4, A6 触发文案）**
- `src/data/quiz-content.ts`：26 题 `Q()` 工厂的 text/options 全部改写为"审判官断言式逼问 + 承认/否认/狡辩三态"；触发题（QUESTIONS[18]）文案去 IP 主体，`trigger:"SPECIAL_A"` 保留。
- `src/i18n/zh-CN.ts`：`questions` 数组 26 项同步；`trigger` 段文案同步；`welcome`/`meta` 的 IP 强度可酌情降低（低优先，氛围保留即可）。
- 触及测试：`quiz-content.scores.test.ts` 若断言了旧文案需同步（分数断言不动）。

**Commit 2 — 维度改名（R5-R7）**
- `src/content/packs/witch-trial/config.ts`：DIMENSIONS 12 项的 `name`/`modelName`/`dir` 按 REDESIGN §3 表改（如 S1 `name:"严厉/宽容倾向"`、W2 `name:"理性维系倾向"`）；`code`/`model`/WEIGHTS/ALGO_CONFIG **不动**。
- `src/i18n/zh-CN.ts`：`dims` 12 项 name 同步；`dimGroups` 4 组去 IP 味（"罪业之秤·审判"→通用心理组名）。
- 触及测试：若 `match.test.ts` 断言了旧 `name`（如"严厉度"）需同步字符串（契约开放假设已允许）。

**Commit 3 — 门控 value 重命名（A5）**
- `src/data/quiz-content.ts`：门控题 4 选项 `value`：`endure→seen`、`normal→peace`、`normal_alt→undecided`（destroy 不变）。
- `src/content/packs/witch-trial/index.ts`：`gateValues:["destroy","seen","peace","undecided"]`；`gateBonus` 的 key `normal→peace`、`normal_alt→undecided`（bonus 值 `{S2:1}`/`{W1:1}` 不变）；`specialTriggers` 的 `endure→seen`（destroy 不变）；`triggerGates:["destroy","seen"]`。
- `src/components/TestScreen.tsx`：第106、129行 `gateValue === "endure"` → `=== "seen"`（两处）。
- `scripts/smoke-check.mjs`：`SPECIAL_TRIGGERS` 的 `endure→seen`；`GATE_BONUS` key 同步；测试断言 `gateValue:"endure"` → `"seen"`（约3处）。
- `src/lib/answer-processor.test.ts`：第100行 `["destroy","endure","normal","normal_alt"]` → 新四元组；第55/105行断言同步。
- `tests/quiz.spec.ts`：第169/217/235行注释与断言的 gate value 同步。
- `src/i18n/zh-CN.ts`：`gate.options` 4 条文案按 A5 新语义（毁灭/被看见/平静/未想好）。

**Commit 4 — 天平 + 砝码题（R10/R11/A1/A3）**
- `src/data/quiz-content.ts`：
  - QUESTIONS[7]（W2 见证）：options 改 2 个（左右），硬编码 score（如左=W2低分=1、右=W2高分=3）。
  - QUESTIONS[13]（F1 悖论）：options 改 3 个（F1 低/中/高，score=1/2/3），作为砝码归一化的落点。
  - QUESTIONS[21]（W2 理性）：options 改 2 个，score 反向（反向题规则）。
  - 这三题 `type` 保持 `"normal"`，`dim` 保持 W2/F1。
- `src/components/TestScreen.tsx`：
  - 顶部常量 `SPECIAL_VARIANTS: Record<number,"scale"|"weight"> = {8:"scale",14:"weight",22:"scale"}`（按 `current.order` 判断）。
  - 天平分支：`options-stage` 加 `variant-scale` class，CSS 左右对峙；option 数=2 时复用现有 `is-selected`/`is-dimmed`，无需新交互逻辑。
  - 砝码分支：新增 `<WeightPuzzle>` 子组件（三槽拖拽，校验总和=3），完成时调用 `weightResultToOptionId([a,b,c]) → optionId` 再走 `handleSelect`。
  - `weightResultToOptionId` 映射函数（合法分配→3个option之一，可按主导槽或预设查表）。

**Commit 5 — 审判官批注（R8/R9/A4）+ feature flag**
- 新建 `src/lib/annotation.ts`：导出 `getAnnotation(node:5|10|15, answers, questions): string`。内部：聚合 answers 到 dimScores（前端版，复用 questions prop 的 option.score）→ 找主导维度 → `scoreToTier` → 按 `node × tier` 从文案池选变体。不输出维度名/角色/百分比（R9）。
- `src/i18n/zh-CN.ts`：新增 `annotations` 段，结构 `{ 5:{H:[...],M:[...],L:[...]}, 10:{...}, 15:{...} }`，每节点×档位预设 2-3 变体。
- `src/components/TestScreen.tsx`：新增 `annotation` state；700ms 动画 `flushPending` 前/后判断 `ANNOTATION_AFTER.includes(order)`，命中则进入插页渲染（复用 stage-fade 时序），用户确认后继续。
- feature flag：`NEXT_PUBLIC_ANNOTATION_ENABLED`（默认 true），仅 gating 批注。天平/砝码是内容替换，靠 git revert 回退（commit 粒度已保证），不加运行时 flag——立场：不为不可能增量回退的东西付 flag 维护成本。

### 被拒绝的替代方案

1. **新增 `type:"scale"|"weight"|"annotation"` 扩展 QuestionType** — 否决。会迫使 answer-processor 加分支、prisma schema 加列或放宽 type 约束、seed 透传新字段、match 透传、3 个测试文件改断言。天平/砝码本质上仍是"给某维度打一个分"，用 type 区分是把 UI 概念泄漏到数据契约，违反最小侵入。
2. **批注走服务端 API（/api/annotation）** — 否决。批注不剧透结果（R9）、不参与匹配、无防篡改价值；引入服务端往返只为读一个文案池，增加 latency 和一个新 endpoint，零收益。前端纯计算足够。
3. **variant 入库（schema 加 variant 列）** — 否决。variant 只影响 UI 渲染，对 answer-processor/match/seed 毫无意义。加列意味着 migration、DB query 改、类型定义改，全是无用功。`order` 硬编码 + 常量表已稳定（spec 把题号当契约）。
4. **砝码题三槽各自带 score 累加到 F1** — 否决。answer-processor 对 normal 题是"选一个 option 加其 score"，不是"多 option 累加"。改累加语义会破坏所有 normal 题的打分契约，风险远大于把归一化封在 UI 层。

### 主要风险（3 个，按风险排序）

1. **TestScreen 状态机爆炸（最高风险）** — 一个文件现在要承载：原 700ms 时序 + opt-block 推开 + 批注插页穿插（在第5/10/15题的动画后插入额外 state 转换）+ 天平左右布局 + 砝码拖拽组件。`flushPending`/`pendingRef`/`timerRef` 的时序与插页 state 交互极易出 bug（如批注出现时用户连点键盘跳过）。**缓解**：批注插页用独立 state（`annotationNode: number|null`），`flushPending` 在 `isLast` 检查前先判断是否该进批注；砝码/天平抽成独立子组件（`<WeightPuzzle>`、复用 options-stage），保持 TestScreen 主干只多一个 `variant` 分支；为时序写 vitest（mock timer）。
2. **"第8/14/22题"的题号语义歧义** — spec 说"第8/22题位置"，但 displayQuestions 在 gate 非 destroy/seen 时过滤 trigger（第19题），导致显示序号与数组序号错位；若理解错，天平题会落错位置。**缓解**：本设计明确按 **QUESTIONS 数组的绝对 order**（seed 时按数组顺序写入 `order` 字段）定位 variant，不按显示序号；`SPECIAL_VARIANTS` 用 `current.order` 作 key。需在实现前与 spec 确认此解读（这是唯一需要人确认的点，已在下方提出）。
3. **A5 同步遗漏导致 gateValue 链断裂** — 门控 value 重命名涉及 6 处文件（quiz-content/pack rules/TestScreen 2处/smoke-check/test 断言），任一处漏改都会让 `gateValue==="endure"` 永远 false，触发题永不出现，YUKI/ETL 路径静默失效。**缓解**：Commit 3 必须一次性改完所有 6 处再提交；改完跑 `pnpm test` + `node scripts/smoke-check.mjs` 双闸门；用 `rg "endure|normal_alt" src/ scripts/ tests/` 做收尾扫荡确认零残留。

---

需要您拍板一个点（影响 Commit 4 的题号定位）：

> 🔧 工具调用 1 次: AskUserQuestion

## 🤖 助手
用户未回答，我按推荐判断继续（QUESTIONS 数组绝对位置）——这正是 A1/A3 契约「第8/22题原测 W2、第14题原测 F1」唯一自洽的解读。

设计已完整产出。关键产物：

- **唯一相关文件路径**（设计依据，已全部读过）：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（契约）、`/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md`（维度对照表 §3）、`/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（题目定义，第8=QUESTIONS[7]=W2、第14=QUESTIONS[13]=F1、第22=QUESTIONS[21]=W2 已核实）、`/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（第106/129行 gate 过滤 + 时序主干）、`/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/index.ts`（rules）、`/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts`（`scoreToTier` 第44行，批注复用）、`/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts`（type 三态分支）、`/Users/munich/Desktop/独立项目/magical-girls/scripts/smoke-check.mjs`（A5 同步点）。

**本变体的承重立场**：variant 不入库、按 `order` 硬编码、天平/砝码/批注全部退化为 `normal` 或 TestScreen 内部 state。代价是 TestScreen 文件复杂度上升（风险1）；收益是数据层、schema、match、answer-processor 零改动，5 个 commit 之间几乎无耦合，可独立 revert。如果后续阶段2要把 variant 抽象为 pack 配置，本变体的硬编码常量表是唯一需要重构的点，迁移成本可控。
