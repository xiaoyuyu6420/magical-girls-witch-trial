# 00-seed — 魔女审判 → 灵魂审判器（阶段1：核心体验）

## 目标

按照 `docs/REDESIGN.md` 修改本项目，实现**阶段1：核心体验**（REDESIGN 第八节）。

阶段1 范围（三件，可独立验证，"面对自己"的核心体验立住）：
1. **题目改写**：现有 26 题全部改写为"审判官灵魂拷问模式"（zh-CN）。心理指向从"替角色做决定（扮演）"翻转成"被审判官逼视自己（面对）"。
2. **维度抽象化**：现有 12 维度去魔女味命名，改为通用心理维度命名（IP无关）。测量逻辑和分值不变，加权曼哈顿距离算法复用，现有角色向量数值不变（只改维度名）。
3. **审判官批注 + 交互变奏**：第 5/10/15 题后的行为素描批注（非维度标签、非角色、非百分比，防剧透）；天平题（第 8/22 题，二选一迫选，左右对峙）；砝码题（第 14 题，拖拽分配，总和=3）。

**明确不在阶段1范围**（归后续阶段）：
- 跨 IP 扩展（pack 多 IP、小圆接入等）——前置需 IP 版权合规决策（开放问题）。
- 结果页揭晓时刻重做（REDESIGN 第五节）——属阶段3。
- 多语言（en/ja/zh-TW）翻译——属阶段3。阶段1 只保证 zh-CN。
- A/B 实验设施——属阶段3。

每个有意义的版本都要 git commit（用户要求"每个版本都要 git"）。

## Spec 来源

`docs/REDESIGN.md`（sha256 前12位: `4d7f3b816843`）——完整的产品重构方案，阶段1 范围见第八节。

## 项目上下文

- Next.js 16.2.4 + React 19 + TypeScript + Prisma + Vitest 的现有人格测试项目（"魔女审判"）。
- 关键文件：
  - `src/data/quiz-content.ts` — 26 题题库 + 维度定义 + 角色库（魔女审判 13+2）。
  - `src/lib/match.ts` — 加权曼哈顿距离匹配算法（阶段1 复用）。
  - `src/lib/answer-processor.ts` — 答题处理。
  - `src/components/TestScreen.tsx` — 答题页。
  - `src/components/ResultScreen.tsx` — 结果页（阶段1 不重做，但维度展示需跟随维度改名）。
  - `src/i18n/zh-CN.ts` — 中文文案。
  - `src/content/packs/witch-trial/` — 魔女审判内容包。
- 现有测试：`src/data/quiz-content.scores.test.ts`、`src/lib/match.test.ts`、`src/lib/answer-processor.test.ts`、`src/pack/shuffle.test.ts`。
- 维度当前命名（魔女味）：S1严厉度/S2直觉度/S3宽恕度/F1复仇心/F2绝望度/F3执念度/B1信任度/B2背叛感/B3犠牲度/W1压抑力/W2理性力/W3本能度。

## 项目类型

已有项目（重构，不是从零）。
