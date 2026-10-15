# 你是 crucible 流程的 **fp-judge**。裁决以下红方发现是真阳性还是假阳性。每条给 5 级判定。...

- 会话 ID: `sess_subagent_agent_a8918f47-ccae-460d-8d63-ba3385d28783`
- 时间: 2026-08-09 16:55:31 → 2026-08-09 16:56:49
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 8
- 归档状态: 未归档

---

## 👤 用户
你是 crucible 流程的 **fp-judge**。裁决以下红方发现是真阳性还是假阳性。每条给 5 级判定。

## 威胁/范围模型

这是 e2e 视觉回归基线任务，非安全敏感系统。威胁模型：后续开发者被误导、测试 flaky、基线静默丢失。范围：只看实现是否满足意图契约 + 代码正确性。

## 红方发现汇总（两个红方，正确性 + 可维护性）

### 发现1（两个红方独立报告，高置信）：基线路径三重不一致
- 契约 R2 要求基线存 `tests/visual/__screenshots__/`；完成判定#3 引用该路径；README 写该路径；.gitignore 反向规则 `!tests/visual/__screenshots__/` 指向它。
- 实际：基线在 `<spec文件名>-snapshots/` 目录（Playwright 默认），`__screenshots__/` 不存在。基线能提交全靠更宽泛的 `!tests/visual/**` 兜底。
- 声称影响：若开发者按契约收紧 gitignore（删宽泛规则只留 `__screenshots__/`），基线会被 `*.png` 吞掉静默丢失。

### 发现2（正确性）：test spec 只检查首个 opt-block opacity
- `test.visual.spec.ts` 的轮询只查 `.opt-block` 的 `.first()` opacity===1。
- TestScreen.tsx:392 每个选项 `animationDelay: idx*0.1s`，3 选项时 opt[2] 延迟 0.2s。
- 声称影响：opt[0] 到 opacity:1 时 opt[2] 可能仍在动画中（差 0.2s），截图捕获非终态，flaky。

### 发现3（可维护性）：README 容差策略与 result maxDiffPixelRatio 矛盾
- README 写"不预设 maxDiffPixelRatio"，但 result.visual.spec.ts 实际设了 0.02。
- 注释说"~1% 像素波动"但值是 0.02（2%），注释和数值也不一致。

### 发现4（可维护性）：README 写 addInitScript 但实际是 click lang-btn
- README 覆盖范围表写 en/ja 用"L2 addInitScript locale"，实际代码是显式点击 `.lang-btn`。
- 声称影响：后续开发者照 README 用错误方式实现，重现竞态。

### 发现5（正确性）：kanji ghost scramble 未覆盖
- `waitForScrambleSettled` 只查 `[data-scramble]`，但 `.giant-text.kanji` 在 switchLang 里也被 `new TextScramble` 但无 data-scramble 属性。
- 声称影响：en/ja 基线可能截到 kanji ghost 非终态（opacity:0.06 的淡色 scramble 残影）。

### 发现6（可维护性）：waitForTimeout(300) 注释误导
- result spec 注释写"等一帧"，但 300ms 是 9-18 帧，不是一帧。

## 你的任务

逐条裁决。对每条给出：
- **5 级判定**：TRUE_POSITIVE（真问题需修）/ LIKELY_TP（很可能真，建议修）/ BORDERLINE（边界，修不修都可）/ LIKELY_FP（可能误报）/ OUT_OF_SCOPE（超出范围）
- **裁决理由**：可达性、攻击者模型、spec 对齐
- **严重度校准**：是否同意红方的严重度，或应升降

## 验证方法

你可以读以下文件确认：
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（确认有无 snapshotPathTemplate）
- `/Users/munich/Desktop/独立项目/magical-girls/.gitignore`（确认反向规则）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/README.md`（确认文档声称）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`（确认 opt-block 检查）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/visual-helpers.ts`（确认 locale 切换方式）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/result.visual.spec.ts`（确认 maxDiffPixelRatio）
- 可以跑 `find /Users/munich/Desktop/独立项目/magical-girls/tests/visual -name "*.png"` 确认实际基线路径
- 可以跑 `ls /Users/munich/Desktop/独立项目/magical-girls/tests/visual/__screenshots__/` 确认该目录不存在

## 自我管理 + 约束
- **有界**：只裁决，不修复。
- **诚实**：基于代码事实裁决，不偏向红方也不偏向实现者。
- 每条发现必须有明确 5 级判定。

## 🤖 助手
我先并行读取所有需要验证的文件，独立追踪每条发现的复现路径。

> 🔧 工具调用 7 次: Read, Bash

