# 我在调查 /Users/munich/Desktop/独立项目/magical-girls 项目的"打分与测试逻辑...

- 会话 ID: `sess_subagent_agent_c775640c-564e-4f33-8348-cc630aa91a9b`
- 时间: 2026-08-10 18:34:54 → 2026-08-10 18:36:21
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 10
- 归档状态: 未归档

---

## 👤 用户
我在调查 /Users/munich/Desktop/独立项目/magical-girls 项目的"打分与测试逻辑"——这是一个魔法少女主题的测验应用，我需要搞清楚"测的是什么、怎么打分、结果怎么算出来"。请阅读并报告（very thorough 广度）：

1. 读 src/data/quiz-content.scores.test.ts——这是测试文件，会暴露打分逻辑的核心。报告它测的是什么、期望值是什么、揭示了什么打分规则。
2. 读 src/data/quiz-content.ts 里和打分相关的部分——每个题目/选项是否带"向量"或"权重"？向量的维度是什么（比如代表不同角色/人格维度）？
3. 读 src/content/packs/madoka/config.ts——这个 IP pack 怎么定义角色？角色和打分向量怎么对应？
4. 找结果计算逻辑：题目选项的向量 → 累加/加权 → 匹配到某个角色/结果。这个 pipeline 在哪个文件？
5. git status 显示最近的 commit 有"跨IP扩展"、"小圆接入"、"全局匹配"、"HOMURA向量撞车"——这说明打分是"跨多个 IP 角色"的全局匹配。搞清楚这个机制：用户答题 → 得到一个向量 → 在所有 IP 的所有角色里找最近邻？

请用中文报告，BLUF 先行。核心产出：
- 一句话说清"这个测验测的是什么"（人格维度？角色匹配？价值观？）
- 打分向量有几个维度，各代表什么
- 结果是怎么从答题映射出来的（算法）
- 关键文件路径
不贴大段代码，只贴向量定义、匹配算法签名、测试期望值。不要做任何修改。

## 🤖 助手
我已经掌握了测试文件和 madoka 的 config。现在让我阅读 quiz-content.ts 的核心部分并探索目录结构。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
现在让我读取引擎 `config`（维度和权重）、匹配算法以及跨 IP 注册表。

> 🔧 工具调用 4 次: Read

## 🤖 助手
让我读取剩余的部分：`witch-trial` 包规则（包含 `gate bonus` + `special triggers`）、答案处理器以及匹配测试，以完善整个流程。

> 🔧 工具调用 4 次: Read

## 🤖 助手
让我确认一下 API route 中的跨 IP 全局匹配机制，并检查是否存在 madoka pack index。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
匹配路径会读取数据库中的所有 `personalityType`，因此跨 IP 匹配需要一个 seed。我来检查一下 seed 脚本和数据库架构，看看类型（包括 `ipCode`）是如何植入到数据库中的。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
我来读取 seed 和 prisma schema，以充分确认跨 IP 合并的逻辑。

> 🔧 工具调用 2 次: Read

## 🤖 助手
调查完成。以下报告。

---

## BLUF（一句话）

这个测验测的是**用户在 12 个心理维度（"评判/执念/羁绊/自持"四象限）上的倾向强度**，把答题结果压缩成一个 12 维档位向量，再用**加权曼哈顿距离**在**所有已注册 IP 的全部角色**里做最近邻匹配——所以本质是"跨 IP 的角色匹配测验"，维度是心理学人格轴，不是价值观。

---

## 1. 打分向量：12 维，分 4 组

引擎配置单一权威源在 `src/content/packs/witch-trial/config.ts`（madoka 没有自己的引擎 pack，只有角色内容）。向量按 3 维一组写成 4 段，如 `"LHH-LLM-HHH-LLL"`，字符档位 `L=0 / M=1 / H=2 / X=3`。

| 组 (model) | modelName | 维度 | 方向 (L→H) |
|---|---|---|---|
| S 评判 | 评判 | S1 严厉/宽容，S2 直觉/理性，S3 宽恕/惩戒 | L=宽容→H=严苛 等 |
| F 执念 | 执念 | F1 复仇/释怀，F2 绝望/韧性，F3 执念/放下 | L=无复仇心→H=强烈复仇 等 |
| B 羁绊 | 羁绊 | B1 信任/防备，B2 背叛敏感度，B3 自我牺牲 | L=封闭→H=开放 等 |
| W 自持 | 自持 | W1 情绪压抑，W2 理性维系，W3 本能释放 | L=不压抑→H=强力压抑 等 |

