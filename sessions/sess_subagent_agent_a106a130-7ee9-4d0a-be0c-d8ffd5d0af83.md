# 你是 Crucible 流程的 architect（变体标签：**最小化**）。项目：/Users/munich/...

- 会话 ID: `sess_subagent_agent_a106a130-7ee9-4d0a-be0c-d8ffd5d0af83`
- 时间: 2026-08-10 10:06:03 → 2026-08-10 10:17:04
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 12
- 归档状态: 未归档

---

## 👤 用户
你是 Crucible 流程的 architect（变体标签：**最小化**）。项目：/Users/munich/Desktop/独立项目/magical-girls（WITCH-TRIAL 魔女审判人格测试，Next.js + Prisma，跨 IP 平台：witch-trial 原创 16 人格 + madoka 小圆 5 人格）。

## 任务
用户已决定：全部文案（题库 26 题 + 21 角色 + 四语言 i18n）**清空后重写**（清空已完成，结构保留）。你要独立设计一个完整的技术方案。**不要参考其他 architect 的方案**——你有自己独立的立场。

## 必读输入
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（意图契约——范围/约束/完成判定）
- `/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md`（方向锚：跨 IP 灵魂审判平台，逼视模式）
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（清空后的题库骨架——26 题 Q() 调用 + 对象形式 + 16 人格骨架）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts`（清空后的四语言骨架）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts`（清空后的 madoka 5 角色骨架）
- 备份含旧文案：`backups/copy-archive-20260810-170441.tar.gz`（可解压查看原始文案作参考）

## 你的变体立场
你的方案追求**最小风险**：用最少的并行面、最直接的重写流程完成高质量文案。你倾向：单实现者顺序产出（zh-CN 题库 → zh-CN 角色 → 四语言翻译），重质量不重吞吐；用轻量校验（diff 脚本）而不是复杂自动化。你需要在方案里论证为什么这样最优，并诚实列出你的方案的风险。

## 产出（返回报告，必填段落）
1. **BLUF**（3-5 行）
2. **核心抽象**（≤5 个：模块切分/流程阶段/校验机制）
3. **重写流程设计**：怎么组织 26 题 + 21 角色 + 四语言的重写？谁写什么、顺序、每步的验收
4. **模板化/同质化治理**：具体机制（如：写前给 implementer 的禁用句式清单、"我从不假装X"黑名单、角色开头句式差异化约束）
5. **校验方案**：如何验证"逻辑字段零改动"（diff 脚本设计）、"模板 0 次"、"21 角色两两可区分"、"四语言 key 一致"
6. **被拒绝的替代方案**（列 2-3 个，说明为什么不要）
7. **主要风险**（≤3）
8. **完成判定对照**：你的方案如何满足契约的 10 条完成判定

## 自我管理
- 有界：只读文件 + 产方案，不改任何文件
- 独立：不参考其他 architect 的输出（你被隔离运行）
- 输出完整不截断

## 🤖 助手
我先读取所有必读输入文件，理解项目全貌。

> 🔧 工具调用 5 次: Read

## 🤖 助手
已读五个核心文件。现在探索项目结构与备份，了解 i18n 全貌、现有脚本和旧文案风格。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
备份已解压。现在读备份中的旧文案，掌握原风格与结构细节。

> 🔧 工具调用 2 次: Read

## 🤖 助手
已掌握旧文案风格与模板问题。再确认几个承重细节：witch-trial 引擎 config、旧题库、en.ts 骨架、DB schema、seed/smoke 脚本。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
关键需要确认渲染端如何消费 i18n types 与题目（即哪份文件是权威源），这决定重写顺序。



> 🔧 工具调用 2 次: Bash

## 🤖 助手
链路基本清楚。最后确认渲染端对 i18n types 区块的消费方式（决定 zh-CN.ts 的 types 是否参与渲染）以及 witch-trial pack 的 workIntro。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我已掌握全部承重事实。基于完整链路分析（含一个关键发现：madoka 5 角色在 i18n 四语言中**没有键位**，其翻译在现有架构下无处落库），产出我的方案。

---

