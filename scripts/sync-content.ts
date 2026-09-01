/**
 * sync-content.ts — 把 content/content.yaml 同步到项目（DB + 代码文件）
 *
 * 用法：pnpm exec tsx scripts/sync-content.ts
 *
 * 同步目标：
 *   1. DB（Question/Option/PersonalityType 表）—— API 渲染立即生效
 *   2. src/data/quiz-content.ts（题库 seed 源）
 *   3. src/content/packs/madoka/config.ts（madoka 角色 seed 源）
 *   4. src/i18n/{zh-CN,en,ja,zh-TW}.ts（UI 文案 + 翻译源，含 nf/err 段）
 *   5. DB CopyEntry 表（全站文案调配中心：ui/home/nf/err × 四语言，/api/copy 分发）
 *
 * yaml 是权威源——只读 yaml，按 yaml 覆盖以上目标。
 * 🔒 字段（结构）会被验证未被改动，改了即报错退出。
 */
import * as ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { parse as yamlParse } from "yaml";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(__dirname, "..");
const YAML_FILE = path.join(ROOT, "content", "content.yaml");

interface YamlQuestion {
  _index: number;
  _dim: string;
  /** 12 维维度代码（🔒 结构字段）：S1-F3/B1-B3/W1-W3 或 GATE/TRIGGER */
  _dim_code?: string;
  _type: string;
  meta: string;
  text: string;
  options: { _score: string; _value?: string; _trigger?: string; label: string }[];
}
interface YamlChar {
  _code: string;
  _name: string;
  _group: string;
  _vector: string;
  _subtitle?: string;
  _source: string;
  slogan: string;
  desc: string;
  keywords?: string;
  prosecution?: string;
  softlanding?: string;
  tags?: string;
}

const doc = yamlParse(fs.readFileSync(YAML_FILE, "utf8")) as {
  questions: YamlQuestion[];
  characters: YamlChar[];
  ui: Record<string, Record<string, unknown>>;
  home?: Record<string, Record<string, unknown>>;
  system?: Record<string, { nf?: Record<string, unknown>; err?: Record<string, unknown> }>;
};

// ---- AST helpers ----
function sfOf(file: string) {
  return ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}
function stripLock(s: string): string {
  // 去 "🔒 " / "✏️ " 前缀和括号注释
  return String(s ?? "").replace(/^[🔒✏️]+\s*/u, "").replace(/\s*\(编码.*\)$/, "").trim();
}
function stripEditable(s: string): string {
  // ✏️ 是内容编辑标记，不应进入运行时题面或数据库。
  return String(s ?? "").replace(/^✏️\s*/u, "").trim();
}
function runtimeQuestionFields(question: YamlQuestion): { meta: string; text: string } {
  const lockedDim = stripLock(question._dim);
  // 普通 NQ 题在 YAML 中用 _dim 保存锁定的题号标题，用 meta 保存可编辑题干。
  // scale / weight / gate / trigger 则直接使用各自的 meta + text 字段。
  if (/^Q\d+\s*·/u.test(lockedDim)) {
    return { meta: lockedDim, text: stripEditable(question.meta) };
  }
  return { meta: stripEditable(question.meta), text: stripEditable(question.text) };
}
function expectLock(s: string, field: string, expected: string, ctx: string) {
  const v = stripLock(s);
  if (v !== expected) {
    console.error(`[结构错误] ${ctx} ${field}: yaml="${v}" 期望="${expected}"`);
    console.error(`  🔒 结构字段不能改！改了会破坏评分算法。`);
    process.exit(1);
  }
}

