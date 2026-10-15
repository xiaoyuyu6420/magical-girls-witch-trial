# 你是 arbitrator。下面有三个 architect 对同一意图契约独立产出的技术方案变体。逐个决策比较它们...

- 会话 ID: `sess_subagent_agent_7456a17d-eb40-4e73-843e-e6a140ac47a9`
- 时间: 2026-08-07 01:25:51 → 2026-08-07 01:28:39
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
你是 arbitrator。下面有三个 architect 对同一意图契约独立产出的技术方案变体。逐个决策比较它们，找出共同盲点，产出一份最终 ADR。

## 意图契约（仲裁依据）
路径：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`
这是阶段1（核心体验）的锁定的 EARS 契约，用户已确认所有歧义决策（A1-A6）。你必须先读它。

## 项目背景
Next.js 16.2.4 + React 19 + TS + Prisma + Vitest 的人格测试项目"魔女审判"重构为"灵魂审判器"。阶段1 三件事：题目改写、维度改名、批注+交互变奏（天平/砝码）。锁死区：match.ts 算法、WEIGHTS、ALGO_CONFIG、15 角色 vector、维度 code。

## 三个方案变体

### 变体 1：最小侵入（Minimal Intrusion）—— ⚠️ 仅立场摘要（完整段落被截断，见 FAULTS.md）
**立场**：
- variant（天平/砝码/批注）不入库、按 `order` 硬编码位置（8/14/22）。
- 天平/砝码/批注全部退化为 `type: "normal"` 或 TestScreen 内部 state。
- 代价：TestScreen 文件复杂度上升。
- 收益：数据层、schema、match、answer-processor 零改动，5 个 commit 之间几乎无耦合，可独立 revert。
- 阶段2 如要把 variant 抽象为 pack 配置，硬编码常量表是唯一需重构点。

### 变体 2：稳健扩展（Robust Extension）—— 完整方案
**BLUF**：把天平/砝码/批注提升为显式 QuestionType（判别联合 + 新增 DB enum 成员 balance/weight/interlude），让它们成为一等公民。打分通过新 type 选项保留 dim+score 字段走现有 processAnswers 累加循环，算法核心零改动。
**数据模型**：
- QuestionDef 改判别联合：normal | gate | trigger | balance | weight | interlude，各态带专属字段。
- 砝码题展开成 7 个合法组合 option（{0,1,2} 总和=3 的 7 种组合），每个 option.score = 该组合的 F1 贡献。用户拖拽 → 查表找 optionId 提交。
- 批注引擎：纯函数 pickAnnotation(node, dimScores, pack, rng) → string，独立模块 annotations.ts。档位判定：前 N 题维度 sum 占理论最大值的比例 ≥66%=H, 33-66%=M, <33%=L。
- interlude 用 Question 行占位（dim=INTERLUDE），processAnswers 加 guard `if dim==="INTERLUDE" continue`。
**改动清单（6 commit）**：C1维度改名 / C2题目改写+门控value / C3数据模型扩展(联合类型+DB enum) / C4变奏内容填充+批注池 / C5 TestScreen分发渲染 / C6 DB seed重建+端到端验证。
**被拒**：A)塞normal+meta标记(魔法字符串) / B)完全pack化重写(YAGNI，阶段2的事) / C)批注预生成存DB(运行时值)。
**风险**：1)DB enum扩展生产不可逆+seed清空Answer历史 / 2)砝码7-option score映射易错 / 3)判别联合改造一次性触动26题字面量。

### 变体 3：内容驱动（Content-Driven）—— 完整方案
**BLUF**：所有可变文案收敛到内容层，用统一 QuestionDef + `renderType` 字段（与 DB type 解耦）描述全部题型，TestScreen 退化成按 renderType 分发的薄层，answer-processor 几乎零改动。
**数据模型**：
- QuestionDef 加 `renderType: "normal"|"scale"|"weight"`（默认=type）+ `variant: "forward"|"reverse"`。DB type 保持 normal/gate/trigger 不扩展。
- 天平题：renderType=scale，2 个 option 硬编码 score（左=W2低=1, 右=W2高=3）。
- 砝码题：renderType=weight，7 个合法组合 option（同变体2），label 用 `weight::分配串` 编码。
- 批注：独立 interjections.ts，pickInterjection(dimScores, node)，档位判定用 scoreToTier 转主维度档位。
- renderType 透传：用 meta 字段编码（如 `scale::觉醒·见证`）或新增列（备选，本方案倾向 meta 复用以零迁移）。
**改动清单（6 commit）**：C1维度改名 / C2 26题改写 / C3门控value重命名 / C4批注插页 / C5天平+砝码+renderType分发 / C6 reseed+文档。
**被拒**：A)扩展DB enum(过度建模，内容层映射零迁移拿同效果) / B)砝码三槽独立提交三optionId(污染一题一答不变量) / C)批注放i18n(是内容非chrome) / D)内嵌translations(双source of truth)。
**风险**：1)renderType如何从DB透传(唯一架构断点) / 2)砝码score标定是主观判断 / 3)批注插页破坏currentIndex/progress/localStorage。

## 你的产出（严格按此结构）

### 1. BLUF
一句话最终裁决。

### 2. 最终 ADR（逐决策）
对以下每个关键决策点，给出**最终选择**（可选某个方案的、或融合的），并说明：
- 选择什么
- 为什么（对比三方案在此点的差异）
- 否决了什么

**决策点列表**：
- **D1：DB QuestionType enum 是否扩展（加 balance/weight/interlude）？** 这是三方案最大分叉：变体2扩展+判别联合，变体3保持 normal 用 renderType 透传，变体1全靠 TestScreen state。
- **D2：砝码题数据模型**（三方案都倾向 7 合法组合 option，但需确认 score 标定方式）。
- **D3：天平题数据模型**（2 option 硬编码 score，三方案一致）。
- **D4：批注插页**（独立模块 vs DB 占位行 vs TestScreen 内部；档位判定算法放哪；文案池结构）。
- **D5：renderType/题型差异如何从前端分发到渲染**（判别联合编译期检查 vs renderType 字段 switch vs meta 编码 vs TestScreen state）。
- **D6：批注信号档位判定算法**（理论最大值占比 vs scoreToTier vs 其他）。
- **D7：commit 顺序与粒度**（三方案都是 6 commit 但顺序不同）。

### 3. 共同盲点
三个方案**都**没充分处理的点。这是仲裁最高价值产出。仔细想：
- i18n 结构（zh-CN.ts 与 quiz-content.ts 双写同步问题，阶段3 翻译怎么办）。
- localStorage 进度恢复（用户做到第 8 题刷新，变奏题状态怎么恢复）。
- feature flag 回退（R12 要求可回退，新题型 DB 数据/客户端旧代码不崩的兜底）。
- 角色向量是否需按新维度重新审视（REDESIGN §7 待定项）—— 阶段1 锁死了不动，但结果页 ResultScreen 展示维度条时新名字是否会让 15 个角色的"画像"读起来别扭？
- 砝码题拖拽的 a11y（键盘用户怎么操作三槽分配）。
- 跨维度打分的归集（天平第8/22题都给W2，那W2实际有两道题的分数，权重是否失衡）。

### 4. 实现者模块切分建议（给 L4 用）
基于最终 ADR，建议如何切分并行实现模块（每个模块职责一句话 + 接口契约 + 拥有文件 + 禁区）。

请先读意图契约，再比较三方案产出最终 ADR。要有立场，不要和稀泥。

## 🤖 助手
我先读意图契约作为仲裁依据，同时浏览项目结构了解锁死区的实际代码。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
契约非常详尽。让我继续查看其他关键上下文文件。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
看到 schema 实情了。SQLite + QuestionType enum（normal/gate/trigger）。继续看几个核心文件，验证三方案的实际假设。

> 🔧 工具调用 2 次: Read

## 🤖 助手
非常有价值。现在我看清了关键事实——`quiz-content.ts` 里 QuestionDef 的 options 已经支持任意 `score`，answer-processor 已用 `opt.score ?? 0` 累加，**关键约束是 `dimScores[dim] += opt.score`**。让我看 match.ts、TestScreen 和 pack types 确认锁死区边界。

> 🔧 工具调用 3 次: Read

## 🤖 助手
关键证据已经齐了。`processAnswers` 的 `dimScores[dim] += opt.score ?? 0` 这一行就是打分路径，匹配算法在 `match.ts`。我注意到一个**所有人都忽略的关键事实**：当前 ALGO_CONFIG.tiers 上限是 6，但 W2、F1 维度本来就有 2 道题（一正一反），变奏替换了原 8/14/22 题（这些位置本来就有 W2/F1/W2 题目的 score），所以 W2 实际仍是 2 道题、F1 仍是 2 道题——但变奏题的 score 档位被人工定档（变体 2/3 都自承"score 标定是主观判断"），可能让总维度分撞穿 ALGO_CONFIG 的 max=6 上限或落入异常档位。这点需要专门查。

让我快速看 match.ts、quiz-content.scores.test.ts 与 seed 看约束边界。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
所有关键证据已经齐全。我现在掌握了：

1. **processAnswers** 的核心逻辑：`qType === "gate"` → 提取 gateValue 后 `continue`；`qType === "trigger"` → 提取 triggerFired 后 `continue`；否则 `dimScores[dim] += opt.score ?? 0`。这是 26 题流程中所有题都进入这个循环。
2. **关键风险点**：`ALGO_CONFIG.tiers.max = 6`（最高），`applyGateBonus` 用 `Math.min(...+add, 6)` 钳制，但**没有对题目总分做钳制**——只有 gate bonus 才钳制到 6。
3. **TestScreen 的现实约束**：`onComplete` 只发送 `{questionId, optionId}[]`，每题一答。displayQuestions 用 `gateValue === "destroy" || "endure"` 过滤——这跟契约 A5 中改 value key 为 `seen` 直接冲突，是契约已要求同步的下游点。
4. **测试约束**：`quiz-content.scores.test.ts` 断言 normal 题 option score ∈ [1,3]。砝码题如果 type=normal 且 score 取值 0/1/2，会**直接破坏该测试**（0 < 1）。

这些都是我没看到任何方案触及的盲点。可以产出最终 ADR 了。

---

# 仲裁决策记录 — 阶段1：核心体验（魔女审判 → 灵魂审判器）

### BLUF

融合三方案：以**变体 3（内容驱动）的 renderType 字段**为数据模型主轴（零 DB 迁移，符合 R12 可回退），砝码/天平的具体 option/score 设计采用**变体 2（稳健扩展）的"option 走打分循环"思路**（最契合现有 processAnswers），变体 1 的"硬编码位置常量"**只**作为 renderType 透传失败时的回退兜底被部分吸收。最关键裁决：**不扩展 DB enum**（D1）——因为它既违反 R12 可回退（生产不可逆 + 清空历史），又是用 schema 表达内容问题。**找到 3 个三方案都没认真处理的共同盲点**（关键的一个：`quiz-content.scores.test.ts` 断言 score∈[1,3]，砝码"0 分" option 必破坏该测试，所有方案都没提），1 个严重被低估的（W2/F1 双题分档可能与 ALGO_CONFIG max=6 冲突）。

---

## 决策比较

| 决策点 | 变体1（最小侵入） | 变体2（稳健扩展） | 变体3（内容驱动） | → 选定 |
|---|---|---|---|---|
| **D1 DB enum 是否扩展** | 不扩（TestScreen state 兜） | 扩，加 balance/weight/interlude + 判别联合 | 不扩，用 renderType 透传 | **不扩，新增 `renderType` 字段** |
| **D2 砝码数据模型** | TestScreen 内部 state | 7 个 option，每 option 走打分 | 7 个 option + meta 编码 | **7 个 option，type=normal，label 用编码** |
| **D3 天平数据模型** | TestScreen 内部 state | 2 option + 走打分 | 2 option + renderType=scale | **2 option，type=normal，硬编码 score** |
| **D4 批注插页** | TestScreen 内部 state | DB Question 行（dim=INTERLUDE）+ guard | 独立模块 + 独立流程 | **独立模块 + TestScreen 内插页逻辑** |
| **D5 前端分发渲染** | TestScreen 内部 switch | 判别联合 + 编译期检查 | renderType 字段 switch | **renderType 字段 switch（兜底=type）** |
| **D6 档位判定算法** | 未提 | 理论最大值占比 66/33 | scoreToTier | **scoreToTier**（已存在） |
| **D7 commit 顺序** | 5 类独立 | C3 数据模型靠前 | C5 渲染靠后 | **C3 改名→C5 数据填充→C6 渲染→C7 验证** |

### 每个选定决策的理由

**D1：DB QuestionType enum 不扩展；新增 TS 字段 `renderType`**
- **理由**：变体 2 自己列的最大风险是"DB enum 扩展生产不可逆 + seed 清空 Answer 历史"——这在 R12（feature flag 可回退）下是**致命的**，回退路径直接断掉。变体 3 用 renderType 透传达到相同建模效果但零 schema 改动；变体 1 完全靠 TestScreen state 是真退化为最差解（所有渲染逻辑塞一个组件）。**否决了**：变体 2（违反 R12，违反"内容问题不用 schema 表达"），变体 1 的纯前端 state（违反 DRY，文案硬编码进组件）。
- **细节裁定**：renderType 透传方式选**新增可选列**而非变体 3 自己提的"meta 字段魔法编码 `scale::觉醒·见证``"——因为魔法编码会污染 meta（meta 本身就有用途，是分组标签），且破坏现有 `q.meta === "审判·镜像"` 这类测试断言（见 quiz-content.scores.test.ts L17, L23）。新列在 prisma schema 加 `renderType String @default("normal")`，对应 seed 同步，零迁移成本（SQLite 默认值即可）。

