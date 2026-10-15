# 你是 Crucible 流程的 red-team（维度：**跨 IP 合规与词表**）。项目：/Users/mun...

- 会话 ID: `sess_subagent_agent_6b4a0064-ff02-4aae-977e-d4a61864d3dc`
- 时间: 2026-08-10 12:45:16 → 2026-08-10 12:45:16
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 3
- 归档状态: 未归档

---

## 👤 用户
你是 Crucible 流程的 red-team（维度：**跨 IP 合规与词表**）。项目：/Users/munich/Desktop/独立项目/magical-girls（WITCH-TRIAL 魔女审判人格测试，跨 IP 平台：witch-trial + madoka）。任务：全案文案重写已完成，你要从跨 IP 合规维度攻击。

## 攻击目标
- `/Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts`（题库区是跨 pack 共用资产）
- `/Users/munich/Desktop/独立项目/magical-girls/src/content/packs/madoka/config.ts`（madoka pack）
- `/Users/munich/Desktop/独立项目/magical-girls/src/i18n/{zh-CN,en,ja,zh-TW}.ts`（平台层 UI）

## 契约（攻击依据）
- `/Users/munich/Desktop/独立项目/magical-girls/crucible/10-intent-contract.md`（R7/R8 + 判定 8）

## 你的攻击维度：跨 IP 合规
寻找**IP 专属词越界 / REDESIGN 否决词残留 / 词表作用域错误**。重点：
1. **题库区（QUESTIONS）IP 词**：26 题的 text/label/meta 中是否出现 witch-trial IP 专属词（因子/侵蚀/监牢/典狱长/使魔/残骸/魔女化/魔法少女）？题库是跨 pack 共用，madoka 用户会看不懂这些词。逐题搜索。
2. **madoka pack 词表**：madoka/config.ts 的 5 角色 desc/slogan 是否含 witch-trial 专属词（因子/监牢/典狱长/使魔/残骸/侵蚀）？小圆世界观词（魔女/魔法少女/魔女化）允许。
3. **四语言 i18n 平台层 IP 词**：meta/welcome/loading/test/result/dims/dimGroups/disclaimer 这些跨 IP 共用 UI 是否含任何 IP 专属词？产品名"魔女审判/Witch Trial"允许，其他禁。
4. **REDESIGN 否决词**：因子倾向/因子共鸣度/因子侵蚀/相似度/灵魂图谱——四语言全文件搜，应 0 命中
5. **witch-trial 16 角色 desc 区**：这里允许 IP 词（pack 内部），但检查是否有越界到题库或 i18n 平台层
6. **英文 IP 词**：en.ts 里是否出现 factor/corrosion/dungeon/warden/familiar/remnant/witchification/magical girl？
7. **日文 IP 词**：ja.ts 里是否出现 因子/侵蝕/監獄/看守長/使い魔/残骸/魔女化/魔法少女（平台层）？

## 配额
必须报告 ≥3 个真实问题，或明确说明为什么更少。每条：具体影响 + 复现路径（哪个文件哪一行哪个词）+ 契约缺口。

## 自我管理
- 有界：只读 + 报告，不修改
- 诚实：只报真实问题
- 输出完整不截断