# WITCH-TRIAL 全案文案重写 · Architect 方案（变体：最小化）

## BLUF

**本方案的核心哲学：单实现者、顺序流水线、脚本只做校验不做生成——把"人味"留给写作，把"零改动"交给机器。** 三个承重决策：① 全部文案由**一个**实现者按"题库 → 角色 → zh-CN UI → 四语言"顺序产出，每阶段一个验收门，后一阶段不回溯；② 新增 **madoka 5 角色在 i18n types 的键位**（四语言同步），否则 21 角色四语言全覆盖在现有 seed-translations 链路下无处落库；③ 校验用 **TS compiler API 白名单键提取做"备份 vs 当前"结构指纹 diff**，配模板哨兵与 key 镜像断言——全部本地、可复现、零外部依赖。**最大单一风险：跨 IP 撞设不止 EMMA/MADOKA 一对**（实证：HIRO"冰与火"vs HOMURA"冰与执念"、HANNA"完美的盔甲"vs MAMI"优雅的盔甲"、"天生的X"开头 ≥3 次），撞设治理依赖单一作者的全景记忆 + 首句断言脚本兜底，仍可能漏语义级撞设。

## 变体

**最小化**——最少并行面、最直接的重写流程、轻量 diff 校验；不引入任何"看起来很先进"的自动化（LLM 语义打分、AST 生成初稿、Excel 协作链路全拒）。

## 核心抽象（5 个）

1. **文案权威源地图（Content Authority Map）**——决定"每一段文案写在哪、哪份文件是真相"。这是本设计最重要的抽象，因为本项目存在**双重权威源陷阱**（zh-CN 走 `quiz-content.ts` → seed → DB，翻译走 i18n 数组 → seed-translations → DB translations，而 zh-CN.ts 里还有一段**死代码区**）。

2. **顺序重写流水线（Sequential Rewrite Pipeline）**——5 个阶段，每阶段一个验收门。后一阶段绝不回溯前一阶段（防返工与漂移）。

3. **结构指纹 diff（Structural Fingerprint Diff）**——"逻辑字段零改动"的唯一事实来源：TS compiler API 解析备份版与当前版，只提取白名单键（dim/type/renderType/score/value/trigger/weight/code/group/vector/subtitle/special）序列化对比。语义级对比，报行号，防 grep 级文本噪声。

4. **模板哨兵（Template Sentinel）**——三层：黑名单精确计数（硬断言）+ 归一化相邻句式检测（硬断言）+ 首句两两前缀/比喻断言（硬断言 + 告警复核）。机器可判的用机器，判不了的列出人工复核清单。

5. **四语言 key 镜像（Locale Key Mirror）**——递归收集四个 i18n 文件的 key 路径集合，断言四集合全等 + 每个叶子键非空（防漏译、防键漂移、防新增键只加到一个文件）。

## 重写流程设计

### 权威源地图（先定"写哪"，再定"怎么写"）

| 内容 | zh-CN 权威源 | en/ja/zh-TW 权威源 | 落库 |
|---|---|---|---|
| 26 题 meta/text/label | `src/data/quiz-content.ts` | `src/i18n/{en,ja,zh-TW}.ts` 的 questions/gate/trigger 数组 | `prisma/seed.ts`（zh-CN）+ `scripts/seed-translations.ts`（翻译） |
| witch-trial 16 角色 slogan/desc/keywords | `src/data/quiz-content.ts` PERSONALITY_TYPES | i18n `types` 16 键 | seed.ts + seed-translations.ts |
| madoka 5 角色 slogan/desc/keywords | `src/content/packs/madoka/config.ts` | i18n `types` **新增 5 键（MADOKA/HOMURA/SAYAKA/KYOKO/MAMI）** | seed.ts + seed-translations.ts（**零代码改动**，脚本按 code 查表） |
| 平台 UI 文案（meta/welcome/loading/test/result/dims/dimGroups/disclaimer） | i18n zh-CN.ts | i18n 其余三文件 | 直接读，不落库 |
| zh-CN.ts 死代码区（questions/gate/trigger 数组） | — | — | 保留结构 + 注释标注（现状已有），**不填不删** |

