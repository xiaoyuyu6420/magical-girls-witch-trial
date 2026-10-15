# 你的任务：根据 Emil Kowalski 动画规范，优化一个 Next.js 测试应用**从首页（welcome...

- 会话 ID: `sess_subagent_agent_fc3f7188-5bfb-404b-a120-68ff32d8c7af`
- 时间: 2026-08-11 19:04:41 → 2026-08-11 19:09:00
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 12
- 归档状态: 未归档

---

## 👤 用户
你的任务：根据 Emil Kowalski 动画规范，优化一个 Next.js 测试应用**从首页（welcome）进入测试页（/test）时的过渡闪烁**。用户反馈"开始测试后会闪一下，过渡很割裂"。直接修改代码，最后回传改动摘要 + 设计决策。

## 项目背景与过渡机制（重要：这是两套系统）

这个应用的首页和测试页是**两套独立系统**：
- **welcome 页** = `public/index.html`（独立静态 HTML，自己的内联 CSS + JS，**不走 Next.js**）。访问 `/` 时 next.config.ts 的 rewrite 返回这个静态页。它有丰富的视觉层：abyss-canvas（粒子背景）、noise-layer、自定义光标。
- **/test 页** = Next.js 应用（`src/app/test/page.tsx` + `src/components/TestScreen.tsx`）。

**过渡方式**：welcome 页**不是路由跳转**，而是用一个 **iframe 嵌入 /test**。点击"开始测试"按钮 → 调用 `initiateDive()`（`public/index.html:1571`）→ 创建/设置 iframe.src='/test' → 延时后显示 iframe。

## 完整过渡时序（initiateDive，public/index.html:1571-1595）—— 这是"闪"的核心

```
t=0ms:   点击按钮
         - ensureEmbeddedTestFrame(): 创建 iframe, 设 frame.src='/test' (iframe 开始加载 /test)
         - document.body.style.transition='background 0.3s'; body 背景从原色 → 暗红 #b80a1f
         - hero (主视觉) opacity → 0 (淡出)
         - bgTextContainer (背景大字) opacity → 0 (淡出)
         - 隐藏自定义光标

t=150ms: 第一个 setTimeout 触发
         - document.body.style.background = '#000'  (body 从暗红 → 纯黑，有 0.3s transition)
         - overflow:hidden

t=750ms: 第二个 setTimeout (150+600) 触发
         - enterEmbeddedTest(): body 加 'test-embedded' class
         - CSS: body.test-embedded #test-embed { display:block }  → iframe 显示
```

**iframe CSS（public/index.html:428-437）**：`#test-embed { display:none; background:#030303; z-index:30000; }`，`body.test-embedded #test-embed { display:block; }`

## /test 页加载时序（src/app/test/page.tsx）

iframe 加载 /test 后：
1. TestPage 挂载 → `useEffect` 调 `loadQuiz()` → `fetch('/api/quiz')`（异步网络请求）
2. **fetch 期间 `questions.length === 0`，TestScreen 不渲染**（page.tsx:183 `questions.length > 0 && <TestScreen>`）→ iframe 内容空白（只有 page.tsx:129 的 `background:'#030303'` 黑底）
3. fetch 回来 → `setQuestions(qs)` → TestScreen 渲染
4. TestScreen 里：**只有选项 `.opt-block` 有进场动画**（mobileOptIn，错峰淡入）；**题目区 `.question-stage`、顶栏 `.test-header`、水印 `.watermark-index` 是突然出现的，没有进场动画**

## "闪一下"的两个根因（已诊断）

1. **暗红闪现**：initiateDive 在 t=0 把 body 变暗红 #b80a1f，t=150ms 又变黑 #000。这 150ms 的红色闪现可能就是"割裂感"来源之一（红色和测试页的黑色调不连续）。
2. **内容突变**：iframe 在 t=750ms 显示时，/test 的 fetch 可能还没完成 → 黑空帧。fetch 完成 → TestScreen 渲染，但**只有选项淡入，题目/顶栏/水印突然出现** → 从黑帧到完整内容的跳变。这个"题目区无进场动画"是内容突变的直接原因。

## Emil 规范（你的优化依据）

完整规范在：`/Users/munich/.zcode/cli/exec/sess_67633b59-5e0c-4b18-a9d9-be28f5279929/call_75d46396adf942a0b919286e-stdout.log`。**先读它**。本次最相关的规则：

- **Preventing a jarring change**（动画的目的之一）：桥接 otherwise 会 teleport 的内容变化——这正是当前问题。
- **Masking a crossfade that won't settle**（RECIPES.md）：当两个状态在过渡期间重叠且调不准时，用 `filter: blur()` 模糊接缝，骗过眼睛感知成一次连贯变化。`transition: filter 200ms ease, opacity 200ms ease`，过渡态 `filter: blur(2px); opacity: 0.7`。blur 保持 <20px（Safari 性能）。
- **进场用 ease-out**，transform+opacity only，时长 <300ms（UI）/ 可更长（marketing/explanatory）。
- **CSS animations beat JS under load**（进场用 CSS animation，off main thread）。
- **`@starting-style`** 用于元素 mount 进场（现代 CSS，无需 JS mounted flag）；不支持时 fallback 到 data-mounted 属性。
- 时长表：modal/drawer 200-500ms；marketing/explanatory 可更长。页面级过渡可偏长（这是"首次进入测试"的仪式感时刻，属于 rare/first-time tier，delight budget 允许稍长）。

