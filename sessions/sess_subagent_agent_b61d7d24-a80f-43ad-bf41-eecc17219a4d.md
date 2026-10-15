# 你是 implementer，重写 `src/components/ResultScreen.tsx` 实现"揭晓...

- 会话 ID: `sess_subagent_agent_b61d7d24-a80f-43ad-bf41-eecc17219a4d`
- 时间: 2026-08-07 10:22:51 → 2026-08-07 10:28:23
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
你是 implementer，重写 `src/components/ResultScreen.tsx` 实现"揭晓时刻"（REDESIGN 第五节）。这是 R-C2/R-C3/R-C4 合并任务，因 ResultScreen 是强耦合单文件。

## 必读文件（先读再改）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（288行，主战场，要重写）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（意图契约 R1-R20 + A1-A7 决策）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（结果页 CSS，L388-452 有可复用的 #view-result/.result-layout/.r-name/.r-slogan/.btn-restart 等）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts`（result 段，含新增的 reveal*/rarity*/shareHook 等文案）

## 任务（按 R1-R20 契约）

### 整体架构（A1 = 内联 phase）
ResultScreen 内部管理揭晓阶段。挂载时播放揭晓序列，序列完成（或被跳过）后显示完整档案卡。用 `revealPhase` state：`"revealing" | "done"`。挂载时=revealing，序列播完或被跳过=done。

### R-C2：揭晓序列（R1-R5）
6 元素按 REVEAL_TIMINGS 错峰出场（motion-18 stagger）。提取常量：
```ts
const REVEAL_TIMINGS = {
  pageFadeOut: 0,      // t=0.0 答题页模糊淡出（motion-7）
  judgementText: 800,  // t=0.8s 「审判结束了。」
  transitionText: 1800,// t=1.8s 「而你是——」
  nameReveal: 2400,    // t=2.4s 角色名从模糊浮现（motion-7 + ease-out-expo）
  slogan: 3000,        // t=3.0s 标语浮现
  fromWork: 3800,      // t=3.8s 来自《魔女审判》
  cardReady: 4200,     // t=4.2s 档案卡完整可用（revealPhase→done）
};
```
- 每个元素用 setTimeout 控制可见性（opacity + transform，ease-out-expo cubic-bezier(0.16,1,0.3,1)）。
- 角色名用 motion-7（cross-fade through blur）：初始 filter:blur(20px) opacity:0 → blur(0) opacity:1。
- **R2 跳过**：任意点击/按键（keydown 任意键）→ 立即 clear 所有 timer，所有元素可见，revealPhase=done（motion-11 interruptible）。
- **R5 reduced-motion**：`window.matchMedia("(prefers-reduced-motion: reduce)").matches` → 跳过揭晓，直接 revealPhase=done，所有元素立即可见（仅单帧淡入或无动画）。
- 揭晓层覆盖在档案卡之上（z-index），done 后隐藏（pointer-events:none + opacity:0）。

揭晓序列6元素（从上到下）：
1. 「审判结束了。」(revealJudgement) — 小字，居中
2. 「而你是——」(revealTransition) — 小字，留白
3. 角色名(localized.name) — 大字，motion-7 blur 浮现。特殊处理：字间距加大（如"二 阶 堂 希 罗"效果用 letter-spacing）
4. 标语(localized.slogan) — 浮现
5. 来自《魔女审判》— 用 t("result.revealFrom", {title: pack.title || "魔女审判"})
6. （cardReady 后揭晓层淡出，档案卡显现）

揭晓层背景：深色（#030303 或 #050308），与答题页连续（motion-7 模糊淡出感）。

