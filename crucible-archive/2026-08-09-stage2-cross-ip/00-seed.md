# 00-seed — 跨IP扩展（阶段2：小圆接入 + 全局匹配）

## 目标

按 `docs/REDESIGN.md` 第四节实现跨IP扩展阶段2。用户已定前置：
- **IP 合规**：同人二创 + 全站声明非官方（Fan-made）
- **匹配范围**：全局匹配（用户向量 vs 所有IP所有角色取最近）

阶段2 范围（REDESIGN 第四节 + 第八节阶段2）：
1. **pack 多IP架构**：现有"单 active pack"扩展为"角色层多IP"。引擎层（26题/12维度/加权曼哈顿/门控触发）保持统一，不按IP分。角色（PersonalityType）加 IP 归属字段。
2. **小圆角色标定 + 接入**（第一个跨IP，REDESIGN 优先级最高）：鹿目圆、晓美焰、美树沙耶香、佐仓杏子、巴麻美（+剧场版渚）。每个角色按通用12维度人工标定向量，形成跨IP可比向量。
3. **跨IP全局匹配**：match 时用户向量 vs 所有IP所有角色（魔女审判15 + 小圆N）取最近。
4. **结果页跨IP呈现**：角色档案卡"来自《XX》"+ 一句话作品介绍（每IP各一句）。workIntro 从 pack 级扩展为 per-IP。
5. **合规声明**：全站加"非官方/同人二创"声明。

**明确不在阶段2 范围**（归后续）：
- 毁灭者/憧憬/伊莉雅接入（REDESIGN 列了4个IP，小圆第一个，其余按序）。
- 多语言（en/ja/zh-TW）——阶段3b。
- A/B 实验——阶段3c。
- 不同IP视觉风格差异——REDESIGN 待定，第一版统一风格。

每个有意义的版本都要 git commit。

## Spec 来源

`docs/REDESIGN.md` 第四节（角色层：跨IP角色库）+ 第八节阶段2。sha256 前12位: `4d7f3b816843`。

## 前置决策（用户已拍板 2026-08-08）
- IP 合规：同人二创 + 声明非官方。
- 跨IP匹配范围：全局匹配。

## 项目上下文（阶段1+3a+验证后现状）

- Next.js 16 + React 19 + TS + Prisma + Vitest + Playwright（107 e2e 全绿）。
- **pack 加载**（`src/pack/load.ts`）：`PACKS` 字典注册 pack，`getActivePack()` 返回单个。跨IP需重新审视——引擎配置（维度/权重/算法/门控触发规则）应统一（一个"引擎pack"），角色内容按IP分组。
- **角色模型**（`prisma/schema.prisma` PersonalityType）：code/name/subtitle/group/vector/slogan/desc/keywords/special/translations。**无 IP 归属字段**——跨IP需加（如 `packId`/`ip`）。
- **匹配**（`src/lib/match.ts`）：用 pack 的 dimensions/weights/algo/rules（引擎层，IP无关），types 从 DB findMany（跨IP需取所有IP角色）。
- **match API**（`src/app/api/match/route.ts` L52）：`db.personalityType.findMany()` 已取全部角色——但当前只有魔女审判15个。加小圆后自动全局比，**算法层零改动**。
- **quiz API**（`src/app/api/quiz/route.ts`）：按 active pack 取题目。26题灵魂拷问是统一的，不按IP分。
- **ResultScreen**（`src/components/ResultScreen.tsx`）：`pack.workIntro`（单一作品介绍）+ `pack.title`（来自《XX》）。跨IP需 per-角色 的作品归属。
- **DB seed**（`prisma/seed.ts`）：从 `quiz-content.ts` PERSONALITY_TYPES 读。小圆角色需新数据源。
- **现有 15 角色**：魔女审判（HIRO/EMMA/YUKI 等），vector 用通用12维度，数值已定。
- **现有 26 题**：审判官灵魂拷问（阶段1 改写），统一不按IP分。
- **现有维度**：12通用心理维度（S1..W3，阶段1 改名），IP无关。

## 项目类型

已有项目（架构扩展 + 内容接入）。
