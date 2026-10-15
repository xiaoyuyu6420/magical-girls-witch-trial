# 你是 red-team，从**正确性/行为不变**维度攻击「HTML 32 视觉重做」的实现。硬配额：至少报 **...

- 会话 ID: `sess_subagent_agent_6460f61d-2243-4c37-922d-c48ce4d0dcf7`
- 时间: 2026-08-13 15:05:12 → 2026-08-13 15:15:03
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 18
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**正确性/行为不变**维度攻击「HTML 32 视觉重做」的实现。硬配额：至少报 **K=3** 个真实问题，或说明为什么更少。

## 实现（攻击对象）
项目根 `/Users/munich/Desktop/独立项目/magical-girls`。本次是视觉重做（refactor 纪律：数据/评分/角色/答题流程行为不变）。
- `src/app/globals.css`（IM1 全改金紫黑 + @layer）
- `src/components/BackgroundLayers.tsx`（IM2 新建，canvas 粒子）
- `src/components/AuroraBurst.tsx` + `src/app/test/page.tsx`（IM3 极光交接替换 loading spinner）
- `src/components/TestScreen.tsx`（IM4 HUD+挂 BackgroundLayers，状态机宣称零触碰）
- `src/components/ResultScreen.tsx`（IM5 塔罗分栏重构 + Reveal 骨架精简）

## 契约（对照）
- `crucible/10-intent-contract.md` 的完成判定（P1-P13 回归保护：26题/5角色/posture评分/i18n/分享/批注/键盘/reduced-motion/E2E）
- `crucible/30-adr/final.md`（决策1 极光+Reveal骨架保留 + 决策3 class 纪律）

## 你的攻击面（正确性/行为不变）
重点查这些"视觉重做是否意外破坏了现有行为"：
1. **极光转场时序**（page.tsx handleComplete）：fetch 并发化 + Promise.all(auroraGate) 是否改变了提交语义？trackEvent 时机？submitError 回退？重试（lastCompletion）路径？慢网/快网边界？
2. **TestScreen 状态机**：IM4 宣称零触碰，实际 diff 是否动了 handleSelect/flushPending/cycleSlot/handleWeightConfirm/键盘映射/批注去重？watermark 改阿拉伯题号、HUD 双胶囊包 header 是否影响 E2E 锚定的 DOM？
3. **ResultScreen Reveal 骨架**：stagger 精简为单名字闪现后，revealPhase/skipReveal(click/Space/touch)/focus/aria-hidden/edge-blur/body.revealed 是否仍完整？skip 断言（reveal.spec）是否真的还过？
4. **posture 评分链路**：ResultScreen 用 result.posturePct，match API 是否真返回？AuroraBurst 极光期间 ResultScreen 未挂载，posture 数据流是否正确？
5. **BackgroundLayers**：canvas rAF 卸载清理？resize 监听泄漏？reducedMotion 真不启 rAF？SSR 守卫？
6. **i18n**：IM6 清理孤儿键 + 格式重排，是否破坏了 ResultScreen/TestScreen 的 t() 调用（键名/翻译丢失）？

## 方法
- 读代码定位嫌疑，跑 `pnpm playwright test <spec>:<line> --project=chromium` 或写 evaluate 复现验证
- 每条发现给：具体影响（什么行为被破坏）+ 复现路径（命令/步骤）+ spec 缺口分析
- 模糊警告不算发现——必须有具体影响 + 可复现路径

## 输出
3+ 条发现，每条：`[严重度] 标题 | 影响 | 复现路径 | spec缺口 | 建议修复`。诚实标注不确定性。

## 🤖 助手
我先并行读取 spec、契约和被攻击的实现文件，建立基线。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
已读完 spec 和 ADR。现在并行读核心实现文件。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在读 ResultScreen 和 TestScreen，并查 git diff 看改动范围。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
读 TestScreen 和 test spec 文件，并看关键 diff。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
看旧版 page.tsx 完整 handleComplete 和关键 spec 文件。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
看 match API 是否返回 posturePct、result.spec 断言、helpers.ts 的 answerAllQuestions。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
关键：确认 match API 是否返回 posturePct。读 match.ts 和 answer-processor。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
看 globals.css 的 aurora-burst 定义和 TestScreen 的 diff，确认 reduced-motion 和状态机改动。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
验证 `body.revealed` 门控是否存在，以及 i18n 改动是否破坏 t() 调用。

