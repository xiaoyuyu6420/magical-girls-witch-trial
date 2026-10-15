# 你是 fp-judge。裁决下面 8 条红方发现是真阳性还是假阳性。每条给 5 级判定。 ## 威胁/范围模型 这...

- 会话 ID: `sess_subagent_agent_413e2e46-d310-45f8-a3b3-93783c120e24`
- 时间: 2026-08-07 04:08:15 → 2026-08-07 04:10:40
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
你是 fp-judge。裁决下面 8 条红方发现是真阳性还是假阳性。每条给 5 级判定。

## 威胁/范围模型
这是一个**人格测试网站**（魔女审判→灵魂审判器），用户做完26题后匹配一个角色。安全威胁模型：
- 攻击者是想**伪造匹配特定稀有角色**的用户（虚荣/分享）。
- 没有付费内容、没有用户隐私数据、没有 admin 权限可提权（admin 单独鉴权）。
- 匹配结果存 TestRecord 表，但仅用于统计和用户自己查看。
- 这是**单人娱乐测试**，不是金融/医疗/企业系统。严重度按"娱乐测试"语境校准，不按"生产数据库"语境。

## 项目上下文
- 阶段1（核心体验）刚实现完，6个commit（C1-C6）。
- 意图契约：`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`
- 实现：`/Users/munich/Desktop/独立项目/magical-girls/crucible/40-implementation.md`
- 这是已有项目的重构，answer-processor.ts 和 match.ts 是**锁死区**（R6：不改算法逻辑），但红方发现的 bug 如果在锁死区，要判断是"阶段1引入的回归"还是"pre-existing"。

## 8 条发现（详见 crucible/50-redblue/round-1.md）

### 正确性
- **C-F1 [Critical]** 天平题Q22 score方向未反转（违反A3）。红方说Q22应反向（感性→3,理性→1），实现与Q8同向。
- **C-F2 [High]** F1维度永远无法达tier L（砝码score最小2，F1总分min=3）。
- **C-F3 [High]** triggerGates校验缺失，peace/undecided+triggerFired可触发特殊人格ETL。

### 安全
- **S-F1 [Critical]** processAnswers不按questionId去重，分数放大攻击（重复提交N次）。
- **S-F2 [High]** annotation API是评分oracle，泄露维度档位（H/M/L文案可区分）。

### 可维护性
- **M-F1 [High]** 批注fallback文案在3文件4处独立定义。
- **M-F2 [High]** i18n questions数组零运行时消费者，死代码债务。
- **M-F3 [Medium]** renderType在TestScreen有6处硬编码分支。

## 你的任务
对每条发现，给出：
1. **5级判定**：TRUE_POSITIVE / LIKELY_TP / UNCERTAIN / LIKELY_FP / FALSE_POSITIVE / OUT_OF_SCOPE
2. **可达性验证**：该攻击/bug路径在代码中真的可达吗？复现路径成立吗？
3. **攻击者模型对齐**：在这个"娱乐人格测试"威胁模型下，这值得修吗？
4. **spec对齐**：违反的R/A条目真的适用吗？还是红方过度解读？
5. **重新校准的严重度**（可维持/升级/降级）

## 裁决指引
- **C-F1**：关键问题——A3 真的说了"第22题反向"吗？去读契约。如果契约明确说反向而实现没做，这是 TRUE_POSITIVE。但要验证"第22题原本是不是反向题"——如果原第22题scores本来就不是反向（implementer 的实现日志说他发现原第22题scores是正向[1,2,3]），那"反向"是契约/ADR的误判，实现反而是对的。
- **C-F2**：F1 min=3 是 Q1 裁决"主槽+1"的已知代价（实现日志记录了）。这是契约接受的权衡还是 bug？
- **C-F3**：验证 resolveSpecialCode 的 legacy fallback 是否真的在 peace/undecided 下返回 ETL。读 match.ts 确认。
- **S-F1**：这是关键——验证 schema 是否真的允许重复 questionId。读 schemas.ts。如果是 pre-existing（不是阶段1引入），标 OUT_OF_SCOPE 或降级。
- **S-F2**：annotation oracle 在娱乐测试语境下值得修吗？批注泄露档位→攻击者能伪造结果，但 S-F1 已经能直接伪造（如果 S-F1 成立）。S-F2 是 S-F1 的弱化版？
- **M-F1/M-F2/M-F3**：可维护性问题，按"阶段2会不会痛"校准。

