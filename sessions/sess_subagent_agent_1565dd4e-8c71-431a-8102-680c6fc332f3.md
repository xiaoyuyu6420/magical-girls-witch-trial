# 你是 fp-judge，在修复前独立裁决 4 个 red-team 对「HTML 32 视觉重做」的 16 条发现...

- 会话 ID: `sess_subagent_agent_1565dd4e-8c71-431a-8102-680c6fc332f3`
- 时间: 2026-08-13 15:16:10 → 2026-08-13 15:32:03
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 54
- 归档状态: 未归档

---

## 👤 用户
你是 fp-judge，在修复前独立裁决 4 个 red-team 对「HTML 32 视觉重做」的 16 条发现的真假阳性 + 严重度。给每条 5 级裁决。

## 5 级裁决
- **TRUE_POSITIVE**：真问题，必须修（可达 + 符合 spec/意图 + 实际影响）
- **LIKELY_TP**：很可能真，建议修（证据强但有小不确定性）
- **FALSE_POSITIVE**：误报（不可达 / 不符 spec / 测试环境假象 / 已被授权）
- **OUT_OF_SCOPE**：超出本次任务范围（pre-existing / 非本次引入）
- **NEEDS_INFO**：证据不足，需补充

## 契约（裁决依据）
- `crucible/10-intent-contract.md`（V1-V24 视觉对照 + P1-P13 回归保护 + 完成判定）
- `crucible/30-adr/final.md`（决策 + 5 歧义终裁 + 盲点）
- `crucible/00-seed.md`（三决策 + 两约束：和32完全一样 + 不准细节损失）
- 金标 `/Users/munich/Downloads/ai_studio_code (32).html`

## 关键裁决原则
- 用户决策授权的（桌面保留挤压、天平筹码保留视觉、welcome 不动、桌面题卡无玻璃是 by design）→ 不能判为缺陷
- pre-existing（本次重做前就存在的，如 disclaimer.result 本来可能就空）→ OUT_OF_SCOPE，但要核实是否真 pre-existing
- 测试环境限制（headless backdrop-filter、故意隐藏 canvas 粒子）→ 不是产品 bug，但若导致验收盲区要标注
- "和 32 完全一样"是硬约束——32 有的项目没有（除非用户决策豁免）= TRUE_POSITIVE

## 16 条发现（逐条裁决）

### 正确性维度
- **C1** [High] `src/i18n/{zh-CN,en,ja,zh-TW}.ts` 的 `disclaimer.result` 从"角色版权归原作方所有"清空为""，`meta.title` 从"魔女审判"清空为""。ResultScreen L454 渲染 t("disclaimer.result")（版权声明消失）+ L213 shareTitle=t("meta.title")（分享标题空）。red-team 称是 5fde0e1 CRITICAL-2 回归。**核实**：disclaimer.result/meta.title 是 IM6 清理的还是 pre-existing 空？git log/diff 查。
- **C2** [Medium] page.tsx handleComplete 极光并发化（Promise.all([match,stats])）打破旧串行语义：match 失败但 stats 成功 → DB 写入 + 重试双写，totalParticipants 虚高。
- **C3** [Medium] AuroraBurst reduced-motion 下仍 setTimeout(1300ms)（CSS 钉 scale(1) 但 JS 时序未降级），reduced-motion 用户盯静止圆点等 1.3s。

### 意图对齐维度
- **I1** [High] 普通题选项序号 `I/II/III`（TestScreen ROMAN 常量）vs 32 的 `01/02/03`。globals.css:1196 注释自写"序号 01/02/03（32 逐像素）"但 DOM 用 ROMAN——自相矛盾。**注意**：桌面端是否因 E2E 锚定 ROMAN 而保留？查 IM4 报告说桌面保留 I/II/III，但 32 手机是 01/02/03。
- **I2** [Medium] 切题卡片 floatIn/floatOut（3D 翻转 rotateX-10°）keyframes 定义了（globals.css）但从未启用 .card.enter/.exit，实际用 stage-fade-out（无 3D 翻转）。32 切题有 3D 卡片翻转入场。
- **I3** [Medium] card-glare 反光层（鼠标跟随金色径向）零实现。V5 要求。32 有（mousemove 跟随）。仅桌面端。