// ---- 1) 更新 quiz-content.ts + madoka config（AST 字符串值替换）----
function updateTsFile(file: string, varName: string, kind: "questions" | "types") {
  const sf = sfOf(file);
  const targets: { start: number; end: number; newVal: string }[] = [];
  let arrIdx = -1;

  function visitQuestions(elem: ts.Node, expected: YamlQuestion) {
    arrIdx++;
    const fields = runtimeQuestionFields(expected);
    if (ts.isCallExpression(elem)) {
      // NQ(dim, meta, text, options)：args[0] 是 12 维维度代码（_dim_code），args[1] 是题号标题，args[2] 是可编辑题干。
      const args = elem.arguments;
      expectLock(expected._dim_code ?? expected._dim, "dim_code", strVal(args[0]) ?? "", `第${arrIdx + 1}题`);
      if (args[2] && ts.isStringLiteral(args[2])) targets.push({ start: args[2].getStart(sf), end: args[2].getEnd(), newVal: JSON.stringify(fields.text) });
      const optsArr = args[3];
      if (optsArr && ts.isArrayLiteralExpression(optsArr)) {
        optsArr.elements.forEach((o, i) => {
          if (expected.options[i]) {
            const opt = expected.options[i];
            // weight:: 编码 label 不动（yaml 里标 🔒）
            if (opt.label.startsWith("🔒") || opt.label.includes("weight::")) return;
            if (ts.isStringLiteral(o)) {
              targets.push({ start: o.getStart(sf), end: o.getEnd(), newVal: JSON.stringify(opt.label) });
            } else if (ts.isObjectLiteralExpression(o)) {
              const lblNode = propOf(o, "label");
              if (lblNode && ts.isStringLiteral(lblNode)) targets.push({ start: lblNode.getStart(sf), end: lblNode.getEnd(), newVal: JSON.stringify(opt.label) });
            }
          }
        });
      }
    } else if (ts.isObjectLiteralExpression(elem)) {
      for (const p of elem.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const name = p.name.getText();
        if (name === "meta" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(fields.meta) });
        else if (name === "text" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(fields.text) });
        else if (name === "options" && ts.isArrayLiteralExpression(p.initializer)) {
          p.initializer.elements.forEach((o, i) => {
            if (!ts.isObjectLiteralExpression(o) || !expected.options[i]) return;
            const opt = expected.options[i];
            if (opt.label.startsWith("🔒") || opt.label.includes("weight::")) return;
            const lblNode = propOf(o, "label");
            if (lblNode && ts.isStringLiteral(lblNode)) targets.push({ start: lblNode.getStart(sf), end: lblNode.getEnd(), newVal: JSON.stringify(opt.label) });
          });
        }
      }
    }
  }

  function visitTypes(elem: ts.Node, expected: YamlChar) {
    if (!ts.isObjectLiteralExpression(elem)) return;
    for (const p of elem.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const name = p.name.getText();
      if (name === "slogan" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.slogan) });
      else if (name === "desc" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.desc) });
      else if (name === "keywords" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.keywords ?? "") });
      else if (name === "prosecution" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.prosecution ?? "") });
      else if (name === "softlanding" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.softlanding ?? "") });
      else if (name === "tags" && ts.isStringLiteral(p.initializer)) targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(expected.tags ?? "") });
    }
  }

  let qIdx = -1;
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== varName || !decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const elem of decl.initializer.elements) {
        if (kind === "questions") {
          qIdx++;
          const expected = doc.questions[qIdx];
          if (expected) visitQuestions(elem, expected);
        } else {
          // types: witch-trial (16) 或 madoka (5)，按 source 过滤
          // 简化：按 code 匹配
          const code = ts.isObjectLiteralExpression(elem) ? strVal(propOf(elem, "code")) : null;
          const expected = code ? doc.characters.find((c) => stripLock(c._code) === code) : null;
          if (expected) visitTypes(elem, expected);
        }
      }
    }
  }

  // 从后往前替换
  targets.sort((a, b) => b.start - a.start);
  let src = fs.readFileSync(file, "utf8");
  for (const t of targets) src = src.slice(0, t.start) + t.newVal + src.slice(t.end);
  fs.writeFileSync(file, src);
  console.log(`  ✓ ${path.relative(ROOT, file)}: ${targets.length} 处文案更新`);
}

function strVal(n: ts.Node | undefined): string | null {
  return n && ts.isStringLiteral(n) ? n.text : null;
}
function propOf(obj: ts.ObjectLiteralExpression, name: string): ts.Node | undefined {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
  }
  return undefined;
}

