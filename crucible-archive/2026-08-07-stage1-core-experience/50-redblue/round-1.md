# 红方报告 Round 1 — 阶段1

> 3个红方（正确性/安全/可维护性）并行攻击，共 8 条发现。

## 正确性维度（3条）

### C-F1 [Critical] 天平题Q22 score方向未反转，违反A3
- 位置：quiz-content.ts:264-271
- 影响：Q22（应为W2反向）与Q8同方向（感性→1,理性→3）。交叉答题用户W2偏移2档，扭曲人格匹配。
- 复现：Q8选理性(score3)+Q22选感性(score1)→total=4→M；应为Q22反转感性→3，total=6→X。
- spec缺口：A3明确"第22题分数方向相反"未实现。

### C-F2 [High] F1维度永远无法达tier L
- 位置：quiz-content.ts:204-212
- 影响：砝码题score只有{2,3}，加Q2正向{1,2,3}，F1总分范围[3,6]，L档(≤2)不可达。其他维度都能达L。F1=L的角色(如EMMA)匹配距离被多算1.5。
- spec缺口：A2/A3"三槽值直接作F1贡献"实现为"主槽值+1"，min=2。

### C-F3 [High] triggerGates校验缺失，peace/undecided可触发特殊人格
- 位置：match.ts:139-166 + answer-processor.ts:47-57
- 影响：gateValue="peace"/"undecided"+triggerFired="SPECIAL_A"时，resolveSpecialCode的legacy fallback错误返回ETL。用户匹配不灭雪华similarity=100。
- 复现：{answers:[gate(peace),trigger(SPECIAL_A)]}→match→ETL。
- spec缺口：A5 triggerGates=["destroy","seen"]未在match()校验。

## 安全维度（2条）

### S-F1 [Critical] processAnswers不按questionId去重，分数放大攻击
- 位置：answer-processor.ts:41-61 + api/match/route.ts
- 影响：攻击者对同一题提交N次同一optionId，dimScores放大N倍（schema允许100个answer≈5倍），可精确控制每维度档位，强制匹配任意人格。R12防篡改被击穿。
- 复现：对目标维度高分题重复5次提交→total=30→X档→匹配任意角色。
- spec缺口：R12"防篡改"——服务端虽从DB重算score，但缺questionId唯一性约束。

### S-F2 [High] annotation API是评分oracle，泄露维度档位
- 位置：api/annotation/route.ts
- 影响：批注H/M/L三档文案完全不同（可逐字匹配区分）。攻击者对每个optionId单独提交，观察返回文案判断score范围。绕过quiz API的score剥离设计。
- 复现：对每option POST /api/annotation?node=5 with [{qid,oid}]→文案含"很少犹豫"=H(score≥5)等。80个option约80秒探测完。
- spec缺口：R12/R1——quiz API正确剥离score，但annotation API侧信道泄露等价信息。

## 可维护性维度（3条）

### M-F1 [High] 批注fallback文案在3文件4处独立定义
- 位置：annotations.ts:73-77(FALLBACK), route.ts:44-48+78-82(两处), TestScreen.tsx:211-213
- 影响：3条fallback文案复制粘贴4次，无共享源。改annotations.ts的FALLBACK，API和客户端仍显旧文案。route.ts同一文件内两处fallback改一处忘改会返回不同文案。阶段3翻译放大4倍。
- spec缺口：纯代码缺陷，违反ADR模块切分（批注模块边界被破坏）。

### M-F2 [High] i18n questions数组零运行时消费者，纯死代码债务
- 位置：zh-CN.ts:73-98(+ja/en/zh-TW.ts对应段)
- 影响：TestScreen从/api/quiz获取题目，从不读t.questions。25行死代码副本，与quiz-content.ts结构不同步。zh-CN.ts:87把砝码题weight::编码串原样复制，翻译者可能"翻译"编码串破坏parseWeightLabel。阶段3每加locale多一份死副本。
- spec缺口：R7要求同步但无自动化保障，且questions无消费者使R7失去意义。

### M-F3 [Medium] renderType在TestScreen有6处硬编码分支，扩展需改6处
- 位置：TestScreen.tsx:348,352,301,309,176,631
- 影响：ADR D1要renderType零迁移扩展，但渲染层6处if/switch。新增renderType(阶段2跨IP必然)需同时改6处，遗漏任一处运行时静默失败。
- spec缺口：ADR D1数据层解耦达成，渲染层未解耦。

---

## fp-judge 裁决（2026-08-07）

| 发现 | 判定 | 严重度校准 | 处置 |
|---|---|---|---|
| C-F1 Q22反向 | FALSE_POSITIVE | 撤销 | 契约A3本身误判（原第22题scores是正向），实现日志已记录偏离，实现正确 |
| C-F2 F1永不达L | LIKELY_TP | High→Medium | ADR Q1已接受此代价，蓝方验证"影响轻微"假设（扫F1=L角色数） |
| C-F3 triggerGates | FALSE_POSITIVE | - | pre-existing（match.ts锁死区零改），非阶段1回归 |
| S-F1 分数放大 | LIKELY_FP | Critical→Medium | pre-existing（answer-processor/schemas零改），R12核心已满足，记为安全债 |
| S-F2 annotation oracle | FALSE_POSITIVE | 撤销 | score在前端bundle公开，annotation是多余侧信道 |
| M-F1 fallback重复 | TRUE_POSITIVE | High→Medium | 蓝方修：annotations.ts导出FALLBACK，route.ts/TestScreen引用 |
| M-F2 i18n死代码 | LIKELY_TP | High→Low | R7要求维护，阶段3会消费，阶段1留无害 |
| M-F3 renderType分支 | FALSE_POSITIVE | - | ADR D5显式设计（switch渐进改造），非缺陷 |

蓝方实际处理：**C-F2（验证ADR假设）+ M-F1（提取共享fallback）**。
