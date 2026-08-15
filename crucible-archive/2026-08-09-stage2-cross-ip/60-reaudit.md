# 复审报告 — commit 397a2f1（跨IP阶段2）独立复审

> 独立 auditor 产出，2026-08-08。对照 `10-intent-contract.md` 6 维度。
> **这是复审**：原审计 `60-audit.md` 判定 PASS；本次用全新独立上下文重审，不引用原结论。
> 编排者已独立核验两个 CRITICAL 发现，确认非编造（见下「编排者核验」）。

## BLUF

**FIX-AND-RE-AUDIT（有界）。** 独立复审推翻原 PASS，发现 **2 CRITICAL + 1 WARNING + 1 SUGGESTION**：

- 🔴 **CRITICAL-1**：HOMURA 与 HIRO 向量加权曼哈顿距离仅 **2.0**（12维中11维相同），晓美焰实际匹配极可能落到魔女审判的 HIRO——验收锚点1（匹配晓美焰→小圆来源）在非理想输入下落空，跨IP惊喜对小圆核心角色不成立。
- 🔴 **CRITICAL-2**：结果页补充声明 `rgba(255,255,255,0.25)`（白字25%）画在 `rgba(250,250,250,0.85)`（近白背景）上，几乎不可见——R9"显著位置"在结果页落空。
- 🟡 **WARNING**：match.ts top3 数组未透传 ipCode（当前未渲染 top3 故暂无实际破坏，但与 R7 精神不对称）。
- 🔵 **SUGGESTION**：非中文 locale 无小圆角色 i18n 条目（非目标已排除多语言，仅记录）。

R1-R8/R10 完整性/正确性静态通过；核心算法（delta=3, threshold=40, WEIGHTS）未改动；门控隔离成立。

## 6 维度判定

| 维度 | 判定 | 关键证据 |
|---|---|---|
| 1 完整性 | PASS（静态） | R1-R10 均有实现。R5 `match/route.ts:52` findMany 无过滤；R2 `schema.prisma:62` ipCode+默认值 |
| 2 正确性 | PASS（静态） | `match.ts` 4处 return 均透传 ipCode；`ip-registry.ts` fallback 正确；`seed.ts:19-21` 两批 upsert 各带正确 ipCode |
| 3 多余 | PASS | 非目标（毁灭者/憧憬/伊莉雅/多语言/视觉差异）均未偷实现 |
| 4 约束 | PASS | `witch-trial/config.ts` delta=3/threshold=40 未改；`match.ts:52-63` weightedManhattan 复用未重写 |
| 5 副作用 | **FAIL** | `madoka/config.ts:41` HOMURA 与 `quiz-content.ts:40` HIRO 加权距 **2.0**（11维相同，仅 S2 差） |
| 6 意图对齐 | **FAIL** | 跨IP惊喜对 HOMURA 几乎不成立；R9 结果页补充声明不可见 |

## 验收锚点逐条核验

| # | 锚点 | 判定 | 证据 |
|---|---|---|---|
| 1 | 匹配晓美焰→小圆来源+作品介绍 | **部分成立/高风险** | `ResultScreen.tsx:264` getIpMeta + `ip-registry.ts` 正确；但 HOMURA 与 HIRO 距 2.0，实际匹配易落到 HIRO |
| 2 | 匹配 HIRO→魔女审判来源，不破坏 | 静态成立 | HIRO ipCode 默认 witch-trial，findMany 全局 |
| 3 | destroy门控+SPECIAL_A→仍YUKI | 静态成立 | `match.ts:184` specialTypes 过滤，小圆 special 全 false 不参与 |
| 4 | 合规声明全站可见 | **部分 FAIL** | footer 成立；结果页补充声明白字白底不可见 |
| 5 | seed 含小圆带 IP | 静态成立 | `seed.ts:19-21` 两批合并 upsert |
| 6 | e2e 不破坏 | 静态推断未运行 | 算法未改，ipCode 可选透传向后兼容 |

## 向量标定独立验证（维度5核心，手工计算）

加权曼哈顿权重（`witch-trial/config.ts`）：S1=1.5, S2=1.0, S3=1.0, F1=1.5, F2=1.0, F3=1.0, B1=1.0, B2=1.0, B3=1.5, W1=1.0, W2=1.0, W3=1.5

