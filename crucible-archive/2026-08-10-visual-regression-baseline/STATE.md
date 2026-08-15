task: visual-regression-baseline
level: T2
type: build
stage: "5-done"
last_completed: "4-audit"
next: "none"
updated: 2026-08-10T01:15:00+08:00

fingerprints:
  spec_hash: 38564918585c
  seed_hash: 9c54307e1c0e
  code_mtime: "2026-08-10T01:10:00+08:00"
  staleness_threshold_h: 72

notes:
  - 目标：e2e 视觉回归基线。审计 PASS。
  - 7 条基线全绿（desktop welcome zh/en/ja + test + result；mobile welcome zh + test）。
  - 全在 tests/visual/__screenshots__/，可提交。
  - 关键修复历程：
    1. 红蓝 6 发现全修复（基线路径/opt-block全量/README一致/kanji mask/注释）
    2. 审计 CRITICAL：welcome 基线粉色色块（mask 全屏 canvas）→ 改 visibility:hidden，重生成有效基线
  - 验证：7基线全真实内容(71-580KB) + 改CSS触发FAIL + 连续3次一致 + 现有108 e2e不受影响。
  - 待用户确认收尾后归档。