**D2：砝码题 = 7 个合法组合 option，type=normal，label 编码分配**
- **理由**：三方案在"7 合法组合"上一致，这是**共同弱证据**（不是因方案正确，而是因 A2 契约限定了它）。真正的分叉在"打分走不走 processAnswers"——选**走**，理由：processAnswers 是唯一的服务端防篡改路径，TestScreen 内部 state（变体 1）必须再发明一套校验逻辑，纯增加表面积。
- **关键裁定（任何方案都没提）**：score 必须落在 [1,3]。A2 契约说"分配值 0/1/2 直接作 F1 贡献"，但 `quiz-content.scores.test.ts` L9-10 断言 `score >= 1`，且 option 中带 0 的会是非法输入。**强制规则：砝码 7 个 option.score = 该组合的 F1 贡献 +1**（即 0→1、1→2、2→3）。详细在 D6 与盲点 §B1。
- **label 编码**：`weight::0|1|2` 形式，前端拖拽完成后查表找到对应 optionId 提交（保留一题一答不变量，否决变体 3 自己提的"三槽独立提交三 optionId"备选）。

**D3：天平题 = 2 个 option，type=normal，硬编码 score**
- **理由**：A3 契约已明确"硬编码加分挂回原维度"。3 方案一致，无分叉。第 8 题（W2，正向）选左=W2 低分=1、右=W2 高分=3；第 22 题（W2，反向）方向相反（左=3、右=1），与现有反向题规则一致。**注意**：option.score 必须 ∈ [1,3]（同 D2）。

