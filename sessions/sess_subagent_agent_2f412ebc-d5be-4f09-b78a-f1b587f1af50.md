# 你是 red-team，从**可维护性**维度攻击阶段3a 结果页。硬配额：至少 2 个真实问题，或说明为什么更少...

- 会话 ID: `sess_subagent_agent_2f412ebc-d5be-4f09-b78a-f1b587f1af50`
- 时间: 2026-08-07 10:30:47 → 2026-08-07 10:35:27
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 19
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**可维护性**维度攻击阶段3a 结果页。硬配额：至少 2 个真实问题，或说明为什么更少。

## 攻击目标
ResultScreen 288→636行重写。项目要长期演进（阶段2跨IP、阶段3b多语言、阶段3c AB实验）。

## 实现位置（必读）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（636行）
- `/Users/munich/Desktop/独立项目/magical-girls/src/pack/types.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts`

## 契约可维护性要求
- A1：揭晓内联 phase（ResultScreen 自管）
- A4：workIntro 在 pack.meta（跨IP阶段扩展为每角色字段）
- R18：motion-3/22 可选不做，用标准淡入
- 非目标：阶段3a 不做多语言、不做AB、不做不同IP视觉风格

## 攻击方向（可维护性）
1. **ResultScreen 膨胀**：636行单文件含揭晓序列+档案卡+分享卡+reduced-motion+跳过+稀有度逻辑。阶段2跨IP、阶段3c AB实验（不同揭晓节奏/文案）时如何扩展？是否该拆分（RevealSequence/ProfileCard/ShareCard 子组件）？
2. **REVEAL_TIMINGS 硬编码常量**：放在组件内，AB实验要切换节奏时怎么办？是否该从配置/pack/feature flag 读？
3. **i18n 覆盖盲区**：skip 提示"点击任意处跳过"是硬编码中文（实现日志偏离条款记录），非 i18n key。阶段3b 多语言时会漏。还有其它硬编码中文吗？
4. **workIntro 扩展性**：A4 说"跨IP阶段扩展为每角色字段"。现在 workIntro 在 pack 级（所有角色共用一句）。阶段2跨IP时，不同IP的 pack 各自 workIntro，但同一IP内多角色仍共用——这个扩展点够吗？还是要 PersonalityType 加 workIntro？
5. **稀有度逻辑耦合**：稀有度计算（typePercentage/null/special 三分支）+ 填充条映射 + 文案选择全在 ResultScreen。阶段3c AB实验改填充映射时，改组件还是抽函数？
6. **CSS 内联 vs globals.css**：implementer 用大量 inline style。globals.css 有 .r-name/.btn-restart 等可复用 class，但新元素（揭晓层、稀有度条）是 inline。一致性问题？主题切换（角色主题色，R15 提及但非目标）时 inline 难改。
7. **动效与业务逻辑混合**：揭晓 timer 管理（schedule/clearAllTimers）与档案卡渲染在同一组件。动效测试如何做（无单测覆盖揭晓序列）？

## 产出格式
每条：标题 + 具体影响（未来改什么会痛）+ 代码位置 + spec缺口 + 严重度(High/Medium/Low)。
开始攻击。

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
我现在掌握了所有关键证据。让我再进行一次最终验证，以确认所有 `locale` 文件中 `i18n` 键的差异。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
所有证据已收集并验证。以下是可维护性攻击结果。

---

### BLUF
6条已验证发现，其中2条High。最严重：阶段3a新增的12个i18n key只写进了zh-CN.ts，en/ja/zh-TW三个locale文件完全缺失——英语/日语/繁体用户会在揭晓序列看到原始key字符串（如`result.revealJudgement`）而非翻译文本。另外"点击任意处跳过"是硬编码中文，即使zh-CN也无对应key。spec被部分违反（A4 workIntro粒度不足、R18多语言覆盖缺失）。

### 最严重问题
阶段3a揭晓序列12个i18n key在3/4 locale文件中缺失，非中文用户看到原始dot-notation key作为UI文本。

### 发现

