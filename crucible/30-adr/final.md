# 最终 ADR — 阶段1：核心体验

> arbitrator 产出，2026-08-07。融合三个 architect 方案（最小侵入/稳健扩展/内容驱动）。

## BLUF

融合三方案：以**内容驱动的 `renderType` 字段**为数据模型主轴（零 DB 迁移，符合 R12 可回退），砝码/天平的具体 option/score 设计采用**稳健扩展的"option 走打分循环"思路**（最契合现有 processAnswers），最小侵入的"硬编码位置常量"只作为 renderType 透传失败时的回退兜底。**最关键裁决：不扩展 DB enum（D1）**——因为它既违反 R12 可回退（生产不可逆 + 清空历史），又是用 schema 表达内容问题。

仲裁抓到 6 个共同盲点，其中最关键的是：`quiz-content.scores.test.ts` 断言 score∈[1,3]，砝码"0 分" option 必破坏该测试（三方案都漏）；W2/F1 双题分档可能与 ALGO_CONFIG max=6 冲突。

---

## 决策（逐条）

### D1：DB QuestionType enum 不扩展；新增 TS 字段 `renderType`
- **选**：变体3 的 renderType 字段（与 DB type 解耦）。
- **理由**：变体2 自承最大风险"DB enum 扩展生产不可逆 + seed 清空 Answer 历史"直接违反 R12 可回退。renderType 透传达相同建模效果但零 schema 改动。
- **细节**：prisma schema 加 `renderType String @default("normal")` 列（SQLite 默认值免迁移），不用变体3 自提的"meta 魔法编码"（会污染 meta 分组标签、破坏现有测试断言）。
- **否决**：变体2 判别联合（一次性改26题字面量，违反 commit 可独立 revert）；变体3 meta 编码（污染 meta）。

### D2：砝码题 = 7 个合法组合 option，type=normal，label 编码分配
- **选**：变体2/3 共识的 7 option 方案。
- **数据**：type=normal，7 个 option 对应 {0,1,2} 总和=3 的 7 种合法组合（(1,1,1) + (0,1,2)的6种排列），label 用 `weight::a|b|c` 编码。
- **打分**：走 processAnswers 现有累加循环（服务端防篡改路径）。
- **关键约束**：option.score 必须 ∈ [1,3]（见盲点 B1，否则破坏 quiz-content.scores.test.ts）。
- **阻塞**：score 映射规则需先定（见开放问题 Q1）。

### D3：天平题 = 2 个 option，type=normal，硬编码 score
- **选**：三方案共识。
- **数据**：第8题（W2正向）：左=score1、右=score3；第22题（W2反向）：左=score3、右=score1（反向题规则）。renderType=scale。

### D4：批注插页 = 独立模块 + TestScreen overlay，不进 DB/answers
- **选**：变体3 独立模块 + 否决变体2 的 DB INTERLUDE 行。
- **理由**：DB 行方案要改 answer-processor 加 `if dim==="INTERLUDE" continue` guard（虽小但能不动则不动）。
- **模块**：新文件 `src/lib/annotations.ts`，纯函数 `pickAnnotation(node, dimScores, pack, rng): string`。
- **集成**：TestScreen 用独立 state `interjectionOverlay`，不改 currentIndex，不进 answers 数组，onComplete 协议不变。

### D5：renderType 字段 switch，兜底 = type
- **选**：变体3，TestScreen 按 `q.renderType ?? q.type` switch。
- **否决**：变体2 判别联合（违反渐进改造）；meta 编码（污染 meta）。

### D6：档位判定用现有 `scoreToTier`
- **选**：变体3，复用 match.ts L44 已导出函数。
- **理由**：档位语义与最终结果页一致，避免"批注说H、结果页显示M"撕裂。
- **规则**：5/10/15 节点对当前 dimScores 取最高维度 → scoreToTier → H/M/L 选池。

### D7：commit 顺序 = 改名→内容→批注→变奏数据→渲染→验证，6 个
- C1 维度改名（config + zh-CN dims/dimGroups）
- C2 26题改写 + 门控 value 同步（quiz-content + zh-CN questions/gate + TestScreen value 比较 + pack index + schemas + 测试断言）
- C3 批注模块 annotations.ts + 池 + 单测（可与 C1/C2 并行）
- C4 砝码+天平数据填充 + prisma renderType 列 + seed（依赖 Q1 决策）
- C5 TestScreen renderType 分发 + 批注插页 + localStorage 适配
- C6 reseed + 端到端验证 + 文档

---

## 共同盲点（三方案都漏，仲裁补）

### B1 ★最关键：quiz-content.scores.test.ts 的 [1,3] 断言
该测试 L9-10 断言每个 normal option 的 score ∈ [1,3]。砝码"0 槽"若直接作 score=0 → 测试红。**强制：砝码 option.score = F1 贡献值 +1 偏移**（0→1, 1→2, 2→3）。天平 score 也必须 ∈[1,3]。

### B2：W2/F1 跨题总分可能撞穿 ALGO_CONFIG max=6
W2 有第8题(变奏)+第23题(反向)；F1 有第2题+第13题(反向)+第14题(变奏)。applyGateBonus 钳制到6，但**普通打分不钳制**。F1 总分可能=3+3+3=9，撞穿6上限，F1 永远 X 档，角色匹配偏向高 F1。**C6 验证阶段必须验算 F1/W2 总分分布与改造前等价**；砝码 option.score 应限制在与原反向题等价量级。