## 相关文件位置
- `public/index.html`：welcome 静态页。initiateDive 在 1571-1595。iframe CSS 在 428-437。enterEmbeddedTest 在 1557。（⚠️ 这是独立 HTML，内联 CSS/JS，不走 Next.js 编译）
- `src/app/test/page.tsx`：/test 页。TestScreen 渲染条件在 183。背景在 129。
- `src/components/TestScreen.tsx`：测试组件。根容器 `.view-test`（约 663 行 JSX），`#test-stage-wrapper` 包题目+选项。顶栏 `.test-header`、水印 `.watermark-index`。
- `src/app/globals.css`：移动端测试页动画在 `@media (max-width:768px),(pointer:coarse)` 块（约 628 行起）。缓动 token `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`（第 62 行）。

## 优化方向（我的判断，你可调整）

核心目标是**消除两个闪源，让 welcome→test 成为一次连贯的"沉入黑暗→测试浮现"过渡**：

1. **/test 内容整体进场淡入**（最关键）：TestScreen 渲染时，整个舞台（`.view-test` 或 `#test-stage-wrapper`）从 opacity:0 淡入（配合轻微 transform），让内容从黑场柔和浮现，而不是题目/顶栏突然出现。选项的 mobileOptIn 错峰在此基础上叠层。考虑用 CSS animation（mount 触发）或 `@starting-style`。注意：这只影响移动端？还是桌面也要？——当前测试页动画改动都在移动端块，但这个进场过渡如果做，桌面端也该有（桌面 staggerIn 只覆盖选项，题目也是突现的）。请判断范围。

2. **initiateDive 的暗红阶段**：评估 #b80a1f 红色闪现是否保留。选项：(a) 去掉红色，直接 welcome→黑；（b) 保留红但作为主题色，确保红→黑→内容连贯；（c) 用 blur 遮盖红→黑的接缝。这是 welcome 页（public/index.html）的改动。

3. **时序协调**：iframe 显示（t=750ms）vs /test 内容就绪（fetch 完成时间不定）。如果 750ms 时内容没好，iframe 黑帧暴露。可考虑：iframe 内容整体淡入（方向1）天然遮盖这个空窗——黑帧→淡入内容，用户感知不到 fetch 延迟。

## 约束
- `public/index.html` 是独立静态页，改它的 JS/CSS 不影响 Next.js 构建。
- /test 在 iframe 里，welcome 页和 /test 页**无法直接通信**（跨 document，iframe load 事件能监听但内容就绪检测困难）。所以方案要避免依赖"welcome 等 /test 内容就绪"——靠 /test 自己的进场动画来遮盖空窗更可靠。
- 缓动复用 `--ease-out-expo` token（globals.css 已有）；public/index.html 没有这个 token，如果 welcome 侧需要缓动，内联 `cubic-bezier(0.16,1,0.3,1)`。
- 桌面端不要破坏（桌面也走这个过渡，桌面也有"题目突现"问题，可以一并优化）。
- 不要引入新依赖。

## 验证（你做完后）
- 读改完的文件确认无语法错误
- **不要跑 playwright 测试**（主 agent 会验证）
- dev server 在 3010 跑着（HMR），但 public/index.html 的改动需要刷新（不走 HMR）

## 产出格式
回传简短摘要：
1. 改了哪些文件、哪些逻辑
2. 关键设计决策（对照 Emil 规范：每个过渡的 tool/properties/curve/duration）
3. 如何消除两个闪源（暗红闪现 + 内容突变）的对应说明
4. 偏离上述方向的地方 + 理由
5. 需要主 agent 真机 feel-check 的点（过渡节奏、blur 是否过重、红色是否保留等）

不要回传大段代码。聚焦决策和改动逻辑。

## 🤖 助手
我先读取 Emil 规范和关键代码文件，理解现状。

> 🔧 工具调用 3 次: Read

## 🤖 助手
已读完 Emil 规范、page.tsx 和 TestScreen.tsx。现在读 welcome 页的关键段落和 globals.css 的动画块。

> 🔧 工具调用 4 次: Read

## 🤖 助手
现在定位 welcome 页的 body 背景设定和 globals.css 桌面端的测试页样式，确认红闪可见性和桌面题目突现。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键发现：桌面端选项也有 `staggerIn` 进场动画（globals.css:371），所以两端都是"题目/顶栏/水印突现，只有选项淡入"。现在确认 welcome 页 `--bg` 变量值、hero 是否有 transition、body 满屏覆盖层级。

> 🔧 工具调用 4 次: Read

## 🤖 助手
完整图景已确认。关键事实：

- welcome 页 `--bg: #030303`（近黑），initiateDive 做的是 `#030303 → #b80a1f（亮血红）→ #000`——从近黑突变到亮红再回黑，红闪极其明显。
- `.hero` 没有 transition，`opacity='0'` 瞬间消失，会暴露 body 背景变化。
- 两端都只有选项（`.opt-block`）有进场动画（桌面 `staggerIn` / 移动 `mobileOptIn`），题目/顶栏/水印突现。
- `.view-test` 在 globals.css 无任何动画定义。

诊断完成，开始改。先改 welcome 页 initiateDive 消除红闪。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
welcome 页改完。现在给 globals.css 加 `.view-test` 首次进场动画。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
加 `prefers-reduced-motion` 降级（保留 opacity 淡入辅助理解，去掉 translateY 位移）。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
三处改动完成。做一次轻量语法 sanity check：确认三处文本到位、CSS 花括号平衡、initiateDive 无残留红阶段引用。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
三处改动全部到位，CSS 花括号平衡（209=209），initiateDive 代码内已无 `#b80a1f` 红中间态（仅 `:root` 变量定义和注释保留），无语法问题。回传摘要。

> 🔧 工具调用 1 次: RespondToCoordinator

## 🤖 助手
任务完成。三处改动已落地并验证通过（CSS 花括号平衡 209=209，initiateDive 无红中间态残留），摘要已回传给主 agent。等待主 agent 真机 feel-check 的反馈。