依据：`src/lib/use-localized-content.ts` 的解析顺序是 DB translations → zh-CN 直接 fallback 到 DB 正文 → 非 zh-CN 查 i18n `types.CODE.field` 兜底。这证实：zh-CN 渲染不读 zh-CN.ts 的 types/questions（那是死代码），而 madoka 角色无 i18n 键时非 zh-CN 渲染会**退回中文正文**——所以 madoka 键位必须新增。

### 五阶段流水线（单一 implementer agent 顺序执行）

| 阶段 | 写什么 | 验收门（全绿才进下一阶段） |
|---|---|---|
| **0. 基线** | 校验脚本骨架（结构指纹 diff + 哨兵 + key 镜像）先写、先自检 | 脚本在"清空态 vs 备份"下必须 EXIT 0 且输出确定性报告：**26 题 / 16 角色 / 5 角色指纹相同**（数量断言防静默漏扫）；tsc EXIT 0 |
| **1. 题库**（zh-CN） | `quiz-content.ts` 26 题 meta/text/label（含 gate 4 选项、trigger 2 选项、天平 2 选项、砝码 7 槽） | 结构指纹 diff 空；"我从不假装"0 次；"你说得对"开头 ≤3；相邻题无共享句式；题干 ≤120 字/选项 ≤40 字；26 题全部逼问句法（含"你" + 问句/断言收尾）；三态同题内可区分；gate 四义（毁灭/被看见/平静/未决）与 trigger 两义（承认/否认）逐题对照清单人工复核 |
| **2. 角色**（zh-CN，2a 先 witch-trial 16，2b 再 madoka 5） | 16 + 5 角色 slogan/desc/keywords（keywords 非空；UNSET 无 keywords 键照旧） | 21 角色首句两两无共享开头（脚本硬断言）；跨 IP 撞设对照表人工复核（EMMA/MADOKA、HIRO/HOMURA、HANNA/MAMI 等已知撞设必须分岔）；slogan 两两不相等；IP 专属词仅限本 IP pack 内部 |
| **3. zh-CN UI 文案** | `zh-CN.ts` 非死代码区全部键（meta/welcome/loading/test/result/dims/dimGroups/types 对齐正文/disclaimer）；**死代码区不碰** | R8 哨兵：全文件无"因子倾向/因子共鸣度/相似度/因子侵蚀"等已否决词；平台层文案（除 types）无 IP 专属词（魔女/因子/监牢/残骸/使魔/魔法少女）；key 集合与备份一致 |
| **4. 翻译**（en → ja → zh-TW，先难后易，风险早暴露） | 三文件全部键 + **新增 madoka 5 键**；questions/gate/trigger 数组逐条翻译 | key 镜像：四文件 key 路径集合全等；叶子键全非空；无残留中文字符（脚本扫 CJK 断言，人名/专名白名单除外）；长度约束同 zh-CN；抽样 5 题 + 5 角色人工复核语义 |
| **5. 落库验收** | `FORCE_RESEED=1 pnpm exec tsx prisma/seed.ts` + `tsx scripts/seed-translations.ts` + 全量校验 | 重新 seed 后跑 smoke-check.mjs + 既有 vitest（match.test.ts 等）；**两条特殊路径端到端走通**（gate=destroy + trigger 承认 → YUKI；gate=seen + trigger 承认 → ETL）；DB 中 21 角色 translations 均含 4 语言（madoka 5 角色验证落库成功） |

**数据流（一段话）**：实现者把 zh-CN 正文写进 `quiz-content.ts` 与 `madoka/config.ts`（权威源）→ seed.ts 落库 Question/PersonalityType 表 → 实现者把翻译写进 i18n 三文件（含新增 madoka 键）→ seed-translations.ts 按 DB code 查表写入 translations JSON → 渲染端 `use-localized-content.ts` 按 locale 解析（DB translations → zh-CN fallback 正文 → i18n types 兜底）→ 结果页展示。校验脚本站在这条链路的**两个源头**（备份 vs 当前源文件）做静态断言，不依赖 DB 状态。

## 模板化/同质化治理