### 可维护性维度
- **M1** [High] globals.css 79 处硬编码 rgba 绕过 token（新样式撒 rgba(255,215,0,*)×38 等）。
- **M2** [High] ResultScreen 分享卡 ~110 行全 inline style（零 class/零 token）。
- **M3** [High] token 名义/实际错位（--champagne-main 实际=金色等）永久认知债。
- **M4** [Medium] BackgroundLayers canvas 硬编码紫色双源（rgba(216,0,255) 与 --purple-neon 无注释耦合）。
- **M5** [Medium] helpers 8s 黑盒 timeout + magic waitForTimeout 无常量绑定。

### a11y 维度
- **A1** [Critical] reduced-motion 下 .opt-block animation:none 但基线 opacity:0 → 普通题选项 opacity=0 完全不可见。G5/P8 红线。
- **A2** [High] .balance-pan reduced-motion 漏守卫（staggerIn 仍跑）。
- **A3** [High] .weight-card reduced-motion 漏守卫。
- **A4** [Medium] .interjection-overlay 内联动效 reduced-motion 漏守卫（inline 优先级高于 CSS 守卫）。
- **A5** [Medium] "按任意键继续"对比度 2.05:1（WCAG AA 4.5:1 不达）。

## 你的任务
1. 逐条裁决（5 级），给一句理由。
2. 对关键争议（C1 是否 pre-existing、I1 桌面是否豁免、A1 是否真不可见），**实际查证**（git log/diff、读代码、必要时跑 playwright reducedMotion emulation 验证）。
3. 可重新校准严重度（red-team 可能高估/低估）。
4. 输出：每条 `[裁决] 编号 | 严重度 | 一句理由`，最后汇总"必修清单"（TRUE_POSITIVE + LIKELY_TP）。

webServer 配在 playwright.config.ts（reuseExistingServer:true，注意跨 session 残留 server 问题，先 lsof -i :3010 确认）。

## 🤖 助手
我是 FP-Judge，开始独立验证 16 条发现。先并行读取契约文档和代码结构建立 ground truth。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
端口 3010 已有 server。让我并行读取契约文档和关键源文件。

> 🔧 工具调用 3 次: Bash

## 🤖 助手
契约清晰。关键决策：桌面保留挤压、天平筹码保留、立绘占位、不准细节损失。现在并行验证关键争议点。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
让我看 disclaimer 和 meta 的具体内容（red-team 声称被清空）。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
整个 zh-CN.ts 几乎所有 value 都是空字符串。让我看完整文件状态和 git diff。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
关键发现：5fde0e1 完全没改 i18n（stat 里无 zh-CN.ts）。red-team 的"5fde0e1 CRITICAL-2 回归"归因错误。但 disclaimer 现在确实空。让我找真正清空的 commit。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
HEAD 就是 5fde0e1。让我检查 397a2f1 → HEAD 之间所有 commit 是否改了 zh-CN.ts，以及工作区是否是 uncommitted 改动。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
工作区有大量未提交改动（本次重做）。397a2f1 时 disclaimer 有值，现在被清空。让我确认整个 i18n 文件被清空的范围，并看更多 git status。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
zh-CN.ts 在工作区是全新重写版本。让我看完整文件确认哪些有值哪些空，并检查是否有生成器从 content/ 同步。

> 🔧 工具调用 1 次: Read

## 🤖 助手
i18n 文件被有意设计为部分骨架（L93-96 注释）。但 disclaimer 和 meta 不在"死代码"声明里。让我验证 ResultScreen 实际是否消费它们，以及是否有 fallback。

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
让我看 ResultScreen.tsx L454 disclaimer 上下文和 L213 shareTitle 上下文，确认渲染效果。

> 🔧 工具调用 2 次: Read