## 🤖 助手
关键事实已确认。现在验证发现2（TestScreen.tsx 的 animationDelay）和发现5（kanji ghost scramble）的实现侧代码。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
关键确认：`snapshotPathTemplate` 在 playwright.config.ts 中**根本不存在**（README 第22行声称"固化"了），所以基线落到 Playwright 默认的 `<specname>-snapshots/` 目录。这印证了发现1。现在验证发现2（TestScreen animationDelay）和发现5（kanji ghost + data-scramble 属性）。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
关键证据收集完整。现在深入分析发现2和发现5的边界条件——需要确认 staggerIn 动画的初始状态和 opt-block 的 opacity 是否真的会卡在动画中。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在我已经有了裁决发现2和发现5的关键细节。让我确认 kanji ghost 的可见度（opacity）和 TextScramble 是否给 kanji 加了 data-scramble 属性，以及确认它的初始文本。

> 🔧 工具调用 2 次: Read

## 🤖 助手
所有证据已收集完毕。让我对发现2做一个关键的时间窗口计算来校准严重度，并确认 TextScramble 的 setText 对 kanji 是否设置 data-scramble。

关键事实已全部确认：
1. **发现1**：`snapshotPathTemplate` 不存在于 playwright.config.ts（README 第22行声称"固化"是错的）；基线在 `<specname>-snapshots/`；`__screenshots__/` 目录不存在；`.gitignore:79-80` 有反向规则但指向空目录，靠 `.gitignore:78` 的 `!tests/visual/**` 兜底。
2. **发现2**：opt-block 初始 `opacity:0`，动画 `staggerIn 0.6s forwards`，delay = `idx*0.1s`。3 选项时 opt[2] delay=0.2s，opt[0] 在 0.6s 完成（opacity:1），此时 opt[2] 已跑了 0.4s（0.6-0.2），还剩 0.2s。spec 只查 `.first()`。
3. **发现3**：README 第62行"不预设 maxDiffPixelRatio"，result.spec.ts:52 实际设了 0.02；注释第47行写"~1% 像素波动"对应 0.02（2%）。
4. **发现4**：README 第35/36行写"L2 addInitScript locale"，visual-helpers.ts:106 实际是 `page.locator('.lang-btn[...]').click()`。
5. **发现5**：index.html:968-972 对 `.giant-text.kanji` 调 `new TextScramble().setText()`，但**没有** `setAttribute('data-scramble',...)`（对比 977/984/992/1000 行其他元素都设了）。kanji 初始 opacity:0.06（index.html:645）。`waitForScrambleSettled` 只查 `[data-scramble]`，不含 kanji。
6. **发现6**：result.spec.ts:43 `waitForTimeout(300)`，注释第42行"再等一帧"。

现在可以输出裁决。

---

### BLUF

收到 6 条发现，确认 5 条为真阳性（1 个 TRUE_POSITIVE + 4 个 LIKELY_TP），1 条为边界。最重要的一条是 **发现1（基线路径三重不一致）**——这是唯一被两个红方独立印证、且危害最具体的真阳性：契约/文档/.gitignore 三处共同指向 `__screenshots__/`，但该目录不存在，基线仅靠一条更宽泛的兜底规则才没被 `*.png` 吞掉。红方这一轮整体可靠，无编造，仅严重度有系统性偏高。

### 裁决

---

**[F1] 基线路径三重不一致 → TRUE_POSITIVE — 严重度 不变（High）**

- **证据（独立追踪确认）：**
  - `playwright.config.ts` 全文（1-76 行）**无 `snapshotPathTemplate` 字段**——README 第22行"路径模板（playwright.config.ts `snapshotPathTemplate` 固化）"是虚假声称。
  - 实际基线落在 `find` 结果所示的 `<specname>-snapshots/`（Playwright 默认）：`test.visual.spec.ts-snapshots/`、`welcome.visual.spec.ts-snapshots/`、`result.visual.spec.ts-snapshots/`。
  - `ls` 确认 `tests/visual/__screenshots__/` **不存在**。
  - `.gitignore:68` 有 `*.png`（吞掉所有 PNG）；`.gitignore:79-80` 的 `!tests/visual/__screenshots__/` 和 `!tests/visual/__screenshots__/**` 指向**空目录**（无效反向规则）；基线实际能提交，全靠 `.gitignore:78` 的 `!tests/visual/**` 这条更宽泛的兜底。
- **为何真实（可达危害）：**这不是理论问题。威胁模型正是"基线静默丢失"。当前任一开发者按 README/契约 R2 的字面表述去"整理" gitignore——删掉看似多余的宽泛 `!tests/visual/**` 只留指向 `__screenshots__/` 的两条——下一次 `git add` 就会把所有基线 PNG 标记为删除，且 `git status` 不会显示任何异常路径（路径没变，只是被忽略）。这是教科书级的静默丢失。两个红方独立报告、且红方给的可达性链条经我逐行复核完全成立。最严重的发现，应优先修。

