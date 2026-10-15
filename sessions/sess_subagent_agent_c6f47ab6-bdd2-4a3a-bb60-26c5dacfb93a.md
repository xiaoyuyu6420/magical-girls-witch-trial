# 你是 discoverer。把 REDESIGN 第五节当作事实依据阅读，浮现歧义（每个两种合理读法），产出锁定的...

- 会话 ID: `sess_subagent_agent_c6f47ab6-bdd2-4a3a-bb60-26c5dacfb93a`
- 时间: 2026-08-07 10:15:44 → 2026-08-07 10:17:22
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 6
- 归档状态: 未归档

---

## 👤 用户
你是 discoverer。把 REDESIGN 第五节当作事实依据阅读，浮现歧义（每个两种合理读法），产出锁定的 EARS 意图契约。

## 目标
按 `docs/REDESIGN.md` 第五节重做结果页，从"传统结果页（百分比/雷达图/维度条/top3）"升级为"揭晓时刻（错峰动效 + 角色档案卡 + 稀有度 + 分享卡）"。

## Spec 来源（事实依据，必读）
`/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md` 第五节（结果层：揭晓时刻）。你必须先读它，特别是：
- 核心原则（揭晓时刻非判决书、砍百分比/维度条/雷达图/top3、稀有度替代相似度）
- 揭晓序列时间轴（t=0.0~4.2s 六元素错峰）
- 角色档案卡结构（角色名/标语/来自《作品》/一句话作品介绍/第二人称描述/灵魂特质/稀有度条）
- 跨IP角色处理（情绪式作品介绍——阶段3a 只单一IP，但要为跨IP预留字段）
- 隐藏角色彩蛋（裂缝光效+粒子+特殊文案——REDESIGN 标"先做普通版"）
- 分享卡（钩子文案+角色+标语+作品+稀有度+行动召唤，无相似度）
- 动效规则清单表格（必须项：motion-7/18/11/6 + ease-out-expo + reduced-motion降级；可选：motion-3/22/easter-egg-3）
- 待定项（跨IP匹配范围、揭晓节奏4.2s实测、视觉风格差异）

## 动效规则定义（interface-details skill，已查证）
- **motion-3**：signature stroke-by-stroke（animate stroke-dashoffset，像手写签名）—— REDESIGN 用于标语逐字描出（可选）。
- **motion-6**：bleed blurred edges（滚动边缘模糊要延伸到容器边界，不留缝）—— 必须。
- **motion-7**：cross-fade content through blur（通过模糊过渡而非硬切）—— 用于答题页→结果页、角色名浮现。必须。
- **motion-11**：make animations interruptible（动画可被中断，新目标从当前值retarget）—— 全程点击/按键跳过。必须。
- **motion-18**：stagger reveals to set event order（多元素入场按阅读顺序错峰）—— 6元素错峰。必须。
- **motion-22**：indicate lifecycle state in one ambient indicator（环境光指示）—— 稀有度环境光呼吸。可选。
- **easter-egg-3**：reward the explorer（隐藏内容给探索者奖励）—— 隐藏角色粒子。可选，先做普通版。
- **决策门#3**：respect the user（prefers-reduced-motion 必须降级）。必须。
- **决策门#4**：consistency（ease-out-expo 曲线贯穿，和题目DNA一致）。必须。

## 项目上下文（阶段1 后现状）
- `src/components/ResultScreen.tsx`（288行）主战场。当前展示：similarity百分比、top3排行、雷达图(RadarChart)、维度条(DimensionBar)、详情弹窗、分享卡（含 similarity%）。
- `src/app/test/page.tsx` 调用 ResultScreen，需衔接揭晓序列触发（答题 onComplete → 现在直接显示 ResultScreen，阶段3a 要插入揭晓序列过渡）。
- `src/lib/match.ts` MatchResult 含 similarity/top3/userVector/templateVector/borderType/special —— 锁死区不动，但 UI 不再显示 similarity/top3。
- stats：`{ totalParticipants, typePercentage, typeCount }` —— 稀有度用 typePercentage。
- 现有 CSS globals.css 有 .revealed/#view-result/.result-layout 样式。
- 阶段1 的 TestScreen 答题页用 700ms 时序 + cubic-bezier(0.16,1,0.3,1) + opt-block 推开（ease-out-expo 语义）。

