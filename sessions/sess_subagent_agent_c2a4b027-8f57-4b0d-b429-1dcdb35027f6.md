# 你是 blue-team，对「HTML 32 视觉重做」审计的 WARNING 应用有界 rework（rewor...

- 会话 ID: `sess_subagent_agent_c2a4b027-8f57-4b0d-b429-1dcdb35027f6`
- 时间: 2026-08-13 19:06:51 → 2026-08-13 19:26:59
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 37
- 归档状态: 未归档

---

## 👤 用户
你是 blue-team，对「HTML 32 视觉重做」审计的 WARNING 应用有界 rework（rework_budget:1）。修两项：floatIn 接线（消除 V11 偏离）+ 视觉测试 Canvas 确定性。

## 拥有文件（可改）
- `src/app/globals.css`（floatIn/floatOut keyframes）
- `src/components/TestScreen.tsx`（cardAnimClass 接线）
- `tests/visual/test.visual.spec.ts`、`tests/visual/result.visual.spec.ts`（Canvas 确定性）

## 必读
- `crucible/60-audit.md`（审计 WARNING 详情）
- `crucible/50-redblue/summary.md`（I2 floatIn 回退的根因：简单 .card.enter 接线让 card opacity:0 期破坏 quiz 时序）

## rework 1：floatIn 接线（消除 V11，避开 quiz timeout）

**根因**（I2 回退原因）：之前 .card.enter = `floatIn 0.6s forwards`，floatIn keyframes from `opacity:0` → card 透明期 → 选项在透明 card 内 → quiz.spec timeout。

**rework 方案**（审计建议）：floatIn/floatOut keyframes **去掉 opacity**（只保留 transform 3D 翻转）。card 始终不透明（选项可见，quiz 不 timeout），但保留 32 的核心 3D 翻转进场动效（translateY+scale+rotateX）。

具体改 `globals.css` 的 floatIn/floatOut keyframes（约 L566-574）：
- floatIn: `from { transform: translateY(40px) scale(0.95) rotateX(-10deg); } to { transform: translateY(0) scale(1) rotateX(0); }`（删 opacity）
- floatOut: `from { transform: translateY(0) scale(1); } to { transform: translateY(-30px) scale(0.95); }`（删 opacity）

然后恢复 TestScreen 的 cardAnimClass 接线（之前 I2 回退为恒定 class）：
- L414 注释 → 恢复 `const cardAnimClass = stageFadeOut ? "exit" : "enter";`
- L667 `className="question-stage card"` → `className={`question-stage card ${cardAnimClass}`}`
- 注释更新：floatIn 已去 opacity（只 transform），不破坏 quiz 时序

**关键验证**（必跑）：`pnpm playwright test tests/quiz.spec.ts:197 tests/quiz.spec.ts:252 --project=chromium`（这两个之前 I2 timeout，rework 后必须绿）。**如果仍 timeout，说明 transform 也破坏 quiz（位置偏移 click 落空）——则回退 floatIn（恢复恒定 class + 注释标注 transform 方案也失败），接受 V11 延后，不要强行接线**。

如果 quiz 绿，跑全量 chromium 确认无回归。

## rework 2：视觉 Canvas 确定性（消除 test-question-mobile flaky）

**根因**：BackgroundLayers 的 Canvas 紫粒子 rAF 非确定性，每次截图粒子位置不同 → test-question-mobile 1% 漂移失败。

**方案**：test.visual.spec 和 result.visual.spec 截图前，停 Canvas rAF（让粒子静止）。
- test.visual.spec 的 beforeEach（L28-30 现在隐藏 #bg-canvas visibility）改为：`page.evaluate` 找到 BackgroundLayers 的 rAF id 并 cancelAnimationFrame，或更简单：截图前 `await page.evaluate(() => { const c = document.getElementById('bg-canvas'); if (c) c.style.display = 'none'; })`（直接隐藏 canvas，比 visibility 更彻底，粒子不渲染）。
- 当前 test.visual 已有 `#bg-canvas visibility:hidden`——改为 `display:none`（彻底移除布局 + 不渲染）。确认这消除漂移。
- result.visual 不涉及 canvas（结果页无粒子），但确认无需改。

**验证**：`pnpm playwright test tests/visual/test.visual.spec.ts --project=visual --project=visual-mobile --update-snapshots`（重生成基线，因为 display:none vs visibility:hidden 改变了截图）+ 再跑一次不带 --update 确认稳定（两次截图一致 = 确定性）。

## 约束
- floatIn rework：quiz 必须绿（timeout 则回退，不强求）
- 不破坏 108 E2E + 36 vitest
- reduced-motion 守卫：.card.enter/.exit 的 `animation:none; opacity:1; transform:none` 守卫（globals.css reduced-motion 块）保留有效

## 输出
1. BLUF 2. 触及文件 3. floatIn rework 结果（quiz 绿/timeout 回退）+ 根因 4. 视觉 Canvas 确定性结果（两次截图稳定） 5. 最终验证（E2E/视觉全绿数） 6. 不确定