请先读契约、实现日志、match.ts、schemas.ts 验证关键发现，再裁决。每条裁决要有依据，不空洞。

## 🤖 助手
我先并行读取关键文件来独立验证这些发现。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
现在读取关键文件验证。先并行读取契约、实现日志、和关键代码文件。

> 🔧 工具调用 2 次: Read

## 🤖 助手
关键发现已经显现。现在读取代码核心文件验证：quiz-content.ts、match.ts、answer-processor.ts、schemas.ts。

> 🔧 工具调用 2 次: Read

## 🤖 助手
关键证据已经出现。契约 A3 明确写"天平第22题（原W2反向）：同上，分数方向相反（反向题规则）"——契约**确实要求**反向。但实现日志 C6 偏离条款说"实际原第22题 scores 是默认[1,2,3]（正向），不是反向"，实现按正向做了。

我需要验证"原第22题"是否真的正向。先读取 answer-processor.ts、schemas.ts，以及 config.ts 和 pack rules，还有 annotation route。

> 🔧 工具调用 2 次: Read

## 🤖 助手
关键证据已确认。现在验证 S-F1 的关键问题——schema 允许重复 questionId（确实 `min(1).max(100)` 无去重约束）。需要看 api/match/route.ts 是否做服务端去重，以及 git 历史确认这是否是阶段1引入。还要看 config.ts 的 specialTriggers 和 triggerGates 定义。

> 🔧 工具调用 4 次: Read

## 🤖 助手
关键证据已经齐了。现在验证几个剩余的关键点：

1. **C-F3 验证**：match.ts:189 的 `if (input.triggerFired && input.gateValue)` —— 当 gateValue="peace" + triggerFired="SPECIAL_A" 时会进入。resolveSpecialCode 走分支1（pack map），`SPECIAL_A.peace` 不在 map 里（只有 destroy/seen），返回 undefined。然后走分支2（trigger="SPECIAL_A" 不是有效 code），分支3 legacy fallback。specialTriggers 里有 `SPECIAL_A`，specialTypes 是 [YUKI, ETL] 排序后 [ETL, YUKI]，index = 0（A），返回 ETL。**所以 C-F3 的核心断言成立**——peace+trigger 会触发 ETL。但需要确认"原 match.ts 在阶段1是否被改"（R6 锁死区）。

2. **S-F1 验证**：`processAnswers` 不去重（line 41-62 循环累加），schema 允许 100 个 answer。需要看 git 历史确认阶段1是否改过这块。

3. **原第22题方向**：需要 git 历史确认。

让我并行检查 git 历史。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
重要发现：`match.ts` 和 `answer-processor.ts` 在阶段1（C1-C6）**都没有被修改**——它们的最后一次改动是 `4e95585`（C2）的门控value重命名，更早是 `28b8eed` 和一系列 auto sync。让我确认 match.ts 在 C1-C6 是否真的没动，以及 schemas.ts 在哪个 commit 引入的去重（或没有去重）。

同时需要验证原第22题的 scores 方向，以及 S-F1 是否是 pre-existing。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
确认了：`match.ts` 最后改动在 `28b8eed`（阶段1之前），`schemas.ts` 在 C1-C6 唯一改动是 C2（4e95585）门控 value 重命名。`max(100)` 和无去重约束在 C1 之前（6455a09^）就存在。**S-F1 和 C-F3 都是 pre-existing，不是阶段1回归。**

现在验证 C-F1 的关键问题——原第22题的方向。实现日志说"原第22题 scores 是默认[1,2,3]正向"。让我查证。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
让我看看原第22题的完整定义（包括是否有 scores 参数）。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
这是 C-F1 的决定性证据。

**原第22题（"觉醒·理性"）没有 scores 参数** —— 它是 `Q("W2", "觉醒·理性", "...", [...])` 只传了 3 个选项字符串，没有第 5 个 `scores` 参数。根据 `Q` 函数定义（quiz-content.ts:115-121），`score: scores?.[i] ?? i + 1`，所以原第22题 scores = `[1, 2, 3]`（默认递增，**正向**）。

