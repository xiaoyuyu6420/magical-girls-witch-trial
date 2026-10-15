# 你是 crucible 流程的**架构师**（T2 单方案设计）。为「e2e 视觉回归基线」任务产出一份完整、有立...

- 会话 ID: `sess_subagent_agent_c4d4dec3-bb47-4e29-8cd7-bd8b61b5bbc5`
- 时间: 2026-08-08 19:04:52 → 2026-08-08 19:06:55
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 10
- 归档状态: 未归档

---

## 👤 用户
你是 crucible 流程的**架构师**（T2 单方案设计）。为「e2e 视觉回归基线」任务产出一份完整、有立场的技术方案。

## 意图契约（已锁定，已确认）

完整契约见 `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`。核心：
- 用 Playwright 原生 `expect(page).toHaveScreenshot()` 建立像素级视觉回归基线。
- **覆盖范围（已确认）**：Welcome desktop（zh-CN）+ Welcome desktop 多语言各一帧（en/ja）+ Test 普通题 desktop + Result 档案卡终态 desktop + Welcome mobile + Test mobile ≈ 7 条基线。
- **动画策略（已确认）**：精准稳定化——mask canvas + 等终态 + 揭晓只截档案卡。
- **i18n（已确认）**：多语言各一帧（验证布局不溢出）。
- **旧 screenshot.spec.ts（已确认）**：保留不动。
- 基线存 `tests/visual/__screenshots__/`，可提交（.gitignore 加反向规则）。
- 失败产出 expected/actual/diff 三图。
- 与现有 121 个 e2e 隔离（`pnpm exec playwright test tests/visual/`）。

## 项目现状（编排者已探明，关键事实）

### ⚠️ 首页是静态 HTML，不是 React！
`next.config.ts:20-26` 将 `/` rewrite 到 `public/index.html`（1657 行纯 HTML+内联 CSS/JS，绕过 Next 运行时）。**不存在 WelcomeScreen.tsx**。首页 DOM 与 globals.css 是两套体系。

### 首页关键 DOM（public/index.html）
- canvas 粒子：`#abyss-canvas`（z-index:1，opacity:0.6），requestAnimationFrame **无限循环无暂停**——必须 mask。
- hero 区：`.hero`（width:min(640px,86vw)）> `.hero__overline`(data-scramble) > `.hero__eyebrow` > `.hero__title`(data-scramble="魔女审判") > `.hero__taglines` > `.hero__tagline`×2(都有 data-scramble，第二条带 --quiet) > `.hero__cta`(data-scramble="接受审判") > `.hero__stats`(id=hero-stats，由 /api/count 填充)。
- **scramble 无终态标志**（无 data-done/class），动画期间 innerHTML 含 `<span style="color:var(--blood)">` 乱码。判定完成：`expect.poll(() => el.innerText).toBe(el.getAttribute('data-scramble'))`。
- loader：`#loader`（fixed inset:0 z-index:10000 transition:1.2s），滑走 `transform:translateY(-100%)`。helpers.ts 的 `waitForWelcomeLoaded` 已正确检测。
- **全页截图隐患**：`#live-time` 每帧刷新、`.status-blink` 无限 blink、`#cursor-dot/ring` 鼠标跟随（z-index:20001 mix-blend-mode）。
- **fs-prompt**：DOMContentLoaded+2s 弹出全屏 `.fs-prompt`(z-index:20000)，需点 `.fs-prompt-skip` 或预置 localStorage `witch-trial-fs-prompted`（playwright.config.ts 已预置）。
- lang-switcher：`.lang-switcher` + 4 个 `.lang-btn[data-lang="zh"|"tw"|"en"|"jp"]`，点击调 switchLang()，写 localStorage `witch-trial-locale`（zh→"zh-CN"、tw→"zh-TW"、jp→"ja"、en→"en"），切换用新 TextScramble 重跑。**坑**：DOMContentLoaded 非中文时 +1500ms 自动切语言——截图前必须清 `witch-trial-locale`。