- **[F1] 严重度：High — `src/i18n/en.ts` + `src/i18n/ja.ts` + `src/i18n/zh-TW.ts`**
  - **影响：** zh-CN.ts新增了12个phase3a key（`revealJudgement`, `revealTransition`, `revealFrom`, `rarityLabel`, `rarityGlobal`, `rarityCollecting`, `rarityRare`, `workIntroLabel`, `soulTraits`, `shareHook`, `shareCta`, `hiddenReveal`），但en.ts、ja.ts、zh-TW.ts中这12个key全部不存在。i18n `t()` 函数（`src/lib/i18n.ts:78`）在key缺失时返回原始key字符串——英语用户在揭晓序列看到`result.revealJudgement`而非"The trial is over."，稀有度区看到`result.rarityLabel`而非"RARITY"，分享卡看到`result.shareHook`而非"I underwent the soul trial."。这是3/4 locale的全屏UI文本损坏。
  - **复现：** 切换浏览器语言为English → 完成测试 → 进入ResultScreen → 揭晓序列5个文本元素全部显示为`result.xxx`原始key；档案卡稀有度标签、灵魂特质标签、分享卡CTA文案同理损坏。
  - **Spec 缺口？：** 是——spec非目标"阶段3a不做多语言"指的是不在phase3a**新增locale文件**，而非"新增的key可以不在已有locale中补齐"。现有4个locale文件都已存在，phase3a代码引用了这些key，每个locale必须覆盖。
  - **修复方向：** 在en.ts/ja.ts/zh-TW.ts的`result`对象中补齐12个key的翻译。

- **[F2] 严重度：High — `src/components/ResultScreen.tsx:439`**
  - **影响：** 揭晓层跳过提示"点击任意处跳过"是硬编码中文字面量，不存在于任何i18n key（zh-CN.ts中无`result.revealSkip`或类似key）。该文本在`revealPhase === "revealing" && !prefersReducedMotion`条件为true时渲染，对非中文用户始终显示中文。这是F1之外的额外i18n盲区——即使补齐了12个key，这条仍漏。
  - **复现：** 任何非zh-CN locale用户进入揭晓序列 → 底部出现"点击任意处跳过"中文 → 切换英文locale后依然是中文。
  - **Spec 缺口？：** 是——与F1同理，代码对多locale用户可达但文本不可本地化。
  - **修复方向：** 在4个locale文件添加`result.revealSkip`key，将line 439替换为`{t("result.revealSkip")}`。

- **[F3] 严重度：Medium — `src/components/ResultScreen.tsx:12-20`**
  - **影响：** `REVEAL_TIMINGS`作为`as const`对象硬编码在组件顶层，无法从pack、feature flag或AB实验配置覆盖。阶段3c AB实验若需对比"快节奏揭晓(400/900/1200ms)"vs"慢节奏揭晓(800/1800/2400ms)"，开发者必须：(a)在此组件内添加条件分支（每新增一个实验变体增加一层if），(b)复制整个组件，或(c)重构常量位置。选项(a)使组件继续膨胀，选项(b)造成代码重复，选项(c)本应在初始实现时完成。
  - **复现：** 阶段3c需要新增一个`REVEAL_TIMINGS_FAST`变体 → 必须修改ResultScreen.tsx内部 → 每个实验变体的timing配置散落在同一个文件中。
  - **Spec 缺口？：** 否——A1说"ResultScreen自管"，但"自管"不等于"硬编码"；纯代码缺陷。
  - **修复方向：** 将REVEAL_TIMINGS移至pack配置或extract为参数，使AB实验可注入不同timing而不改组件代码。

- **[F4] 严重度：Medium — `src/components/ResultScreen.tsx:70-636`（整个组件函数体）**
  - **影响：** 566行函数体混合5个独立关注点：揭晓状态机(70-183)、分享图片生成(185-230)、稀有度/workIntro计算(232-252)、档案卡JSX(257-404)、揭晓层JSX(406-517)、分享卡JSX(519-636)。阶段2跨IP需替换揭晓序列风格，阶段3c AB需不同档案卡布局——每种变体在此单函数内增加条件分支，使636行增长到900+，且多人并行开发时此文件必成merge冲突热点。
  - **复现：** 阶段2新增IP-B的揭晓序列（不同文案/节奏）→ 在line 102-133的useEffect内添加IP分支 → 在line 410-517的JSX内添加IP条件渲染 → 同一文件同时承载2个IP的揭晓逻辑。
  - **Spec 缺口？：** 否——纯架构缺陷，spec未规定文件组织方式。
  - **修复方向：** 提取RevealOverlay(状态机+揭晓层JSX)、ProfileCard(档案卡JSX)、ShareCard(分享卡JSX)为独立子组件，ResultScreen仅做组合。

