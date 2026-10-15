# 你是 red-team，从**可维护性**维度攻击「HTML 32 视觉重做」。硬配额：至少 **K=3** 个真...

- 会话 ID: `sess_subagent_agent_4fcc817d-8c4e-4639-b887-b921d4bddaae`
- 时间: 2026-08-13 15:05:12 → 2026-08-13 15:09:37
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**可维护性**维度攻击「HTML 32 视觉重做」。硬配额：至少 **K=3** 个真实问题，或说明为什么更少。

## 实现（攻击对象）
项目根 `/Users/munich/Desktop/独立项目/magical-girls`。
- `src/app/globals.css`（IM1 全改，914→1445 行，@layer 级联 + token 重定向 + 19处硬编码替换 + 全部新样式）
- `src/components/BackgroundLayers.tsx`、`AuroraBurst.tsx`（IM2/3 新建）
- `src/components/TestScreen.tsx`（IM4）、`ResultScreen.tsx`（IM5 重构）
- `tests/`（IM6 适配 + helpers）

## 契约
- `crucible/30-adr/final.md` 决策2（@layer + token 重定向）+ 决策3（组件拆分/class 纪律）

## 你的攻击面（可维护性）
1. **@layer 级联**：IM1 引入 `@layer reset,tokens,base,desktop-skin,mobile-skin,atmosphere,reduced-motion`。是否所有规则都正确归层？有没有裸 CSS（未分层）会压过层？层顺序是否在 Tailwind utilities 之后（IM1 报告称是）？归层是否完整（IM1 自承"工程量大，至少新增样式归层"）？
2. **globals.css 1445 行单文件**：是否过于庞大？token/答题页/结果页/背景层/HUD/天平/筹码混在一起，可维护性？有无重复规则/死代码（旧 .hero-*/#cursor-* 死代码是否清理还是残留）？
3. **token 重定向**：`--champagne-main: var(--gold-hyper)` 这种"旧名指向新值"是否造成混淆（名义香槟实际金紫）？后续维护者会不会困惑？是否该彻底改名？
4. **硬编码残留**：IM1 替换 19 处 rgba(216,200,176)，但是否有遗漏？grep 确认。新增样式是否又引入硬编码（非 token）？
5. **ResultScreen 重构质量**：inline style 与 CSS class 混用？E2E 锚点 class 与 32 新 class 同节点兼挂是否混乱？Reveal 骨架注释是否清晰？
6. **组件接口**：BackgroundLayers/AuroraBurst 的 props 设计是否合理？是否有 magic number（minDurationMs=1300）无注释？
7. **测试可维护性**：helpers 的极光等待(8s timeout)、result.visual 的 overflow 放宽 hack，是否脆弱/难懂？

## 方法
- grep/wc/Read 代码定位
- 每条发现：具体可维护性问题 + 影响（谁会踩坑/多难改）+ 建议修复

## 输出
3+ 条发现，每条：`[严重度] 标题 | 问题 | 维护影响 | 位置 | 建议修复`。

## 🤖 助手
我先快速摸清地形，然后逐个攻击面验证。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
现在读核心文件验证攻击面。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
@layer 结构有线索了。我需要精确找出层外裸规则、死代码、硬编码残留。继续验证。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
裸规则和硬编码两路都有线索。读实际文件确认 @layer 边界。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
裸规则是解析器误报（缩进显示实际在层内）。重点确认死代码标注和组件质量。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
死代码有标注（ADR 授权）。转向验证 reduced-motion 极光声明、token 命名混淆、ResultScreen 质量。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
token 命名错位确认。看 ResultScreen 重构质量和测试 helpers。

> 🔧 工具调用 1 次: Read

## 🤖 助手
ResultScreen 大量 inline style。量化统计 + 看测试 helpers。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
验证 `--text-dim` 是否定义（ResultScreen 多处引用）+ 精确统计未用 class。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
检查 `.pulse-orb` 是否死定义 + CSS 重复规则 + canvas 硬编码耦合。