### TestScreen（src/components/TestScreen.tsx，挂载于 src/app/test/page.tsx:183-190）
- `.view-test` > `#progress-line` + `.watermark-index` + `#test-stage-wrapper` > `.question-stage` > `.q-meta` + `.q-text`(id=q-text-${id}) + `.options-stage` > `.opt-block`(button) > `.opt-content` > `.opt-index`(罗马数字) + `.opt-text`。
- `.opt-block` 入场动画 staggerIn 0.6s，animationDelay idx*0.1s → 终态 opacity:1。桌面端稳定约 0.8-1s，或 `expect.poll` computedStyle opacity==="1"。移动端（≤768px）动画禁用（globals.css:591-602）。
- 没有语言切换 UI，locale 只由 i18n.tsx mount 时从 localStorage/navigator 决定。

### ResultScreen（src/components/ResultScreen.tsx）
- `#view-result`（浅色背景 rgba(250,250,250,0.85)）> `.result-layout`(role=region, aria-hidden={revealPhase!=="done"}, 初始 opacity:0 过渡 0.8s) > `.r-name` + `.r-slogan` + `.r-desc` + `.r-keywords` + `.r-keyword-tag` + 稀有度条 + `.r-actions` > 2个 `.btn-restart`(第一个分享、第二个重开)。
- **揭晓序列无粒子爆发**（canvas-confetti 在 package.json 但 src 无 import）！揭晓=纯 DOM overlay(role=status z-index:100 bg:#050308)内 6 段文本 stagger。
- 时间线 REVEAL_TIMINGS：judgementText 800→...→cardReady 4600ms→revealPhase="done"→overlay淡出0.8s 同时 result-layout 淡入0.8s。
- **档案卡稳定标志**：`.result-layout` aria-hidden 变 "false" + opacity 到 1。
- ⭐ **reduced-motion 支持（JS层）**：ResultScreen.tsx:91-95 用 matchMedia("(prefers-reduced-motion: reduce)")，命中则跳过揭晓直接 done，所有 transition 设 "none"。**Playwright context 开 reducedMotion:'reduce' 可让结果页立即稳定**（注意：只对 ResultScreen 生效，首页/测试页 CSS 动画无效）。

### i18n（src/lib/i18n.tsx）
- Locale = "zh-CN" | "zh-TW" | "en" | "ja"（**4种**）。
- detectLocale()：localStorage `witch-trial-locale` 优先 → navigator.language → 默认 zh-CN。
- **纯 localStorage + React context，无 URL 参数**。
- 测试切语言正确姿势：`context.addInitScript(() => localStorage.setItem('witch-trial-locale','en'))`（页面加载前注入）。首页例外：自己 DOMContentLoaded +1500ms 才应用。

### 全局样式
- globals.css 和 index.html **都没有 @media (prefers-reduced-motion) CSS 规则**。唯一 reduced-motion 处理是 ResultScreen 的 JS matchMedia。所以开 reducedMotion:'reduce' 只稳定结果页。
- 变量：globals.css:78 `--accent:#d4af37`（可用于触发视觉回归测试）；首页 index.html:56-65 `--gold:#d4af37` 等。
- 现有可复用：helpers.ts 的 `waitForWelcomeLoaded`、`answerAllQuestions`；reveal.spec.ts 的 `skipRevealAndWaitCard`。

### playwright.config.ts 现状
- headless:true, chromium only, baseURL http://127.0.0.1:3010, webServer 自动 build+standalone（timeout 300s），test timeout 120s, storageState 预置 witch-trial-fs-prompted=true, locale zh-CN。
- projects 只配了 chromium。

### .gitignore 现状
- `test-results/`、`playwright-report/`、根 `*.png`、`!public/**` 都被忽略。

## 你的产出要求

设计一份完整、有立场的技术方案，包含：

### BLUF
一句话方案总结。

### 核心抽象（≤5）
列出方案的关键设计决策/抽象。

### 具体设计（逐项）

1. **目录结构**：tests/visual/ 下放什么文件，spec 怎么组织，基线 PNG 目录。
2. **playwright.config.ts 改动**：是否需要改？是否加 project 拆分（visual project vs 普通）？snapshotDir 配置？注意不能破坏现有配置。
3. **.gitignore 反向规则**：确切写法。
4. **每个基线的稳定化方案**（逐个页面/状态）：
   - Welcome desktop（zh-CN）：mask 什么、等什么、截哪个区域（全页 vs 元素）、fs-prompt 处理。
   - Welcome desktop（en/ja）：怎么切语言、怎么等 scramble 终态。
   - Test 普通题 desktop：怎么等 staggerIn 终态、截哪个区域。
   - Result 档案卡 desktop：用 reducedMotion:'reduce' 还是 skipReveal？等什么标志？截 `.result-layout` 全区域。
   - Welcome mobile / Test mobile：视口怎么设（project 还是 setViewportSize）。
5. **容差策略**：threshold 默认值、是否用 maxDiffPixelRatio、哪些区域特别处理。
6. **helper 复用**：waitForWelcomeLoaded 怎么用，是否需要新增 visual helper（如等 scramble 终态的函数）。
7. **触发视觉回归的验证方式**：审计/演示时怎么证明"改 CSS 会 FAIL"（改哪个 CSS 变量）。

### 被拒绝的替代方案（≤3）
说明你考虑过但否决的方案及原因（如：第三方库 reg-suit、全页截图、用 setViewportSize 而非 project 等）。

### 主要风险（≤3）
方案的真实风险及缓解。

### 模块切分建议（给实现者）
这个任务怎么切成可并行的模块？还是单人主上下文实现？给出文件级清单（每个实现者负责哪些文件、接口契约、禁区）。

## 自我管理 + 约束

- **有界**：只做设计，不写实现代码、不改文件。
- **防漂移**：聚焦视觉回归基线，不扩展到性能/a11y。
- **诚实退出**：利用上面已探明的真实 DOM/动画事实设计，不要基于错误假设（如"揭晓有粒子爆发"是错的）。如果有事实冲突要指出。
- **边界**：你是架构师，产出方案不是代码。给出明确的文件级清单供实现者执行。

保持方案具体、可执行、有立场。重点是"实现者拿到这份方案能直接动手"。

## 🤖 助手
我先核实关键事实，确保设计建立在真实代码之上而非假设。让我并行读取承重文件。

> 🔧 工具调用 3 次: Read

## 🤖 助手
事实已大致清晰。让我并行核实几个承重的实现细节——helpers.ts 的现成函数、reveal 的 skipReveal 逻辑、index.html 的 scramble/canvas DOM、ResultScreen 的 reduced-motion、i18n 的注入点。

> 🔧 工具调用 3 次: Read

## 🤖 助手
已确认 ResultScreen 的 reducedMotion 路径与 reveal overlay。现在并行核实 i18n 注入点、index.html 的 hero/canvas/scramble DOM、TestScreen 的 opt-block 动画、screenshot.spec.ts 的现状，以及 globals.css 的 opt-block 动画。

> 🔧 工具调用 3 次: Read

## 🤖 助手
重要发现：`mobile.spec.ts:159-172` 已经验证了语言切换的关键坑——切换后 `data-scramble` 属性同步更新（en→"Enter the Trial"、jp→"審判を受ける"），但 innerText 仍异步 scramble。这印证了等终态判定思路。现在核实 index.html 的关键 DOM 和 globals.css 的 opt-block 动画。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键发现全部确认。需要核实一个重要细节：index.html 第 833-870 行的 hero 区 DOM 顺序（`#live-time`、`.status-blink`、`.hero` 的层级），以及 switchLang 后 scramble 重跑的时机，还有 DOMContentLoaded 自动切语言逻辑（+1500ms）。让我读取这些关键段落。

> 🔧 工具调用 2 次: Read

## 🤖 助手
所有关键事实已确认。我注意到一个重要细节：`TextScramble.setText` 返回 Promise，在 `complete === queue.length` 时 resolve（第 1064-1065 行）。这意味着切语言后 scramble 重跑可用 await 等终态——但 index.html 第 1001 行 `new TextScramble(btn).setText(...)` 没有 await，也没存 Promise。所以从测试侧只能用 `expect.poll` 检测 innerText 到位。再确认 DOMContentLoaded 自动切语言逻辑。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键事实全部确认。最后两处核实：DOMContentLoaded 自动切语言的完整逻辑（第 1598-1610 行），以及 `__participantCount` 的默认值对 `.hero__stats` 文本的影响（API 可能让文本是"—"或具体数字，影响基线稳定性）。

> 🔧 工具调用 1 次: Read

## 🤖 助手
所有承重事实已确认。我已经掌握所有需要的细节，现在产出技术设计。

关键确认点：
1. `playwright.config.ts` 已预置 `witch-trial-fs-prompted=true`，但**只预置了这一个 key**——没有清 `witch-trial-locale`，且 zh-CN 默认不会触发自动切语言（第 1603 行 `if (lang !== 'zh')`）。但 en/ja 基线必须用 `addInitScript` 注入 locale。
2. `__participantCount` 默认 null（第 1470 行），`.hero__stats` 默认显示"—"。fetch /api/count 成功后会变成数字——这是**基线不稳定源**，必须 mask 或等待稳定。
3. index.html 的 HUD `.hud-top`（含 `.status-blink` + `#live-time`）和 `.hud-bottom` 是全页截图的隐患——`#live-time` 每帧刷新、`.status-blink` 无限 blink。
4. `#cursor-dot/ring` 在 globals.css:106 被 `@media (pointer: coarse)` 隐藏，但 headless chromium 是 fine pointer——需 mask 或注入。
5. TestScreen `.opt-block` staggerIn 动画：desktop `animationDelay idx*0.1s` + 0.6s → 第 N 个约 `0.1*N+0.6s` 稳定；mobile（globals.css:591-602）动画仍存在但禁用了 hover flex 扩展。
6. ResultScreen reducedMotion:'reduce' 确实立即 done（第 116-120 行），是最干净的稳定化路径。

现在产出完整方案。

---

# e2e 视觉回归基线 — 技术设计

## BLUF

用 Playwright 原生 `toHaveScreenshot()` 在 `tests/visual/` 下建 7 条像素级基线，核心策略是**精准稳定化**：mask 永续动画区（canvas/cursor/live-time/blink/stats 计数）、等确定性终态（scramble innerText 回稳、opt-block computedStyle、result-layout reducedMotion 立即 done）、全页截图而非元素截图（覆盖布局回归这一真正价值）。单一最大风险是**首页 DOM 动态元素密度高**（canvas+cursor+live-time+blink+scramble 五重并发），mask 范围拿捏不准会要么 flaky 要么漏检——靠"mask 动态源、留静态结构"的纪律 + 全页 + 严格 threshold 缓解。

## 变体

**单一方案（T2 不分叉）**：精准稳定化 + 全页截图 + project 隔离 + 反向 gitignore。哲学：**只 mask 不可复现的随机像素源，保留所有可复现的视觉信号**——这是"基线值钱"的前提。

## 核心抽象（5）

1. **visual project**（playwright.config.ts 新增的第二个 project，`name: "visual"`，testMatch 限定 `tests/visual/`，默认 chromium project 用 `testIgnore` 排除 visual 目录）——隔离的承重点，普通 121 测试零接触。
2. **稳定化分层协议**（每个基线必选其一）：L1=mask 永续随机源；L2=等确定性终态标志；L3=容器级 reducedMotion 短路。**不存在 L0 全屏裸截**。
3. **`waitForScrambleSettled` helper**（visual 专用，新增到 `tests/visual/visual-helpers.ts`）——`expect.poll` 轮询所有 `[data-scramble]` 元素的 `innerText === dataset.scramble`，首页 hero 五个 scramble 元素一起等齐。
4. **基线存储约定**：`tests/visual/__screenshots__/<spec-name>/<name>-chromium-<viewport>.png`，依赖 Playwright 默认快照路径（snapshotPathTemplate），不显式设 snapshotDir。
5. **可提交契约**：根 `.gitignore` 加 4 行反向规则块，硬约束 R3。

## 数据流

一个 desktop welcome 基线的生命周期：`visual project` 启动（继承 baseURL/headless/storageState，预置 fs-prompted）→ test 进入 → `page.goto("/")` → `waitForWelcomeLoaded(page)`（复用 helpers，等 loader 滑走）→ `waitForScrambleSettled(page)`（等 5 个 scramble 回稳）→ `expect(page).toHaveScreenshot("welcome-desktop-zh", { mask:[canvas,cursor,live-time,blink,stats], threshold:0.2 })` → 首次运行生成 PNG 入库 → 后续运行做像素 diff，失败产出 expected/actual/diff 三图到 test-results。

## 关键决策（7）

### D1 项目隔离方式 → 新增 visual project + 普通项目 testIgnore

**所选**：在 `projects` 数组追加 `{ name:"visual", testDir:"./tests/visual", use:{...默认}, testIgnore / 普通 chromium project 加 testIgnore:["**/visual/**"] }`。

- **原因**：隔离是 R12/R15 的硬要求；project 级隔离让 `pnpm exec playwright test tests/visual/` 和全量跑都干净，且能在 project 维度统一设 reducedMotion（ResultScreen 基线用）。
- **否决**：
  - *仅靠 testDir 物理隔离、不加 project*：能跑但全量 `playwright test` 仍会扫到 visual（因为 testDir 是顶级），且无法在 project 维度开 reducedMotion——会迫使每个 result 测试单独开 context。输：缺配置杠杆。
  - *用 `--grep` 标签隔离*：依赖运行者记得带 tag，CI 易漏。输：脆弱。

### D2 移动端视口 → project 级 viewport（非 setViewportSize）

**所选**：为移动端基线再加一个 project `{ name:"visual-mobile", testDir:"./tests/visual", use:{ viewport:{width:375,height:667} } }`，同一份 spec 文件靠 `test.use` 或 `test.describe.configure` 让移动用例只在 mobile project 跑。

- **原因**：project 级 viewport 在 context 创建时生效，避免 `page.goto` 后才 `setViewportSize` 导致首帧布局抖动（mobile.spec.ts 用 setViewportSize 是因为它是交互测试；视觉基线对首帧敏感）。
- **否决**：
  - *spec 内 `page.setViewportSize`*：goto 时仍是 1280×720，切换后页面可能触发 resize 重排，首帧不一致。输：首帧不稳。
  - *单 spec 多 `test.use({viewport})`*：可行但和 project 的 reducedMotion 维度组合会爆炸。输：组合态多。

**低风险默认**：mobile project 不开 reducedMotion（welcome/test 的 CSS 动画不吃这套），靠 mask + 等终态。

### D3 ResultScreen 稳定化 → context 级 reducedMotion:'reduce'

**所选**：Result 档案卡基线用 `test.use({ reducedMotion:'reduce' })`（限定在 result describe 块），ResultScreen.tsx:116-120 命中后跳过揭晓直接 done、transition 全设 "none"。

- **原因**：这是代码已内置的唯一 reduced-motion 路径，零等待、零 mask、终态确定。比 `skipRevealAndWaitCard`（点中心 + 等 4.6s + 等 overlay 0.8s 淡出 + result-layout 0.8s 淡入，共 ~6s 且 overlay 淡出过程可能残影）快 6 倍且更稳。
- **否决**：
  - *复用 reveal.spec.ts 的 `skipRevealAndWaitCard`*：依赖 mouse.click(640,360) 命中 skip 区，且揭晓 overlay 淡出与档案卡淡入是两个 0.8s CSS 过渡并发，截图瞬间可能在过渡中。输：时序竞态。
  - *硬等 REVEAL_TIMINGS.cardReady 4.6s*：最稳但最慢，且 reducedMotion 路径已证明无副作用。输：慢且无必要。

### D4 截图范围 → 全页（fullPage:false，视口内）而非元素截图

**所选**：所有基线用 `expect(page).toHaveScreenshot()`（视口级全页），只有 ResultScreen 用 `expect(page.locator(".result-layout")).toHaveScreenshot()`（因为档案卡是居中卡片，视口全页会带大量浅色背景空白，diff 噪声大）。

- **原因**：视觉回归的核心价值是**捕捉布局回归**（元素移位、溢出、换行变化）——这要求截到元素间的空间关系，元素截图丢掉这个信号。ResultScreen 例外是因为它的"卡片在浅色背景居中"这个布局已被视口尺寸固定，截卡片本身足够。
- **否决**：
  - *全部元素截图*（如 screenshot.spec.ts 的 hero-title.png 风格）：丢失间距/对齐/换行信号，布局回归漏检。输：丢价值。
  - *全部 fullPage:true*：welcome/test 页是 100vh 单屏，fullPage 和视口截图等价但多算滚动条；result 页会截到 offscreen 的 share-card 容器（ResultScreen.tsx:571，top:-9999px 虽 offscreen 但 fullPage 可能纳入）。输：引入 offscreen 噪声。

### D5 首页动态源 mask 清单 → mask 五类，留 hero 文本结构

**所选**：welcome 基线 mask：`#abyss-canvas`（粒子永续 RAF）、`#cursor-dot`、`#cursor-ring`（鼠标跟随，headless 下位置不定）、`#live-time`（每帧刷新）、`.status-blink`（无限 blink）、`.hero__stats`（participantCount 由 /api/count 异步填充，null→数字不可复现）。**不 mask** `.hero__title/.hero__overline/.hero__tagline/.hero__cta`——它们是 scramble 完成后的静态终态文本，是基线要保护的核心信号。

- **原因**：mask 的判定标准是"该像素源是否在两次运行间不可复现"。canvas 粒子随机、cursor 跟鼠标、live-time 走时钟、blink 走动画相位、stats 走 DB count——全是随机/外部态。scramble 文本是确定终态（data-scramble 属性写死），等 settle 后可复现。
- **否决**：
  - *连 scramble 文本一起 mask*（spec 读法1 激进 mask）：会把首页最核心的视觉资产（标题、CTA 文案）排除在回归保护外——改标题字号/颜色不报警。输：基线失去意义。
  - *不 mask stats，改为 waitFor /api/count 完成*：DB count 在不同环境（CI vs 本地 seed）数值不同，永远不稳。输：跨环境 flaky。

### D6 多语言注入时机 → addInitScript 注入 localStorage + 等 scramble settle

**所选**：en/ja 基线用 `test.use` 的 storageState 不够（首页 DOMContentLoaded 第 1598-1606 行读 localStorage 后 `setTimeout(switchLang, 1500)`），改为 `await context.addInitScript` 在页面前注入 `localStorage.setItem('witch-trial-locale','en')`，goto 后**额外等 1500ms+ 让 switchLang 触发**，再 `waitForScrambleSettled` 等 scramble 重跑回稳。

- **原因**：首页自动切语言是 +1500ms 异步（index.html:1604），storageState 只保证 key 存在但不控制时序；addInitScript 在页面 JS 执行前注入最可靠。等 scramble 是因为 switchLang 内 new TextScramble 重跑（index.html:1001），innerText 会再次经历乱码阶段。
- **否决**：
  - *goto 后点 `.lang-btn[data-lang='en']`*（mobile.spec.ts:161 的做法）：可行但引入一次 click + scramble 重跑，比预置 locale 多一轮动画；且 click 后 scramble 从中文乱码到英文，settle 判定要处理两种文本。输：多一轮抖动。
  - *仅 storageState 注入 locale*：playwright storageState 在页面加载前写入，理论上能触发 DOMContentLoaded 分支——但 storageState 的 localStorage 注入时机 vs index.html script 执行时机有竞态（Playwright 在 navigation 前注入，应安全，但 +1500ms 的 setTimeout 仍要等）。选 addInitScript 是因为更显式、不依赖 storageState 注入时序假设。**低风险默认**：若实测 storageState 足够，可降级。

### D7 容差 → threshold:0.2 全局默认，不引入 maxDiffPixelRatio

**所选**：所有基线 `{ threshold:0.2 }`（Playwright 默认 per-pixel 容差），不设 maxDiffPixelRatio/maxDiffPixels。flaky 时（完成判定第 8 条连续 3 次一致性验证）按需逐条上调并在注释写明（R11）。

- **原因**：mask 已剔除所有随机源，剩下的应是像素级一致——用默认 threshold 足够。预先设 maxDiffPixelRatio 会"放任"本该捕捉的小回归，违背基线初衷。
- **否决**：
  - *预先给 welcome 设 maxDiffPixelRatio:0.01*：等于承认 welcome 会有随机 diff——但 mask 已消除随机源，这 1% 余量只会掩盖漏 mask 的元素。输：掩盖问题。
  - *threshold 降到 0（严格逐像素）*：抗锯齿/字体渲染在跨机器 CI 易误报。输：flaky。

## 扩展点

- **留开放**：
  - 基线目录结构（`__screenshots__/<spec>/<name>-chromium-<viewport>.png`）遵循 Playwright 默认 snapshotPathTemplate——将来加 firefox/webkit project 会自动按 project 名分桶，无需重构。
  - `waitForScrambleSettled` 写成通用 helper（接受 selector 列表参数）——未来 lang-switcher 交互测试可复用。
  - visual project 的 `testMatch` 留宽（`**/*.spec.ts`）——加新基线只需丢文件，不改 config。
- **关闭（YAGNI）**：
  - **不**做多浏览器（contract 非目标，chromium only）。
  - **不**做跨 OS 字体基线（macOS 本地 vs Linux CI 字体渲染不同——本任务范围是本地基线，CI 基线化是后续决策，刻意不在此引入 sharding/OS 矩阵）。
  - **不**封装"视觉基线基类"——7 条基线各异，抽象成本 > 收益，每个 test 直接写稳定化逻辑。
  - **不**改 ResultScreen/TestScreen 业务代码——稳定化全部在测试侧解决。

## 主要风险（3，按风险排序）

### R1（最高）首页动态元素漏 mask 或过度 mask
首页有 5 类并发动态源（canvas/cursor/live-time/blink/stats），mask 清单写错任一项都会 flaky 或漏检。**缓解**：完成判定第 8 条要求 welcome 连续跑 3 次一致——这是验证 mask 完备性的硬闸。若 3 次不一致，按"D5 判定标准"（该像素源两次运行间是否可复现）逐项加 mask；过度 mask（连 scramble 文本都 mask）的检测靠"故意改 `.hero__title` 字号验证 FAIL"（D8 验证步骤）。

### R2（中）Playwright 版本的 snapshotPathTemplate 默认行为变更导致基线路径漂移
依赖 Playwright 默认快照路径（不显式设 snapshotDir），未来升级 @playwright/test 可能改默认模板，导致已提交的 PNG 路径失效、全部重新生成。**缓解**：在 `tests/visual/README.md` 锁定 `@playwright/test ^1.59.1` 的默认行为并记录当前路径模板；或在 config 显式设 `snapshotPathTemplate` 固化路径（推荐，零成本消除风险）。

### R3（中）addInitScript 注入 locale 与 DOMContentLoaded +1500ms 的时序竞态
en/ja 基线依赖"注入 locale → DOMContentLoaded 读到 → +1500ms switchLang → scramble 重跑 → settle"这条链路，任一环时序漂移都会截到中文态或 scramble 中间态。**缓解**：`waitForScrambleSettled` 用 `expect.poll`（timeout 15s，参考 mobile.spec.ts:162 的 intervals）等 innerText 匹配**目标语言的** data-scramble——这是终态判定，不依赖固定 sleep；若 en/ja 基线 3 次不一致，降级为 goto 后点 lang-btn 的显式交互路径。

## 验证方式（D8，给审计者）

触发视觉回归 FAIL 的证明步骤——改 `src/app/globals.css` 第 78 行 `--accent:#d4af37` 为 `--accent:#ff0000`（影响 opt-index/result 稀有度条等金色元素），跑 `pnpm exec playwright test tests/visual/` 应 FAIL，`test-results/` 出现对应 `-expected.png/-actual.png/-diff.png`（R14）。验收后 git checkout 还原。**注意**：`--accent` 在 globals.css 是测试页/结果页用的变量；首页 index.html 用自己的 `--gold`（第 56-65 行），所以改 `--accent` 主要触发 Test/Result 基线 FAIL——若要触发 welcome FAIL，改 index.html 的 `--gold`。审计时按"想证明哪条基线活"选变量。

## 模块切分建议（给实现者）

**建议单人主上下文实现**——7 条基线共享稳定化协议和 config 改动，切分会有 merge 冲突（playwright.config.ts / .gitignore / visual-helpers.ts 都是单文件多基线共用）。若必须并行，按**文件**而非基线切：

| 模块 | 文件 | 职责 | 接口契约 | 禁区 |
|---|---|---|---|---|
| M1 配置 | `playwright.config.ts`、`.gitignore`、`tests/visual/README.md` | 加 visual/visual-mobile project、普通 project testIgnore、反向 gitignore、策略文档 | project 名固定 `visual`/`visual-mobile`；testIgnore 模式 `**/visual/**` | 不改 webServer/use/storageState 既有字段 |
| M2 helper | `tests/visual/visual-helpers.ts` | 导出 `waitForScrambleSettled(page, opts?)`、`maskWelcomeDynamic(page)` 返回 Locator[] | `waitForScrambleSettled` 用 expect.poll，timeout 默认 15s | 不 import 现有 helpers 改动其导出 |
| M3 spec | `tests/visual/welcome.visual.spec.ts`、`test.visual.spec.ts`、`result.visual.spec.ts` | 7 条 toHaveScreenshot，每条注释标注 L1/L2/L3 策略 | 文件名后缀 `.visual.spec.ts`，被 visual project testMatch 命中、被普通 project testIgnore | 不修改 tests/ 下任何现有 spec |

**并行约束**：M2 必须先于 M3（M3 import M2 的导出）；M1 与 M2 无依赖可并行；M3 内三个 spec 文件相互独立可并行，但共享 config（M1）所以 M1 须先 merge。接口契约：M2 导出的函数签名一旦定下，M3 各 spec 独立编写不互相阻塞。**禁区（所有模块）**：不碰 `src/`、`public/index.html`、`tests/` 下现有 15 个 spec——稳定化全在测试侧。

## 被拒绝的替代方案（3，全局）

1. **reg-suit / lost-pixel 等第三方视觉回归库**——否决：contract R1 明确"零新增依赖、复用 @playwright/test 原生 toHaveScreenshot"。引入第三方库 = 新依赖 + 新 CI 配置 + 双套基线存储，违背"最小落地"。原生 API 已支持 mask/threshold/三图产出/maxDiffPixelRatio，无功能缺口。
2. **全页 fullPage:true 截图**——否决：welcome/test 是 100vh 单屏，fullPage 与视口截图等价但 ResultScreen 会纳入 offscreen 的 share-card 容器（top:-9999px，ResultScreen.tsx:571），引入不可控噪声。视口级全页（fullPage:false 默认）+ ResultScreen 用元素截图是更精准的组合。
3. **spec 内 `page.setViewportSize` 做移动端**（沿用 mobile.spec.ts 模式）——否决：视觉基线对首帧布局敏感，goto 时 1280→375 切换会触发 resize 重排，首帧不一致。project 级 viewport 在 context 创建时生效，goto 即正确尺寸。交互测试可以容忍 setViewportSize，视觉基线不能。

---

**相关文件路径**（实现者执行时参考）：
- 配置入口：`/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（加 2 个 project + 普通 project testIgnore）
- 反向规则：`/Users/munich/Desktop/独立项目/magical-girls/.gitignore`（第 64-74 行附近加反向块）
- 首页 DOM 真相：`/Users/munich/Desktop/独立项目/magical-girls/public/index.html`（第 833-870 hero、939-1012 switchLang、1458-1607 DOMContentLoaded/scramble）
- 稳定化目标：`/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（第 91-95 reducedMotion、116-120 立即 done）、`/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（第 352-364 staggerIn、第 78 `--accent` 验证用）
- 复用源：`/Users/munich/Desktop/独立项目/magical-girls/tests/helpers.ts`（`waitForWelcomeLoaded` 第 139 行）、`/Users/munich/Desktop/独立项目/magical-girls/tests/reveal.spec.ts`（`skipRevealAndWaitCard` 第 17 行，参考但不复用）
- 不动的现有截图：`/Users/munich/Desktop/独立项目/magical-girls/tests/screenshot.spec.ts`（保留）

整个方案不写实现代码、不改任何文件——以上是契约/模块级设计，实现者拿到可直接动手。
