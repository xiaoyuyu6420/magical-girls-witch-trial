# 00-seed

## Goal
改进「魔女审判」人格测试，让用户在答题与结果体验中**不能一眼看出算法**，同时保持现有产品可玩性、结果可信度与可维护性。

用户原话：
> 你看看有什么地方能改进的，我觉得类似这种测试不能让人一眼看出来算法

## Context
- 已有项目：Next.js 16 + Prisma/SQLite 人格测试站
- 核心算法：12 维向量 + 加权曼哈顿距离 + gate/trigger 特殊人格 + 边界兜底
- 关键代码：
  - `src/lib/match.ts`
  - `src/lib/answer-processor.ts`
  - `src/data/quiz-content.ts`
  - `src/app/api/quiz/route.ts`
  - `src/app/api/match/route.ts`
  - `src/components/TestScreen.tsx`
  - `src/components/ResultScreen.tsx`

## Spec source
- 主规格：`SPEC.md`
- 产品 README：`README.md`
- 对话上下文：用户希望测试“不能让人一眼看出来算法”

## Observed algorithm-leak risks (seed notes, not decisions)
1. 普通题选项 score 基本是固定 1/2/3 且选项顺序常与分数方向一致，语义上容易被识破
2. “反向校验题”注释存在，但 helper `Q()` 仍是 `score: i + 1`，未必真正反向
3. 题目顺序前 12 题按维度整齐铺开，结构感强
4. 结果页暴露 userVector/templateVector、维度条、top3 相似度，可能把算法结构摊开
5. `/api/quiz` 返回 `dimensions` 与 `weights`，前端可能拿到权重
6. 特殊人格 `SPECIAL_A` 映射依赖 specialTypes 顺序
7. SPEC 与代码的边界阈值不一致：SPEC `Δ=8% / T=55%`，代码 `delta=3 / threshold=40`

## Non-goals (seed draft)
- 不改成纯娱乐随机结果
- 不放弃服务端重算与防篡改
- 不把项目改造成通用 MBTI 平台