> 🔧 工具调用 1 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
验证 Tailwind 是否存在 + @layer 与 utilities 的交互（攻击面 #1）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
读 @layer 顺序注释（L50-79）确认与 Tailwind utilities 的交互声明。

> 🔧 工具调用 1 次: Read

## 🤖 助手
验证 Tailwind utility 是否真被组件使用（决定 #6 是真问题还是理论）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
已收集足够证据。所有发现均经 grep/Read 验证。输出报告。

---

### BLUF
**5 条已验证发现**（K=3 已超额）。最严重：**ADR 决策2 的 token 中心化目标只完成一半**——旧 19 处 `rgba(216,200,176)` 替换了，但新样式在 `globals.css` 重新撒进 **79 处硬编码 rgba**、`ResultScreen` 分享卡 110 行全 inline、canvas 双源紫色，token 重定向的"集中改色"承诺对任何**新**配色都不成立。spec 忠实度：@layer 级联（决策2）与组件轻拆（决策3）执行到位，但 class 纪律（决策3）被 ResultScreen 分享卡系统性违反。

### 最严重问题
**[High] token 中心化半落空**：79 处硬编码 rgba 散布 `globals.css` + ResultScreen 分享卡 0 token + canvas 双源紫——改一个金色要 grep 三处代码库。

### 发现

---

- **[F1] 严重度：High — token 中心化半落空：globals.css 79 处硬编码 rgba 绕过 token** | `src/app/globals.css`（全文，典型 L340/359-360/458/471/534-535/581/588-589/628-634）
  - **影响：** ADR 决策2 明确将"4 行定义点重定向翻转 24 消费者"作为 token 中心化的核心价值。实测：旧 19 处 `rgba(216,200,176)` 确已替换（仅剩 3 处注释残留），但**新样式重新引入** `rgba(255,215,0,*)` × 38 处 + `rgba(216,0,255,*)` × 7 处 + 其他 ≈ 34 处 = **79 处硬编码 rgba** 全部绕过 `--gold-hyper`/`--purple-neon` token。后果：要把超金从 `#FFD700` 调暗一档，维护者必须 grep 编辑 38+ 处 globals.css + ResultScreen inline + canvas，token 重定向对这些新色零作用。
  - **复现：** `grep -nE "rgba?\([0-9]" src/app/globals.css | grep -v "var("` → 79 行。
  - **Spec 缺口？：是——决策2 要求"配色集中可维护"，代码对旧色做到了、对新色没做到。**
  - **修复方向：** 新增 `--gold-15/--gold-25/--gold-glow-strong` 等带 alpha 的派生 token（`rgba(255,215,0,0.15)` 形式），把 79 处逐类收敛。

---

- **[F2] 严重度：High — ResultScreen 分享卡 ~110 行全 inline style，绕过 token 和 32 新 class 体系** | `src/components/ResultScreen.tsx:532-643`（全文件 38 处 `style={{}}`，TestScreen 仅 9 处）
  - **影响：** ADR 决策3 明文要求"class 纪律"+ 在 globals.css 定义 `.editorial-grid/.tarot-card-frame/.stat-*` 等 32 新 class。实测 ResultScreen 主体确实用了这些 class，但**分享卡（L532-643）零 class、零 token、全 inline**：`background:"#050308"`×4、`color:"#fff"/"#888"/"#e6e6e6"`、`rgba(255,215,0,0.6)` 等散在 ~25 个 `style={{}}` 对象里。后果：(1) 分享卡无法通过改 token 换肤；(2) 任何配色微调要逐行编辑 JSX 而非 CSS；(3) globals.css 里没有任何 `.share-card-*` class，意味着这部分视觉**完全脱离**了 IM1 投入的级联体系。与 ADR 盲点 #4"分享卡用实色 rgba 模拟玻璃态"的要求一致，但"实色"被实现成"散落 inline 硬编码"。
  - **复现：** `sed -n '532,643p' src/components/ResultScreen.tsx | grep -c "style={{"` → ~25；全无 className。
  - **Spec 缺口？：是——决策3 class 纪律对分享卡未执行。**
  - **修复方向：** 抽 `.share-card/.share-card-hook/.share-card-name/.share-card-keyword` 等到 globals.css atmosphere 层，JSX 只挂 class。

