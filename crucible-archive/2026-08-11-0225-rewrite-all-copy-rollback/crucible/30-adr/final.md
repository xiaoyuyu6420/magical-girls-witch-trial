# 30-adr — 最终融合 ADR（方案 A 最小化 × 方案 C 流程化）

> arbitrator: agent_fceaf631 产出，编排者补充开放问题裁决。2026-08-10。

## BLUF

**A 的内容域顺序 + C 的域内批次自修**作为流程；**C 的 GateSuite 分门别类 + A 的轻量执行**作为校验；死代码区保留空骨架+标注（export-i18n.ts 依赖已核实）；madoka 5 键四语言新增（非 zh-CN 渲染回退中文是真实缺陷）；砝码 label 冻结。共同盲点 5 个已修正，最重：madoka 源文件 `src/content/packs/madoka/config.ts` 必须在重写清单显式双文件。

## 逐决策

### D-A 死代码区：保留空骨架 + 显著标注（采纳 A）
- export-i18n.ts:220/238 确实以 `zh-CN.questions.length` 为 Sheet4 行数基准，删除会崩工具链
- C 的"防再填"用 G0 只读断言替代：死代码区数组长度==26、值恒为空串
- 契约判定 8 明示"清理**或**标注"两者合规——选标注分支（保留空骨架）

### D-B 校验体系：融合（G0-G4 自动硬闸 + G5 降级人工）
- **G0 结构指纹**：TS compiler API 白名单键（dim/type/renderType/score/value/trigger/weight/vector/code/group/subtitle/special）与备份 diff 为空；26 题顺序/门控18/触发19/天平8·22/砝码14 位置不变；weight 题 label 全匹配 `/^weight::[012]\|[012]\|[012]$/`；死代码区只读断言
- **G1 模板统计**："我从不假装X"==0；"你说得对"开头 ≤3；相邻题共享句式扫描
- **G2 句法与长度**：26 题干第一人称逼问句法；题干 ≤120 字/选项 ≤40 字硬闸；21 角色 desc/slogan 开头句式去重 + 核心比喻词表两两互斥（两文件合并后全对）
- **G3 词表与 key 镜像**：四语言 key 集合 diff（含 madoka 新增键）；IP 专属词仅限 pack 内部；REDESIGN 否决词（因子倾向/因子共鸣度/相似度类）四语言 0 命中
- **G4 语义指针**：门控 4 value + 触发 trigger 指向断言 + 两条特殊路径实际走通
- **G5 质感软闸**：不阻塞 CI，转 orchestration 域级签字人工抽查 + 最终用户质感验收

### D-C madoka 5 键：采纳（渲染正确性缺陷）
- seed-translations.ts 只从 en/ja/zh-TW 落库，查表动态键 → 无键则 DB 无记录 → 非 zh-CN 回退中文
- 四语言 types 各加 5 键（zh-CN 也要——判定 7 key 集合一致）；name/subtitle 复制自 packs/madoka/config.ts；slogan/desc/keywords 为重写目标
- seed-translations.ts 零改动（动态查表已核实）

### D-D 砝码 label 冻结：确认（共识）
- 冻结对象 = `renderType==="weight"` 题 7 个编码 label（weight::a|b|c，被 TestScreen.tsx:32/34/276 + api/quiz/route.ts 硬依赖）
- 天平题/门控题 4 选项/触发题 2 选项的 label 是文案属重写范围，但其 score/value/trigger 字段冻结

### D-E 流程组织：A 域顺序 + C 域内批次
- 顺序：题库(26 题) → 角色(21) → zh-CN UI → 四语言（符合 A4 zh-CN 定稿再翻译）
- 批次：题库 4 批（~7 题/批）、角色 2 批（witch-trial 16 拆 2 + madoka 5 一）、zh-CN UI 一批、四语言一批
- 批内 implementer 自跑 G0-G3 自修 ≤3 轮；orchestrator 域级签字 4 次；最终全量 G0-G4 + 人审

### D-F 备份：tar.gz 管整体回滚 + CopySnapshot JSON 管单域回滚

