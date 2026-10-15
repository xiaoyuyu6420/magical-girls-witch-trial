# 你在调查 /Users/munich/Desktop/独立项目/magical-girls 这个 Next.js ...

- 会话 ID: `sess_subagent_agent_47dec96c-b531-4695-b23b-0331175a6962`
- 时间: 2026-08-27 09:38:36 → 2026-08-27 10:05:13
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 54
- 归档状态: 未归档

---

## 👤 用户
你在调查 /Users/munich/Desktop/独立项目/magical-girls 这个 Next.js 项目的 git 历史，任务是搞清楚"12 维向量匹配 + 跨 IP 角色库"的旧实现曾经有多完整，以便决定能否从 git 历史恢复。

背景：项目曾用 12 维向量（S1-F3-B1-W3）匹配 21 个角色（16 个 witch-trial 原创 + 5 个魔法少女小圆），后来被"POSTURE 三姿态 + 硬编码 5 角色"重构替换（当前 main 分支是这个新体系）。目标是恢复 12 维跨 IP 方案。

请用 git 命令调查（只读操作，不要修改任何文件）：
1. commit `397a2f1`（message: "feat(跨IP): 阶段2 小圆接入+全局匹配+合规声明"）——这个 commit 的完整改动内容。重点：
   - 当时的 `src/lib/match.ts` 完整实现（加权曼哈顿距离、gate/trigger 逻辑、FALLBACK）
   - 当时的 `src/app/api/results/route.ts`（怎么算用户向量、怎么匹配全部角色）
   - 当时的题库结构（题目 dim 标注、选项 score 怎么映射到 12 维）——看 `src/data/quiz-content.ts` 或 content/content.yaml 在那个 commit 的状态
   - "合规声明"是什么（disclaimer?）
2. 从 397a2f1 到当前 main 之间，是哪几个 commit 把 12 维改成 POSTURE 的？POSTURE 化的关键 commit 是哪个（改了什么：match.ts、quiz-content、schema）？改成 POSTURE 时 21 角色数据是被删除还是保留？
3. 找更早实现 12 维匹配的初始版本（搜 `weightedManhattan`、`parseVector`、`formatVector` 在 git log -S 中的引入 commit）
4. 旧版题目：git 历史里 content/content.yaml 或 quiz-content.ts 是否存在过带 dim（如 S1/F2）标注的 26 题版本？每个选项的 score 结构？当时 26 题是否就是现在的这 26 题（看题目标题是否一致，如 "Q1 · 晨光中的许愿"）？

输出要求：一份结论报告，说明
- 旧 12 维实现的完整程度（引擎/API/题目/角色/合规声明各是否可恢复、在哪几个 commit、具体文件路径）
- POSTURE 重构删掉了什么、保留了什么（角色向量是否还在 DB 或代码里）
- 恢复 12 维跨 IP 方案的最佳路径（从哪些 commit 恢复什么）
- 风险点（比如题目 26 题内容和当年是否一致、维度权重/阈值配置在哪）

用中文回答，给出具体 commit hash、文件路径和关键代码结构。

## 🤖 助手
我先了解一下仓库的基本情况和相关 commit。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
最新 HEAD 是 `efc41a2`，而 POSTURE 重构应该更早。我并行调查几个关键点。



> 🔧 工具调用 4 次: Bash

## 🤖 助手
看一下完整历史和 POSTURE 相关搜索

> 🔧 工具调用 2 次: Bash

## 🤖 助手
让我检查当前 HEAD 的实际状态和 POSTURE 相关代码出现的位置

> 🔧 工具调用 3 次: Bash

## 🤖 助手
分支干净、无 stash。让我看看当前 main 的实际代码，确认是否存在 POSTURE 体系

> 🔧 工具调用 2 次: Bash

## 🤖 助手
当前 HEAD 的 match.ts 已经是 POSTURE 体系了。我需要找出 POSTURE 化发生在哪个 commit。跟踪 match.ts 的演进。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键发现：POSTURE 化打包在 `af26d9c` 里。看一下这个 commit 的完整改动。



> 🔧 工具调用 1 次: Bash

## 🤖 助手
`af26d9c` 是 POSTURE 化的关键 checkpoint commit。现在深入看 397a2f1 的完整实现和 af26d9c 的具体改动。



> 🔧 工具调用 1 次: Bash