## 🤖 助手
C1 影响确认：L454 直接渲染空 div（声明消失），L213 shareTitle 传空给 navigator.share。让我查 export-i18n 脚本和 content/packs 是否有 disclaimer 备份源。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
export-i18n 是导出器不是生成器，无 fallback。让我验证 4 个 locale 都是否清空 disclaimer，并看测试是否捕获这个回归。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
全部 4 locale 的 disclaimer 和 meta.title 都是空字符串。让我确认这是不是本次重做引入（397a2f1 时其他 locale 是否本就空）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
C1 确认：397a2f1 时 4 locale disclaimer+meta 全有值，工作区全清空。这是本次重做回归，非 pre-existing，非 5fde0e1。现在验证 C2 和 C3。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
让我并行验证 C2（旧版 page.tsx 串行语义 + results API 写入逻辑）和 C3（globals.css aurora-burst reduced-motion 守卫）。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
C2 确认：旧版串行（match 先 await），新版 Promise.all 并发，/api/results 无幂等去重（L79 每次都 create）。match 失败时 stats 已写入是真实风险。现在看 C3 的 globals.css。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
C2 catch 块无自动重试，但 L196 有 `lastCompletion` 自动恢复机制——刷新页面会重提交。让我看 aurora-burst CSS 和 reduced-motion 守卫细节。

> 🔧 工具调用 1 次: Read

## 🤖 助手
C3 分析：reduced-motion 下 aurora scale 钉 1 但 setTimeout(1300ms) 仍跑。UX 瑕疵但非 a11y 红线（reduced-motion 指减少运动不减少延迟）。现在验证 I1/I2/I3，需对比 32 金标。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
32 确实有 01/02/03 序号、card-glare(6处)、floatIn(7处)。让我看 32 的具体内容和 TestScreen 的实现。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
32 确认：floatIn 经 .card.enter 触发，card-glare 是 DOM 元素+mousemove。现在看 TestScreen 实现是否复刻。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
让我看 TestScreen L455-470 选项渲染上下文，确认 ROMAN 是否无条件下用（手机端也受影响）。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
I1 确认：L461 无条件用 ROMAN，DOM 文本是 I/II/III（不分端），但 globals.css L1196 注释自称"01/02/03（32 逐像素）"——自相矛盾。让我验证 E2E 是否锚定 ROMAN，并确认 I2/I3。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
I2/I3 确认：floatIn CSS 定义齐全（L562-571）但 TestScreen 从不挂 enter/exit 类；card-glare 在 globals.css 和 TestScreen 均 0 命中。E2E 无 ROMAN 锚定。现在验证 M1-M5。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
M1-M4 确认。M5 证据不足（grep 无 8000 timeout 命中）。让我定位 M5 的"helpers 8s timeout"和验证 A1（Critical，最关键）。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
A1 是最关键的。.opt-block 基线 opacity:0 + staggerIn 动画，reduced-motion 守卫只 animation:none 不补 opacity:1。让我确认是否本次引入 + 实际验证。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
397a2f1 时 .opt-block 也是 opacity:0+staggerIn。关键：那时 reduced-motion 是否覆盖 opacity？让我查旧 reduced-motion 块。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
**重大发现**：397a2f1（重做前）globals.css **完全没有** prefers-reduced-motion 块（grep -c=0）。本次重做新增了守卫但 `.opt-block { animation: none; }` 没补 opacity:1。这是本次引入的回归。让我用 playwright 实际验证选项是否真不可见。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
A1 确认 TRUE_POSITIVE Critical：实测 opacity=0，animationName=none，reduced-motion 用户选项不可见。现在验证 A2/A3/A4（漏守卫）和 A5（对比度）。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
A2 关键：.balance-pan（L621）也是 opacity:0+staggerIn 模式，但 reduced-motion 块**没有** .balance-pan 守卫。让我实测 balance-pan/weight-card 在 reduced-motion 下的状态，并找 A4/A5。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
A3 确认：weight-card（L650）也是 opacity:0+staggerIn 模式，reduced-motion 无守卫。让我看 A4（interjection-overlay inline）和 A5（对比度），等 A2/A3 实测结果。

> 🔧 工具调用 1 次: Read