**D4：批注插页 = 独立模块，不走 Question 表，由 TestScreen 在位置 5/10/15 后内插**
- **理由**：否决变体 2 的"dim=INTERLUDE 的 Question 行"——它要求改 processAnswers 加 `if dim==="INTERLUDE" continue` guard，这是**对锁死区 answer-processor 的改动**（虽小，但契约明确锁了 match.ts/WEIGHTS/ALGO_CONFIG/vector/code，没锁 answer-processor，不过最小改动原则下能不动则不动）。批注是纯前端体验，A4 契约已明确"动态生成"，让它不进 answer 数组最干净。
- **模块**：新文件 `src/lib/annotations.ts`，导出 `pickAnnotation(node: 5|10|15, dimScores: Record<string, number>, pack: QuizPack, rng: () => number): string`。文案池放同模块的 `const POOLS`。
- **TestScreen 集成**：在 `currentIndex` 移动到 5/10/15（即答完第 5/10/15 题）后，先展示批注插页一屏，按任意键/点击进入下一题。批注本身**不进入 answers 数组**（保持 onComplete 协议不变）。

**D5：renderType 字段 switch，兜底=type**
- **理由**：否决变体 2 的判别联合——它要求把所有 26 题字面量重写为判别联合形态一次性完成（变体 2 自承"一次性触动 26 题字面量"），违反 commit 可独立 revert 的纪律（R13）。renderType 字段是渐进改造，未标注 renderType 的题自动走原路径（兜底=`type`）。**否决**变体 3 自己提的 meta 编码（污染 meta，见 D1）。

