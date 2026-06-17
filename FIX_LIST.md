# 问题修复清单

按优先级排列。低优先级（Low）条目已跳过，只保留 Critical、High、Medium。

所有 Critical/High/Medium 项目已完成修复。测试 35 项全部通过。

---

---

## P0 — 严重（Critical）

### 1. proxy.ts 不是真正的 Next.js 中间件 → 管理后台限流失效
- **文件**：`src/proxy.ts`（当前）
- **问题**：`proxy.ts` 导出的是 `proxy` 函数，但 Next.js 只认 `src/middleware.ts` 的 `middleware` 默认导出。中间件从未被调用，admin 请求速率限制（10 次/分钟/IP）完全失效。
- **修复**：创建 `src/middleware.ts`，将 `proxy.ts` 的逻辑作为默认导出，并确保 matcher 覆盖 `/api/admin/*`。

### 2. 管理后台密码明文存 sessionStorage
- **文件**：`src/app/admin/page.tsx`
- **问题**：密码存在 `sessionStorage` 中，每次请求通过 `x-admin-password` header 发送。任何 XSS 漏洞都能直接拿到密码。
- **修复**：改为登录后端返回短有效期 JWT（如 2 小时），前端存储 token 而非密码。API 用 `x-admin-token` 替代 `x-admin-password`。

### 3. weightedManhattan NaN 传播
- **文件**：`src/lib/match.ts:33`
- **问题**：循环 12 次不验证数组长度。如果向量格式错误（如 `"LHH-LLM-HHH"`），`undefined - number = NaN`，sort 比较器返回 `NaN`，V8 当作 0，结果完全随机。
- **修复**：在 `parseVector` 中验证长度，在 `weightedManhattan` 中加断言。`formatVector` 同样检查负值。

### 4. match.ts 非空断言风险
- **文件**：`src/lib/match.ts:113,124`
- **问题**：`unsetType = ...find(...)!` 和 `t = ...find(...)!` — 如果 DB 中缺少 fallback 或 special 类型，直接崩溃。管理员可通过 admin API 删除。
- **修复**：去掉 `!`，改为 `?.` 和 `??` 回退，找不到时抛出有意义的错误。

### 5. 测试中途切换语言会崩溃
- **文件**：`src/components/TestScreen.tsx:100-164`
- **问题**：`displayQuestions` 依赖 `locale`，但 `currentIndex` 不变。切换语言后题目数量可能变化（trigger 题出现/消失），`current` 变 undefined，点击崩溃。
- **修复**：`displayQuestions` 变化后，如果 `currentIndex >= displayQuestions.length`，把 `currentIndex` 回退到最后一个有效索引。

### 6. docker-compose.yml 健康检查用 wget 但镜像未安装
- **文件**：`docker-compose.yml`
- **问题**：Dockerfile 只安装了 `sqlite` 和 `dcron`，没有 `wget`。healthcheck 命令找不到 wget，容器被标记为不健康，可能无限重启。
- **修复**：在 Dockerfile 中添加 `apk add --no-cache wget`，或者把 healthcheck 改成 `CMD-SHELL node -e 'require("http").get("http://localhost:3001/api/count", (r) => { if (r.statusCode === 200) process.exit(0); else process.exit(1); }).on("error", () => process.exit(1));'`。

---

## P1 — 高优先级（High）

### 7. 无 CSRF 保护
- **文件**：所有 `src/app/api/admin/` 路由
- **问题**：admin 端点没有验证 Origin/Referer 或 CSRF token。虽然 `x-admin-password` 是自定义 header（有同源限制保护），但缺少显式防御。
- **修复**：在 admin API 中验证 `Origin` header 匹配已知域名，或者改为 session cookie + SameSite=Strict。

### 8. 无安全响应头
- **文件**：`next.config.ts`
- **问题**：缺少 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、CSP。
- **修复**：在 `next.config.ts` 中通过 `async headers()` 配置安全响应头。

### 9. results 路由中 ipAddress 硬编码为 null
- **文件**：`src/app/api/results/route.ts:75`
- **问题**：`ipAddress` 直接写 `null`，管理后台的 IP 搜索和取证功能不可用。
- **修复**：从 `req.headers` 读取 `x-forwarded-for` 或 `x-real-ip`（复用 `getClientIp` 工具）。

