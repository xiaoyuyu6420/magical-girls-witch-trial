# 40-implementation — 题目文案去 IP 化（L4 日志）

## BLUF

响应用户新需求——题目文案彻底去 IP 化（用户选"全案去场景"）。26 道题（24 normal + 1 gate + 1 trigger）的所有魔女审判作品专属词（因子/侵蚀/魔女化/残骸/魔法/使魔/典狱长/大魔女/安息仪式/仪器/机械女声）和审讯场景框架（审了这么久/这座岛/监牢/逃离的船/潮水）全部替换为通用心理词，使这份跨 IP 共用的题库能为小圆/madoka 等其他 pack 服务。每题心理语义、三档选项方向、评分编码（dim/score/type/renderType/value/trigger/weight）零改动。

**验证**：tsc ✅ / DB seed ✅（26 questions，0 处 IP 词残留）/ unit 58 全绿 ✅ / 结构完整性 ✅（tsx 验证 score/value/trigger）/ e2e 因预先存在的 `useI18n` build 问题无法独立验证（见下文）。

## 上下文：为什么去 IP 化

- **契约变更**：原 F3 要求"保留因子/侵蚀/残骸等世界观词"，用户本轮明确推翻——项目定位是跨 IP 平台（REDESIGN.md 已规划维度层 IP 无关化、已有 witch-trial + madoka 两个 pack），但题目文案层还全是魔女世界观词，小圆用户做题会看不懂"因子"。
- **架构事实**：`src/data/quiz-content.ts` 的 QUESTIONS 数组是跨 pack 共用题库（pack README：一份题目 + DB seed），不是 witch-trial 专属。
- **范围边界**：只改 QUESTIONS 数组（题目区）。PERSONALITY_TYPES（角色描述）是 pack 专属角色定义层——角色本就分 pack（witch-trial 的角色描述带魔女味是正确的），不在本任务范围。
- **死代码**：`zh-CN.ts` 的 questions/gate/trigger 节不参与渲染（已加注释），无需同步改文案。

## 替换映射表

| 原词（IP 专属） | 替换为（通用） | 出现处 |
|-----------------|---------------|--------|
| 因子侵蚀 / 因子侵蚀率 | 失控 / 崩溃 / 临界线 | S1觉醒、B3牺牲、F1宿怨 o1、W1面具等 |
| 因子感应 / 因子排斥 | 凭空臆断 / 本能排斥 | S2低语 o1/o3 |
| 因子波动 | 情绪（平稳/不稳） | W1面具 o1 |
| 因子在血管里涌动 | 某种东西在你体内涌动 | W3本能 |
| 因子吞噬 | 执念吞噬 / 情绪吞噬 | W1共鸣 o3、F3抗拒 o3 |
| 因子急剧涌动 | （删除，用"脑袋空白"承接） | F2深渊 o3 |
| 因子共鸣（恐惧中） | 浑身发冷 | S2传闻 o3 |
| 因子侵蚀（抽象代价） | 反噬 / 良心过不去 | S1镜像 o3 |
| 魔女化 | 失控 / 万劫不复 | W3本能、W3余波 |
| 化成残骸 / 变成残骸 | 彻底垮掉 / 变成空壳 / 最痛恨的样子 | F2崩塌、S3慈悲 o3、W3余波 o1 |
| 用魔法分担侵蚀 | 替她扛下一切 | B3牺牲 |
| 魔法能力 | 全部底牌 | B1赌局 |
| 向典狱长汇报 | 出卖你们 | B2背叛 |
| 典狱长的监视 | 安排好的 | S3告白 |
| 大魔女间谍 | 内鬼 | S2传闻 |
| 魔女安息仪式 | 牺牲才能结束 | F2深渊 |
| 仪器判你 / 机械女声 | 你心里清楚自己 / 那个声音 | S1觉醒 |
| 逃离这座岛 / 打破这座岛 | 走到最后 / 一起走下去 | B1赌局 |
| 这座岛上 | 这世上 | B1邂逅 o3 |
| 审了这么久 | 问题快问完了 | GATE |
| 逃离的船 / 潮水只涨这一次 | 机会就在眼前 / 只有一次 | B3出口 |
| 因子暴走 | 彻底失控 | F2崩塌、W3余波 |
| 注释里的"侵蚀·悖论" | "执念·悖论" | 砝码题注释 |

## 不变量（全部保持）

- 26 题（24 normal + 1 gate + 1 trigger）结构
- 每题 dim / score / type / renderType / value / trigger / weight 编码
- 三档选项语义方向（反驳/中间/承认）
- 调性承重元素：第二人称"你"、"……对吧？"、省略号、破折号、二分悖论、挑战者语气
- 通用心理测量词汇（信任/背叛/牺牲/执念/绝望/压抑/本能/宽恕等）

## 附带修复

### 1. playwright webServer 强制 reseed
`playwright.config.ts` webServer command 原为 `npx prisma db seed`（不带 FORCE_RESEED），DB 有题就跳过 → e2e 永远测旧文案。改为 `FORCE_RESEED=1 npx prisma db seed` + env 加 `FORCE_RESEED: "1"`，保证源文件即所见。

### 2. 测试锚点同步（上轮遗留）
`quiz-content.scores.test.ts` 两处断言锁的是被精简掉的虚词（"就"/"了"），已更新为当前文案精确子串。

## e2e 验证状态（诚实报告）

e2e 无法在本轮独立验证。原因：**预先存在的 build 问题**——`DisclaimerFooter` 组件用了 `useI18n` 但页面 SSR 时无 `I18nProvider` 包裹，导致 `npm run build`（standalone 模式）和 dev server 的 `/test` 页都报 500。

- stash 验证：clean HEAD 也复现同一错误（`useI18n must be used within I18nProvider`），确认与文案改动无关。
- 之前 e2e 的 106 passed 依赖缓存的 standalone build；本轮杀掉旧 server 后无法重建。
- 该 build bug 超出文案任务范围，标记为后续待修。

**替代验证**：用 `tsx` 直接 import QUESTIONS 数组，验证结构完整性——26 题、0 处 IP 词残留、所有 normal 题有 score、gate 4 value 完整、trigger SPECIAL_A 完整。

## 并行度段落

T2 单模块（QUESTIONS 数组），无机器接缝 → 主上下文直接实现，未并行（纪律 F 正当理由）。