**D6：档位判定用现有 `scoreToTier`**
- **理由**：变体 3 用 scoreToTier，变体 2 用"前 N 题维度 sum 占理论最大值的比例 ≥66%"。`scoreToTier` 是 match.ts 已导出的纯函数（match.ts L44），用 tiers=[2,4,5,6]→[L,M,H,X]。它的好处是批注档位与最终角色档位用同一语义，避免"批注说 H，结果页显示 M"的撕裂。**但**要明确一个语义细节：A4 说"取最高/最低或主导维度"——主导维度定义模糊，留给实现者按"最高 sum 的维度"实现（已在开放问题 Q2 标记）。

**D7：commit 顺序 = 改名→内容→变奏→渲染→验证，6-7 个**
- **理由**：变体 2 把数据模型靠前（C3），变体 3 把渲染靠后（C5）。最终采用变体 3 的顺序骨架但补一个验证 commit：C1 维度改名（含 config.ts + zh-CN.ts dims/dimGroups + 测试断言）/ C2 26 题改写 + 门控 value（含 zh-CN questions/gate） / C3 批注模块 + 池 / C4 天平+砝码数据填充（quiz-content.ts option 化）+ prisma 加 renderType 列 + seed / C5 TestScreen renderType 分发 + 批注插页集成 / C6 reseed + 端到端验证（含手动跑过一遍流程）。这个顺序让每个 commit 内部自洽，C2 完成时 quiz 仍可跑（只是文案旧），C4 完成时数据已有但 UI 不渲染（renderType 兜底走 normal），C5 才点亮新交互。

---

## 共同盲点（最高价值）

### B1：`quiz-content.scores.test.ts` 的 [1,3] 断言会被砝码/天平"0 分" option 直接破坏 ★最关键

