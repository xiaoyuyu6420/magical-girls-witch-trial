# content/ — 文案权威源

> **这个目录里的 `content.yaml` 是整个项目文案的唯一权威源。**
> 别的 Agent（或人）只编辑这个 yaml，跑一次 sync，全项目（DB + 代码 + 四语言）立即同步。

## 怎么用（3 步）

1. **编辑 `content.yaml`**——填空字符串、改文案、加翻译
2. **跑同步**：
   ```bash
   pnpm exec tsx scripts/sync-content.ts
   ```
3. **看效果**：刷新 http://localhost:3010（dev server 自动热更新；DB 改动立即生效）

## yaml 结构（必读）

```yaml
_meta:        # 说明 + 规则
questions:    # 26 题（题库）
  - _index: 1
    _dim: 🔒 S1           # 🔒 = 结构字段，绝对不能改
    _type: 🔒 normal
    meta: ✏️ 评判·抗拒      # ✏️ = 文案字段，在这里改
    text: ""               # 题干（中文权威源）
    options:
      - _score: 🔒 1
        label: ""          # 选项文案
characters:   # 25 角色（16 witch-trial 原创 + 5 madoka + 4 觉醒变体隐藏角色）
  - _code: 🔒 EMMA
    _vector: "🔒 LHH-LLM-HHH-LLL"   # 12 维向量（结构字段）
    slogan: ""
    desc: ""
    keywords: ""
ui:          # 四语言 UI 文案（welcome/result/buttons 等）
  zh-CN: { ... }
  en: { ... }
  ja: { ... }
  zh-TW: { ... }
```

## 🔒 vs ✏️（最重要）

| 标记 | 含义 | 改了会怎样 |
|------|------|-----------|
| 🔒 | 结构字段（dim/type/score/value/trigger/vector/code/group 等） | **绝对不能改**——sync 会校验，改了报错退出；强改会破坏评分算法 |
| ✏️ | 文案字段（meta/text/label/slogan/desc/keywords） | 随便改，这就是你来填的 |
| 无前缀 | 普通文案值 | 直接填 |

## 哪些是 🔒 结构字段（不要碰）

- 题目：`_dim`（维度）、`_type`（normal/gate/trigger）、`_score`（分值）、`_value`（门控值 destroy/seen/peace/undecided）、`_trigger`（触发标记 SPECIAL_A）、`weight::` 开头的 label（砝码编码）
- 角色：`_code`、`_name`、`_group`、`_vector`、`_subtitle`、`_source`
- 题目顺序：26 题的排列顺序（1-12 正向 / 13-17 反向 / 18 门控 / 19 触发 / 20-26 反向；第 8/22 是天平题各 2 选项；第 14 是砝码题 7 选项 weight:: 编码）

## 哪些是 ✏️ 文案字段（你来填）

- 题目：`meta`（题目标题，如"评判·抗拒"）、`text`（题干）、`options[].label`（选项）
- 角色：`slogan`、`desc`、`keywords`
- UI：`ui.{locale}.{key}` 的值（welcome/result/test 等所有界面文案）

## 四语言

- `zh-CN` 是中文权威源（先填好）
- `en` / `ja` / `zh-TW` 是翻译（zh-CN 定稿后再翻）
- 四个语言的 key 结构必须一致（sync 会保留 key，只改 value）

## 工具脚本

| 脚本 | 作用 |
|------|------|
| `pnpm exec tsx scripts/sync-content.ts` | **核心**——yaml → DB + 代码 + i18n（同步） |
| `pnpm exec tsx scripts/dump-content.ts` | 现状 → yaml（反生成模板，已不用，除非要重新建 yaml） |
| `pnpm exec tsx scripts/verify-rewrite.ts gates` | 校验——结构字段未被改、四语言 key 一致、字数、IP 词扫描 |

## 注意

- **改完 yaml 一定跑 sync**——只改 yaml 不跑 sync，项目看不到
- **跑 sync 后不需要重启 dev server**（DB 改动立即生效；i18n 文件 webpack 自动热更新）
- **不要直接改 `src/data/quiz-content.ts` 或 `src/i18n/*.ts`**——它们是 sync 的目标，会被 yaml 覆盖；改了等于白改
- 如果 `pnpm exec tsx prisma/seed.ts`（重新 seed 数据库），DB 会被 `quiz-content.ts` 的值覆盖（空骨架）；这时再跑一次 sync 就恢复

## 备份

旧文案（重写前 + 重写后的版本）在项目根 `backups/` 和 `crucible-archive/` 里，需要参考历史文案可以解压查看。