## 🤖 助手
拿到了完整的 12 维 match.ts。接下来并行读取 397a2f1 的 API、出题数据、合规声明和相关配置。



> 🔧 工具调用 3 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
POSTURE 化时删掉了 MADOKA_TYPES 导入，schema 加了 posture 字段。继续看 match.ts 的转换和角色数据去向

> 🔧 工具调用 3 次: Bash

## 🤖 助手
POSTURE 化后 21 角色向量已全部清零。现在核对 content.yaml 结构、当前 POSTURE 实现细节、以及 old 题目标题演变。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
现在读取当前 POSTURE 的完整实现（match.ts、API、answer-processor）以及更早 12 维的初始版本

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

Here are the existing contents of your todo list:

[1. [in_progress] 调查 397a2f1 完整实现（match.ts/API/题库/合规声明）
2. [pending] 定位 12维→POSTURE 的转换 commit（af26d9c）及其具体改动
3. [pending] 确认 POSTURE 化时 21 角色数据是删除还是保留
4. [pending] 找更早 12 维初始版本（weightedManhattan 引入 commit）
5. [pending] 核对旧版 26 题 dim/选项 score 结构与题目标题一致性
6. [pending] 输出结论报告]

## 🤖 助手
我更新一下任务进展，并补齐几个关键调查点。



> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
POSTURE 时代的"Q1 · 晨光中的许愿"标题在 af26d9c 才出现。现在确认几个收尾问题：dev.db 是否入库、旧角色数据有没有备份、weight 题结构、POSTURE 时代的 weight 题编码

> 🔧 工具调用 2 次: Bash

## 🤖 助手
让我确认 397a2f1 到 af26d9c 之间的线性链条，以及当前题目的状态。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
现在确认几个关键点：af26d9c 里那些转储文件、docs 审计文档，以及当前 POSTURE 时代 keyUnlocked/SACRIFICE 语义引用的"HTML 审判庭"原型

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

Here are the existing contents of your todo list:

[1. [completed] 调查 397a2f1 完整实现（match.ts/API/题库/合规声明）
2. [completed] 定位 12维→POSTURE 的转换 commit（af26d9c）及其具体改动
3. [in_progress] 确认 POSTURE 化时 21 角色数据是删除还是保留
4. [completed] 找更早 12 维初始版本（weightedManhattan 引入 commit）
5. [in_progress] 核对旧版 26 题 dim/选项 score 结构与题目标题一致性
6. [pending] 输出结论报告]

## 🤖 助手
让我最后确认几个细节：当前 ip-registry、schema 现状，以及 POSTURE 时代角色定义与 i18n works 键。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
最后确认角色总数与本地 DB 现状，以及 5fde0e1 修正后的 HOMURA 向量。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
本地 dev.db 竟然还保留着全部 21 个 12 维向量角色！让我确认完整列表和题目数据。



> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

Here are the existing contents of your todo list:

[1. [completed] 调查 397a2f1 完整实现（match.ts/API/题库/合规声明）
2. [completed] 定位 12维→POSTURE 的转换 commit（af26d9c）及其具体改动
3. [in_progress] 确认 POSTURE 化时 21 角色数据是删除还是保留
4. [completed] 找更早 12 维初始版本（weightedManhattan 引入 commit）
5. [in_progress] 核对旧版 26 题 dim/选项 score 结构与题目标题一致性
6. [pending] 输出结论报告]

## 🤖 助手
DB 的题目是 POSTURE 题库，但角色表保留了 21+ 个旧角色。确认角色完整列表和关键脚本/测试保留情况。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
所有关键信息已收集完毕。本地 dev.db 是一个重要发现——旧 21 角色数据保留在数据库里。让我做最后两个确认。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
让我最后确认两个细节：当前 HEAD 的 witch-trial 引擎配置是否还在，以及 5fde0e1 的 i18n 是否含旧题翻译。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
所有关键信息已收集完毕。整理最终报告

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
补充最后两个验证：`src/pack/` 目录（引擎类型/加载器）是否仍存在，以及当前 match.test.ts 形态



> 🔧 工具调用 1 次: Bash

## 🤖 助手
全部调查完成。以下是结论报告。

---

# 调查结论报告：12 维向量匹配 + 跨 IP 角色库的旧实现完整度与恢复路径

## 一、核心结论（一句话版）