三方案都没提这个测试。该测试 L9-10 断言**每个 normal option 的 score ∈ [1,3]**。但 A2 契约说砝码 7 个合法组合中 "0+1+2" 这类组合的"0 槽"如果直接作为 score 就是 0——**测试直接红**。同理天平若用"低分=0"也炸。
- **重要性**：验收锚点 1 明确要求该测试通过。这是阻塞性 bug。
- **处理**：裁定砝码 option.score = F1 贡献值 + 1（0→1, 1→2, 2→3），三槽 sum 仍 = 3 但反映为 option.score = (slotA + slotB + slotC) + 0 中"被选中槽的值 + 1"。具体：option.score = 该 option 对应分配串中**主槽**（如 F1 维度的判定槽）的值 +1，或更简单 option.score = 整个组合 sum / 3 +1 = 1+1 = 2（恒定）——这反而抹平了砝码差异，**不对**。
- **正确做法**：砝码 7 option.score 应反映"该用户分配对 F1 的总贡献"，例如 `[1,1,1]` → F1=3 → score=3；`[2,1,0]` → 主导槽=2 → F1 强 → score=3。**这暴露了 A2 的真实问题**：砝码"分配串"到"单一 F1 score"的映射规则契约没定义清楚，需要人决策（见开放问题 Q1）。**砝码 score 映射规则必须先定才能实现**，否则任何实现都是猜。

### B2：W2、F1 跨题总分可能与 `ALGO_CONFIG.tiers.max=6` 冲突

W2 有第 8 题（变奏天平）+ 第 23 题（反向"觉醒·理性"）两道题；F1 有第 14 题（变奏砝码）+ 第 2 题（正向）+ 第 13 题（反向"侵蚀·悖论"）三道题。但 `applyGateBonus` 用 `Math.min(...+add, 6)` 钳制到 6（match.ts L126），而 `scoreToTier` 在 `total > 6` 时返回 3（X 档）。
- 三方案都没算过：变奏题 score 进入打分后，W2/F1 这些维度总和是否撞穿上限？变奏题的硬编码 score（如天平高分=3）若再叠加正常题分（W2 第 23 题 3 选项最高 3 分），W2 总分可能 = 3+3 = 6，正好顶满；F1 = 第 2 题(3) + 第 13 题(3) + 砝码(≤3) = 9，**直接撞穿 6 上限，且没有钳制逻辑**——只有 gate bonus 被钳制，普通打分不钳制。这会让 F1 永远是 X 档，角色匹配严重偏向高 F1 角色。
- **重要性**：违反 R6（不改算法逻辑）的语义边界——虽然没改代码，但分数分布破坏了 match 算法的隐含假设。
- **处理**：实现者必须在 C6 验证阶段跑过若干典型作答模式，确认 F1/W2 总分分布与改造前等价（砝码题替换的原本是第 14 题 F1"侵蚀·悖论"反向题，那道题 3 选项 score ∈ [1,3]，砝码必须模仿同样量级）。**砝码 option.score 取值范围应限制在与原反向题等价**——这进一步支持 B1 的"+1 偏移"方案：让砝码 option.score ∈ [1,3] 而非 [0,2]。

### B3：localStorage 进度恢复（用户做到第 8 题刷新，变奏题状态怎么恢复）

变体 3 自承"批注插页破坏 currentIndex/progress/localStorage"是风险但没给方案。变体 1、2 没提。当前 TestScreen 的 `STORAGE_KEY = "witch-trial-progress"` 存的是 `{currentIndex, answers, gateValue}`（TestScreen L40-52）。
- **问题**：批注插页如果通过临时改 `currentIndex` 实现，刷新后会跳到错位的位置（currentIndex 是题目索引，批注不是题目）。砝码题拖拽如果走"局部 state → 完成后才 push optionId 到 answers"，刷新后拖到一半的分配丢失（但这点其实可接受，用户重新分配一次）。
- **重要性**：用户体验直接相关，违反 R12 的"feature flag 可回退"的隐含前提（回退不能让旧进度数据崩）。
- **处理**：批注插页用独立 state `interjectionOverlay: {node: 5|10|15} | null`，**不改 currentIndex**，插页显示逻辑 = `interjectionOverlay || current question`。这样 localStorage 不用改，刷新后 interjectionOverlay=null（重新答一遍第 5/10/15 题会再次触发，可接受）。砝码题部分分配不持久化（可接受）。

### B4：feature flag 回退时新题数据 + 旧客户端的兜底（R12）

三方案都点了 R12 但没人给具体回退路径。
- **问题**：如果 renderType 列已部署但前端代码回退到旧版（不识别 renderType），DB 里砝码/天平题仍是 normal 类型 7/2 个 option——旧客户端会**渲染出 7 个选项的"normal 题"**，砝码变成 7 选 1 的怪题。这个降级是可接受的（用户能继续测，只是体验错乱）但**没人承认**。
- **重要性**：R12 是 spec 强约束。
- **处理**：裁定**降级行为可接受**——回退期间砝码显示为 7 个长选项的常规题，用户随便选一个仍能完成测试（option.score 仍累加，结果仍有效，只是体验差）。实现者必须在 C6 文档中写明这个降级行为，不要让运维以为是 bug。

