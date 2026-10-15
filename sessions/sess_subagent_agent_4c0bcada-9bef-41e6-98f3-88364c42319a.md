# 我在调查一个位于 /Users/munich/Desktop/独立项目/magical-girls 的项目，需要你...

- 会话 ID: `sess_subagent_agent_4c0bcada-9bef-41e6-98f3-88364c42319a`
- 时间: 2026-08-10 18:34:54 → 2026-08-10 18:35:52
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 7
- 归档状态: 未归档

---

## 👤 用户
我在调查一个位于 /Users/munich/Desktop/独立项目/magical-girls 的项目，需要你帮我摸清它的"整体性质"。请阅读并报告以下内容（medium 广度）：

1. 读 package.json、README.md（如果有）、根目录的配置文件，搞清楚：这是什么类型的应用？技术栈？(看名字像 Next.js + i18n 的魔法少女相关测验/测试应用)
2. 读 src/app/layout.tsx 和 src/app/ 下面的入口页面（page.tsx），理解应用的整体流程——用户进来后看到什么、走什么路径。
3. 看 src/components/ 下有哪些组件，特别是 TestScreen.tsx、结果页相关组件，理解用户交互流程。
4. 看 src/content/packs/ 目录结构——这里是不是按"IP"组织（比如 madoka/魔法少女小圆）？一个 pack 包含什么？
5. 看 content/ 目录（git status 显示是未跟踪的新目录）里有什么。

请用中文报告，重点是 BLUF（结论先行）：一句话说清"这是什么应用、给谁用、用户旅程是什么"。然后列出关键文件路径。不要贴大段代码，只贴决定结论的关键片段。不要做任何修改。

## 🤖 助手
我将先并行读取项目根目录的关键文件和结构。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
继续并行读取 README、应用入口、内容目录结构。

> 🔧 工具调用 3 次: Read, Bash

## 🤖 助手
应用入口很清晰了。注意一个关键点：`src/app/` 下没有根 `page.tsx`，只有 `test/page.tsx`。让我确认路由和内容包结构。

> 🔧 工具调用 4 次: Read

## 🤖 助手
最后确认 pack 结构和 root 路由情况。

> 🔧 工具调用 4 次: Read, Bash

## 🤖 助手
已经摸清整体性质。下面是报告。

---

## BLUF（结论先行）

这是一个**暗黑风格的"魔女审判"人格测试 Web 应用**：用户答 26 道道德/生死情境题，经 12 维向量匹配算法被"审判"成 16 种魔女人格原型之一，主打中文圈（简/繁/英/日四语），自带密码保护的管理后台。**当前正在进行的工程是一个跨 IP 扩展 + 全量文案重写**（引入《魔法少女小圆》作为第二个 IP，并把所有文案抽到 `content/content.yaml` 单一权威源）。

**用户旅程**：`/`（静态欢迎页）→ 点开始 → `/test` 答题 → 提交 `/api/match`（算人格）+ `/api/results`（存记录+返统计）→ `ResultScreen` 揭晓结果 → 重做/退出回 `/`。

---

## 1. 应用类型与技术栈

- **类型**：Next.js 16 (App Router, standalone output) + React 19 人格测试应用，端口 3010。
- **核心栈**：Tailwind v4、Prisma + SQLite（`dev.db`）、Zod、recharts（雷达图）、canvas-confetti、shadcn/ui。
- **测试**：Vitest（单测）+ Playwright（E2E/视觉回归，见 `tests/` 和 `test-results/`）。
- **部署**：Docker + GitHub Actions → Docker Hub，国内服务器走阿里云镜像加速。
- **i18n**：四语言文件在 `src/i18n/{en,ja,zh-CN,zh-TW}.ts`，通过 `src/lib/i18n` 的 `I18nProvider`（包在 `AppShell` 里）注入。

## 2. 入口与路由流程

- `src/app/layout.tsx`：根布局，暗黑主题（`#030303`）、Noto Serif SC + Cinzel 字体、Google Analytics、`AppShell`（即 i18n Provider）+ `DisclaimerFooter`。
- **关键发现：根目录没有 React `page.tsx`。** `/` 通过 `next.config.ts` 的 rewrite 直接返回静态 `/index.html` 欢迎页（绕过 React 运行时以压低首屏 TTI），真正的答题流在 `/test`。
- `next.config.ts` rewrite 段（决定性证据）：
  ```ts
  // Serve the static welcome page directly at "/" ... The quiz lives at /test.
  { source: "/", destination: "/index.html" },
  ```
- `src/app/test/page.tsx`：客户端组件，状态机 `loadError → TestScreen → submitError → ResultScreen`，`handleRestart`/`handleExit` 都是 `window.location.href = "/"`。
- 后端路由：`/api/quiz`（取题）、`/api/match`（匹配人格）、`/api/results`（写记录+返该人格占比）、`/api/count`、`/api/annotation`，以及整套 `/api/admin/*`（登录/题库 CRUD/导入导出/统计，含限流和 `timingSafeEqual` 防时序攻击）。

## 3. 组件构成（`src/components/`）