旧的 12 维方案**完整可恢复**。引擎、API、题库、21 角色、合规声明全部存在于 git 历史中，最佳恢复点是 `5fde0e1`（最后修复过的 12 维状态）。POSTURE 化只发生在**一个 commit**（`af26d9c`）里一次性替换，且**角色向量并没有被物理删除**——除了 git 历史里的完整备份外，本地 `prisma/dev.db` 里至今仍保留着全部 21 个角色的 12 维向量。

---

## 二、commit `397a2f1` 的完整实现（12 维时代）

`397a2f1`（`feat(跨IP): 阶段2 小圆接入+全局匹配+合规声明`）是 12 维 + 21 角色的**最终形态之一**，改动横跨引擎/API/题库/角色/合规声明：

### 2.1 `src/lib/match.ts`（完整 12 维匹配引擎）
包含全部核心函数（都已经实现且有单测）：
- `parseVector(v, expectedLen=12)` / `formatVector(values)` —— L/M/H/X ↔ 数值双向转换，按 3 位一组连字符分组
- `scoreToTier(total, pack)` —— 按 `pack.algo.tiers`（max 2/4/5/6 → 0/1/2/3）把维度总分转成 L/M/H/X 档
- `weightedManhattan(a, b, pack)` —— **加权曼哈顿距离**，权重来自 `pack.weights`
- `similarity(dist)` = `(1 - dist/maxDistance) * 100`，`maxDistance` = Σ(权重×3)
- **gate/trigger 逻辑**：`applyGateBonus`（门控命中给维度加 bonus，上限 6）；`resolveSpecialCode`（`triggerFired` + `gateValue` → 特殊人格，支持 `SPECIAL_A`/直接 code/legacy index 三套映射）
- **FALLBACK 逻辑**：`UNSET` 角色（group=fallback），在两种情况下返回：① no best match；② top3 差距 `< delta`（3）且 best < threshold（40）→ fallback + `borderType: true`；否则 `borderType=false` 正常返回
- `MatchResult` 带 `ipCode` 字段透传，`top3` 数组

### 2.2 `src/app/api/results/route.ts`
- 校验 `resultsRequestSchema` → 取 `answers` 的 optionIds → `db.option.findMany({ include: { question: { select: { id, dim, type } } } })`
- 调 `processAnswers(answers, options)` 服务端重算 `{ dimScores, gateValue, triggerFired }`（**不信任客户端**）
- `match({dimScores, gateValue, triggerFired}, await db.personalityType.findMany())` —— **findMany 直接取全部角色（21 个）**，全局比对
- 落 `testRecord` + 算 rank/percentile，返回 `{recordId, rank, totalParticipants, typeCount, typePercentage}`
- `src/app/api/match/route.ts` 同构，仅返回 match 结果

### 2.3 题库结构（`src/data/quiz-content.ts` at 397a2f1）
**26 题，且带 dim 标注**（这是关键）：每个维度出现 2 次（正向 12 题 + 反向 12 题）+ GATE + TRIGGER：
- dim 分布：S1/S2/S3/F1/F2/F3/B1/B2/B3/W1/W2/W3 **各 2 题**（正向 + 反向镜像）+ `GATE`（命运分歧）+ `TRIGGER`（最终抉择）= 26 题
- 题面风格是"审判官拷问"（C2 改造后），meta 是中文标题如"评判·觉醒"、"执念·称量"、"自持·天平"
- 选项 score 映射：普通题 `options.map((_, i) => score: i+1)`（即 1/2/3），反向题显式传 `[3,2,1]` 或 `[2,1,3]`
- 砝码题（第 14 题 F1）：7 个 option，label 编码 `weight::2|1|0`，score={1,2,3} 覆盖
- scale 题（第 8/21 题 W2）：`renderType: "scale"`
- GATE 题选项带 `value: "destroy"/"seen"/"peace"/"undecided"`；TRIGGER 题选项带 `trigger: "SPECIAL_A"`
- **注意**：题库在 `src/data/quiz-content.ts`（TS 文件），**不是 content.yaml**。`content/content.yaml` 直到 af26d9c 才被首次加入 git——即 POSTURE 时代才有 yaml 权威源