### B5：a11y（键盘用户怎么操作砝码拖拽）

三方案完全没提。R12 锁死了 700ms 时序和键盘提示（TestScreen L193-209 现有键盘 1/2/3/4 直接选 option）。
- **问题**：砝码是拖拽 UI，键盘用户无法操作。spec §6 没明确 a11y 要求，但项目其它题都有键盘路径。
- **重要性**：a11y 缺口，但不阻塞阶段1 验收（验收锚点没要求 a11y）。
- **处理**：标为**阶段1 已知缺口，阶段2 补**。砝码题可临时提供"用数字键 1/2/3 切换聚焦槽，+/- 增减"的退化键盘模式（实现者酌情），或干脆文档化为"砝码题仅支持鼠标/触摸"。这是开放问题 Q3。

### B6：i18n 双写同步（zh-CN.ts 与 quiz-content.ts 双 source of truth）

R7 明确要求 zh-CN.ts 的 dims/dimGroups/questions/gate 与新命名同步。但 quiz-content.ts 才是真正入 DB 的源（seed.ts 从这里读），zh-CN.ts 是 i18n key→文案的映射，**两者必须同步改名**否则会出现"config.ts 已改、zh-CN.ts dims.S1 还是旧名"的撕裂。
- 三方案都没列 zh-CN.ts 的具体改动清单（变体 3 的 C2 提了 "26题改写"但没说 i18n key 同步）。
- **重要性**：验收锚点 3 直接要求"config.ts S1.name 与 zh-CN.ts dims.S1 同步"。
- **处理**：纳入 C1（维度改名）和 C2（题目改写）commit 的明确子任务清单，不允许漏。FRONTEND-HANDOFF.md 若已有 i18n 改动指引需复核。

---

## 最终 ADR

### 背景

阶段1 在不动加权曼哈顿算法（match.ts）、WEIGHTS、ALGO_CONFIG、15 角色 vector、维度 code（S1..W3）的前提下，完成三件事：(1) 26 题改写为审判官断言式逼问 + 三态剖白选项；(2) 12 维度去 IP 化改名；(3) 第 5/10/15 题后审判官批注插页 + 第 8/22 题天平题 + 第 14 题砝码题。A1-A6 已锁定变奏题位置、砝码取值、变奏打分、批注信号、门控 value 重命名、触发题文案。最大架构分叉是"DB QuestionType 是否扩展"——它牵动数据模型、回退能力、commit 可独立 revert 的纪律。

### 决策

1. **D1（DB 不动）**：来自变体 3，因为变体 2 自承的最大风险（DB enum 生产不可逆 + 清空历史）直接违反 R12。新增 TS 可选字段 `renderType` 透传题型差异，prisma schema 加 `renderType String @default("normal")` 列，seed 写入对应值。SQLite 默认值免迁移。
2. **D2（砝码 7 option）**：来自变体 2 + 变体 3 共识。type 保持 normal，7 个 option 对应 {0,1,2} 总和=3 的 7 种合法组合，label 用 `weight::a|b|c` 编码。option.score 必须落在 [1,3] 区间（具体映射规则见开放问题 Q1，需人决策）。
3. **D3（天平 2 option）**：来自三方案共识。type=normal，2 个 option 硬编码 score（第 8 题 W2 正向：左=1、右=3；第 22 题 W2 反向：左=3、右=1）。
4. **D4（批注独立模块）**：来自变体 3 的"独立模块"主张 + 否决变体 2 的"DB INTERLUDE 行"（避免改 answer-processor）。新文件 `src/lib/annotations.ts`，TestScreen 通过 `interjectionOverlay` state 内插显示，不进 answers 数组，不改 currentIndex。
5. **D5（renderType switch）**：来自变体 3，否决变体 2 的判别联合（违反渐进改造与 commit 独立 revert）和变体 3 自己提的 meta 魔法编码（污染 meta）。TestScreen 按 `q.renderType ?? q.type` switch。
6. **D6（scoreToTier 档位判定）**：来自变体 3，复用 match.ts 已导出函数，档位语义与最终结果页一致。批注在 5/10/15 节点对当前 dimScores 取最高维度 → scoreToTier → H/M/L 选池。
7. **D7（6 commit）**：C1 维度改名（config + zh-CN dims/dimGroups）/ C2 26 题改写 + 门控 value 同步（quiz-content + zh-CN questions/gate + TestScreen value 比较 + pack index）/ C3 批注模块 annotations.ts + 池 / C4 砝码+天平数据填充 + prisma renderType 列 + seed / C5 TestScreen renderType 分发 + 批注插页 + localStorage 适配 / C6 reseed + 端到端验证 + 文档（含降级行为说明）。

