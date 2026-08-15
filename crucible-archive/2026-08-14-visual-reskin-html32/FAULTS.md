# FAULTS.md · visual-reskin-html32

## F1 · E2E 全红假阳性（环境残留，非代码 bug）
- **阶段**：3b-implement 集成验证
- **现象**：首跑 `pnpm playwright test` 几乎全红（admin/keyboard/quiz/result/loading/frontend 全 ✘，连与答题无关的 admin 也红）
- **根因**：之前 session 残留的旧 server（PID 18895 `next start -p 3010`，旧代码）占着 3010。playwright `reuseExistingServer:true` 复用旧 server，curl /test 返回 200 但无 bg-canvas/aurora 痕迹（旧代码）。测试断言期望新代码 DOM → 全红。
- **处置**：kill 18922/18895 释放 3010，重跑 playwright（webServer 重新 build+standalone 跑新代码）
- **教训**：跨 session 的后台 server 残留 + reuseExistingServer 是 E2E 全红假阳性的经典模式。诊断线索：与改动无关的测试（admin）也红 = 环境而非代码。以后 E2E 全红先查端口占用/curl 验证 server 代码版本，再怀疑实现。
- **状态**：重跑中（exec_b804006c）

## F2 · IM2/IM3 首次调用 streaming 中断
- **阶段**：3b-implement 第二波
- **现象**：IM2/IM3 Agent 调用在 streaming recovery 期间被中断，文件未创建
- **处置**：文件系统确认未执行（BackgroundLayers/AuroraBurst 不存在），全新上下文重 spawn 4 个并行成功
- **状态**：已恢复，无损失