### 2.4 21 角色
- 16 个 witch-trial（`src/data/quiz-content.ts` `PERSONALITY_TYPES`）：EMMA/SHERRY/MIRIA（B）、HIRO/NANOKA（F）、HANNA/MERURU/COCO/NOAH（S）、MARGO/ANAN（W）、ALISA/LEIA（mix）、UNSET（fallback）、YUKI/ETL（special）
- 5 个小圆（`src/content/packs/madoka/config.ts` `MADOKA_TYPES`）：MADOKA/HOMURA/SAYAKA/KYOKO/MAMI，**全部 12 维向量**，全 `special=false`

### 2.5 合规声明（R9/A6）
- 新增 `src/components/DisclaimerFooter.tsx`（全站 footer，`disclaimer.footer` 文案）
- `ResultScreen` 底部 `disclaimer.result`（"角色版权归原作方所有"）
- `src/app/layout.tsx` 嵌入 footer
- i18n 四语言各加 2 条 key；另 `src/content/packs/ip-registry.ts` 提供跨 IP 元信息（title/workIntro），`ResultScreen` 用 `getIpMeta(result.ipCode)` 展示"来自《XX》"

---

## 三、12 维 → POSTURE 的转换过程和关键 commit

### 转换发生在【一个 commit】：
**`af26d9c`**（`chore: 清理临时脚本/截图/导出产物 + 视觉统一前的 checkpoint`，2026-08-15）

它表面是"清理 checkpoint"，实际是大杂烩（108 文件，+11024/-2601），**POSTURE 化全部打包在这一 commit 里**：
- `src/lib/match.ts`（389 行改动）：删除 parseVector/formatVector/weightedManhattan/similarity/gate/trigger/borderType，重写为**硬编码 5 角色 check 函数**（`CHARACTER_CHECKS`：homura_devil → madoka_god → sayaka_siren → kyoko_pragmatist → emma_truth 兜底恒真），匹配信号变为 `postureA/B/C + path(Q18) + keyUnlocked(Q19) + tendency(Q8/Q22)`
- `src/lib/answer-processor.ts`：dimScores 聚合 → `postureA/B/C` 聚合（weight 题按 `a*3/b*3/c*3`）
- `src/app/api/results/route.ts`：改为计算 posture，`match({postureA, postureB, postureC, path, keyUnlocked, tendency}, ...)`
- `prisma/schema.prisma`：PersonalityType 的 `vector/slogan/desc` 改 `@default("")`（保留列），新增 `prosecution/softlanding/tags`；Option 新增 `posture` 列
- `content/content.yaml` **首次建立**（1151 行脚本，POSTURE 26 题）+ `scripts/sync-content.ts`/`dump-content.ts`/`verify-rewrite.ts`
- `src/data/quiz-content.ts` 556 行重写：26 题改为 `NQ("Q1 · 晨光中的许愿", ...)` 日常情境体 + **5 角色硬编码**（homura_devil/madoka_god/sayaka_siren/kyoko_pragmatist/emma_truth，vector 全部 `""`）

### 两条关键时间线澄清
- 397a2f1 → af26d9c 之间只有 **1a2ba64**（docs）和 **5fde0e1**（fix），均保持 12 维
- unpopular 点：**目前 main（HEAD=efc41a2）没有任何一步 POSTURE 化重建独成一条线**，所以"有几个 commit 改的"答案是：**engine 只有 af26d9c 一个**，其后 be417c7/7ea678f/0f5ef6e/e7cce38/f72a37f/9c75817/efc41a2 都是 POSTURE 时代的视觉/文案/i18n/OG polish，未再动匹配逻辑

---

## 四、POSTURE 重构删掉了什么、保留了什么

| 项目 | 状态 |
|---|---|
| `weightedManhattan/parseVector/formatVector/similarity` | 从 match.ts 删除，git 历史 5fde0e1 里有完整实现 + 全部单测 |
| 12 维引擎配置（DIMENSIONS/WEIGHTS/ALGO_CONFIG/delta/threshold） | **当前 main 仍保留**在 `src/content/packs/witch-trial/config.ts`（注释说明"不再参与评分但保留"），未删 |
| 16+5=21 角色的向量（vector 字段） | 从 quiz-content/madoka/config 删除（改 5 个新角色空 vector）→ **但 git 历史完整保留**；且**本地 dev.db 也至今保留了全部 21 个旧角色的完整 12 维向量**（见下） |
| madoka 5 角色定义（MADOKA_TYPES） | 删除；`src/content/packs/madoka/config.ts` 只留 title/workIntro/ipCode 元信息。恢复需从 `5fde0e1` 恢复 |
| ip-registry / mascot 元信息 | **保留**（当前 main 的 ip-registry.ts 与 397a2f1 基本一致） |
| DisclaimerFooter / disclaimer i18n | **保留**（当前 main 仍有，文案更长了） |
| `src/pack/types.ts` / `load.ts`（引擎契约） | 保留（`gateValues`/`gateBonus`/`specialTriggers` 等 PackRules 注解还在） |
| 26 题 | 题库**整体重写**（审判官拷问体 → "晨光中的许愿"日常体），非同一套题 |