**维度权重** (`WEIGHTS`)：`S1=1.5, F1=1.5, B3=1.5, W3=1.5`，其余 8 个 = 1.0。这四个高权重维度在距离计算里更"贵"。

---

## 2. 题目与选项如何带分（`src/data/quiz-content.ts`）

26 题，三种打分语义（`type`）+ 三种渲染（`renderType`）解耦：

- **normal 题（22 题）**：每个选项 `score` 在 1..3。`Q(...)` 工厂默认 `[1,2,3]`，反向题传入倒序数组，如 `Q("B1", ..., [3,2,1])`、`Q("W1", ..., [2,1,3])`、`Q("F2", "...崩塌", [2,3,1])`。
- **scale 天平题（Q8/Q22，挂 W2）**：2 选项硬编码 `score: 1` / `score: 3`（情感 vs 理性二分）。
- **weight 砝码题（Q14，挂 F1）**：7 个合法组合 `label="weight::a|b|c"`，按主槽位置映射 score，分布 `{1,2,2,2,2,3,3}`，注释里明确"主槽(值=2)在 A→3，在 B/C→2，均匀(1,1,1)→1"。
- **gate 门控题（Q18）**：选项带 `value`（`destroy/seen/peace/undecided`），不打分，但给维度加分（见下）。
- **trigger 触发题（Q19）**：选项带 `trigger` token（如 `SPECIAL_A`），用于解锁特殊角色。

每题的 `dim` 字段决定它的分累加到哪个向量维度。

---

## 3. 结果计算 pipeline

文件：`src/lib/answer-processor.ts` → `src/app/api/match/route.ts` → `src/lib/match.ts`

**步骤 A — 答案→维度总分**（`processAnswers`，服务端从 DB 重算，防客户端篡改）：
按 `question.dim` 把选项 `score` 累加成 `dimScores: Record<dim, number>`；同时抽出 `gateValue` 和 `triggerFired`。

**步骤 B — 匹配**（`match(input, types, pack)`，签名在第 172 行）：

```
match(input: { dimScores, gateValue?, triggerFired? },
      types: PersonalityTypeInput[],
      pack: QuizPack): MatchResult
```

1. **特殊触发优先**：若 `triggerFired + gateValue` 命中 `pack.rules.specialTriggers`（`SPECIAL_A.destroy→YUKI`、`SPECIAL_A.seen→ETL` 等），直接返回该特殊角色，`similarity=100`。
2. **门控加分** `applyGateBonus`：`peace→{S2:+1}`、`undecided→{W1:+1}`（封顶 6）。
3. **分数转档位** `scoreToTier(total)`（`ALGO_CONFIG.tiers`）：
   - 总分 ≤2 → L(0)；≤4 → M(1)；≤5 → H(2)；≤6 → X(3)
   - 即每个维度的总分（通常 2 道题相加，范围 2..6）映射到 0..3
4. **构造用户向量** `buildUserValues` → `formatVector` → 如 `"LHH-LLM-HHH-LLL"`。
5. **加权曼哈顿最近邻** `weightedManhattan(user, tpl) = Σ weights[i]·|a[i]-b[i]|`，对每个常规角色（`special=false` 且 `group≠fallback`）算距离，升序排序。
6. **相似度** `similarity = round((1 - dist/maxDist)·100·10)/10`，`maxDist = Σ weights[i]·3`。
7. **边界检查**（`algo.delta=3`，`algo.threshold=40`）：若 `top1.sim - top2.sim < delta` 且 `top1.sim < threshold` → 回退到兜底角色 `UNSET`（"未定之魂"，向量 `MMM-MMM-MMM-MMM`）；若仅差 `<delta` 但相似度够高 → 标记 `borderType=true` 仍返回 top1。
8. 结果带 `top3`、`userVector`、`templateVector`、`ipCode`（角色作品归属）。

---

## 4. 跨 IP 全局匹配机制（核心）

**关键发现：madoka 没有 engine pack，只有角色 seed。** `src/pack/load.ts` 里 `PACKS` 只注册了 `witch-trial`——引擎（维度/权重/算法/门控规则）全用 witch-trial 作为单一权威源。小圆只贡献角色。