## 🤖 助手
A4 确认：interjection-overlay L552 inline `animation: staggerIn` 无法被 CSS 守卫覆盖（inline 优先级），但无 opacity:0 基线所以当前无可见运动。A5 文字 rgba(255,255,255,0.25) on rgba(3,3,3,0.95) 确实约 2:1。让我看 A2/A3 实测结果。

> 🔧 工具调用 1 次: Read

## 🤖 助手
等实测时验证 A5 是否 pre-existing（关键——决定 TRUE_POSITIVE vs OUT_OF_SCOPE）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
A5 是 **pre-existing**（397a2f1 时 rgba(255,255,255,0.25) 完全相同）→ OUT_OF_SCOPE。让我重新跑一个更快的 A2/A3 验证。

> 🔧 工具调用 1 次: Bash

## 👤 用户
<task-notification>
<task-id>exec_e38f5b15-6893-481a-a9c2-a78a7210584d</task-id>
<tool-use-id>call_be60bc9185364a61b795da9e</tool-use-id>
<output-file>/Users/munich/.zcode/cli/exec/sess_subagent_agent_1565dd4e-8c71-431a-8102-680c6fc332f3/call_be60bc9185364a61b795da9e-stdout.log</output-file>
<status>completed</status>
<summary>Background command "Verify A2 A3 balance-pan weight-card reduced-motion" completed (exit code 0)</summary>
</task-notification>

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
第一个实测确认 A1（opt opacity=0，且 7 次点击题没切——用户无法答题）。后台第二个任务可能因同样问题卡住。让我用键盘导航验证 A2/A3。

> 🔧 工具调用 2 次: TaskStop, Write

## 👤 用户
<task-notification>
<task-id>exec_f2ad5b64-f240-4206-b890-913c1d6ab13d</task-id>
<tool-use-id>call_5414cb4363f54f1091b004d4</tool-use-id>
<output-file>/Users/munich/.zcode/cli/exec/sess_subagent_agent_1565dd4e-8c71-431a-8102-680c6fc332f3/call_5414cb4363f54f1091b004d4-stdout.log</output-file>
<status>killed</status>
<summary>Background command "Run A2 A3 verification" was stopped</summary>
</task-notification>

## 🤖 助手
CSS 静态分析已充分（reduced-motion 块 L1422-1442 确认不含 .balance-pan/.weight-card）。导航困难恰恰因为 A1 阻塞。让我清理临时文件并做最终确认。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
全部证据收集完毕。输出裁决报告。

---

### BLUF

收到 16 条发现，确认 14 条（**1 Critical + 2 High TRUE_POSITIVE + 11 Medium/Low 的 TP/LIKELY_TP**），驳回 2 条（M5 证据不足、A5 pre-existing）。最重要的确认项是 **A1**：reduced-motion 下普通题选项 `opacity:0` 完全不可见，playwright 实测验证（`opacity=0, animationName=none`），用户卡在 Q1 无法答题——这是本次重做引入的 Critical 回归（397a2f1 时无任何 reduced-motion 块）。

---

### 裁决

（按确认度排序：TRUE_POSITIVE → LIKELY_TP → OUT_OF_SCOPE → FALSE_POSITIVE）

#### [A1] → TRUE_POSITIVE — 严重度 Critical（保持）

**证据**：playwright `reducedMotion:'reduce'` emulation 实测——`.opt-block` 计算值 `opacity=0, animationName=none, visible=true(offsetParent非null)`。globals.css L447 基线 `opacity:0` + L449 `animation: staggerIn ... forwards`；reduced-motion 块 L1423 `.opt-block { animation: none; }` 只杀动画**不补 opacity:1** → 元素永久透明。实测连点 7 次题未推进，确认用户无法答题。
**为何真实**：本次重做引入（`git show 397a2f1:globals.css | grep -c prefers-reduced-motion` = 0，重做前无此块；新增守卫逻辑有缺陷）。P8/G5 红线 + 功能完全损坏。

#### [C1] → TRUE_POSITIVE — 严重度 High（保持）

