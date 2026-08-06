# Content Packs（L1）

本项目把「可替换的测验内容/规则」收敛为 **Content Pack**，引擎（match / 答题流 / admin）保持稳定。

## 当前

- 唯一 active pack：`witch-trial`（`src/content/packs/witch-trial/`）
- 题目与人格正文仍在 `src/data/quiz-content.ts` + DB（便于 seed/admin Excel）
- 维度 / 权重 / 算法阈值 / gate 规则 / 展示策略在 pack 的 `config.ts` + `index.ts`

## 切换 pack

```bash
ACTIVE_PACK=witch-trial pnpm dev
```

新增主题时：

1. 复制 `src/content/packs/witch-trial/` 为新 id
2. 改 `dimensions` / `weights` / `rules` / `presentation`
3. 在 `src/pack/load.ts` 的 `PACKS` 注册
4. 准备对应题目/人格内容 + seed

## 反识破相关 pack 能力

| 字段 | 含义 |
|------|------|
| `rules.optionShuffle` | `stable-by-question-id`：选项位置≠分数 |
| `presentation.hideTechnicalVectors` | 结果页不展示 userVector 技术串 |
| `presentation.tierLabels` | 档位叙事名 |
| `rules.specialTriggers` | 显式特殊人格映射 |

## 重建题库（分数修正后）

```bash
FORCE_RESEED=1 pnpm exec tsx prisma/seed.ts
```
