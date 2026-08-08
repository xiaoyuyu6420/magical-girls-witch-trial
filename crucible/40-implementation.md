# 实现日志 — 阶段2：跨IP扩展

> 2026-08-08。决策 A1-A8 已锁定（用户未答按推荐）。

## 架构决策
跳过 3 架构师仲裁——A1（引擎pack单一权威源）已锁定，数据流清晰（PersonalityType+ipCode → match findMany 全局 → ResultScreen per-ipCode workIntro），无设计分叉。

## 小圆向量标定（A4，文档化理由）

维度顺序 S1 S2 S3 | F1 F2 F3 | B1 B2 B3 | W1 W2 W3
参考现有15角色量级（L/M/H，无X档——X档仅特殊角色 YUKI/ETL）。

| 角色 | 向量 | 标定理由 |
|---|---|---|
| 鹿目圆 | LLH-LLH-HLH-LLH | 宽容(S1L)信任(B1H)宽恕(S3H)释怀(F1L)韧性(F2L)牺牲极高(B3H)不压抑(W1L)本能爱(W3H)。天真善良为众生成神 |
| 晓美焰 | HHL-HLH-LHH-HHH | 严苛(S1H)警觉(S2H)不宽恕(S3L)复仇(F1H)绝望极深(F2L)执念极高(F3H)防备(B1L)敏感(B2H)牺牲(B3H)极压抑(W1H)理性维系(W2H)本能释放(W3H)。**[复审修正 2026-08-08]** 原标定 HHL-HMH-LHH-HHM 与魔女审判HIRO(HLL-HMH-LHH-HHM)加权距离仅2.0（差异仅在S2），导致用户S2落M档时两者精确平局→HIRO(seed序先)胜出，晓美焰实际匹配不到。复审后将 F2 从M改为L（晓美焰轮回千次每次失败，绝望比HIRO更深）、W3从M改为H（末期魔女化为鹿目圆敌整个世界，本能释放更强），修正后与HIRO加权距4.5，gap(sim)6.4>delta(3)，稳定匹配 |
| 美树沙耶香 | HML-MHH-HHH-LHH | 严苛正义(S1H)不宽恕背叛(S3L)绝望极高魔女化(F2H)执念(F3H)初始信任(B1H)背叛敏感极高(B2H)牺牲(B3H)感性(W2L) |
| 佐仓杏子 | MHL-MMH-LMH-MMH | 实用主义(S2H街头智慧)不宽恕世界(S3L)韧性(F2M)防备(B1L)关键时刻牺牲(B3H)本能生存(W3H) |
| 巴麻美 | HMM-LHM-HHL-HHL | 前辈姿态严苛(S1H)绝望/孤独(F2H)信任接纳(B1H)为后辈牺牲(B3H)压抑脆弱(W1H)理性维系优雅(W2H)不本能(W3L) |

**关键验证**：晓美焰(HHL-HLH-LHH-HHH)与魔女审判HIRO(HLL-HMH-LHH-HHM)加权距离4.5（差异在S2/F2/W3三维），两者都是"为挚爱穿越死亡"的跨IP同构原型，在向量空间保持相似但可区分。跨IP向量空间可比性由"5个小圆角色在自身向量位置都稳定匹配到(top1 d=0, 最近邻gap≥6.4)"支撑——这正是跨IP匹配的价值（用户可能匹配到不熟IP的同构角色，产生惊喜）。

> **[复审修正 2026-08-08]** 原向量 HHL-HMH-LHH-HHM 与 HIRO 距离仅 2.0，经独立复审识别为撞车（用户S2落M档精确平局→HIRO胜出）。修正为 HHL-HLH-LHH-HHH（F2 M→L, W3 M→H），距离提升至 4.5，gap 6.4。详见 `60-reaudit.md`。

## 各改动
- prisma schema: PersonalityType 加 ipCode @default("witch-trial")
- src/content/packs/madoka/config.ts: 5主角 + title/workIntro/ipCode
- src/content/packs/ip-registry.ts: IP元信息注册表 + getIpMeta
- prisma/seed.ts: 合并魔女审判+小圆角色，各标 ipCode
- match.ts: MatchResult/PersonalityTypeInput 加 ipCode，4处return透传
- ResultScreen: getIpMeta(result.ipCode) 替代 pack.workIntro/title；加结果页版权声明
- DisclaimerFooter + layout: 全站合规footer
- 4 locale i18n: disclaimer.footer/result

## 验证
- 58单测绿，tsc无错
- DB: 21角色(16+5)，ipCode分布正确，向量全12维无X
- 全局匹配验证: 偏晓美焰向量→HOMURA ipCode=madoka，top3跨IP(HOMURA/HIRO/SAYAKA)
- e2e: 待跑（角色池扩大可能影响 quiz.spec 一致性断言）

## 偏离
- match.ts 是阶段1 R6 锁死区，但加 ipCode 透传不是"改算法逻辑"（加权曼哈顿/delta/threshold 全未动），是数据字段扩展。最小侵入。