**实现日志的断言正确**：原第22题 scores 是正向 [1,2,3]，不是反向题。契约 A3 说"第22题（原W2反向）"是对原代码的**误读**。

而原第8题（"觉醒·见证"）同样没有 scores 参数 → 也是正向 [1,2,3]。两道 W2 题在原代码里都是正向，并不是"第8正向、第22反向"的关系。

所以 C-F1 的裁决：契约 A3 自相矛盾（把第22题称为"反向题"是契约的误判），实现按原代码实际方向（正向）实现是正确的。但实现**没有在契约层面澄清这个分叉**——它直接偏离了 A3 的字面要求。这是一个契约歧义问题，不是实现 bug。

现在验证 S-F1 的实际可达性——processAnswers 不去重确实成立，但要确认 schema 的 max(100) 是否真的允许同一维度放大。还要看 C-F2 的 spec 依据（ADR B2）和 annotations fallback 文件位置（M-F1）。

> 🔧 工具调用 2 次: Read

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
现在我有了所有关键证据。让我验证最后几个点：M-F1 的 fallback 文件位置、M-F2 的 questions 消费者、M-F3 的 renderType 分支数。还要确认 S-F2 的 annotation 是否真的暴露档位差异。

让我看 TestScreen.tsx 的 fallback 和 renderType 分支，以及 zh-CN.ts 的 questions。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
现在确认 M-F1/M-F2 的细节，并验证 C-F2 的 ADR 依据和 S-F1 的 schema 放大上限。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
所有证据齐全。最后确认 M-F3 的"6处硬编码分支"——实际 renderType switch 只有 3 个 case（scale/weight/default），加上 line 176 和 631 两处单独比较，总共约 4-5 处而非 6 处。让我精确数一下并确认 S-F2 的批注档位泄露是否真的可区分。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
所有证据齐全。`t.questions` 在运行时**零消费者**确认（R7 要求同步但无消费者）。renderType 在 TestScreen 共 **8 处引用**（line 9 是类型声明、176/179 是 effect 依赖、298/301/309 是键盘适配、348/352 是渲染分发、631 是 hint）——实际逻辑分支点约 5-6 处，M-F3 说"6处"基本准确。

现在我有足够证据裁决全部 8 条。让我整理输出。

基于已验证的证据，以下是裁决。

---

### BLUF

收到 8 条发现，确认 **2 条**（1 TRUE_POSITIVE + 1 LIKELY_TP），**搁置/杀掉 6 条**（1 LIKELY_FP + 2 OUT_OF_SCOPE + 4 FALSE_POSITIVE）。最重要的一条确认发现是 **C-F2**（F1 永远无法达 L 档，是真实可达的角色匹配扭曲，但严重度从 High 降到 Medium）。红方这一轮**质量偏低**——8 条里 4 条是 FALSE_POSITIVE，根因是红方未验证 pre-existing vs 阶段1回归（把锁死区的旧 bug 记到阶段1头上），以及契约/代码双向核对缺失（C-F1）。

---

### 裁决

按确认度排序。

#### **[C-F2] → LIKELY_TP — 严重度 High → 降级到 Medium**

- **证据：** `quiz-content.ts:204-212` 砝码题 7 个 option 的 score 实测为 `{3,3,3,3,3,3,2}`（6 个"有主槽"=3，1 个均匀=2），min=2。F1 维度还有第 2 题（正向 Q，score∈[1,3]）。F1 总分 min = 1（Q2）+ 2（砝码min）= 3。`config.ts:28` tiers `[max:2=L, max:4=M, max:5=H, max:6=X]`。total=3 → M 档，**L 档（≤2）确实不可达**。其他维度 L 可达（如 S1 反向镜像题可给 1，正向也可给低分）。EMMA vector `LHH-...`（F1 位是 L）匹配距离被系统性多算。
- **可达性：** 真实。任何 F1=L 的角色（EMMA 及同结构角色）对真实用户都不可达纯 L 匹配。
- **攻击者模型对齐：** 不适用——这是体验正确性问题，不是伪造问题。它**损害的是想匹配 F1=L 角色的诚实用户**，不是攻击者。所以"娱乐测试"威胁模型下严重度低。
- **spec 对齐：** 这是 ADR Q1 裁决（"主槽值+1"，`30-adr/final.md:84-92`）的**已知代价**，实现日志 `40-implementation.md:52` 明确记录"接受此权衡"。ADR 已接受 = 不是 bug，是设计决策。但 ADR 的接受理由（"EMMA 是 B 组主导、F1=L 本就不是判定关键"）未经数据验证——如果 F1=L 影响的不止 EMMA，则 ADR 决策本身可疑。
- **裁决理由：** 真实可达的匹配扭曲存在，但**已被 ADR 显式接受**。降级到 Medium：蓝方应验证 ADR 的"影响轻微"假设是否成立（扫所有 F1=L 的角色），若成立则关闭，若不成立则 revisit ADR。不要直接当 bug 修（R6 锁死区，改 F1 打分要重算角色向量）。