## ⚠️ 需你明确指出的歧义（每个给两种合理读法 + 推荐）
1. **揭晓序列与答题页的衔接**：现在 TestScreen onComplete 直接切 ResultScreen。揭晓序列（t=0.0 答题页模糊淡出）是在 ResultScreen 内部实现（ResultScreen 挂载即播放序列），还是单独的过渡组件（RevealSequence）插在 TestScreen 和 ResultScreen 之间？影响组件边界和状态管理。
2. **"砍掉百分比/雷达图/维度条"的程度**：是彻底删除这些 UI（含详情弹窗的 RadarChart/DimensionBar），还是默认隐藏但保留"查看详细分析"入口？REDESIGN 说"砍掉所有百分比/维度条/雷达图/top3"，但现有有"详情"按钮弹窗。彻底删还是隐藏？
3. **稀有度的计算与展示**：REDESIGN 说"全球仅 3.4%"。现有 stats.typePercentage 是"与你相同的人占全球百分比"。稀有度=typePercentage（数字越小越稀有）？还是反向（1-typePercentage）？稀有度条 ▓▓░░░░░░ 的填充逻辑？typePercentage 为空时（无统计数据）怎么显示？
4. **作品介绍字段来源**：角色档案卡要"一句话作品介绍"（如"一部关于在死亡回溯中守住一个人的故事"）。阶段3a 是单一IP（魔女审判），15个角色都来自同一作品。作品介绍是（a）所有角色共用一句魔女审判的介绍，还是（b）每个角色各自一句（更个性化但工作量大）？这字段存哪（PERSONALITY_TYPES 加字段？i18n？）？
5. **隐藏角色彩蛋"先做普通版"的边界**：REDESIGN 说 easter-egg-3"可选，先做普通版"。阶段3a 是完全不做隐藏角色特殊处理（YUKI/ETL 用和普通角色一样的揭晓），还是做一个轻量区分（如多一行"……审判庭从未见过这样的受审者"文案，但不做粒子裂缝光效）？
6. **4.2s 揭晓节奏**：REDESIGN 待定项"4.2s是否合适需实测"。阶段3a 直接按 spec 的 0.8/1.8/2.4/3.0/3.8/4.2 时间轴实现，还是做成可调常量便于实测微调？
7. **motion-6 滚动边缘模糊**：结果页是否可滚动？如果档案卡内容少（一屏放下），motion-6 不适用。如果内容多需滚动，motion-6 才有意义。阶段3a 档案卡预期高度？

## 你的产出
1. **BLUF**（一句话）。
2. **EARS 意图契约**：覆盖揭晓序列、档案卡、稀有度、分享卡、隐藏角色（轻量）、动效必须项、动效可选项、砍除项、保留项（R12）、git。每条标来源（REDESIGN 哪节 / 哪条 motion 规则）。
3. **[需澄清] 歧义**：上面7处，每个两种读法+推荐。
4. **[假设]**。
5. **非目标**：阶段3a 不做什么（跨IP作品介绍内容填充、多语言、A/B、不同IP视觉风格、隐藏角色完整粒子彩蛋）。

请先读 spec 第五节再产出。

## 🤖 助手
我先读 REDESIGN.md 第五节（事实依据），然后扫现状代码。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
第五节在 191-282 行。我读它，并并行扫现状代码。

> 🔧 工具调用 3 次: Read

