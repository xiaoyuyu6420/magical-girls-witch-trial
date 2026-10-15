# 你是 architect，为"魔女审判→灵魂审判器 阶段1"独立设计一个**稳健扩展**的技术方案。不要参考其他架...

- 会话 ID: `sess_subagent_agent_aefdaeba-8a65-42db-80f4-1dcb5be9b31a`
- 时间: 2026-08-07 01:14:45 → 2026-08-07 01:17:50
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 10
- 归档状态: 未归档

---

## 👤 用户
你是 architect，为"魔女审判→灵魂审判器 阶段1"独立设计一个**稳健扩展**的技术方案。不要参考其他架构师——你只看意图契约。

## 变体标签：稳健扩展（Robust Extension）
你的设计哲学：在复用现有架构基础上，为"交互变奏（天平/砝码）"和"动态批注"引入**恰当的显式建模**——让新题型是一等公民（有明确 type 和数据结构），而非塞进现有 normal 题的 hack。宁可多写一点类型定义和分发逻辑，也要让代码可读、可测、未来好扩展（阶段2 跨IP 时这些题型结构可复用）。但不引入新框架/新状态管理库。

## 任务背景
（与最小侵入方案相同，见上）
Next.js 16.2.4 + React 19 + TS + Prisma + Vitest。现有结构：
- `src/data/quiz-content.ts`：26 题（`Q()` 工厂 + gate/trigger）+ 15 角色。
- `src/content/packs/witch-trial/config.ts`：12 维度 + WEIGHTS + ALGO_CONFIG。
- `src/content/packs/witch-trial/index.ts`：QuizPack rules。
- `src/lib/match.ts`：加权曼哈顿（解耦，只依赖 code/weights/algo）。
- `src/lib/answer-processor.ts`：服务端处理，只用 code。
- `src/components/TestScreen.tsx`：答题页。
- `src/i18n/zh-CN.ts`：文案。
- DB：prisma seed 从 quiz-content.ts，Question.type 字段。

