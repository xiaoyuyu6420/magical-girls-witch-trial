# 在 /Users/munich/Desktop/独立项目/magical-girls 这个 Next.js 16 ...

- 会话 ID: `sess_subagent_agent_6573ad5a-e231-4e7c-ab33-2ce46c3d0ade`
- 时间: 2026-08-08 19:02:07 → 2026-08-08 19:04:16
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
在 /Users/munich/Desktop/独立项目/magical-girls 这个 Next.js 16 项目里，我要写 Playwright 视觉回归测试（toHaveScreenshot），需要精准了解关键页面的 DOM 结构和动画机制。请搜索并报告以下内容（medium 探索深度）：

## 1. WelcomeScreen（首页 `/`）
- 找到首页组件文件（可能在 src/components/ 下，名字可能是 WelcomeScreen 或类似），报告：
  - canvas 粒子动画的 DOM 选择器（canvas 元素的 class/id）
  - hero 区的 class 名（hero__title / hero__tagline / hero__cta / hero__stats / hero__overline 这些是否真实存在？从 screenshot.spec.ts 看用了这些选择器）
  - **关键**：scramble 文字动画的实现——是否有 `data-scramble` 属性？scramble 动画的 class 名？动画什么时候结束（是否有终态标志）？
  - loader 的选择器（helpers.ts 用了 `#loader`，确认）和 `translateY(-100%)` 滑走逻辑
  - lang-switcher 的选择器和切换语言的机制（点击按钮？改 locale？i18n 怎么切换？）

## 2. TestScreen（答题页 `/test`）
- 找到 TestScreen 组件，报告：
  - 普通题的 `.opt-block` 选项结构
  - 题目文字的选择器（`.q-text`？）
  - 答题进入时机（什么时候 DOM 稳定可截图）

## 3. ResultScreen（结果页 `.result-layout`）
- 找到 ResultScreen 组件，报告：
  - `.result-layout` 内的关键子元素 class 名（`.r-name` / `.r-actions` / `.btn-restart` 等）
  - 揭晓序列的 DOM（粒子爆发）和档案卡的切换标志（怎么判断揭晓结束、档案卡出现）
  - 档案卡稳定态包含哪些可截图区域

## 4. i18n 切换机制
- src/lib/i18n.tsx 怎么实现 locale 切换
- 切换语言后哪些 DOM 会变（文字、布局）
- zh-CN / en / ja 三种 locale 的切换方式（URL？localStorage？context？）

## 5. 全局样式
- src/app/globals.css 里是否有 `prefers-reduced-motion` 处理（这可用来禁用动画做截图！）
- 是否有 CSS 变量（如 `--accent`）方便测试视觉回归触发

请给出具体的文件路径:行号 和选择器/class 名。重点是能让我写稳定的视觉回归选择器。

## 🤖 助手
我来系统地探索这个项目。先并行查找关键文件。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
app 目录下没有根 page.tsx，这很奇怪。让我查一下首页到底在哪，以及测试文件里用到的选择器。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
测试里用了 `.hero__title` 等选择器但源码中搜不到，首页组件可能改名了。让我全面查找。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键发现：首页 `/` 被 rewrite 到静态文件 `public/index.html`。让我读它。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
首页完整拿到了。现在并行读取 TestScreen、ResultScreen、i18n.tsx 和 globals.css。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在读取 ResultScreen 和 globals.css。

> 🔧 工具调用 2 次: Read, Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
主要文件都已读取。现在补齐几个细节：prefers-reduced-motion、confetti 粒子、lang-switcher 在 /test 页的位置，以及现有 screenshot.spec.ts 的用法。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
最后确认几个细节：canvas-confetti 是否实际使用、AppShell 内容、reveal 测试的选择器，以及移动端 scramble 完成检测方式。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
探索完成。以下是完整报告。

---

# Playwright 视觉回归测试 — DOM 结构与动画机制报告

## 关键前提：首页不是 React 组件！

`/Users/munich/Desktop/独立项目/magical-girls/next.config.ts:20-26` 将 `/` rewrite 到 **静态文件** `/Users/munich/Desktop/独立项目/magical-girls/public/index.html`（1657 行，纯 HTML+内联 CSS/JS，绕过 Next 运行时）。不存在 `src/components/WelcomeScreen.tsx`。你现有的 `tests/screenshot.spec.ts` 用的选择器全部真实存在，但**首页 DOM 与 globals.css 完全是两套体系**（首页用内联 `<style>`，React 应用用 globals.css）。

---

## 1. WelcomeScreen（`/` = public/index.html）