### 后果

**得到**：
- 数据层零迁移（renderType 列有默认值，老数据自动 = normal）。
- 算法核心（match.ts、answer-processor、WEIGHTS、ALGO_CONFIG、vector）零改动。
- 每个 commit 内部自洽，可独立 revert（C2 完成时只是文案旧，C4 完成时 UI 走兜底渲染，C5 才点亮变奏）。
- feature flag 回退路径完整（renderType 不识别时降级为 normal 多选项题，用户仍可完成测试）。

**牺牲**：
- TestScreen 复杂度上升（renderType 分发 + 批注插页 overlay + 砝码拖拽 UI），文件可能突破 400 行——这是变体 1 自承的代价被继承。
- 砝码拖拽 a11y 在阶段1 是已知缺口（B5）。
- 砝码 score 映射规则未定（开放问题 Q1），阻塞 C4。

---

## 给人的开放问题

### Q1：砝码 7 option.score 的具体映射规则（阻塞 C4 实现）

**问题**：A2 契约说"三槽分配值 {0,1,2} 直接作为 F1 的得分贡献"，但 7 个合法组合是分配串（如 `[2,1,0]`），不是单值。一个 option 对应一个分配串，那这个 option 的 score 是什么？
- **选项 A**：option.score = 主槽（F1 判定槽）的值 +1，即 `[2,1,0]→3、[0,1,2]→1、[1,1,1]→2`。代价：用户的"非主槽分配"完全不影响 F1 分，砝码题退化为"主槽 0/1/2 三选一 + 装饰"，三槽设计意义弱化。
- **选项 B**：option.score = 三个槽加权（如 F1 主槽权重 0.6，另两槽各 0.2）后取整 +1。代价：实现复杂，且权重值是主观判断。
- **选项 C**：option.score = 三槽总和归一化到 [1,3]，即 sum 永远=3 → score 永远=2。代价：砝码题对 F1 完全无区分度，不如不做。
- **我的建议（仅供人参考）**：选 A，但把"主槽"明确定义为契约 A2 里说的 F1 维度槽（砝码三槽分别对应 F1/W2/B1 三个维度？还是 F1 三个子方面？这本身也未定义）。**这个未定义暴露了 A2 契约的真正缺口**：砝码三槽到底对应哪三个维度，契约没说。需要人决策。

### Q2：批注"主导维度"的精确定义

**问题**：A4 说"取最高/最低或主导维度"——"或"让实现者无所适从。
- **选项 A**：主导维度 = 当前 dimScores 中 sum 最高的维度。
- **选项 B**：主导维度 = 当前 dimScores 中 sum 最高的维度，但若最高与最低差距 < 2 则取"最稳定"（方差最小）的维度。
- **代价**：A 简单但可能让"哪个维度都中等"的用户批注很随机；B 复杂但更"懂"用户。
- **我的建议**：A，因为 R9 禁止输出维度信息，批注只是行为描写，主导维度的精度不影响体验，简单优先。

### Q3：砝码题 a11y 在阶段1 是否必须

**问题**：B5 暴露的键盘用户操作缺口。
- **选项 A**：阶段1 仅鼠标/触摸，文档化已知缺口，阶段2 补键盘模式。
- **选项 B**：阶段1 必须实现退化键盘模式（数字键切槽、+/- 调整）。
- **代价**：A 加快阶段1 交付但留下 a11y 债；B 增加 C5 工作量约 0.5-1 天。
- **我的建议**：A，因为验收锚点 5 只要求"第 14 题为砝码题（三槽总和=3）"，没要求 a11y。

### Q4：降级行为是否需要在 UI 层提示用户

**问题**：B4 的回退场景——旧客户端遇到新 DB 数据时砝码显示为 7 个选项的怪题。
- **选项 A**：不提示，用户自己看着办。
- **选项 B**：TestScreen 检测到 option 数 > 4 时显示"本题暂时降级显示"提示。
- **代价**：A 简单但用户体验怪；B 增加防御代码。
- **我的建议**：A，因为回退是临时状态（feature flag 翻回去就正常），加提示反而暴露内部实现。

---

## 实现者模块切分建议（给 L4）