## 🤖 助手
spec 第五节读完，现状代码也清楚了。我再补两处关键事实：test/page.tsx 的衔接方式，以及数据层是否已有"作品"字段（决定 A4 的可行性）。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
关键事实已确认：
1. **数据层无"作品"字段**——`MatchResult` / `PERSONALITY_TYPES` / `PersonalityTypeInput` 都没有 `works`/`origin`/`source` 字段。A4 真实存在。
2. **衔接方式**：test/page.tsx 第 135 行 `showResult && result ? <ResultScreen/> : ...`，是布尔切换，无中间过渡态。A1 真实存在。
3. **stats.typePercentage** 已在用（第 105、159-165 行），但语义是"与你相同的人占全球%"。A3 真实存在。
4. **i18n 文案** 用 `result.*` keys。新增作品介绍字段必然涉及 i18n。

数据足够，所有 7 个歧义都已基于代码事实核实，可以产出契约。

---

# BLUF

spec 第五节本身**清晰且高质量**——揭晓序列时间轴、档案卡结构、分享卡、动效规则表都给出明确锚点。**真正的分叉只有 1 个**（A1 衔接架构），其余 6 处是 spec 留下的"实施细节真空"，需要决策但不构成多个合理 spec 读法。最关键的是 **A1（揭晓序列放哪）+ A3（稀有度数字语义）+ A4（作品介绍字段从哪来）**——这三个一旦定了，下游无需回头。

---

# 意图契约

**核心意图**
把传统结果页（百分比/雷达图/top3）重做为"揭晓时刻"——用错峰动效把紧张感反转为惊喜，用稀有度替代相似度，用角色档案卡承载情绪，用分享卡驱动传播。spec 来源：REDESIGN 第五节（191-282 行）。

**需求（EARS）**

> 来源标记：R-§5.x = REDESIGN 第五节第 x 小节；M-x = interface-details motion 规则；DG-x = 决策门。

### 揭晓序列（R1-R5）

- **R1** 当用户答完最后一题并接收到匹配结果，系统应当播放 6 元素错峰揭晓序列：t=0.0s 答题页模糊淡出 → t=0.8s「审判结束了。」→ t=1.8s「而你是——」→ t=2.4s 角色名浮现 → t=3.0s 标语浮现 → t=3.8s「来自《魔女审判》」→ t=4.2s 角色档案卡完整可用。`[来源：R-§5.3 揭晓序列]` `[假设：时间轴常量提取为可调常量 REVEAL_TIMINGS，默认值为 spec 的 0.8/1.8/2.4/3.0/3.8/4.2，便于实测微调（对应 A6）]`

- **R2** 在揭晓序列播放期间，系统应当允许用户任意点击或按键立即跳过到「角色档案卡完整可用」状态，不强迫等待。`[来源：R-§5.3 + M-11 interruptible]`

- **R3** 系统应当用 motion-7（cross-fade through blur）实现答题页→结果页、角色名浮现的过渡，不得硬切。`[来源：R-§5.6 动效规则清单第 1 行 + M-7]`

- **R4** 系统应当用 ease-out-expo 曲线（cubic-bezier(0.16, 1, 0.3, 1)）贯穿揭晓序列全程，与答题页题目 DNA 一致。`[来源：R-§5.6 决策门#4 consistency + 阶段1 现状 cubic-bezier(0.16,1,0.3,1)]`

- **R5** 如果用户系统设置了 `prefers-reduced-motion: reduce`，则系统应当降级——跳过所有揭晓动画，直接呈现完整角色档案卡（或仅保留单帧淡入）。`[来源：R-§5.6 决策门#3 respect the user]` `[需澄清：降级到什么粒度？见 A7]`

### 角色档案卡（R6-R10）

- **R6** 角色档案卡应当呈现以下 7 个结构元素：角色名（中文大字 + 英文 subtitle）、角色标语、「───── 来自《魔女审判》─────」、一句话作品介绍、第二人称角色描述、灵魂特质（关键词）、稀有度条。`[来源：R-§5.4 角色档案卡 ASCII 图]`

- **R7** 系统应当从角色数据中读取「一句话作品介绍」字段；该字段当前不存在于 `MatchResult` / `PersonalityTypeInput`，需新增。`[来源：R-§5.4 + R-§5.5 跨IP作品介绍]` `[需澄清：字段名、存储位置（PERSONALITY_TYPES vs i18n）、阶段3a 是共用一句还是每角色一句——见 A4]`

