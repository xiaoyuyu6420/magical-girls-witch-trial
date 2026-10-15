# 你是资深中文文案编辑 + 内容实现工程师。项目：/Users/munich/Desktop/独立项目/magica...

- 会话 ID: `sess_subagent_agent_62eeff3e-8828-44b7-be7c-5587e423b703`
- 时间: 2026-08-10 11:12:59 → 2026-08-10 11:26:58
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 26
- 归档状态: 未归档

---

## 👤 用户
你是资深中文文案编辑 + 内容实现工程师。项目：/Users/munich/Desktop/独立项目/magical-girls（WITCH-TRIAL 魔女审判人格测试，跨 IP 平台：witch-trial 16 人格 + madoka 小圆 5 人格）。

## 你的任务：zh-CN 文案全量重写

用户已确认：全部文案清空后重写（清空已完成，结构保留）。你要把三份文件的文案字段填满：
1. `src/data/quiz-content.ts`（26 题 + 16 角色）
2. `src/content/packs/madoka/config.ts`（5 角色）
3. `src/i18n/zh-CN.ts`（UI 文案 + types 21 键）

## 必读（先读这些再动手）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（意图契约：R1-R8 + 10 条完成判定 + 用户已确认的 5 个歧义）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md`（ADR：写作规范/禁区/批次）
- `/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md`（方向锚——重点读"标杆样例"和"心理指向翻转"章节）
- 当前骨架文件（上面 3 个，结构已清空等你填）
- 备份里的旧文案作参考：`/tmp/copy-restore-test/src/data/quiz-content.ts`（旧版 26 题文案——看它哪里不好，不要复制它！）、`/tmp/copy-restore-test/src/i18n/zh-CN.ts`、`/tmp/copy-restore-test/src/content/packs/madoka/config.ts`

## 写作规范（硬性，来自契约+ADR）

### 调性（A1 打磨方向，用户确认）
- **审判官的逼视，是人味不是戏腔**：每句指控必须带具体细节（时间/地点/数字/身体反应/说过的话）——"你记得当时的天气"而不是"你是个虚伪的人"
- 三态=三种人格：否认=硬（直接反驳）、承认=痛（先认后剖）、中间=复杂（合理化/两难）——声部要分开，不是同一个人嘴硬 26 遍
- 中文质感：口语+逼问混合体，短句直呼"你"，省略号/破折号制造压迫感
- 题干保持审判官第一人称逼问句法（"你…对吧？"），**不退回第三人称叙事**

### 禁用（模板化治理）
- "我从不假装X" 全文 **0 次**
- "……你说得对。" 开头 ≤3 次（用"……是。"/"……被你说中了。"/"……我认。"等换着来）
- 相邻题共享开头句式 = 0（每题的选项首句别和邻题重）
- 21 角色 desc 首句两两不同（"你是天生的X"开头禁用——EMMA/MADOKA 旧版撞设是本次要治的病）；slogan 两两不同且与 desc 风格统一（用户确认 slogan 一起重写）
- 撞设高危对必须分岔：EMMA vs MADOKA（信仰者）、HIRO vs HOMURA（冰+执念）、HANNA vs MAMI（盔甲+温柔）、SHERRY vs SAYAKA

### 跨 IP 词隔离
- 题库区（QUESTIONS）禁 IP 专属词：因子/侵蚀/监牢/典狱长/使魔/残骸/魔女化/魔法少女（26 题是跨 pack 共用资产）
- madoka 5 角色 desc/slogan 禁 witch-trial 词：因子/监牢/典狱长/使魔/残骸/侵蚀（"魔女/魔法少女/魔女化"是小圆世界观核心词，允许）
- 四语言 i18n 的 UI 层（非 types）也禁 IP 词——但 zh-CN.ts 的 meta.title 是"魔女审判"（产品名，保留！）——注意：你在 zh-CN.ts 填值时产品名"魔女审判"允许，其他位置禁 IP 词
- REDESIGN 否决词全禁：因子倾向/因子共鸣度/因子侵蚀/相似度/灵魂图谱（结果页的 rarity 文案用"稀有度"概念，不用"相似度"）

### 长度
- 题干 ≤120 字，选项 ≤40 字（硬闸）

