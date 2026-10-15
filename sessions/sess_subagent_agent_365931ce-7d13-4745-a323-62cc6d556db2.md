# 你是 red-team，从**正确性**维度攻击阶段1的实现。硬配额：至少报告 3 个真实问题，或明确说明为什么更...

- 会话 ID: `sess_subagent_agent_365931ce-7d13-4745-a323-62cc6d556db2`
- 时间: 2026-08-07 03:50:43 → 2026-08-07 04:07:36
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 26
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**正确性**维度攻击阶段1的实现。硬配额：至少报告 3 个真实问题，或明确说明为什么更少。

## 攻击目标
魔女审判→灵魂审判器 阶段1（核心体验）的实现。6个commit（C1-C6）已落地。

## 实现位置（必读）
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts` — 26题库（22题改写+3变奏题+门控+触发）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/config.ts` — 12维度改名
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/index.ts` — pack rules（门控value重命名）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/annotations.ts` — 批注模块
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts` — 服务端打分（锁死区，不该改但验证它没被破坏）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts` — 匹配算法（锁死区）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` — 答题页（renderType分发+变奏+批注）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/quiz/route.ts` — quiz API
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts` — 批注API
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx` — questions映射
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/schemas.ts` — zod校验

## 意图契约（判断"正确"的依据）
`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`
关键正确性要求：
- R1-R2：26题审判官逼问 + 三态剖白，每题3选项（normal题）
- R5-R6：维度改名不改 code/WEIGHTS/ALGO_CONFIG/角色vector/match算法
- R8-R9：批注不输出维度标签/角色/百分比
- R10-R11：天平2选一、砝码三槽总和=3
- A1：第8/14/22题替换，变奏题继续给原维度打分
- A5：门控value destroy/seen/peace/undecided，触发题在 destroy/seen 时出现
- 防篡改：客户端提交optionId，服务端从DB读score

## 攻击方向（正确性）
1. **打分链路完整性**：变奏题（scale/weight）的 score 是否正确流回 dimScores？砝码题7个option的score映射是否与F1方向一致？天平题score是否挂回W2？
2. **门控/触发逻辑**：value重命名后，触发题过滤逻辑（gateValue==="destroy"||"seen"）是否全覆盖？specialTriggers映射是否正确？有没有遗漏的旧value引用导致死链？
3. **批注API正确性**：processAnswers在批注API里被调用，它对变奏题option的处理是否正确（变奏题type=normal，会进默认累加分支）？
4. **题目数量/顺序**：26题总数是否保持？第8/14/22题替换后顺序对吗？批注插页不计入26题是否正确实现？
5. **i18n一致性**：zh-CN.ts 的 questions 数组与 quiz-content.ts 是否一致（特别是变奏题位置）？维度名同步了吗？
6. **边界情况**：砝码题用户如果选了不合法组合（前端绕过）？批注API被恶意调用（传超长answers）？localStorage恢复时卡在变奏题状态？
7. **测试覆盖**：现有测试是否真的覆盖了新逻辑？有没有测试通过但实际逻辑错的情况？

## 产出格式
每条发现：
- **标题**
- **具体影响**（用户能感知到什么 / 数据会怎么错）
- **复现路径**（步骤或代码路径）
- **spec缺口**（违反哪条 R/A 或暴露了契约未定义处）
- **严重度**（Critical/High/Medium/Low）

模糊警告不算发现。必须有具体影响+复现路径。开始攻击。

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
现在，让我进行最后一次验证——即对 annotation API 的输入验证是否存在缺失。

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
All key files read. All code paths traced. Numerical impact computed. Here is the report.

---

### BLUF
3 条已验证发现。最严重：天平题 Q22 的 score 方向未反转（spec A3 明确要求"分数方向相反"），导致 W2 维度对 2/4 种答题模式偏移 2 个档位，直接扭曲人格匹配结果。Spec 未被忠实地实现——打分链路有两处断裂。

### 最严重问题
天平题 Q22（第22题）score 方向与 Q8 完全相同，违反 spec A3"分数方向相反（反向题规则）"，W2 维度最多偏移 2 个 tier。

### 发现

- **[F1] 严重度：Critical — `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`:264-271**
  - **影响：** W2 维度（理性维系倾向）的打分被严重扭曲。Q8（正向）和 Q22（应为反向）都用相同的 score 映射：感性→1, 理性→3。对四种答题模式的影响如下：
    - 理性+感性：实际 total=4→M，应为 total=6→X，**偏移 2 档**
    - 理性+理性：实际 total=6→X，应为 total=4→M，**偏移 2 档**
    - 感性+感性：实际 total=2→L，应为 total=4→M，偏移 1 档
    - 感性+理性：实际 total=4→M，应为 total=2→L，偏移 1 档
    选"理性/感性"交叉回答的用户（最常见的非极端模式），W2 从 M 变成 X 或从 M 变成 L——完全翻转。这直接改变加权曼哈顿距离计算，导致错误的人格匹配。
  - **复现：** 用户在 Q8 选"把所有感觉关进盒子里"（score=3），在 Q22 选"被感情牵着走"（score=1）→ W2 total=4→tier M。正确应为 Q22 反转：感性→score=3，total=6→tier X。
  - **Spec 缺口？：** 是——spec A3 明确规定"天平第 22 题（原 W2 反向）：同上，**分数方向相反**（反向题规则）"，代码做了与 Q8 完全相同的方向。
  - **修复方向：** 将 Q22 的两个 option score 互换：感性 option→score:3, 理性 option→score:1。

- **[F2] 严重度：High — `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`:204-212**
  - **影响：** F1 维度（复仇/释怀倾向）永远无法达到 tier L。砝码题 7 个 option 的 score 只有 {2, 3}，加上 Q2（正向 F1）的 score {1,2,3}，F1 总分范围为 [3, 6]，不可能出现 0-2 分。经 scoreToTier 映射后，F1 只能是 M/H/X，永远不是 L。其他 11 个维度（总分范围 [2,6]）都能达到 L 档。这意味着：一个真心低复仇倾向的用户，F1 仍显示为 M（而非 L），其 userVector 中 F1 分量被人为抬高 1 档，加权曼哈顿距离计算产生偏差。例如匹配 EMMA（vector LHH-LLM-HHH-LLL，F1=L）时，该用户 F1 距离被多算 1.5（F1 weight=1.5），可能匹配到错误人格。
  - **复现：** 用户在 Q2 选最低复仇选项（score=1），在砝码题选均匀分配（score=2）→ F1 total=3→tier M。正确应为 F1 能达到 total=2→tier L（如原设计中 Q14 反向题 min score=1）。
  - **Spec 缺口？：** 是——spec A2 定义"每槽{0,1,2}总和=3"的合法组合包含 (0,0,3) 但被限制为每槽≤2；spec A3 说"三槽分配值直接作为 F1 的得分贡献"但实现映射为 score=主槽值+1，最小值 2 而非 1，导致 F1 分数域与其他维度不对称。
  - **修复方向：** 砝码题 score 重新映射：均匀分配(1,1,1)→score=1（而非 2），使 F1 总分范围与其它维度对齐为 [2,6]；或在 answer-processor 中对砝码题做 score-1 偏移。

- **[F3] 严重度：High — `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts`:139-166 + `/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts`:47-57**
  - **影响：** 当 gateValue 为 "peace" 或 "undecided"（不在 triggerGates=["destroy","seen"] 中）但 triggerFired 同时存在时，`resolveSpecialCode` 的 legacy fallback 路径（第 154-165 行）会错误地将 SPECIAL_A 解析为 ETL。经实测：`SPECIAL_A + peace → ETL`，`SPECIAL_A + undecided → ETL`。这意味着选择了"平静"或"未想好"的用户，如果恶意提交了触发题答案，会被匹配到特殊人格（不灭雪华），similarity=100。这破坏了 spec A5 的门控语义：triggerGates 限制触发题仅对 destroy/seen 路径生效。
  - **复现：** 构造请求：`{answers: [gate选项(value="peace"), trigger选项(trigger="SPECIAL_A")]}`。processAnswers 设置 gateValue="peace" + triggerFired="SPECIAL_A"。match() 进入特殊触发路径，resolveSpecialCode 走 legacy fallback → 返回 "ETL" → 用户被匹配为不灭雪华，similarity=100。
  - **Spec 缺口？：** 是——spec A5 定义 triggerGates=["destroy","seen"]，即触发题仅在这两个 gateValue 下生效。代码未在 match() 或 processAnswers 中校验 gateValue∈triggerGates，legacy fallback 绕过了 pack map 的空值保护。
  - **修复方向：** 在 match() 第 189 行的条件中加入 `&& pack.rules.triggerGates.includes(input.gateValue)`，或在 resolveSpecialCode 开头加此校验。

### Spec 覆盖检查

| Spec 需求 | 状态 | 说明 |
|---|---|---|
| R1-R2：26题审判官逼问+三态剖白 | ✓ | 题干和选项格式已改写，26题保持 |
| R5-R6：维度改名不改 code/WEIGHTS/ALGO/match | ✓ | config.ts code 不变，WEIGHTS/ALGO_CONFIG 未改，match.ts 算法未改 |
| R8-R9：批注不输出维度标签/角色/百分比 | ✓ | annotations.ts 文案池均为行为描写，无剧透信息 |
| R10：第8/22题为天平题 | ⚠ | 位置正确，但 Q22 score 方向违反 A3 |
| R11：第14题为砝码题，总和=3 | ⚠ | 7个合法组合覆盖，但 score 映射使 F1 无法达 tier L |
| A1：第8/14/22题替换，变奏题继续给原维度打分 | ⚠ | dim 挂回正确，但 Q22 反向打分缺失 |
| A3：天平 Q22 分数方向相反 | ✗ | **未实现**——Q22 score 与 Q8 同方向 |
| A5：门控 value 重命名 + triggerGates 校验 | ⚠ | value 重命名正确，但 triggerGates 校验在 match() 中缺失 |
| 防篡改：客户端提交 optionId，服务端从 DB 读 score | ✓ | quiz API 剥离 score，processAnswers 从 DB 读 |

### 值得追的线索（不计入 K）

- W2 维度因天平题只有 2 option（score 1/3，无 2），总分只能为 {2,4,6}，跳过了 tier H（total=5）。这不是 bug（spec 接受了 2-option 设计），但意味着 W2 的档位分辨率低于其他维度，值得在阶段 2 评估是否需要中间选项。
- annotation route 无 zod schema 校验 answers 数组长度（match route 有 `.max(100)`），可发送超大数组造成 DB 查询膨胀。属于安全/性能维度，不展开。

### 裁决
3 条真实发现已报告。正确性攻击面已充分挖掘：打分链路（Q22 反向、F1 下界）、门控/触发逻辑（triggerGates 校验缺失）均有 spec-vs-实现缺口。未发现更多同等严重度的问题。