### 重要发现：本地 dev.db 还留着旧角色
`prisma/dev.db`（本地存在，已不被 git 跟踪）的 PersonalityType 表现有 **26 行**：
- 21 个旧角色：`EMMA...ETL`（16 witch-trial）+ `MADOKA/HOMURA/SAYAKA/KYOKO/MAMI`（5 madoka），**vector 全部填着完整 12 维字符串**，HOMURA 还是 5fde0e1 修复过的 `HHL-HLH-LHH-HHH`（**已含撞车修复**）！ipCode=madoka 分布正确
- 5 个新 POSTURE 角色（vector 为空）
- 但 Question 表也已被 reseed 成 POSTURE 26 题（Q1 晨光中的许愿...Q26），**旧题不在本地 DB，只在 git 历史**

---

## 五、更早 12 维初始版本

- `e9515fc`（`feat: witch trial personality test v1`，2026-04-22）= **weightedManhattan/parseVector/formatVector 的引入 commit**。v1 就是 12 维引擎：`parseVector`（当时无 expectedLen 校验）、`scoreToTier` 读 `ALGO_CONFIG.tiers`、`weightedManhattan` 读 `WEIGHTS` 数组（当时还是硬编码 12 维度、无 pack 化）
- 引擎演进链：`e9515fc` → `69b3603`（security pass，符号仍被 -S 命中）→ `a49393c` → `28b8eed`（算法反泄漏实验）→ `fb53ffb` → `397a2f1`（pack 化 + 跨 IP）→ `5fde0e1`（HOMURA 撞车修复）
- 中途 `6455a09`（C1 维度去 IP 化改名）把维度名 审判/侵蚀/羁绊/觉醒 → 评判/执念/羁绊/自持，`4e95585`（C2 26 题改写为审判官拷问体）——**这两步都发生在 397a2f1 之前的 12 维体系内部**，不是 POSTURE
- 角色数演进：v1=14，397a2f1=21

---

## 六、26 题新旧是否一致？（风险重点）

**不一致。** 当时的 26 题 ≠ 现在的 26 题：

- 旧（397a2f1/5fde0e1）：26 题带 dim 标注（S1-F3 各 2 题 + GATE + TRIGGER），题面是"审判官灵魂拷问"体（meta 如"评判·觉醒"、"执念·称量"、"命运分歧"），选项 score 1-3（反向题显式倒排），含 1 道砝码题（weight:: 编码）、2 道 scale 题（天平）、1 GATE + 1 TRIGGER
- 新（af26d9c 起）：26 题 **dim 全为 "POSTURE" 占位**（`renderType` 区分），题面是日常情境体，标题就是 **"Q1 · 晨光中的许愿"**…"Q26 · 审判终章确认"，每题 options 带 `posture: A/B/C` + score，Q8/Q22 scale、Q14 砝码（weight::a|b|c）、Q18 gate、Q19 trigger
- **"Q1 · 晨光中的许愿"这个标题首次出现在 af26d9c**（git log -S 证实），12 维时代**从来没有过**这个标题

→ 如果你的目标是"恢复 26 题的 12 维版本"，必须恢复的是 **5fde0e1 的 `src/data/quiz-content.ts`**（+ 对应四语言 i18n），不能直接复用当前 yaml。

---

## 七、恢复 12 维跨 IP 方案的最佳路径

**建议基准 commit：`5fde0e1`**（比 397a2f1 多一个修复：HOMURA 向量 FH 修正 `HLL-HMH-LHH-HHM → HHL-HLH-LHH-HHH`，解决与 HIRO 撞车；397a2f1 有这个 bug）

