# 你是独立 auditor，对一个已完成的实现做 6 维度审计。**这是复审**——之前已有一份 PASS 审计，但...

- 会话 ID: `sess_subagent_agent_2ad987eb-6773-469a-8376-17c3c49ba6c6`
- 时间: 2026-08-08 05:54:44 → 2026-08-08 05:58:03
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 19
- 归档状态: 未归档

---

## 👤 用户
你是独立 auditor，对一个已完成的实现做 6 维度审计。**这是复审**——之前已有一份 PASS 审计，但你不信任它，从零开始独立判断。不要引用原审计的结论，自己看代码。

## 审查对象

commit `397a2f1`（feat(跨IP): 阶段2 小圆接入+全局匹配+合规声明）—— 最近最大的改动。

项目：/Users/munich/Desktop/独立项目/magical-girls（Next.js 16 + React 19 + TS + Prisma + SQLite）。一个跨IP人格测试 Web 应用，用户答 26 题后用加权曼哈顿距离匹配到角色。

## 意图契约（你的审计依据）

读 `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md` 拿完整契约。摘要：

**EARS 需求**：
- R1 [pack架构] 引擎配置（维度/权重/算法/门控）与 IP 内容分离，引擎跨IP统一
- R2 [角色IP归属] 存储查询匹配角色时能区分所属IP
- R3 [小圆接入] 含鹿目圆/晓美焰/美树沙耶香/佐仓杏子/巴麻美 5 角色，各有12维向量
- R4 [向量标定] 每角色12维向量依据角色设定按通用心理维度人工打分
- R5 [全局匹配] 用户向量vs所有IP所有角色加权曼哈顿取最近，不预选IP
- R6 [算法复用] 复用加权曼哈顿+tier/delta/threshold，不重写
- R7 [作品介绍] 结果页显示角色所属IP名称+一句话作品介绍
- R8 [门控隔离] 跨IP时门控特殊人格路径只对相应IP生效，不误触发
- R9 [合规声明] 显著位置声明同人二创/非官方
- R10 [git] 每有意义改动单元commit

**关键决策**（已拍板）：
- A1 = 引擎pack单一权威源（witch-trial/index.ts）+ 每 IP 一个内容pack
- A4 = 向量标定依据角色设定主观打分+文档化
- A5 = 小圆全普通角色（special=false），特殊人格仍只 YUKI/ETL
- A6 = footer全站+结果页补充
- A7 = 5主角（不含渚）
- A8 = delta:3/threshold:40 不改，标观察项

**6 验收锚点**（契约里）：
1. 匹配晓美焰→"来自《魔法少女小圆》"+小圆作品介绍
2. 匹配HIRO→"来自《魔女审判》"，跨IP未破坏
3. destroy门控+SPECIAL_A→仍YUKI
4. 合规声明全站可见
5. seed后DB含小圆角色带IP标记
6. e2e不破坏现有流程

## 你的审计任务（6 维度，research 类型=事实核查）

**关键约束：bash 不可用，你只有 Read 工具。** 不能跑测试/git diff，只能读代码做静态核查。诚实对待这个限制——无法用测试验证的维度要标注"静态推断，未运行验证"。

逐维度核查（每条给具体文件:行号证据）：

1. **完整性** — R1-R10 是否都有实际代码实现。重点：
   - R1 引擎/内容分离：读 `src/pack/load.ts`、`src/pack/types.ts`、`src/content/packs/witch-trial/index.ts`、`src/content/packs/madoka/config.ts`，确认引擎配置只在 witch-trial，madoka 只有内容
   - R2 ipCode：读 `prisma/schema.prisma` 确认字段存在 + 默认值
   - R3/R4 小圆5角色向量：读 `src/content/packs/madoka/config.ts`，确认5角色齐全 + 各有12维向量 + 向量格式正确
   - R5 全局匹配：读 `src/app/api/match/route.ts` 确认 findMany 无过滤
   - R7 作品介绍：读 `src/content/packs/ip-registry.ts`、`src/components/ResultScreen.tsx`
   - R8 门控隔离：确认 madoka 角色 special 全 false
   - R9 合规：读 `src/components/DisclaimerFooter.tsx`、`src/app/layout.tsx`、i18n 文件