- **R8** 系统应当从现有角色数据中读取并展示「第二人称角色描述」和「灵魂特质（关键词）」——对应现有 `MatchResult.desc` 与 `MatchResult.keywords`。`[来源：R-§5.4 + 现状 ResultScreen localized.desc / localized.keywords]` `[假设：阶段3a 复用现有 desc/keywords 字段，不重写文案]`

- **R9** 如果档案卡内容超出单屏视口，系统应当允许滚动并应用 motion-6（bleed blurred edges，滚动边缘模糊延伸到容器边界，不留缝）；如果内容一屏可放下，则不触发滚动相关动效。`[来源：R-§5.6 动效规则清单第 4 行 + M-6]` `[需澄清：档案卡预期高度，是否可滚动——见 A7]`

- **R10** 系统应当呈现「分享我的审判」和「重新审判」两个行动按钮。`[来源：R-§5.4 ASCII 图底部按钮]`

### 稀有度（R11）

- **R11** 系统应当用稀有度替代相似度百分比展示——展示形式为「稀有度：▓▓░░░░░░░░ 全球仅 3.4%」的进度条 + 文案，数字越小越稀有。`[来源：R-§5.2 核心原则第 3 条 + R-§5.4 稀有度行]` `[需澄清：稀有度数字 = stats.typePercentage（直接）？还是 1-typePercentage（反向）？填充条 ▓ 比例如何映射？typePercentage 为空时如何兜底——见 A3]`

### 砍除项（R12-R13）

- **R12** 系统应当从结果页主视图移除所有相似度百分比、维度条（DimensionBar）、雷达图（RadarChart）、top3 排行展示。`[来源：R-§5.2 核心原则第 2 条]` `[需澄清：彻底删除 UI（含详情弹窗 RadarChart/DimensionBar）还是隐藏但保留"查看详细分析"入口——见 A2]`

- **R13** 系统应当从分享卡中移除相似度百分比（RESonance%），仅保留稀有度数字。`[来源：R-§5.7 分享卡 "无相似度百分比"]` `[现状：ResultScreen 第 274 行分享卡仍有 `{result.similarity}%` + RESONANCE，必须改]`

### 分享卡（R14-R15）

- **R14** 分享卡应当包含：钩子文案（如「我接受了灵魂审判」）、角色名、角色标语、「来自《魔女审判》」、稀有度数字、行动召唤（二维码 + 「来接受审判」）。`[来源：R-§5.7 分享卡 ASCII 图]` `[假设：钩子文案"我接受了灵魂审判"作为 i18n key `result.shareHook` 实现，支持后续替换]`

- **R15** 分享卡应当使用角色主题色渐变背景。`[来源：R-§5.7 分享卡 ASCII 图第 1 行]` `[假设：阶段3a 用现有深色主题（#050308 + #d4af37 金色），"角色主题色"差异作为后续打磨——见非目标]`

### 隐藏角色（R16）

- **R16** 如果匹配到隐藏角色（`MatchResult.special === true`），阶段3a 系统**应当**对隐藏角色与普通角色做轻量区分（如多一行特殊文案「……审判庭从未见过这样的受审者」），但**不**实现完整粒子/裂缝光效。`[来源：R-§5.6 动效规则清单 easter-egg-3 标注"可选，先做普通版" + R-§5.6 待定项]` `[需澄清：是完全不做区分（YUKI/ETL 用普通揭晓）还是做轻量文案区分——见 A5]` `[假设：阶段3a 做轻量文案区分，完整粒子裂缝光效列为非目标]`

### 动效规则（R17-R18）

- **R17** 系统应当实现以下必须动效：motion-7（模糊过渡）、motion-18（6 元素错峰）、motion-11（可打断）、motion-6（滚动边缘模糊）、ease-out-expo 贯穿、prefers-reduced-motion 降级。`[来源：R-§5.6 动效规则清单"必须"行]`