## 意图契约（你的依据，必须读）
路径：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`

关键需求（详见契约）：R1-R4题目改写、R5-R7维度改名、R8-R9动态批注(维度总分档位选文案)、R10天平题(第8/22)、R11砝码题(第14,每槽{0,1,2}总和3)、A1替换26题内+硬编码score挂回W2/F1、A5门控value重定义(destroy/seen/peace/undecided)、A6触发题改文案保留逻辑、R12保留、R13 git按改动单元commit。

## 你的产出（严格按此结构）
1. **BLUF**（一句话方案）。
2. **核心抽象（≤5个）**。
3. **数据模型决策**（重点：显式建模新题型）：
   - 天平题/砝码题/批注插页各自的 QuestionType 和 TS 接口设计（明确字段）。砝码题的三槽分配如何结构化？
   - 是否扩展 QuestionDef 联合类型？如何让 answer-processor 和 match.ts 优雅处理新 type（不动算法核心）？
   - 动态批注的维度总分档位：算法放哪、文案池数据结构、档位判定规则（H/M/L 阈值）。
   - 新 type 的 score 如何流回 dimScores（answer-processor 现在按 question.dim 归集 score）。
4. **改动清单（按 commit 单元）**：每个 commit 触及文件 + 改什么。标锁死区。
5. **被拒绝的替代方案（≥2）**。
6. **主要风险（≤3）**带缓解。

请先读意图契约文件再产出。

## 🤖 助手
我先读意图契约，并并行看几个关键现有文件以掌握真实结构。

> 🔧 工具调用 5 次: Read

## 🤖 助手
并行读 TestScreen、pack types、pack index rules、zh-CN 关键片段、prisma schema/seed。

> 🔧 工具调用 4 次: Read

## 🤖 助手
读 prisma schema、seed、测试文件，以及 REDESIGN 文档关键节，确认 DB 端 type 与算法兼容性。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
我对所有承重点都有了清晰认知。最后看一下 R13 涉及的 git 状态和 REDESIGN §6 的视觉细节。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
我已经掌握了全部承重结构、DB 约束、测试断言、pack 架构。现在产出稳健扩展变体的完整设计。

---

# 灵魂审判器 阶段1 技术设计 — 变体「稳健扩展（Robust Extension）」

## BLUF

把天平题、砝码题、批注插页提升为**显式 QuestionType**（联合类型 + 新增 enum 成员），让它们成为一等公民而非塞进 normal 的 hack；动态批注单独建一个纯函数模块读 dimScores 选文案；打分通过让新 type 选项保留 `dim` + `score` 字段走现有 `processAnswers` 的同一个累加循环，**算法核心零改动**。最大单一风险：DB enum 扩展 + seed 重建在生产是不可逆的 schema 变更，必须靠 commit 顺序和 feature flag 兜住回退。

## 变体

**稳健扩展** — 新交互有它自己的 type 和数据结构，但引擎层（match.ts / answer-processor 循环主体 / 加权曼哈顿）一行不动；宁可多写 4 个类型定义和 3 个分发分支，也不在 normal 里塞魔法字段。

## 核心抽象

- **QuestionDef（联合类型）** — 一切内容数据的单一入口。`normal | gate | trigger | balance | weight | interlude`，每态携带自己必需的字段。这是阶段2 跨 IP 时唯一需要 pack 作者实现的契约。
- **打分规约（scoring contract）** — 不论 type，只要 `dim ∈ DIMENSIONS.code && option.score` 存在，answer-processor 就累加进 dimScores。新 type 不破规约，只新增"打分从哪来"的来源（balance=选项硬编码；weight=槽位值）。
- **AnnotationEngine** — 纯函数 `pickAnnotation(node, dimScores, pack, rng) → string`。输入维度总分 + 节点（probe/press/judge），输出行为描写文案。**不依赖 DB**，因为信号是运行时累加值。
- **VariantDispatcher（在 TestScreen 内）** — 根据 `question.type` 分发到三个渲染分支：`renderNormal`（复用现 opt-block）/ `renderBalance`（左右对峙二选一）/ `renderWeight`（三槽拖拽）。这一个组件是唯一同时碰 React + 三种交互的地方。
- **Pack-level content schema** — 天平/砝码/批注文案池放进 `src/content/packs/witch-trial/` 下的内容文件（如 `variants.ts` / `annotations.ts`），与 config 同级，不污染 quiz-content。阶段2 换 IP 时换 pack 即换全部变奏。

## 数据流（用户答一题 → 维度得分）

1. 用户在 TestScreen 操作。`VariantDispatcher` 按 `current.type` 渲染对应交互。
2. 任一交互完成后，统一产出一个 `Answer = { questionId, optionId }`（砝码题：先在客户端把槽位分配映射到一个 optionId——见下"砝码题结构化"）。
3. `onComplete` 把 `answers[]` 发给服务端 API（不变）。
4. 服务端 `processAnswers` 走现有循环：对每个 option 查 `opt.question.type`——gate/trigger 仍各自短路；**balance/weight 落入默认分支**（因为它们不是 gate/trigger），按 `question.dim` + `option.score` 累加。这正是 A1/A3 要的"硬编码加分挂回 W2/F1"。
5. `match({ dimScores, gateValue, triggerFired })` 一行没变，加权曼哈顿算出结果。

关键点：**新 type 复用默认累加分支，无需给 processAnswers 加新 case**。这是最优雅的接入——因为 A3 已经规定"打分通过现有 score 字段走 answer-processor"，新 type 的打分语义本就和 normal 一致（dim+score），只是 UI 交互不同。

---

## 数据模型决策（重点）

### 1. QuestionDef 联合类型扩展

现有 `QuestionDef` 是单一 interface + `type` 字符串。稳健做法是改成**判别联合**，把 type 作为判别标志：

```ts
// src/data/quiz-content.ts
type BaseType = { dim: string; text: string; meta: string; order?: number };

interface NormalDef extends BaseType {
  type: "normal";
  options: { label: string; score: number }[];
}
// gate / trigger 保持现状结构（带 value / trigger）

