# 50-redblue/round-1 — 红方发现 + fp-judge 裁决

> 4 维度红方并行攻击（正确性/模板化/跨IP/可读性），共报 19 个发现。fp-judge 裁决如下。

## 裁决汇总

| # | 发现 | 维度 | 裁决 | 严重度 | 处置 |
|---|------|------|------|--------|------|
| 1 | Q15 B1 承认态 score3 措辞"等对方先迈步"=封闭(L) 与 score3(H开放)冲突 | 正确性 | **TRUE_POSITIVE** | CRITICAL | 蓝方修复 |
| 2 | Q7 B2 承认态措辞"问自己不够好"=自我怀疑 削弱高敏感信号 | 正确性 | **LIKELY_TP** | MAJOR | 蓝方修复 |
| 3 | "你说得对/被你说中"开头 5 次 > 配额 ≤3 | 正确性+模板 | **TRUE_POSITIVE** | MAJOR | 蓝方修复 |
| 4 | 否认态"不对。"开头 19/21=90% 新模板 | 模板化 | **TRUE_POSITIVE** | CRITICAL | 蓝方修复 |
| 5 | 承认态"……是。"开头 12/21=57% + 后段 5 连续 | 模板化 | **TRUE_POSITIVE** | CRITICAL | 蓝方修复 |
| 6 | 承认态省略号开头 19/21=90% 标点绑定 | 模板化 | **LIKELY_TP** | MAJOR | 蓝方一并修（与 #5 同处置） |
| 7 | factorResonance key 名残留（值已改"灵魂共鸣"） | 跨IP | **OUT_OF_SCOPE** | — | 不修（key 名是逻辑字段非文案，R2 保护；改 key 需动 pack/index.ts 引用，超范围） |
| 8 | tierLabels 含"侵蚀"（DimensionBar 死组件未渲染） | 跨IP | **FALSE_POSITIVE** | — | 不修（死组件零 import，未渲染给用户；tierLabels 在 pack 内部配置层非 i18n 文案层） |
| 9 | en/ja/zh-TW 死代码区填满 vs zh-CN 空骨架 | 跨IP | **FALSE_POSITIVE** | — | 不修（红方误判：en/ja/zh-TW 的 questions 是 seed-translations 翻译源，必须填满；只有 zh-CN 是死代码区。架构事实已核实） |
| 10 | YUKI subtitle"大魔女"在跨 pack 共用数组 | 跨IP | **OUT_OF_SCOPE** | — | 不修（YUKI 是 witch-trial 角色，subtitle 是角色设定，PERSONALITY_TYPES 本就是 witch-trial 主 pack 库；R2 保护 subtitle） |
| 11 | zh-CN result 区 statsInfo/factorResonance 用百分比=相似度语义 | 跨IP+可读性 | **LIKELY_TP** | MAJOR | 蓝方修复（值改稀有度叙事）但保留 key 名 |
| 12 | Q5/Q9 指控偏抽象 缺具体细节 | 可读性 | **LIKELY_TP** | MINOR | 蓝方修复 |
| 13 | Q21/Q24 三态声部温差不足 中间≈承认 | 可读性 | **LIKELY_TP** | MINOR | 蓝方修复 |
| 14 | 21 desc 中 20 个"你"开头 3 个"你一"撞车 | 可读性 | **FALSE_POSITIVE** | — | 不修（契约判定 5 要求"首句两两不同"已满足，前 6 字无重复；"你"开头是第二人称契约 R6 的合理体现，不是模板） |
| 15 | MAMI/NOAH/MERURU slogan 钩子偏弱 | 可读性 | **LIKELY_TP** | MINOR | 蓝方修复（仅这 3 条） |
| 16 | result 区 ideal/analysis/dimAnalysis 孤儿 key | 可读性 | **FALSE_POSITIVE** | — | 不修（REDESIGN 阶段3a 揭晓时刻仍在迭代，这些 key 被 pack/index.ts presentation 引用是活 key，非孤儿） |
| 17 | 审判官批注缺文案 | 可读性 | **OUT_OF_SCOPE** | — | 不修（批注功能在 src/lib/annotations.ts 已实现，文案在组件层非 i18n；超本次文案范围） |
| 18 | 砝码编码/score 映射正确 | 正确性 | （通过项） | — | — |
| 19 | 顺序/天平/门控/触发全正确 | 正确性 | （通过项） | — | — |

## TRUE_POSITIVE + LIKELY_TP 清单（送蓝方）

- **CRITICAL**: #1 Q15 score-语义反转、#4 否认"不对。"模板、#5 承认"……是。"模板
- **MAJOR**: #2 Q7 承认态信号弱化、#3 "你说得对"超配额、#6 省略号绑定（与#5合并）、#11 相似度语义残留
- **MINOR**: #12 Q5/Q9 细节、#13 Q21/Q24 温差、#15 slogan 钩子

## 蓝方处置记录（追加）

| # | 发现 | 蓝方处置 | 编排者验证 |
|---|------|---------|-----------|
| 1 | Q15 score-语义反转 | ✅ 已修复（opt3 改"先开口的凭什么不能是我——信任先递出去"）| gates G0 绿（score 未动），措辞方向匹配 H 开放 ✅ |
| 2 | Q7 承认态弱化 | ✅ 已修复（opt3 改"你戳准了。刀扎进来那一刻我整个人在发抖"）| gates G0 绿，措辞=高敏感 ✅ |
| 3 | "你说得对"超配额 | ✅ 已修复（5→2 你说得对 + 1 被你说中 = 3）| gates G1 实测"你说得对开头=2" ✅ |
| 4 | 否认"不对。"模板 | ✅ 已修复（19→1，21 种差异化起手词）| 独立验证 rg 计数=1 ✅ |
| 5 | 承认"……是。"模板 | ✅ 已修复（12→0，省略号绑定 100%→52%）| 独立验证 rg 计数=0 ✅ |
| 6 | 省略号绑定（并入 #5）| ✅ 同上 | ✅ |
| 11 | 相似度语义残留 | ✅ 已修复（statsInfo/factorResonance 去百分比，改序号/绝对数叙事；rarityGlobal 保留）| 四语言同步 ✅ |
| 12 | Q5/Q9 细节 | ✅ 已修复（补储物柜/护身符/秘密具体细节）| gates G2 长度绿 ✅ |
| 13 | Q21/Q24 温差 | ✅ 已修复（中间=理性掌控/承认=主动迎刀）| ✅ |
| 15 | 3 条 slogan 钩子 | ✅ 已修复（MAMI/NOAH/MERURU 重写）| 四语言同步 + zh-CN types 同步 ✅ |

**全部已验证发现处置完成。** 四语言同步（en/ja/zh-TW 按中文最新版 7 类改动同步）+ 顺手修复 en Q15 中间态 "fill in" 占位符残留。

## 最终验证（编排者独立跑）

- gates：`[PASS] 全部闸门通过 ✓`（G0-G4 全绿）
- vitest：58/58 通过
- tsc：exit 0
- 全仓占位符残留：0