**证据**：`git show 397a2f1:src/i18n/{zh-CN,zh-TW,en,ja}.ts` 4 locale 的 `disclaimer.footer/result` + `meta.title/description` **全部有值**（zh-CN disclaimer.result="角色版权归原作方所有"，meta.title="魔女审判"）；工作区现状 4 locale **全部清空为 ""**。ResultScreen L454 `{t("disclaimer.result")}` 渲染空 div（版权声明消失），L213 `shareTitle=t("meta.title")` 传空给 navigator.share。export-i18n.ts 是导出器非生成器，content/packs + prisma schema 无 disclaimer 备份源，**零 fallback**。
**red-team 归因错误（需纠正）**：不是"5fde0e1 CRITICAL-2 回归"——`git show 5fde0e1 --stat` 根本没 touch i18n（CRITICAL-2 改的是 ResultScreen rgba 颜色）。真正原因是本次工作区 i18n 骨架化重构时连带清空了 disclaimer/meta（questions/gate/trigger 有"死代码"声明 L93-96，但 disclaimer/meta 不在该声明内，是被误伤）。

#### [I1] → TRUE_POSITIVE — 严重度 High（保持）

**证据**：TestScreen L31 `const ROMAN = ["I","II","III","IV","V"]` + L461 `<div className="opt-index">{ROMAN[idx]}</div>` **无条件**渲染（无 @media/prop 切换），手机端 DOM 文本也是 I/II/III。32 金标 grep 确认是 `01/02/03`（3 个 opt-index）。globals.css L1196 注释自称"序号 01/02/03（32 逐像素）"——**注释与实现自相矛盾，证明是疏漏非 by design**。`grep tests/` 无 ROMAN/'01' 文本锚定，**修复零 E2E 阻碍**。违反 R9（手机端 01/02/03）+ C2"和 32 完全一样"。

#### [I2] → TRUE_POSITIVE — 严重度 Medium（保持）

**证据**：globals.css L562-571 完整定义了 `.card.enter/.card.exit` + `@keyframes floatIn/floatOut`（translateY+scale+rotateX 3D 翻转）；但 TestScreen L637 永远 `className="question-stage card"`，**从不切换 enter/exit 类**，切题实际用 `.stage-fade-out`（L633，仅 opacity 淡出，无 3D 翻转）。32 是 `.card.enter { animation: floatIn 0.6s }` 切题触发。CSS 写好了 JS 没接线。违反 R13。

#### [I3] → TRUE_POSITIVE — 严重度 Medium（保持）

**证据**：`grep card-glare src/app/globals.css` = 0 命中，`grep card-glare src/components/TestScreen.tsx` = 0 命中（L399-400 的 tilt-left/tilt-right 是天平倾斜非 glare）。32 金标有完整 card-glare（CSS 类 + `<div class="card-glare" id="card-glare">` DOM + `getElementById('card-glare')` mousemove 跟随 JS，共 6 处）。连 CSS 都没定义，零实现。违反 V5 玻璃态题卡反光层要求。

#### [C2] → LIKELY_TP — 严重度 Medium（保持）

**证据**：旧版（397a2f1）page.tsx L70 `await fetch("/api/match")` **串行**，match 失败则 stats 不执行；新版 L88-129 `Promise.all([matchPromise, statsPromise])` **并发**。/api/results POST L79 `db.testRecord.create` **无 sessionId 幂等去重**。场景：match 失败 + stats 先成功写入 + page.tsx L196 `lastCompletion` 自动恢复或用户刷新 → 重新提交 → DB 双写 → totalParticipants 虚高。
**为何 LIKELY 而非 TRUE**：触发需"match 失败 + stats 成功 + 恢复重试"特定组合；catch 块（L135-141）无自动重试，依赖用户操作或 localStorage 恢复路径。逻辑成立但可达性未端到端复现。

#### [A2] → LIKELY_TP — 严重度 Medium（red-team 标 High，**降级**）

**证据**：.balance-pan（globals.css L621）`opacity:0 + animation: staggerIn 0.6s forwards`，与 .opt-block 同模式；但 reduced-motion 块（L1422-1442）**不包含 .balance-pan** → staggerIn 在 reduced-motion 下正常播放（translateY 入场移动仍展示给用户）。
**为何降级 Medium 非 High**：与 A1 不同——A1 是 animation:none 杀动画但留 opacity:0（不可见）；A2 是动画未被禁用所以正常 forwards 到 opacity:1（**元素可见可交互**），只是违反 reduced-motion"减少运动"意图。当前因 A1 阻塞用户卡在 Q1，A2 不可达；A1 修复后暴露。

