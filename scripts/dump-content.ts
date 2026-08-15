/**
 * dump-content.ts — 从当前代码 + DB 提取文案，生成 content/content.yaml 模板
 *
 * 用法：pnpm exec tsx scripts/dump-content.ts
 *
 * 产出的 yaml 是"权威源模板"——别的 Agent 在里面填文案，
 * 然后跑 scripts/sync-content.ts 同步到 DB + 代码文件。
 */
import * as ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "content", "content.yaml");

// ---- AST helpers (复用 verify-rewrite 的解析逻辑) ----
function sfOf(file: string) {
  return ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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

interface QSlot {
  dim: string;
  type: string;
  renderType: string | null;
  meta: string;
  text: string;
  options: { score: number | null; value: string | null; trigger: string | null; label: string; labelIsCode: boolean }[];
}
interface CharSlot {
  code: string;
  name: string;
  group: string;
  vector: string;
  subtitle: string | null;
  special: boolean;
  hasKeywords: boolean;
  slogan: string;
  desc: string;
  keywords: string;
  source: "witch-trial" | "madoka";
}

function parseQuestions(file: string): QSlot[] {
  const sf = sfOf(file);
  const out: QSlot[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== "QUESTIONS" || !decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const elem of decl.initializer.elements) {
        if (ts.isCallExpression(elem)) {
          // Q(dim, meta, text, options[], scores[])
          const dim = strVal(elem.arguments[0]) ?? "";
          const text = strVal(elem.arguments[2]) ?? "";
          const meta = strVal(elem.arguments[1]) ?? "";
          const optsArr = elem.arguments[3];
          const scoresArr = elem.arguments[4];
          const opts: QSlot["options"] = [];
          if (optsArr && ts.isArrayLiteralExpression(optsArr)) {
            optsArr.elements.forEach((o, i) => {
              let score: number | null = i + 1;
              if (scoresArr && ts.isArrayLiteralExpression(scoresArr)) {
                const s = scoresArr.elements[i];
                if (s && ts.isNumericLiteral(s)) score = Number(s.text);
              }
              opts.push({ score, value: null, trigger: null, label: strVal(o) ?? "", labelIsCode: false });
            });
          }
          out.push({ dim, type: "normal", renderType: null, meta, text, options: opts });
        } else if (ts.isObjectLiteralExpression(elem)) {
          const dim = strVal(propOf(elem, "dim")) ?? "";
          const type = strVal(propOf(elem, "type")) ?? "normal";
          const renderType = strVal(propOf(elem, "renderType"));
          const meta = strVal(propOf(elem, "meta")) ?? "";
          const text = strVal(propOf(elem, "text")) ?? "";
          const opts: QSlot["options"] = [];
          const optsNode = propOf(elem, "options");
          if (optsNode && ts.isArrayLiteralExpression(optsNode)) {
            optsNode.elements.forEach((o) => {
              if (!ts.isObjectLiteralExpression(o)) return;
              const lbl = strVal(propOf(o, "label")) ?? "";
              opts.push({
                score: propOf(o, "score") && ts.isNumericLiteral(propOf(o, "score")!) ? Number((propOf(o, "score") as ts.NumericLiteral).text) : null,
                value: strVal(propOf(o, "value")),
                trigger: strVal(propOf(o, "trigger")),
                label: lbl,
                labelIsCode: renderType === "weight",
              });
            });
          }
          out.push({ dim, type, renderType, meta, text, options: opts });
        }
      }
    }
  }
  return out;
}

function parseTypes(file: string, source: "witch-trial" | "madoka", varName: string): CharSlot[] {
  const sf = sfOf(file);
  const out: CharSlot[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== varName || !decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const e of decl.initializer.elements) {
        if (!ts.isObjectLiteralExpression(e)) continue;
        out.push({
          code: strVal(propOf(e, "code")) ?? "",
          name: strVal(propOf(e, "name")) ?? "",
          group: strVal(propOf(e, "group")) ?? "",
          vector: strVal(propOf(e, "vector")) ?? "",
          subtitle: strVal(propOf(e, "subtitle")),
          special: !!propOf(e, "special") && propOf(e, "special")!.kind === ts.SyntaxKind.TrueKeyword,
          hasKeywords: !!propOf(e, "keywords"),
          slogan: strVal(propOf(e, "slogan")) ?? "",
          desc: strVal(propOf(e, "desc")) ?? "",
          keywords: strVal(propOf(e, "keywords")) ?? "",
          source,
        });
      }
    }
  }
  return out;
}

