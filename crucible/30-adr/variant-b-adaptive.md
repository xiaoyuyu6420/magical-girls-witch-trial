# 方案 B — 自适应分支流（variant: adaptive）

> 架构师变体标签：「自适应分支流」。完整设计文档。

## BLUF
把 26 题静态线性流程改为「**12 题探测轮 + 后段自适应排序**」的动态流程。前 12 题固定覆盖全 12 维度（保信度底线），每答完一题实时累积"初步向量"；进入后段（题 13 起）时根据**维度清晰度排序**重排剩余 12 题——清晰维度（极态）的校验题用"确认型"快速过，模糊维度（中态）的校验题前置并保留反向校验深度。**总题数、单题 700ms 时序、加权曼哈顿算法、门控/触发位全部不动**，提速来自"感知密度提升 + 确认型题更轻"。承重决策是「探测轮定序、后段动态重排」的二段式结构；最大单一风险是**动态序列破坏门控/触发位的语义锚点**，缓解手段是门控/触发题用"绝对位锚定"。

最大架构红利：`/api/match` 收到的仍是「完整 answers[] 数组」，算法零改动。动态逻辑只发生在前端内存层。

## 核心抽象（5 个）
1. **PhaseEnum**：`probe | adaptive | gate | trigger`。probe（题1-12）固定、adaptive（题13-24）动态、gate（题25）固定、trigger（题26条件）固定。相位分离让动态只发生在安全的中间区。
2. **DimensionClarity**：`clarity = |rawScore - 中位分| / 最大可能偏移`，[0,1]。>0.66 极态清晰、0.33-0.66 倾向态、<0.33 中态模糊。自适应唯一决策依据，刻意只看单维度不做跨维度推断。
3. **AdaptivePlanner**：纯函数 `(answered, remaining, clarityMap) => orderedRemaining`。无副作用可快照可测试。所有动态逻辑集中此一处。
4. **ConfirmVariant 标记**：题库扩展 `QuestionDef` 增 `confirm?: boolean`。渲染层据此切换样式（第二人称、二选一、更短），不改计分。
5. **RenderQueue**：`displayQuestions` 升级版——带"已锁区/动态区"的有序渲染队列，与 currentIndex 解耦。

## 详细设计

### 自适应分支逻辑
探测轮 = 12 题（最小可覆盖集）。每题答完更新 partialScore。进入第13题前对每个维度算 clarity。后段池（12题）排序规则：clarity<0.5 的维度题升序最前（模糊先深挖）；clarity≥0.66 的维度题降序最后（confirm型轻过）；中间居中。

**不减题承诺**：后段12题一道不删只重排。清晰维度题渲染成 confirm 变体（第二人称短问）秒选；模糊维度题用完整反向校验题深测。总测量覆盖=100%。

**不做跨维度推断**：spec R6 要求每题引发自我审视。跨维度推断会让用户产生"被算计"元认知。只做单维度排序。

### 前端动态序列
`displayQuestions` 从静态 useMemo 改为 RenderQueue：`{ locked: probe[], dynamic: adaptive[], gate, trigger }`。dynamic 区在 phase===adaptive 且为空时调 AdaptivePlanner 一次性算出顺序缓存到 ref。触发题条件 `gateValue==="destroy"||"endure"` 完全保留。

700ms 时序完全兼容：时序由 handleSelect 的 timerRef/fadeTimerRef 控制，动态序列只影响"下一题是哪道"不影响"切题动画多久"。

localStorage 恢复需多存 `adaptiveOrder: number[]`。

### 后端配合：零改动
- `/api/quiz` 不改：仍返回全 26 题，前端自己排序。
- `/api/match` 零改动：processAnswers 按 optionId 查 dim/score，与顺序无关。
- `match.ts` 零改动：加权曼哈顿只看最终向量。

### 第二人称选项改造
选项 label 改「你…」开头或「」引号包裹内心话。题干不变（保IP调性）。示例（B2）：
- 前：`每个人都有自己的立场。在这种地方，生气没用，先解决问题。`
- 后：`「先听完。情绪解决不了问题。」你在心里压下那股翻涌。`

### 直问题混入
插 3 道在 phase 边界：题6（映射B2/B1）、题18（映射F3）、题23（映射S3自评）。迫选 1/3 分。**用 3 道直问替换 3 道低区分度反向题**（等量替换非减题），总数维持 26。直问分 ×0.5 归一化后累加，保持维度总分 2-6 区间，scoreToTier 不动。

### 提速机制
注意力重新分配：模糊维度前置（精力充沛时深挖），清晰维度 confirm 型秒选。后段每题均时 ~3.5s→~2.2s。总时长 ~90s→~78s（-13%）。不靠减题不靠压时序。

### 700ms 时序保护
handleSelect 的 feedbackDelay/totalDelay/fadeTimerRef/timerRef 一字不改。AdaptivePlanner 是纯计算 O(12) <1ms。RenderQueue 更新在 flushPending 之后下一题 render 之前，无新增时序。

## 被否决的替代方案
1. **真·减题自适应**（clarity≥0.66 跳过反向题）：违反 R4 和"不靠减题"，单维度单题信度不足。本方案"重排不删题"是更稳的等价收益。
2. **服务端动态出题**（每题POST后端返回下一题）：700ms内网络往返不可控破坏时序；引入服务端会话状态；题库暴露本就是spec设计。前端纯函数planner规避三点。
3. **跨维度画像推断**（匹配最近角色后段验证角色）：用户强烈感知"被套路"，破坏V2，结果可信度下降。只做单维度排序守住这条线。

## 主要风险（3 个）
1. **动态序列破坏门控/触发位语义锚点**（最高）。门控挪到题25、触发题26（绝对位锚定），adaptive区12题顺序动态。缓解：门控/触发用绝对位；adaptive区保留meta标签作叙事锚点；gate前加过渡旁白。此风险无法完全消除，是固有代价。
2. **用户察觉"顺序针对我"产生抵触**（中）。缓解：只做单维度排序不做跨维度推断；adaptive区维度轮换打散不连续堆同模型；第二人称改造后用户关注"这句话像不像我"而非"为什么是这道题"。
3. **直问与场景题计分混合破坏维度分档**（中低）。缓解：直问分×0.5归一化；上线前校验Top1分布相关性>0.9；退路是直问不计分仅作叙事调剂。

## 实现切片
- S1 第二人称选项改造（仅quiz-content.ts）— 可独立上线
- S2 直问混入（加3删3低区分反向题+归一化）— 依赖S1
- S3 PhaseEnum+RenderQueue重构（probe/gate/trigger固定，adaptive暂用原序）— 可独立
- S4 AdaptivePlanner+DimensionClarity — 依赖S3
- S5 ConfirmVariant渲染 — 依赖S4
- S6 localStorage适配adaptiveOrder — 依赖S4
推荐顺序：S1→S3→S2→S4→S5→S6

需改动：quiz-content.ts、TestScreen.tsx、answer-processor.ts(S2归一化)
需新增：src/lib/adaptive-planner.ts
明确不动：match.ts、api/quiz、api/match