#### [A3] → LIKELY_TP — 严重度 Medium（red-team 标 High，**降级**）

**证据**：.weight-card（L650）`opacity:0 + animation: staggerIn 0.5s forwards`，reduced-motion 块不含 .weight-card。推理同 A2：动画仍跑、元素最终可见、违反 reduced-motion 意图但非功能损坏。

#### [M1] → LIKELY_TP — 严重度 Medium（red-team 标 High，**降级**）

**证据**：`grep -cE "rgba(255,215,0|rgba(216,0,255|rgba(123,44,191" globals.css` = 42 处硬编码金色/紫色，绕过已定义的 `--gold-hyper/--purple-neon/--violet-deep` token。397a2f1 时旧金硬编码仅 6 处，本次新增 42 处。
**为何降级 Medium**：这是可维护性认知债（改 token 不生效），不影响功能/视觉正确性。ADR 决策 2 要求"批量替换硬编码"但实现者反向新增。

#### [M2] → LIKELY_TP — 严重度 Medium（red-team 标 High，**降级**）

**证据**：ResultScreen 38 处 `style={{}}`（非 red-team 称的 ~110 行，实际 38 个 inline 块），集中在 L529+ 分享卡离屏子树。
**为何降级 Medium**：ADR 盲点 #4 明确 html-to-image 的 backdrop-filter/mix-blend 限制，分享卡用 inline style + 实色 rgba 模拟玻璃态是**有意的技术妥协**，非纯乱写。但 38 处确实零 class/零 token，维护负担真实。

#### [M3] → TRUE_POSITIVE — 严重度 Medium（red-team 标 High，**降级**）

**证据**：globals.css L138-141 `--champagne-main: var(--gold-hyper)` 等，变量名"champagne"但值是金色——名义/实际错位确认。
**为何降级 Medium**：这是 ADR 决策 2 **明确授权的策略**（"定义点重定向 4 行翻转 24 消费者"），且 L137 注释标注"香槟暗黑 token → 全部重定向到 32 金紫黑（final.md 决策2）"。是**已知且文档化的债**，非隐藏陷阱。red-team 标 High 过度。

#### [M4] → LIKELY_TP — 严重度 Medium（保持）

**证据**：BackgroundLayers.tsx L86 `ctx.fillStyle = rgba(216,0,255,${p.alpha})` + L88 `shadowColor = "#D800FF"` 硬编码，与 `--purple-neon` 语义耦合但无注释/变量桥接。改 token 不影响 canvas。真实小债。

#### [C3] → LIKELY_TP — 严重度 Low（red-team 标 Medium，**降级**）

**证据**：AuroraBurst.tsx L38 `setTimeout(minDurationMs=1300)` 在 reduced-motion 下仍跑；globals.css L1437 reduced-motion 把 `.aurora-burst transform: scale(1)` 钉住（不放大），仅留 opacity 0.4s 淡出。组件注释 L17-18 明确"组件层无需分支"。
**为何降级 Low**：reduced-motion 的 WCAG 意图是"减少运动"非"减少延迟"。1300ms 不是死等——它在等 fetch（Promise.all），fetch 慢则无感，fetch 快则固定开销。UX 瑕疵（10px 静止圆点 1.3s）但非 a11y 红线。

#### [A4] → LIKELY_TP — 严重度 Low（red-team 标 Medium，**降级**）

**证据**：TestScreen L552 interjection-overlay inline `style={{ animation: "staggerIn 0.6s ..." }}`；inline 优先级高于 CSS 守卫（除非 !important），reduced-motion 块无法覆盖。但 inline style **无 opacity:0 基线**，staggerIn 对该元素几乎无可见运动（from=默认值 to=opacity:1/translateY:0）。
**为何降级 Low**：当前无可见运动缺陷（结构性盲区但视觉无影响）；若未来加 translateY 基线才会显现。