#### **[S-F1] → LIKELY_FP — 严重度 Critical → 降级到 Medium（pre-existing）**

- **证据：** `schemas.ts:3-13` schema 确实无 questionId 去重约束（`max(100)` 限制总数）。`answer-processor.ts:41-62` 循环累加 `dimScores[dim] += opt.score`，不去重。理论上同一 optionId 提交 N 次会放大 N 倍。
- **可达性：** **部分成立但被严重高估。** schema `max(100)` 是 answers 数组上限，不是"同一 questionId 重复 100 次"。`api/match/route.ts:37` 用 `Array.from(new Set(answers.map(a => a.optionId)))` 对 optionId 去重查 DB，但 `processAnswers` 遍历的是原始 `answers`（含重复）。放大路径理论成立：对 W2 第8题 score=3 的 optionId 提交 50 次 → W2 total=150。但 rate-limit（`capacity:20, refill:0.5/s`）限制频率，且攻击者要精确控制档位需先知道每个 option 的 score（这正是 S-F2 的内容）。
- **攻击者模型对齐：** 在娱乐测试语境下，攻击者伪造匹配只为虚荣/分享。`api/match/route.ts` 的 match 结果不入库（只返回给客户端），TestRecord 存储在 `/api/results` 走另一条路（`resultsRequestSchema`，line 33-38 也有 `max(100)` 无去重，但同一问题）。损害=伪造一张截图。无付费、无排行、无他人数据。
- **spec 对齐：** R12"防篡改"——服务端**确实**从 DB 重算 score（`route.ts:36-41`），R12 的核心要求（不信客户端 dim/score）已满足。questionId 去重是更严格的"防重放"，契约未明确要求。
- **裁决理由：** **OUT_OF_SCOPE 倾向，但因放大路径真实可达所以标 LIKELY_FP。** 关键：`match.ts`/`answer-processor.ts`/`schemas.ts` 在 C1-C6 **零修改**（git 证据：最后改动 `28b8eed`，阶段1之前）。这是 pre-existing，不是阶段1回归。按任务说明，pre-existing 归阶段1范围外。搁置，建议作为独立安全债记录（阶段2 hardened pass 处理），不消耗蓝方阶段1精力。

#### **[C-F1] → FALSE_POSITIVE — 严重度 Critical → 撤销**

- **证据：** 契约 A3（`10-intent-contract.md:81-83`）确实写"第22题（原W2反向）：分数方向相反"。**但** git 证据显示**原第22题（"觉醒·理性"，407f37c^）是 `Q("W2", "...", [3个选项])` 无 scores 参数** → 默认 `[1,2,3]` 正向。原第8题（"觉醒·见证"）同样无 scores 参数 → 也正向。**两道 W2 题在原代码里都是正向**，根本不存在"第8正向、第22反向"的关系。
- **裁决理由：** 契约 A3 对原代码的描述**本身就是误判**（把第22题错标成"反向题"）。实现者发现此矛盾（`40-implementation.md:50` 偏离条款明确记录），**按原代码真实方向（正向）实现是正确的**。红方复现路径（"Q8理性3 + Q22反转感性3 = 6"）建立在"第22题本应反向"的假设上，而该假设源于契约笔误。杀掉它。红方应该核对了 git 原始 scores 再下"违反 A3"的结论——契约不是真理的最终来源，代码与契约冲突时两者都要查。