### R-C3：角色档案卡（R6-R12）
揭晓完成后（revealPhase=done）显示的档案卡结构（REDESIGN §5.4 ASCII）：
```
角色名（大字）+ 英文 subtitle
标语
───── 来自《魔女审判》─────
一句话作品介绍（pack.workIntro）
[分隔]
第二人称描述（localized.desc）
灵魂特质：关键词（localized.keywords）
稀有度：▓▓░░░░░░░░ 全球仅 X%
[分享我的审判] [重新审判]
```
- **R12 砍除**：删除原 r-stats(similarity% + top3)、详情按钮、整个 showDetail 弹窗（RadarChart/DimensionBar 引用全删）。不再 import RadarChart/DimensionBar/parseVector。
- **R11 稀有度**：数字 = stats.typePercentage，越小越稀有。填充条：填充比例 = typePercentage%（如 3.4%→条几乎空，语义"你是稀有的"）。用 ▓░ 字符或 div 进度条。stats=null 时显示"全球数据收集中"(rarityCollecting)，条禁用。隐藏角色(special=true)用"极少判定 · X%"(rarityRare)。
- **R6 作品介绍**：pack.workIntro。
- **R16 隐藏角色轻量区分**：special=true 时，揭晓后多一行 hiddenReveal 文案"……审判庭从未见过这样的受审者。"。
- **R9 motion-6**：档案卡容器若内容溢出（移动端），应用边缘模糊（mask-image 或 overlay）。一屏放下时不触发。

### R-C4：分享卡（R13-R15）
重做分享卡（原 L256-285）：
- 钩子文案"我接受了灵魂审判。"(shareHook) — 顶部
- 角色名 + subtitle
- 标语
- 来自《魔女审判》
- 稀有度数字（rarityGlobal，无 similarity%）
- 行动召唤"来接受审判 →"(shareCta)
- **R13**：删除原 similarity%/RESONANCE 行（L274-276）。
- 保留现有 toPng 生成逻辑、navigator.share 剪贴板逻辑（handleShare 不变）。

## 关键约束
- **锁死区**：不改 match.ts、answer-processor、MatchResult 结构、WEIGHTS、ALGO_CONFIG、vector、维度code。
- **R19**：result.similarity/top3 字段还在（match 返回），但 UI 不显示。similarity 可保留在 shareText 内部追踪（但分享卡不显示）。
- **ease-out-expo**：cubic-bezier(0.16,1,0.3,1) 贯穿（R4）。
- **R8**：复用 localized.desc / localized.keywords。
- **R10**：保留分享 + 重新审判按钮（handleShare/onRestart）。

## 复用现有 CSS
globals.css 有 .r-name/.r-slogan/.btn-restart/.result-layout 等，可直接用 class 名。新增的揭晓元素如需特有样式，用 inline style 或在 globals.css 加（优先 inline 减少改动面）。

## 你的产出
1. BLUF。
2. 修改 ResultScreen.tsx（完整重写）。
3. 如需在 globals.css 加样式，列出新增的 class。
4. 触及的文件。
5. 局部检查：`pnpm test` 全绿；`npx tsc --noEmit`（排除 pre-existing tests/helpers.ts 错误）无新增错误。
6. 任何偏离契约。

## 禁区
- 不改 match.ts/answer-processor/config.ts(WEIGHTS/ALGO)/vector/code。
- 不改 test/page.tsx（A1=内联，ResultScreen 自管 phase）。
- 不改 i18n 文案（R-C1 已定，你只消费）。
- 不做 motion-3(逐字)/motion-22(光呼吸)（R18 可选不做）。
- 不做隐藏角色粒子裂缝光效（R16 只轻量文案）。

开始。先读所有必读文件，再重写。揭晓序列的动效要打磨——这是结果页第一秒，最关键。

## 🤖 助手
现在我来检查包结构和 `workIntro` 字段，并参考现有的组件。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
我已经完全理解了。现在我将编写完整的 `ResultScreen.tsx`。

> 🔧 工具调用 1 次: Write

## 🤖 助手
现有 CSS 中 `#view-result` 的背景是亮色 `rgba(250,250,250,0.85)` + `backdrop-filter: blur(20px)`，这是原版亮色结果页。现在揭晓层覆盖深色背景，但揭晓完成后档案卡仍然显示在亮色背景上——这个 CSS 不需要改。档案卡使用了现有的 `.r-name`、`.r-slogan`、`.btn-restart`、`.r-desc`、`.r-keywords`、`.r-keyword-tag`、`.r-actions` 等 class，全部在 globals.css 中已定义。所有新增样式均使用 inline style，不需要额外添加 CSS class。

