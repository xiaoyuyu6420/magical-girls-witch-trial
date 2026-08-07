# FAULTS — 子 agent 返回异常日志

## [2026-08-07] architect 变体"最小侵入"返回段落缺失
- **阶段**：3a-arch
- **agent**：architect（最小侵入变体）
- **问题**：返回值只剩首尾两段，中间所有必填段落（BLUF / 核心抽象 / 数据模型决策 / 改动清单 / 被拒绝的替代方案 / 主要风险）全部缺失。看似在 519s 运行后被截断。
- **可用的立场摘要**（从首尾提取）：
  - variant 不入库、按 `order` 硬编码位置（8/14/22）。
  - 天平/砝码/批注全部退化为 `type: "normal"` 或 TestScreen 内部 state。
  - 代价：TestScreen 文件复杂度上升。
  - 收益：数据层、schema、match、answer-processor 零改动，5 个 commit 之间几乎无耦合，可独立 revert。
  - 阶段2 如要把 variant 抽象为 pack 配置，硬编码常量表是唯一需重构点。
- **处置**：architect 是非关键 agent，纪律 A 允许用手上的继续。另外两个完整方案（稳健扩展、内容驱动）已覆盖关键分叉（是否扩展 DB schema）。最小侵入的立场摘要已纳入仲裁比较。未重试（立场已充分传达，重试收益低）。
- **下游影响**：仲裁 prompt 中如实标注最小侵入仅立场摘要。