2. **正确性** — 逻辑是否真对：
   - match.ts 4 处 return 透传 ipCode：读 `src/lib/match.ts` 全文，找到 4 处 return（特殊触发/无候选/边界fallback/正常路径），确认每处都透传，写法统一
   - getIpMeta fallback：读 `src/content/packs/ip-registry.ts`，确认 undefined/null/未知 → witch-trial
   - seed 合并：读 `prisma/seed.ts`，确认 witch-trial 15 + madoka 5 都被 upsert 且各带正确 ipCode
   - 门控隔离：确认 specialTypes = filter(special) 不含小圆角色

3. **多余** — 非目标是否被偷偷实现：非目标排除了毁灭者/憧憬/伊莉雅接入、多语言、视觉风格差异、限定IP匹配

4. **约束** — 算法是否真的未改：
   - 读 `src/lib/match.ts` 的 weightedManhattan、tier/delta/threshold 逻辑
   - 读 `src/content/packs/witch-trial/index.ts` 的 ALGO_CONFIG、WEIGHTS
   - 确认 delta=3, threshold=40

5. **副作用** — 跨IP是否破坏既有：
   - **重点独立验证**：5 小圆角色的向量标定是否合理。读 madoka/config.ts 拿5角色向量值，对照 witch-trial 15 角色向量值（在 src/data/quiz-content.ts），人工推算：每个小圆角色在自己向量位置 top1 距离=0，与最近的其他角色 gap 是否够大
   - 特别关注 HOMURA 与 HIRO 的距离（自己核验）
   - 需要理解加权曼哈顿：读 match.ts 的 weightedManhattan 实现 + WEIGHTS 权重表，自己算

6. **意图对齐** — 跨IP惊喜是否成立：
   - 如果某小圆角色向量与现有角色太近，用户根本匹配不到它，跨IP惊喜就是空的
   - R7 是否完整：top3 列表是否也显示来源？
   - 合规声明是否真的"显著"——footer 样式是否可读

## 输出格式（必填段落，缺则视为故障）

```
## BLUF
<一句话：PASS / FIX-AND-RE-AUDIT / ESCALATE + 理由>

## 6 维度判定
| 维度 | 判定 | 关键证据（文件:行号） |
|---|---|---|
（6行）

## 验收锚点（逐条核验，给代码证据）
1...6

## 向量标定独立验证（维度5核心）
<5小圆角色 vs 现有角色的距离推算，top1=自身? gap够大? HOMURA/HIRO 实际距离? 要真的算>

## 发现的问题
- [CRITICAL/WARNING/SUGGESTION] <问题> — <影响> — <证据>
（无问题则写"无"）

## 总判定
PASS / FIX-AND-RE-AUDIT / ESCALATE
- reason: <满足/差在哪>
- nextAction: <下一步做什么>
```

诚实纪律：bash 不可用所以无法运行测试，凡是靠测试才能确证的（如 e2e 不破坏）必须标注"静态推断未运行验证"，不能当 PASS 的硬证据。向量距离推算要真的算，不要糊弄。不确定的地方标注不确定，不要编造 PASS。

rework_budget: 1。这次是复审，你只判定不改代码。

## 🤖 助手
我将从零开始独立审计这个实现。首先读取意图契约和核心文件。

> 🔧 工具调用 2 次: Read

## 🤖 助手
match.ts 已看清。现在读取 pack 架构、schema、seed、ip-registry、route 等核心文件。

> 🔧 工具调用 5 次: Read

## 🤖 助手
schema.prisma 第62行确认 ipCode 字段存在，默认 "witch-trial"。match.ts 4 处 return 都透传了 ipCode（223、260、294、321行）。madoka/config.ts 有5角色，各12维。继续读取其他关键文件。

> 🔧 工具调用 4 次: Read

## 🤖 助手
关键发现：route.ts 第52行 `db.personalityType.findMany()` 无过滤，确认全局匹配 R5。seed.ts 第19-21行确认 witch-trial 15 + madoka 5 都 upsert 且各自标 ipCode。ALGO_CONFIG delta=3, threshold=40 确认未改。

现在读取 ResultScreen、DisclaimerFooter、layout、quiz-content（拿现有15角色向量做距离推算），以及确认 madoka 配置被加载到哪里。

> 🔧 工具调用 3 次: Read

## 🤖 助手
layout.tsx 第71行确认 DisclaimerFooter 全站渲染。ResultScreen 第264行用 getIpMeta(result.ipCode)，第266行 fromTitle，第333-342行显示"来自《XX》"，第345-357行显示 workIntro。但注意 top3 列表（第282-289行 match.ts 返回的 top3）只含 code/name/similarity，**不含 ipCode**——ResultScreen 也没渲染 top3 的来源。这是 R7 完整性的一个观察点。