interface BalanceDef extends BaseType {
  type: "balance";
  dim: string;                    // = "W2"（A3：挂回原维度）
  options: { label: string; score: number }[];  // 恰好 2 个，左/右
}
//   第8题  scores=[1,3]；第22题（反向）scores=[3,1]

interface WeightDef extends BaseType {
  type: "weight";
  dim: string;                    // = "F1"（A3）
  slots: { id: "a"|"b"|"c"; label: string }[];  // 3 个槽，标签固定
  sumConstraint: 3;               // A2：三槽总和=3
  // 每槽值域 {0,1,2}，合法组合：(0,1,2) 排列 或 (1,1,1)
  scoring: "slot-value-as-score"; // 客户端把选中槽位值作为该 option.score
  // options 在 seed 时展开为 3 个虚拟 option（label=slot.label, score 由用户分配）
}

interface InterludeDef extends BaseType {
  type: "interlude";              // 批注插页
  dim: "INTERLUDE";               // 占位，answer-processor 跳过（同 GATE/TRIGGER 处理）
  node: "probe" | "press" | "judge";  // 试探/逼近/审判
  // text 留空或占位；真正文案由 AnnotationEngine 运行时算
}

type QuestionDef = NormalDef | GateDef | TriggerDef | BalanceDef | WeightDef | InterludeDef;
```

**为什么这样切：** balance 和 weight 的区别不是"分数怎么算"，而是"用户怎么输入分数"——balance 是离散二选一，weight 是连续分配。把它们分开建模，阶段2 做"四选一天平""五槽砝码"时只需要新建一个变体或扩展现有 def，不污染其他 type。

### 2. 砝码题的三槽分配如何结构化

最关键的设计抉择。两个候选：
- **(A) 客户端把分配映射成一个 optionId，score 在服务端读** ← 选这个
- (B) 客户端直接发 `{slotA:2, slotB:1, slotC:0}`，服务端新写 weight 解析逻辑

选 A 的理由：**让 answer-processor 和 Answer 表完全不感知砝码题的特殊性**，DB 里 Option 表存 3 个虚拟 option（label=槽位文案，score=0 作为占位），用户分配完后客户端选一个"主导槽"（值最大的那个；1+1+1 时选第一个）作为 optionId 提交，该 option 的 score 在 seed 时**留空/0**，由客户端在 `onComplete` 前用运行时分配值覆盖——**不行，这破坏防篡改**。

修正后的真正方案：**砝码题展开成 3 个真实 option，每个 option.score 在 seed 时按"该槽拿到高分"的方向预设**。但 A3 明确"三槽分配值 {0,1,2} 直接作为 F1 的得分贡献"——一个 option 的 score 是固定的，而砝码题用户的输入是分布式的。

**最终方案（推翻 A 与上面那个都不可行，回到正解）：** 砝码题不走"用户选一个 option"模型。客户端把分配结果序列化成**一个确定的 optionId**，对应一组预定义的合法分配模式——`WeightDef` 在 seed 时展开成**所有合法组合的笛卡尔积**作为 options：

- (2,1,0) 及其 6 种排列 + (1,1,1) = **7 个 option**，每个 option.score = 该组合中"F1 方向槽"的值（按 A3）。
- 用户拖拽到某个合法组合 → 客户端查表找到对应 optionId 提交。
- 服务端 `processAnswers` 默认分支按 `dim=F1` 累加该 option.score。完全防篡改、零新逻辑。

合法组合表（固定 7 行，可控）：

```
optionId | (a,b,c) | score (=c 槽值，假设 c 是 F1 主轴) 
  ...    | (2,1,0) | ...
