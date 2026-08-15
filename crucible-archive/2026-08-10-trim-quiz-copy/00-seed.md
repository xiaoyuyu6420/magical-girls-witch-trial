# 00-seed — 题目文案精简

## 目标

精简 magical-girls-witch-trial 的**题目文案**（24 questions + 1 gate + 1 trigger），在不失去「挑战者审讯体」调性的前提下，温和精简约 30%。

## 用户决策（2026-08-10 AskUserQuestion 确认）

1. **范围**：只精简题目（questions/gate/trigger）。批注、prologue、结果页标签保持不动（已很短，硬删伤调性）。
2. **力度**：温和 ~30%——去掉冗余场景铺陈，保留核心审讯句式（"你…对吧？"）、省略号、二分悖论、破折号。骨架不动。
3. **语言**：只 zh-CN。其他 locale（en/ja/zh-TW）是第三人称叙事体，调性不同，标记 TODO 后续处理。

## Spec 来源

- 项目根 `spec.md`
- `docs/REDESIGN.md`
- `src/i18n/zh-CN.ts`（题目文案前端源）
- `src/data/quiz-content.ts`（题目文案 DB 种子源——待确认与前端源关系）

## 项目类型

已有项目（文案精简，非新建）。

## 路由结果

- **level: T2**（单模块内——i18n 题目文案，边界清晰）
- **type: refactor**（行为不变的文案重构——题型逻辑/评分/选项格式不变，只动文字）
