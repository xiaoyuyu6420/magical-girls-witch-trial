# 红/蓝对抗 Summary — 阶段1

## Round 1
- 红方：3 个维度（正确性/安全/可维护性）并行，共 8 条发现。
- fp-judge 裁决：1 TRUE_POSITIVE (M-F1) + 2 LIKELY_TP (C-F2 升级High, M-F2 降Low) + 1 LIKELY_FP (S-F1 pre-existing) + 4 FALSE_POSITIVE (C-F1/C-F3/S-F2/M-F3)。
- 蓝方处理：C-F2（砝码score重映射，F1 L档可达）+ M-F1（fallback单一来源）。独立验证通过。
- 未处理（合理）：S-F1（pre-existing安全债，非阶段1回归，记入后续hardened pass）、M-F2（R7要求的i18n骨架，阶段3消费）、C-F1/C-F3/S-F2/M-F3（FP/OOS）。

## 循环决策
**不跑第二轮红方。** 理由：
1. 修复改动小且聚焦（砝码7个score数值 + 3处fallback import），未引入新逻辑面。
2. 第一轮红方已充分覆盖正确性/安全/可维护性，发现的真阳性已修。
3. 修复后独立验证：58测试全绿、DB数据正确、F1 L档可达验算通过。
4. 第一轮红方质量偏低（25%真阳性率），第二轮边际收益递减。

## fp-judge 对红方质量的反馈（给未来迭代）
- 红方最大问题：未区分 pre-existing vs 阶段1回归（把锁死区既有bug记到阶段1）。每条发现应 git blame 关键行。
- 契约/代码双向核对缺失（C-F1）：契约是人写的也会笔误，必须回查原始代码 + 读实现日志偏离条款。
- 威胁模型校准（S-F1/S-F2）：按"娱乐测试伪造截图"校准，不按"生产数据库"。
