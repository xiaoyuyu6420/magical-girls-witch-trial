# 00-seed — 结果页揭晓时刻（阶段3a）

## 目标

按 `docs/REDESIGN.md` 第五节重做结果页，从"传统结果页（百分比/雷达图/维度条/top3）"升级为"揭晓时刻（错峰动效浮现 + 角色档案卡 + 稀有度 + 分享卡）"。

阶段3a 范围（REDESIGN 第五节，已定稿）：
1. **揭晓序列**（结果页第一秒，最关键）：答完最后一题 → 6 元素按情绪顺序错峰出场（motion-18 stagger reveals）。t=0.0s 答题页模糊淡出(motion-7) → 0.8s「审判结束了。」→ 1.8s「而你是——」→ 2.4s 角色名从模糊浮现(ease-out-expo) → 3.0s 标语 → 3.8s 来自《XX》→ 4.2s 档案卡完整可用。全程任意点击/按键跳过(motion-11)。
2. **角色档案卡**（揭晓后主体）：角色名 + 标语 + 来自《作品》+ 一句话作品介绍 + 第二人称角色描述 + 灵魂特质 + 稀有度条。**砍掉所有百分比/维度条/雷达图/top3 排行**。
3. **稀有度替代相似度**：显示"全球仅 X%"（基于真实统计 typePercentage），不显示"相似度 Y%"。稀有度条（▓▓░░░░）作为游戏化传播点。
4. **分享卡重做**：钩子文案"我接受了灵魂审判" + 角色名 + 标语 + 来自《作品》+ 稀有度 + 行动召唤。**无相似度百分比**。
5. **隐藏角色彩蛋**（可选，先做普通版）：匹配 YUKI/ETL 时揭晓动画升级（裂缝光效 + 粒子碎裂 + "审判庭从未见过这样的受审者" + "极少判定·<0.5%"）。

**明确不在阶段3a 范围**（归后续）：
- 跨 IP 作品介绍（"来自《魔法少女小圆》"）—— 阶段1 仍是单一 IP（魔女审判），作品介绍字段为该 IP 预设一句，但跨 IP 匹配归阶段2。阶段3a 只为现有 15 角色加"一句话作品介绍"（都是魔女审判，统一一句）。
- 多语言（en/ja/zh-TW）翻译 —— 阶段3b。阶段3a 仅 zh-CN。
- A/B 实验设施 —— 阶段3c。
- 不同 IP 视觉风格差异 —— REDESIGN 待定项，第一版统一风格。

每个有意义的版本都要 git commit（用户要求）。

## Spec 来源

`docs/REDESIGN.md` 第五节（sha256 前12位: `4d7f3b816843`，与阶段1 同一份文档）。
动效规则清单：REDESIGN 第五节"动效规则清单"表格 + `~/.zcode/skills/interface-details/`（motion-3/6/7/11/18/22, easter-egg-3, 决策门#3/#4）。

## 项目上下文（阶段1 后的现状）

- Next.js 16.2.4 + React 19 + TS。阶段1 已完成（题目/维度/批注/变奏）。
- `src/components/ResultScreen.tsx`（288行）—— **主战场**。当前结构：r-left（archetype/name/stats百分比/top3/slogan/稀有度块/操作按钮）+ r-right（desc/keywords/详情按钮）+ 详情弹窗（RadarChart + DimensionBar + 向量）+ 分享卡。
- `src/components/RadarChart.tsx` + `src/components/DimensionBar.tsx` —— 阶段3a 后**不再展示**（砍掉），但文件可保留（详情弹窗可能隐藏入口，或完全移除）。
- `src/app/test/page.tsx` —— 调用 ResultScreen 的地方，需衔接揭晓序列的触发。
- `src/lib/match.ts` MatchResult —— 含 similarity/top3/userVector/templateVector/borderType/special 字段。阶段3a 不再显示 similarity/top3，但 match 算法不动（锁死区）。
- `src/i18n/zh-CN.ts` result 字段（archetype/hidden/border/share/copyLink/rebirth/analysis/dimAnalysis/you/ideal/statsInfo/statsShort/factorResonance/factorResonanceLabel/shareText）—— 需新增揭晓序列文案 + 稀有度文案 + 作品介绍。
- 现有 stats：`{ totalParticipants, typePercentage, typeCount }` —— 稀有度用 typePercentage。
- CSS：`src/app/globals.css` 含 .revealed / #view-result / .result-layout 等结果页样式。

## 关键约束

- **R12（阶段1 契约继承）**：保留 700ms 单题时序、cubic-bezier(0.16,1,0.3,1) 曲线、服务端匹配、防篡改、feature flag。
- **锁死区**：match.ts 算法、answer-processor、WEIGHTS、ALGO_CONFIG、15 角色 vector、维度 code 不动。
- **动效必须项**（REDESIGN 动效清单）：motion-7（模糊淡出）、motion-18（错峰浮现）、ease-out-expo 曲线、motion-11（可打断/点击跳过）、motion-6（滚动边缘模糊）、决策门#3（prefers-reduced-motion 降级）。
- **动效可选项**：motion-3（标语逐字描出）、motion-22（稀有度环境光呼吸）、easter-egg-3（隐藏角色粒子，先做普通版）。

## 项目类型

已有项目（结果页重构）。
