# 50-redblue/summary — 视觉回归基线红/蓝循环摘要

> 2026-08-10。T2 单轮红蓝。

## 第1轮

**红方**：正确性 + 可维护性两维度并行，共 6 条发现。
**fp-judge**：6 条全成立（1 TRUE_POSITIVE×2 独立印证 + 2 LIKELY_TP + 1 BORDERLINE + 1 TRUE_POSITIVE），0 假阳性。红方高度可靠。

**蓝方处置**（全部修复）：

| # | 发现 | 处置 | 验证 |
|---|---|---|---|
| F1 | 基线路径 `__screenshots__/` 不存在（三重不一致） | 加 project 级 snapshotPathTemplate `{snapshotDir}/{testFileDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}`，基线实际存入 `__screenshots__/` | ✓ 7 基线全在 `tests/visual/__screenshots__/`，git check-ignore 未忽略 |
| F2 | test spec 只查首个 opt-block opacity | 改 evaluateAll 全量检查所有 .opt-block opacity===1 | ✓ TS 无错 + test 基线全绿 |
| F3 | README 容差策略与 result maxDiffPixelRatio 矛盾 | README 容差节加「例外（R11）」登记 result 的 0.02 + 注释 1%→2% | ✓ 文档一致 |
| F4 | README 写 addInitScript 实际是 lang-btn click | README 覆盖范围表改「L2 显式点 lang-btn」+ L2 描述更新 | ✓ 文档一致 |
| F5 | kanji ghost scramble 未覆盖（无 data-scramble） | maskWelcomeDynamic 加 `.giant-text.kanji`（不改业务代码，opacity:0.06 视觉损失可忽略） | ✓ welcome 基线全绿 |
| F6 | waitForTimeout(300) 注释"一帧"误导 | 注释改「等 ~300ms 让 React 状态传播 + DOM 重排」 | ✓ 注释准确 |

**循环决策**：单轮足够——6 条全修复且验证通过，无需第2轮红方。

## 最终验证

- `npx playwright test --project=visual --project=visual-mobile`：7 passed, 3 skipped
- TS 无错
- 7 基线全在 `tests/visual/__screenshots__/`
- .gitignore 反向规则有效（git check-ignore 不忽略基线）
- 普通 chromium project：108 e2e，0 visual 混入