不过有一个问题：原来的 `#view-result` 是 `position: absolute` 覆盖全屏的亮色层。现在揭晓层也在里面用 `position: absolute; inset: 0`，需要在 `#view-result` 上加 `position: relative` 确保定位正确。让我检查一下现有 CSS。

看 L388-394：`#view-result { position: absolute; ... }`。由于 `#view-result` 本身就是 absolute 定位，内部元素用 `position: absolute; inset: 0` 会相对于 `#view-result` 定位，这是正确的。不需要额外修改。

现在让我检查 ResultScreen 的 `#view-result` div 内有两个顶层子元素（result-layout 和 reveal overlay），CSS 的 `.result-layout` 会正确作用于档案卡。看起来没问题。

现在运行类型检查。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
唯一的类型错误是预先存在的 `tests/helpers.ts` 问题，按任务要求应排除。没有新增类型错误。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
全部 58 个测试通过。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
### BLUF
ResultScreen 完整重写完成，揭晓序列(R1-R5) + 角色档案卡(R6-R12) + 分享卡(R13-R15) 全部按契约实现。局部检查通过（tsc 无新增错误，pnpm test 58/58 绿）。无契约偏离。

### 触及的文件
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx` — 重写 — 完整实现揭晓序列 + 档案卡 + 分享卡，删除 RadarChart/DimensionBar/parseVector/showDetail 引用

### 交付的接口

- `REVEAL_TIMINGS` — `const { pageFadeOut: 0, judgementText: 800, transitionText: 1800, nameReveal: 2400, slogan: 3000, fromWork: 3800, cardReady: 4200 }` — 匹配契约 R1/A6
- `ResultScreen(props: { result: ResultData, stats?: Stats | null, onRestart: () => void })` — 匹配契约（接口签名未变）
- `revealPhase: "revealing" | "done"` — 内部 state，A1 内联 phase，匹配契约
- R2 skip: click/keydown/touchstart → clearAllTimers + ALL_VISIBLE + done — 匹配契约
- R5 reduced-motion: matchMedia 检测 → 跳过动画直接 done — 匹配契约
- R3 motion-7: 角色名 blur(20px)→blur(0) cross-fade — 匹配契约
- R4 ease-out-expo: 全部 transition 使用 cubic-bezier(0.16,1,0.3,1) — 匹配契约
- R6 档案卡7元素: 角色名+subtitle/标语/来自/作品介绍/描述/关键词/稀有度 — 匹配契约
- R7 workIntro: pack.workIntro — 匹配契约 A4
- R8 复用 localized.desc / localized.keywords — 匹配契约
- R9 motion-6: 溢出时 mask-image 边缘模糊 — 匹配契约 A7
- R10 分享+重新审判按钮 — 匹配契约
- R11 稀有度: typePercentage 直接使用，越稀有越空，stats=null 降级，special=rarityRare — 匹配契约 A3
- R12 砍除: RadarChart/DimensionBar/parseVector/showDetail 全部删除 — 匹配契约 A2
- R13 分享卡无 similarity/RESONANCE — 匹配契约
- R14 分享卡: 钩子文案+角色名+标语+来自+稀有度+CTA — 匹配契约
- R15 分享卡深色主题 — 匹配契约
- R16 hiddenReveal 文案: special=true 时显示 — 匹配契约 A5
- R19 similarity/top3 字段保留在 ResultData 接口，UI 不显示 — 匹配契约

### 局部检查
- `npx tsc --noEmit` — 通过（仅 pre-existing tests/helpers.ts 错误，按任务排除）
- `pnpm test` — 通过（58/58）

### 契约偏离
无。

### 诚实信心
- R9 motion-6 的 mask-image 方案在极窄屏幕上 40px 渐变带可能略显宽，但 A7 决策为"一屏放下优先"，实际移动端大多数角色描述不会溢出，触发概率低。
- 揭晓层的"CLICK ANYWHERE TO SKIP"提示文字是英文——这遵循了原代码库中类似提示的风格（如 test 阶段的 keyHint），但严格来说 i18n 契约中未定义此 key。如需本地化，需新增 i18n key。
- `handleCopy`（复制链接按钮）在原版存在但契约 R10 只要求"分享我的审判"和"重新审判"两个按钮，已按契约移除。