治理分两层：**写作规范前置（防）** + **哨兵脚本事后（抓）**。只靠脚本是抓不到"没味道"的，只靠规范是抓不到"违规"的。

**写作规范工件**（`crucible/` 下随任务派发，每个阶段附对应清单）：

1. **禁用句式清单（题库）**：
   - 黑名单精确 0 次：`我从不假装X`、`我从不假装`（全文 0 次，判定 4）
   - 承认态**禁用**"……你说得对。"作开头（全案 ≤3 次配额，逐题登记，用尽即换：`……是。`/`……被你说中了。`/`……我认。`/`……没错，我` 等）
   - 禁用"你从来没有真正X过——对吧？"同构断言（去模板化核心）；题干禁"别装了/别装冷静/你心里清楚"三连发（旧文案 Q1-Q8 连用）
   - 断言必须带**具体细节**（时间/地点/数字/身体反应/说过的话），细节抽象即返工——这是 REDESIGN 调性承重墙①

2. **三态声部规范**：每题写作时先标定"哪个 label 是承认、哪个是否认、哪个是中间"（写进注释或对照表），三态声部各占一格：否认=硬（直接反驳）、承认=痛（先认后剖）、中间=复杂（合理化/两难）。三态在**同题内**首 4 字两两不同。

3. **角色开头句式差异化约束（21 角色）**：
   - 21 个 desc 首句（按 `。` 切分）**禁止共享开头 8 字**；写 madoka 5 角色前必须先读 witch-trial 16 角色已定稿首句清单
   - **比喻黑名单**（实证撞设）："天生的X"（旧 ≥3 次）、"冰与X"、"X的盔甲"（HANNA/MAMI 撞）、"X的孤狼"——任一角色禁用，换身体性/行为性开头（如从具体动作起笔："你会在深夜……"）
   - 撞设对照表（已知 3 对必须分岔）：EMMA vs MADOKA（信仰者）、HIRO vs HOMURA（冰+执念）、HANNA vs MAMI（盔甲+温柔）；其余 18 角色两两在写作时自查
   - slogan：21 条两两不相等且不共享比喻词；slogan 与 desc 风格统一（A5：slogan 整体重写，不保留原文）

4. **跨 IP 词隔离（平台层）**：zh-CN.ts 的 meta/welcome/loading/test/result/dims/dimGroups/disclaimer 属跨 IP 共用文案，禁 IP 专属词（魔女/因子/监牢/残骸/使魔/魔法少女/魔女化）；IP 专属词仅限各 pack 内部角色文案。注意：`result.factorResonance/factorResonanceLabel/analysis/dimAnalysis` **键不能删**（`witch-trial/index.ts` 的 presentation.result 引用 `fitLabelKey: "result.factorResonanceLabel"`），但**值**不得再含"因子"字样（R8），重写为"灵魂共鸣/维度倾向"类措辞。

**哨兵脚本**（阶段 0 交付，一个文件 `scripts/verify-rewrite.ts`，四个子命令，全 EXIT 0/1 + 行号报告）：
- `verify logical-fields`：结构指纹 diff（见校验方案 V1）
- `verify bans`：黑名单计数 + "你说得对"开头计数 + 长度约束 + 逼问句法 + 三态首字区分
- `verify distinct`：21 角色首句前缀断言 + slogan 相等断言 + 相邻题归一化 n-gram 相似告警
- `verify keys`：四语言 key 镜像 + CJK 残留扫描

## 校验方案

**V1 逻辑字段零改动（判定 2/3 的核心事实源）**：脚本用 TypeScript compiler API 分别 parse `backups` 解压出的旧版与当前版 `quiz-content.ts` + `madoka/config.ts`，按**白名单键**序列化：
- 26 题：`[dim, type, renderType ?? "normal", meta 除外, options.map(o => [score ?? idx+1, value ?? null, trigger ?? null]), options.length]`——text/label/meta 排除
- 角色：`[code, name, group, vector, subtitle ?? "", special ?? false]` + `keywords` 键存在性——slogan/desc/keywords 值排除（键存在性保留）
- 顺序天然由数组序覆盖（26 题顺序/门控 18/触发 19/天平 8·22/砝码 14 位置变化必然反映为指纹差异）
- 输出：每个不一致点报"备份第 N 题 vs 当前第 N 题，字段 X 不同：旧值 → 新值"
- **自检防线**：脚本断言解析出的题数/角色数必须精确等于 26/16/5，数量不符即 EXIT 1（防 parse 失败静默放行）；阶段 0 在"清空态"跑必须全绿（基线），此后任何一次运行变红即逻辑被改。

