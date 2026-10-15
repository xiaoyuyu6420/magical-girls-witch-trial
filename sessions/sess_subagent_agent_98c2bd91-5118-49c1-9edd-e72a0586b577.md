# 你是 red-team，从**正确性**维度攻击阶段3a 结果页揭晓时刻的实现。硬配额：至少 2 个真实问题，或说...

- 会话 ID: `sess_subagent_agent_98c2bd91-5118-49c1-9edd-e72a0586b577`
- 时间: 2026-08-07 10:30:47 → 2026-08-07 10:46:19
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 12
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**正确性**维度攻击阶段3a 结果页揭晓时刻的实现。硬配额：至少 2 个真实问题，或说明为什么更少。

## 攻击目标
ResultScreen 重写为揭晓时刻（REDESIGN 第五节）。3 commit：R-C1 数据文案、R-C2/3/4 ResultScreen 重写。

## 实现位置（必读）
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx`（636行，主战场）
- `/Users/munich/Desktop/独立项目/magical-girls/src/pack/types.ts`（QuizPack.workIntro）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/witch-trial/index.ts`（workIntro 值）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/zh-CN.ts`（result 段新文案）

## 契约（判断"正确"的依据）
`/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`
关键正确性要求：
- R1：6元素错峰，REVEAL_TIMINGS = 0/800/1800/2400/3000/3800/4200
- R2：任意点击/按键跳过到 done
- R5：prefers-reduced-motion 降级（直接 done 无动画）
- R11：稀有度=typePercentage，越稀有越空，null兜底，special=rarityRare
- R12：砍除 similarity%/top3/雷达/维度条/弹窗
- R13：分享卡无 similarity%
- R16：隐藏角色 hiddenReveal 文案
- R19：match.ts 锁死，similarity/top3 字段保留但不显示

## 攻击方向（正确性）
1. **揭晓序列时序**：6 个 setTimeout 是否正确按 REVEAL_TIMINGS 错峰？有没有元素提前/延后显示？cardReady(4200) 后 revealPhase 是否正确转 done？
2. **跳过逻辑**：click/keydown/touchstart 是否都绑定？跳过后是否所有元素立即可见（不是停留在中间状态）？跳过后 timer 是否全部清除（防内存泄漏/后续误触发）？
3. **reduced-motion**：检测逻辑是否在挂载时同步执行（不是动画开始后才检测）？reduced-motion 时 revealPhase 是否直接 done？
4. **稀有度计算**：typePercentage 为 0（合法，极稀有）时怎么显示？typePercentage=100（所有人都是这个）时？special=true 且 typePercentage=null 时？填充条映射正确吗？
5. **隐藏角色**：special=true 时 hiddenReveal 是否显示？rarityRare 文案是否替换 rarityGlobal？
6. **砍除完整性**：是否真的没有任何地方残留 similarity%/top3/雷达引用？分享卡是否真的无 similarity？
7. **状态恢复**：用户刷新结果页（如果 result 在 state），揭晓会重播吗？这是 bug 还是 feature？
8. **i18n 文案消费**：所有 t("result.xxx") 的 key 是否都存在于 zh-CN.ts？有没有拼错 key 导致显示 fallback key 字符串？

## 产出格式
每条：标题 + 具体影响 + 复现路径（代码行）+ spec缺口 + 严重度(Critical/High/Medium/Low)。
git blame 关键行区分阶段3a回归 vs pre-existing。读实现日志 40-implementation.md 的偏离条款。
开始攻击。

## 🤖 助手
现在我已掌握全部关键代码和契约。让我验证最后几处具体细节。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
所有关键代码已读完并交叉验证。开始输出攻击结果。

---

### BLUF
2 条已验证发现。最严重：**prefers-reduced-motion 降级不完整——档案卡淡入和遮罩淡出仍各 0.8s 动画**，直接违反 R5 + WCAG 2.3.3。第二条：hiddenReveal 文案放在档案卡（opacity 0）上而非揭晓层，spec 要求"揭晓时"出现。契约核心时序/跳过/砍除逻辑实现正确。

### 最严重问题
prefers-reduced-motion 下档案卡和遮罩仍做 0.8s opacity transition，未"直接呈现完整档案卡"——违反 R5 + WCAG。

### 发现

- **[F1] 严重度：High — `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx:262-265` + `:423-426`**
  - **影响：** 用户开启 prefers-reduced-motion:reduce（前庭障碍、动效敏感）后，档案卡从 opacity 0→1 仍经历 0.8s CSS transition（行 264），遮罩从 opacity 1→0 也经历 0.8s transition（行 424-425）。R5 明确要求"跳过所有揭晓动画直接呈现完整档案卡"，0.8s 交叉淡入不是"直接"。违反 WCAG 2.1 SC 2.3.3 Animation from Interactions（AAA 级）。
  - **复现：** 1) 系统设置开启"减少动态效果"（macOS: 辅助功能 > 显示 > 减少动态效果）；2) 完成测评进入 ResultScreen；3) 预期：档案卡瞬间全屏出现；实际：档案卡 0.8s 淡入，遮罩 0.8s 淡出，形成约 0.85s 的交叉渐变动画。
  - **Spec 缺口？：** 是——R5 要求"直接呈现"，代码在 reduced-motion 分支虽跳过了错峰 setTimeout（行 106-108），但 CSS transition 无条件生效，等于只在 JS 调度层降级，CSS 层未降级。
  - **修复方向：** 当 `prefersReducedMotion` 为 true 时，行 264 改为 `transition: "none"`（或条件跳过 transition）；行 424-426 同理，`revealLayerOut && !prefersReducedMotion` 时才启用 transition。

- **[F2] 严重度：Medium — `/Users/munich/Desktop/独立项目/magical-girls/src/components/ResultScreen.tsx:382-392`**
  - **影响：** hiddenReveal 文案"……审判庭从未见过这样的受审者。"渲染在档案卡 div 内（`result-layout`，行 260-404），而该 div 在揭晓期间 `opacity: 0`（行 263: `revealPhase === "done" ? 1 : 0`）。结果：隐藏角色揭晓动画期间此文案始终不可见，只在遮罩淡出后才作为静态文本出现。Spec R16/A5 写"揭晓时多一行"——"揭晓时"即揭晓序列播放期间，不是揭晓完成后。戏剧效果被消解：本应随错峰逐步出现的额外悬念行，变成了事后补上的说明文字。
  - **复现：** 1) 获取 special=true 的角色结果（如 YUKI/ETL）；2) 观察整个揭晓序列：遮罩层 5 个错峰元素逐一出现，hiddenReveal 文案从未出现在遮罩上；3) 遮罩淡出后，档案卡浮现，hiddenReveal 才随档案卡一起出现——不在揭晓"过程中"。
  - **Spec 缺口？：** 是——R16 说"揭晓时多一行"，A5 说"揭晓时多一行'……审判庭从未见过这样的受审者'"。代码把它放在档案卡（揭晓完成后才可见），不放在揭晓层。
  - **修复方向：** 将 hiddenReveal 移入揭晓遮罩层（行 410-517），作为第 6 个错峰元素（新增 `revealVis.hiddenReveal`，在 `fromWork` 后调度，如 REVEAL_TIMINGS 新增 `hiddenReveal: 4000`），或在 `nameReveal` 后立即出现。

### Spec 覆盖检查

| 验收锚点 | 状态 | 说明 |
|---|---|---|
| V1 揭晓序列 t=0.8/2.4/4.2 | ✓ | REVEAL_TIMINGS 值与 spec 精确匹配（800/2400/4200），schedule 调用正确 |
| V2 跳过 t=2.0→立即 t=4.2 | ✓ | click/keydown/touchstart 三事件绑定，skipReveal 清 timer+ALL_VISIBLE+done；~50ms 后遮罩 pointer-events:none，档案卡可交互 |
| V3 reduced-motion 直接档案卡 | **✗** | JS 调度层正确跳过（行 106-108），但 CSS transition 层未降级（F1） |
| V4 主视图无 similarity%/雷达/维度条/top3 | ✓ | JSX 中无渲染引用；ResultData 接口保留字段符合 R19 |
| V5 分享卡含钩子+角色+标语+稀有度+CTA，无 similarity | ✓ | 行 522-633 验证无 similarity 引用 |
| V6 稀有度兜底 stats=null | ✓ | typePercentage=null → "全球数据收集中" + 空 bar（行 234-236, 239） |

### 值得追的线索（不计入 K）

- **REVEAL_TIMINGS.pageFadeOut 定义但未消费**：常量声明了 7 个键（含 pageFadeOut: 0），但 schedule() 仅调用 6 个（5 元素 + cardReady）。overlay 在 mount 时隐式可见（t=0），不需要 setTimeout。功能正确，但常量是死代码，可误导后续维护者以为 t=0 处有显式调度。低风险。
- **行 264 inline transition 静默覆盖 CSS `.result-layout` 的 `transition: transform 1.2s`**（globals.css:398）：CSS 定义的 transform transition 被行 264 的 inline `transition: opacity 0.8s` 完全替换。当前无功能影响（无 transform 变化需动画），但未来若复用 `.result-layout` 的 transform 动画会静默失效。
- **分享卡对 special 角色不区分稀有度文案**：档案卡显示"极少判定 · X%"，分享卡只显示"X%"+ "稀有度"标签。Spec R14 只要求"稀有度数字"，故不违规，但两张卡视觉不一致。

### 裁决
2 条真实发现已报告。正确性攻击面已穷尽核心路径（时序/跳过/reduced-motion/稀有度/隐藏角色/砍除/i18n），F1（reduced-motion CSS 未降级）为 High，F2（hiddenReveal 放错层级）为 Medium。