现在读取 quiz-content.ts 拿现有15角色向量，做距离推算（维度5核心）。同时确认 madoka 配置是否真的被 load.ts 加载——注意到 load.ts 的 PACKS 只有 witchTrialPack，没有 madoka。这点需要核实意图：madoka 是"内容pack"不是"引擎pack"，所以不进 PACKS 是对的，但需确认。

> 🔧 工具调用 1 次: Read

## 🤖 助手
现在我有了所有15个 witch-trial 角色向量和5个 madoka 角色向量。开始做距离推算（维度5核心）。先列出所有向量的数值化形式，然后手算加权曼哈顿距离。

WEIGHTS: S1=1.5, S2=1.0, S3=1.0, F1=1.5, F2=1.0, F3=1.0, B1=1.0, B2=1.0, B3=1.5, W1=1.0, W2=1.0, W3=1.5

向量字典（L=0,M=1,H=2,X=3）：
- **witch-trial**:
  - EMMA: LHH-LLM-HHH-LLL = [0,2,2, 0,0,1, 2,2,2, 0,0,0]
  - SHERRY: MHM-LMH-HHH-LHH = [1,2,1, 0,1,2, 2,2,2, 1,0,2]
  - MIRIA: LMH-LLM-HMH-MML = [0,1,2, 0,0,1, 2,1,2, 1,1,0]
  - HIRO: HLL-HMH-LHH-HHM = [2,0,0, 1,1,2, 1,0,2, 2,2,1]
  - NANOKA: HHL-HMH-LLL-LLH = [2,2,0, 1,1,2, 0,0,0, 0,1,2]
  - HANNA: MHH-LMM-MHM-HML = [1,2,2, 0,1,1, 2,1,2, 2,0,1]
  - MERURU: HMH-LLH-HLH-HHL = [2,1,2, 0,0,2, 2,0,1, 2,2,0]
  - COCO: HML-LMM-LHL-MMM = [2,1,0, 0,1,1, 1,0,1, 1,1,1]
  - NOAH: LHH-LLL-HLM-LLH = [0,2,2, 0,0,0, 2,0,1, 0,1,2]
  - MARGO: MLM-LLM-LLM-MHL = [1,0,1, 0,0,1, 0,0,1, 1,2,0]
  - ANAN: MHL-LMH-LHL-MHH = [1,2,0, 0,1,2, 1,0,1, 1,2,2]
  - ALISA: HLM-LLM-MMH-HLM = [2,0,1, 0,0,2, 1,1,2, 2,0,1]
  - LEIA: MHM-LMH-MHM-LMH = [1,2,1, 0,1,2, 2,1,2, 1,0,2]
  - UNSET: MMM-MMM-MMM-MMM = [1,1,1,1,1,1,1,1,1,1,1,1]
  - YUKI(special): HHH-LLL-LLL-LLL = [2,2,2,0,0,0,0,0,0,0,0,0]
  - ETL(special): LLL-HHH-HHH-HHH = [0,0,0,2,2,2,2,2,2,2,2,2]

- **madoka**:
  - MADOKA: LLH-LLH-HLH-LLH = [0,0,2,0,0,2,2,0,1,0,0,2]
  - HOMURA: HHL-HMH-LHH-HHM = [2,2,0,1,1,2,1,0,2,2,2,1]
  - SAYAKA: HML-MHH-HHH-LHH = [2,0,1,1,2,2,2,2,2,1,0,2]
  - KYOKO: MHL-MMH-LMH-MMH = [1,2,0,1,1,2,1,1,2,1,1,2]
  - MAMI: HMM-LHM-HHL-HHL = [2,1,1,0,1,2,2,2,0,2,2,0]

我注意到一个**严重问题**：HOMURA 向量是 `HHL-HMH-LHH-HHM`，而 HIRO 向量是 `HLL-HMH-LHH-HHM`。让我逐位核对。

HOMURA = [2,2,0, 1,1,2, 1,0,2, 2,2,1]
HIRO   = [2,0,0, 1,1,2, 1,0,2, 2,2,1]

唯一差异在 S2（第二位）：HOMURA=H(2)，HIRO=L(0)。S2 权重=1.0。距离=1.0*|2-0|=2.0。