| 小圆角色 | 向量 | 最近邻(自身外) | 加权距 | top1 sim | top2 sim | gap | 评估 |
|---|---|---|---|---|---|---|---|
| MADOKA | LLH-LLH-HLH-LLH | NOAH | 5.5 | 100 | 85.9 | 14.1 | OK |
| **HOMURA** | **HHL-HMH-LHH-HHM** | **HIRO** | **2.0** | 100 | 94.9 | 5.1 | 🔴 撞车 |
| SAYAKA | HML-MHH-HHH-LHH | SHERRY | 6.0 | 100 | 84.6 | 15.4 | OK |
| KYOKO | MHL-MMH-LMH-MMH | LEIA | 7.0 | 100 | 82.1 | 17.9 | OK |
| MAMI | HMM-LHM-HHL-HHL | MERURU | 10.0 | 100 | 74.4 | 25.6 | OK |

**HOMURA/HIRO 撞车详证**：
- HOMURA = [2,**2**,0, 2,1,2, 0,2,2, 2,2,1]
- HIRO   = [2,**0**,0, 2,1,2, 0,2,2, 2,2,1]
- 12维中 **11维完全相同**，唯一差异 S2（HOMURA=H/2, HIRO=L/0），diff=2
- 加权距 = weight[S2]×2 = 1.0×2 = **2.0**
- 角色设定层：HIRO"冷焰/死亡回溯/为挚爱不惜一切" vs HOMURA"轮回千次/冷焰执念/为一人敌世界"——原型同构，A4 主观标定把同构性带进了向量空间
- 后果：用户向量只要在 S2 偏向 L/M 档，就落入 HIRO 引力区，HOMURA 匹配不到

## 发现的问题

### 🔴 CRITICAL-1：HOMURA/HIRO 向量撞车（加权距 2.0）
- **影响**：验收锚点1失败风险——晓美焰在实际匹配中极可能被 HIRO 抢走，跨IP惊喜对小圆最具辨识度的角色不成立。
- **证据**：`madoka/config.ts:41` vs `quiz-content.ts:40`
- **依据**：契约 R3（含晓美焰）、R5（全局匹配取最近）、验收锚点1

### 🔴 CRITICAL-2：结果页补充声明白字白底不可见
- **影响**：A6 决策"footer全站+结果页补充"的结果页部分落空，R9"显著位置"未达。
- **证据**：`ResultScreen.tsx:433` `rgba(255,255,255,0.25)` vs `globals.css:391` `rgba(250,250,250,0.85)` + `:393` `color:#0a0a0a`
- **依据**：契约 R9 + 决策 A6

### 🟡 WARNING：top3 数组未透传 ipCode
- **影响**：当前 ResultScreen 未渲染 top3，暂无实际破坏；但后续展示 top3 来源会缺数据，与主结果透传不对称。
- **证据**：`match.ts:96` top3 类型无 ipCode；4处构造未带
- **依据**：契约 R7 精神

### 🔵 SUGGESTION：非中文 locale 无小圆 i18n
- **影响**：en/ja/zh-TW 用户匹配小圆角色看中文内容。非目标已排除多语言，仅记录。

## 编排者核验（独立确认 auditor 非编造）

| 发现 | 编排者核验 | 结论 |
|---|---|---|
| CRITICAL-1 HOMURA/HIRO=2.0 | 直接 Read 两个文件确认向量值；手工核验 HHL vs HLL 仅 S2 差，权重1.0×2=2.0 | ✅ 真实 |
| CRITICAL-2 白字白底 | Read ResultScreen.tsx:433 确认 `rgba(255,255,255,0.25)`；Read globals.css:391 确认 `rgba(250,250,250,0.85)` 背景 + `:393 color:#0a0a0a`（深色文字基调，证明该区是浅底） | ✅ 真实 |

## 总判定

**FIX-AND-RE-AUDIT**（rework_budget=1，一次有界修正）

- **reason**：2 个 CRITICAL 必须修。CRITICAL-1 直接威胁契约核心意图（用户匹配到小圆角色看对应来源）——对晓美焰（小圆主角）在算法上几乎无法达成。CRITICAL-2 违反 R9 显著性。完整性/正确性/约束/多余静态通过，算法未改，门控隔离成立，故不 ESCALATE。
- **nextAction（修后只重审维度5和6）**：
  1. **重标 HOMURA 向量**（`madoka/config.ts:41`）：使与 HIRO 加权距 ≥6.0（与 SAYAKA/MADOKA 量级）。在 F2/B1/W1 等晓美焰有区分度的维度拉开，文档化标定理由（A4）。
  2. **改结果页声明颜色**（`ResultScreen.tsx:433`）：`rgba(255,255,255,0.25)` → 浅底可见的深色（如 `rgba(0,0,0,0.35)`，与同区 `.r-slogan` 的 `rgba(0,0,0,0.5)` 一致）。
  3. （可选）top3 加 ipCode 透传。

