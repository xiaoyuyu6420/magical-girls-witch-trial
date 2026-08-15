# 00-seed — 全案文案重写

## 目标

把当前全部文案（题库 26 题 + 13 角色 + 四语言 i18n）**备份打包 → 清空内容（保留结构）→ 用 subagent 重写**。先通过 discoverer 调研搞清楚项目目标与调性诊断，用户确认后再动手。

## 用户决策（2026-08-10 AskUserQuestion 确认）

1. **范围**：题库 `src/data/quiz-content.ts`（26 题 + 13 角色）+ 四语言 i18n `src/i18n/{zh-CN,en,ja,zh-TW}.ts` 全删重写。UI 组件硬编码文案、pack 展示词、批注/标签不动。
2. **粒度**：清空文案内容、保留结构——类型定义/维度/向量/编码骨架（占位空串）保留，项目持续可 build。subagent 只填文本。
3. **自由度**：结构锁死——26 题 / 12 维 / 16 角色 / 向量 / score 编码全不动，只重写文字。
4. **调性**：让 discoverer 结合项目目标/用户画像/竞品调研后给出调性诊断与建议，用户审完再定。

## Spec 来源

- 项目根 `spec.md`（产品规格：维度体系/算法/UI/文案结构要求）
- `docs/REDESIGN.md`（跨 IP 演进设计）
- 现有文案源：`src/data/quiz-content.ts`、`src/i18n/*.ts`、`src/content/packs/*/config.ts`
- 备份：`backups/copy-archive-20260810-170441.tar.gz`（含以上全部 + xlsx + spec）

## 项目类型

已有项目（文案重写，非新建）。跨 IP 平台：witch-trial（13 角色）+ madoka（5 角色），题库共用。

## 路由结果

- **level: T3**（多模块——题库 + 四语言 i18n，高风险重写，方向需调性调研）
- **type: build**（内容创作类重写；结构/编码锁死，算法零改动）
