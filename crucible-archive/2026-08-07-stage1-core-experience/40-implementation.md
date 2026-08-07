# 实现日志 — 阶段1：核心体验

> 2026-08-07。L4 实现，6 个语义化 commit（C1-C6）。

## 模块切分

按 ADR，因 quiz-content.ts / zh-CN.ts 是强冲突文件且内容创作需一致性，未并行实现者，改为按 commit 顺序串行。两个 implementer 分别承担：22道普通题文案改写（C2子任务）、TestScreen渲染（C5）。其余由编排者在主上下文完成。

## 各 commit 交付物

### C1 维度改名（refactor）
- `src/content/packs/witch-trial/config.ts`：12维度 name/modelName/dir 按 REDESIGN §3 改通用名。modelName: 审判→评判、侵蚀→执念、觉醒→自持、羁绊不变。
- `src/i18n/zh-CN.ts`：dims/dimGroups 同步。
- code/WEIGHTS/ALGO_CONFIG/vector 不动。45测试绿。

### C2 26题改写 + 门控value重命名（refactor）
- 22道普通题：第三人称叙事 → 审判官断言式逼问；选项 → 承认/否认/狡辩三态。meta 改通用组名。
- 门控题：改写为"毁灭/被看见/平静"最终逼问（REDESIGN §2 样例）。
- 触发题：改写为审判官点亮越界念头（A6，保留 SPECIAL_A 逻辑）。
- 门控value语义重命名（A5）：endure→seen / normal→peace / normal_alt→undecided。同步 7 处下游（pack rules、schemas、TestScreen、quiz-content、2个测试、smoke-check、e2e注释）。
- 第8/14/22题文案暂保留（C4替换）。zh-CN questions/gate/trigger 同步。45测试绿 + smoke OK。

### C3 批注模块（feat）
- 新增 `src/lib/annotations.ts`：pickAnnotation(node, dimScores, pack, rng) 纯函数。
- 信号：主导维度（sum最高）→ scoreToTier → H/M/L。
- 文案池：3节点 × 3档位 × 2变体，语气递进试探→逼近→审判。R9合规（无维度/角色/百分比，单测验证）。
- 13新测试。58测试绿。

### C4 变奏题数据 + renderType列（feat）
- 第8/22题→天平（scale,2option,W2，左=1右=3）。
- 第14题→砝码（weight,7option,F1，label编码 weight::a|b|c，score=主槽值+1）。
- prisma schema：Question 加 renderType String @default("normal")，SQLite免迁移。
- QuestionDef 加可选 renderType 字段（type联合不扩展）。
- seed.ts 同步 renderType。DB验证：26题落库，分布 23normal+2scale+1weight，option数 2/7/2 正确。58测试绿。

### C5 TestScreen渲染（feat）
- TestScreen（293→640行）：renderType switch 分发。scale左右对峙，weight三槽+/- UI。
- 批注插页：独立 interjection state（不改 currentIndex，B3 localStorage安全），命中 answers.length=5/10/15 触发。
- 新增 `/api/annotation` POST：服务端从 DB 读 score → processAnswers 算真实 dimScores → pickAnnotation（A4动态，防篡改）。确定性 rng（answerHash种子）。
- /api/quiz 透传 renderType；optionShuffle 排除 scale/weight（label携带语义）。
- test/page.tsx 映射加 renderType。键盘适配。R12时序/曲线/推开保留。58测试绿。

### C6 端到端验证
- F1/W2/F2/B2 总分分布验算（ADR B2）：全部 ✓ 未撞穿6上限。
- 每维度恰好2题，变奏题替换未减少维度覆盖。
- 砝码7option score∈[1,3]（实际{2,3}）满足断言。天平2option score={1,3}。

## 偏离 ADR 的地方

1. **第22题天平 scores 方向**：ADR D3 说"第22题反向（左=3、右=1）"，但实际原第22题 scores 是默认[1,2,3]（正向），不是反向。按实际 scores 方向实现（左=低W2=1、右=高W2=3），与第8题同向。记录此偏离，避免"反向"标签误导。

2. **F1 最低档可达性变化**：砝码题 score 最小=2（主槽+1偏移），导致 F1 总分最小从 2 升到 3，L 档（≤2）在 F1 不再可达。这是 Q1 裁决"主槽值+1"的已知代价（满足[1,3]断言的必要偏移）。影响轻微：F1=L 的角色（如 EMMA）用户无法纯L匹配，但 EMMA 是 B 组主导、F1=L 本就不是 EMMA 的判定关键。接受此权衡。

## 降级行为（ADR B4）

renderType 已部署但前端回退旧版时，砝码/天平题在 DB 仍是 normal 类型 + 多 option：
- 天平题（2 option）：旧客户端渲染为 2 选项 normal 题，用户能选，结果有效。
- 砝码题（7 option，label是 weight::编码）：旧客户端渲染为 7 个长选项的怪题，用户随便选一个仍能完成测试（option.score 仍累加，结果有效，体验错乱）。
- 批注插页：旧客户端无 interjection 逻辑，不显示批注（降级为无批注，不影响测试流程）。
- **裁定**：降级行为可接受，回退期间用户能完成测试，feature flag 翻回后正常。

## code_mtime 基线（纪律 C）

`src/` 最新 mtime: `2026-08-07T11:47:34`（zh-CN.ts，C5 zh-CN同步时）。