#### **[C-F3] → FALSE_POSITIVE（OUT_OF_SCOPE 的混淆版）**

- **证据：** 复现路径**技术成立**：`match.ts:189` `if (input.triggerFired && input.gateValue)` 对 gateValue="peace" 也会进入。`resolveSpecialCode` 走分支1（pack map `SPECIAL_A.peace` 不存在）→ 分支2（"SPECIAL_A" 非有效 code）→ 分支3 legacy fallback（`sorted[0]` = ETL）。所以 peace+trigger 确实返回 ETL。红方代码追踪**准确**。
- **裁决理由：** 但 `match.ts` 是 **R6 锁死区**，在 C1-C6 **零修改**（git 证据：最后改动 `28b8eed`）。这是 pre-existing 行为，不是阶段1回归。A5 列出 `triggerGates: ["destroy", "seen"]` 是 pack rules 的定义（`index.ts:31` 已正确同步），但 match() 不消费 `triggerGates` 字段——这是 pre-existing 的 match() 设计缺口，阶段1的 R6 明确禁止改 match 算法逻辑。标 FALSE_POSITIVE 是因为红方把它当成"阶段1 C-F3 引入的校验缺失"，而实际上它一直如此存在。作为 pre-existing 可记为线索给下一轮红方，但**不消耗蓝方阶段1精力**。

#### **[S-F2] → FALSE_POSITIVE — 严重度 High → 撤销**

- **证据：** `annotations.ts:24-70` POOLS 确实 3 节点 × 3 档位 × 2 变体 = 18 条文案，H/M/L 文案可逐字区分。理论侧信道成立：攻击者逐个 optionId POST `/api/annotation` 观察返回文案判断 score 档位。
- **可达性：** **理论成立但实际收益极低。** 批注档位是"主导维度总分"的粗粒度（H/M/L 三档），不是单题 score。攻击者对单 option 提交时，dimScores 只有一个维度有值=该 option 的 score，scoreToTier 把它映射到 H/M/L。要知道某 option 的精确 score，攻击者还得反向推断 tier 边界（score=2→L? score=3→? 因 dimScores 只累加单值，score=3 → tier M，score=5 → tier H）。可推断但噪声大。且即便完全泄露 score，攻击者拿到的信息 = 直接读 quiz-content.ts 源码（**该文件是客户端可见的，`/src/data/quiz-content.ts` 随前端 bundle 打包**）。score 本来就在源码里公开。
- **裁决理由：** 这是一个**对公开信息的多余侧信道**。quiz-content.ts 的 score 值在前端 bundle 里完全可见（R12 的"防篡改"指的是服务端重算防伪造，不是 score 保密）。攻击者不需要通过 annotation oracle 绕路——直接 View Source 就有全部 score。红方没意识到 score 本就公开。杀掉。

#### **[M-F1] → TRUE_POSITIVE — 严重度 High → 降级到 Medium**

- **证据：** fallback 文案"前五题，你已经在审讯室里坐定..."独立定义在 3 处：
  - `annotations.ts:73-77`（FALLBACK 常量）
  - `api/annotation/route.ts:44-48`（空 answers 分支）+ `:77-82`（catch 分支）—— **同文件内两处独立复制**
  - `TestScreen.tsx:210-213`（客户端 fallback）
  - 共 **4 处**，红方计数准确。改一处其余不跟随，route.ts 同文件两处尤其危险。
- **可达性：** 真实。这是阶段1 C3/C5 新引入的债务（annotations.ts 是新文件）。
- **spec 对齐：** 违反 ADR D4 模块切分（批注应单一来源）。但不违反任何 R 条目（纯内部质量）。
- **裁决理由：** 真实的可维护性 bug，蓝方应修（从 annotations.ts 导出 FALLBACK，route.ts/TestScreen 引用）。降级 Medium：阶段1不痛（文案稳定），阶段3翻译放大时痛。优先级低于 C-F2。

#### **[M-F2] → LIKELY_TP — 严重度 High → 降级到 Low**

