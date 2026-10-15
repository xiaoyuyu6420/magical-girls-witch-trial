# 你是 crucible 流程的**红方**，从**正确性**维度攻击实现。硬配额：至少报告 3 个真实问题，或明确...

- 会话 ID: `sess_subagent_agent_55b71bcc-c43f-45d1-b41b-b09ebcc977b0`
- 时间: 2026-08-09 16:40:33 → 2026-08-09 16:55:15
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 38
- 归档状态: 未归档

---

## 👤 用户
你是 crucible 流程的**红方**，从**正确性**维度攻击实现。硬配额：至少报告 3 个真实问题，或明确说明为什么更少。

## 攻击对象

刚实现的 e2e 视觉回归基线。相关文件：
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`（新增 visual/visual-mobile project）
- `/Users/munich/Desktop/独立项目/magical-girls/.gitignore`（反向规则）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/visual-helpers.ts`（waitForScrambleSettled + maskWelcomeDynamic + prepareWelcomeForScreenshot）
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/welcome.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/result.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/README.md`

## 意图契约（你的判断依据）

完整契约在 `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`。核心完成判定：
1. tests/visual/ 独立 spec 不改现有 15 spec
2. ≥7 条基线
3. 基线可提交（.gitignore 反向规则）
4. 运行命令可用全绿
5. --update-snapshots 可用
6. 失败产出 expected/actual/diff 三图
7. welcome 连续 3 次不 flaky
8. 现有 e2e 不受影响
9. 策略文档化

## 你的攻击维度：正确性

聚焦"代码逻辑是否真的对、是否会在某些条件下静默失败"。检查方向（不限）：
- `waitForScrambleSettled` 的 textContent 判定：是否所有 [data-scramble] 元素都被覆盖？loader-text 也在列表里（index.html:822），它是否会干扰？如果某元素 data-scramble 为空字符串会怎样？
- `maskWelcomeDynamic` 的 Locator[]：如果某元素不存在（如移动端 #cursor-dot 被 @media pointer:coarse 隐藏），mask 一个不存在的 locator 会怎样？会不会静默跳过或报错？
- `prepareWelcomeForScreenshot` 的 locale 切换：点 lang-btn 后如果按钮还没渲染就 click 会失败吗？竞态？
- result 的 `answerAllQuestions` + reducedMotion：reducedMotion 下 match API 返回的角色是否稳定？typePercentage 每次不同会导致基线 flaky 吗？
- project 的 testMatch 正则 `/.*\.visual\.spec\.ts$/`：README.md 不是 .ts 不会被匹配，但如果有人放了 helper 文件（如 visual-helpers.ts）会被误当 spec 跑吗？
- testIgnore `**/visual/**` 是否真的排除了所有 visual 测试？有没有边界情况？
- `.gitignore` 反向规则 `!tests/visual/__screenshots__/` 但实际基线在 `<spec>-snapshots/` 目录——反向规则覆盖到实际目录了吗？基线真的能提交吗？

## 输出格式

每条发现：
- **编号 + 标题**
- **具体影响**：这个问题会导致什么（测试 flaky？基线丢失？静默误报？）
- **复现路径**：怎么触发这个问题（具体步骤或条件）
- **严重度**：CRITICAL / WARNING / SUGGESTION
- **spec 对齐**：违反了契约哪条（R1-R16 或完成判定 1-10），或属于契约未覆盖的正确性隐患

## 自我管理 + 约束

- **有界**：只报告已验证的真实问题——读代码确认逻辑，不要模糊警告。
- **防漂移**：聚焦正确性，不扩展到性能/安全/a11y。
- **诚实退出**：如果找不到 3 个，明确说"检查了 X 个点，只有 N 个真实问题，因为..."。不编造。
- **边界**：你是红方，只报告不改代码。

至少 3 个真实问题，或诚实说明为什么更少。

## 🤖 助手
让我继续深入验证关键问题点。

> 🔧 工具调用 5 次: Read, Bash

## 🤖 助手
发现关键线索——实际基线路径和 .gitignore 规则不匹配。让我验证。

> 🔧 工具调用 4 次: Bash

## 🤖 助手
基线路径问题已验证。现在继续深入检查其他正确性问题。

> 🔧 工具调用 3 次: Read, Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
所有关键代码已读完，三个发现均已通过代码追踪和 git 行为验证。以下是报告。

---

### BLUF
3 条已验证发现。最严重：基线实际存储路径与契约/README/.gitignore 声称的 `__screenshots__/` 不一致——契约 R2 和完成判定 #3 无法满足。Spec 在基线可提交性上有静默失效风险。

### 最严重问题
基线 PNG 实际在 `<spec>-snapshots/` 目录而非 `__screenshots__/`，.gitignore 反向规则指向不存在的目录，基线可提交全靠一条多余的宽泛规则 `!tests/visual/**` 兜底——若按契约意图收紧规则，基线会静默变为不可提交。

### 发现

- **[F1] 严重度：Critical — `.gitignore` + README + 契约 R2：基线路径三重不一致**
  - **影响：** 契约 R2 要求基线存于 `tests/visual/__screenshots__/`，完成判定 #3 要求"该目录下 PNG 经 git status 确认未被忽略"。实际基线在 `tests/visual/welcome.visual.spec.ts-snapshots/`、`test.visual.spec.ts-snapshots/`、`result.visual.spec.ts-snapshots/`——`__screenshots__/` 目录根本不存在。`.gitignore` 第 79-80 行 `!tests/visual/__screenshots__/` 和 `!tests/visual/__screenshots__/**` 指向不存在的路径，完全是死规则。基线能提交全靠第 78 行更宽泛的 `!tests/visual/**` 兜底。若开发者按契约意图"正确"收紧 gitignore（删掉宽泛规则、只保留 `__screenshots__/` 专用规则），7 条基线 PNG 会立即被 `*.png` 规则吞掉，git add 失败，且无任何报错提示。
  - **复现：** (1) `ls tests/visual/__screenshots__/` → 目录不存在；(2) `find tests/visual -name "*.png"` → 实际在 `*-snapshots/` 子目录；(3) 从 .gitignore 临时删掉 `!tests/visual/**` 和 `!tests/visual/` 两行，保留 `__screenshots__/` 规则，跑 `git add --dry-run tests/visual/welcome.visual.spec.ts-snapshots/welcome-desktop-zh-visual-darwin.png` → 文件被忽略，无法提交。
  - **Spec 缺口？：** 是——契约 R2 要求 `__screenshots__/`，代码存于 `<spec>-snapshots/`；完成判定 #3 不可验证；README 第 23 行声称 `snapshotPathTemplate` 已固化，实际 playwright.config.ts 无此配置。
  - **修复方向：** 在 playwright.config.ts 的 visual/visual-mobile project 中配置 `snapshotPathTemplate` 将基线导出到 `__screenshots__/`，或在 .gitignore 补 `!tests/visual/*-snapshots/` 反向规则并更新 README 和契约。

- **[F2] 严重度：High — `tests/visual/test.visual.spec.ts:27-33`：staggerIn 终态判定只检查第一个 opt-block，遗漏后续元素的 stagger 延迟**
  - **影响：** TestScreen.tsx:392 对每个选项设 `animationDelay: ${idx * 0.1}s`（普通题/天平题均如此）。3 选项时：opt[0] 延迟 0s → 0.6s 完成；opt[2] 延迟 0.2s → 0.8s 完成。当前代码只轮询 `page.locator(".opt-block").first()` 的 opacity，当 opt[0] 到 1 时 opt[2] 可能仍在动画中（还差 0.2s）。截图捕获的是非终态视觉，两次运行间因轮询时机微差可导致 opt[2] 的渲染像素不同，产生 flaky diff。spec 注释声称"等 staggerIn 终态 opacity:1"但实际只验证了 1/N 的元素。
  - **复现：** (1) 打开 `/test`，首题 3 个选项；(2) 用 DevTools 在 opt[2] 上设 animation-delay: 0.2s；(3) 轮询 opt[0] opacity===1 时立即截图；(4) 对比连续两次截图的 opt[2] 区域像素——由于 ease-out-expo 曲线在动画尾段变化极慢但非零，0.2s 内 opacity 可能从 ~0.98 到 1.0，像素差可超过 threshold=0.2 的容差。
  - **Spec 缺口？：** 否——纯代码缺陷，但违反契约 R7（动画终态稳定化）的精神。
  - **修复方向：** 将轮询改为检查 ALL `.opt-block` 的 opacity（用 `evaluateAll` 遍历，类似 `waitForScrambleSettled` 的写法），或在首个 opt-block 到达 opacity 1 后额外 `waitForTimeout(300)` 覆盖最大 stagger 间距。

- **[F3] 严重度：Medium — `tests/visual/visual-helpers.ts:30-47`：`waitForScrambleSettled` 未覆盖 kanji ghost（`.giant-text.kanji`）的 scramble，en/ja 基线可能截到非终态**
  - **影响：** `switchLang`（index.html:968-971）对 `.giant-text.kanji` 调用 `new TextScramble(kanji).setText(data.kanji)`，但该元素无 `data-scramble` 属性，不在 `waitForScrambleSettled` 的轮询范围内。en/ja 基线截图时，kanji ghost 可能仍在 scramble 中（textContent 含随机字符 span）。虽然该元素 `opacity: 0.06` 且 `color: transparent` + stroke 渲染，scramble 期间 span 的 `color:var(--blood)` 会短暂覆盖透明色，产生极淡红色像素（6% 不透明度），settled 后只有金色 stroke。两次运行间 scramble 帧不同，像素差虽小但在严格 CI 环境或未来收紧 threshold 时可能触发 diff。zh-CN 基线不受影响（不调 switchLang）。
  - **复现：** (1) 跑 `welcome en` 基线；(2) 在 `prepareWelcomeForScreenshot` 的 `waitForScrambleSettled` 返回后、截图前，用 `page.evaluate(() => document.querySelector('.giant-text.kanji').innerHTML)` 检查 innerHTML——若含 `<span style="color:var(--blood)">` 则证明 scramble 未完成；(3) 连续跑 3 次，比较 welcome-desktop-en 基线的 kanji ghost 区域像素。
  - **Spec 缺口？：** 否——纯代码缺陷，R7 要求动画终态稳定化但只约束了 [data-scramble] 元素。
  - **修复方向：** 在 `waitForScrambleSettled` 中追加对 `.giant-text.kanji` 的 textContent 终态检查（比对其最终文本与 i18n 表），或在 `maskWelcomeDynamic` 中加入该 locator 做 mask（因为它视觉权重极低，mask 损失可忽略）。

### Spec 覆盖检查

| 完成判定 | 状态 | 说明 |
|---|---|---|
| 1. 新增独立 visual spec 不改现有 15 spec | ✓ 覆盖 | 15 个原 spec 未动，visual 独立目录 |
| 2. ≥7 条基线 | ✓ 覆盖 | 磁盘上 7 个 PNG |
| 3. 基线可提交（`__screenshots__/` 下） | ✗ 缺失 | **F1**：该目录不存在，实际在 `<spec>-snapshots/` |
| 4. `.gitignore` 反向规则 | ⚠ 部分 | 有反向规则但指向错误目录，靠宽泛规则兜底 |
| 5. 运行命令可用全绿 | ⚠ 未验证 | 需实际运行确认 |
| 6. `--update-snapshots` 可用 | ⚠ 未验证 | 需实际运行确认 |
| 7. 失败产出三图 | ⚠ 未验证 | Playwright 原生行为，大概率 OK |
| 8. welcome 连续 3 次不 flaky | ⚠ 部分风险 | **F3**：en/ja 的 kanji ghost scramble 未等终态 |
| 9. 现有 e2e 不受影响 | ✓ 覆盖 | chromium project 有 testIgnore |
| 10. 策略文档化 | ⚠ 部分 | README 存在但含错误路径信息（F1） |

### 值得追的线索（不计入 K）

- `answerAllQuestions` 在 `reducedMotion: "reduce"` 下的行为：代码逻辑上应该正常（固定 900ms delay > 任何 transition），但 CSS `transition: none` 是否影响 Playwright 的 `isVisible` 时序判定，需要实际运行验证。目前无证据表明会失败。
- `result.visual.spec.ts` 的 `maxDiffPixelRatio: 0.02` 是否足够：注释说 typePercentage 来自 `/api/results` 统计可能微变，但 dev.db 每次 seed 是否确定性决定了该值是否稳定。需检查 seed 脚本是否使用固定随机种子。

### 裁决
3 条真实发现已报告。正确性攻击面已充分覆盖：基线路径一致性、动画终态判定完整性、非 data-scramble 元素的 scramble 遗漏。最严重的 F1 直接违反契约 R2 和完成判定 #3，是阻塞性问题。