- **R18** 系统可以（可选）实现以下动效：motion-3（标语逐字描出 stroke-by-stroke）、motion-22（稀有度环境光呼吸）。如不实现，用对应位置的标准淡入替代。`[来源：R-§5.6 动效规则清单"可选"行]` `[假设：阶段3a 不实现 motion-3/motion-22，用标准淡入替代，以控制工作量]`

### 保留项与 git（R19-R20）

- **R19** 系统应当保留角色匹配核心逻辑、`src/lib/match.ts`（`MatchResult` 含 similarity/top3/userVector/templateVector/borderType/special 为锁死区不动）、分享卡功能、重新审判功能。`[来源：R-§5.2 核心原则第 4 条 + 项目上下文锁死区]` `[关键：UI 不再显示 similarity/top3，但 match.ts 不动，similarity 仍可用于内部追踪如 trackEvent]`

- **R20** 开发应当在独立分支上进行，不在默认分支直接提交；阶段3a 完成后由用户决定合并时机。`[来源：AGENTS.md git 约定]`

**明确的非目标（不做清单）**

- **N1** 阶段3a **不**填充跨 IP（魔法少女小圆/eva/其他）的作品介绍内容——仅魔女审判单一 IP（阶段3a）。`[来源：R-§5.6 待定项第 1 条 + 项目上下文"阶段3a 只单一IP"]`
- **N2** 阶段3a **不**做多语言作品介绍（阶段3a 中文优先）。`[推断自项目上下文 i18n 现状]`
- **N3** 阶段3a **不**做 A/B 测试不同揭晓节奏/文案。
- **N4** 阶段3a **不**做不同 IP 的视觉风格差异——统一视觉，差异作为后续打磨。`[来源：R-§5.6 待定项第 3 条 "第一版统一风格"]`
- **N5** 阶段3a **不**实现隐藏角色完整粒子裂缝光效（easter-egg-3 完整版）。`[来源：R-§5.6 动效清单 "可选，先做普通版"]`
- **N6** 阶段3a **不**改 `src/lib/match.ts` 匹配算法与 `MatchResult` 结构。`[来源：项目上下文锁死区]`

**验收示例（Given/When/Then）**

- **V1（揭晓序列）**：Given 用户答完最后一题并收到匹配结果 `code: HIRO`，When 系统渲染结果页，Then 在 t=0.8s 显示「审判结束了。」、t=1.8s 显示「而你是——」、t=2.4s 角色名「二阶堂希罗」从模糊中浮现、t=4.2s 完整档案卡可交互（按钮可点）。
- **V2（跳过）**：Given 揭晓序列进行到 t=2.0s（角色名尚未出现），When 用户点击屏幕任意位置，Then 立即跳到 t=4.2s 完整档案卡状态，角色名与档案卡同时可见且按钮可点。
- **V3（reduced-motion）**：Given 用户系统 `prefers-reduced-motion: reduce`，When 渲染结果页，Then 不播放任何错峰动画，直接显示完整档案卡。
- **V4（砍除项）**：Given 任意匹配结果，When 结果页渲染完成（揭晓后），Then 主视图不出现「87%」相似度数字、不出现雷达图、不出现维度条、不出现 top3 排行（第二名/第三名 + 百分比）。
- **V5（分享卡）**：Given 用户点击「分享我的审判」，When 分享卡生成，Then 卡片包含「我接受了灵魂审判」钩子、角色名、标语、稀有度数字、行动召唤，且**不**包含 similarity% / RESONANCE 字样。
- **V6（稀有度兜底）**：Given `stats` 为 null（无统计数据），When 渲染档案卡，Then 稀有度行优雅降级（如显示「全球数据收集中」或不显示数字，不崩溃）。`[需澄清：降级文案]`

**开放假设汇总**

