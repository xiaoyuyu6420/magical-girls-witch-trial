# 50-redblue · round-1 · HTML 32 视觉重做

## 红方（4 维度并行，16 发现）+ fp-judge 裁决

### P0 Critical（阻断）
- **A1** [TP] reduced-motion 下 `.opt-block {animation:none}` 但基线 `opacity:0` → 普通题选项完全不可见，reduced-motion 用户卡在 Q1。playwright 实测 opacity=0。**本次引入**（397a2f1 无此块）。修复：reduced-motion 块补 `.opt-block{opacity:1;transform:none}`。

### P1 High（必修）
- **C1** [TP] 4 locale 的 `disclaimer.result`（"角色版权归原作方所有"）+ `meta.title`（"魔女审判"）被清空成 ""。ResultScreen L454 版权声明消失 + L213 分享标题空。**本次 i18n 重构误清**（非 5fde0e1 回归，fp-judge 纠正归因）。修复：从 397a2f1 恢复 4 locale 值。
- **I1** [TP] 普通题序号 `I/II/III`（TestScreen ROMAN）vs 32 的 `01/02/03`。globals.css 注释自写"01/02/03"但 DOM 用 ROMAN，自相矛盾。无 E2E 锚定 ROMAN，零阻碍。修复：`String(idx+1).padStart(2,"0")`。

### P2 Medium（应修）
- **I2** [TP] floatIn/floatOut（3D 翻转 rotateX）keyframes 定义但从未启用 .card.enter/.exit，实际用 stage-fade-out（无 3D）。违反 R13。修复：切题挂 enter/exit。
- **I3** [TP] card-glare 反光层（mousemove 金色径向跟随）零实现。V5 要求。仅桌面。修复：CSS + DOM + mousemove。
- **C2** [LIKELY] 极光并发化（Promise.all）打破旧串行：match 失败+stats 成功→DB 双写虚高。修复：恢复串行 或 /api/results 幂等。
- **A2** [LIKELY] .balance-pan reduced-motion 漏守卫（staggerIn 仍跑，元素可见但运动未降级）。
- **A3** [LIKELY] .weight-card 同 A2。
- **M1** [LIKELY] globals.css 42 处硬编码 rgba 绕过 token（技术债）。
- **M2** [LIKELY] ResultScreen 分享卡 38 处 inline style（技术债，ADR 盲点#4 授权实色但零 class）。
- **M4** [LIKELY] BackgroundLayers canvas 硬编码紫色双源（技术债）。

### P3 Low（建议）
- **C3** [LIKELY] AuroraBurst reduced-motion 下 1300ms setTimeout（UX 瑕疵非 a11y 红线）。
- **A4** [LIKELY] interjection-overlay 内联动效 reduced-motion 漏（当前无可见运动）。
- **M3** [TP-降级] token champagne-* 命名错位（ADR 授权可延后）。

### 驳回
- **M5** [FP] 证据不足（helpers 8s 是测试代码，非产品 magic timeout）。
- **A5** [OOS] "按任意键继续"对比度 2.05:1 是 pre-existing（397a2f1 已存在，本次未改）。

## 蓝方处置（3 路并行，按文件归属）
- **蓝方-A** globals.css：A1/A2/A3 reduced-motion 守卫 + I3 card-glare CSS
- **蓝方-B** TestScreen.tsx：I1 序号 + I2 floatIn 启用 + I3 card-glare DOM/mousemove + A4 interjection class
- **蓝方-C** i18n 4locale + page.tsx + AuroraBurst：C1 恢复 + C2 串行 + C3 reducedMotion
