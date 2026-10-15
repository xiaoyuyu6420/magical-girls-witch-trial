# 我在探索一个 Next.js 项目（魔法少女心理测试），路径在 /Users/munich/Desktop/独立项...

- 会话 ID: `sess_subagent_agent_0a3279c0-2add-4c3c-9de9-2e2ea9a9d02d`
- 时间: 2026-08-13 02:45:00 → 2026-08-13 02:50:30
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 17
- 归档状态: 未归档

---

## 👤 用户
我在探索一个 Next.js 项目（魔法少女心理测试），路径在 /Users/munich/Desktop/独立项目/magical-girls。

我需要彻底理解"题目数据"和"文案系统"。请探索并报告以下内容：

1. **题目数据结构**：src/data/quiz-content.ts 的完整结构——题目是怎么定义的？有哪些字段（type、meta、question、options、score、posture、tendency、path 等）？题目类型有哪些（A/B 等）？请给出完整的 TypeScript 类型定义和数据样例
2. **i18n 文案系统**：src/i18n/ 下的 zh-CN.ts、en.ts、ja.ts、zh-TW.ts——文案如何组织？答题页面相关的文案（题目标签、toast 提示如"契约已被记录"、按钮文字、HUD 文字、快捷键提示等）都在哪些 key 下
3. **题目数量和内容**：现在有多少道题？题目内容是什么主题？和"魔法少女小圆"IP 相关吗
4. **题目的 meta/标签文案**：每道题的 meta 标签（如 "Q1 · 晨光中的许愿"）存在哪
5. **content/packs 目录**：src/content/packs/madoka/config.ts 和 content/ 目录（项目根的 content/）里有什么？pack 机制是什么
6. **多语言/多 IP 支持**：项目如何支持多个 IP pack？quiz-content 和 pack config 的关系

请给出关键文件路径、数据结构定义、字段含义，以及完整的数据样例。请读 excerpts 来理解实际内容，不要只列文件名。

## 🤖 助手
我将探索这个 Next.js 项目，以彻底理解题目数据结构和文案系统。让我先从概览项目结构以及并行读取关键文件开始。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我来并行读取核心数据文件。

> 🔧 工具调用 3 次: Read

## 🤖 助手
现在，让我来读取 pack 系统、witch-trial 配置（`quiz-content` 重新导出的引擎配置）以及 i18n 文件。

> 🔧 工具调用 4 次: Read

## 🤖 助手
现在让我并行读取 i18n 文件、根目录下的 content.yaml 以及本地化内容 hook。

> 🔧 工具调用 4 次: Read

## 🤖 助手
`content.yaml` 是权威内容来源。让我读取它以及 `i18n` 提供程序和 `ja`/`zh-TW` 文件，以完善整体情况。

> 🔧 工具调用 1 次: Read

## 🤖 助手
我现在发现，权威来源（content.yaml 和 quiz-content.ts）大多处于骨架状态（即空字符串）。让我搜索一下用户提到的具体 UI 字符串，例如 "契约已被记录" (toast)、HUD 文本和键盘提示，并检查渲染组件和数据库 schema。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
"契约已被记录" 字符串不存在于当前代码中（这些文件是空骨架）。让我读取 `TestScreen` 组件（包含 toast/HUD/keyboard 提示的答题页面）并确认 `ja.ts`/`zh-TW.ts` 是否匹配，同时检查数据库模式 (DB schema)。

> 🔧 工具调用 1 次: Read

## 🤖 助手
让我来确认一下 annotation fallbacks（实际的中文渲染文本）、DB schema/seed（即存储内容的地方），并检查 `/api/quiz` 路由，以完整梳理从数据到 UI 的整个链路。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
我来确认一下数据库架构，并检查历史备份中是否包含实际内容（因为当前权威的源文件均为空骨架）。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
项目最近（8月11日）进行了文案回滚，这就是为什么所有内容都是空的。让我检查一下测试和 `README`，以找到关于“契约”提示词以及预期题目标签格式的历史引用。

> 🔧 工具调用 2 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
让我先阅读一下回滚存档（rollback archive）中的 `copy-snapshot` —— 它很可能包含了被清空的完整历史内容（包括关卡 meta "命运分歧"、触发 meta "最终抉择"，或许还有“契约”的 toast 文案）。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
让我搜索该快照以查找用户询问的关卡/触发器 meta 值以及任何“契约” toast。

