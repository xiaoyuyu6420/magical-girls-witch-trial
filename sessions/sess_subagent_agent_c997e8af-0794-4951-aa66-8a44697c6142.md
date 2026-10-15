# 请在只读模式下浏览当前工作目录 /Users/munich/Desktop/独立项目/magical-girls，...

- 会话 ID: `sess_subagent_agent_c997e8af-0794-4951-aa66-8a44697c6142`
- 时间: 2026-08-04 06:35:20 → 2026-08-04 06:43:24
- 工作目录: /Users/munich/Desktop/独立项目/magical-girls
- 消息数: 13
- 归档状态: 未归档

---

## 👤 用户
请在只读模式下浏览当前工作目录 /Users/munich/Desktop/独立项目/magical-girls，给出一份中文概要：项目类型、主要目录/模块、运行/构建/测试命令、数据模型/API/前端页面关系、明显风险或待注意点。不要修改文件。优先读 README、package.json、prisma/schema.prisma、src/app/api、src/lib、src/components 的关键摘要，不要输出大量文件内容。

## 🤖 助手
我将探索这个项目的结构并提供中文概要。让我先查看项目的基本文件和目录结构。

> 🔧 工具调用 4 次: Bash

## 🤖 助手
现在让我查看 API 路由文件的行数结果。

> 🔧 工具调用 3 次: Bash

## 👤 用户
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.

## 🤖 助手
根据对项目目录的只读浏览，以下是中文概要：

---

## 项目类型

**魔法少女的魔女审判** — 一个基于 Next.js 16 的人格测试 Web 应用。用户回答 26 道情境题，通过 12 维向量匹配算法被分配到 16 种人格原型之一。支持中英日繁 4 种语言，包含管理后台。

**技术栈：** Next.js 16 (standalone) + React 19 + Tailwind CSS v4 + Prisma + SQLite + TypeScript + Docker

---

## 主要目录/模块

| 目录 | 功能 |
|------|------|
| `src/app/test/` | 答题和结果页 |
| `src/app/admin/` | 管理后台页面 (约 35KB) |
| `src/app/api/` | 15 个 API 路由 (match、quiz、results、admin/*) |
| `src/components/` | 前端组件 |
| `src/lib/` | 核心算法 |
| `src/data/` | 题库和人格定义 |
| `src/i18n/` | 多语言文件 |
| `prisma/` | 数据库 schema |
| `tests/` | E2E 测试 (15 个 Playwright spec 文件) |
| `scripts/` | 部署/备份脚本 |

**项目规模：** 84 个 TS/TSX 文件，约 4800 行代码 (不含测试)

---

## 运行/构建/测试命令

```bash
# 开发
npm install
cp .env.example .env
npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts
npm run dev                    # 端口 3010

# 构建
npm run build                  # webpack standalone output
npm start                      # 生产端口 3010

# 测试
npm test                       # vitest 单元测试
npx playwright test            # E2E 测试

# 管理 API (需 x-admin-password header)
curl -H "x-admin-password: $ADMIN_PASSWORD" http://localhost:3010/api/admin/stats
```

---

## 数据模型/API/前端页面关系

**数据模型**：
- `Question` (26 道题，含 `type`: normal/gate/trigger)
- `Option` (每题选项，含 score 和 trigger 字段)
- `PersonalityType` (16 种人格，含 12 维向量如 "LHH-LLM-HHH-LLL")
- `TestRecord` (测试记录，含 sessionId、userVector、similarity 等)
- `Answer` (每题答案)

**核心流程**：
```
public/index.html (静态首页) 
    → /test (TestScreen 答题)
    → POST /api/match (服务端验证 + 算法匹配)
    → ResultScreen 展示结果
    → localStorage 持久化进度
```

**关键 API**：
- `/api/quiz` - 获取题库
- `/api/match` - 提交答案，服务端重新计算维度分，返回匹配结果
- `/api/results` - 查询历史结果
- `/api/admin/*` - 管理后台 (需密码认证)

**算法核心** (`src/lib/match.ts`)：
- 12 维向量 (L/M/H/X 四档)
- 加权曼哈顿距离匹配
- 门控题 触发不同分支
- 特殊人格 触发机制
- 边界检测 (前两名相似度过近时标记)

---

## 明显风险或待注意点

### 安全相关
1. **密码明文传输** — 管理密码通过 `x-admin-password` header 明文传输，README 建议部署 HTTPS，后续可改用 JWT/session
2. **IP 获取需配置** — 需根据部署环境设置 `TRUSTED_PROXY` 环境变量，防止 `x-forwarded-for` 伪造

### 架构相关
3. **Rate Limit 内存存储** — 单实例可接受，多实例需改用 Redis
4. **SQLite 限制** — 适合小规模，高并发需考虑 PostgreSQL
5. **首页绕过 Next 运行时** — `/` 重写到静态 `public/index.html` 以优化 TTI，但缺少 SSR 能力

### 平台兼容
6. **跨平台构建问题** — Prisma client 和 lightningcss native binary 是平台特定的，切换 OS 后需重新运行 `npx prisma generate` 和 `npm install`

### 部署相关
7. **Docker 镜像国内加速** — README 提到需配置阿里云镜像加速
8. **数据库文件位置** — Docker 部署时在 `./data/witch-trial.db`，需正确挂载卷

### 其他
9. **隐藏人格触发条件** — 代码中有特殊人格触发逻辑，不是随机分配
10. **E2E 测试文件数量多** — 15 个 spec 文件覆盖全面，但测试运行时间可能较长

---

**总体评估：** 项目结构清晰，代码质量较高 (README 提到已完成多项优化)，适合单人或小团队维护。主要风险集中在安全性和部署配置上，需在生产环境启用 HTTPS 并正确配置代理信任。