// ---- 2) 更新 i18n 四语言（AST StringLiteral 值替换，按 key 路径）----
function updateI18n(locale: string, file: string, uiData: Record<string, unknown>) {
  const sf = sfOf(file);
  const targets: { start: number; end: number; newVal: string; path: string }[] = [];
  function visit(obj: ts.ObjectLiteralExpression, prefix: string, data: Record<string, unknown>) {
    for (const p of obj.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const k = p.name.getText();
      const full = prefix ? `${prefix}.${k}` : k;
      if (ts.isObjectLiteralExpression(p.initializer)) {
        const sub = (data as Record<string, Record<string, unknown>>)[k];
        if (sub && typeof sub === "object") visit(p.initializer, full, sub as Record<string, unknown>);
      } else if (ts.isStringLiteral(p.initializer)) {
        const v = (data as Record<string, unknown>)[k];
        // 跳过 questions/gate/trigger 数组（这些是题库翻译，单独处理）
        if (k === "questions" || k === "gate" || k === "trigger") continue;
        if (typeof v === "string") {
          targets.push({ start: p.initializer.getStart(sf), end: p.initializer.getEnd(), newVal: JSON.stringify(v), path: full });
        }
      }
    }
  }
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        // nf/err（404 页 + 异常态）骨架在 i18n 文件里，值从 yaml system 段取
        const data = {
          ...uiData,
          ...(doc.system?.[locale]?.nf ? { nf: doc.system[locale].nf } : {}),
          ...(doc.system?.[locale]?.err ? { err: doc.system[locale].err } : {}),
        };
        visit(decl.initializer, "", data);
      }
    }
  }
  // i18n questions/gate/trigger 数组（题库翻译）从 yaml.ui.{locale}.questions 等取
  // 简化：这部分由 seed-translations 从 i18n 同步到 DB，i18n 本身的 questions 数组可保持空骨架
  targets.sort((a, b) => b.start - a.start);
  let src = fs.readFileSync(file, "utf8");
  for (const t of targets) src = src.slice(0, t.start) + t.newVal + src.slice(t.end);
  fs.writeFileSync(file, src);
  console.log(`  ✓ ${path.relative(ROOT, file)}: ${targets.length} 处 UI 文案更新`);
}

// ---- 3) 更新 DB（渲染立即生效）----
async function updateDB() {
  const prisma = new PrismaClient();
  try {
    const dbQuestions = await prisma.question.findMany({ include: { options: true }, orderBy: { order: "asc" } });
    const dbTypes = await prisma.personalityType.findMany();
    let qUpdated = 0;
    let oUpdated = 0;
    const normalQs = dbQuestions.filter((q) => q.type !== "gate" && q.type !== "trigger");
    const gateQ = dbQuestions.find((q) => q.type === "gate");
    const trigQ = dbQuestions.find((q) => q.type === "trigger");
    const yamlNormalQs = doc.questions.filter((q) => !stripLock(q._type).startsWith("gate") && !stripLock(q._type).startsWith("trigger"));
    for (let i = 0; i < normalQs.length; i++) {
      const dbQ = normalQs[i];
      const yq = yamlNormalQs[i];
      if (!dbQ || !yq) continue;
      const fields = runtimeQuestionFields(yq);
      await prisma.question.update({ where: { id: dbQ.id }, data: fields });
      qUpdated++;
      for (let j = 0; j < dbQ.options.length; j++) {
        const dbO = dbQ.options[j];
        const yo = yq.options[j];
        if (!dbO || !yo) continue;
        if (yo.label.startsWith("🔒") || yo.label.includes("weight::")) continue;
        await prisma.option.update({ where: { id: dbO.id }, data: { label: stripEditable(yo.label) } });
        oUpdated++;
      }
    }
    // gate/trigger
    if (gateQ) {
      const yGate = doc.questions.find((q) => stripLock(q._type).startsWith("gate"));
      if (yGate) {
        await prisma.question.update({ where: { id: gateQ.id }, data: runtimeQuestionFields(yGate) });
        qUpdated++;
        for (let j = 0; j < gateQ.options.length; j++) {
          const yo = yGate.options[j];
          if (yo && !yo.label.startsWith("🔒")) await prisma.option.update({ where: { id: gateQ.options[j].id }, data: { label: stripEditable(yo.label) } });
        }
      }
    }
    if (trigQ) {
      const yTrig = doc.questions.find((q) => stripLock(q._type).startsWith("trigger"));
      if (yTrig) {
        await prisma.question.update({ where: { id: trigQ.id }, data: runtimeQuestionFields(yTrig) });
        qUpdated++;
        for (let j = 0; j < trigQ.options.length; j++) {
          const yo = yTrig.options[j];
          if (yo && !yo.label.startsWith("🔒")) await prisma.option.update({ where: { id: trigQ.options[j].id }, data: { label: stripEditable(yo.label) } });
        }
      }
    }
    // 角色
    let tUpdated = 0;
    for (const dbT of dbTypes) {
      const yt = doc.characters.find((c) => stripLock(c._code) === dbT.code);
      if (!yt) continue;
      await prisma.personalityType.update({
        where: { id: dbT.id },
        data: {
          slogan: yt.slogan,
          desc: yt.desc,
          keywords: yt.keywords ?? null,
          prosecution: yt.prosecution ?? "",
          softlanding: yt.softlanding ?? "",
          tags: yt.tags ?? "",
        },
      });
      tUpdated++;
    }
    console.log(`  ✓ DB: ${qUpdated} 题 / ${oUpdated} 选项 / ${tUpdated} 角色更新`);
  } finally {
    await prisma.$disconnect();
  }
}