### canvas 粒子动画
- 选择器：`#abyss-canvas`（index.html:831 元素；CSS 88-94，z-index:1、opacity:0.6；JS 1088-1348）
- 2D canvas dash 粒子，`requestAnimationFrame` **无限循环**（1346-1348），无暂停机制 → canvas 内容永远在动，单独对 canvas 截图必然不稳定。它只是背景（hero z-index:20 在它上面）。

### hero 区 — 你列的选择器全部真实存在（index.html:854-871, CSS 650-784）
- `.hero`（section，854，CSS 650）— 绝对定位居中，`width: min(640px, 86vw)`
- `.hero__overline`（855，CSS 660）— 有 `data-scramble="序章 · PROLOGUE · I"`
- `.hero__eyebrow`（856，CSS 669）— "MAGICAL GIRL'S"，无 scramble
- `.hero__title`（857，h1，CSS 678）— `data-scramble="魔女审判"`
- `.hero__ornament` > `.hero__rule` + `.hero__sigil`（858-862，装饰线）
- `.hero__taglines`（863）> `.hero__tagline` ×2（864、865，CSS 701-713；第二条带 `--quiet` 修饰）— 都有 `data-scramble`
- `.hero__cta-wrap.magnetic-btn-wrap`（867）+ `.hero__cta.magnetic`（868，button，CSS 722-753）— `data-scramble="接受审判"`
- `.hero__stats`（870，`id="hero-stats"`，CSS 755）— 文本由 `/api/count` fetch 填充（1470-1481）
- **注意**：`.hero__tagline` 是复数选择器问题——`welcome.spec.ts:50` 用 `.hero__tagline`（匹配 2 个），screenshot.spec.ts 用 `.hero__taglines`（容器）。写测试时注意区分。

### scramble 动画（TextScramble 类，index.html:1022-1074）
- `data-scramble` 属性：**存在**，位于 `.loader-text`、`.hero__overline`、`.hero__title`、两个 `.hero__tagline`、`.hero__cta`（822/855/857/864/865/868）
- **没有 CSS class**，是 JS class `TextScramble`；动画期间元素 innerHTML 含 `<span style="color:var(--blood)">!<>-_\/[]{}—=+*^?#________</span>` 乱码字符（1058）
- **没有终态标志**（无 data-done / 无 class）。完成判定的可靠方法：
  1. `expect.poll(() => el.innerText).toBe(el.getAttribute('data-scramble'))` — 最稳
  2. 或轮询 `el.querySelector('span[style*="var(--blood)"]') === null`
- 时序（boot 序列 1421-1456）：进度条随机递增（~100ms×7 次）→ 100% 后 `scrambler.setText('ACCESS GRANTED')` → 再 +800ms → loader 滑走 → 各 `[data-scramble]` 元素**按 DOM 顺序间隔 200ms**（`500 + index*200`）逐个开始 scramble，每个字符最长 80 帧 ≈ 1.33s。最后一个元素（CTA，index 5）约 loader 滑走后 2.8s 完成。**整体约 5-6 秒稳定**（现有 screenshot.spec.ts 的 `waitForTimeout(5000)` 刚好临界，建议改轮询）。

### loader（helpers.ts 的 `#loader` 确认）
- `#loader`：index.html:821，CSS 392-399，`position:fixed; inset:0; z-index:10000; transition: transform 1.2s var(--easing)`
- 滑走：`document.getElementById('loader').style.transform = 'translateY(-100%)'`（1442）。helpers.ts 的 transform 检测逻辑正确（还有 `.loader-text` / `#l-bar` 进度条子元素）
- **截图隐患**：`#live-time`（840）每帧刷新（1407-1416），全页截图时间戳区域必变；`.status-blink` 无限 blink 动画（CSS 153-165）；`.fs-prompt` 全屏提示（790-800）在 DOMContentLoaded +2s 弹出、`z-index:20000` 全屏覆盖 —— **截图前必须点击 `.fs-prompt-skip` 或预置 `localStorage['witch-trial-fs-prompted']`**（逻辑在 1644-1654）

### lang-switcher（仅首页）
- `.lang-switcher`（813-818，CSS 352-387，fixed 左下）+ 4 个 `.lang-btn`：`[data-lang="zh"|"tw"|"en"|"jp"]`，active 类切换（943-945）
- 机制：点击 → `switchLang()`（939-1012）纯前端，**无 URL 变化**；写 `localStorage.setItem('witch-trial-locale', ...)`（1011，zh→"zh-CN"、tw→"zh-TW"、jp→"ja"、en→"en"）；切换文本用新 TextScramble 重跑（异步，无终态标志）
- **坑**：DOMContentLoaded 时会读回 localStorage，非 zh 时 **+1500ms 后自动切语言**（1598-1607）→ 截图测试前必须清掉 `witch-trial-locale`，否则语言随机
- 切换后变动的 DOM：`.hud-top`/`.hud-bottom` 文本、`.giant-text.kanji`（849-851）、overline/title/taglines/CTA 文本 + `body` 的 fontFamily（en 用 serif，其他 mono，948-949）

