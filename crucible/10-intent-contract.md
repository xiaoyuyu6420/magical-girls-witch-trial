# 意图契约 — 阶段3a：结果页揭晓时刻

> discoverer 产出，2026-08-07。依据 REDESIGN 第五节 + interface-details skill。

## BLUF
spec 第五节清晰高质量。真正分叉只有 A1（揭晓序列组件归属），其余是实施细节真空。最关键：A1（衔接架构）+ A3（稀有度语义）+ A4（作品字段来源）。

## 核心意图
把传统结果页（百分比/雷达图/top3）重做为"揭晓时刻"——错峰动效把紧张反转为惊喜，稀有度替代相似度，角色档案卡承载情绪，分享卡驱动传播。

## EARS 需求

### 揭晓序列（R1-R5）
- **R1**(Event-driven) 当用户答完最后一题并收到匹配结果，系统播放 6 元素错峰揭晓序列（t=0.0/0.8/1.8/2.4/3.0/3.8/4.2s）。时间轴提取为可调常量 REVEAL_TIMINGS。`[§5.3]`
- **R2**(Ubiquitous) 揭晓期间任意点击/按键立即跳到档案卡完整可用状态。`[§5.3 + M-11]`
- **R3**(Ubiquitous) 用 motion-7（cross-fade through blur）实现答题页→结果页、角色名浮现，不得硬切。`[§5.6 + M-7]`
- **R4**(Ubiquitous) ease-out-expo 曲线 cubic-bezier(0.16,1,0.3,1) 贯穿揭晓全程。`[§5.6 决策门#4]`
- **R5**(State-driven) 若 prefers-reduced-motion:reduce，跳过所有揭晓动画直接呈现完整档案卡。`[§5.6 决策门#3]`

### 角色档案卡（R6-R10）
- **R6**(Ubiquitous) 档案卡含 7 元素：角色名(中文+英文subtitle)、标语、「来自《魔女审判》」、一句话作品介绍、第二人称描述、灵魂特质(关键词)、稀有度条。`[§5.4]`
- **R7**(Ubiquitous) 「一句话作品介绍」字段当前不存在，需新增。`[§5.4/§5.5]` `[需澄清 A4]`
- **R8**(Ubiquitous) 复用现有 MatchResult.desc（第二人称描述）与 keywords（灵魂特质）。`[现状]`
- **R9**(State-driven) 档案卡若超出单屏则可滚动并应用 motion-6（bleed blurred edges）；一屏放下则不触发。`[§5.6 + M-6]`
- **R10**(Ubiquitous) 呈现「分享我的审判」「重新审判」两个按钮。`[§5.4]`

### 稀有度（R11）
- **R11**(Ubiquitous) 稀有度替代相似度：进度条 + 「全球仅 X%」文案，越小越稀有，填充越少。`[§5.2/§5.4]` `[需澄清 A3 填充映射]`

### 砍除项（R12-R13）
- **R12**(Ubiquitous) 主视图移除 similarity%、DimensionBar、RadarChart、top3 排行。`[§5.2]` `[需澄清 A2 彻底/保留入口]`
- **R13**(Ubiquitous) 分享卡移除 similarity%/RESONANCE，仅保留稀有度数字。`[§5.7]`

### 分享卡（R14-R15）
- **R14**(Ubiquitous) 分享卡含：钩子文案「我接受了灵魂审判」、角色名、标语、「来自《魔女审判》」、稀有度数字、行动召唤。`[§5.7]`
- **R15**(Ubiquitous) 分享卡用角色主题色渐变背景（阶段3a 用现有深色主题，主题色差异为后续打磨）。`[§5.7]`

### 隐藏角色（R16）
- **R16**(State-driven) 若 MatchResult.special===true，做轻量文案区分（特殊文案+「极少判定」），不做完整粒子裂缝光效。`[§5.6 + 待定]` `[需澄清 A5]`

### 动效（R17-R18）
- **R17**(Ubiquitous) 必须动效：motion-7/18/11/6 + ease-out-expo + reduced-motion降级。`[§5.6]`
- **R18**(Optional) 可选动效 motion-3(标语逐字)/motion-22(稀有度光呼吸)；阶段3a 不做，用标准淡入替代。`[§5.6]`

### 保留与git（R19-R20）
- **R19**(Ubiquitous) 保留 match.ts(MatchResult含similarity/top3为锁死区不动)、分享功能、重新审判。UI不显示similarity/top3但字段保留。`[§5.2]`
- **R20**(Event-driven) 完成有意义改动单元后 git commit。`[用户要求]`