## 结构约束（绝对不能动）
- 26 题：dim/type/renderType/score/value/trigger 编码、顺序（正向12/反向13-17/门控18/触发19/反向20-26）、砝码题(14)的 7 个 `weight::a|b|c` 编码 label 原样保留、天平题(8/22)选项的 score 1/3 保留
- 16+5 角色：code/name/group/vector/subtitle/special 保留；UNSET 无 keywords 键
- i18n key 结构：只填值，不增删键；types 下现在是 16 键——**需要新增 madoka 5 键（MADOKA/HOMURA/SAYAKA/KYOKO/MAMI，结构同其他角色键，name/subtitle 复制自 packs/madoka/config.ts）**
- i18n 死代码区（questions/gate/trigger 数组）：**保持空串，不要填**（注释已说明不参与渲染）

## 批次顺序（一次做完，质量优先）
1. 题库 26 题（meta 标签 + text 题干 + options 选项）——先写每题注释标定"哪个是承认/否认/中间"
2. witch-trial 16 角色 desc/slogan/keywords
3. madoka 5 角色（对照 witch-trial 已定稿首句，确保不撞设）
4. zh-CN.ts UI 文案（meta/welcome/loading/test/result/dims/dimGroups/disclaimer/types）

## 局部检查（必须做）
1. 写完后 `pnpm exec tsx scripts/verify-rewrite.ts gates` 跑全量校验——G0/G1/G2/G3/G4 全绿（除 G4 门控/触发 label 应已非空所以也绿）
2. `npx tsc --noEmit` 全项目通过
3. 报告：BLUF + 触及的文件 + 交付内容摘要（每题一句话+三态标定表+角色差异化说明）+ 校验结果

## 禁区
- 禁改：逻辑字段（score/dim/type/value/trigger/weight 编码）、en/ja/zh-TW 三文件、pack 引擎 config、组件、scripts
- 禁改：i18n 死代码区数组内容
- 不要"顺便修复"其他问题

## 自我管理
- 有界：只做本任务三文件
- 诚实：如某个约束做不到（如 120 字太紧），在报告里说明而不是静默放宽
- 输出完整不截断

## 🤖 助手
我先读取必读文档和骨架文件。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在读取三个骨架文件（当前待填）和备份旧文案。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在读取备份里的旧文案作参考。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在查看校验脚本，确保文案符合 G0-G4 硬闸要求。

> 🔧 工具调用 1 次: Read

## 🤖 助手
现在检查其他三语言 i18n 文件的当前状态（确认 madoka 键是否已存在、key 结构基准）。

> 🔧 工具调用 3 次: Read

## 🤖 助手
查看快照文件，确认备份时四语言 key 状态（判断 madoka 键的镜像要求）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
确认了快照基线：四语言均 135 键、无 madoka 键，所以 zh-CN 新增 5 键后 G3 镜像会报 en/ja/zh-TW 缺键（预期，后续批次补齐）。现在看 TestScreen 如何渲染 meta/scale/weight，确保文案格式兼容。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
我已掌握全部约束。现在检查 i18n 的类型定义与消费方式，确认新增 madoka 5 键不会破坏类型检查。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
类型消费为动态字符串访问，新增键安全。开始写作。先建任务清单。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
现在写 quiz-content.ts 全量文案（26 题 + 16 角色）。逐题带三态标定注释，逻辑字段全部原样保留。

> 🔧 工具调用 1 次: Write

## 🤖 助手
题库和 16 角色完成。现在写 madoka 5 角色。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
madoka 完成。现在填 zh-CN.ts（UI 文案 + 21 角色 types 键）。



> 🔧 工具调用 1 次: Write

## 🤖 助手
三文件完成。运行全量校验。

> 🔧 工具调用 2 次: TodoWrite, Bash

## 🤖 助手
G0/G1/G2/G4 全绿、词表扫描全绿。G3 仅剩 key 镜像失败：en/ja/zh-TW 缺 madoka 5 键——这是预期的批次间状态（zh-CN 按 ADR 已加键，en/ja/zh-TW 属禁改区，待四语言批次补齐）。现在跑 tsc。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
tsc 通过。再跑逻辑字段 diff 和 key 状态做最终确认。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
逻辑字段零差异。最后做一次角色差异化人工自检（输出 21 角色首句与 slogan 列表）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
# zh-CN 文案全量重写 — 交付报告

## BLUF

三份文件文案已全部填满并定稿。26 题全部为审判官第一人称逼问句法、每题带具体细节指控（喉咙发紧、深夜数数、船开走时站在原地等），三态声部拆开（硬/复杂/痛）；21 角色（16+5）desc 首句与 slogan 全部两两不同，EMMA/MADOKA、HIRO/HOMURA、HANNA/MAMI、SHERRY/SAYAKA 四对高危撞设全部完成分岔。校验：G0/G1/G2/G4 全绿，G3 词表扫描全绿，`tsc --noEmit` 通过，逻辑字段 diff 为零。唯一未绿项是 G3 key 镜像的 en/ja/zh-TW 缺 madoka 5 键——这是预期的批次间状态（详见"校验结果"第 4 点）。

