task: rewrite-all-copy
level: T3
type: build
stage: "等待人审核"
last_completed: "4-audit"
next: "向用户展示审计（PASS），用户质感验收后归档"
updated: 2026-08-10T21:55:00+08:00

fingerprints:
  spec_hash: pending
  seed_hash: pending
  code_mtime: "2026-08-10T18:20:00+08:00"
  staleness_threshold_h: 72

progress:
  total_stages: 8
  completed_stages: 5
  percent: 62
  stage_history:
    - stage: "0-seed"
      started: 2026-08-10T17:05:00+08:00
      finished: 2026-08-10T17:10:00+08:00
      duration_s: 300
    - stage: "1-discover"
      started: 2026-08-10T17:12:00+08:00
      finished: 2026-08-10T17:25:00+08:00
      duration_s: 780
    - stage: "2-confirm"
      started: 2026-08-10T17:25:00+08:00
      finished: 2026-08-10T17:32:00+08:00
      duration_s: 420
    - stage: "3a-arch"
      started: 2026-08-10T17:33:00+08:00
      finished: 2026-08-10T17:48:00+08:00
      duration_s: 900
    - stage: "3b-implement (zh-CN)"
      started: 2026-08-10T17:48:00+08:00
      finished: 2026-08-10T18:20:00+08:00
      duration_s: 1920

budget:
  subagent_calls: 6
  critical_calls: 1
  started_at: 2026-08-10T16:58:00+08:00
  elapsed_h: 1.4
  last_checkpoint_h: 1.4

decisions:
  - id: D1
    at_stage: "0-seed"
    choice: 范围=题库 quiz-content.ts + 四语言 i18n 全删重写
    rationale: 用户确认；UI/pack 展示词/批注不动（很短且调性不同）
    alternatives_rejected: "只删题库层；删全部含 UI 硬编码文案"
  - id: D2
    at_stage: "0-seed"
    choice: 粒度=清空内容保留结构（占位空串）
    rationale: 用户确认；项目持续可 build/测，subagent 只填文本，风险最小
    alternatives_rejected: "真删文件（重写期间 build/seed/测试全挂）"
  - id: D3
    at_stage: "0-seed"
    choice: 自由度=结构锁死，只重写文字
    rationale: 用户确认；26 题/12 维/16 角色/向量/score 编码全不动，算法零风险
    alternatives_rejected: "结构微调；完全自由创作"
  - id: D4
    at_stage: "0-seed"
    choice: 调性=让 discoverer 调研后给建议，用户审完再定
    rationale: 用户确认；不确定现在文案差在哪，先诊断
    alternatives_rejected: "直接保留审讯体；直接换调性"
  - id: D5
    at_stage: "0-seed"
    choice: 旧任务 trim-quiz-copy 归档到 crucible-archive/2026-08-10-trim-quiz-copy/
    rationale: 其产物（精简文案）正是本次删除对象，保留历史
    alternatives_rejected: "继续收尾旧任务（无意义）"
  - id: D6
    at_stage: "2-confirm"
    choice: A1=打磨（方向对写得不入味）→ 保留三态仅拆模板
    rationale: 用户确认；REDESIGN 逼视模式继续有效
    alternatives_rejected: "推倒逼视模式"
  - id: D7
    at_stage: "2-confirm"
    choice: A3=21 角色联动重写（witch-trial 16 + madoka 5）
    rationale: 用户确认；EMMA/MADOKA 撞设需联动解决，跨 IP 是核心卖点
    alternatives_rejected: "只 witch-trial 16 人格"
  - id: D8
    at_stage: "2-confirm"
    choice: A4=zh-CN 定稿再产四语言
    rationale: 用户确认；避免语义分叉和返工
    alternatives_rejected: "四语言并行"
  - id: D9
    at_stage: "2-confirm"
    choice: A5=slogan 一起整体重写（推翻 discoverer 推荐）
    rationale: 用户确认；与 desc 风格统一
    alternatives_rejected: "slogan 保留原文可微调"
  - id: D10
    at_stage: "3b-pre"
    choice: 清空执行=AST 脚本，保留 dim/type/renderType/score/value/trigger/weight/code/name/group/vector/subtitle/special
    rationale: name/subtitle 被跨 IP 引用/API/特殊角色机制依赖；编码绑定算法
    alternatives_rejected: "全字段清空（会破坏角色名与特殊机制）"
  - id: D11
    at_stage: "3b-pre"
    choice: 题库 meta 字段纳入清空（对象形式 5 处 + Q() 形式 21 处）
    rationale: TestScreen.tsx:628 渲染 current.meta（题目标题）→ meta 是用户可见文案
    alternatives_rejected: "meta 视为编码保留"
  - id: D12
    at_stage: "3b-implement"
    choice: 实现降级——implementer 类型被平台订购拦截，改用 general-purpose 执行模块 2
    rationale: implementer×3 + general-purpose×2 空/拦截；general-purpose 成功交付
    alternatives_rejected: "主上下文自写文案（代价高且违背 subagent 意图）"
  - id: D13
    at_stage: "3b-implement"
    choice: 校验工具主上下文实现（scripts/verify-rewrite.ts，G0-G4）
    rationale: subagent 不可用；工具是工程非文案，不违背"文案用 subagent 重写"
    alternatives_rejected: "等平台恢复"
  - id: D14
    at_stage: "3b-implement"
    choice: 死代码区 questions 长度断言=24（门控/触发独立键）
    rationale: zh-CN.ts 死代码区只含 24 常规题；修正了"26"的误判（26 含 gate+trigger）
    alternatives_rejected: "保持 26（误判会让骨架态永远红）"
  - id: D15
    at_stage: "3b-implement"
    choice: G3 词表拆分——magica 禁 witch-trial 专属词，不禁小圆世界观词（魔女/魔法少女/魔女化）
    rationale: madoka 是小圆作品，这些词是其核心设定；品牌名"魔女审判"豁免
    alternatives_rejected: "统一禁全部 IP 词（误伤 madoka 合理语境）"
  - id: D16
    at_stage: "3b-implement"
    choice: HIRO slogan 整体重写（"轮回多少次都行——我只要她回来"）
    rationale: A5 用户确认 slogan 全量重写；REDESIGN 文档引用旧 slogan 需文档侧跟进
    alternatives_rejected: "保留旧 slogan"

notes:
  - 备份已打好：backups/copy-archive-20260810-170441.tar.gz（已防进 .gitignore，不提交）
  - 渲染权威源=quiz-content.ts → DB seed → API；zh-CN.ts questions 节是死代码（已加注释）
  - 硬约束：dim/score/type/renderType/value/trigger/weight 编码必须不变
  - **zh-CN 文案已重写完成**（3 文件）：26 题三态声部分开、21 角色差异化、meta 标签更新；G0/G1/G2/G3词表/G4 全绿
  - **待办：四语言翻译批次**（en/ja/zh-TW）——补 madoka 5 键 + 翻译 UI/types；这是 G3 key 镜像转绿的唯一剩余项
  - 校验工具：scripts/verify-rewrite.ts（snapshot/gates/diff/keys；--phase skeleton|filled）；快照在 crucible/copy-snapshot/logical-fields.json
  - 实施：modules/1 完成（工具），模块 2 完成（zh-CN via general-purpose），模块 3（TestScreen 砝码提示 i18n + export-i18n typeKeys 16→21）待四语言批次时一并对齐