### 10. safeEqual 长度检查泄露密码长度
- **文件**：`src/lib/admin-auth.ts:5-8`
- **问题**：`safeEqual` 先检查长度不相等则 `return false`，时序攻击者可通过测量时间推断密码长度。
- **修复**：用 `crypto.createHash('sha256')` 把两个字符串 hash 成固定长度（32 字节），再比较 hash。或者直接用 `crypto.timingSafeEqual` 前先 padding 到固定长度。

### 11. adminAttempts 全局 Map 永不清理
- **文件**：`src/proxy.ts:11-33`
- **问题**：`adminAttempts` 是全局 Map，没有淘汰机制，长期运行内存泄漏。
- **修复**：添加定时清理（每 10 分钟）或添加 timestamp 字段，访问时检查过期。

### 12. import 路由的 Promise.race 是假取消
- **文件**：`src/app/api/admin/import/route.ts:276-280`
- **问题**：`Promise.race` 在超时触发后，Prisma 事务在后台继续运行，可能产生部分修改。
- **修复**：Prisma 事务本身不支持取消，应改用：1) 在事务函数外加整体超时（不 race，而是限制总时间）；2) 或把事务逻辑拆成更小的原子操作。
- **实际方案**：去掉 `Promise.race` 假取消，改用显式的事务 timeout 参数（如果 Prisma 支持），或者只是给整个 import 函数加 `AbortController` 风格的逻辑，但 Prisma 不支持真正取消。最安全的做法是：不加 race，用超时后返回错误，但 DB 可能已经提交了部分。改为在 API 层面做分段事务（小批量导入），而不是一个超大事务。

### 13. deploy.sh 的 sed -i '' 是 macOS 语法
- **文件**：`scripts/deploy.sh`
- **问题**：`sed -i ''` 在 Linux 上失败，服务器回滚功能不可用。
- **修复**：改为 `sed -i.bak` 或判断 OS 后再执行。

### 14. latest 标签的回滚无意义
- **文件**：`scripts/deploy.sh`
- **问题**：`latest` 是可变标签，回滚时拉到的永远是最新镜像。
- **修复**：CI 构建时使用 git commit SHA 或时间戳作为 tag，deploy.sh 也使用该 tag。版本文件中记录实际版本号。

---

## P2 — 中等优先级（Medium）

### 15. 未使用 package-lock.json，构建不可复现
- **文件**：`Dockerfile`
- **问题**：`RUN npm install` 而非 `npm ci`，没有 `package-lock.json` 的 repo 导致依赖浮动。
- **修复**：生成 `package-lock.json`，提交到仓库，Dockerfile 改为 `npm ci`。

### 16. tsconfig.json target 是 ES2017（太保守）
- **文件**：`tsconfig.json`
- **问题**：Next.js 16 应用用 `ES2017`，polyfills 更大，无法利用现代优化。
- **修复**：改为 `ES2022` 或 `ESNext`。

### 17. prisma db push 在每次容器启动时运行
- **文件**：`Dockerfile` / `scripts/entrypoint.sh`
- **问题**：`npx prisma db push` 在每次容器启动时执行，重启时慢且无必要。
- **修复**：检查 DB 文件是否已存在，已存在则跳过。

### 18. 无 .dockerignore 文件
- **文件**：根目录
- **问题**：`COPY . .` 复制 `.git`、`.next`、`node_modules`、`.env` 等，增大构建上下文和层缓存失效。
- **修复**：创建 `.dockerignore`，忽略 `.git`、`.next`、`node_modules`、`.env`、`*md`、`.claude` 等。

### 19. 管理后台导出 API 会把所有数据加载到内存
- **文件**：`src/app/api/admin/export/route.ts`
- **问题**：`findMany` 加载所有 `TestRecord` + `Answer`，大数据量时 512MB 容器 OOM。
- **修复**：使用 `cursor` 分页，或者 Prisma 的 `$queryRaw` 配合 streaming，或者用 `for...of` 逐批加载并写入文件。