// ---- 4) 全站文案入库（CopyEntry 调配中心）----
// ui → 测试/结果页界面文案；home → 首页；system.nf/err → 404/错误态。
// 只写非空值（空 = 回退代码内置默认）；yaml 非空值覆盖 DB（yaml 是种子权威）。
function flattenCopy(obj: Record<string, unknown>, prefix = ""): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    // 去掉 yaml 键上的防御性引号（如 '"witch-trial"' → witch-trial），与运行时对象键一致
    const path = (prefix ? `${prefix}.${k}` : k).replaceAll('"', "");
    if (v != null && typeof v === "object") out.push(...flattenCopy(v as Record<string, unknown>, path));
    else if (typeof v === "string" && v.trim() !== "") out.push({ key: path, value: v });
  }
  return out;
}

async function updateCopyDB() {
  const prisma = new PrismaClient();
  try {
    // 清理历史脏键（yaml 防御性引号曾漏进键名，如 works."witch-trial".title）
    await prisma.copyEntry.deleteMany({ where: { key: { contains: '"' } } });
    let count = 0;
    const upsertAll = async (group: string, locale: string, pairs: { key: string; value: string }[]) => {
      for (const { key, value } of pairs) {
        await prisma.copyEntry.upsert({
          where: { key_locale: { key, locale } },
          update: { group, value },
          create: { group, key, locale, value },
        });
        count++;
      }
    };
    for (const locale of ["zh-CN", "en", "ja", "zh-TW"] as const) {
      // ui：跳过题库翻译容器（questions/gate/trigger 是死骨架/数组，另走题目管线）
      const uiData = Object.fromEntries(
        Object.entries(doc.ui[locale] ?? {}).filter(([k]) => k !== "questions" && k !== "gate" && k !== "trigger"),
      );
      await upsertAll("ui", locale, flattenCopy(uiData));
      if (doc.home?.[locale]) await upsertAll("home", locale, flattenCopy(doc.home[locale]));
      if (doc.system?.[locale]?.nf) await upsertAll("nf", locale, flattenCopy(doc.system[locale].nf));
      if (doc.system?.[locale]?.err) await upsertAll("err", locale, flattenCopy(doc.system[locale].err));
    }
    console.log(`  ✓ DB CopyEntry: ${count} 条文案入库（ui/home/nf/err × 四语言）`);
  } finally {
    await prisma.$disconnect();
  }
}

// ---- main ----
(async () => {
  console.log("=== sync-content: yaml → 项目 ===");
  console.log("1) 更新代码文件（seed 源 + i18n）");
  updateTsFile(path.join(ROOT, "src/data/quiz-content.ts"), "QUESTIONS", "questions");
  updateTsFile(path.join(ROOT, "src/data/quiz-content.ts"), "PERSONALITY_TYPES", "types");
  updateTsFile(path.join(ROOT, "src/content/packs/madoka/config.ts"), "MADOKA_TYPES", "types");
  for (const loc of ["zh-CN", "en", "ja", "zh-TW"] as const) {
    updateI18n(loc, path.join(ROOT, `src/i18n/${loc}.ts`), doc.ui[loc]);
  }
  console.log("\n2) 更新 DB（渲染立即生效）");
  await updateDB();
  console.log("\n3) 全站文案入库（CopyEntry 调配中心）");
  await updateCopyDB();
  console.log("\n✓ sync 完成。项目 http://localhost:3010 已是最新文案。");
})().catch((e) => {
  console.error("sync 失败:", e);
  process.exit(1);
});