> 🔧 工具调用 3 次: Bash

## 🤖 助手
确认 meta.title 清空的影响和 disclaimer.result。

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
看 disclaimer 部分和确认 meta.title 清空的实际影响。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
确认 5fde0e1 修了什么（disclaimer 可见性），并看 ResultScreen diff 的 share/reveal 部分。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
看 /api/results 计数逻辑、globals.css 的 stat-fill 动画，并跑 vitest 验证数据层。

> 🔧 工具调用 3 次: Bash

## 🤖 助手
用正确命令跑 vitest，看 /api/results 完整逻辑。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
已收集足够验证。vitest 36 绿（P1-P3 数据层完好），确认了 3 个真实问题。现在写发现。

---

### BLUF
3 条已验证发现。最严重：i18n 清理把 `disclaimer.result` 和 `meta.title` 清空成 `""`，导致结果页版权声明完全消失（正是 5fde0e1 刚修复的 CRITICAL-2 回归）+ 分享标题为空。数据层（P1-P3）忠实保留（vitest 36 全绿），但极光转场的并发化改变了 stats 写入的失败语义，且 AuroraBurst 在 reduced-motion 下仍强制 1300ms 时序（P8 红线缺口）。

### 最严重问题
i18n `disclaimer.result` 清空 → 结果页版权声明"角色版权归原作方所有"消失（5fde0e1 CRITICAL-2 回归）。

### 发现

- **[F1] 严重度：High — `src/i18n/zh-CN.ts:140` + `src/i18n/zh-CN.ts:3`（ResultScreen 消费于 `:454` + `:213`）**
  - **影响：** `disclaimer.result` 从 `"角色版权归原作方所有"` 清空为 `""`，`meta.title` 从 `"魔女审判"` 清空为 `""`。ResultScreen L454 直接渲染 `t("disclaimer.result")` → 版权声明 div 内容为空（合规声明消失）；ResultScreen L213 `shareTitle = t("meta.title")` → `navigator.share({ title: "" })` 分享标题为空。前者是 5fde0e1（commit message 明确标注 "CRITICAL-2: 结果页声明不可见"）刚修复的回归——该提交把颜色从白字白底改成可见，但本次工作区改动把**文字内容本身**清空，声明再次不可见。
  - **复现：** 启动 dev server，答完 26 题到结果页，底部 `fontSize:0.6rem` 的版权声明区域为空白；触发分享按钮，分享面板标题字段为空。
  - **Spec 缺口？：** 是——违反 P4（i18n 框架）+ P5（分享功能）+ 跨IP合规声明要求；5fde0e1 CRITICAL-2 回归。
  - **修复方向：** 恢复 `disclaimer.result` 和 `meta.title` 的文案值（这两者非孤儿键，被 ResultScreen 活跃使用，不应在 IM6 孤儿键清理中被清空）。

- **[F2] 严重度：Medium — `src/app/test/page.tsx:88-129`（handleComplete 并发化）+ `src/app/api/results/route.ts:62-83`**
  - **影响：** 旧版 handleComplete 串行：`/api/match` 成功后才发 `/api/results`。新版用 `Promise.all([matchPromise, statsPromise])` 并发。由于 `/api/results` 内部**独立调用 `match()`**（route.ts L62-71，不依赖 `/api/match` 的结果），当 `/api/match` 因网络/超时失败但 `/api/results` 成功时：DB `testRecord` 写入一条记录，但用户看到"审判提交中断"重试页。点"重新提交"时 `sessionId` 重新生成（page.tsx L103 `anon-${Date.now()}-${random}`），`/api/results` 视为新会话写入**第二条**记录。后果：`totalParticipants`/`typeCount` 虚高，失败会话被计入统计。
  - **复现：** mock `/api/match` 返回 500、`/api/results` 正常。答完 26 题 → 极光 → submitError 页。查 DB 已有 1 条 testRecord。点"重新提交"成功 → 结果页。查 DB 现有 2 条（不同 sessionId）。
  - **Spec 缺口？：** 否——纯代码缺陷（并发化的隐式副作用，旧版串行保证"match 失败不写 stats"被打破）。
  - **修复方向：** 要么 stats fetch 依赖 match 结果（match 成功后再发 stats，恢复串行语义但牺牲并发）；要么 `/api/results` 的 `testRecord.create` 改为基于 content hash 的幂等 upsert（同 answers 去重）。