**V2 模板 0 次**：黑名单精确子串计数（"我从不假装"=0）；"你说得对"作为**开头**（正则 `^[「“…]*你说得对`）≤3；归一化（去引号/省略号/破折号/空白）后相邻题 text 公共前缀 ≥8 字即违规；选项模板同题内首 4 字两两不同。

**V3 21 角色两两可区分**：desc 首句（按句号/感叹号切分）8 字前缀两两不相等的**硬断言**（覆盖判定 5"无共享开头"）；slogan 两两不相等的硬断言；"核心比喻"用黑名单词表 + 归一化 n-gram Jaccard 相似度 > 0.5 的**告警清单**交人工复核（比喻相似是语义级的，脚本只缩小范围，不做最终裁判）。

**V4 四语言 key 一致**：`verify keys` 递归收集四文件对象 key 路径（含新增 madoka 5 键），四集合全等断言 + 叶子值非空断言 + CJK 残留扫描（人名/专名白名单，如"鹿目圆"在 en 的 name 字段允许保留罗马音或汉字）。

**V5 语义锚定（脚本管不了的，走人工清单）**：gate 四选项语义（毁灭/被看见/平静/未决）、trigger 两选项（承认/否认）、砝码 7 槽的 A/B/C 三子方面指向、每题三态声部归属——实现者在阶段 1 写出一张"26 题 × 三态归属"对照表，阶段 5 由复核者全量 26 题逐条核对（26 题规模可控，不做抽样）。

## 关键决策（7 条，归 4 类）

**A 类：权威源与范围**
- **D1：i18n types 新增 madoka 5 键（四语言同步）** → 使 A3/A4 的"21 角色四语言"真正可达，且 seed-translations.ts 按 code 查表、零代码改动即可落库。
  - 否决：给 madoka/config.ts 加翻译字段（要改 PersonalityTypeDef 类型/schema，违反"不改 schema"非目标）；madoka 翻译暂缺、渲染端 fallback 中文（违背用户已确认的 A3/A4，属于悄悄缩范围）。
- **D2：zh-CN.ts 死代码区保留结构 + 注释标注，不填不删** → 满足判定 8"清理**或**标注"的标注分支；且 export-i18n.ts 用 `zh-CN.questions.length` 作 Excel 行数基准，删除会破坏既有工具链。
  - 否决：删除死代码区（需同步改 export-i18n.ts，扩大风险面，违背最小化）；在死代码区同步填正文（双写权威源，必然漂移——它正是上一版"因子倾向"残留的温床）。

**B 类：流程组织**
- **D3：单实现者顺序产出** → 21 角色差异化治理的本质是"单一作者全程持有 21 个首句/比喻的全景记忆"；分给多实现者并行必漏跨 IP 撞设（本次重写正是为治这个病，不能再得一次）。
  - 否决：多 agent 并行分块（风格冲突 + 撞设漏治）；每题/每角色独立任务（验收开销放大，且破坏全景记忆）。
- **D4：翻译顺序 en → ja → zh-TW（先难后易）** → 与 zh-CN 结构差异最大的 en 先做，翻译策略问题最早暴露；zh-TW 与 zh-CN 同源最后做最省力。（低风险默认，若实现者语言能力侧重不同可调序，但必须一语言一验收门。）

**C 类：校验机制**
- **D5：结构指纹 diff 用 TS compiler API 白名单键提取** → 语义级对比、报行号、免疫引号/换行/字段顺序噪声；这是"逻辑字段 diff 为空"唯一可信的实现方式。
  - 否决：文本级 diff/grep（标签、引号样式噪声全是假阳性）；先快照再人工目检（26 题 × 5 字段 × 21 角色，人眼必漏）。