- `TestScreen.tsx`：答题交互主组件（题目渲染、选项、进度、localStorage 断点续答 `witch-trial-progress`）。
- `ResultScreen.tsx`：结果揭晓页（人格卡、slogan、top3、占比统计）。
- `RadarChart.tsx` / `DimensionBar.tsx`：12 维雷达图 + 维度条（recharts）。
- `AppShell.tsx`（i18n Provider 包装）、`ErrorBoundary`、`FullscreenButton`、`GoogleAnalytics`、`DocumentLang`、`DisclaimerFooter`。
- `src/components/ui/*`：标准 shadcn 组件（button/card/dialog/table/tabs 等）。

## 4. `src/content/packs/` —— 确实按 IP 组织

是的，**一个 pack = 一个 IP 作品**。当前两个：

- `witch-trial/`（原创新 IP，唯一 active pack）：
  - `config.ts` —— 引擎配置：12 维度定义（S/F/B/W 四组×3）、权重 `WEIGHTS`、算法阈值 `ALGO_CONFIG`（tiers/delta/threshold）。
  - `index.ts` —— `witchTrialPack`，组装成 `QuizPack`：含 `rules.gateValues`（destroy/seen/peace/undecided 门控）、`specialTriggers`（SPECIAL_A/B → YUKI/ETL 等隐藏人格映射）、`optionShuffle: "stable-by-question-id"`（反识破：选项位置≠分数）、`presentation.hideTechnicalVectors` 等。
- `madoka/`（魔法少女小圆，扩展阶段 2，**只有角色定义，不含引擎配置**）：5 个角色 `MADOKA/HOMURA/SAYAKA/KYOKO/MAMI`，每人一个 12 维向量（如 HOMURA=`HHL-HLH-LHH-HHH`），`slogan/desc/keywords` 目前为空（待文案重写填充）。引擎复用 witch-trial。
- `ip-registry.ts`：集中注册每个 IP 的 `title` + `workIntro`（一句话作品介绍），供结果页显示"来自《XX》"，未知 ipCode 兜底回 witch-trial。
- Pack 加载：`src/pack/load.ts` + `src/pack/types.ts` + `src/pack/shuffle.ts`。
- `src/content/packs/README.md`：新增 IP 的步骤（复制 pack → 改 dimensions/weights/rules → 在 `load.ts` 的 `PACKS` 注册 → 准备题目/人格 + seed），用 `ACTIVE_PACK` 环境变量切换。

## 5. `content/`（根目录，未跟踪的新内容）

这是一个**全新的"文案单一权威源"工作流**，配合未跟踪的脚本 `scripts/{sync-content,dump-content,verify-rewrite}.ts` 使用：

- `content/content.yaml` —— **整个项目文案的唯一权威源**。结构：`_meta`（规则说明）+ `questions`（26 题）+ `characters`（21 个 = 16 witch-trial + 5 madoka）+ `ui`（四语言 UI 文案）。
- **🔒 vs ✏️ 约定**（核心机制）：🔒 = 结构字段（`_dim/_type/_score/_value/_trigger/_code/_vector/_group` 等），sync 会校验，改了报错退出，强改会破坏评分；✏️ = 文案字段（`text/label/slogan/desc/keywords/meta`），随便填。
- 工作流：编辑 yaml → 跑 `sync-content.ts` → 自动同步到 DB + `src/data/quiz-content.ts` + `src/i18n/*.ts`（这些文件是 sync 的**目标**，不可手改，会被覆盖）。
- **当前状态**：yaml 里所有 ✏️ 文案字段都是空字符串 `""`，说明这是一次**全量文案重写**的中途状态（对应未跟踪的 `crucible-archive/2026-08-11-0225-rewrite-all-copy-rollback/`，名字暗示有过一次"rewrite-all-copy 回滚"）。

---

## 关键文件路径速查

| 用途 | 路径 |
|---|---|
| 根配置 | `/Users/munich/Desktop/独立项目/magical-girls/package.json` |
| 项目说明 | `.../README.md`、`.../CLAUDE.md`、`.../spec.md`、`.../AGENTS.md` |
| Next 配置（`/` rewrite 证据） | `.../next.config.ts` |
| 根布局 | `.../src/app/layout.tsx` |
| 答题主页面 | `.../src/app/test/page.tsx` |
| 答题/结果组件 | `.../src/components/{TestScreen,ResultScreen,RadarChart,DimensionBar}.tsx` |
| 引擎 pack（witch-trial） | `.../src/content/packs/witch-trial/{config,index}.ts` |
| 小圆 pack（跨 IP） | `.../src/content/packs/madoka/config.ts` |
| IP 注册表 | `.../src/content/packs/ip-registry.ts` |
| Pack 加载/类型 | `.../src/pack/{load,types,shuffle}.ts` |
| 后端 API | `.../src/app/api/{quiz,match,results,count,admin/*}/route.ts` |
| 题库/人格（sync 目标，勿手改） | `.../src/data/quiz-content.ts` |
| 四语言（sync 目标） | `.../src/i18n/{en,ja,zh-CN,zh-TW}.ts` |
| **文案权威源（未跟踪）** | `.../content/content.yaml`、`.../content/README.md` |
| sync 脚本（未跟踪） | `.../scripts/{sync-content,dump-content,verify-rewrite}.ts` |
| 历史文案备份 | `.../backups/`、`.../crucible-archive/` |

**一点提醒**：`/test` 的 `handleRestart` 用 `window.location.href = "/"` 跳回，而 `/` 是静态 `index.html` rewrite——这条链路依赖 `public/index.html` 存在（未在本次核查的文件列表中确认，如需可进一步查 `public/`）。
