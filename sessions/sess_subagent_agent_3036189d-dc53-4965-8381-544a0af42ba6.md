# 你是 crucible 流程的**红方**，从**可维护性**维度攻击实现。硬配额：至少报告 3 个真实问题，或明...

- 会话 ID: `sess_subagent_agent_3036189d-dc53-4965-8381-544a0af42ba6`
- 时间: 2026-08-09 16:40:33 → 2026-08-09 16:44:00
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 7
- 归档状态: 未归档

---

## 👤 用户
你是 crucible 流程的**红方**，从**可维护性**维度攻击实现。硬配额：至少报告 3 个真实问题，或明确说明为什么更少。

## 攻击对象

刚实现的 e2e 视觉回归基线。相关文件：
- `/Users/munich/Desktop/独立项目/magical-girls/playwright.config.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/.gitignore`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/visual-helpers.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/welcome.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/test.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/result.visual.spec.ts`
- `/Users/munich/Desktop/独立项目/magical-girls/tests/visual/README.md`

## 意图契约

完整契约在 `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`。

## 你的攻击维度：可维护性

聚焦"后续开发者接手时会不会困惑、误用、难以扩展"。检查方向（不限）：
- **README 准确性**：README 写的命令、路径、策略是否与实际代码一致？有没有过时或误导信息？（如 README 提到 `__screenshots__/` 但实际是 `<spec>-snapshots/`？运行命令是否真能跑？）
- **magic number/硬编码**：timeout 值、viewport 尺寸、maxDiffPixelRatio:0.02、waitForTimeout(2000/300) 等是否有注释说明为什么是这个值？后续改的人知道能不能动？
- **测试可读性**：spec 文件的注释是否解释了"为什么这么做"（不只是"做了什么"）？尤其偏离 ADR 的 4 个地方是否在代码里有标注？
- **扩展性**：如果要加一个新基线（如 Test 天平题），开发者照着现有模式能加吗？需要改几个文件？有没有隐藏的耦合？
- **脆弱性**：如果首页 DOM 选择器变了（如 `.hero__cta` 改名），多少个测试会断？有没有单一修改点？
- **命名一致性**：基线文件名（welcome-desktop-zh vs welcome-mobile-zh）、project 名、test 名是否一致且不误导？
- **策略文档与实际容差的漂移**：README 说"全基线 threshold:0.2 不设 maxDiffPixelRatio"，但 result 实际设了 0.02——文档和代码矛盾吗？

## 输出格式

每条发现：
- **编号 + 标题**
- **具体影响**：后续维护者会怎么困惑/犯错
- **复现路径**：具体的场景（如"开发者照 README 跑命令 X，会得到 Y 而非文档说的 Z"）
- **严重度**：CRITICAL / WARNING / SUGGESTION
- **spec 对齐**：违反契约哪条，或可维护性隐患

## 自我管理 + 约束

- **有界**：只报告真实可维护性问题——读代码和文档确认矛盾/缺失，不模糊警告。
- **防漂移**：聚焦可维护性，不扩展到正确性/性能/安全。
- **诚实退出**：找不到 3 个就明确说原因。
- **边界**：只报告不改代码。

至少 3 个真实问题，或诚实说明为什么更少。

## 🤖 助手
现在，我将通过检查实际的快照目录结构并验证其他一些事项来确认我的发现。

> 🔧 工具调用 4 次: Bash

## 🤖 助手
已验证所有文件和实际文件系统状态。以下是完整的攻击报告。

---

### BLUF
3 条已验证可维护性发现，最严重的是 README 描述的基线存储路径 `__screenshots__/` 根本不存在——实际是 `*-snapshots/` 目录，README 还虚构了 `snapshotPathTemplate` 配置。doc-code 矛盾在容差策略和 locale 实现方式上也各有一处。spec 未被忠实实现——至少 3 条完成判定引用了错误路径。

### 最严重问题
README 声称基线存在 `tests/visual/__screenshots__/`，且 `playwright.config.ts` 有 `snapshotPathTemplate` 固化路径——两者均为虚假信息，实际基线在 `*-snapshots/` 子目录，无任何路径配置。

### 发现

- **[F1] 严重度：Critical — tests/visual/README.md:22-23 + playwright.config.ts + .gitignore:79-80**
  - **影响：** README 第 22 行写"基线 PNG 存 `tests/visual/__screenshots__/`"，第 23 行写"路径模板（playwright.config.ts `snapshotPathTemplate` 固化）"。实际：`__screenshots__/` 目录不存在（`ls` 确认 No such file or directory），基线在 `welcome.visual.spec.ts-snapshots/`、`test.visual.spec.ts-snapshots/`、`result.visual.spec.ts-snapshots/`（Playwright 默认路径），`playwright.config.ts` 中无 `snapshotPathTemplate` 也无 `snapshotDir`。后续开发者照 README 找基线 PNG 会去不存在的目录，照 README 改 `snapshotPathTemplate` 会发现配置项不存在。`.gitignore` 第 79-80 行的 `!tests/visual/__screenshots__/` 和 `!tests/visual/__screenshots__/**` 是指向不存在路径的死规则，误导开发者认为基线在那里。契约完成判定 #3 也引用了错误路径 "`tests/visual/__screenshots__/` 下 PNG"。
  - **复现：** `ls tests/visual/__screenshots__/` → No such file or directory; `grep snapshotPathTemplate playwright.config.ts` → 无输出; `find tests/visual -name "*.png"` → 7 个文件全在 `*-snapshots/` 子目录
  - **Spec 缺口？：** 是——契约完成判定 #3 写"tests/visual/__screenshots__/ 下 PNG 经 git status 确认未被 .gitignore 忽略"，实际路径不匹配；R2 写"基线截图应当存储在 tests/visual/__screenshots__/"，实际未存储在此
  - **修复方向：** 在 `playwright.config.ts` 的 visual/visual-mobile project 中添加 `snapshotPathTemplate` 使基线实际存入 `__screenshots__/`，或在 README 和 .gitignore 中改为 `<spec>-snapshots/` 的真实路径

- **[F2] 严重度：High — tests/visual/README.md:61-63 vs result.visual.spec.ts:51**
  - **影响：** README "容差"节第 61 行写"不预设 `maxDiffPixelRatio`——mask 已剔除随机源，剩下的应像素级一致；预设余量只会掩盖漏 mask"，第 63 行写"若某基线 flaky，按需逐条上调 `maxDiffPixelRatio`……并在测试旁注释原因"。但 result.visual.spec.ts 第 51 行实际设了 `maxDiffPixelRatio: 0.02`。这是一个 doc-code 直接矛盾。开发者读 README 建新基线时遵循"不设 maxDiffPixelRatio"原则，但对 result 基线的 deviation 没有策略层面的解释。更严重的是：注释说"稀有度百分比（typePercentage）来自 /api/results 统计，每次 seed 后该数字可能微变（~1% 像素波动）"，但 1% 像素波动对应的应该是 `maxDiffPixelRatio: 0.01` 而非 `0.02`——注释和数值本身也不一致。
  - **复现：** 读 README "容差"节 → 得出"不预设 maxDiffPixelRatio"结论；打开 result.visual.spec.ts 第 49-52 行 → 发现 `maxDiffPixelRatio: 0.02`；注释说"~1% 像素波动"但值是 0.02（2%）
  - **Spec 缺口？：** 是——R11 写"应上调该基线的 maxDiffPixelRatio……并在测试名旁注释原因（不静默放任）"。result 确实有注释，但 README 的策略描述遗漏了此例外，等于策略文档"静默放任"了此 deviation
  - **修复方向：** README 容差节增加例外说明："result 档案卡因 typePercentage 来自 /api/results 统计、seed 间微变，设 maxDiffPixelRatio:0.02（R11 例外）"；修正注释中"~1%"为"~2%"或修正值为 0.01

- **[F3] 严重度：High — tests/visual/README.md:35-36 vs visual-helpers.ts:104-108**
  - **影响：** README 覆盖范围表第 2、3 行（Welcome desktop en/ja）的稳定化策略写"L2 addInitScript locale + scramble settle"，但实际代码 `prepareWelcomeForScreenshot` 的 locale 切换并非用 Playwright `addInitScript` 注入 locale，而是显式点击 `.lang-btn[data-lang]` 按钮（visual-helpers.ts 第 106 行）。代码注释明确说明原因："绕开 DOMContentLoaded +1500ms 的自动切换时序竞态——boot 序列初始 scramble 与自动 switchLang 竞态会导致 scramble 在自动切换瞬间从中文乱码切到目标语言，settle 判定不稳"。`addInitScript` 是完全不同的技术手段（context 级脚本注入），描述错误会导致后续开发者用错误方式实现 locale 切换，重现被显式点击方案规避的竞态。
  - **复现：** 读 README 表第 2 行 → 得出"en 基线用 addInitScript locale"结论；打开 visual-helpers.ts → 无任何 addInitScript 调用，locale 切换是 `.lang-btn[data-lang].click()`
  - **Spec 缺口？：** 否——纯 doc-code 矛盾，不影响 spec 需求满足，但严重影响可维护性：策略描述错误引导实现者走入歧途
  - **修复方向：** README 表第 2、3 行稳定化策略改为"L2 显式点击 lang-btn + scramble settle"，或更精确地写"L2 lang-btn click + scramble settle（绕开自动切换竞态）"

- **[F4] 严重度：Medium — result.visual.spec.ts:43**
  - **影响：** 第 43 行 `await page.waitForTimeout(300)` 的注释只说"再等一帧让 DOM 完全稳定"，但 300ms 不是一帧（16-33ms），是 9-18 帧。reducedMotion 下 transition 被设为 "none"（瞬时），React 状态传播也是同步的，300ms 的具体依据不明确。后续开发者看到"一帧"会困惑为什么是 300ms；如果想优化测试速度，不知道能不能安全缩减。这是 ADR D3（reducedMotion 短路）的实现细节缺乏可维护性注释。
  - **复现：** 读 result.visual.spec.ts 第 42-43 行：注释说"一帧"，值是 300ms，两者不匹配
  - **Spec 缺口？：** 否——纯代码可读性问题
  - **修复方向：** 注释改为"等 300ms 让 React 状态传播 + DOM 重排完成（reducedMotion 下 transition:none 瞬时，但 React 批量更新需额外 tick）"或类似精确说明

### Spec 覆盖检查

| 契约需求 | 状态 | 说明 |
|---|---|---|
| R1 原生 toHaveScreenshot | ✓ | 所有 spec 使用原生 API |
| R2 基线存 tests/visual/__screenshots__/ | ✗ | 实际存 `*-snapshots/` 子目录，__screenshots__/ 不存在 |
| R3 .gitignore 反向规则 | ⚠ | 反向规则存在但指向错误路径（`__screenshots__/` 不存在）；`!tests/visual/**` 实际起了作用，但 R2 的路径约定未满足 |
| R4 核心三屏覆盖 | ✓ | welcome/test/result 三屏均有基线 |
| R5 移动端 welcome+test | ✓ | visual-mobile project 覆盖 |
| R6 可选扩展 | ✓ | 未做，合理 |
| R7 动画稳定化 | ✓ | L1/L2/L3 三层协议已实现 |
| R8 Result 只截档案卡终态 | ✓ | reducedMotion 跳过揭晓 |
| R9 scramble 终态等待 | ✓ | waitForScrambleSettled 实现 |
| R10 threshold:0.2 | ✓ | 所有基线均有 |
| R11 flaky 基线逐条上调+注释 | ⚠ | result 确实上调了 maxDiffPixelRatio 并有注释，但 README 策略描述遗漏此例外 |
| R12 单独运行隔离 | ✓ | --project=visual --project=visual-mobile 可行（但与契约写的 `pnpm exec playwright test tests/visual/` 不同） |
| R13 更新命令 | ✓ | --update-snapshots 可用 |
| R14 失败产物 | ✓ | toHaveScreenshot 原生行为 |
| R15 不改现有 spec | ✓ | 新增独立文件 |
| R16 screenshot.spec.ts 保留 | ✓ | 未删除 |
| 完成判定 #3 __screenshots__/ 下 PNG | ✗ | 路径不匹配 |
| 完成判定 #10 策略文档化 | ⚠ | README 有策略文档但多处与代码矛盾 |

### 值得追的线索（不计入 K）

- `.gitignore` 第 77-78 行的 `!tests/visual/` + `!tests/visual/**` 使得 visual 目录下所有文件（含 .ts 源码）都不被 `*.png` 等全局规则忽略。但第 79-80 行的 `__screenshots__` 专条是死规则。如果将来有人添加 `snapshotPathTemplate` 把基线移到 `__screenshots__/`，第 77-78 行仍会生效而 79-80 行变得非冗余——但当前状态下 79-80 行是误导性的"遗骸"，暗示曾经或将要使用该目录。
- README 覆盖范围表共 7 行但实际基线也是 7 条——数量匹配，但第 2、3 行的技术描述（addInitScript locale）与实际实现不符，可能是在实现早期用 addInitScript 方案后来改为显式点击但表未更新。

### 裁决
4 条真实发现已报告（3 条 Critical/High 满足配额 K=3，1 条 Medium 补充）。可维护性攻击面已深度挖掘——所有发现均为 doc-code 矛盾或路径虚构，均已通过文件系统验证（`ls`/`find`/`grep` 确认），非假设。核心问题：README 作为"策略单一信源"至少在 3 处与实际代码矛盾，对后续维护者的误导风险高。