---

- **[F3] 严重度：High — token 名义/实际错位（champagne-* → gold/violet/void/米白）永久留在 :root** | `src/app/globals.css:138-141,60-62`
  - **影响：** 定义点重定向留下永久认知债：`--champagne-main: var(--gold-hyper)`（名"香槟主色"，值=超金 #FFD700）、`--champagne-dim: var(--violet-deep)`（名"香槟暗"，值=深紫）、`--champagne-bg: var(--void)`（名"香槟背景"，值=虚空黑）、`--champagne-light: #F2EFE9`（名"香槟浅"，值=米白，注释自承"原米白保留"）。后果：`.balance-pan-key { color: var(--champagne-main) }` 读起来是"香槟色文字"，渲染却是亮金；维护者想"调暗香槟色"会去改 `--champagne-main`，实际改的是金色，改完不生效再 grep `--gold-hyper`，浪费排查。ADR 决策2 把"4 行翻转"列为优势，**从未评估命名错位的长期成本**——这是 redirect 策略的隐性代价。
  - **复现：** 读 globals.css L138-141，4 个 champagne token 没有一个值是香槟色。
  - **Spec 缺口？：否——纯可维护性缺陷（redirect 是 ADR 授权的）。**
  - **修复方向：** 要么彻底改名（`--accent-main/--accent-dim` 等）并 sed 替换 24 消费者；要么至少在 token 定义处加 `/* DEPRECATED alias, 实际=金色，勿依名改值 */` 警告注释。

---

- **[F4] 严重度：Medium — BackgroundLayers canvas 硬编码紫色，与 --purple-neon token 双源** | `src/components/BackgroundLayers.tsx:86,88`
  - **影响：** canvas 绘制用 `ctx.fillStyle = \`rgba(216, 0, 255, ${p.alpha})\``（L86）+ `ctx.shadowColor = "#D800FF"`（L88），与 globals.css L88 `--purple-neon: #D800FF` 是两份独立硬编码。canvas 拿不到 CSS var 是技术限制，但当前**没有任何注释标注这种耦合**。后果：改 `--purple-neon` token（比如调到 `#B000E0`）后，背景粒子仍渲染旧紫色，视觉不一致且难定位——因为没人会想到去 tsx 里找颜色。
  - **复现：** 改 globals.css `--purple-neon` 值，canvas 粒子不变。
  - **Spec 缺口？：否——技术限制下的妥协，但缺注释。**
  - **修复方向：** 组件 mount 时 `getComputedStyle(document.documentElement).getPropertyValue('--purple-neon')` 读 token（fallback `#D800FF`），消除双源；或至少在 L86/88 加 `/* 须与 globals.css --purple-neon 同步 */` 注释。

---

- **[F5] 严重度：Medium — 测试 helpers 极光等待 8s 黑盒 timeout + 4 个 magic waitForTimeout** | `tests/helpers.ts:88-96,63-68`
  - **影响：** L88-96 注释"opt 没回来：极光转场中（aurora ~1.3s）"，然后用 `await expect(resultLayout).toBeVisible({ timeout: 8000 })` 黑盒等 8 秒。这 8000ms 是对"AuroraBurst minDurationMs=1300 + fetch + ResultScreen mount + reveal"的**猜测值**，与组件契约无任何常量绑定。L63-68 还有 `waitForTimeout(120)/120/200` 配 weight card 点击间隔，注释解释了意图（等 React 重渲染），但 120/200 是耦合 cycleSlot 重渲染节奏的 magic number。后果：(1) AuroraBurst 的 `minDurationMs` 从 1300 改到 2000，测试仍过但理由错；(2) 动画时序调整后这些 sleep 会 flaky，且无结构化信号（如 `[data-aurora-complete]` 属性）可锚定。
  - **复现：** 把 `src/components/AuroraBurst.tsx` 默认 `minDurationMs` 改大，测试行为变化但无任何编译期/常量警告。
  - **Spec 缺口？：否——测试脆弱性，非 spec 违反。**
  - **修复方向：** AuroraBurst 完成时在 DOM 打 `data-aurora-done="true"`，测试 `await expect(locator).toHaveAttribute(...)` 取代 8s 黑盒；weight card 的 120/200 抽成 `WEIGHT_CLICK_GAP_MS` 常量并注释与 cycleSlot 的关系。