## 🤖 助手
我先读取必要的上下文文件，理解审计详情和 I2 回退的根因。

> 🔧 工具调用 2 次: Read

## 🤖 助手
现在读取拥有文件，理解当前状态。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在读取 globals.css 的相关部分（floatIn/floatOut keyframes 和 reduced-motion 块）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
让我看 quiz.spec.ts 的相关行，理解验证目标。

> 🔧 工具调用 1 次: Read

## 🤖 助手
理解清楚了。根因已明确，开始实施。先建 todo 跟踪。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
**重述根因（第一步）：**

- **floatIn（V11 偏离）：** I2 接线让 `.card.enter = floatIn 0.6s forwards`，而 floatIn keyframes 从 `opacity:0` → 透明期 → 选项在透明 card 内 → quiz 切题时序被破坏（quiz.spec:197/252 timeout）。rework：keyframes 去掉 opacity（只保留 transform 3D 翻转），card 始终不透明，选项永远可见，quiz 时序不被破坏，同时保留 32 的 3D 翻转进场动效。
- **视觉 Canvas：** BackgroundLayers 的 Canvas 紫粒子是 rAF 非确定性（每帧随机像素），`visibility:hidden` 仍保留布局且 rAF 继续渲染（离屏绘制），导致 ~1% 像素漂移。`display:none` 彻底移除布局+不渲染，消除漂移。

现在实施 rework 1a（globals.css keyframes）。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
rework 1a 完成。现在 rework 1b（TestScreen.tsx 恢复接线）。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
现在把 cardAnimClass 接入 className。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
rework 1b 完成。现在 rework 2（test.visual.spec.ts Canvas 确定性）。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
三处改动完成。现在做影响范围检查（第三步），然后跑关键验证。

先确认没有其他地方消费 floatIn/floatOut keyframes，以及 result.visual 确实不涉及 canvas。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
影响范围确认：floatIn/floatOut 仅被 `.card.enter/.exit` 消费，仅 TestScreen 接线；reduced-motion 守卫（L1470）仍有效；result.visual 无 canvas 引用，无需改。

现在跑验证。先 tsc + 关键 quiz 测试。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
先跑 tsc 确认无类型错误（快），然后跑关键 quiz 测试。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
tsc 零错。现在跑关键验证——quiz.spec:197 和 :252（之前 I2 timeout 的两个）。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
quiz:197 通过，quiz:252 timeout。失败模式不是 opacity 透明期，而是 **Playwright 把 floatIn transform 动效期的元素判定为 "not stable"**（连续 198 次重试），期间 interjection overlay 抢占了 click：

```
198 × retrying click action - element is not stable
→ <div class="interjection-overlay"> intercepts pointer events
```

这印证了指令里的预警：**transform 也破坏 quiz**（不是 click 落空，而是 Playwright 等动效稳定期间被 interjection 抢占）。按指令：**回退 floatIn，接受 V11 延后，不强行接线**。

先回退 globals.css keyframes 到原始状态，再回退 TestScreen 接线（注释记录两种方案都失败）。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
现在回退 TestScreen.tsx 接线（恒定 class + 记录两种失败）。

> 🔧 工具调用 1 次: Edit

## 🤖 助手
回退完成。现在重新跑 quiz:197/252 确认回退恢复了绿色（证明失败确实由接线引起）。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
两个 quiz 测试都绿了（2 passed）。回退确认成功——floatIn 接线确实是 quiz:252 timeout 的根因。

现在做 rework 2 的验证（视觉 Canvas 确定性）。先重生成基线（display:none 改变了截图），再跑一次确认稳定。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
基线已重生成。现在跑一次不带 --update，确认两次截图一致（确定性验证）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
视觉确定性确认——两次连续截图一致（2 passed，无 --update）。display:none 消除了 Canvas 漂移。

现在跑完整视觉套件（含 result.visual）确认无回归，同时跑 vitest。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
视觉全套 9 passed/3 skipped（skip 是 mobile 结果页 R5 设计）。vitest 36/36。现在跑全量 chromium E2E（108）确认无回归。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
全量 chromium E2E 108 passed（1 skipped 是既有 skip）。vitest 36/36。视觉 9 passed/3 skipped。无回归。

让我确认最终 diff 状态和基线文件变更。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
全量验证完成。让我确认视觉基线 PNG 已更新到位。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
基线确认：mobile 基线已重写（356KB，新 mtime，原 flaky 项），desktop 基线未变（display:none 与 visibility:hidden 在 desktop 产生相同像素——desktop 本就稳定，只有 mobile 漂移）。两次连续运行匹配，确定性确认。

全部验证完成，更新 todo 并输出报告。

> 🔧 工具调用 1 次: TodoWrite