## 触及的文件（3 个，均在禁改边界内）

- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（26 题 + 16 角色）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts`（5 角色）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts`（UI 文案 + types 16 键填值 + 新增 5 madoka 键）

## 交付内容摘要

### 一、26 题（每题一行）

| # | dim | meta | 一句话指控 | 三态标定（否认硬/中间复杂/承认痛） |
|---|---|---|---|---|
| 1 | S1 | 评判·抗拒 | 你从没接受过任何人的审判（喉咙发紧顶回去） | 否认=能听道理 / 中间=压住气势 / 承认=一句都忍不了 |
| 2 | F1 | 执念·宿怨 | 你从没真正原谅过任何人（记得脸/话/天气）★标杆原句 | 否认=真的放下 / 中间=恨在但今天不动手 / 承认=假装放下 |
| 3 | B1 | 羁绊·邂逅 | 你从没无条件信任过陌生人（算她图什么） | 否认=信了 / 中间=接但留一分心 / 承认=第一天就在算 |
| 4 | W1 | 自持·咽声 | 你从没让自己崩溃过（深夜咽哭声） | 中间=哭完还得收拾 / 否认=放出来 / 承认=咽回去 |
| 5 | S2 | 评判·直觉 | 你先定罪再找理由（"就是她"的感觉） | 否认=盘证据 / 中间=等人影落地 / 承认=证据是马后炮 |
| 6 | F2 | 执念·深渊 | 你早就放弃了，只是不肯看（灯没亮） | 否认=还有角落 / 中间=找火柴 / 承认=不再点灯 |
| 7 | B2 | 羁绊·背叛 | 你从没真正恨过背叛你的人（替她开脱） | 否认=先处理事 / 中间=怕误会更伤人 / 承认=先问自己 |
| 8 | W2 | 自持·天平 | 天平只倾斜一次：感觉还是脑子 | 二选一（score 1/3 冻结） |
| 9 | S3 | 评判·慈悲 | 你的宽恕从不问她配不配（替她找理由） | 否认=越界即罪 / 中间=理解≠原谅 / 承认=先想她的苦 |
| 10 | F3 | 执念·迷途 | 你早选定了路，只是不承认（夜里只演练一条路） | 否认=算退路 / 中间=非做不可 / 承认=没回头 |
| 11 | B3 | 羁绊·献身 | 你从没把自己算进"要保住的人"（没问就伸手） | 中间=先问意愿 / 否认=先保自己 / 承认=没算代价 |
| 12 | W3 | 自持·本能 | 你不是压不住那股力量，是不想压（放松肩膀） | 否认=按回去 / 中间=圈着跑 / 承认=不想停 |
| 13 | S1 | 评判·停步 | 你的严苛是装的（脚挪了半步） | 否认=说到做到 / 中间=先看伤势 / 承认=手够纱布 |
| 14 | F1 | 执念·称量 | 砝码秤 A/B/C：记得多深/恨多久/动不手 | 编码 label 冻结（7 组合） |
| 15 | B1 | 羁绊·赌局 | 你从没完整信任过谁（总留一手） | 否认=凭什么我先亮 / 中间=给一半留一半 / 承认=等对方先迈 |
| 16 | W1 | 自持·面具 | 你不是不生气，是不敢生气（眉心是紧的） | 否认=真不在意 / 中间=挑时候是止损 / 承认=不敢砸场 |
| 17 | S2 | 评判·传闻 | 你分不清直觉和恐惧（浑身发冷） | 否认=查来源 / 中间=核实再站队 / 承认=第一秒就信 |
| 18 | GATE | 命运分歧 | 毁灭/被看见/平静/未定（value 冻结） | 四路径 |
| 19 | TRIGGER | 最终抉择 | 你早跨过自己画的线，要点亮吗 | SPECIAL_A=亮吧 / 守住=线是我画的 |
| 20 | F2 | 执念·崩塌 | 你站起来时心里已经空了（跪到膝盖失觉） | 中间=还在拼 / 承认=心里空了 / 否认=替她活 |
| 21 | B2 | 羁绊·利刃 | 你嘴上骂信任，心里盼着有人值得 | 否认=递不递刀我说了算 / 中间=两头站着 / 承认=还在等刀 |
| 22 | W2 | 自持·重称 | 天平又来了：感情还是算计 | 二选一（score 1/3 冻结） |
| 23 | S3 | 评判·告白 | 你判了她的罪，身体记着她的好（热茶） | 否认=两码事 / 承认=暖是真的 / 中间=卡在中间 |
| 24 | F3 | 执念·不松手 | 你把"不甘心"叫意志，分不清坚持和执念 | 否认=放得下 / 中间=何时松手由我定 / 承认=越劝越攥紧 |
| 25 | B3 | 羁绊·出口 | 你从来没把自己排在第一位（脚钉在原地） | 否认=上船了 / 中间=留下不是牺牲 / 承认=丢不下任何人 |
| 26 | W3 | 自持·余波 | 你从没真正害怕过自己的暴走（"他活该"） | 否认=后怕 / 中间=既怕又不愿它消失 / 承认=不后悔 |