```

具体哪个槽映射 F1 分数由 WeightDef.scoringAxis 指定（实现者按 F1 方向定义）。这是**用数据冗余换算法不变**的取舍——稳健扩展的核心代价。

### 3. 动态批注：算法位置 / 文案池 / 档位判定

- **算法放哪：** 新建 `src/content/packs/witch-trial/annotations.ts`。**纯函数**，签名 `pickAnnotation(node: "probe"|"press"|"judge", dimScores, pack, rng) → string`。**不进 match.ts**——match 只算相似度，批注是 UI 反馈，关注点不同。
- **档位判定（H/M/L）：** 复用 `pack.algo.tiers` 里的 scoreToTier 语义但**不直接调**——批注档位是相对的（用户在自己答卷子里的维度间比较），不是绝对的。规则：
  - 计算前 N 题（N=5/10/15）各维度 sum。
  - 取**最高分维度**和**最低分维度**。
  - 档位 = 该维度 sum 在"该维度前 N 题理论最大值（每题 max score × 题数）"的占比：≥66% = H，33-66% = M，<33% = L。
  - 这给 6 种信号组合（最高H/低M 等）× 3 节点 = 18 个文案槽位，每个槽位预设 2-3 个变体，rng 随机选避免重复。
- **文案池数据结构：**

```ts
// annotations.ts
export const ANNOTATION_POOL: Record<
  "probe" | "press" | "judge",
  Record<"dominantHigh" | "dominantMid" | "dominantLow" |
         "extremesPolarized" | "balancedMidline" | "suppressedLow",
         string[]>  // 每键 2-3 条变体
