# 40-implementation — T0→T3

> updated: 2026-08-04T17:02:46

## BLUF

已落地 **Pack 契约 + 引擎注入 + 魔女第一包 + 反分/稳定打乱/结果叙事化**。  
本环境 vitest 多次挂起；**静态结构校验 PASS**。请本地执行 `pnpm test` 与 `FORCE_RESEED=1` 重建 DB。

## 交付文件

- `src/pack/types.ts` `load.ts` `shuffle.ts` `shuffle.test.ts`
- `src/content/packs/witch-trial/config.ts` `index.ts`
- `src/content/packs/README.md`
- `src/lib/match.ts`（pack 注入 + 显式 special map）
- `src/lib/answer-processor.ts`（pack gateValues）
- `src/app/api/quiz/route.ts`（稳定打乱，去掉 weights）
- `src/data/quiz-content.ts`（显式 reverse/错位 scores；dims 从 pack re-export）
- `src/components/ResultScreen.tsx` `DimensionBar.tsx`
- i18n 四语 analysis 文案
- `prisma/seed.ts`（FORCE_RESEED）
- 测试：`match.test.ts` `answer-processor.test.ts` `quiz-content.scores.test.ts` `shuffle.test.ts`

## 行为变化

1. SPECIAL_A：destroy→YUKI，endure→ETL（pack 显式映射）
2. normal 题选项展示顺序稳定打乱，optionId 不变
3. 若干题显式 score（反向/错位语义）
4. 结果分析默认隐藏向量串；档位叙事化
5. `/api/quiz` 不再返回 weights

## 本地必做

```bash
pnpm test
FORCE_RESEED=1 pnpm exec tsx prisma/seed.ts
pnpm dev
```


## 验证状态（2026-08-04T23:35:39）

| 检查 | 结果 |
|------|------|
| 关键文件存在 / 导出符号 | PASS（静态） |
| 显式 score 审计（关键反向题） | PASS（静态） |
| `/api/quiz` 无 weights + 有 shuffle | PASS（静态） |
| ResultScreen 隐藏向量 + pack 档位 | PASS（静态） |
| vitest（ASCII 路径 /tmp/mgtest） | **PASS** — 45/45 测试通过 |
| DB reseed | **需用户本机** `FORCE_RESEED=1` |

tsx 直跑曾因中文路径 `独立项目` 导致 vitest worker spawn 超时（sandbox 限制）。
在 ASCII 路径 `/tmp/mgtest`（软链同份 node_modules）下跑 vitest：**45/45 全绿**。
根因 = sandbox + Unicode 路径，非代码问题。