- **D6：哨兵分硬断言与告警复核两层** → 机器可判的（计数/前缀/相等/长度）全硬断言；语义级相似（比喻、三态声部）出告警清单交人工。避免阈值魔怔与外部依赖。
  - 否决：LLM 语义相似度自动打分（外部模型、不可复现、本次一次性场景不值得；且它会把"风格主观判断"伪装成客观断言）。

**D 类：治理**
- **D7：写作规范工件（禁用句式清单/黑名单/首句差异化约束）随任务派发、先于写作存在** → 校验只能抓违规、抓不了"没味道"；规范的唯一作用是把质量下限在写前抬高。
  - 否决：只靠事后脚本（下限失控）；只靠提示词不落工件（无法跨阶段复用与追责）。

## 扩展点

- **留开放**：
  - i18n types 新增键的机制（madoka 5 键打样）——未来新 IP 接入时角色翻译走同一模式，seed-translations 天然支持，零工程改动
  - 校验脚本的阈值参数化（相邻相似阈值、长度上限做成常量）——判定 10 的 ≤120/≤40 是契约假设值，若写作中证明不可行，调常量 + 回 checkpoint 请用户确认，不动脚本逻辑
  - export-i18n.ts 的 Excel 导出仍可用作人工四语言对照复核视图（流程不依赖它，但零成本）
- **关闭（YAGNI）**：
  - LLM 语义相似度自动打分（26+21 一次性的量，人工可审，引入不可复现性不值）
  - AST 自动生成初稿/占位符批量改写（"具体细节指控"是生成模型最弱的点，自动化初稿必然重新模板化——本任务就是要杀模板，不能用模板生成器）
  - 翻译记忆库/术语表系统（一次性翻译量，写作者自持术语一致即可；术语表以文档形式附在写作规范里，不建系统）
  - 修改 export-i18n.ts / seed-translations.ts / admin 链路（纯内容重写，工具链零改动是本次的边界红利）

## 被拒绝的替代方案

1. **多实现者并行分块（题库/角色/UI 各一 agent 同时写）**——吞吐诱人，但 21 角色差异化治理要求作者全程持有全景记忆，而跨 IP 撞设（EMMA/MADOKA、HIRO/HOMURA、HANNA/MAMI）正是本次要消灭的旧病灶；并行必然复现"各写各的、撞了不知道"。单一实现者的顺序产出看似慢，实际是**唯一能保证判定 5 的结构**。否决。
2. **Excel/import 协作翻译工作流（export-i18n → 外部翻译 → admin/import 导回）**——现有 export-i18n.ts 的 typeKeys 是硬编码 16 键，走 Excel 必须先改脚本支持 madoka 5 键；且 import 链路（admin/import/route.ts）为人工协作设计，引入往返序列化、键漂移、编码问题三个新风险面。直接改 TS 文件 + seed-translations 落库是最短路径（脚本已按 code 查表，天然支持新增键）。Excel 降级为可选复核视图。否决。
3. **"先翻译后定稿"（四语言与 zh-CN 并行）**——A4 用户已确认 zh-CN 定稿再翻译；且 zh-CN 语义未定时翻译必然返工，最小化变体不为省两天吞吐押上双倍返工。否决（与契约一致，仅记录）。
4. **全自动 AST 占位符重写（脚本生成全部初稿，人只审）**——生成初稿的模型（包括本次实现者）在"具体细节指控"上最弱，产出必然继承模板化；且"人只审"会把 26 题 × 3 态 × 21 角色 × 4 语言的审查负担变成不可能完成的全量复写。工具做不了的事不假装能做——脚本只校验，写作全人做。否决。

## 主要风险（按风险排序）