- H1：揭晓时间轴提取为可调常量 `REVEAL_TIMINGS`，默认值 = spec 数值（R1）。
- H2：复用现有 `desc` / `keywords` 字段作为档案卡描述与灵魂特质，不重写文案（R8）。
- H3：钩子文案用 i18n key `result.shareHook`，默认值「我接受了灵魂审判」（R14）。
- H4：阶段3a 分享卡用现有深色主题，不做角色主题色差异（R15）。
- H5：阶段3a 不实现 motion-3/motion-22，用标准淡入替代（R18）。
- H6：阶段3a 隐藏角色做轻量文案区分，不做完整粒子彩蛋（R16）。
- H7：match.ts 锁死区不动，similarity 仅保留供 trackEvent 内部用（R19）。

---

# 歧义（分叉——先决定这些）

按风险从高到低。前 3 个会改变组件边界或数据契约，**必须在动工前定**；后 4 个可在实现中决策。

### A1 — 揭晓序列的组件归属（最高风险，影响组件边界 + 状态管理）

- **读法1（内联）**：揭晓序列在 `ResultScreen` 内部实现，`ResultScreen` 挂载即播放序列。`test/page.tsx` 的 `showResult` 切换不变，只是 ResultScreen 顶部多一层「揭晓层」，序列播完后揭晓层消失露出档案卡。**优点**：状态在单组件内闭环，`result` 数据就近可用，改动面小。**缺点**：ResultScreen 变重，揭晓与档案卡耦合。
- **读法2（独立过渡组件）**：新建 `RevealSequence` 组件，插在 TestScreen 和 ResultScreen 之间。`test/page.tsx` 增加 `revealPhase` 状态机（`quiz → revealing → result`），RevealSequence 接收 `result` + `onComplete` 回调。**优点**：职责分离，揭晓逻辑可独立测试与复用。**缺点**：跨组件状态传递（result 从 page 传入），改动面更大。
- **提问**：揭晓序列是 ResultScreen 内部的一个 phase，还是独立组件？**推荐：读法1（内联）**——spec 把揭晓序列明确定义为「结果页第一秒」，是结果页的一部分；result 数据已由 page 持有，内联避免跨组件传递；阶段3a 控制改动面。

### A2 — 砍除项的彻底程度（中风险，影响是否保留入口）

- **读法1（彻底删除）**：删除 `r-stats`（百分比 + top3）、`r-keywords` 行动区里的「详细分析」按钮、整个 `showDetail` 弹窗（含 RadarChart + DimensionBar）。spec 原文「砍掉**所有**百分比/维度条/雷达图/top3 排行」支持此读法。
- **读法2（隐藏保留入口）**：主视图彻底砍，但保留一个「查看详细分析」入口指向现有弹窗。理由是 spec 第一节"痛点的真正根因"提到判决式呈现的问题，但保留弹窗可作为深度用户选项。
- **提问**：详情弹窗（RadarChart + DimensionBar）是彻底删除还是保留入口？**推荐：读法1（彻底删除）**——spec「砍掉所有」措辞明确；保留弹窗会制造"判决书"与"揭晓时刻"并存的认知矛盾，违背核心原则；且 motion-6 边缘模糊等若做需要重新设计，不如彻底重做。`[需用户确认]`

### A3 — 稀有度数字语义（中风险，影响最终展示数字）

- **读法1（直接 = typePercentage）**：稀有度数字 = `stats.typePercentage`，文案「全球仅 3.4%」=「全球仅 typePercentage%」。语义：与你相同的人占全球百分比，越小越稀有。这与现有代码注释一致。
- **读法2（反向 = 1 - typePercentage）**：稀有度 = 1 - typePercentage，把"相似度"翻转。但这会让"全球仅 96.6%"很怪异，不符合 spec 示例「全球仅 3.4%」的直觉。
- **提问**：稀有度数字 = typePercentage（直接，推荐）还是 1-typePercentage？填充条 ▓▓░░░░░░░░ 的填充比例如何映射（如 3.4% 对应几格）？**推荐：读法1（直接）**。但填充条逻辑需用户定：3.4% 是几乎空（极稀有）还是几乎满（强调"你是稀有者"）？spec ASCII 图 `▓▓░░░░░░░░` 是 2 满 8 空——倾向"越稀有填充越少"。`[需用户确认填充映射]`