> 🔧 工具调用 1 次: Bash

## 🤖 助手
让我阅读一下快照中的关卡/触发器题目内容以及 UI 文本块，看看哪些内容被回滚了。

> 🔧 工具调用 2 次: Bash

## 🤖 助手
我已经全面了解了代码库。以下是详细报告。

---

# 魔法少女心理测试 — 题目数据与文案系统探查报告

## 关键结论（先看这个）

项目正处于一次 **"文案重写/回滚" 的中间状态**（2026-08-11 的 `rewrite-all-copy-rollback` 归档可证）。当前所有权威文案源（`content/content.yaml` 和 `src/data/quiz-content.ts`）**绝大部分是空字符串骨架**，只有 Q1–Q7 有新文案。你提到的 toast "契约已被记录" 在代码里 **不存在**（grep 全仓零命中），项目目前没有任何 toast 系统——只有题目标签、键盘提示、批注插页这些 HUD 元素。

---

## 1. 题目数据结构（`src/data/quiz-content.ts`）

### 完整类型定义

```ts
// /Users/munich/Desktop/独立项目/magical-girls/src/data/quiz-content.ts:105-112
export interface QuestionDef {
  dim: string;          // 维度码：S1/F1/B1/W1... 或 "GATE"/"TRIGGER"
  text: string;         // 题干文案
  meta: string;         // 题目标签，如 "评判·抗拒"（渲染成 "评判·抗拒 · 01 / 23"）
  /** DB 打分语义：normal/gate/trigger（不扩展）*/
  type: "normal" | "gate" | "trigger";
  /** 渲染类型（内容层，与 type 解耦）：normal/scale/weight。默认 = type 或 normal */
  renderType?: "normal" | "scale" | "weight";
  options: { label: string; score?: number; value?: string; trigger?: string }[];
}
```

字段含义：
- `dim` — 这道题给哪个心理维度加分。常规题是 `S1/S2/S3/F1/F2/F3/B1/B2/B3/W1/W2/W3`（共 12 维），门控题是 `"GATE"`、触发题是 `"TRIGGER"`。
- `type` — **打分语义**（落库 enum，只有三种）：`normal`（计分）/ `gate`（四选一路径分支）/ `trigger`（二选一触发特殊人格）。
- `renderType` — **渲染语义**（内容层字符串，与 type 解耦）：`normal`（纵向选项）/ `scale`（天平题，2 选项左右对峙）/ `weight`（砝码题，三槽拖拽分配）。这是变奏题机制。
- `options[].score` — 1/2/3 分值。**反向题**显式传 scores 数组打乱默认 1→n 顺序（如 `[3,2,1]`）。
- `options[].value` — 仅 gate 题用：`destroy` / `seen` / `peace` / `undecided`（四条路径）。
- `options[].trigger` — 仅 trigger 题用：`SPECIAL_A`（标记"越线"选项）。
- 砝码题（Q14）的 `label` 是编码 `weight::a|b|c`（如 `weight::2|1|0`），不是给人读的文案。

**注意**：你列的 `posture` / `tendency` / `path` 字段 **不存在**。题目没有这些字段。

### 构造器 `Q()` 和题目总数

```ts
// quiz-content.ts:115-121 — 普通题构造器
const Q = (dim, meta, text, options, scores?) => ({
  dim, meta, text, type: "normal",
  options: options.map((label, i) => ({ label, score: scores?.[i] ?? i + 1 })),
});
```

**共 26 道题**（`QUESTIONS` 数组，Q1–Q26），结构分布：

| 题号 | 类型 | renderType | dim | 备注 |
|---|---|---|---|---|
| Q1–Q7 | normal | normal | S1/F1/B1/W1/S2/F2/B2 | 正向 12 题的前半，**唯一有文案的 7 题** |
| Q8 | normal | **scale** | W2 | 天平题（2 选项，score 1/3） |
| Q9–Q12 | normal | normal | S3/F3/B3/W3 | 正向 12 题后半，空 |
| Q13 | normal | normal | S1 | 反向题 [3,2,1] |
| Q14 | normal | **weight** | F1 | 砝码题（7 个 `weight::` 编码选项） |
| Q15–Q17 | normal | normal | B1/W1/S2 | 反向题 |
| Q18 | **gate** | gate | GATE | 四路径 destroy/seen/peace/undecided |
| Q19 | **trigger** | trigger | TRIGGER | SPECIAL_A 越线题 |
| Q20–Q26 | normal | normal | F2/B2/W2/S3/F3/B3/W3 | 反向剩余 7 题（Q22 是 scale） |

