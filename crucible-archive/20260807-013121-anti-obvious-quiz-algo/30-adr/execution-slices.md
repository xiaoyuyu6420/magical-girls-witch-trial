# 执行切片（已确认方向）

> L1 Content Pack + 反识破同路
> 威胁模型：普通用户
> 不重写匹配核心距离公式

## 总顺序

```
T0  定 pack 契约（类型 + 加载）
T1  match/answer-processor 改为吃 pack 配置
T2  抽出 witch-trial 为第一 pack（内容搬迁，行为不变）
T3  反识破 P0：反向真反分 + 选项稳定打乱 + 结果叙事化
T4  题序交错 + SPEC/阈值文档对齐
T5  （可选）SPECIAL 显式映射、Excel 增 Dimensions sheet
```

原则：**每步可回归**；T2 结束时应“换皮前绿，行为与现在一致”。

---

## T0 — Pack 契约

### 交付
- `src/content/types.ts`（或 `src/pack/types.ts`）
  - `QuizPack`：id, version, title
  - `DimensionDef`：code, name, group, weight, labels?
  - `AlgoConfig`：tiers, delta, threshold
  - `PackRules`：gateValues, gateBonus, specialTriggers, optionShuffle
  - `PresentationCopy`：result 槽位文案 key/默认值
- `loadPack(id)` / `getActivePack()`（先读本地模块/JSON）
- env 或常量：`ACTIVE_PACK=witch-trial`

### 验收
- 类型能表达当前魔女包
- 无业务行为变化

---

## T1 — 引擎去硬编码

### 改动
- `match.ts`：`DIMENSIONS/WEIGHTS/ALGO_CONFIG` 改为函数参数或 `pack` 注入
- `answer-processor.ts`：gate 枚举可来自 pack.rules（或保持并集校验）
- 测试：用 fixture pack，不 import 真题库也可跑

### 验收
- 现有 vitest 全绿（通过 active pack = witch-trial）
- match 单测可换假维度包

---

## T2 — 第一包搬迁（行为不变）

### 结构（推荐）
```
content/packs/witch-trial/
  pack.ts          # 聚合导出 QuizPack
  dimensions.ts
  questions.ts
  types.ts         # personality types
  rules.ts
  presentation.ts
```
或先单文件 `content/packs/witch-trial.ts` 从 `quiz-content.ts` 搬家。

### 改动
- `prisma/seed.ts` 从 pack 读
- `/api/quiz` dimensions/weights 从 pack 读
- `ResultScreen` 维度分组从 pack.dimensions 动态生成
- 保留 `src/data/quiz-content.ts` 为 re-export 一层（过渡，避免大爆改）

### 验收
- 同答案 → 同结果（与搬迁前一致）
- seed / dev 流程不变

---

## T3 — 反识破 P0（做在 pack+引擎上）

### T3a 反向题真反分
- 审计 12 维第 2 题，显式 score
- pack 数据修正
- vitest：同维两题高语义 → 高档

### T3b 选项稳定打乱
- 引擎：`shuffleOptionsStable(questionId, options)`
- pack.rules.optionShuffle = `stable-by-question-id`
- `/api/quiz` 或 TestScreen 应用（推荐 API 出口统一打乱，前端只展示）
- vitest：顺序变、optionId 集不变 → code 不变

### T3c 结果叙事化
- pack.presentation 提供标签
- ResultScreen：默认不展示 userVector/templateVector 技术串
- 雷达/维度/top3 用叙事文案（先 zh-CN，再四语）
- i18n 槽位通用化：`result.fitLabel` 等由 pack 覆盖或 i18n 默认

### 验收
- S1/S3/S4/S5/S6（意图契约成功标准）
- 特殊/兜底回归

---

## T4 — 节奏与文档

- 调整 question.order 交错维度
- SPEC 阈值与代码对齐（建议先以代码为准写回 SPEC）
- README：如何新增一个 pack

---

## T5 — 可选加固

- `SPECIAL_A` → 显式 map（pack.rules.specialTriggers）
- Excel template 增加 Dimensions sheet
- record 写 `packId`（为 L2 预留，可只打日志/字段可选）

---

## 文件归属（实现时）

| 模块 | 拥有 | 禁区 |
|------|------|------|
| pack types + load | `src/pack/*` 或 `src/content/*` | 不改 UI 文案细节 |
| match 引擎 | `src/lib/match.ts` | 不改题面 |
| answer-processor | `src/lib/answer-processor.ts` | — |
| witch-trial pack | `content/packs/witch-trial/**` | 不改 match 公式 |
| quiz API | `src/app/api/quiz/route.ts` | — |
| ResultScreen | 展示槽位 | 不写死 S/F/B/W 文案 |
| seed | `prisma/seed.ts` | — |

---

## 明确不做（一期）

- 多 pack 路由 `/p/[slug]`
- DB `QuizPack` 表热切换
- 结果随机扰动
- 重写曼哈顿核心
- 为技术用户做 API 全面混淆（非 P0）

---

## 建议开工命令

用户说「开始改」后按 T0→T3 顺序实现；每完成 Ti 跑 `pnpm test`。