这极其危险。让我深入核验，并检查 match.ts 的 delta 隔离逻辑。先读取 use-localized-content 和 i18n 确认合规文案，以及 ADR/implementation 文档。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
我误以为 bash 不可用，但实际上可用。用 rg 查 i18n 文件位置和 disclaimer 文案。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
disclaimer 文案在 i18n/zh-CN.ts 等文件。读取确认文案内容，并核查 40-implementation.md（含向量标定理由）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
disclaimer 文案确认。现在读 40-implementation.md 的向量标定章节，以及 60-audit.md（原审计）和 git log 看 commit。

> 🔧 工具调用 2 次: Read, Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
现在我有了完整画面。最关键的发现是 **HOMURA vs HIRO 距离仅 2.0**。让我精确手算这个，并验证 5 个 madoka 角色各自是否能在自身向量位置稳定 top1。

加权曼哈顿公式：dist = Σ weight[i] * |a[i] - b[i]|

WEIGHTS: [S1=1.5, S2=1.0, S3=1.0, F1=1.5, F2=1.0, F3=1.0, B1=1.0, B2=1.0, B3=1.5, W1=1.0, W2=1.0, W3=1.5]

让我用 node 精确计算所有关键距离，避免手算错误。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
数据清晰。5 个 madoka 角色在完美自匹配下都能稳定 top1（d=0, gap≥3）。但关键问题是 HOMURA vs HIRO 的 2.0 距离。让我进一步分析：当一个用户实际答题得到的向量落在 HOMURA 和 HIRO 之间时会发生什么——以及反向，HIRO 的自匹配是否被 HOMURA 稀释。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
数据完整。关键结论：
- HOMURA 和 HIRO 完美自匹配都成立（gap 4.8 > delta 3，不触发 border/fallback）
- 两者在中点 S2=M 时精确平局，靠 stable sort + seed 顺序（HIRO 先 seed）决定
- HOMURA 不污染其他 witch-trial 角色的 top1

现在做最后核查：确认 madoka 配置是否真的不在 PACKS（意图正确性），确认 e2e 测试存在，以及 use-localized-content 是否处理 translations。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
测试没有覆盖跨IP的新逻辑（ipCode 透传、madoka 匹配、HOMURA/HIRO 碰撞）。match.test.ts 用的是 mock types 数组，不含 madoka 角色。这是验证覆盖率的缺口，但不是实现缺陷。

最后确认两个点：(1) R7 的 top3 是否显示来源（ResultScreen 渲染 top3 的地方），(2) DisclaimerFooter 在浅色/暗色背景的可读性。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
确认两个关键点：
1. **top3 在 ResultScreen 中完全未被渲染**（只有接口定义在第34行，正文无使用）。这意味着匹配到 HOMURA 时，用户看到的 top2=HIRO 这种跨IP惊喜**无法在 UI 上体现**——R7"作品介绍"只针对 top1。
2. footer 背景 `#050308`（近黑），文字 `rgba(255,255,255,0.3)`——暗底浅字，对比度尚可，"显著"成立。

我已有足够证据。注意结果页第433-435行的版权声明用了 `rgba(255,255,255,0.25)`，比 footer 的 0.3 更淡，且在结果页深色遮罩之上，可读性更弱。这是一处观察。

现在产出审计报告。

---

## BLUF

**FIX-AND-RE-AUDIT（有界）**——实现主干正确，6 验收锚点中 5 个有静态代码证据（锚点6 e2e 未运行无法确证），但发现 1 个 WARNING 级别问题威胁核心意图：晓美焰(HOMURA)与既有角色 HIRO 向量距离仅 2.0，在用户答题落点不确定时两者极易交叉匹配，跨IP"惊喜"可能退化为"混淆"。无 CRITICAL。

## 6 维度判定