### 数据样例（有真实文案的 Q1，和结构特殊的 Q14/Q18）

```ts
// Q1 — 普通正向题（有文案）
Q("S1", "评判·抗拒",
  "别人一旦让你失望，你心里那扇门就关死了。你管这叫"原则"。可你从来没真正给过谁第二次机会——对吗？",
  ["我没有。我给过很多人第二次机会。",
   "……也许吧。失望过的人，我确实很难再开门。",
   "第二次机会是给配得上的人。不是谁都配。"]),
// → options 自动得 score 1/2/3

// Q3 — 反向题（显式 scores）
Q("B1", "羁绊·邂逅", "...", [...3个选项...], [3, 2, 1]);  // score 反过来

// Q14 — 砝码题（scale 渲染，label 是编码）
{ dim: "F1", meta: "", type: "normal", renderType: "weight", text: "",
  options: [
    { label: "weight::2|1|0", score: 3 }, { label: "weight::2|0|1", score: 3 },
    { label: "weight::1|2|0", score: 2 }, { label: "weight::0|2|1", score: 2 },
    { label: "weight::1|0|2", score: 2 }, { label: "weight::0|1|2", score: 2 },
    { label: "weight::1|1|1", score: 1 },
  ]}

// Q18 — 门控题
{ dim: "GATE", meta: "", type: "gate", text: "",
  options: [
    { label: "", value: "destroy" }, { label: "", value: "seen" },
    { label: "", value: "peace" }, { label: "", value: "undecided" },
  ]}

// Q19 — 触发题
{ dim: "TRIGGER", meta: "", type: "trigger", text: "",
  options: [{ label: "", trigger: "SPECIAL_A" }, { label: "" }] }
```

### 引擎配置（quiz-content.ts 只是 re-export 壳）

```ts
// quiz-content.ts:5-17 — 真正的引擎配置在 witch-trial pack
import { DIMENSIONS, WEIGHTS, ALGO_CONFIG } from "@/content/packs/witch-trial/config";
export const DIMENSIONS = PACK_DIMENSIONS;  // 12 维定义
export const WEIGHTS = PACK_WEIGHTS;        // 各维度权重
export const ALGO_CONFIG = PACK_ALGO_CONFIG; // 分档算法
```

`PERSONALITY_TYPES`（角色定义）也在此文件，共 17 个：EMMA/SHERRY/MIRIA/HIRO/NANOKA/HANNA/MERURU/COCO/NOAH/MARGO/ANAN/ALISA/LEIA/UNSET（兜底）+ YUKI/ETL（special）——但 slogan/desc/keywords **全是空字符串**。

---

## 2. i18n 文案系统（`src/i18n/`）

### 机制
- Provider：`src/lib/i18n.tsx` — React Context，`useI18n()` 返回 `t(key, vars)`。key 用点号路径如 `test.exit`。`t` 找不到 key 时**返回 key 本身**（不是空串）。
- 四个语言文件 `zh-CN.ts` / `zh-TW.ts` / `en.ts` / `ja.ts` **结构完全一致**（我逐一比对过，key 树相同）。
- locale 检测：localStorage `witch-trial-locale` → `navigator.language` → 默认 `zh-CN`。

### 当前状态：全部是空骨架
**所有四个语言文件的所有 value 都是 `""`（空字符串）**。唯一例外是 `zh-CN.ts` 的 `test.exit = "退出"`。文件顶部明确标注（zh-CN.ts:95-98）：

```ts
// ⚠️ 死代码：questions / gate / trigger 下方数组不参与渲染。
// 渲染权威源是 src/data/quiz-content.ts → prisma db seed → /api → /test 页面。
// 精简后的权威文案见 quiz-content.ts。此处仅作历史参考保留，修改这里不会生效。
```

### i18n key 树（答题页相关重点标 ★）

