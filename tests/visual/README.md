# 视觉回归基线（Visual Regression Baseline）

本目录存放基于 Playwright 原生 `expect(page).toHaveScreenshot()` 的像素级视觉回归测试。
目的：捕获 UI/样式的非预期视觉变化——改了字号、颜色、布局、间距，基线会 FAIL 并产出 diff。

## 运行

```bash
# 只跑视觉回归（推荐，与现有 121 个 e2e 隔离）
pnpm exec playwright test --project=visual --project=visual-mobile

# 更新基线（UI 故意变更后）
pnpm exec playwright test --project=visual --project=visual-mobile --update-snapshots

# 全量跑（含普通 e2e）——普通 chromium project 已 testIgnore 排除本目录
pnpm exec playwright test
```

## 基线存储

基线 PNG 存 `tests/visual/__screenshots__/`，**已提交到仓库**（`.gitignore` 有反向规则）。
路径模板（playwright.config.ts `snapshotPathTemplate` 固化）：
`tests/visual/__screenshots__/<快照名>-<projectName>-<platform>.png`

失败时 Playwright 自动产出三图到 `test-results/`（已 gitignore，本地查看）：
- `<name>-expected.png`（基线）
- `<name>-actual.png`（实际）
- `<name>-diff.png`（差异高亮）

## 覆盖范围（7 条基线）

| # | 基线 | project | 稳定化策略 |
|---|------|---------|-----------|
| 1 | Welcome desktop zh-CN | visual | L1 mask + L2 scramble settle |
| 2 | Welcome desktop en | visual | L2 显式点 lang-btn + scramble settle |
| 3 | Welcome desktop ja | visual | L2 显式点 lang-btn + scramble settle |
| 4 | Test 普通题 desktop | visual | L2 等 opt-block opacity:1 |
| 5 | Result 档案卡 desktop | visual | L3 reducedMotion 立即 done |
| 6 | Welcome mobile zh-CN | visual-mobile | L1 mask + L2 scramble settle |
| 7 | Test 普通题 mobile | visual-mobile | L2 等 opt-block opacity:1 |

## 稳定化分层协议

每个基线必选其一（不存在裸截）：

- **L1 mask 永续随机源**：`maskWelcomeDynamic()` 屏蔽 cursor、live-time、blink、异步计数、kanji ghost。
  判定标准：该像素源在两次运行间是否不可复现——不可复现才 mask。
  ⚠️ `#abyss-canvas`（全屏粒子背景）**不 mask**——它是 `width:100%;height:100%` 全屏元素，
  Playwright mask 作用于 bounding box（覆盖所有 z-index），mask 全屏 canvas 会吞掉整个视口。
  canvas 改用 `hideCanvasForScreenshot()`（截图前 `visibility:hidden`）处理。
- **L2 等确定性终态**：`waitForScrambleSettled()` 轮询 `textContent === data-scramble`
  （用 textContent 不受 CSS text-transform 干扰）；多语言先等 zh-CN 初始 scramble settle，
  再显式点击 `.lang-btn` 切目标语言（绕开 DOMContentLoaded +1500ms 自动切换竞态），再等新 scramble settle。
  Test 页轮询所有 `.opt-block` computedStyle opacity === "1"（staggerIn forwards 终态，全量检查覆盖 stagger 延迟）。
- **L3 容器级 reducedMotion**：ResultScreen 已内置 matchMedia 检测，命中后跳过揭晓直接 done。
  通过 `test.use({ contextOptions: { reducedMotion: "reduce" } })` 在 context 级开启（Playwright 1.62 写法）。

### 为什么不 mask scramble 文本？

scramble 完成后是**确定终态**（`data-scramble` 属性写死），两次运行间可复现——
所以 `.hero__title` / `.hero__overline` / `.hero__tagline` / `.hero__cta` **不 mask**。
它们是首页最核心的视觉资产，mask 了就保护不到标题字号/颜色变化。

## 容差

所有基线 `threshold: 0.2`（Playwright 默认 per-pixel 容差）。
默认不预设 `maxDiffPixelRatio`——mask 已剔除随机源，剩下的应像素级一致；预设余量只会掩盖漏 mask。

**例外（R11）**：Result 档案卡设 `maxDiffPixelRatio: 0.02`——稀有度百分比（typePercentage）来自
`/api/results` 统计，每次 seed 后微变（~2% 像素波动），属已知动态内容（见 result.visual.spec.ts 注释）。
真实布局回归（结构/字号变化）通常改 5%+ 像素，仍会被捕获。

若其他基线出现 flaky（连续运行不一致），按需逐条上调 `maxDiffPixelRatio` 或增 mask，**并在测试旁注释原因**。

## 验证基线是否生效

```bash
# 故意改 CSS 触发 FAIL
sed -i '' 's/--accent: #d4af37/--accent: #ff0000/' src/app/globals.css   # 触发 Test/Result FAIL
pnpm exec playwright test --project=visual
ls test-results/*-diff.png   # 应有 diff 图
git checkout src/app/globals.css  # 还原
```

## 约束

- **不改业务代码**（`src/`、`public/index.html`）——稳定化全在测试侧。
- **不改现有 15 个 spec**（`tests/*.spec.ts`，非本目录）。
- **不引入第三方视觉回归库**——原生 `toHaveScreenshot` 已满足需求（契约 R1）。
- **不做多浏览器**——chromium only（契约非目标）。