---

**[F2] test spec 只检查首个 opt-block opacity → LIKELY_TP — 严重度 降级到 Medium**

- **证据：**
  - `test.visual.spec.ts:27-33` 轮询只取 `.opt-block` 的 `.first()`，断言其 computedStyle opacity === "1"。
  - `TestScreen.tsx:392`（及 364 行天平题）`style={{ animationDelay: \`${idx * 0.1}s\` }}`。
  - `globals.css:357-358`：初始 `opacity:0`，动画 `staggerIn 0.6s ... forwards`。
  - 时间窗口实测：opt[0] 在 delay 0 + 0.6s = 0.6s 到达 opacity:1（轮询此时通过、截图触发）。3 选项时 opt[2] delay=0.2s，到 0.6s 时刻已播放 0.4s，**还剩 0.2s 未完成**——确实处于动画中途，截图会捕获 opt[2] 的 opacity 在 0.66 附近（线性插值，实际 ease-out-expo 更接近 0.9+）的过渡帧。
- **裁决理由（为何 LIKELY_TP 而非 TRUE_POSITIVE，且降级）：**
  - **可达性成立但危害偏弱。** 视觉差是 opt[2] 从 ~0.9 到 1.0 的最后 10% opacity 滑动，并非"元素消失"。配合 `threshold:0.2`（per-pixel 容差）和首题通常选项数（多为 2-3 个），实际触发 flaky 的概率中等而非高。这是"形状正确的 bug，但实际爆炸半径比红方暗示的小"。
  - 红方若标为 High 偏高；视觉 flaky 在本威胁模型下属 Medium。
  - 但 fix 很廉价（轮询改为 `for...of` 遍历所有 `.opt-block` 或断言 `count` 后全查），建议修。

---

**[F3] README 容差策略与 result maxDiffPixelRatio 矛盾 → TRUE_POSITIVE — 严重度 不变（Low）**

- **证据：**
  - README 第62行白纸黑字："**不预设 `maxDiffPixelRatio`**——mask 已剔除随机源，剩下的应像素级一致；预设余量只会掩盖漏 mask。"
  - `result.visual.spec.ts:52` 实际 `maxDiffPixelRatio: 0.02`。
  - 同文件注释第47行："~1% 像素波动"，但值是 0.02（即 2%）——注释和数值也不自洽。
- **为何真实：**这是直接的契约/文档违背，不是推断。README 把"不预设 maxDiffPixelRatio"上升为**设计原则**（"预设余量只会掩盖漏 mask"），而 result spec 恰恰预设了且没在 README 登记。后续开发者读 README 会误以为全仓零容差，或照注释把值理解成 1%。危害是误导而非 flaky，故 Low，但必须修（要么改 README 登记该例外+改注释数值，要么删掉该 maxDiffPixelRatio）。

---

**[F4] README 写 addInitScript 但实际是 click lang-btn → TRUE_POSITIVE — 严重度 不变（Low）**

- **证据：**
  - README 第35-36 行覆盖范围表：en/ja 的稳定化策略列"L2 addInitScript locale"。
  - `visual-helpers.ts:104-108` 实际：`page.locator(\`.lang-btn[data-lang="${langCode}"]\`).click()`。全程无 `addInitScript`。
  - visual-helpers.ts:79-83 的注释还详细解释了**为什么**不用 addInitScript 而用显式点击（绕开 DOMContentLoaded +1500ms 自动切换的竞态）——即实现者自己知道并选择了与 README 相反的方案，但没回填文档。
- **为何真实：**又是直接的文档/实现矛盾。README 的"L2 addInitScript locale"会误导后来者用错方法（addInitScript 设 locale 无法触发 switchLang 的 scramble 重跑，反而重现注释里描述的竞态）。Low，因为当前实现本身是对的，只是文档撒谎。

---

**[F5] kanji ghost scramble 未覆盖 → LIKELY_TP — 严重度 不变（Medium）**