```
meta.title / meta.description
welcome.{badge, title, subtitle, startHint, participants, startButton, prologue1, prologue2, prologue3}
loading.text
test.exit            ★ "退出"按钮文字（zh-CN 唯一非空）
test.gateBadge       ★ 门控题右上角徽标
test.triggerBadge    ★ 触发题右上角徽标
test.keyHint         ★ 桌面端键盘提示（如 "1 / 2 / 3 选择"）
test.weightHint      ★ 砝码题键盘/操作提示
result.{archetype, hidden, border, share, copyLink, rebirth, analysis,
        dimAnalysis, you, ideal, statsInfo, statsShort, factorResonance,
        factorResonanceLabel, shareText, revealJudgement, revealTransition,
        revealFrom, rarityLabel, rarityGlobal, rarityCollecting, rarityRare,
        workIntroLabel, soulTraits, shareHook, shareCta, hiddenReveal,
        skipHint, regionLabel}
dims.{S1..W3}        12 个维度名
dimGroups.{S,F,B,W}  4 个维度组名
types.{EMMA,...,MAMI}.{name, subtitle, slogan, desc, keywords}  21 个角色
questions: [...]     ⚠️ 死代码（24 元素空数组，不渲染）
gate: {meta, text, options}   ⚠️ 死代码
trigger: {meta, text, options} ⚠️ 死代码
disclaimer.{footer, result}
```

### 答题页 HUD 实际来源（`src/components/TestScreen.tsx`）

**重要**：答题页大部分 HUD 文字不来自 i18n，而是硬编码或来自 DB。你问的几项：

| 元素 | 来源 | 现状 |
|---|---|---|
| 题目标签 `评判·抗拒 · 01 / 23` | DB `Question.meta` + TestScreen.tsx:673 拼接 `${current.meta} · NN / NN` | meta 来自 DB（当前空→显示 "审判 · 01 / 23" 兜底） |
| 门控/触发徽标 | i18n `test.gateBadge` / `test.triggerBadge` | **空** |
| 键盘提示 | i18n `test.keyHint` / `test.weightHint` | **空**（→ `t()` 返回 key 本身，组件判空后不显示） |
| 退出按钮 | i18n `test.exit` | "退出"（唯一有值的） |
| 砝码题 HUD | **硬编码** TestScreen.tsx:532,550 | "天平已定" / "尚余 X 枚砝码未放" / "落锤" |
| 批注插页 | **硬编码** TestScreen.tsx:591 + `/api/annotation` 动态文案 | "审判官批注 · I/II/III" |
| toast "契约已被记录" | **不存在** | 项目无 toast 系统 |

批注插页的实际中文文案在 `src/lib/annotations.ts`（POOLS 数组，按节点 5/10/15 × 档位 H/M/L 存 2 条变体，语气递进 试探→逼近→审判）——**这部分文案是满的**，是少数当前有完整内容的地方。

---

## 3. 题目数量与内容主题

- **数量**：26 道（Q1–Q26）。但当前只有 **Q1–Q7 有真实题干和选项文案**（新写的、口语化指控体，如 "别人一旦让你失望…对吗？"），Q8–Q26 全是空字符串。
- **主题**：**原创 IP "魔女审判"（witch-trial）**——一个"在死亡回溯中守住一个人"的审讯室/审判官设定。题目是审判官对用户的"指控式"逼问（"你管这叫原则，可你从来没真正给过谁第二次机会——对吗？"），三态选项（否认/中间合理化/承认）。
- **和"魔法少女小圆"的关系**：**题目本身和小圆 IP 无关**。小圆（madoka）只是一个**结果角色 pack**（见下文）。题目引擎、12 维度、26 题都属于 witch-trial。
- **历史文案对比**：回滚归档 `crucible-archive/2026-08-11-0225-rewrite-all-copy-rollback/crucible/copy-snapshot/logical-fields.json`（1523 行）保存了**回滚前的完整 26 题文案**，是更文学化的「…」书名号风格（如 Q1 旧版 "「别装冷静了。你心里清楚自己已经踩在临界线上…」"）。当前 Q1–Q7 是改写后的更口语版本。gate 题旧文案是 "如果你拥有摧毁一切的力量…毁灭还是被看见？"，trigger 题是 "要我点亮它吗？一旦亮起，就回不去了。"

---

## 4. 题目的 meta / 标签文案存在哪

存在 **三个地方**，单向同步：

1. **权威源**：`content/content.yaml` 每题的 `meta:` 字段（如 `meta: 评判·抗拒`），标 ✏️ 可改。
2. **代码骨架**：`src/data/quiz-content.ts` `QuestionDef.meta`（Q() 第二个参数）。
3. **运行时**：DB `Question.meta` 列（Prisma schema，`String @default("")`），由 seed 从 quiz-content.ts 灌入，由 `/api/quiz` 返回。