> = { ... };
```

档位判定 + 选文案是同一个纯函数，可单测（Vitest 拍快照）。

### 4. 新 type 的 score 如何流回 dimScores

已在数据流第 4 步说清。**机制：** answer-processor 的默认分支（line 59-62）天然处理——只要 `question.type !== "gate" && !== "trigger"` 且 `dim` 是真实维度码，就累加 `option.score`。balance/weight 都满足，**无需改 processAnswers 一行**。

但要给 processAnswers 加一个**显式 guard**：`if (dim === "INTERLUDE") continue;`（批注插页不计分），与现有 `GATE`/`TRIGGER` 跳过逻辑并列。这是稳健扩展的体现——显式声明 interlude 不打分，而不是靠"恰好没有 score 字段"的隐式行为。

---

## 关键决策

- **新题型建模为判别联合而非 normal + 魔法字段** → QuestionDef 改联合类型
  - **原因：** TS 判别联合能让分发逻辑在编译期穷尽性检查；阶段2 加新变体时 switch 会强制处理。
  - **否决：** (a) "塞进 normal，靠 meta 区分"——读代码的人看不到区分逻辑，魔法字符串蔓延；(b) "any/object 兜底"——放弃类型安全。

- **DB enum 扩展（normal/gate/trigger → +balance/weight/interlude）** → 扩展 Prisma enum
  - **原因：** Question.type 在 DB 是 enum，硬塞字符串会写不进去。enum 扩展是 Prisma 加法迁移，向后兼容（旧数据仍是 normal/gate/trigger）。
  - **否决：** (a) "把 type 改成 String"——丢掉 DB 层约束，未来脏数据不可防；(b) "新 type 不入库，客户端硬编码位置 8/14/22"——违反"服务端防篡改"原则（R12），客户端可伪造 type。

- **砝码题展开成 7 个合法组合 option** → 数据冗余换算法零改动
  - **原因：** 防篡改要求 score 必须服务端可读且不可被客户端覆盖；展开成静态 option 是唯一既保留 Option 表模型又支持分布式输入的方法。
  - **否决：** (a) "新建 WeightAssignment 表存分配"——为一道题引入新表，过度工程；(b) "客户端直接发分配值"——破坏防篡改（用户可伪造任意值）。

- **批注引擎独立模块，不进 match.ts** → annotations.ts 纯函数
  - **原因：** match 负责算相似度（已锁死），批注负责选文案（运行时 UI 信号），关注点分离；批注失败不该影响匹配结果。
  - **否决：** (a) "批注逻辑塞 match.ts"——match 已是 200 行的纯算法，再塞文案选择会污染；(b) "批注预生成存 DB"——批注依赖运行时累加的 dimScores，预生成无意义。

- **批注插页用 Question 行占位 + INTERLUDE dim** → 复用 Question 表
  - **原因：** 题目顺序（order 字段）天然支持插页位置（第 5/10/15 题后），无需新建 Interlude 表；客户端按 order 流式渲染自动插入。
  - **否决：** (a) "新建 Interlude 表"——为一行占位建表，YAGNI；(b) "客户端硬编码插页位置"——位置改动要改前端代码而非数据。

- **天平/砝码/批注文案放 pack 目录，不放 quiz-content.ts** → variants.ts / annotations.ts
  - **原因：** quiz-content 已是 270 行，再塞变奏文案可读性崩塌；pack 目录是阶段2 跨 IP 的替换单元，变奏文案天然属 pack。
  - **否决：** "全塞 quiz-content.ts"——文件膨胀，且变奏文案与题目本体是不同关注点。

---

## 改动清单（按 commit 单元）

> 锁死区（**任何 commit 不得触碰**）：`match.ts` 算法主体、`WEIGHTS`、`ALGO_CONFIG`、15 个角色 vector、`config.ts` 的 `code`/`dir` 之外字段。

### Commit 1 — 维度改名 + i18n 同步（R5/R6/R7）
**文件：**
- `src/content/packs/witch-trial/config.ts` — 12 维度 `name`/`modelName`/`dir` 改通用心理名（code/WEIGHTS/ALGO_CONFIG 不动）。
- `src/i18n/zh-CN.ts` — `dims`/`dimGroups` 同步新名。
**锁死区检查：** 不动 code、不动 WEIGHTS、不动 ALGO_CONFIG。测试 `match.test.ts` 不应受影响（它不读 name）。

### Commit 2 — 题目改写（R1/R2/R4）+ 门控 value 重定义（A5）+ 触发题文案（A6）
**文件：**
- `src/data/quiz-content.ts` — 26 题 text/options 改审判官逼问语；门控题 4 个 option.value 改 `destroy/seen/peace/undecided`；触发题文案改写（trigger 字段不变）。
- `src/content/packs/witch-trial/index.ts` — `gateValues`/`gateBonus`/`specialTriggers`/`triggerGates` 按 A5 同步（endure→seen）。
- `src/components/TestScreen.tsx` — line 106/129 `gateValue === "endure"` 改 `"seen"`。
- `src/i18n/zh-CN.ts` — `gate.options` 文案跟随新语义；`questions`/`gate`/`trigger` 同步新文案。
- `src/lib/answer-processor.test.ts` — line 100 的 `["destroy","endure","normal","normal_alt"]` 断言改新 value 集合。

### Commit 3 — 数据模型扩展：QuestionDef 联合 + DB enum（A1/A2/A3 数据准备）
**文件：**
- `src/data/quiz-content.ts` — `QuestionDef` 改判别联合；新增 `BalanceDef`/`WeightDef`/`InterludeDef`；保留 `Q()` 工厂；新增 `B()`/`W()`/`I()` 工厂。
- `prisma/schema.prisma` — `enum QuestionType` 加 `balance weight interlude`。
- `prisma/seed.ts` — WeightDef 展开成 7 option 的逻辑；InterludeDef 插入 3 行占位 Question（order=5.5/10.5/15.5 或重排整数 order）。
- 新增 `src/data/quiz-content.types.test.ts`（可选）— 联合类型编译期检查。
**锁死区检查：** seed 不动 PERSONALITY_TYPES、不动 normal/gate/trigger 题的 score 语义。

### Commit 4 — 变奏内容填充：天平/砝码替换原 W2/F1 题（A1/A3）+ 批注文案池（A4）
**文件：**
- `src/data/quiz-content.ts` — 原第 8 题（W2 见证）、第 22 题（W2 理性）、第 14 题（F1 悖论）的 `Q(...)` 替换为 `B(...)`/`W(...)`；scores 按 A3 硬编码（W2 方向、F1 主轴槽）。
- 新增 `src/content/packs/witch-trial/annotations.ts` — 文案池 + `pickAnnotation()` 纯函数。
- 新增 `src/content/packs/witch-trial/annotations.test.ts` — 档位判定 + 文案选择单测。
- 新增 `src/data/quiz-content.scores.test.ts` 扩展 — 加 balance/weight score 范围断言。

### Commit 5 — TestScreen 分发渲染（R10/R11）+ 批注插页 UI（R8/R9）
**文件：**
- `src/components/TestScreen.tsx` — 提取 `VariantDispatcher`，按 `current.type` 分发；新增 `renderBalance`（左右对峙，复用 opt-block 的 is-selected/is-dimmed + ease-out-expo）、`renderWeight`（三槽拖拽，总和=3 校验）、`renderInterlude`（批注插页，调 AnnotationEngine 显示文案，无选项，自动 700ms 后下一题）。
- `src/components/TestScreen.tsx` — keyboard hint 在 balance/weight/interlude 时禁用（keyMap 只对 normal 有效）。
- 砝码题客户端：拖拽分配 → 合法性校验（sum=3，每槽 0-2）→ 查表 optionId → 走现有 `handleSelect`。
- 天平题客户端：点左/右 → 该 option 走 `handleSelect`，另一侧 is-dimmed。
**锁死区检查：** 700ms 时序、cubic-bezier 曲线、opt-block 推开视觉不动（R12）；服务端匹配调用不变。

### Commit 6 — DB seed 重建 + 端到端验证
**文件/操作：**
- `FORCE_RESEED=1 prisma db seed`（或 prisma migrate）。
- 跑全量测试：`pnpm test`。
- 手测：第 5/10/15 题后插页、第 8/22 题天平、第 14 题砝码、W2/F1 维度覆盖（验算 dimScores）。
- `docs/REDESIGN.md` 如有进度记录可更新。

> R3（仅 zh-CN）、R12（时序/曲线/服务端匹配/防篡改/feature flag）、R13（git 粒度）贯穿所有 commit；feature flag 的回退点在 Commit 3 的 enum 扩展——如果生产回退，旧客户端读到 balance/weight 类型会走默认 normal 渲染（需在 VariantDispatcher 加 fallback：未知 type → 当 normal 渲染或跳过），保证不崩。

---

## 被拒绝的替代方案（≥2，详述）

### 拒绝方案 A：最小侵入（塞 normal + meta 标记）
把天平/砝码题保持 `type: "normal"`，靠 `meta === "天平"` 区分；砝码题客户端发"主导选项"id，score 在 quiz-content 里硬编码到某一个 option；批注用 `dim: "GATE"` 占位题塞进 QUESTIONS。

**为什么输：**
- 读 quiz-content.ts 的人无法从类型知道哪题是变奏——区分逻辑分散在 TestScreen（看 meta）、processAnswers（看 dim）、seed（看 type）三处。
- 阶段2 加新变体（如"排序题""滑块题"）时，meta 字符串列表会无限膨胀成魔法词典。
- 砝码题把"用户连续分配"硬塞进"选一个离散 option"会丢失信息（用户分配 (2,1,0) 和 (1,2,0) 如果都映射到同一个主导 option，分数一样但语义不同）。
- 这种方案"能跑"，但一年后没人敢动它。稳健扩展的代价是多写 4 个类型，收益是阶段2 可复用、可读、可测。

### 拒绝方案 B：完全 pack 化重写（把变奏提升到 QuizPack 契约层）
在 `PackRules` 里加 `variantTypes: VariantTypeSpec[]`，让 pack 声明支持哪些变奏类型，TestScreen 从 pack 配置驱动渲染；批注引擎也进 pack 契约。

**为什么输：**
- REDESIGN §8 明确 pack 多 IP 是**阶段2**；阶段1 只有一个 pack，在契约层加抽象是为没有的第二个消费者写接口（YAGNI）。
- 修改 `QuizPack`/`PackRules` 类型会牵动 match.ts 的类型参数（`DimCodeOf<P>`），增加算法锁死区被误触的风险。
- 阶段1 的目标是"验证核心体验立住"，不是"完成 pack 平台架构"。稳健扩展≠过度设计——把变奏建模成 QuestionType 一等公民已经足够为阶段2 铺路；pack 契约层的变奏抽象等阶段2 真有第二个 pack 时再提炼。

### 拒绝方案 C：批注文案预生成存 DB
新建 Annotation 表，按 (userId, node) 存预生成文案；批注引擎在答题过程中预计算。

**为什么输：** 批注信号是"前 N 题维度累加分"，这是运行时值，预生成要么存中间态（DB 膨胀），要么批注和答题强耦合（用户改答案要回滚批注）。批注是纯 UI 反馈，失败不应影响匹配，纯函数 + 运行时计算最简单。

---

## 扩展点

- **留开放：**
  - `QuestionDef` 联合类型——阶段2 加新变体（排序题、滑块题）只需加一个成员 + TestScreen 加一个 case，TS 编译期强制穷尽。
  - `pickAnnotation(node, ...)` 的 `node` 参数——未来可加 "verdict"（结果页批注）等节点，不改签名。
  - `WeightDef` 的 `scoringAxis` / `sumConstraint`——未来支持五槽、总和=5 等变体，字段已就位。
  - pack 目录结构（config/variants/annotations 分文件）——阶段2 换 IP 时整目录替换。

- **关闭（YAGNI）：**
  - 不抽象 pack 契约层的变奏类型（阶段2 再做）。
  - 不新建 WeightAssignment 表（7-option 展开够用）。
  - 不给批注加 A/B 实验设施（REDESIGN §8 归阶段3）。
  - 不做天平/砝码的 i18n（R3：阶段1 仅 zh-CN）。
  - 不动 `match.ts` 的 MatchInput（gateValue/triggerFired 字段不变；批注信号不进匹配）。

---

## 主要风险（≤3，按风险排序）

### 风险 1 — DB enum 扩展在生产是不可逆变更，且 seed 重建会清空 Answer 历史数据
**缓解：**
- Commit 3 加 enum 是加法迁移（向后兼容），但 Commit 6 的 `FORCE_RESEED=1` 会 `deleteMany()` 所有 Answer（seed.ts line 36-38 已有此行为）。
- 阶段1 仍在开发期（`prisma/dev.db`），生产数据风险低；但必须用 feature flag 包住发布（R12 要求 flag 可回退）。
- VariantDispatcher 加"未知 type → 降级为 normal 或跳过"的 fallback，保证旧客户端读新 DB 不崩。
- seed 前做 DB 备份；migrate 脚本独立可回滚。

### 风险 2 — 砝码题 7-option 展开的 score 映射容易写错，且 F1 维度覆盖依赖这一个映射
**缓解：**
- Commit 4 必须给 WeightDef 写单测：断言每种合法组合的 option.score 之和覆盖 F1 的预期分档；断言 (1,1,1) 和 (2,1,0) 类组合的 score 不同。
- 在 `quiz-content.scores.test.ts` 加"F1 维度在 26 题里至少被 N 题覆盖"的断言，防止未来误删。
- WeightDef.scoringAxis 在类型层显式声明（不是注释），实现者必须填。

### 风险 3 — 判别联合改造（Commit 3）会一次性触动 quiz-content.ts 所有 26 题的字面量，diff 巨大易引入回归
**缓解：**
- Commit 3 只改类型定义和工厂函数签名，**不改正文文案**（文案在 Commit 2 已改）；`Q()` 工厂保持向后兼容（返回 NormalDef），减少字面量改动。
- Commit 2 必须先全量跑通现有测试（`quiz-content.scores.test.ts` 断言题干关键词如"自生自灭""再也不想站"），确保 Commit 3 在已绿的基线上做类型重构。
- Commit 3 后立即 `pnpm tsc --noEmit` 确保穷尽联合无遗漏。

---

## 相关文件路径（绝对路径）

- 意图契约：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`
- 产品方案：`/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md`（§6 在 line 283+）
- 承重文件：`/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（QuestionDef 在 line 105-108）、`/Users/munich/Desktop/独立项目/magical-girls/prisma/schema.prisma`（enum QuestionType 在 line 11-15）、`/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts`（默认累加分支 line 59-62，新 type 复用）、`/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（line 106/129 endure→seen）、`/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/index.ts`（rules 在 line 19-33）
- 锁死区：`/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts`、`/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/config.ts`（WEIGHTS/ALGO_CONFIG）、15 角色 vector 在 quiz-content.ts line 24-103