## 共同盲点（已修正）

1. **madoka 源文件不在任何方案清单**（quiz-content.ts 对 madoka 零引用）→ 重写清单显式双文件：quiz-content.ts 16 角色 + packs/madoka/config.ts 5 角色
2. **门控/触发题 label 是重写对象，value/trigger 是语义锚点** → G0 断言 value/trigger diff 为空 + 批注"label 待写"
3. **i18n types 的 name/subtitle 处理未定义** → 保留现值不动，加 G0 白名单键；madoka 新键 name/subtitle 复制自 config.ts
4. **TestScreen.tsx:630 硬编码中文"用 +/- 调整砝码"** → 标记为范围争议（开放问题 1）
5. **R3"语义倾向不变"不可纯自动验证** → 三态锚点表（每题选项按否认/中间/承认分组，组内顺序与 score 映射不变）+ 人审语义抽查

## 开放问题裁决（编排者，2026-08-10）

- **Q1 TestScreen.tsx:630 砝码提示串**：裁决 = 纳入本轮附带修复（把硬编码中文"用 +/- 调整砝码"改为走 i18n key）——它是 R1 违规（UI 文案应在 i18n），且权重题提示对四语言用户是可见缺陷。属低风险改动（组件单行 + i18n 4 key）。实现者需遵守"禁改区域"边界外另行批准。
- **Q2 export-i18n.ts typeKeys 扩展**：裁决 = 扩展 5 键（硬编码 16 键 → 21 键）——Excel 导出是翻译审阅工作流一环，madoka 缺键会漏审。契约外改动但低风险（脚本常量扩展，不动数据）。
- **Q3 R3 语义验证**：裁决 = 三态锚点表（选项 a）——最省且人审语义兜底；不用寄存器代理（机制不明）。
- **Q4 字数限制**：裁决 = 硬闸（题干 ≤120/选项 ≤40，契约假设值确认采纳），超限即红。
- **Q5 质感验收**：裁决 = 域级签字 orchestrator 抽查 + 全部完成后用户级质感验收（检查点②展示时用户亲自审调性）。

## 完成判定对照

| # | 判定 | 覆盖 |
|---|---|---|
| 1 | 备份可恢复 | tar.gz + CopySnapshot |
| 2 | 逻辑字段 diff 空 | G0 |
| 3 | 结构不变 | G0 |
| 4 | 模板统计 | G1 |
| 5 | 21 角色两两区分 | G2（两文件合并） |
| 6 | 逼问句法 | G2 |
| 7 | 四语言 key 一致 | G3（含 madoka 5 键） |
| 8 | 跨 IP 词约束/死代码 | G3 + 保留标注 + G0 只读断言 |
| 9 | 门控/触发语义 + 特殊路径 | G4 |
| 10 | 字数 | G2 硬闸 |

## 实现分工（3b 模块切分）

- **模块 1（工程·校验工具）**：`scripts/verify-rewrite.ts`（G0-G4 四子命令 + CopySnapshot 生成）+ `crucible/copy-snapshot/*.json`。拥有：scripts/verify-rewrite.ts、crucible/copy-snapshot/。禁改：src/**。
- **模块 2（文案·zh-CN 全量）**：`src/data/quiz-content.ts`（26 题 + 16 角色）+ `src/content/packs/madoka/config.ts`（5 角色）+ `src/i18n/zh-CN.ts`（UI 文案 + types 16 键填值 + types 新增 5 madoka 键）。拥有：以上 3 文件。禁改：逻辑字段、en/ja/zh-TW、pack config 引擎、组件、scripts。
- **模块 3（附带修复）**：`src/components/TestScreen.tsx:630` 硬编码中文改 i18n key + `scripts/export-i18n.ts` typeKeys 16→21。拥有：2 处定点。禁改：其余。

模块 1 与模块 2 并行（无接缝）；模块 3 与 2 并行但需 i18n key 定义先行（zh-CN.ts 的 key 由模块 2 写，冲突风险 → 模块 3 在模块 2 交付后执行，或 key 名预定义）。