---

## 2. TestScreen（`/test`）

组件 `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`，挂载于 `src/app/test/page.tsx:183-190`。

### DOM 结构（TestScreen.tsx:593-638）
- `.view-test`（594）> `#progress-line`（595，globals.css:109-117，宽随进度 0.8s 过渡）+ 退出按钮（无 class）+ `.watermark-index`（622）+ `#test-stage-wrapper`（623，`.stage-fade-out` 时整层淡出）> `.question-stage`（624）> `.q-meta`（625）+ `.q-text`（632，**id=`q-text-${current.id}`**，CSS 347）+ `.options-stage`（383/355，CSS 349）> `.opt-block`（button，CSS 352-363）> `.opt-content` > `.opt-index`（罗马数字）+ `.opt-text`
- 变体：天平题复用 `.opt-block`（355-374）；砝码题 `.options-stage.weight-stage` + 文本"落锤"的确认按钮（424-532）；批注插页 `.interjection-overlay`（544-591，第 5/10/15 题后出现，须点掉）

### 答题进入时机 / 稳定判定
- `/test` 页先 fetch `/api/quiz`，`questions.length > 0` 才渲染 TestScreen（page.tsx:33-56, 183）
- `.opt-block` 入场动画：`staggerIn 0.6s var(--ease-out-expo) forwards`，`animationDelay: idx*0.1s`（TSX:364/392，CSS:358+364）→ **终态 opacity:1**。桌面端稳定等待约 0.8-1s（或 `expect.poll` computedStyle opacity === "1"）。移动端（≤768px）动画被禁用（globals.css:591-602，`animation:none; opacity:1`）
- 切题动画：点击后 `isAnimating` 700ms（触摸 280ms）→ `.stage-fade-out`（CSS 342）→ 下一题 staggerIn。连续答题截图需等 1.2s+ 或轮询 `.opt-block` opacity
- `body.in-test` class 在挂载时添加（TSX:336-341）→ 进度线可见
- **TestScreen 没有语言切换 UI**；locale 只由 `i18n.tsx` 在 mount 时从 localStorage/navigator 决定

---

## 3. ResultScreen（`.result-layout`）

组件 `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`。渲染条件：`/api/match` + `/api/results` 都成功后 `setShowResult(true)`（page.tsx:63-116, 135-136）。期间有全屏 loading spinner（page.tsx:192-220，z-index:8000）。

### 关键结构（ResultScreen.tsx:281-437）
- `#view-result`（281，CSS 388-394，**浅色背景** `rgba(250,250,250,0.85)`，与深色测试页完全不同）
- `.result-layout`（285，`role="region"`，**`aria-hidden={revealPhase !== "done"}`**，初始 `opacity:0`，过渡 0.8s）> 内联样式容器（`maxWidth:640`，ref=profileRef）>：
  - `.r-name`（315，角色名，CSS 405）
  - `.r-slogan`（331，CSS 433）
  - `.r-desc`（360）
  - `.r-keywords`（364）+ `.r-keyword-tag`（373，CSS 453-458）
  - 稀有度条（380-407，无 class，宽度 = typePercentage%）
  - `.r-actions`（423，CSS 445-447）> **两个 `.btn-restart`**（424、427，CSS 420-430）— 第一个是分享、第二个是重开，class 相同，只能按文本区分
- **`--accent` 变量不存在**；结果页是浅色主题，注意与你其他深色页面不同

### 揭晓序列 — 没有粒子爆发！
- `canvas-confetti` 虽在 package.json:16，但 **src 中无任何 import**（只有 `src/types/canvas-confetti.d.ts` 声明）。RadarChart/DimensionBar 组件也未被引用。揭晓 = 纯 DOM：`role="status"` 的 overlay（443-566，`z-index:100`，`background:#050308` 深色）内 6 段文本 stagger + 角色名 blur 交叉淡化（CSS-in-JS）
- 时间线（REVEAL_TIMINGS，13-22）：judgementText 800ms → transitionText 1800 → nameReveal 2400 → slogan 3000 → fromWork 3800 → hiddenReveal 4000 → **cardReady 4600ms → revealPhase="done"** → +50ms overlay 淡出 0.8s 同时 `.result-layout` opacity 淡入 0.8s（196-205, 291-293）
- **档案卡出现标志**：`.result-layout` 的 `aria-hidden` 变 `"false"`（288）+ opacity 到 1。稳定截图等待：`await expect(locator('.result-layout')).toHaveAttribute('aria-hidden','false')` 后再等 ~1s 过渡；或直接 `page.mouse.click(640,360)` 跳过揭晓（reveal.spec.ts:17-21 的做法，skipReveal 逻辑 173-193：任意 click/keydown 立即 done）
- **reduced-motion 支持（JS 层）**：ResultScreen.tsx:91-95 用 `window.matchMedia("(prefers-reduced-motion: reduce)")`，命中则跳过揭晓直接 ALL_VISIBLE + done（115-120），且所有 transition 设 `"none"`（292, 460, 204）→ **Playwright context 开 `reducedMotion: 'reduce'` 可让结果页立即稳定**（注意：只对 ResultScreen 生效，对首页/测试页 CSS 动画无效，见下）