### B3：localStorage 进度恢复
批注插页用独立 state `interjectionOverlay`，不改 currentIndex。刷新后 interjectionOverlay=null（重新答第5/10/15题会再次触发，可接受）。砝码部分分配不持久化（可接受）。

### B4：feature flag 回退兜底
renderType 已部署但前端回退旧版时，砝码/天平题显示为 7/2 个选项的 normal 题。**裁定：降级行为可接受**（用户能继续测，结果仍有效，体验错乱）。C6 文档写明此降级行为。

### B5：砝码 a11y（键盘用户）
拖拽 UI 键盘无法操作。**裁定：阶段1 已知缺口，阶段2 补**（见 Q3）。可临时提供数字键切槽+/-调整的退化键盘模式（实现者酌情）。

### B6：i18n 双写同步
zh-CN.ts（i18n key→文案）与 quiz-content.ts（入 DB 源）必须同步改名。纳入 C1（dims/dimGroups）和 C2（questions/gate）的明确子任务。

---

## 仲裁开放问题的最终裁决（编排者定，2026-08-07）

用户未在检查点回答 Q1/Q3，编排者按仲裁建议 + 工程约束裁定：

### Q1 最终裁决：砝码三槽 → F1 单维度，主槽定档
- **裁决**：砝码三槽都是 F1 维度的三个子方面（如"复仇烈度 / 记仇程度 / 不愿原谅"），但**只给 F1 一个维度打分**。
- **打分规则**（满足 [1,3] 断言 + 不改 schema + 有区分度）：
  - 7 个合法组合的 option.score = **主槽（值最大的槽）的值 +1**。
  - 即 `[2,1,0]→3`（主槽2）、`[0,1,2]→3`（主槽2）、`[1,2,0]→3`、`[2,0,1]→3`、`[0,2,1]→3`、`[1,0,2]→3`、`[1,1,1]→2`（无主槽，三槽均）。
  - 这样 score ∈ {2,3}，但映射到 F1 的真实档位时，6 个"有主槽"组合都=3（强F1），1 个"均匀"组合=2（中F1）。
  - **问题**：区分度仍弱（只有 2/3 两档）。为提升区分度，调整为：**option.score = 三个槽的加权和**，权重固定（如 F1 判定槽权重2、另两槽权重1），再归一化到[1,3]。具体：option.score = ceil((主槽*2 + 次槽*1 + 末槽*0) / 2)。例：`[2,1,0]→ceil(4/2)=2`... 仍复杂。
  - **最终最简方案**：option.score = **(主槽值) 直接映射**，但为满足 [1,3]，用 `主槽值 + 1`。接受弱区分度——砝码题的核心价值是**交互体验（亲手称量的逼视感）**，不是精细化打分。F1 的精细化打分由第2题(正向)和第13题(反向)两道正常题承担。
- **schema 零改动**：option 单 score + question 单 dim（F1），走现有 processAnswers 累加，无需多维加分。
- **label 编码**：`weight::2|1|0`（三槽分配串），前端拖拽完成查表找 optionId。

### Q2：主导维度 = 当前 dimScores 中 sum 最高的维度（简单优先）

### Q3：砝码 a11y 阶段1 不做
拖拽仅鼠标/触摸。文档化为已知缺口，阶段2 补键盘模式（数字键切槽+/-调整）。

### Q4：降级不提示
renderType 不识别时，砝码显示为 7 个长选项的 normal 题，用户随便选一个仍能完成测试。不提示用户。

---

## 实现者模块切分（给 L4）

| 模块 | 职责 | 拥有文件 | 禁区 | 依赖 |
|---|---|---|---|---|
| **M1 维度改名** | 12 维度 name/modelName/dir 改通用名 | config.ts, zh-CN.ts(dims/dimGroups) | WEIGHTS/ALGO_CONFIG/code/vector | 无 |
| **M2 题目改写+门控value** | 26题审判官语+三态选项；门控value重命名destroy/seen/peace/undecided | quiz-content.ts, zh-CN.ts(questions/gate), pack/index.ts(rules), TestScreen.tsx(L106/129), schemas.ts, answer-processor.test.ts, scripts/smoke-check.mjs | option.score数值/trigger字段/vector | 无 |
| **M3 批注模块** | pickAnnotation纯函数+文案池+单测 | 新文件 src/lib/annotations.ts, annotations.test.ts | 所有现有文件 | 无（可并行M1/M2）|
| **M4 变奏数据+renderType列** | 第8/14/22题改变奏option；prisma加renderType列；seed同步 | quiz-content.ts(第8/14/22题), schema.prisma, seed.ts, pack/types.ts(QuestionDef加renderType) | match.ts/answer-processor/WEIGHTS/ALGO_CONFIG/其它23题 | Q1决策 + M2(文件冲突需协调) |
| **M5 TestScreen渲染+批注集成** | renderType分发+天平/砝码UI+批注overlay+localStorage | TestScreen.tsx, 新组件 balance-question/weight-question/interjection-overlay | 数据层/算法层/批注模块内部 | M3+M4 |
| **M6 端到端验证+文档** | reseed+全流程+降级文档+验算F1/W2分布 | crucible/文档 | 所有源代码(只读) | M1-M5 |

**并行**：M1/M2/M3 可三路并行；M4 等 Q1 + M2；M5 等 M3+M4；M6 最后。