1. **引擎**：从 `5fde0e1` 恢复 `src/lib/match.ts`、`src/lib/answer-processor.ts`、`src/lib/match.test.ts`（58 单测全集）
2. **API**：从 `5fde0e1` 恢复 `src/app/api/results/route.ts`、`src/app/api/match/route.ts`（findMany 全部角色的全局匹配已是旧版默认行为）
3. **题库/角色/引擎配置**：从 `5fde0e1` 恢复 `src/data/quiz-content.ts`（26 题 + 16 witch-trial 角色）、`src/content/packs/madoka/config.ts`（5 小圆）、`prisma/seed.ts`（21 角色 seed 逻辑）
4. **合规声明/跨 IP 元信息**：`src/components/DisclaimerFooter.tsx`、`src/content/packs/ip-registry.ts` 当前 main 仍有（可在当前版基础上保留），i18n 四语言 `disclaimer` 键、`src/i18n/*.ts` 的旧题翻译需从 5fde0e1 恢复
5. **DB**：角色表可直接借助现有 dev.db（旧 21 角色向量已在库中）或重跑 5fde0e1 版 seed；**题目必须重跑 5fde0e1 版 seed**（当前 DB 的题目是 POSTURE 题）
6. **不动的部分**：`src/content/packs/witch-trial/config.ts`（12 维 DIMENSIONS/WEIGHTS/ALGO/delta=3/threshold=40 当前 main 还完整保留）、`src/pack/types.ts`、`prisma/schema.prisma`（vector 列还在）

---

## 八、风险点清单

1. **题目内容不兼容**：当前 26 题（yaml/Q1晨光）与 12 维 26 题（quiz-content.ts 裁判体）完全不同。恢复后必须恢复旧题库 + 旧 i18n 翻译（en/ja/zh-TW 的旧题翻译只在 5fde0e1 及更早）；当前 `content/content.yaml` 也不存在 dim 标注（POSTURE 全 `dim: POSTURE`），**12 维时代无 yaml，题目权威源是 TS 文件**
2. **引擎配置在两处**：维度/权重/算法（tiers、delta=3、threshold=40）在 `src/content/packs/witch-trial/config.ts`（当前 main 仍完整）；但 gateBonus/特殊触发映射在 `pack.rules`（`src/pack/types.ts` 注解 + witch-trial pack 的 config），恢复时要确认 pack 加载路径 `src/pack/load.ts` 的 `getActivePack()` 仍指向 witch-trial
3. **seed 的 21 角色可避免从代码恢复**：本地 dev.db 已含全部 21 旧角色向量（含 HOMURA 修复版），但要确认它是可信任的部署 DB 还是仅本地开发库（`789a6d7` 起已不跟踪 dev.db，git 里没有 DB）
4. **5fde0e1 之后的非 POSTURE 改动可能被误丢**：be417c7（视觉统一黑金暗色）、e7cce38（文案精修 + 天平图标）、9c75817（26 题 i18n）、efc41a2（OG 分享图）都是 POSTURE 时代的增强——如果纯回滚到 5fde0e1 会丢掉这些；若只想换匹配引擎、保留新 UI，应**只恢复引擎/API/题库/角色四个文件**，不动 UI 与 yaml
5. **角色数据"删除 vs 保留"的精确答案**：代码里被删除（vector 清空）→ git 历史 `5fde0e1^/5fde0e1` 完整保留 + 本地 DB 保留；schema 的 `vector` 列从未被删（只是改成 default ""）
6. **`forced` 兼容性**：当前 `results/route.ts` 的请求 schema、TestScreen 答题流程都是 POSTURE 版（postureA/B/C、path、keyUnlocked），恢复引擎后前端答题 → results 全链路的字段契约也要一并切回 12 维版（`dimScores`/`gateValue`/`triggerFired`），否则前后端不匹配

**最简恢复组合拳**（若目标是"12 维 + 跨 IP 21 角色"且接受旧 UI 契约）：`git show 5fde0e1:src/lib/match.ts` + `answer-processor.ts` + `src/data/quiz-content.ts` + `src/content/packs/madoka/config.ts` + `src/app/api/results/route.ts` + `src/app/api/match/route.ts` + `prisma/seed.ts`，一条 `FORCE_RESEED=1` 重跑 seed，其余保持当前 main。