- **[F3] 严重度：Medium — `src/components/AuroraBurst.tsx:35-42`（对比 `ResultScreen.tsx:97-102`、`BackgroundLayers.tsx:49`）**
  - **影响：** AuroraBurst 的 `useEffect` 用 `setTimeout(minDurationMs=1300)` 作为时序信号，**不检测 `prefers-reduced-motion`**。reduced-motion 用户被强制等待完整 1300ms 极光时序才能切结果页。对比：reveal 骨架 reduced-motion 下直接 `setRevealPhase("done")` 跳过 950ms 动画（ResultScreen L98-101）；Canvas reduced-motion 下不启 rAF（BackgroundLayers L49）；posture 柱图 `transition:none`（globals.css:1441）。极光是唯一在 reduced-motion 下仍强制完整时序的动效。globals.css:1437 仅降级了 CSS 层的 `scale→scale(1)`，组件层时序（1300ms）未降级。ADR 风险2 明确把"reduced-motion 全链路遗漏"标为 C2/P8 红线。
  - **复现：** DevTools 开启 `prefers-reduced-motion: reduce`，答完最后一题，计时从 Q26 选中到结果页出现——至少 1300ms（极光 setTimeout），而非"跳过动画直达结果"。
  - **Spec 缺口？：** 是——R30"对所有新增动效提供降级或禁用路径"+ P8"所有动效（含新增极光）提供降级"+ ADR 盲点#7"aurora 跳过 scale 直接淡出"（时序部分未兑现）。
  - **修复方向：** AuroraBurst 接收 `reducedMotion` prop，reduced-motion 时 `minDurationMs` 缩短至极光 CSS 淡出时长（~400ms）或直接同步 `onComplete`。

### Spec 覆盖检查
- P1 26题数据：✓ 覆盖（vitest quiz-content.scores.test 7 绿）
- P2 5角色匹配：✓ 覆盖（vitest match.test 9 绿）
- P3 posture评分：✓ 覆盖（vitest answer-processor.test 6 绿）
- P4 i18n：✗ 缺口（disclaimer.result/meta.title 清空，F1）
- P5 分享卡：⚠ 部分（功能可用但 title 为空，F1）
- P6 批注插页：✓ 覆盖（TestScreen interjection 逻辑保留）
- P7 键盘交互：✓ 覆盖（keyMap/handleKey 保留）
- P8 reduced-motion：⚠ 部分（极光时序未降级，F3）
- P9-P10 iframe/字体：✓ 覆盖（BackgroundLayers 挂 iframe 内）
- P12 E2E：未跑全量（helpers.ts 已适配极光时序 L88-96）
- P13 单测：✓ 覆盖（36 绿）
- R22 posture柱图入场动画：⚠ 部分（数据/百分比正确，但 CSS `transition:width` 因内联 style 直接设终值不触发，无 0%→实际% 动画——低于 F1-F3，列为线索）

### 值得追的线索（不计入 K）
- **posture 柱图无入场宽度动画**：`stat-fill` CSS 有 `width:0%` + `transition:width 1.2s`，但 ResultScreen L372 内联 `style={{width:${posturePct[k]}%}}` 首次渲染即终值，transition 不触发。R22/V22 要求"0%→实际% 入场动画"。修复需先渲染 0% 再在 effect/mount 后设终值。属视觉 spec 缺口（非行为破坏），未计入。
- **reachResultPage 的 Space-skip 名义失效**：result.spec L21 在 answerAllQuestions 返回后立即按 Space，此时极光在播，但 answerAllQuestions 内部已等 result-layout visible（L91）才返回，此时 ResultScreen 已挂载、keydown listener 已注册，Space 实际能 skip。测试通过但路径脆弱——若极光时序或 answerAllQuestions 提前返回，Space 会打在 TestScreen/极光上被忽略。非确认 bug。

### 裁决
3 条真实发现已报告。正确性/行为不变维度的攻击面基本覆盖（数据层完好，主要破坏集中在 i18n 清理溢出 + 极光转场的并发副作用 + reduced-motion 时序）。F1 是最强项（确认的 CRITICAL 回归）。