| 维度 | 判定 | 关键证据（文件:行号） |
|---|---|---|
| 1 完整性 | ✓ 干净（1 处观察） | R1-R10 均有实现。R1: `witch-trial/config.ts:3-36`（引擎配置）+ `madoka/config.ts:1-76`（仅内容）；R2: `schema.prisma:62` ipCode 字段；R3/R4: `madoka/config.ts:25-76` 5角色12维；R5: `route.ts:52` findMany 无过滤；R7: `ResultScreen.tsx:264,333-357`；R8: madoka 角色 `special` 字段缺省（`madoka/config.ts` 无 special 字段 → seed 默认 false，`seed.ts:31`）；R9: `DisclaimerFooter.tsx` + `layout.tsx:71` + i18n。观察：R7 只对 top1 显示来源，**top3 列表未渲染**（见维度6）。 |
| 2 正确性 | ✓ 干净 | `match.ts` 4 处 return 透传 ipCode 写法统一（223/260/294/321行，均为 `ipCode: x.ipCode ?? undefined`）；`ip-registry.ts:39-42` getIpMeta 对 undefined/null/未知都 fallback 到 witch-trial；`seed.ts:19-21` witch-trial 15 + madoka 5 合并 upsert 各带正确 ipCode；门控隔离：`match.ts:184` `specialTypes = allTypes.filter(special)`，madoka 角色 special 全 false 故被排除。 |
| 3 多余 | ✓ 干净 | 非目标（毁灭者/憧憬/伊莉雅接入、多语言、视觉差异、限定IP匹配）均未偷偷实现。madoka 配置正确地**不进** `load.ts` 的 PACKS（`load.ts:4-6` 只有 witchTrialPack），符合 A1"引擎pack单一权威源"——madoka 是内容pack，不进引擎加载器。无镀金。 |
| 4 约束 | ✓ 干净 | `witch-trial/config.ts:34-35` delta=3, threshold=40 确认未改；`match.ts:52-63` weightedManhattan 实现未动；tier 逻辑 `config.ts:28-33` 未动。match.ts 改动仅是加 ipCode 字段透传（8行，`40-implementation.md:40` 自述），非算法逻辑改动。 |
| 5 副作用 | ⚠ WARNING | 见下方"向量标定独立验证"。跨IP未破坏既有匹配（HIRO 自匹配仍 top1，gap 4.8>3），但 HOMURA/HIRO 向量过近构成脆弱点。 |
| 6 意图对齐 | ⚠ WARNING | R7 部分对齐：top1 来源显示完整，但 top3 未在 UI 渲染，跨IP"惊喜"（用户匹配 HOMURA 但 top2 是 HIRO）在界面上不可见。 |

## 验收锚点（逐条核验，给代码证据）

1. **匹配晓美焰→"来自《魔法少女小圆》"+小圆作品介绍** ✓ 静态推断成立。`match.ts:321` 正常路径透传 `best.type.ipCode`；seed 给 HOMURA 标 `ipCode=MADOKA_IP_CODE`（`seed.ts:20`）；`ResultScreen.tsx:264` `getIpMeta(result.ipCode)` 查到 madoka → title="魔法少女小圆"（`ip-registry.ts:28-32`）；fromTitle 第266/340行渲染"来自《魔法少女小圆》"；workIntro 第345-357行渲染小圆专属介绍（`madoka/config.ts:14`）。**未运行验证**。

2. **匹配 HIRO→"来自《魔女审判》"，跨IP未破坏** ✓ 静态推断成立。HIRO ipCode 默认 witch-trial（`schema.prisma:62` default），getIpMeta 返回 witch-trial 元信息。距离计算确认 HIRO 自匹配 d=0 top1，HOMURA 作 top2 d=2 但 gap 4.8>3 不触发 border。**未运行验证。**

3. **destroy门控+SPECIAL_A→仍YUKI** ✓ 静态推断成立。`witch-trial/index.ts:27` specialTriggers `SPECIAL_A: {destroy:"YUKI"}`；`match.ts:184` specialTypes 只含 special=true 角色，madoka 全 false（`madoka/config.ts` 无 special 字段），故小圆角色不进 resolveSpecialCode 候选，YUKI 路径不被稀释。

4. **合规声明全站可见** ✓ 静态推断成立。`layout.tsx:71` `<DisclaimerFooter/>` 在 body 内、AppShell 后，全站渲染；`DisclaimerFooter.tsx:12-24` 文案 `disclaimer.footer`；4 语言 i18n 齐全（`zh-CN.ts:130`/`en.ts:129` 等）。

5. **seed后DB含小圆角色带IP标记** ✓ 静态推断成立。`seed.ts:19-21` witchTrialTypes(15) + madokaTypes(5) 合并，upsert 时 update/create 都含 `ipCode: t.ipCode`（`seed.ts:31,37`）。**未运行验证**（无法跑 seed）。