---

### Spec 覆盖检查

- **决策2 · 定义点重定向（4 行翻转 24 消费者）：⚠ 部分** —— 旧消费者翻转到位，但新样式引入 79 处硬编码绕过 token（F1）。
- **决策2 · 批量替换 19 处 rgba(216,200,176)：✓ 覆盖** —— grep 确认仅剩 3 处注释残留。
- **决策2 · @layer 级联边界（7 层）：✓ 覆盖** —— 7 层全部正确开闭，无层外裸规则（解析器初报为误，Read 确认 L152/170 等均正确归层）。
- **决策2 · @layer 注释自称"与旧裸 CSS 行为一致"：⚠ 误导** —— 实际 desktop-skin/mobile-skin/atmosphere/reduced-motion 层排在 Tailwind `utilities` 层之后，会压过 utility class；旧裸 CSS 是"压过一切"，现行为不同（见线索）。
- **决策3 · 组件轻拆 BackgroundLayers/AuroraBurst：✓ 覆盖** —— 两组件干净、props 合理、magic number(1300/45)有注释。
- **决策3 · 保留 E2E 锚点 class：✓ 覆盖** —— `.opt-block/.balance-pan/.result-layout/.r-name/.btn-restart` 等全保留。
- **决策3 · 新增 32 class + class 纪律：⚠ 部分** —— 32 class 多数定义且使用，但 ResultScreen 分享卡零 class 全 inline（F2），系统性违反纪律。
- **盲点 #4 · 分享卡禁用 backdrop-filter：✓ 覆盖** —— 分享卡全实色 rgba（虽散在 inline）。
- **盲点 #7 · reduced-motion 全链路守卫：✓ 覆盖** —— L1417-1444 守了 canvas/aurora/posture/floatIn/toast/card/tarot，AuroraBurst 注释 L17 的"组件层无需分支"声明经 globals.css L1437 兑现。

### 值得追的线索（不计入 K）
- **@layer 与 Tailwind utilities 的隐性优先级**：Tailwind v4 `@import "tailwindcss"` 先声明 `theme/base/components/utilities` 层，本项目 L77 的 `reset/tokens/base/desktop-skin/...` 排在其后，意味着 desktop-skin/mobile-skin/atmosphere/reduced-motion **全部压过 Tailwind utilities**。实测组件极少用 utility class（仅 `flex/absolute/rounded-full` 等零星），故当前无活跃冲突；但未来开发者加 `className="hidden"` 期望 Tailwind 生效时，可能被 layered CSS 静默覆盖，且注释"与旧裸 CSS 行为一致"会误导排查方向。低频但真实，无法在不跑渲染的情况下证伪冲突，留下一轮验证。

### 裁决
**5 条真实发现已报告（K=3 超额）。可维护性攻击面未完全耗尽**——@layer/Tailwind 交互（线索）、globals.css 1445 行单文件是否该拆（ADR 授权保留死代码，弱发现）、重复选择器（多为 @layer 跨层故意覆盖，非问题）已排查并排除。最强三条（F1 token 半落空 / F2 分享卡 inline / F3 命名错位）共同指向同一根因：**ADR 决策2 把 token 重定向当作"4 行搞定"的低成本方案，但未约束新样式的 token 纪律，导致 redirect 的收益被新代码重新侵蚀。**