- **[F5] 严重度：Medium — `src/components/ResultScreen.tsx` 全文件 41处inline style vs 9处className**
  - **影响：** 阶段3a前的元素复用globals.css class（`.r-name`、`.r-slogan`等），这些class在globals.css中有`@media (max-width:768px)`响应式覆盖（如`.r-name { font-size: clamp(2.5rem, 12vw, 4.5rem); }`）。阶段3a新增的元素（揭晓层、稀有度条、workIntro区、分享卡、edge blur遮罩）全部使用inline style，无法被CSS @media规则覆盖。移动端下这些元素无响应式适配——稀有度条在小屏可能溢出，分享卡390px固定宽度在小屏可能截断。
  - **复现：** 打开DevTools设备模拟 → iPhone SE (375px宽) → 稀有度条、workIntro区无响应式缩放 → 分享卡固定390px宽超出视口。
  - **Spec 缺口？：** 否——纯代码缺陷。
  - **修复方向：** 将phase3a新增元素的共享样式提取到globals.css（如`.reveal-overlay`、`.rarity-bar`、`.work-intro`），保留inline style仅用于动态值（opacity/transform/width百分比）。

- **[F6] 严重度：Low — `src/pack/types.ts:66` + `src/content/packs/witch-trial/index.ts:44`**
  - **影响：** A4 spec原文"作品介绍（角色档案卡'一句话作品介绍'，跨IP阶段可扩展为每角色字段）"。当前`workIntro`定义在`QuizPack`接口上（所有角色共用一句），witch-trial pack设为"一部关于「在死亡回溯中守住一个人」的故事"——这实际上是Hiro的专属剧情，而非13个角色的通用描述。阶段2跨IP时不同pack可各自设workIntro，但同一IP内YUKI（百年复仇者）和EMMA（不灭的希望）共用一句关于"死亡回溯守住一个人"的介绍，语义不匹配。
  - **复现：** 被判定为YUKI → 档案卡显示"一部关于「在死亡回溯中守住一个人」的故事" → 但YUKI的故事是"跨越百年的复仇"，与"守住一个人"语义冲突。
  - **Spec 缺口？：** 是——spec说"扩展为每角色字段"，但实现是每pack字段，粒度差一级。
  - **修复方向：** 在QuizPack.types中将`workIntro?: string`改为`workIntro?: string | Record<PersonalityCode, string>`，或移至PersonalityType定义。

### Spec 覆盖检查
- **A1（揭晓内联phase ResultScreen自管）：** ✓ 覆盖——revealPhase/revealVis/revealLayerOut状态自管，无外部依赖。但"自管"不意味着timing硬编码（见F3）。
- **A4（workIntro在pack.meta，跨IP扩展为每角色字段）：** ⚠ 部分——workIntro在pack级存在，但"每角色字段"扩展未实现，当前粒度是per-pack而非per-personality（见F6）。
- **R18（motion可选不做，用标准淡入）：** ✓ 覆盖——prefersReducedMotion路径直接跳到done，不播放动效。
- **非目标（阶段3a不做多语言）：** ✗ 缺失——"不做多语言"不应解释为"新增key不补齐已有locale"。4个locale文件已存在，phase3a代码引用了12个新key，其中3个locale完全缺失（见F1、F2）。

### 值得追的线索（不计入K）
- globals.css中`.r-name`定义了`font-size: clamp(3.5rem, 8vw, 7rem)`，但ResultScreen line 287用inline style覆盖为`font-size: clamp(2.5rem, 10vw, 5rem)`。两处值不同——globals.css的响应式override可能被inline style静默覆盖，导致移动端字号比预期大。无法完全验证这是有意覆盖还是遗留冲突，值得追。

### 裁决
6条真实发现已报告（2 High + 3 Medium + 1 Low），超过硬配额K=2。可维护性攻击面在i18n覆盖缺口和组件架构膨胀方面产出充分。