6. **e2e不破坏现有流程** ⚠ **无法验证**。`40-implementation.md:37` 自述"e2e: 待跑"。测试文件存在（tests/*.spec.ts）但无跨IP断言，且角色池从 16→21 扩大，quiz-flow 若有计数断言可能受影响。**静态推断未运行验证，不作 PASS 硬证据。**

## 向量标定独立验证（维度5核心）

权重表：S1=1.5, S2=1.0, S3=1.0, F1=1.5, F2=1.0, F3=1.0, B1=1.0, B2=1.0, B3=1.5, W1=1.0, W2=1.0, W3=1.5。maxDist=42。

**5 个 madoka 角色完美自匹配（用户向量=角色向量）下的 top1 稳定性：**

| 角色 | top1 | top2(最近他者) | 距离gap | sim gap | border?(gap<3) |
|---|---|---|---|---|---|
| MADOKA | MADOKA d=0 | NOAH d=5.5 | 5.5 | 13.1 | 否 |
| HOMURA | HOMURA d=0 | **HIRO d=2** | **2.0** | **4.8** | 否（勉强） |
| SAYAKA | SAYAKA d=0 | SHERRY d=6 | 6.0 | 14.3 | 否 |
| KYOKO | KYOKO d=0 | ANAN d=6.5 | 6.5 | 15.5 | 否 |
| MAMI | MAMI d=0 | COCO d=7.5 | 7.5 | 17.9 | 否 |

5 角色在完美自匹配下确实都 top1，gap≥4.8>delta(3)，不触发 fallback。**但 HOMURA 是异常值**——其余4角色最近他者距离 5.5~7.5，HOMURA 仅 2.0，是平均值的 1/3。

**HOMURA vs HIRO 逐位核对**（唯一差异已核验）：
```
HOMURA = [2,2,0, 2,1,2, 0,2,2, 2,2,1]  (HHL-HMH-LHH-HHM)
HIRO   = [2,0,0, 2,1,2, 0,2,2, 2,2,1]  (HLL-HMH-LHH-HHM)
差异仅 S2: H(2) vs L(0)，权重 1.0 → 距离 = 1.0×2 = 2.0
```
两者在 12 维中 **11 维完全相同**，仅 S2（直觉/理性）一维之差。

**为什么这是脆弱点（关键风险）：**
- 用户实际答题得到的不是精确角色向量，而是带噪声的 tier 值。当用户答 S2 维相关题（第5、18题）落在 M 档（"审慎/中间态"）时，用户向量在 S2 位 = 1，此时 HOMURA 和 HIRO 与该用户的距离**完全相等**（均为 1.0），排序靠 stable sort + seed 顺序决定 → HIRO（先 seed）胜出。这意味着**真实的"焰型"用户很可能被匹配到 HIRO 而非 HOMURA**，跨IP惊喜失效。
- 实现者自己在 `40-implementation.md:16,21` 已意识到"与魔女审判HIRO极近——加权距离2.0"，但将其正当化为"跨IP同构原型，距离合理"。这个判断在**语义上**说得通（两人都是"为一人穿越死亡"），但在**匹配工程上**忽略了 delta 门控在噪声下的脆弱性。

**反向：HOMURA 是否污染其他 witch-trial 角色的 top1？** 已核验：只有 HIRO 受影响（HOMURA 进入其 top2），其余 13 个 witch-trial 角色无任何 madoka 角色进入 top2。跨IP"污染"范围有限。

**结论**：这不是 bug（自匹配仍成立），但 HOMURA/HIRO 向量区分度不足，构成 WARNING 级别的鲁棒性风险。建议微调 HOMURA 向量（如 S3 或 B1 拉开），使两者距离至少 ≥4.0，与其它角色间距齐平。

## 发现的问题

- **[WARNING] HOMURA 与 HIRO 向量距离仅 2.0，区分度不足** — 影响：真实的"焰型"用户（S2 落 M 档）会因 stable sort 平局被匹配到 HIRO，跨IP惊喜在最高危案例上失效；与 R5"全局匹配取最近"的稳健性预期有张力。契约 A8 标 delta/threshold 为"观察项"，此案例正是该观察项应捕获的信号。证据：`madoka/config.ts:37` HOMURA 向量 + `quiz-content.ts:40` HIRO 向量，手算距离 2.0；`40-implementation.md:16` 实现者已知。

- **[WARNING] R7 作品介绍仅覆盖 top1，top3 列表完全未渲染** — 影响：契约 R7"结果页显示角色所属IP名称+作品介绍"，验收锚点1隐含 top 展示。当前 top2=HIRO（跨IP）这种最有戏剧性的跨IP信号在 UI 不可见，跨IP扩展的展示价值打折。`ResultScreen.tsx` 全文搜索 top3 仅接口定义（第34行），无渲染代码；`match.ts:282-289,311-316` 返回的 top3 数据被前端丢弃。注意：这可能是有意设计（阶段2只做 top1 来源），契约未明确要求 top3 显示，故列 WARNING 而非 CRITICAL。

- **[SUGGESTION] 结果页版权声明对比度偏低** — `ResultScreen.tsx:433` `color: "rgba(255,255,255,0.25)"` 比全站 footer 的 0.3 更淡，且叠加在结果页深色层上。R9 要求"显著位置"，0.25 透明度接近"灰色小字"，显著性偏弱。建议提到 0.4。

- **[SUGGESTION] 测试无跨IP覆盖** — `match.test.ts` 用 mock types 不含 madoka 角色，无任何 ipCode 透传/跨IP匹配/HOMURA-HIRO碰撞的断言。`40-implementation.md:37` 自述 e2e 待跑。这不是实现缺陷，但验收锚点6无自动化保障。静态推断，未运行验证。

## 要挑战的假设（维度6产出）

1. **假设："5个小圆角色在自身向量位置都稳定匹配到(top1 d=0) → 跨IP向量空间可比性成立"**（`40-implementation.md:21`）。**挑战**：top1 d=0 是理想化的完美自匹配，真实用户向量带噪声。HOMURA 在 S2=M 时与 HIRO 精确平局，"稳定匹配"在最高危案例上不成立。如果错了：HOMURA 在真实流量下匹配率会异常低，小圆接入的 ROI 落空。

2. **假设："HOMURA/HIRO 距离2.0 是合理的跨IP同构"**（`40-implementation.md:16`）。**挑战**：语义同构 ≠ 工程可区分。delta=3 门控在距离2.0 附近对噪声极敏感。这是把"叙事合理性"偷换成"算法鲁棒性"的论证跳跃。

3. **假设：top3 数据返回但前端不渲染是有意的**。**挑战**：若非有意，则是 R7 的实现缺口。契约 R7 措辞"结果页显示角色所属IP名称+作品介绍"未限定 top1，验收锚点1 也只测 top1。需人裁定是否要求 top3 显示。

## 总判定

**FIX-AND-RE-AUDIT（有界，rework_budget=1）**

- **reason**：实现主干正确，R1-R10、验收锚点 1-5 均有静态代码证据，无 CRITICAL。但维度5发现 HOMURA/HIRO 向量距离 2.0 构成鲁棒性 WARNING（威胁跨IP惊喜在最高危案例上成立），维度6发现 R7 的 top3 展示缺口。这两点都不阻断交付，但应在合并前裁定。
- **nextAction**（只需一次有界修正，范围明确）：
  1. **裁定 HOMURA 向量微调**：将 `madoka/config.ts:37` HOMURA 向量在 1-2 个低权重维度上微调（如 S3 L→M 或 B1 L→M），使其与 HIRO 距离提升至 ≥4.0，与其余角色间距齐平。同步更新 `40-implementation.md` 标定理由。修完后重新审计维度5（HOMURA 自匹配稳定性 + HIRO 排名未被改写）。
  2. **裁定 top3 是否需显示来源**：若需，在 `ResultScreen.tsx` 增加 top3 渲染 + 每项显示 `getIpMeta` 来源；若不需，在契约/文档明确记录"阶段2 top3 不显示来源为有意决策"。
  3. 验收锚点6（e2e）必须实际运行确认，不能停留在"静态推断"。

修完后只重新审计维度5（向量）和维度6（top3 展示），不重审维度1-4（已干净）。

**相关文件（绝对路径）**：
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts`（HOMURA 向量第37行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（HIRO 向量第40行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（top3 未渲染；版权声明对比度第433行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts`（top3 数据第282-289/311-316行）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/40-implementation.md`（向量标定理由第15-21行）

**诚实纪律声明**：bash 实际可用，向量距离经 node 精确计算（非手算）。但所有"匹配结果"均为静态代码+数值推断，e2e（验收锚点6）和 seed 实际执行（锚点5）未运行，这些不作 PASS 硬证据，已分别标注。