### A4 — 作品介绍字段来源（中风险，影响数据模型 + i18n）

- **读法1（共用一句）**：所有 15 个角色共用一句魔女审判介绍「一部关于'在死亡回溯中守住一个人'的故事」。存储在 i18n（如 `result.worksIntro.witchTrial`）或 pack 配置（如 `pack.meta.workIntro`）。改动小。
- **读法2（每角色一句）**：在 `PersonalityTypeInput` / `MatchResult` 新增 `workIntro` 字段，每个角色一句。更个性化但需要写 15 句 + 加 DB 列 + admin 编辑器改造。
- **提问**：阶段3a 作品介绍是共用一句魔女审判介绍，还是每角色各自一句？字段存哪？**推荐：读法1（共用一句）+ 字段位置 `pack.meta.workIntro`**——阶段3a 是单一 IP，共用一句符合 spec 第五节「跨IP处理」是「为跨IP预留字段」而非「现在就每角色一句」的语义；pack.meta 存放避免侵入 MatchResult 锁死区；预留每角色 workIntro 字段作为跨IP阶段扩展。`[需用户确认]`

### A5 — 隐藏角色彩蛋的边界（低风险）

- **读法1（完全不做）**：YUKI/ETL 用和普通角色完全一样的揭晓序列，不做任何区分。
- **读法2（轻量文案区分）**：揭晓序列中多一行特殊文案「……审判庭从未见过这样的受审者」，稀有度显示「极少判定 · <0.5%」，但不做粒子/裂缝光效。
- **提问**：阶段3a 隐藏角色完全不做特殊处理还是轻量文案区分？**推荐：读法2（轻量文案区分）**——成本低（只是文案分支 + 稀有度文案分支），但保留了 spec「普通角色克制，隐藏角色戏剧化，形成特殊感」的核心情绪差异，完整光效列为非目标。

### A6 — 揭晓节奏是否可调（低风险）

- **读法1（硬编码）**：直接写 `setTimeout(fn, 800)` 等。
- **读法2（可调常量）**：提取 `const REVEAL_TIMINGS = { pageFadeOut: 0, judgementText: 800, ... }`，便于实测微调。
- **提问**：实现为硬编码还是可调常量？**推荐：读法2（可调常量）**——spec 明确写「4.2s 是否合适需实测」，提取常量零成本但显著降低后续微调成本。

### A7 — 档案卡是否可滚动（低风险，影响 motion-6 适用性）

- **读法1（一屏放下，不滚动）**：档案卡内容精简（角色名 + 标语 + 作品介绍 + 描述 + 特质 + 稀有度 + 按钮），桌面端一屏放下，motion-6 不适用。
- **读法2（可滚动）**：档案卡内容较多或移动端长，需滚动，motion-6 适用。
- **提问**：阶段3a 档案卡预期一屏放下还是可滚动？**推荐：读法1（一屏放下）+ motion-6 降级为"如有滚动则应用"**——spec ASCII 图档案卡内容紧凑，一屏可放下；但移动端可能溢出，motion-6 作为条件动效保留（`@media` 或 `overflow:auto` 时才生效）。这也连带回答了 R5 的 reduced-motion 降级粒度问题。

---

**总结给协调者**：spec 锁定度足够开工，**只需用户回答 A1-A4 四个决策**（A5-A7 我已给出推荐且低风险，可在实现中按推荐执行）。最关键的是 **A1（组件架构）** 和 **A4（作品字段位置）**——这两个决定数据流和字段扩展。建议用 AskUserQuestion 收敛 A1-A4。

相关文件（绝对路径）：
- `/Users/munich/Desktop/独立项目/magical-girls/docs/REDESIGN.md`（191-282 行，spec 第五节）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（288 行，主战场，需重写）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/test/page.tsx`（226 行，第 135 行衔接点）
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/match.ts`（316 行，锁死区，不动）
- `/Users/munich/Desktop/独立项目/magical-girls/src/pack/types.ts`（pack 类型，A4 字段位置候选）