渲染时 TestScreen.tsx:673 拼成 `{meta} · {NN} / {NN}`。当 meta 为空，显示兜底 "审判"。

26 题的 meta 标签（来自 quiz-content.ts 注释和 yaml，命名规则是 `维度组·意象`）：
- Q1 评判·抗拒 / Q2 执念·宿怨 / Q3 羁绊·邂逅 / Q4 自持·咽声 / Q5 评判·直觉 / Q6 执念·深渊 / Q7 羁绊·背叛 / Q9 评判·慈悲 / Q10 执念·迷途 / Q11 羁绊·献身 / Q12 自持·本能 / Q13 评判·停步 / Q15 羁绊·赌局 / Q16 自持·面具 / Q17 评判·传闻 / Q20 执念·崩塌 / Q21 羁绊·利刃 / Q23 评判·告白 / Q24 执念·不松手 / Q25 羁绊·出口 / Q26 自持·余波
- Q8/Q22（scale）/ Q14（weight）/ Q18（gate）/ Q19（trigger）meta 为空。

注意：回滚前的旧 meta 用的是 "命运分歧"（gate）、"最终抉择"（trigger）—— 见 `tests/quiz.spec.ts:216,340`。**测试还在引用旧 meta 名**，这是测试与当前空骨架不一致的隐患点。

---

## 5. `content/packs` 与根 `content/` 目录

### `src/content/packs/`（代码层，pack 机制）

三个文件：

**`witch-trial/config.ts`** — 引擎单一权威源。定义 12 维度（`DIMENSIONS`）、权重（`WEIGHTS`）、分档算法（`ALGO_CONFIG`）：
```ts
// 12 维分 4 组，每组 3 维：
// S组(评判): S1严厉/宽容 S2直觉/理性 S3宽恕/惩戒
// F组(执念): F1复仇/释怀 F2绝望/韧性 F3执念/放下
// B组(羁绊): B1信任/防备 B2背叛敏感 B3自我牺牲
// W组(自持): W1情绪压抑 W2理性维系 W3本能释放
// 权重: S1/F1/B3/W3 = 1.5（主维度），其余 1.0
// 分档: sum≤2=L, ≤4=M, ≤5=H, ≤6=X
```

**`witch-trial/index.ts`** — 组装成完整 `QuizPack` 对象（`id="witch-trial"`），含 `rules`（gate 四值、gateBonus、specialTriggers 映射如 `SPECIAL_A.destroy→YUKI`）、`presentation`（tierLabels `["低语","波动","共鸣","侵蚀"]`、隐藏技术向量）、`workIntro`。

**`madoka/config.ts`** — **只有角色内容，没有引擎配置**。定义小圆 5 主角（MADOKA/HOMURA/SAYAKA/KYOKO/MAMI）的 `PersonalityTypeDef`（向量为剧情主观标定）+ 作品元信息（`MADOKA_TITLE="魔法少女小圆"`、`MADOKA_WORK_INTRO`、`MADOKA_IP_CODE="madoka"`）。

**`ip-registry.ts`** — IP 元信息注册表，`IP_REGISTRY: { "witch-trial": {...}, "madoka": {...} }`，`getIpMeta(ipCode)` 供结果页查"来自《XX》"。

### Pack 类型契约（`src/pack/types.ts`）

定义 `QuizPack` 接口：`{ id, version, title, dimensions, weights, algo, rules, presentation, workIntro }`，以及 `DimDef`/`AlgoConfig`/`PackRules`/`PresentationConfig`。这是引擎与内容解耦的核心契约。

### Pack 加载（`src/pack/load.ts`）

```ts
const PACKS: Record<string, QuizPack> = { [witchTrialPack.id]: witchTrialPack };
export function getActivePackId() { return process.env.ACTIVE_PACK || "witch-trial"; }
```
**当前只注册了 witch-trial 一个 pack**。madoka 不是独立 pack（没进 PACKS），它只是 witch-trial 引擎下的"附加角色集"。多 pack 切换靠环境变量 `ACTIVE_PACK`，但暂未启用。

### 根 `content/` 目录（文案层）