---

## 4. i18n 机制

`/Users/munich/Desktop/独立项目/magical-girls/src/lib/i18n.tsx`：
- `Locale = "zh-CN" | "zh-TW" | "en" | "ja"`（**4 种**，不是 3 种）
- `detectLocale()`（15-21）：localStorage `witch-trial-locale` 优先 → navigator.language 映射 → 默认 zh-CN；在 mount 时 `queueMicrotask` 设置（46-50）
- `setLocale()`（62-66）：setState + `localStorage.setItem` + 动态 import `@/i18n/{zh-CN,zh-TW,en,ja}.ts`；同时写 `document.documentElement.lang`（57-59）
- **纯 localStorage + React context，无 URL 参数**；AppShell（layout.tsx:70）包裹 I18nProvider
- **测试切语言的正确姿势**：`context.addInitScript(() => localStorage.setItem('witch-trial-locale','en'))`（必须在页面加载前注入）。首页（静态页）例外：它自己 DOMContentLoaded +1500ms 才应用（index.html:1598-1607）
- 切语言后变化的 DOM：
  - /test：题目 text/meta/选项 label（走 `q.translations` JSON，TSX:141-170）— **题目数量也可能变**（locale 过滤逻辑不同）
  - 结果页：localized 的 name/slogan/desc/keywords/subtitle（useLocalizedContent）+ 所有 `t()` 文本（按钮、提示、稀有度、免责声明）
  - 首页：HUD、大字、overline/title/tagline/CTA/stats + body fontFamily

---

## 5. 全局样式（globals.css）

- **globals.css 和 public/index.html 都没有 `@media (prefers-reduced-motion)` 规则**。唯一 reduced-motion 处理是 ResultScreen 的 JS matchMedia。所以：开 `reducedMotion:'reduce'` 只能跳过结果页揭晓；首页 scramble/loader/canvas/status-blink、测试页 staggerIn 等 CSS/JS 动画**照常运行**，不能用它禁用
- 变量（globals.css:52-90，React 应用侧）：`--c-void:#0c0a14`、`--c-gold:#d4af37`、`--c-blood:#8b0000`、`--c-text:#ede9f3`、`--f-title`/`--f-body`、`--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`、`--background:#050308`、`--primary:#d4af37`、`--accent:#d4af37`（:78，**存在**，tailwind shadcn 主题变量）
- 首页侧变量（index.html:56-65）：`--bg:#030303`、`--fg:#EFEFEF`、`--blood:#b80a1f`、`--gold:#d4af37`、`--ash`、`--easing`
- 截图稳定性额外注意：桌面端鼠标移动后自定义光标 `#cursor-dot`/`#cursor-ring` 出现（z-index:20001、mix-blend-mode: difference，index.html:320-340）且磁性按钮 transform 位移（1379-1402）→ 用 `page.mouse.move(0,0)` 或固定鼠标位置再截图

---

## 给 toHaveScreenshot 的落地建议

1. 首页：goto 前 `addInitScript` 清 `witch-trial-locale` + 设 `witch-trial-fs-prompted`；用 `waitForWelcomeLoaded`（helpers.ts:60-73）后再 `expect.poll` 所有 `[data-scramble]` 的 `innerText === data-scramble`；元素级截图（title/tagline/CTA/stats 均可）；避免全页截图（live-time 跳动）
2. 测试页：等 `.opt-block` opacity === 1（~1s）再截；截 `.q-text` + `.options-stage`；建议只截首题，避免切题动画
3. 结果页：`reducedMotion:'reduce'` context + 等 `aria-hidden="false"` + 800ms 过渡；可截 `.result-layout`（含 `.r-name`/`.r-slogan`/`.r-desc`/`.r-keywords`/`.r-actions`）；别再找 confetti，没有
4. 语言测试：首页点 `.lang-btn[data-lang='en']` 后轮询 `.hero__cta` 的 `data-scramble` 属性（mobile.spec.ts:159-175 已验证该模式）；/test 与结果页用 addInitScript 预置 localStorage
