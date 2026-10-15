# 你是 red-team，从**安全性/防篡改**维度攻击阶段1的实现。硬配额：至少报告 2 个真实问题，或明确说明...

- 会话 ID: `sess_subagent_agent_e8178bae-20ec-463b-a456-7ac96d9f97cd`
- 时间: 2026-08-07 03:50:43 → 2026-08-07 03:55:47
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 11
- 归档状态: 未归档

---

## 👤 用户
你是 red-team，从**安全性/防篡改**维度攻击阶段1的实现。硬配额：至少报告 2 个真实问题，或明确说明为什么更少。

## 攻击目标
魔女审判→灵魂审判器 阶段1。这是一个有人格测试结果的项目，防篡改是核心安全要求（R12：服务端匹配、防篡改）。用户可能想伪造结果匹配稀有角色。

## 实现位置（必读）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/match/route.ts` — 匹配API
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/results/route.ts` — 结果API
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts` — 批注API（新增）
- `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/quiz/route.ts` — quiz API
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts` — 服务端打分
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/schemas.ts` — zod校验
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/rate-limit.ts` — 限流
- `/Users/munich/Desktop/独立项目/magical-girls/src/lib/admin-auth.ts` — admin鉴权
- `/Users/munich/Desktop/独立项目/magical-girls/src/components/TestScreen.tsx` — 客户端答题（变奏题提交逻辑）

## 契约安全要求
- R12：服务端匹配、防篡改、feature flag可回退
- 防篡改核心：客户端只发 {questionId, optionId}[]，服务端从DB重新读score/value/trigger算结果。客户端传的 dim/score 被忽略。

## 攻击方向（安全）
1. **变奏题防篡改**：砝码题客户端提交的是查表后的optionId。攻击者能否伪造一个不在合法7组合里的optionId？能否通过修改weightSlots绕过总和=3校验直接提交高分option？提交逻辑（handleWeightConfirm）是否纯客户端校验？
2. **批注API滥用**：/api/annotation 是新增endpoint。它接受任意answers数组——能否用来探测维度打分方向（通过提交不同answer观察批注档位变化反推score）？rate limit够吗？能否用来DoS？
3. **score泄露**：C5 改动 /api/quiz 时，是否意外暴露了option.score？（C4给非gate选项加过score又回退，确认回退干净）。维度dir字段是否泄露？
4. **门控value伪造**：客户端能否传一个gateValue不在destroy/seen/peace/undecided里的值？schemas.ts的z.enum是否在所有入口生效？
5. **触发题绕过**：攻击者能否在gateValue=peace时强制触发特殊人格（YUKI/ETL）？specialTriggers映射是否只在destroy/seen下生效？
6. **新增API的鉴权**：/api/annotation 是否需要鉴权？它调用processAnswers读DB，是否有信息泄露风险？

## 产出格式
每条发现：标题 + 具体影响（攻击者能干什么）+ 复现路径（curl或代码路径）+ spec缺口 + 严重度（Critical/High/Medium/Low）。

开始攻击。

## 🤖 助手
现在我来查看更多文件以完成攻击分析。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
现在我需要验证一个关键攻击路径 — 重复答案是否真的能通过校验并使分数倍增。

> 🔧 工具调用 2 次: Read, Bash

## 🤖 助手
已确认攻击路径。现在验证 annotation oracle 的信息泄露粒度 — 批注文本是否真的能区分 H/M/L 档位。

> 🔧 工具调用 1 次: Read

## 🤖 助手
所有攻击路径已验证完毕。以下是完整的安全审计报告。

---

### BLUF
2条已验证发现。最严重：**processAnswers不对questionId去重，攻击者提交同一答案N次即可将dimScores放大至N倍，彻底破坏匹配结果**（Critical）。第二条：annotation API构成评分oracle，泄露维度档位，绕过quiz API的score剥离设计（High）。R12防篡改在两个独立路径上被击穿。

### 最严重问题
processAnswers不按questionId去重 — 攻击者对同一题提交5次同一optionId，dimScores被放大5倍，可精确控制匹配到任意人格类型。

### 发现

- **[F1] 严重度：Critical — `/Users/munich/Desktop/独立项目/magical-girls/src/lib/answer-processor.ts:41-61` + `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/match/route.ts:37-49`**
  - **影响：** 攻击者可将任意维度的dimScores放大最多5倍（schema允许max 100个answer，约20道题，100/20=5倍）。具体地：若目标维度有3道题，每题最高score=2，正常总分=6（X档位）。攻击者将每题提交5次，总分=30，远超X阈值。对不需要的维度提交0分选项（或不提交）。这使得攻击者能**精确控制每个维度处于L/M/H/X任意档位**，从而强制匹配到任意人格类型。R12"服务端匹配、防篡改"被彻底击穿。
  - **复现：**
    1. `GET /api/quiz` 获取所有questionId/optionId/dim
    2. 选定目标人格类型，对其向量中标记为H/X的维度，找到该维度题目中得分最高的optionId
    3. 构造answers数组：对每个高维度的题，将`{questionId, optionId}`重复5次；对低维度题，提交一次0分选项
    4. `POST /api/match` 发送该answers数组
    5. 服务端`processAnswers`遍历全部100个answer，每个重复项都通过`optionMap.get(a.optionId)`查找（DB查询用了`new Set`去重所以option存在），通过`opt.questionId !== a.questionId`校验（questionId匹配），score累加5次
    6. `validAnswers.length`(100) === `answers.length`(100)，通过最终校验
    7. 返回的dimScores是被放大的，匹配结果被篡改
  - **Spec 缺口？：** 是——R12要求"服务端匹配、防篡改"，服务端确实从DB重算score（没有信任客户端传入的score），但缺少questionId唯一性约束，导致重算过程本身可被滥用
  - **修复方向：** processAnswers中按questionId去重（只取每个questionId的首次出现），或在API层校验`new Set(answers.map(a => a.questionId)).size === answers.length`

- **[F2] 严重度：High — `/Users/munich/Desktop/独立项目/magical-girls/src/app/api/annotation/route.ts:16-83`**
  - **影响：** annotation API返回的文案直接映射到H/M/L三个档位（annotations.ts:113 `tierNum <= 0 ? "L" : tierNum === 1 ? "M" : "H"`），且三档文案完全不同（可逐字匹配区分）。攻击者可将其用作**评分oracle**：对quiz API暴露的每个optionId，单独提交`[{questionId, optionId}]`到`POST /api/annotation?node=5`，观察返回文案属于H/M/L哪个档位，即可确定该option的score范围（tiers=[2,4,5,6]→L=score≤2, M=3-4, H=≥5）。quiz API设计上故意不暴露score（`route.ts:34-36`对非gate选项只返回`{id, label}`），但annotation API通过侧信道泄露了等价信息。获得score方向后，攻击者即可在真实测试中选择性地挑高分选项，伪造特定人格匹配。
  - **复现：**
    1. `GET /api/quiz` → 获取所有questionId, optionId, dim
    2. 对维度S1的第1题的每个optionId，发送：`curl -X POST /api/annotation?node=5 -H 'Content-Type: application/json' -d '{"answers":[{"questionId":<qid>,"optionId":<oid>]}'`
    3. 返回文案若含"很少犹豫"→H档（score≥5）；含"几处停顿"→M档（score 3-4）；含"正确答案"→L档（score≤2）
    4. 30个初始令牌+1/sec恢复，80个option约80秒内全部探测完毕
    5. 用获得的score方向，在正式测试中每题选最高分option，强制匹配目标人格
  - **Spec 缺口？：** 是——R12要求防篡改，quiz API已正确剥离score（R1也要求不泄露打分方向dir），但annotation API作为新增endpoint绕过了这一保护，构成信息泄露侧信道
  - **修复方向：** annotation API应要求sessionId或仅在已完成的测试会话中可用；或对单answer请求返回fallback而非计算tier；或将rate limit收紧到capacity:5 refillPerSec:0.1

### Spec 覆盖检查
- R12"服务端匹配"：⚠ 部分 — 服务端确实从DB重算score不信任客户端，但缺少questionId去重，重算过程本身可被放大（F1）
- R12"防篡改"：✗ 缺失 — 两个独立路径击穿：(1) 重复答案分数放大 (2) annotation oracle泄露评分方向
- R12"feature flag可回退"：✓ 覆盖 — pack机制支持切换
- R1"不泄露打分方向dir"：⚠ 部分 — quiz API正确剥离dir，但annotation API通过tier侧信道泄露等价信息
- R9"批注不输出维度标签/角色/百分比"：✓ 覆盖 — 批注文案本身不含标签，但tier档位可被反推

### 值得追的线索（不计入K）
- `resultsRequestSchema`中`gateValue: z.string().max(50)`而非`z.enum(["destroy","seen","peace","undecided"])`（schemas.ts:39）。当前代码正确使用processAnswers派生的gateValue，但schema过宽是defense-in-depth缺口——未来开发者若误用`parsed.data.gateValue`，任意字符串将入库。
- annotation API使用`as AnnotationBody`类型断言而非Zod校验（route.ts:36），`questionId`/`optionId`未被验证为正整数。恶意浮点数或负数不会命中DB记录被processAnswers静默跳过，但错误信息不如Zod清晰，且绕过了统一校验层。

### 裁决
2条真实发现已报告。安全攻击面已覆盖：API输入校验、服务端防篡改路径、信息泄露侧信道、rate limit有效性。F1（重复答案分数放大）为Critical——直接违反R12核心安全要求，可精确伪造任意人格匹配结果。