- **`content/content.yaml`**（1411 行）— **全项目文案唯一权威源**。结构：`_meta` / `questions`(26) / `characters`(21) / `ui`(四语言)。字段用 🔒（结构，禁改）/ ✏️（文案，可改）标记。**当前几乎全空**（只有 Q1–Q7 的 text/options 和结构字段有值）。
- **`content/README.md`** — 工作流说明：改 yaml → 跑 `pnpm exec tsx scripts/sync-content.ts` → 同步到 DB + quiz-content.ts + i18n/*.ts。

### 数据流（重要，理清谁覆盖谁）

```
content/content.yaml (权威源, ✏️ 文案)
   │  scripts/sync-content.ts  ──→  DB (SQLite)          ← 运行时权威
   │       │                         ↑
   │       ├──→ src/data/quiz-content.ts (代码骨架, 🔒 结构)
   │       │         │  prisma/seed.ts (FORCE_RESEED=1 时会覆盖 DB 成空骨架!)
   │       │         └──────────────────────────────────┘
   │       └──→ src/i18n/{zh-CN,en,ja,zh-TW}.ts (UI 文案骨架)
   │
   └─ 运行时: /api/quiz 读 DB → TestScreen 渲染
```

**陷阱**：直接跑 `prisma/seed.ts` 会用 quiz-content.ts 的空骨架覆盖 DB（清空已有文案），需再跑 sync 恢复——README 明确警告了这点。

---

## 6. 多语言 / 多 IP 支持机制

### 多 IP（角色层面，非题目层面）
- 每个 IP 一个 `src/content/packs/<ip>/config.ts`，只放角色 `PersonalityTypeDef[]` + 作品元信息。引擎（维度/权重/算法/规则）**统一复用 witch-trial**，是单一权威源。
- 角色带 `ipCode` 字段（DB `PersonalityType.ipCode`，默认 "witch-trial"，小圆角色为 "madoka"），结果页据此显示"来自《魔法少女小圆》"。
- 新增 IP：在 `ip-registry.ts` 注册一行 + 建 `content/packs/<ip>/config.ts` + 在 seed.ts 里 map 进 `allTypes`。
- **题目是 IP 无关的**——26 题都属 witch-trial 引擎，所有 IP 角色共用同一套题目和 12 维向量做匹配。小圆角色的 vector 是按同一套 12 维重新标定的。

### 多语言（i18n 层面）
- 四语言 `zh-CN`（权威源）/ `zh-TW` / `en` / `ja`，key 树强制一致（sync 校验）。
- **题目翻译**不走 i18n 文件，而是存 DB `Question.translations`（JSON 字符串 `{locale: {text, meta, options[]}}`）。TestScreen.tsx:150-170 在非 zh-CN 时解析这个 JSON 覆盖题面。
- **角色翻译**同理存 DB `PersonalityType.translations`，`useLocalizedContent`（src/lib/use-localized-content.ts）解析，fallback 顺序：DB translations → zh-CN 原值 → i18n `types.{code}.{field}`。
- UI 文案（welcome/result/test/buttons）走 i18n/*.ts。

---

## 关键文件路径速查

| 用途 | 路径 |
|---|---|
| 题目类型定义 + 角色定义 + 26 题骨架 | `src/data/quiz-content.ts` |
| 12 维度 + 权重 + 算法（引擎权威源） | `src/content/packs/witch-trial/config.ts` |
| 完整 pack 装配（规则/展示） | `src/content/packs/witch-trial/index.ts` |
| 小圆角色 pack | `src/content/packs/madoka/config.ts` |
| IP 注册表 | `src/content/packs/ip-registry.ts` |
| Pack 契约类型 | `src/pack/types.ts` |
| Pack 加载/切换 | `src/pack/load.ts` |
| 文案权威源（当前空） | `content/content.yaml` |
| 文案工作流说明 | `content/README.md` |
| 四语言 UI 文案（当前空骨架） | `src/i18n/{zh-CN,zh-TW,en,ja}.ts` |
| i18n Provider | `src/lib/i18n.tsx` |
| 角色文案解析 hook | `src/lib/use-localized-content.ts` |
| 答题页组件（HUD/meta/键盘/砝码UI） | `src/components/TestScreen.tsx` |
| 审判官批注文案池（已填满） | `src/lib/annotations.ts` |
| DB schema | `prisma/schema.prisma` |
| DB seed | `prisma/seed.ts` |
| 题目 API | `src/app/api/quiz/route.ts` |
| 回滚前的完整文案快照 | `crucible-archive/2026-08-11-0225-rewrite-all-copy-rollback/crucible/copy-snapshot/logical-fields.json` |
| 同步脚本 | `scripts/sync-content.ts` |
