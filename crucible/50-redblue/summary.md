# 红/蓝对抗 Summary — 阶段3a 结果页

## Round 1
- 红方：3 维度（正确性/a11y/可维护性）并行，共 12 条发现。
- fp-judge 裁决：5 TRUE_POSITIVE + 4 LIKELY_TP + 1 LIKELY_FP + 2 OUT_OF_SCOPE/FALSE_POSITIVE。
- 蓝方修复 8 条（M-F1/M-F2/C-F2/C-F1/A-F1/A-F2/A-F3/A-F4），M-F5 不修（分享卡 offscreen 不可见），M-F3/M-F4/M-F6 搁置/驳倒。
- 独立验证：58 测试绿，build 编译通过，8 条修复点全部抽查确认。

## 修复详情
- **M-F1 i18n 回归**（最重要）：11 个新 key 补 en/ja/zh-TW（阶段3a 前这些 locale 结果页正常，阶段3a 改 zh-CN result 段导致断裂）。
- **M-F2**：硬编码"点击任意处跳过"→ i18n skipHint（4 locale）。
- **C-F2**：hiddenReveal 移到揭晓层（REVEAL_TIMINGS.hiddenReveal=4000，special 彩蛋在揭晓中可见）。
- **C-F1**：reduced-motion 时 transition:"none"（R5 直接呈现）。
- **A-F1**：aria-live/role=heading/role=region/焦点移动（SR 可访问）。
- **A-F2**：focus-visible + 揭晓期间 tabIndex=-1/aria-hidden（防焦点逃逸）。
- **A-F3**：skipHint 对比度 0.15→0.55 + 文字含键盘提示。
- **A-F4**：.btn-restart min-height:44px（WCAG 2.5.8，pre-existing 修复）。

## 未修（合理）
- M-F3（REVEAL_TIMINGS 硬编码）：OUT_OF_SCOPE，契约 H1 已满足，A/B 注入是阶段3c 的活。
- M-F4（组件膨胀）：LIKELY_FP，ADR A1 已接受内联 phase。
- M-F6（workIntro 粒度）：FALSE_POSITIVE，误读契约（A4 明确推荐 per-pack 共用一句）。
- M-F5（inline 无响应式）：LIKELY_TP Low，分享卡 offscreen 不可见 + 稀有度条 % 响应式，不构成用户可见缺陷。

## 循环决策
**不跑第二轮红方。** 修复全是属性/样式/文案（无新逻辑面），独立验证通过，边际收益低。

## fp-judge 对红方质量的反馈
- a11y 严重度系统性偏高（按娱乐测试威胁模型应降一档）。
- 预测性发现混入（M-F3/F4 是未来阶段的活）。
- 1 条误读契约凑数（M-F6）。
- 好的：M-F1 抓到了真实的 i18n 回归（"不新增 locale ≠ 新 key 不补齐已有 locale"）。
