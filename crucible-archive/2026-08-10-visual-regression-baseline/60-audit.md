# 60-audit — e2e 视觉回归基线审计（检查点②）

> 2026-08-10。审计者对照 `10-intent-contract.md` 6 维度 + 完成判定。
> 含原审计（FIX-AND-RE-AUDIT）+ 修复 + 编排者复审。

## 原审计判定：FIX-AND-RE-AUDIT（rework_budget=1）

审计者发现 1 个 CRITICAL：welcome 4 条基线（zh/en/ja desktop + zh mobile）是**纯粉色色块**（SHA 完全相同，4254 字节，无任何 UI 内容）。

**根因**：`maskWelcomeDynamic` mask 了 `#abyss-canvas`，但 canvas CSS 是 `width:100%;height:100%`（全屏），Playwright mask 作用于元素的几何 bounding box（覆盖所有 z-index），mask 全屏 canvas = mask 整个视口。welcome 是首页最核心视觉资产却完全不被保护。

**编排者独立核验**（确认审计发现非编造）：
- welcome desktop zh/en/ja 三基线 SHA 完全相同（`0a981c03...`），4254 字节
- welcome mobile 2103 字节
- 对比 test/result 基线 71-120KB（真实内容）
- `#abyss-canvas` CSS 确认 `width:100%;height:100%`

**红蓝盲区**：红方和编排者的验证都看"测试全绿"但没检查基线 PNG 内容——粉色对粉色永远一致，这是假阳性绿灯。审计者的独立验证捕获了这个所有人漏掉的问题。

## 修复（编排者应用，rework_budget=1）

**策略变更**：canvas 从"L1 mask"改为"截图前 visibility:hidden"。

- `maskWelcomeDynamic`：移除 `page.locator("#abyss-canvas")`，保留其余 6 个小区域 mask
- 新增 `hideCanvasForScreenshot(page)`：截图前 `canvas.style.visibility = "hidden"`（canvas 是 absolute 背景层，隐藏不影响任何布局）
- `prepareWelcomeForScreenshot`：末尾调用 `hideCanvasForScreenshot`
- README L1 策略说明同步更新

**为何 visibility:hidden 而非 mask**：canvas 是全屏背景层，mask 它的 bounding box 覆盖整个视口。visibility:hidden 让 canvas 不渲染（不占像素），hero（z-index:20）等所有内容正常可见且可被截图捕获。

## 修复验证（编排者独立执行）

| 验证项 | 修复前 | 修复后 | 判定 |
|---|---|---|---|
| welcome desktop zh 基线大小 | 4254 B（粉色） | 574368 B | ✅ 真实内容 |
| welcome desktop en 基线大小 | 4254 B（粉色） | 575951 B | ✅ 真实内容 |
| welcome desktop ja 基线大小 | 4254 B（粉色） | 580215 B | ✅ 真实内容 |
| welcome mobile zh 基线大小 | 2103 B（粉色） | 330881 B | ✅ 真实内容 |
| zh/en/ja SHA 互不相同 | 全相同（无效） | 3 个不同 SHA | ✅ 语言差异被捕获 |
| welcome 连续 3 次一致 | 假性（粉色对粉色） | 真实内容 3 次一致 | ✅ 真实稳定 |
| 改 --fg 触发 welcome FAIL | 不可能（粉色） | 7455 pixels diff, FAIL | ✅ 视觉回归生效 |

## 最终 6 维度判定（修复后复审）

| 维度 | 判定 | 关键证据 |
|---|---|---|
| 1 完整性 | **PASS** | R1-R16 均有实现 |
| 2 正确性 | **PASS** | 7 基线全是真实内容（71-580KB），zh/en/ja SHA 不同，改 CSS 能触发 FAIL |
| 3 多余 | **PASS** | 非目标均未偷实现 |
| 4 约束 | **PASS** | src/、public/index.html、现有 15 spec 未改，无新依赖 |
| 5 副作用 | **PASS** | 普通 chromium 108 e2e，0 visual 混入 |
| 6 意图对齐 | **PASS** | 「视觉回归自动检测 UI 变化」对所有 3 屏（welcome/test/result）都成立 |

## 完成判定逐条核验（修复后）

| # | 判定 | 证据 |
|---|---|---|
| 1 | **PASS** | tests/visual/ 3 个 .visual.spec.ts，现有 15 spec 未改 |
| 2 | **PASS** | 7 条有效基线（welcome zh/en/ja desktop + welcome zh mobile + test desktop/mobile + result desktop），全 71-580KB 真实内容 |
| 3 | **PASS** | `git check-ignore` 确认 __screenshots__/ 下 PNG 未被忽略 |
| 4 | **PASS** | .gitignore 反向规则 `!tests/visual/__screenshots__/**` |
| 5 | **PASS** | `--project=visual --project=visual-mobile` 7 passed 3 skipped |
| 6 | **PASS** | `--update-snapshots` 能更新基线（已多次使用） |
| 7 | **PASS** | 改 globals.css `--accent` 触发 result FAIL；改 index.html `--fg` 触发 welcome FAIL；产出 expected/actual/diff 三图 |
| 8 | **PASS** | welcome zh-CN 连续 3 次一致（真实内容，非粉色） |
| 9 | **PASS** | 普通 chromium 108 e2e，testIgnore 排除 visual |
| 10 | **PASS** | README 文档化 L1/L2/L3 协议、容差策略（含 result 例外）、mask 语义警告 |

## 最终判定：**PASS（目标达成）**

**reason**：审计发现的 1 个 CRITICAL（welcome 基线无效粉色色块）已在 rework_budget=1 内修复并独立验证。修复后 6 维度全 PASS，完成判定 1-10 全 PASS。7 条基线全是真实内容，视觉回归对 welcome/test/result 三屏都能自动检测 UI 变化。核心意图「e2e 视觉回归基线」完全达成。

**nextAction**: none（目标达成，可交付）。
