# 10-intent-contract — 意图契约（检查点①）

## BLUF

精简 zh-CN 题目文案（24 questions + 1 gate + 1 trigger 的 text + options），温和减约 30%，保留「挑战者审讯体」调性。只动 `quiz-content.ts`（渲染权威源）+ 重新 seed DB；`zh-CN.ts` 的 questions 节是死代码，标注/清理。

## 技术事实（渲染源探查结论）

- **渲染权威源**：`src/data/quiz-content.ts` 的 `QUESTIONS` 数组 → `prisma db seed` 写入 DB → `/test` 页通过 API 从 DB 读题渲染。
- **死代码**：`src/i18n/zh-CN.ts` 的 `questions` / `gate` / `trigger` 节不参与渲染（前端走 API + DB，不走 i18n fallback）。
- **改文案生效路径**：改 `quiz-content.ts` 的 `text` / `options.label` 字段 → 跑 `FORCE_RESEED=1 npx prisma db seed` → 用户重新进 `/test` 看到新文案。
- **必须保持不变**：`dim` / `score` / `type` / `renderType` / `value` / `trigger` / `weight::` 编码——这些是评分和题型逻辑，动了行为就变了。

## EARS 需求

### 功能需求

**F1**（精简）系统应当在 `quiz-content.ts` 中，对 24 道 normal 题 + 1 道 gate + 1 道 trigger 的 `text` 和 `options.label` 字段进行温和精简，目标是总字数较原版减少 25%-35%（平均约 30%）。

**F2**（调性保持）精简后的文案应当保留以下「挑战者审讯体」承重元素：
- 第二人称「你」+ 审讯式对话
- 「……对吧？」「……对吗？」收尾句式
- 省略号（……）、破折号（——）的节奏感
- 二分悖论句式（「不是…而是…」「你要么…要么…」）
- 挑战者人格化语气（「别装了」「承认吧」「别想了」）
- 选项三档结构语义（反驳档 / 中间档 / 承认档）

**F3**（世界观保持）精简后的文案应当保留关键世界观设定词：因子、侵蚀、残骸、魔女化、审判庭、典狱长——这些是沉浸感来源，不可全部替换为通用词。

**F4**（一致性）精简后的题目文案，其 `options.label` 的三档语义方向（反驳/中间/承认）应当与原版一致，对应 `score` 不变。

### 约束需求

**C1**（结构不变）实现者不得修改任何非文案字段：`dim` / `score` / `type` / `renderType` / `value` / `trigger` / weight 编码格式。

**C2**（只 zh-CN）实现者不得修改 `zh-CN.ts` 以外的 locale 文件（en/ja/zh-TW）。

**C3**（题型适配）对于已经很短的题目（scale 天平题的 text 通常 1 行；weight 砝码题的选项是 `weight::a|b|c` 编码），实现者可以跳过或微调——不强求 30%。

### 副作用需求

**SE1**（DB 同步）精简完成后，实现者应当执行 `FORCE_RESEED=1 npx prisma db seed` 使 DB 同步新文案，并验证 `/test` 页面渲染新文案。

**SE2**（死代码处理）实现者应当在 `zh-CN.ts` 的 questions/gate/trigger 节标注「死代码，渲染走 DB」注释，或直接删除以避免未来漂移（详见歧义 A3）。

## 非目标

- 不精简批注（annotations.ts）——已很短很锋利
- 不精简角色描述（PERSONALITY_TYPES 的 desc/keywords）——用户明确选了只动题目
- 不精简 prologue / welcome / result 标签
- 不精简 admin 后台文案
- 不修改 en/ja/zh-TW 的题目文案
- 不改评分算法、题型渲染逻辑、DB schema

## 歧义（每个带推荐，不同意再展开）

**A1：精简对象——只 text，还是 text + options？**
- 读法1：只精简题目主干 text，选项 options 不动
- 读法2：text + options 都精简（选项每条 30-80 字，占题目文案一半字数）
- **推荐：读法2**（选项也是文案体量的大头，且同样有冗余空间；但选项的「反驳/中间/承认」三档结构必须保留）
- 理由：只精简 text 会漏掉一半文案量，达不到 30% 目标

**A2：「30%」是硬指标还是软目标？**
- 读法1：每题都必须砍 30%（硬指标）
- 读法2：总体平均 30%，按每题实际浮动（水分多的多砍，已紧凑的少砍或不砍）
- **推荐：读法2**（天平题 text 只有 1 行无法砍 30%；有些题水分大可砍 40%+）
- 理由：机械均分会伤到本就紧凑的题

**A3：zh-CN.ts 的死代码 questions/gate/trigger 怎么处理？**
- 读法1：保留原样不动（它是死代码，不影响渲染）
- 读法2：加注释标注「死代码，渲染走 DB，精简见 quiz-content.ts」
- 读法3：直接删除 questions/gate/trigger 节，彻底消除漂移源
- **推荐：读法2**（先标注不删，避免动太多；用户想删可在实现后单独清理）
- 理由：删除涉及确认这些键确实没被任何地方 import（i18n 框架可能兜底引用），标注更安全；但如果你想要彻底干净可以选读法3

## 完成判定（what done looks like）

1. ✅ `quiz-content.ts` 中 24 normal + 1 gate + 1 trigger 的 text/options 文案已精简
2. ✅ 文案总字数减少 25%-35%（可量化：精简前后中文字符数对比）
3. ✅ 调性承重元素保留（抽查：每题仍有「你」、关键题保留「……对吧？」、省略号/破折号仍在）
4. ✅ 评分字段（dim/score/type/renderType/value/trigger）零改动
5. ✅ `FORCE_RESEED=1 npx prisma db seed` 成功执行，DB 同步
6. ✅ 现有 e2e 测试（108个）全绿，无回归
7. ✅ en/ja/zh-TW 零改动
8. ✅ `zh-CN.ts` 死代码已按 A3 决策处理