**全局匹配的实现**（`prisma/seed.ts` + `src/app/api/match/route.ts`）：
- seed 把 `PERSONALITY_TYPES`（16 个 witch-trial 角色）标 `ipCode="witch-trial"`，`MADOKA_TYPES`（5 个小圆角色）标 `ipCode="madoka"`，**合并成 `allTypes`（21 个）一起 upsert 进 DB 的 `PersonalityType` 表**。
- `/api/match/route.ts` 第 52 行：`match({...}, await db.personalityType.findMany())` —— 直接取**全表所有角色**传给 `match()`，所以最近邻是在 **witch-trial 16 + madoka 5 = 21 个角色的并集**上做的，不分组、不按 IP 隔离。
- 结果的 `ipCode` 透传到 `ResultScreen`，由 `ip-registry.ts` 的 `getIpMeta(ipCode)` 查作品标题（"魔法少女小圆"）和 `workIntro`，显示"来自《XX》"。

**小圆角色向量**（`src/content/packs/madoka/config.ts`，按通用 12 维主观标定）：
- MADOKA 鹿目圆: `LLH-LLH-HLH-LLH`（B 主导，羁绊组）
- HOMURA 晓美焰: `HHL-HLH-LHH-HHH`（F 主导，执念组）
- SAYAKA 美树沙耶香: `HML-MHH-HHH-LHH`
- KYOKO 佐仓杏子: `MHL-MMH-LMH-MMH`
- MAMI 巴麻美: `HMM-LHM-HHL-HHL`

最近 commit `5fde0e1 fix(跨IP): HOMURA向量撞车`——HOMURA 当前向量 `HHL-HLH-LHH-HHH`（4 段里有 3 段以 H 结尾、S 段 HHL），是改过避免与某个 witch-trial 角色向量距离过近导致匹配撞车。注释明确"向量按角色剧情设定主观标定（A4）"。

---

## 5. 测试期望值揭示的规则

**`src/data/quiz-content.scores.test.ts`**（4 个断言）：
1. 每个 normal 选项 `score ∈ [1,3]` —— 揭示打分尺度是 1/2/3 三档。
2. B1 正向"第一个没谈条件的善意"（高信任）= `score 3` —— 揭示 B1 正向题高分=信任（H=开放）。
3. S1 反向"我说到做到"（苛刻）= `score 3` —— 揭示反向题分数倒置：苛刻选项拿高分。
4. F2 反向"心里什么都没了"（绝望顶峰）= `score 3` —— 揭示 F2 反向题高分=易绝望。

**`src/lib/match.test.ts`**（关键期望）：
- `parseVector("LHH-LLM-HHH-LLL") === [0,2,2,0,0,1,2,2,2,0,0,0]`；未知字符默认 `1 (M)`。
- `scoreToTier`: 0-2→L, 3-4→M, 5→H, 6→X（确认是 4 档阈值映射）。
- 相同向量 `similarity=100`；全 L vs 全 X `similarity=0`。
- `gateValue="peace"` 给 S2 +1 能跨档（M→H）—— 验证门控加分会改变用户向量。
- `triggerFired="SPECIAL_A" + gateValue="destroy"→YUKI`、`seen→ETL`，`similarity=100`，且**没有 gateValue 时 trigger 不生效**（确认特殊角色必须双重命中）。

---

## 关键文件路径

| 角色 | 文件 |
|---|---|
| 引擎配置（12 维定义 + 权重 + 算法阈值） | `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/config.ts` |
| 引擎规则（gateBonus + specialTriggers） | `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/index.ts` |
| 题目 + 选项打分 + witch-trial 16 角色 | `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts` |
| 小圆 5 角色向量 | `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts` |
| **匹配算法（pipeline 主函数）** | `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts` |
| 答案→维度总分 | `/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts` |
| 匹配 API（DB 全表喂给 match） | `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/match/route.ts` |
| 跨 IP 作品元信息注册表 | `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/ip-registry.ts` |
| DB seed（合并 21 角色入库） | `/Users/munich/Desktop/独立项目/magical-girls/prisma/seed.ts` |
| 打分测试 | `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.scores.test.ts` |
| 匹配测试 | `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.test.ts` |
| Pack 类型契约 | `/Users/munich/Desktop/独立项目/magical-girls/src/pack/types.ts` |
| Prisma 模型（PersonalityType.ipCode） | `/Users/munich/Desktop/独立项目/magical-girls/prisma/schema.prisma`（第 48-63 行） |

未做任何修改。