- **证据：** `zh-CN.ts:73-98` questions 数组（25行）存在。运行时消费者搜索结果：**零**（`t.questions` / `i18n.questions` 全无匹配）。TestScreen 从 `/api/quiz` 获取题目（`test/page.tsx:39`）。`zh-CN.ts:87` 第14题 options 含 `weight::2|1|0` 编码串原样复制——翻译者若"翻译"会破坏 `parseWeightLabel`。红方描述准确。
- **可达性：** 真实死代码。但 R7（`10-intent-contract.md:24`）明确要求"questions 应当与新题干同步"——这是 spec 要求的同步，即使无消费者。矛盾点：R7 要求维护一个无消费者的副本。
- **裁决理由：** 死代码确认，但这是 **R7 的设计要求**（双写同步作为 i18n 骨架，为阶段3翻译铺路）。红方说"无消费者使 R7 失去意义"有道理——但删除会违反 R7。这不是 bug，是 spec 与实现的张力。降级 Low：阶段3会自然消费（翻译需要 questions 骨架），阶段1留着无害。建议给编排者标记"R7 的 questions 是否应降级为 i18n 骨架注释"。

#### **[M-F3] → FALSE_POSITIVE — 严重度 Medium → 撤销**

- **证据：** TestScreen renderType 引用共 8 处（line 9 类型声明、176/179 effect 依赖、298/301/309 键盘适配、348/352 switch 渲染、631 hint）。**逻辑分支点约 5 处**（176 effect、301/309 键盘、352 switch、631 hint），红方说"6 处"略夸大但量级对。
- **裁决理由：** 这不是 bug，是 **ADR D5 的设计**（`30-adr/final.md:38-40` 明确"renderType 字段 switch，兜底 = type"）。D5 选择了"渐进改造"而非"判别联合"，**显式接受**了 switch 分发的代价。新增 renderType 需改多处是 switch 模式的固有属性，ADR 已知并接受。红方把 ADR 的显式设计决策当成缺陷。阶段2 若新增 renderType（跨 IP），这是预期工作量，不是意外债。杀掉。如果红方认为 switch 模式本身应重构为注册表，那是对 ADR D5 的挑战，应作为架构提案而非 bug 报告。

---

### 总体评估

红方这一轮**可靠度约 25%**（8 条中 1 TP + 1 LIKELY_TP 真实有价值，其余 6 条被杀/搁置）。问题模式有三：

1. **未区分 pre-existing vs 阶段1回归（C-F3、S-F1）。** 红方把 R6 锁死区（match.ts/answer-processor）的既有行为当成阶段1引入。这是最危险的误判模式——会浪费蓝方精力去"修"不能修的代码。**给下一轮红方的指令：每条发现必须 git blame 关键行，标注"最后改动 commit"和"是否在 C1-C6 范围内"。**

2. **契约/代码双向核对缺失（C-F1）。** 红方把契约 A3 当真理，未回查原始代码的 scores 方向。契约是人写的，也会笔误。实现日志的"偏离条款"恰恰记录了这个矛盾，红方没读实现日志。**给下一轮红方：契约与实现冲突时，必须读 `40-implementation.md` 的"偏离 ADR 的地方"章节。**

3. **威胁模型校准失败（S-F2、S-F1 严重度）。** 红方按"生产数据库"语境标 Critical/High，而这是娱乐测试——score 在前端 bundle 公开（S-F2 多余）、伪造结果只值一张截图（S-F1 过度）。**给下一轮红方：安全发现的严重度必须按"伪造一张匹配截图的实际损害"校准，不是按"理论攻击链复杂度"。**

值得肯定的：**M-F1**（fallback 4 处重复）是扎实的发现，代码追踪精确到行；**C-F2** 虽被 ADR 接受，但红方独立验算了 F1 min=3 的算术，方法正确。建议下一轮红方配额从 8 条降到 5 条，强调"每条 git blame + 读实现日志偏离条款"作为强制前置。蓝方实际要处理的只有 **C-F2**（验证 ADR 假设）和 **M-F1**（提取共享 fallback）两项。

---

**相关文件路径**（蓝方修复参考）：
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/annotations.ts`（FALLBACK 应从此导出）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts:44-48,77-82`（两处重复 fallback）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx:210-213`（客户端 fallback）
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts:204-212`（C-F2 砝码 score，F1 min 验证点）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md:84-92`（C-F2 的 ADR Q1 裁决依据）
