task: trim-quiz-copy
level: T2
type: refactor
stage: "3b-implement-done"
last_completed: "3b-implement"
next: "用户确认文案去 IP 化效果后，可进入 3c 红蓝 / 4-audit 收尾"
updated: 2026-08-10T15:55:00+08:00

fingerprints:
  spec_hash: pending
  seed_hash: pending
  code_mtime: "2026-08-10T15:55:00+08:00"
  staleness_threshold_h: 72

progress:
  total_stages: 8
  completed_stages: 4
  percent: 50
  stage_history:
    - stage: "0-seed"
      started: 2026-08-10T01:50:00+08:00
      finished: 2026-08-10T01:55:00+08:00
      duration_s: 300
    - stage: "1-discover"
      started: 2026-08-10T01:55:00+08:00
      finished: 2026-08-10T02:00:00+08:00
      duration_s: 300
    - stage: "2-confirm"
      started: 2026-08-10T02:00:00+08:00
      finished: 2026-08-10T02:30:00+08:00
      duration_s: 1800
    - stage: "3b-implement"
      started: 2026-08-10T02:30:00+08:00
      finished: 2026-08-10T15:55:00+08:00
      duration_s: 48300

budget:
  subagent_calls: 2
  critical_calls: 0
  started_at: 2026-08-10T01:45:00+08:00
  elapsed_h: 14.2
  last_checkpoint_h: 13.4

decisions:
  - id: D1
    at_stage: "-1-align"
    choice: 范围=只精简题目（questions/gate/trigger），不动批注/prologue/结果标签
    rationale: 批注/prologue/标签本身已短，硬删伤调性收益小；题目占总量~45%是最大头
    alternatives_rejected: "全部文案过一遍；只精简角色描述"
  - id: D2
    at_stage: "-1-align"
    choice: 力度=温和 ~30%，保调性优先于减字数
    rationale: 用户要"不失去感觉"
    alternatives_rejected: "激进~50%；外科手术~15%"
  - id: D3
    at_stage: "-1-align"
    choice: 语言=只 zh-CN，其他 locale 标 TODO
    rationale: zh-CN 是挑战者审讯体，其他 locale 调性不同
    alternatives_rejected: "四语言同步；zh+en"
  - id: D4
    at_stage: "2-confirm"
    choice: 歧义 A1/A2/A3 采用全部推荐读法
    rationale: 三个推荐均为合理默认；文案可逆
    alternatives_rejected: "等待用户逐条确认"
  - id: D5
    at_stage: "3b-implement"
    choice: 用户 review 出 7 处"信息又少又看不懂"→ 逐处补回断裂信息/修正用词
    rationale: 精简底线是"读者能看懂"
    alternatives_rejected: "回退全部精简"
  - id: D6
    at_stage: "3b-implement"
    choice: 契约变更——推翻 F3"保留世界观词"，全案去 IP 化（用户选"全案去场景"）
    rationale: 项目是跨 IP 平台（witch-trial+madoka+后续），QUESTIONS 数组跨 pack 共用，"因子/侵蚀/魔女化/残骸"等作品专属词让小圆用户看不懂
    alternatives_rejected: "只换'因子'一词；连审讯场景也保留（不够彻底）"
  - id: D7
    at_stage: "3b-implement"
    choice: 范围=只改 QUESTIONS 数组，不动 PERSONALITY_TYPES（角色描述）和 pack config
    rationale: 角色描述是 pack 专属内容层（witch-trial 角色带魔女味正确），去 IP 化应在共用题库层
    alternatives_rejected: "连角色描述也去 IP 化（会破坏 witch-trial pack 调性）"
  - id: D8
    at_stage: "3b-implement"
    choice: playwright webServer command 加 FORCE_RESEED=1
    rationale: 原 command 不强制 reseed，DB 有题就跳过 → e2e 永远测旧文案，源文件改动不生效
    alternatives_rejected: "手动每次跑前删 DB（易忘）；改 seed 脚本默认 force（影响 dev）"

notes:
  - 渲染权威源=quiz-content.ts → DB seed → API；zh-CN.ts questions节是死代码（已加注释）
  - 改文案生效路径：改 quiz-content.ts 的 text/options.label → FORCE_RESEED=1 npx prisma db seed
  - 必须保持不变：dim/score/type/renderType/value/trigger/weight编码
  - 去 IP 化详情（替换映射表）见 40-implementation.md
  - ⚠️ 预先存在的 build bug：DisclaimerFooter 用 useI18n 但 SSR 无 I18nProvider → standalone build 和 dev server /test 都 500。clean HEAD 也复现，与文案改动无关。标记后续待修。
  - ⚠️ welcome 视觉回归基线预先存在漂移（stash 验证），与文案无关