### M1：维度改名（C1）
- **职责**：把 12 维度的 name/modelName/dir 改为通用心理维度名。
- **接口契约**：`config.ts DIMENSIONS` 的 `name/modelName/dir` 字段值变更，`code/WEIGHTS/ALGO_CONFIG` 不动；`zh-CN.ts` 的 `dims/dimGroups` key 同步。
- **拥有文件**：`src/content/packs/witch-trial/config.ts`、`src/i18n/zh-CN.ts`（仅 dims/dimGroups 部分）。
- **禁区**：WEIGHTS、ALGO_CONFIG、维度 code、15 角色 vector。
- **验收**：`pnpm test quiz-content.scores` 通过；`match.test.ts` 通过；config.ts 与 zh-CN.ts dims key 一致。

### M2：题目改写 + 门控 value 重命名（C2）
- **职责**：26 题改写为审判官断言式 + 三态剖白选项；门控 value 改 destroy/seen/peace/undecided。
- **接口契约**：`quiz-content.ts QUESTIONS` 文本字段全改，option 数量不变（normal 题 3 选项）；门控题 option.value 改新 key；触发题文案改、trigger 不变。
- **拥有文件**：`src/data/quiz-content.ts`、`src/i18n/zh-CN.ts`（questions/gate/trigger）、`src/content/packs/witch-trial/index.ts`（gateValues/gateBonus/specialTriggers/triggerGates）、`src/components/TestScreen.tsx`（L106/129 的 value 比较）、prisma seed（如硬编码旧 value）。
- **禁区**：option.score 数值（除非反向题规则要求）、trigger 字段值、15 角色 vector。
- **验收**：所有现有测试通过；TestScreen displayQuestions 过滤逻辑用新 value key 正常工作。

### M3：批注模块（C3，可并行 M1/M2）
- **职责**：实现纯函数 `pickAnnotation` + 文案池。
- **接口契约**：`pickAnnotation(node: 5|10|15, dimScores: Record<string, number>, pack: QuizPack, rng?: () => number): string`；纯函数；不依赖 DOM。
- **拥有文件**：新文件 `src/lib/annotations.ts`、新测试 `src/lib/annotations.test.ts`。
- **禁区**：所有现有文件。
- **验收**：单测覆盖 3 节点 × 3 档位 × rng 确定性。

### M4：砝码+天平数据 + renderType 列（C4，依赖 Q1 决策）
- **职责**：quiz-content.ts 第 8/14/22 题改造为变奏题；prisma schema 加 renderType 列；seed 同步。
- **接口契约**：第 8/22 题变 2 option normal 题带 renderType=scale；第 14 题变 7 option normal 题带 renderType=weight；option.score ∈ [1,3]（具体见 Q1 决策）；renderType 默认 normal。
- **拥有文件**：`src/data/quiz-content.ts`（第 8/14/22 题）、`prisma/schema.prisma`、`prisma/seed.ts`、`src/pack/types.ts`（如需给 QuestionDef 加 renderType 字段）。
- **禁区**：match.ts、answer-processor.ts、WEIGHTS、ALGO_CONFIG、其它 23 题。
- **验收**：`quiz-content.scores.test.ts` 通过（option.score ∈ [1,3]）；reseed 后 DB 第 8/14/22 题有正确 renderType 与 option 数。

### M5：TestScreen renderType 分发 + 批注插页 + localStorage 适配（C5，依赖 M3/M4）
- **职责**：TestScreen 按 renderType 渲染天平/砝码/normal；批注插页 overlay；localStorage 不破坏。
- **接口契约**：renderType=scale 渲染 2 大块左右对峙；renderType=weight 渲染三槽拖拽 + 总和=3 校验 + 完成→查表 optionId push answers；批注插页用 `interjectionOverlay` state 不改 currentIndex。
- **拥有文件**：`src/components/TestScreen.tsx`、新组件 `src/components/balance-question.tsx`、`src/components/weight-question.tsx`、`src/components/interjection-overlay.tsx`。
- **禁区**：数据层、算法层、批注模块内部。
- **验收**：手动跑完整流程；localStorage 在 5/10/15 节点刷新后不丢题进度；砝码拖拽完成能正确提交 optionId。

### M6：端到端验证 + 文档（C6，依赖 M1-M5）
- **职责**：reseed + 跑全流程 + 写降级行为文档。
- **接口契约**：`FORCE_RESEED=1 pnpm db:seed` 成功；至少 3 种典型作答模式（全 A/全 C/混合）的 F1/W2 总分分布与改造前等价（验证 B2）；文档说明 renderType 不识别时的降级。
- **拥有文件**：`crucible/` 下新增降级说明文档（如需）。
- **禁区**：所有源代码（只读验证）。
- **验收**：6 个验收锚点全部满足；git log ≥6 个语义化 commit。

**并行建议**：M1、M2、M3 可三个 architect/实现者并行（互不依赖）；M4 等 Q1 决策后启动且依赖 M2（quiz-content.ts 文件冲突，需串行或协调）；M5 等 M3+M4；M6 最后。