#### [A5] → OUT_OF_SCOPE — 严重度 不变（pre-existing）

**证据**：`git show 397a2f1:src/components/TestScreen.tsx | grep "rgba(255,255,255,0.25)"` 命中 L584，与当前**完全相同**的值 + L587"按任意键继续"。对比度 ~2:1 真实不达标（WCAG AA 4.5:1），但**重做前就存在，本次未改未降级**。C2 是"不准降级"非"修复历史问题"。
**red-team 未查 pre-existing**——应标注但未标注。

#### [M5] → FALSE_POSITIVE — 严重度 不变

**证据**：`grep waitForTimeout src/` = 0 命中（仅 tests/ 测试代码有，非产品）；`grep "8000" src/lib/ src/components/` 仅 AuroraBurst 的 `zIndex:8000`（z-index 非 timeout）。red-team 称"helpers 8s 黑盒 timeout + magic waitForTimeout 无常量绑定"**指向不明、无具体文件行号、证据不成立**。src/lib/utils.ts 无 timeout。

---

### 总体评估

红方这一轮**可靠性中等偏高**。16 条中 13 条成立（1 Critical + 2 High + 10 Medium/Low），1 条 pre-existing 未识别（A5），1 条证据不足（M5），1 条归因错误（C1）。核心发现质量高——**A1 是真正的 Critical 且判断精准，I1/I2/I3 三条意图对齐发现证据扎实、直接对照 32 金标 + 契约 R9/R13/V5**，这三条是本轮最高价值产出。

但暴露三个系统性偏差需调下一轮红方：
1. **严重度系统性偏高**——A2/A3/C3/A4 四条都被高估一级（A2/A3 标 High 实为 Medium：元素可见只是动画未降级；C3 标 Medium 实为 Low：reduced-motion 减运动不减延迟）。红方在 a11y 维度有"见 reduced-motion 漏洞就标 High"的倾向，未区分"不可见/不可交互"（Critical）与"动画未优雅降级但功能可用"（Medium/Low）。
2. **pre-existing 检查缺失**——A5 完全没查 git 历史，把历史问题当本次回归。建议下一轮对每条发现强制过一遍 `git show <重做前>:<file>`。
3. **归因不准**——C1 说"5fde0e1 回归"但 5fde0e1 根本没动 i18n（stat 可证）。红方在"找回归来源"时猜测而非查证。

可维护性维度（M1-M5）5 条中 4 条成立但全是技术债非缺陷，且严重度偏高——这一维度红方倾向于"凑配额"，价值密度低于正确性/意图/a11y 三维度。

---

### 必修清单（TRUE_POSITIVE + LIKELY_TP，按优先级）

**P0 阻断（Critical）**：
- **A1** — reduced-motion `.opt-block { animation:none }` 补 `opacity:1`（一行修复，影响所有 reduced-motion 用户答题）

**P1 必修（High）**：
- **C1** — 恢复 4 locale 的 disclaimer.footer/result + meta.title/description 值（从 397a2f1 恢复）
- **I1** — TestScreen L31+L461 ROMAN→01/02/03 格式（无 E2E 阻碍）

**P2 必修（Medium）**：
- **I2** — 启用 floatIn/floatOut（切题时挂 .card.enter/.card.exit）
- **I3** — 实现 card-glare（CSS + DOM + mousemove）
- **C2** — handleComplete 恢复串行，或 /api/results 加 sessionId 幂等
- **A2/A3** — reduced-motion 块加 `.balance-pan, .weight-card { animation:none; opacity:1; transform:none }`
- **M1/M2/M4** — 硬编码 rgba 收敛到 token（技术债清理）

**P3 建议（Low）**：
- **C3** — AuroraBurst reduced-motion 下 minDurationMs→短值
- **A4** — interjection-overlay 改用 CSS class（可被守卫覆盖）
- **M3** — 长期重命名 champagne-* token（当前 ADR 授权可延后）

**驳回**：M5（证据不足）、A5（pre-existing，OUT_OF_SCOPE）