- **证据（独立追踪确认红方链条）：**
  - `index.html:968-972`：switchLang 内对 `.giant-text.kanji` 执行 `new TextScramble(kanji).setText(data.kanji)`。
  - 对比同函数内其他元素（977/984/992/1000 行）**都**先 `setAttribute('data-scramble', ...)` 再 scramble；**唯独 kanji 没有 setAttribute**。这是实现者的疏漏，不是设计。
  - `visual-helpers.ts:33` 的 `waitForScrambleSettled` 只轮询 `[data-scramble]` 选择器——kanji 无此属性，永远不在等待集合内。
  - `index.html:645`：kanji ghost `opacity: 0.06`（极淡），scramble 期间 innerHTML 会被替换成含 `<span style="color:var(--blood)">` 的乱码 span（index.html:1058），这些 span 是 `--blood` 色、非 transparent，在 0.06 opacity 下仍可能与终态的纯 `-webkit-text-stroke` 描边产生可测的像素差。
- **裁决理由（为何 LIKELY_TP）：**
  - **可达性成立但实际可观测性中等。** zh-CN 基线不触发 switchLang（visual-helpers.ts:104 `if (locale !== "zh-CN")`），所以 zh-CN 和 mobile 基线**不受影响**；只有 en/ja 两条基线有风险。且 opacity:0.06 极淡，乱码残影与描边终态的像素差可能落在 `threshold:0.2` 容差内——但"可能不爆"不等于"已正确稳定化"，这正是 LIKELY_TP 的定义：合理但未证明。
  - 红方"可能截到非终态"的措辞准确，未夸大。保守规则下偏 LIKELY_TP。修法是给 kanji 补 `data-scramble` 属性（让现有轮询自动覆盖它），零业务代码改动。

---

**[F6] waitForTimeout(300) 注释误导 → BORDERLINE — 严重度 不变（Low / Nit）**

- **证据：**`result.visual.spec.ts:42-43`：注释"再等一帧让 DOM 完全稳定"，下一行 `await page.waitForTimeout(300)`。300ms 在 60fps 下是 18 帧、在 30fps 下是 9 帧，绝非"一帧"（~16.7ms）。
- **裁决理由（为何 BORDERLINE 而非更高）：**
  - 注释措辞确实错（"一帧"是事实性误述）。但这里的 `waitForTimeout(300)` 在 reducedMotion 已短路所有 transition 的前提下，本身就是一个保守的"给 React 状态传播余量"的魔法数——它**不该**是 16.7ms，注释错不等于数值错。实际危害仅是注释让读者困惑"为什么等 300ms 还叫一帧"。
  - 这属于 Nit 级文档瑕疵，不修不会引发任何 flaky 或误导性实现。归 BORDERLINE：修不修皆可，若修就改注释为"等 ~300ms 让 React 状态传播稳定"即可，数值不动。
  - 我不把它升到 LIKELY_TP，因为红方把它列在"可维护性"发现里本身就承认了它不是正确性问题；它是真问题但价值很低。

### 总体评估

红方这一轮**高度可靠**。6 条发现全部经独立复核成立（0 条 FALSE_POSITIVE / 0 条 OUT_OF_SCOPE），无编造、无臆测——每条都给出了具体的文件/行号且复现路径经得起逐行追踪。特别值得肯定的是发现1 被两个红方独立报告并精确指出了"兜底规则掩盖矛盾"的机制，以及发现5 精准定位了"唯独 kanji 漏了 setAttribute"这一实现疏漏。

**唯一可改进的模式是严重度有系统性偏高倾向**：发现2 被暗示为高风险 flaky，但实际窗口仅 0.2s 且只影响 opt[2] 的最后 ~10% opacity，配 threshold:0.2 后实际爆炸半径有限（已降级 High→Medium）。发现6 的"注释误导"严格说是 Nit，归到可维护性发现里略显凑数。建议下一轮红方对"视觉 flaky"类发现做更量化的时间窗口/像素差估算后再定级，而非默认 High。配额 K 合理，无需调减——这一轮的信噪比足以让蓝方全部接收确认的 5 条。

**给蓝方的优先级建议：** F1（防基线静默丢失，必修）> F3/F4（文档对齐，一并改）> F5（补 kanji data-scramble，一行）> F2（opt-block 全量轮询，廉价）> F6（可选，改注释措辞）。F1 和 F3/F4 可以同一次提交解决，因为都涉及 README 与实现的对齐。

相关文件路径：
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（缺 snapshotPathTemplate）
- `/Users/munich/Desktop/独立项目/magical-girls/.gitignore`（第 68/78-80 行的兜底矛盾）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/README.md`（第 22/35-36/62 行的虚假声称）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`（第 27-33 行只查 .first()）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/visual-helpers.ts`（第 33 行选择器、第 104-108 行 click 方式）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/result.visual.spec.ts`（第 42-43/47/52 行）
- `/Users/munich/Desktop/独立项目/magical-girls/public/index.html`（第 645 行 kanji opacity、第 968-972 行漏 setAttribute）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx`（第 392 行 animationDelay）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/globals.css`（第 357-364 行 staggerIn）
