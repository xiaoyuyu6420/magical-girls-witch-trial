task: anti-obvious-quiz-algo
stage: 5-done
last_completed: 4-audit
next: none
updated: 2026-08-05T09:46:26

fingerprints:
  spec_hash: 38564918585c
  seed_hash: 894406eddf51
  code_mtime: 2026-08-05T09:46:26
  staleness_threshold_h: 72

notes:
  - T0-T3 实现完成
  - vitest 45/45 全绿
  - 审计 FIX-AND-RE-AUDIT -> 修复 dir 泄漏 -> PASS
  - 用户本机需 FORCE_RESEED=1 重建 DB