### 二、角色差异化（关键分岔）

- **EMMA vs MADOKA**（旧版同开"你是天生的信仰者"）：EMMA 首句"你见过人性最脏的那一面"——带伤疤的信仰、赌世界没烂透；MADOKA 首句"你没法对任何人的眼泪转身"——无差别悲悯、以自我消失为代价。核心比喻：伤疤 vs 抹消。
- **HIRO vs HOMURA**（冰+执念）：HIRO"你讨厌解释"——不解释的行动派，为一个人反复走进死亡；HOMURA"你一个人守着一段只有你知道的历史"——独守被重置的记忆，无人同行的沉默者。
- **HANNA vs MAMI**（盔甲+温柔）：HANNA"你的关心从来不说出口"——骂出来的盔甲、偷塞伞的傲娇；MAMI"你泡茶的手很稳"——优雅面具下的逞强、渴望同伴到接不住高兴。
- **SHERRY vs SAYAKA**（守护 vs 正义）：SHERRY"人群里最亮的那颗太阳"——为守护者破戒的野兽；SAYAKA"你信'好人会有好报'"——被现实反手扇巴掌的信仰崩塌。
- 其余角色首句亦两两不同（21 首句首 6 字无重复），slogan 21 条两两不同且统一为第一人称口语台词体。

### 三、i18n / 词表

- UI 层全禁 IP 词达标：坏词"魔法少女的""因子侵蚀""监牢""因子倾向/因子共鸣度/灵魂图谱/相似度"全部清除；`meta.title` 保留产品名"魔女审判"；result 区"因子共鸣度"改为"灵魂共鸣"、dimAnalysis 改为"灵魂审判 · 维度解析"。
- 题库区 0 命中 IP 词；madoka 区 0 命中 witch-trial 专属词。
- types 新增 5 madoka 键（MADOKA/HOMURA/SAYAKA/KYOKO/MAMI），name/subtitle 与 `packs/madoka/config.ts` 完全一致；死代码区保持空串未动。

## 校验结果

| 闸门 | 结果 |
|---|---|
| G0 结构/逻辑字段 diff | 全绿（含门控18/触发19/天平8·22/砝码14 位置、score/value/trigger/weight 编码、死代码区只读断言） |
| G1 模板 | 全绿："我从不假装"=0；"你说得对"开头=3（恰好≤3，配"……是/……我认/……被你说中了"轮换）；相邻题共享开头=0 |
| G2 句法/长度 | 全绿：26 题干全含"你"、最长 86 字（≤120）；选项最长 30 字（≤40）；21 desc/slogan 两两不同 |
| G3 词表 | 全绿：否决词/IP 词四语言+题库+madoka 0 命中 |
| G3 key 镜像 | **FAIL（预期）**：en/ja/zh-TW 各缺 25 键（5 madoka 角色×5 字段）。zh-CN 已按 ADR D-C 加键，但 en/ja/zh-TW 属禁改区域，需四语言批次（A4 流程"zh-CN 定稿→再产"）补齐后转绿 |
| G4 语义指针 | 全绿：门控 4 value/触发 SPECIAL_A/砝码编码正则 |
| `npx tsc --noEmit` | 通过（exit 0） |

## 两个需要说明的决策

1. **HIRO slogan 重写**：REDESIGN 揭晓序列/档案卡样例引用的是旧 slogan"哪怕要死一千次，我也要把她带回来"。按 A5 用户确认全量重写，已改为"轮回多少次都行——我只要她回来"（保留"千次轮回/带她回来"意象）。若产品需要保持 REDESIGN 文档锚点，可回改该句，但建议文档侧跟进新 slogan。
2. **G3 key 镜像未绿**：这是唯一未绿项，属禁改边界外的批次衔接问题，不是文案质量问题——zh-CN 侧 21 键已就位。