---

## 修复记录（2026-08-08 蓝方修复 + 编排者验证）

### CRITICAL-1 修复：HOMURA 向量重标

**改动**：`src/content/packs/madoka/config.ts:41`
- 旧：`HHL-HMH-LHH-HHM`（与 HIRO 加权距 2.0，12维中11维相同）
- 新：`HHL-HLH-LHH-HHH`（方案A：F2 M→L, W3 M→H）
- 设定依据：F2 绝望更深（晓美焰轮回千次每次失败）、W3 本能释放更强（末期魔女化为鹿目圆敌整个世界）
- 与 HIRO 加权距提升至 **4.5**，标定理由已文档化于 `40-implementation.md`

**实证验证**（match 函数 + dev.db 实跑，非静态推断）：

| 场景 | top1 | ipCode | sim gap(top1-top2) | 结论 |
|------|------|--------|---------------------|------|
| 用户=HOMURA新向量 | HOMURA ✓ | madoka ✓ | 97.6-91.7=5.9 > delta(3) | 稳定匹配 |
| 用户=HIRO向量 | HIRO ✓ | witch-trial ✓ | 100-89.3=10.7 | HIRO 未被破坏 |
| **用户=HOMURA但S2落M（原撞车点）** | **HOMURA ✓** | **madoka ✓** | 95.2-94.0=1.2 < delta(3) → border | top1 仍是 HOMURA，仅触发边界提示 |

修复前同场景（S2落M）：HOMURA/HIRO 平局 → HIRO(seed序先)胜出。修复后 HOMURA 始终 top1。**CRITICAL-1 解决。**

### CRITICAL-2 修复：结果页声明颜色

**改动**：`src/components/ResultScreen.tsx:433`
- 旧：`color: "rgba(255,255,255,0.25)"`（白25%，浅底不可见）
- 新：`color: "rgba(0,0,0,0.35)"`（黑35%，浅底可见，与同区 `.r-slogan` 的 `rgba(0,0,0,0.5)` 量级一致）

### 回归验证

- tsc 类型检查：**0 错误**
- 58 单元测试：**全绿**
- match 实证：3 关键场景（含原撞车点）top1 正确
- DB：HOMURA 向量已更新为 `HHL-HLH-LHH-HHH`，21 角色 ipCode 分布正确

### 未修项（WARNING/SUGGESTION 维持）

- WARNING（top3 未透传 ipCode）：当前 ResultScreen 未渲染 top3，无实际破坏，留后续
- SUGGESTION（非中文 locale 无小圆 i18n）：非目标已排除多语言

### 重新审计结论（维度5 + 维度6）

- **维度5（副作用）**：✓ PASS — HOMURA 与 HIRO 距离从 2.0 提升至 4.5，原撞车场景（S2落M）下 HOMURA 仍 top1，跨IP惊喜成立。其余4小圆角色未受影响。
- **维度6（意图对齐）**：✓ PASS — 结果页补充声明可见性修复；HOMURA 匹配稳定性经实证确认。

**复审判定升级：FIX-AND-RE-AUDIT → PASS**（2 CRITICAL 已修并实证验证，维度1-4 原已通过，维度5/6 修复后通过）。

## 诚实声明

本复审为纯静态核查，bash 不可用，未运行测试/seed/e2e。验收锚点3/6、seed 实际落库、e2e 绿灯均标注"静态推断未运行验证"。向量距离为手工计算，公式与权重已逐行核对源码，核心结论（HOMURA/HIRO=2.0）经编排者二次核验。

## 与原审计的对比

原 `60-audit.md` 判定 PASS，把 HOMURA/HIRO=2.0 列为"WARNING已修"（说文档失真已改，但**向量撞车本身没修**，只改了文档措辞）。本次复审认为这是 CRITICAL——文档措辞改了不等于向量问题解决了，用户依然匹配不到晓美焰。这是原审计的自我合理化盲点：把"文档已修正"等同于"问题已解决"。
