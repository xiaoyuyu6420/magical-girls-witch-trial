# 50-redblue/round-1 — 视觉回归基线红/蓝对抗第1轮

> 2026-08-10。T2 级别：正确性 + 可维护性两维度并行红方，单轮。

## 红方发现 + fp-judge 裁决

| # | 发现 | 红方严重度 | fp-judge 裁决 | 校准后 |
|---|---|---|---|---|
| F1 | 基线路径三重不一致（`__screenshots__/` 不存在，实际 `<spec>-snapshots/`，靠 `!tests/visual/**` 兜底） | Critical/High | TRUE_POSITIVE | High（必修） |
| F2 | test spec 只查首个 opt-block opacity，漏 stagger 延迟 | High | LIKELY_TP | Medium |
| F3 | README 容差策略与 result maxDiffPixelRatio:0.02 矛盾 + 注释 1% vs 值 2% | High | TRUE_POSITIVE | Low |
| F4 | README 写 addInitScript 但实际是 lang-btn click | High | TRUE_POSITIVE | Low |
| F5 | kanji ghost scramble 未覆盖（无 data-scramble 属性） | Medium | LIKELY_TP | Medium |
| F6 | waitForTimeout(300) 注释"一帧"误导 | Medium | BORDERLINE | Nit（可选） |

**红方可靠性**：6 条全成立，0 假阳性，无编造。F1 被两个红方独立报告（高置信）。

## 蓝方处置（见下文实施）

- F1：加 project 级 snapshotPathTemplate 让基线实际存入 `tests/visual/__screenshots__/`，对齐契约 R2。
- F2：opt-block 轮询改为 evaluateAll 全量检查。
- F3：README 容差节登记 result 例外 + 修注释 1%→2%。
- F4：README 覆盖范围表改 addInitScript 为 lang-btn click。
- F5：maskWelcomeDynamic 加 `.giant-text.kanji`（不改 public/index.html 业务代码，用 mask 覆盖）。
- F6：改注释措辞（一并修）。
