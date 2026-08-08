# 红方报告 Round 1 — 阶段3a 结果页

> 3 维度（正确性/a11y/可维护性）并行，共 12 条发现。

## 正确性（2条）

### C-F1 [High] prefers-reduced-motion 降级不完整
- 位置：ResultScreen.tsx:262-265 + 423-426
- 影响：reduced-motion 下 JS 跳过 setTimeout，但档案卡 opacity 0→1 和遮罩淡出仍各 0.8s CSS transition。R5 要求"直接呈现"，0.8s 交叉淡入不是"直接"。违反 WCAG 2.3.3。
- 复现：系统开启减少动态效果→档案卡仍 0.8s 淡入+遮罩 0.8s 淡出。
- spec缺口：R5 + 决策门#3。

### C-F2 [Medium] hiddenReveal 放在档案卡层而非揭晓层
- 位置：ResultScreen.tsx:382-392
- 影响：hiddenReveal 在 result-layout（opacity:0），揭晓期间不可见，遮罩淡出后才出现。R16/A5 说"揭晓时多一行"，应作为揭晓层第6元素。
- spec缺口：R16/A5 "揭晓时"。

## 可访问性（4条）

### A-F1 [Critical] 揭晓序列对屏幕阅读器完全不可访问
- 位置：ResultScreen.tsx:410-517 + 260-404
- 影响：无 aria-live、无 heading（.r-name 是 div）、无 landmark、揭晓文字渐现 SR 不播报、揭晓后无焦点移动。SR 用户无法得知结果。
- spec缺口：决策门#3 screen readers。

### A-F2 [High] 焦点逃逸 + 无焦点环
- 位置：ResultScreen.tsx:410-517 + globals.css:420-428
- 影响：揭晓期间 Tab 可进入 opacity:0 的按钮（焦点消失视觉）；.btn-restart 无 :focus-visible；跳过后无程序化焦点移动。
- spec缺口：决策门#3 keyboard operability。

### A-F3 [High] 跳过提示对比度 1.42:1 + 文字只说"点击"
- 位置：ResultScreen.tsx:430-441
- 影响：rgba(255,255,255,0.15) on #050308 = 1.42:1（WCAG AA 要求 4.5:1），低视力用户看不见。文字"点击"未涵盖键盘。
- spec缺口：决策门#3 touch targets + keyboard。

### A-F4 [Medium] 触摸目标约28px
- 位置：globals.css:420-428
- 影响：.btn-restart 高度约28px，违反 WCAG 2.5.8（44px）。触屏误触。
- spec缺口：决策门#3 touch targets。

## 可维护性（6条）

### M-F1 [High] 12个i18n key在en/ja/zh-TW缺失
- 位置：src/i18n/en.ts + ja.ts + zh-TW.ts
- 影响：zh-CN 新增 12 个揭晓/稀有度/分享 key（revealJudgement/rarity*/shareHook 等），其他 3 locale 全缺。t() 缺失返回 key 字符串，非中文用户看到 result.xxx 原始 key。
- spec缺口：非目标"不做多语言"指不新增 locale 文件，不是"新 key 不补齐已有 locale"。

### M-F2 [High] "点击任意处跳过"硬编码中文
- 位置：ResultScreen.tsx:439
- 影响：硬编码中文非 i18n key，所有 locale（含非中文）都显示中文。
- spec缺口：同 M-F1。

### M-F3 [Medium] REVEAL_TIMINGS 硬编码不可注入
- 位置：ResultScreen.tsx:12-20
- 影响：AB 实验切换节奏需改组件代码。
- spec缺口：纯架构，A1"自管"≠硬编码。

### M-F4 [Medium] ResultScreen 636行5关注点混合
- 影响：阶段2跨IP/阶段3c AB 时膨胀成 merge 冲突热点。

### M-F5 [Medium] inline style 无响应式
- 影响：新增元素（稀有度条/分享卡390px固定）小屏溢出，CSS @media 无法覆盖 inline。

### M-F6 [Low] workIntro per-pack 粒度不足
- 影响：A4 说"跨IP扩展为每角色字段"，当前 per-pack。YUKI（百年复仇）和 EMMA（不灭希望）共用"死亡回溯守住一个人"语义冲突。
- spec缺口：A4 粒度差一级。

---

## fp-judge 裁决（2026-08-07）

| 发现 | 判定 | 严重度 | 处置 |
|---|---|---|---|
| M-F1 i18n 11key缺失 | TRUE_POSITIVE | High | 蓝方修：补 en/ja/zh-TW 的 key（文案占位待3b） |
| M-F2 硬编码中文 | TRUE_POSITIVE | Medium | 蓝方修：加 result.skipHint key |
| C-F2 hiddenReveal层 | TRUE_POSITIVE | Medium | 蓝方修：移到揭晓层作第6元素 |
| C-F1 reduced-motion CSS | LIKELY_TP | Medium | 蓝方修：reduced-motion 时 transition:none |
| A-F2 焦点逃逸+无focus环 | LIKELY_TP | High | 蓝方修：btn-restart:focus-visible + 揭晓期inert |
| A-F1 屏幕阅读器无结构 | LIKELY_TP | High | 蓝方修：aria-live + heading + 焦点移动 |
| A-F3 跳过提示对比度 | LIKELY_TP | Medium | 蓝方修：提亮至0.55+文字改含键盘 |
| A-F4 触摸目标28px | LIKELY_TP | Low(pre-existing) | 蓝方修：min-height:44px |
| M-F5 inline无响应式 | LIKELY_TP | Low | 不修（分享卡offscreen不可见+稀有度条%响应式） |
| M-F3 TIMINGS硬编码 | OUT_OF_SCOPE | - | 阶段3c A/B 的活，契约H1已满足 |
| M-F4 组件膨胀 | LIKELY_FP | - | ADR A1已接受内联phase |
| M-F6 workIntro粒度 | FALSE_POSITIVE | - | 误读契约，A4明确推荐per-pack |

蓝方处理：M-F1/M-F2（i18n）+ C-F2（hiddenReveal）+ C-F1/A-F1/A-F2/A-F3/A-F4（a11y打磨）。