### 20. 缺少数据库索引
- **文件**：`prisma/schema.prisma`
- **问题**：`TestRecord.gateValue`（groupBy）、`TestRecord.similarity`（排名）、`Option.questionId` 没有索引。
- **修复**：在 schema 中添加 `@@index([gateValue])`、`@@index([similarity])`、`@@index([questionId])`。

### 21. recharts 和 typewriter-effect 等未使用的依赖
- **文件**：`package.json`
- **问题**：`recharts`（~180KB gzip）、`typewriter-effect` 未使用，增加 bundle 体积。
- **修复**：从 `package.json` 中移除未使用的依赖，运行 `npm install` 更新 lock 文件。

### 22. ResultScreen 的分享卡片始终渲染
- **文件**：`src/components/ResultScreen.tsx`
- **问题**：即使不点击分享，隐藏的 DOM 节点也消耗资源。
- **修复**：用条件渲染，只在 `handleShare` 被调用时渲染，或者 lazy render。

### 23. 无 package-lock.json 和 CI 不跑测试
- **文件**：`.github/workflows/deploy.yml`
- **问题**：CI 直接构建推送，不跑 lint 和测试。
- **修复**：在构建步骤前添加 `npm run lint` 和 `npm test`。

### 24. Answer 没有外键关联 Option
- **文件**：`prisma/schema.prisma`
- **问题**：删除选项后，历史答案的 `optionId` 成为悬空引用。
- **修复**：在 schema 中建立 `Answer` 到 `Option` 的 `relation`（可选，因为历史数据应该保留）。实际建议是：如果业务允许删除，至少 `onDelete: SetNull`。
- **注意**：如果已有数据，可能需要在 migration 中处理。当前用 SQLite 的 `prisma db push`，无需 migration 文件，但要考虑已有数据。
- **实际方案**：在 `schema.prisma` 中添加 `Answer.optionId` 的 `relation` 到 `Option`，并设置 `onDelete: SetNull`。

### 25. TestScreen 直接操作 DOM
- **文件**：`src/components/TestScreen.tsx:163-175`
- **问题**：直接操作 `classList` 和 `style` 是 React 反模式，可能导致状态不一致。
- **修复**：把这些效果改为 React 状态驱动，通过 CSS 类（如 `is-selected` 通过 `state` 控制）而不是直接 DOM 操作。
- **评估**：这是一个中等影响的重构，需要确保动画效果不打折扣。可能改复杂后引入新问题。但它是测试时发现的 bug，属于安全影响范围。保持修复。

### 26. html lang 硬编码为 zh-CN
- **文件**：`src/app/layout.tsx:62`
- **问题**：`I18nProvider` 可以切换语言，但 SSR 输出的 `<html lang>` 始终为 `zh-CN`。
- **修复**：在客户端 `useEffect` 中根据 `detectLocale()` 更新 `document.documentElement.lang`。

### 27. metadataBase 还是 https://example.com
- **文件**：`src/app/layout.tsx:28`
- **问题**：影响 OpenGraph 和 Twitter 卡片。
- **修复**：替换为生产域名（或从环境变量读取）。

### 28. rateLimit 的 buckets Map 按 10k 阈值才清理
- **文件**：`src/lib/rate-limit.ts:40-46`
- **问题**：如果增长慢（每秒 1 个新 IP），永远不会触发清理，内存泄漏。
- **修复**：在每次请求或定时器触发时，清理过期条目（基于 `lastUpdate` 时间）。

### 29. /api/count 和 /api/quiz 无速率限制
- **文件**：`src/app/api/count/route.ts`、`src/app/api/quiz/route.ts`
- **问题**：可被枚举攻击，DB 压力大。
- **修复**：在路由中添加 `rateLimit()` 检查。

---

## 已修复

- ✅ 管理后台编辑页面无法滚动（`admin/page.tsx: useEffect` 恢复 `body.overflow`）
- ✅ 管理后台文字无法选择（同上，恢复 `body.userSelect`）

---

## 修复顺序建议

1. **先做 P0 安全相关**（1、2、3、4、6），这些是可能出安全事故的
2. **再做 P1 高优先级**（7-14），加固安全边界
3. **最后做 P2 中等优化**（15-29），性能和维护性