1. **跨 IP 撞设治理不彻底（语义级撞设漏网）**——实证已知 3 对撞设，但 21 角色中可能存在"比喻不同、结构同构"（如"X藏在Y后面"）的隐性撞设，首句 8 字前缀断言抓不住结构同构。缓解：madoka 5 角色作为后写方强制逐条对照 16 个已定稿首句/比喻清单（写进阶段 2b 的验收门）；n-gram 相似告警清单交人工全量复核 21 × 20 对（脚本把范围从 210 对压到告警级，人工负担可控）。
2. **措辞重写中分数语义漂移**——score 由 V1 保证不变，但"否认/承认/中间"三态的**声部归属**可能随措辞微妙改变（如某题"中间态"写成了变相"承认"），用户答题心理语义偏移，算法结果分布漂移。缓解：阶段 1 强制产出"26 题 × 三态归属对照表"（写前标定、写后复核），阶段 5 全量 26 题人工核对；这是脚本无能为力、必须流程制度化的部分。
3. **结构指纹 diff 脚本自身的假阴性**（parse 失败/漏字段/静默跳过 → 逻辑被改却不报）——校验工具出错比没有校验更危险（给人虚假安全感）。缓解：双重自检——数量断言（必须精确 26/16/5，不符即失败）+ 阶段 0 空态基线（清空态下必须全绿且输出确定性报告），任何一次运行结果与基线矛盾即触发人工介入。

## 完成判定对照（契约 10 条）

| # | 判定 | 本方案如何满足 |
|---|---|---|
| 1 | 备份先行且可恢复 | 已完成：`backups/copy-archive-20260810-170441.tar.gz`；阶段 0 起每阶段开始前确认备份存在，V1 以备份为基准 |
| 2 | 逻辑字段与备份 diff 为空 | V1 结构指纹 diff（TS compiler API 白名单键提取 + 数量断言 + 空态基线），是判定的唯一事实源 |
| 3 | 结构不变（26 题/顺序/门控/触发/天平/砝码） | 数组序天然编码于指纹；任何位置/数量/类型变动必触发 V1 红 |
| 4 | "我从不假装X"0 次；"你说得对"开头 ≤3；无相邻共享句式 | V2 哨兵：黑名单计数硬断言 + 开头正则计数 + 归一化相邻前缀断言 |
| 5 | 21 角色 desc 两两无共享开头与核心比喻 | V3：首句 8 字前缀硬断言 + slogan 相等断言 + n-gram 告警清单人工复核；写作规范第 3 条前置治理 |
| 6 | 26 题干全部逼问句法 | V2 逼问句法断言（含"你"+ 问句/断言收尾）+ 阶段 1 逐题人工复核 |
| 7 | 四语言 key 集合一致 | V4 key 镜像：key 路径集合四文件全等 + 叶子非空 + 新增 madoka 5 键四文件同步 |
| 8 | 跨 IP 共用文案无 IP 专属词；死代码区清理或标注 | 写作规范第 4 条（平台层词隔离）+ R8 词哨兵；死代码区走"标注"分支（现状注释保留，D2） |
| 9 | 门控/触发语义指向与备份一致，两条特殊路径可走通 | value/trigger 字段在 V1 白名单内；阶段 5 端到端走通 destroy→YUKI、seen→ETL 两条路径 + smoke-check + vitest |
| 10 | 题干 ≤120 字，选项 ≤40 字（假设值） | V2 长度断言，上限为脚本常量；若写作证明不可行，调常量并回 checkpoint 向用户确认（不私自放宽） |

## 关键文件索引

- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（26 题 + 16 角色权威源，本方案重写主战场）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts`（5 角色权威源；`MADOKA_TITLE/WORK_INTRO` 未清空、不在范围）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/{zh-CN,en,ja,zh-TW}.ts`（UI 文案 + 翻译权威源；types 需新增 5 个 madoka 键）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/use-localized-content.ts`（渲染解析顺序，权威源地图的事实依据）
- `/Users/munich/Desktop/独立项目/magical-girls/prisma/seed.ts` 与 `/Users/munich/Desktop/独立项目/magical-girls/scripts/seed-translations.ts`（落库链路，零改动）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/config.ts`（DIMENSIONS.name 等引擎文案未清空、不在范围；`index.ts` 的 presentation 引用 `result.factorResonanceLabel` 键——键不可删）
- 备份：`/Users/munich/Desktop/独立项目/magical-girls/backups/copy-archive-20260810-170441.tar.gz`（V1 对比基准）