function collectI18n(file: string): Record<string, unknown> {
  const sf = sfOf(file);
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        return objToObj(decl.initializer);
      }
    }
  }
  return {};
}
function objToObj(obj: ts.ObjectLiteralExpression): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const k = p.name.getText();
    if (ts.isObjectLiteralExpression(p.initializer)) out[k] = objToObj(p.initializer);
    else if (ts.isStringLiteral(p.initializer)) out[k] = p.initializer.text;
    else out[k] = p.initializer.getText();
  }
  return out;
}

// ---- main ----
const questions = parseQuestions(path.join(ROOT, "src/data/quiz-content.ts"));
const wtTypes = parseTypes(path.join(ROOT, "src/data/quiz-content.ts"), "witch-trial", "PERSONALITY_TYPES");
const madokaTypes = parseTypes(path.join(ROOT, "src/content/packs/madoka/config.ts"), "madoka", "MADOKA_TYPES");
const allTypes = [...wtTypes, ...madokaTypes];
const i18n: Record<string, Record<string, unknown>> = {
  "zh-CN": collectI18n(path.join(ROOT, "src/i18n/zh-CN.ts")),
  en: collectI18n(path.join(ROOT, "src/i18n/en.ts")),
  ja: collectI18n(path.join(ROOT, "src/i18n/ja.ts")),
  "zh-TW": collectI18n(path.join(ROOT, "src/i18n/zh-TW.ts")),
};

const doc = {
  _meta: {
    说明: "这是文案权威源。别的 Agent 在这里填文案，然后跑 `pnpm exec tsx scripts/sync-content.ts` 同步到项目。",
    规则: [
      "标 🔒 的字段是结构字段（dim/type/score/value/trigger/vector 等），绝对不能改——改了会破坏评分算法",
      "标 ✏️ 的字段是文案字段（text/label/slogan/desc/keywords/meta），在这里填",
      "四语言：zh-CN 是中文权威源，en/ja/zh-TW 是翻译",
      "题库 26 题：1-12 正向 / 13-17 反向 / 18 门控 / 19 触发 / 20-26 反向；第 8/22 是天平题(2选项) / 第 14 是砝码题(7选项 weight:: 编码 🔒)",
      "改完后跑 sync，项目 http://localhost:3010 立即生效",
    ],
  },
  questions: questions.map((q, i) => ({
    _index: i + 1,
    _dim: `🔒 ${q.dim}`,
    _type: `🔒 ${q.type}${q.renderType ? ` (${q.renderType})` : ""}`,
    meta: `✏️ ${q.meta}`,
    text: q.text,
    options: q.options.map((o, j) => ({
      _score: `🔒 ${o.score ?? "-"}`,
      _value: o.value ? `🔒 ${o.value}` : undefined,
      _trigger: o.trigger ? `🔒 ${o.trigger}` : undefined,
      label: o.labelIsCode ? `🔒 ${o.label} (编码，勿动)` : o.label,
    })),
  })),
  characters: allTypes.map((c) => ({
    _code: `🔒 ${c.code}`,
    _name: `🔒 ${c.name}`,
    _group: `🔒 ${c.group}`,
    _vector: `🔒 ${c.vector}`,
    _subtitle: c.subtitle ? `🔒 ${c.subtitle}` : undefined,
    _source: c.source,
    slogan: c.slogan,
    desc: c.desc,
    keywords: c.hasKeywords ? c.keywords : undefined,
  })),
  ui: i18n,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const yaml = yamlStringify(doc, { lineWidth: 0, defaultStringType: "PLAIN" });
fs.writeFileSync(OUT, yaml);
console.log(`✓ 已生成 ${OUT}`);
console.log(`  题库 ${questions.length} 题 / 角色 ${allTypes.length} / 四语言 UI key 已提取`);
console.log(`  下一步：别的 Agent 在此 yaml 填文案，然后跑 sync-content.ts`);