## 非目标
- N1 不填充跨IP作品介绍内容（仅魔女审判单一IP）。
- N2 不做多语言（仅zh-CN）。
- N3 不做A/B测试。
- N4 不做不同IP视觉风格差异（统一风格）。
- N5 不实现隐藏角色完整粒子裂缝光效。
- N6 不改 match.ts 算法与 MatchResult 结构。

## 验收锚点
1. V1 揭晓序列：t=0.8「审判结束了」/t=2.4角色名浮现/t=4.2档案卡可交互。
2. V2 跳过：t=2.0点击→立即t=4.2状态。
3. V3 reduced-motion：直接显示档案卡不播动画。
4. V4 砍除：主视图无similarity%/雷达图/维度条/top3。
5. V5 分享卡：含钩子+角色+标语+稀有度+行动召唤，无similarity%。
6. V6 稀有度兜底：stats为null时优雅降级不崩溃。

## 假设
- H1 时间轴=可调常量 REVEAL_TIMINGS。
- H2 复用 desc/keywords 字段。
- H3 钩子文案 i18n key result.shareHook。
- H4 分享卡现有深色主题。
- H5 不做 motion-3/22。
- H6 隐藏角色轻量文案区分。
- H7 match.ts 锁死，similarity 供内部 trackEvent。

## 歧义（需用户拍板）

### A1 揭晓序列组件归属 ⭐最高风险
- 读法1(内联)：ResultScreen 内部 phase，挂载即播放。改动小，状态闭环。
- 读法2(独立组件)：新建 RevealSequence 插 TestScreen/ResultScreen 间，page 加 revealPhase 状态机。职责分离但改动大。
- 推荐：读法1（内联）——spec 定义揭晓为"结果页第一秒"，result 数据就近可用。

### A2 砍除彻底程度
- 读法1(彻底删除)：删 r-stats/top3/详情按钮/弹窗(RadarChart+DimensionBar)。
- 读法2(隐藏保留入口)：主视图砍但保留"详细分析"弹窗入口。
- 推荐：读法1（彻底删除）——spec"砍掉所有"明确；保留弹窗制造判决书vs揭晓时刻认知矛盾。

### A3 稀有度数字语义+填充映射
- 数字=stats.typePercentage（直接，越小越稀有）。
- 填充映射待定：spec ASCII `▓▓░░░░░░░░`(2满8空)倾向"越稀有填充越少"。
- stats为null兜底待定。

### A4 作品介绍字段来源
- 读法1(共用一句)：15角色共用一句魔女审判介绍，存 pack.meta.workIntro。改动小，跨IP阶段再扩每角色字段。
- 读法2(每角色一句)：PersonalityTypeInput 加 workIntro 字段，15句+DB列+admin改造。
- 推荐：读法1（共用一句 + pack.meta.workIntro）——单一IP符合spec"为跨IP预留"语义，不侵入MatchResult锁死区。

---

## 歧义决策（用户已拍板 2026-08-07）

- **A1 = ResultScreen 内联 phase**：揭晓序列作为 ResultScreen 内部阶段，挂载即播放，播完揭晓层消失露出档案卡。状态单组件闭环。
- **A2 = 彻底删除**：删除 r-stats(百分比+top3)、详情按钮、整个 showDetail 弹窗(含 RadarChart/DimensionBar 引用)。RadarChart.tsx/DimensionBar.tsx 文件保留但不被 ResultScreen 引用（未来可能他用）。
- **A3 = 直接=typePercentage，越稀有越空**：数字=stats.typePercentage，填充条填充比例 = min(typePercentage, 100) / 100 但映射到"越稀有越空"——即填充 = typePercentage%（3.4%→约0.3格满）。实际：用 typePercentage 直接作填充百分比但语义反转显示（"全球仅3.4%"配几乎空的条）。stats为null→显示"全球数据收集中"+空条禁用。
- **A4 = 共用一句 + pack.meta.workIntro**：pack 配置加 meta.workIntro 字段（"一部关于'在死亡回溯中守住一个人'的故事"），所有15角色共用。不侵入 MatchResult/PersonalityTypeInput。
- **A5 = 轻量文案区分**：隐藏角色(special=true)揭晓时多一行"……审判庭从未见过这样的受审者"，稀有度文案"极少判定"，不做粒子裂缝光效。
- **A6 = 可调常量 REVEAL_TIMINGS**。
- **A7 = 一屏放下优先，motion-6 条件触发**（溢出时才应用边缘模糊）。
