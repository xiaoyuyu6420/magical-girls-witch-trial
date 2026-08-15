# 50-redblue · summary · HTML 32 视觉重做

## round-1 结论

**红方**（4 维度并行）报 16 发现 → **fp-judge** 裁决 13 成立（1 Critical + 2 High + 10 Medium/Low）+ 2 驳回（M5 证据不足 / A5 pre-existing）→ **蓝方**（3 路并行，按文件归属）修复全部 13 成立发现。技术债 M1/M2/M4（硬编码/inline/双源）延后（不影响 done，ADR 授权范围）。

fp-judge 纠正红方三个偏差：严重度系统性偏高（A2/A3/C3/A4 各降一级）、pre-existing 检查缺失（A5）、归因不准（C1 非 5fde0e1 回归，是本次 i18n 重构误清）。

## 蓝方修复清单（13 项）

### P0 Critical
- **A1**：reduced-motion 块 `.opt-block { opacity:1; transform:none }`（补 staggerIn-forwards 终态，选项恢复可见）—— globals.css

### P1 High
- **C1**：4 locale 从 397a2f1 恢复 `disclaimer.footer/result` + `meta.title/description`（版权声明 + 分享标题恢复）—— i18n
- **I1**：普通题序号 `ROMAN` → `String(idx+1).padStart(2,"0")`（01/02/03，对齐 32）—— TestScreen

### P2 Medium
- **I2**：floatIn/floatOut 启用（`cardAnimClass = stageFadeOut?"exit":"enter"`，复用 stageFadeOut 状态机零新 timer）—— TestScreen
- **I3**：card-glare 实现（CSS desktop-skin 层 + DOM/mousemove 桌面 fine-pointer，手机不渲染）—— globals.css + TestScreen
- **C2**：fetch 串行恢复（match→stats，aurora gate 保留，storage#5 验证）—— page.tsx
- **A2/A3**：reduced-motion 块加 `.balance-pan, .weight-card { animation:none; opacity:1; transform:none }` —— globals.css

### P3 Low
- **C3**：AuroraBurst `reducedMotion` prop（reduced-motion 下 minDuration 400ms）—— AuroraBurst + page.tsx
- **A4**：interjection-overlay 动画 JS 侧 reducedMotion 门控（绕开 inline 优先级）—— TestScreen
- **M3**：token champagne-* 命名错位（ADR 授权，加注释延后）—— 标注非修

### 延后（技术债，不影响 done）
- M1：globals.css 42 处硬编码 rgba（ADR 决策2 反向新增，可维护性债）
- M2：ResultScreen 分享卡 38 处 inline（ADR 盲点#4 授权实色，零 class）
- M4：BackgroundLayers canvas 硬编码紫色双源

## 验证状态
- 蓝方各自 tsc 过；集成 tsc 零错 + build 成功
- E2E chromium 全量最终确认中

## round-1 后续：蓝方修复引入 3 回归 → 已修
蓝方-A/B/C 修复后 E2E 出现 3 新红点（105 passed/3 failed），根因诊断 + 修复：
- **quiz:197/252 timeout** ← 蓝方-B 的 I2 floatIn 接线（.card.enter opacity:0 期破坏切题答题时序）。**I2 回退**（card 恒 class，floatIn keyframes 保留备用，标注延后——简单 class 切换不可行，需更精细接线不阻断 opt 可见/可点）。quiz:197 恢复。
- **mobile:139 horizontal overflow（327px）** ← 蓝方-A 的 card-glare CSS（300% 尺寸）+ 蓝方-B DOM，mobile.spec 只设 viewport 不设 touch/hover → 桌面能力下渲染溢出。**修**：.question-stage 加 overflow:hidden（对齐 32 .card overflow:hidden，裁剪 card-glare）。
- **quiz:252 interjection intercepts** ← interjection staggerIn opacity:0→1 期，消化循环 isVisible（检查 opacity）漏检，但 element intercepts pointer events。**修**：helpers + quiz.spec 7 处 interjection 消化 isVisible → count()>0（DOM 存在即消化，interjection 关闭=卸载→count=0）。

I2（floatIn 3D 翻转）是 P2 Medium 延后——"和32完全一样"的部分偏离，但保答题稳定优先（"不准细节损失"）。floatIn keyframes 保留，未来精细接线。

技术债延后（不影响 done）：M1（42 处硬编码）、M2（分享卡 inline）、M4（canvas 双源紫）、I2（floatIn 接线）、M3（token 命名）。