## 🤖 助手
### BLUF
floatIn rework 失败已回退（transform-only 方案也让 quiz:252 timeout——Playwright 把动效期元素判为 "not stable"，interjection 抢占 click），V11 维持延后并补充了失败根因文档。视觉 Canvas 确定性已修复（display:none）并自检通过：两次连续截图一致。全量验证 tsc/vitest(36)/E2E(108)/视觉(9) 全绿，无回归。

### 发现处置

**[floatIn rework / V11] → 延后（rework 失败，已回退）**
- **根因（第一步）：** round-1 的 opacity 方案让 card 透明期破坏 quiz（选项不可见）。本轮 rework 改为 transform-only（去 opacity），card 始终不透明——但 transform 动效让 Playwright 把切题后正在 floatIn 的元素判定为 "not stable"（bounding box 连续变化），click 持续重试 ~99s，期间 interjection overlay 抢占了 click → quiz:252 timeout。**两种简单 class 切换方案都破坏 quiz 时序。**
- **改动：**
  - `src/app/globals.css:562-574` — keyframes 回退到原始 opacity 版本（未接线=死代码），注释标注两种方案都失败 + keyframes 保留备用。
  - `src/components/TestScreen.tsx:408-417` — 回退为恒定 class `className="question-stage card"`，注释记录两种失败模式（opacity 不可见 / transform Playwright 不稳定）。
- **影响范围已检查（第三步）：** reduced-motion 守卫（globals.css:1470 `.card.enter, .card.exit { animation:none; opacity:1; transform:none }`）对未接线 class 仍有效且无害；stageFadeOut 状态机本身未动（仍驱动 #test-stage-wrapper 的 stage-fade-out）；floatIn/floatOut 无其他消费方（grep 确认仅 .card.enter/.exit）。回退后代码与 prior-green 状态功能等价。
- **自检（第四步）：** 重新跑 `quiz.spec:197/252 --project=chromium` → 2 passed（41.1s + 27.8s）。证明 timeout 确由接线引起、回退恢复绿色。

**[视觉 Canvas 确定性 / test-question-mobile flaky] → 已修复（已自检）**
- **根因（第一步）：** BackgroundLayers 的 Canvas 紫粒子是 rAF 非确定性（每帧随机像素源）。原 `visibility:hidden` 仍占布局且 rAF 继续离屏渲染，导致 mobile 截图 ~1% 像素漂移。`display:none` 彻底移出布局+不渲染，消除漂移。
- **改动：** `tests/visual/test.visual.spec.ts:28-30` — `style.visibility = "hidden"` → `style.display = "none"`（注释更新根因）。result.visual.spec.ts 无 bg-canvas 引用，确认无需改。
- **影响范围已检查（第三步）：** #bg-canvas 是 fixed 全屏（out-of-flow），display:none 不影响其他元素布局——desktop 基线字节未变（display:none 与 visibility:hidden 在 desktop 产生相同像素，因 canvas 本就不视觉贡献），证实无布局副作用。result.visual 未触及、仍通过。
- **自检（第四步）：** `--update-snapshots` 重生成基线（mobile PNG 重写 356KB）→ 不带 `--update` 再跑一次 → 2 passed。两次连续截图一致 = 确定性确认。mobile 原本就是唯一 flaky 项（desktop 本就稳定，基线未变）。

### 引入的新问题
影响范围检查中未发现新问题。floatIn 回退为功能等价状态（与 prior-green 一致）；视觉改动仅影响截图基线（已重生成 + 验证稳定）。

### 最终验证
- tsc：0 错
- vitest：36/36 passed
- chromium E2E：108 passed / 1 skipped（既有 skip）
- 视觉：9 passed / 3 skipped（mobile 结果页 R5 设计性 skip）
- quiz:197/252：2 passed（回退后）

### 诚实信心
**Canvas 确定性修复我有把握（根因明确、确定性已两次验证）。floatIn 的处置我诚实标记为"延后/rework 失败"而非"已修复"**——transform 方案失败的根因（Playwright "not stable" + interjection 抢占）已实证（接线即 timeout、回退即绿），但有一个机制层面的诚实缺口需编排者知晓：quiz:252 的 "not stable" 持续了 ~99s（远超 0.6s 动效时长），而 opt-block 是动画 card 的**兄弟节点**而非子节点，所以"card transform 直接导致 opt-block bounding box 变化"的精确因果链我没有 100% 钉死——可能与 #test-stage-wrapper 的 stage-fade-out transition 交互、或 Playwright 稳定性启发式有关。因果**关联**已确认（接线↔timeout），但因果**机制**未完全诊断。这意味着未来若重试 V11，不能假设"只要避开 transform 就行"——可能需要彻底重新设计接线（如动效完成后再 enable 点击，或 JS 驱动一次性 transform 后归零），并应先诊断那 99s 的 "not stable" 来源。

触及文件（绝对路径）：
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`
- 视觉基线（已更新）：`/Users/munich/Desktop/独立项目/magical-girls/tests/visual/__screenshots__/test-question-mobile-visual-mobile-darwin.png`
