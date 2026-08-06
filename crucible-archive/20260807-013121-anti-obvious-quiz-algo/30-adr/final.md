# ADR 最终摘要

## 决策
1. **威胁模型**：只挡普通用户一眼看穿
2. **匹配核心**：不重写加权曼哈顿
3. **反识破 P0**：反向真反分 + 选项稳定打乱 + 结果叙事化
4. **确定性**：严格
5. **结果分析**：保留但叙事化
6. **模板化**：**L1 文件 Content Pack**，单 active pack
7. **顺序**：**先抽 pack 接口，再落反识破**（避免返工）
8. **不做**：多租户、DB 热切换、结果随机、一期 API 强混淆

## 架构立场
- Engine 稳定：match / processAnswers / test flow / admin shell
- Content Pack 可替换：dimensions, weights, questions, types, rules, presentation
- 第一包：witch-trial（从现有 quiz-content 搬迁）

## 共同盲点（已写入切片）
- 向量格式/雷达图默认 12 维 4 组 → T1/T2 按 N 维动态
- i18n 与 pack 文案双源 → 结果槽位通用 key + pack 覆盖
- 历史 TestRecord 无 packId → T5 可选预留
- 反向分修改会改变人格分布 → T3 需回归 + 分布抽检

## 下一步
等待用户确认「开始改」→ 从 T0 实现。
