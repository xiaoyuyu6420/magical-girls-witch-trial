# prior_attempt: "前两次返回空。请务必输出完整报告。" 你是实现工程师。项目：/Users/muni...

- 会话 ID: `sess_subagent_agent_35026d36-3790-4a1c-a69e-d5f0ed0cdf95`
- 时间: 2026-08-10 10:46:29 → 2026-08-10 10:46:29
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 3
- 归档状态: 未归档

---

## 👤 用户
prior_attempt: "前两次返回空。请务必输出完整报告。"

你是实现工程师。项目：/Users/munich/Desktop/独立项目/magical-girls（Next.js + TypeScript + Prisma）。

## 任务：校验工具集

产出 `scripts/verify-rewrite.ts`（TypeScript，tsx 运行），实现文案重写任务的自动校验（G0-G4）。纯工程模块，不写文案。

## 必读
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/30-adr/final.md`（G0-G4 定义）
- 备份：`/Users/munich/Desktop/独立项目/magical-girls/backups/copy-archive-20260810-170441.tar.gz`
- 当前清空骨架：`src/data/quiz-content.ts`、`src/content/packs/madoka/config.ts`、`src/i18n/{zh-CN,en,ja,zh-TW}.ts`

## 接口契约
`pnpm exec tsx scripts/verify-rewrite.ts <sub>`，EXIT 0/1 + 行号报告：
1. **snapshot**：从 tar.gz 提取逻辑字段快照 → `crucible/copy-snapshot/logical-fields.json`（26 题 dim/type/renderType/score/value/trigger/weight/顺序/砝码 label 编码；21 角色 code/name/group/vector/subtitle/special/keywords 存在性；四语言 key 集合 + hash）
2. **gates**：G0 结构指纹（vs 快照 diff 空；门控18/触发19/天平8·22/砝码14 位置；weight label 匹配 `/^weight::[012]\|[012]\|[012]$/`；死代码区长度==26 且值空；i18n types name/subtitle 与快照一致）；G1 模板（"我从不假装"==0；"你说得对"开头≤3；相邻题共享开头==0）；G2 句法长度（题干含"你"；题干≤120/选项≤40；21 角色 desc 首句+slogan 两两不同，合并两文件）；G3 词表 key 镜像（四语言 key 集合全等含 types 21 键；否决词四语言 0 命中；IP 词 i18n==0/题库区==0/madoka==0）；G4 语义指针（门控 value 集合=={destroy,seen,peace,undecided} label 非空；触发恰好 1 个 SPECIAL_A label 非空；砝码 7 label 与快照一致）
3. **diff**：当前 vs 快照完整逻辑字段差异
4. **keys**：四语言 key 镜像 diff

## 要求
- TypeScript compiler API（node_modules/typescript）AST 解析，不 import 运行时对象
- tar 解压用 child_process execFileSync("tar")
- 无新增依赖；自检：题数==26、角色==21，不符 EXIT 1
- 输出 `[G0] FAIL: 第 7 题 score 不同: 3 → 2 (quiz-content.ts:145)` 格式
- 空文案时 G1/G2/G3 内容断言自动跳过空串；用 --phase skeleton（只 G0）/--phase filled（全部）区分

## 局部检查
1. snapshot 生成快照（空骨架下逻辑字段应与备份一致）
2. gates 跑通（G0 绿）
3. npx tsc --noEmit 通过
4. 报告：BLUF + 触及文件 + 交付接口 + 检查结果摘要

## 禁区
禁改 src/**、prisma/、pack config、组件。只写 scripts/verify-rewrite.ts + crucible/copy-snapshot/*.json。

输出完整不截断。
