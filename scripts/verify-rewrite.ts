/**
 * verify-rewrite.ts — 文案重写校验工具（G0-G4 自动闸）
 *
 * 用法：
 *   pnpm exec tsx scripts/verify-rewrite.ts snapshot          # 从备份 tar.gz 提取逻辑字段快照
 *   pnpm exec tsx scripts/verify-rewrite.ts gates [--phase skeleton|filled]  # 跑 G0-G4 全部门
 *   pnpm exec tsx scripts/verify-rewrite.ts diff              # 当前 vs 快照逻辑字段差异（人读）
 *   pnpm exec tsx scripts/verify-rewrite.ts keys              # 四语言 key 镜像 diff
 *
 * 退出码：0 = 通过；1 = 有 FAIL；2 = 使用错误/快照缺失。
 */
import * as ts from "typescript";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const BACKUP_TGZ = path.join(ROOT, "backups", "copy-archive-20260810-170441.tar.gz");
const SNAPSHOT_DIR = path.join(ROOT, "crucible", "copy-snapshot");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "logical-fields.json");

// 每个文档的字段结构 -----------------------------------------------------------

interface OptLogical {
  score: number | null;
  value: string | null;
  trigger: string | null;
  label: string; // 砝码题 label 是编码（冻结），普通题 label 是文案（不冻结，但记录便于 diff）
  labelIsCode: boolean;
}
interface QLogical {
  dim: string;
  type: string;
  renderType: string | null;
  text: string; // 题干文案（G2 句法/长度检查用）
  opts: OptLogical[];
}
interface TypeLogical {
  code: string;
  name: string;
  group: string;
  vector: string;
  subtitle: string | null;
  special: boolean;
  hasKeywords: boolean;
  desc: string; // 文案字段，仅 G2 检查用，不参与 G0 diff
  slogan: string;
}
interface Snapshot {
  hash: string;
  questions: QLogical[];
  types: TypeLogical[]; // quiz-content 16 + madoka 5 = 21
  i18nKeys: Record<string, string[]>; // locale -> key path list
}

// AST 解析 ----------------------------------------------------------------------

function sfOf(file: string): ts.SourceFile {
  const src = fs.readFileSync(file, "utf8");
  return ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}
function strVal(n: ts.Node | undefined): string | null {
  if (n && ts.isStringLiteral(n)) return n.text;
  return null;
}
function boolVal(n: ts.Node | undefined): boolean {
  return !!n && n.kind === ts.SyntaxKind.TrueKeyword;
}
function numVal(n: ts.Node | undefined): number | null {
  if (n && ts.isNumericLiteral(n)) return Number(n.text);
  return null;
}

/** 提取对象属性值（按名字） */
function propOf(obj: ts.ObjectLiteralExpression, name: string): ts.Node | undefined {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
  }
  return undefined;
}

/** 解析一个题目元素（Q() 调用或对象字面量）→ 逻辑字段 */
function parseQuestionNode(elem: ts.Node, file: string): QLogical {
  if (ts.isCallExpression(elem)) {
    // Q(dim, meta, text, options[], scores[])
    const dim = strVal(elem.arguments[0]) ?? "";
    const text = strVal(elem.arguments[2]) ?? "";
    const type = "normal";
    const optsArr = elem.arguments[3];
    const scoresArr = elem.arguments[4];
    const opts: OptLogical[] = [];
    if (optsArr && ts.isArrayLiteralExpression(optsArr)) {
      optsArr.elements.forEach((o, i) => {
        const label = strVal(o) ?? "";
        let score: number | null = i + 1;
        if (scoresArr && ts.isArrayLiteralExpression(scoresArr)) {
          const s = numVal(scoresArr.elements[i]);
          if (s !== null) score = s;
        }
        opts.push({ score, value: null, trigger: null, label, labelIsCode: false });
      });
    }
    return { dim, type, renderType: null, text, opts };
  }
  if (ts.isObjectLiteralExpression(elem)) {
    const dim = strVal(propOf(elem, "dim")) ?? "";
    const text = strVal(propOf(elem, "text")) ?? "";
    const type = strVal(propOf(elem, "type")) ?? "normal";
    const renderType = strVal(propOf(elem, "renderType"));
    const opts: OptLogical[] = [];
    const optsNode = propOf(elem, "options");
    if (optsNode && ts.isArrayLiteralExpression(optsNode)) {
      optsNode.elements.forEach((o) => {
        if (!ts.isObjectLiteralExpression(o)) return;
        const label = strVal(propOf(o, "label")) ?? "";
        opts.push({
          score: numVal(propOf(o, "score")),
          value: strVal(propOf(o, "value")),
          trigger: strVal(propOf(o, "trigger")),
          label,
          labelIsCode: renderType === "weight",
        });
      });
    }
    return { dim, type, renderType, text, opts };
  }
  throw new Error(`无法解析题目节点: ${file}:${sfLine(elem, file)}`);
}

function sfLine(n: ts.Node, file: string): number {
  const sf = sfOf(file);
  return sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
}

/** 从源码文件解析 QUESTIONS 数组 + PERSONALITY_TYPES 数组 */
function parseContentFile(file: string): { questions: QLogical[]; types: TypeLogical[] } {
  const sf = sfOf(file);
  const questions: QLogical[] = [];
  const types: TypeLogical[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      const name = decl.name.getText();
      if (!decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      if (name === "QUESTIONS") {
        for (const e of decl.initializer.elements) questions.push(parseQuestionNode(e, file));
      } else if (name === "PERSONALITY_TYPES") {
        for (const e of decl.initializer.elements) {
          if (!ts.isObjectLiteralExpression(e)) continue;
          types.push({
            code: strVal(propOf(e, "code")) ?? "",
            name: strVal(propOf(e, "name")) ?? "",
            group: strVal(propOf(e, "group")) ?? "",
            vector: strVal(propOf(e, "vector")) ?? "",
            subtitle: strVal(propOf(e, "subtitle")),
            special: boolVal(propOf(e, "special")),
            hasKeywords: !!propOf(e, "keywords"),
            desc: strVal(propOf(e, "desc")) ?? "",
            slogan: strVal(propOf(e, "slogan")) ?? "",
          });
        }
      }
    }
  }
  return { questions, types };
}

/** 从 madoka config 解析 MADOKA_TYPES（5 角色） */
function parseMadokaFile(file: string): TypeLogical[] {
  const sf = sfOf(file);
  const types: TypeLogical[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== "MADOKA_TYPES") continue;
      if (!decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const e of decl.initializer.elements) {
        if (!ts.isObjectLiteralExpression(e)) continue;
        types.push({
          code: strVal(propOf(e, "code")) ?? "",
          name: strVal(propOf(e, "name")) ?? "",
          group: strVal(propOf(e, "group")) ?? "",
          vector: strVal(propOf(e, "vector")) ?? "",
          subtitle: strVal(propOf(e, "subtitle")),
          special: boolVal(propOf(e, "special")),
          hasKeywords: !!propOf(e, "keywords"),
          desc: strVal(propOf(e, "desc")) ?? "",
          slogan: strVal(propOf(e, "slogan")) ?? "",
        });
      }
    }
  }
  return types;
}

/** 递归收集对象字面量的 key 路径（含嵌套），如 "welcome.title" */
function collectKeyPaths(node: ts.ObjectLiteralExpression, prefix = ""): string[] {
  const out: string[] = [];
  for (const p of node.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const k = p.name.getText();
    const full = prefix ? `${prefix}.${k}` : k;
    if (ts.isObjectLiteralExpression(p.initializer)) {
      out.push(...collectKeyPaths(p.initializer, full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** 从 i18n 文件收集 key 路径集合（顶层 const t = {...}） */
function collectI18nKeys(file: string): string[] {
  const sf = sfOf(file);
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        return collectKeyPaths(decl.initializer);
      }
    }
  }
  return [];
}

// 快照生成 ---------------------------------------------------------------------

function extractBackup(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "copy-snapshot-"));
  execFileSync("tar", ["-xzf", BACKUP_TGZ, "-C", tmp]);
  return tmp;
}

function readSnapshot(): Snapshot {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error("[ERROR] 快照不存在，先运行: pnpm exec tsx scripts/verify-rewrite.ts snapshot");
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8")) as Snapshot;
}

function cmdSnapshot() {
  if (!fs.existsSync(BACKUP_TGZ)) {
    console.error(`[ERROR] 备份不存在: ${BACKUP_TGZ}`);
    process.exit(2);
  }
  const tmp = extractBackup();
  const backupQuiz = path.join(tmp, "src/data/quiz-content.ts");
  const backupMadoka = path.join(tmp, "src/content/packs/madoka/config.ts");
  const backupI18n: Record<string, string> = {
    "zh-CN": path.join(tmp, "src/i18n/zh-CN.ts"),
    en: path.join(tmp, "src/i18n/en.ts"),
    ja: path.join(tmp, "src/i18n/ja.ts"),
    "zh-TW": path.join(tmp, "src/i18n/zh-TW.ts"),
  };

  const quiz = parseContentFile(backupQuiz);
  const madokaTypes = parseMadokaFile(backupMadoka);
  const allTypes = [...quiz.types, ...madokaTypes];
  const i18nKeys: Record<string, string[]> = {};
  for (const [loc, f] of Object.entries(backupI18n)) {
    i18nKeys[loc] = collectI18nKeys(f);
  }

  // 自检防线：数量断言
  const errs: string[] = [];
  if (quiz.questions.length !== 26) errs.push(`备份题库数=${quiz.questions.length}，期望 26`);
  if (quiz.types.length !== 16) errs.push(`备份 witch-trial 角色数=${quiz.types.length}，期望 16`);
  if (madokaTypes.length !== 5) errs.push(`备份 madoka 角色数=${madokaTypes.length}，期望 5`);
  if (errs.length) {
    console.error("[FAIL] 快照自检失败:\n  " + errs.join("\n  "));
    process.exit(1);
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const content = fs.readFileSync(BACKUP_TGZ);
  const hash = require("node:crypto").createHash("sha256").update(content).digest("hex").slice(0, 12);
  const snap: Snapshot = { hash, questions: quiz.questions, types: allTypes, i18nKeys };
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snap, null, 2));
  console.log(`[OK] 快照已生成: ${SNAPSHOT_FILE}`);
  console.log(`  题库 ${quiz.questions.length} 题 / 角色 ${allTypes.length}（16+5）/ 四语言 key 已记录`);
  console.log(`  tar.gz sha256[:12] = ${hash}`);
}

// G0 结构指纹 ------------------------------------------------------------------

function gates(snap: Snapshot, phase: "skeleton" | "filled"): boolean {
  let allOk = true;
  const fail = (gate: string, msg: string) => {
    allOk = false;
    console.log(`[${gate}] FAIL: ${msg}`);
  };
  const ok = (gate: string, msg: string) => console.log(`[${gate}] ok: ${msg}`);

  const quizFile = path.join(ROOT, "src/data/quiz-content.ts");
  const madokaFile = path.join(ROOT, "src/content/packs/madoka/config.ts");
  const i18nFiles: Record<string, string> = {
    "zh-CN": path.join(ROOT, "src/i18n/zh-CN.ts"),
    en: path.join(ROOT, "src/i18n/en.ts"),
    ja: path.join(ROOT, "src/i18n/ja.ts"),
    "zh-TW": path.join(ROOT, "src/i18n/zh-TW.ts"),
  };
  const cur = parseContentFile(quizFile);
  const curMadoka = parseMadokaFile(madokaFile);
  const curAllTypes = [...cur.types, ...curMadoka];

  // ---- G0 结构指纹 ----
  if (cur.questions.length !== snap.questions.length) {
    fail("G0", `当前题库数=${cur.questions.length}，快照=${snap.questions.length}`);
  } else {
    for (let i = 0; i < snap.questions.length; i++) {
      const s = snap.questions[i];
      const c = cur.questions[i];
      const where = `第${i + 1}题`;
      if (c.dim !== s.dim) fail("G0", `${where} dim 不同: ${s.dim} → ${c.dim}`);
      if (c.type !== s.type) fail("G0", `${where} type 不同: ${s.type} → ${c.type}`);
      if ((c.renderType ?? null) !== (s.renderType ?? null)) {
        fail("G0", `${where} renderType 不同: ${s.renderType ?? "null"} → ${c.renderType ?? "null"}`);
      }
      if (c.opts.length !== s.opts.length) {
        fail("G0", `${where} 选项数不同: ${s.opts.length} → ${c.opts.length}`);
        continue;
      }
      for (let j = 0; j < s.opts.length; j++) {
        const so = s.opts[j];
        const co = c.opts[j];
        const owhere = `${where} 选项${j + 1}`;
        if ((co.score ?? null) !== (so.score ?? null)) {
          fail("G0", `${owhere} score 不同: ${so.score} → ${co.score}`);
        }
        if ((co.value ?? null) !== (so.value ?? null)) {
          fail("G0", `${owhere} value 不同: ${so.value} → ${co.value}`);
        }
        if ((co.trigger ?? null) !== (so.trigger ?? null)) {
          fail("G0", `${owhere} trigger 不同: ${so.trigger} → ${co.trigger}`);
        }
        // 砝码 label 冻结（编码）
        if (co.labelIsCode && co.label !== so.label) {
          fail("G0", `${owhere} 砝码编码 label 不同: ${so.label} → ${co.label}`);
        }
      }
    }
    // 位置断言：门控 18 / 触发 19 / 天平 8·22 / 砝码 14
    const pos = (i: number) => cur.questions[i]?.dim ?? "";
    const checks: [number, string, string][] = [
      [17, "GATE", "门控题"],
      [18, "TRIGGER", "触发题"],
      [7, "W2", "天平题(8)"],
      [13, "F1", "砝码题(14)"],
      [21, "W2", "天平题(22)"],
    ];
    for (const [idx, dim, label] of checks) {
      if (pos(idx) !== dim) fail("G0", `${label} 位置错: 期望第${idx + 1}题 dim=${dim}，实际=${pos(idx) || "缺失"}`);
    }
    // 顺序段界：0-11 正向、12-16 反向、17 门控、18 触发、19-25 反向
    const fwd = cur.questions.slice(0, 12);
    const rev1 = cur.questions.slice(12, 17);
    const gate = cur.questions[17];
    const trig = cur.questions[18];
    const rev2 = cur.questions.slice(19, 26);
    const dimsOf = (qs: QLogical[]) => qs.map((q) => q.dim);
    ok("G0", `正向12: [${dimsOf(fwd).join(",")}]`);
    ok("G0", `反向13-17: [${dimsOf(rev1).join(",")}]`);
    ok("G0", `门控=${gate?.dim}(${gate?.type}) 触发=${trig?.dim}(${trig?.type})`);
    ok("G0", `反向20-26: [${dimsOf(rev2).join(",")}]`);
    if (gate?.type !== "gate" || trig?.type !== "trigger") {
      fail("G0", `门控/触发 type 断言: gate=${gate?.type} trigger=${trig?.type}`);
    }
  }
  if (curAllTypes.length !== snap.types.length) {
    fail("G0", `当前角色总数=${curAllTypes.length}，快照=${snap.types.length}`);
  } else {
    for (let i = 0; i < snap.types.length; i++) {
      const s = snap.types[i];
      const c = curAllTypes[i];
      const where = `角色${s.code}`;
      if (c.code !== s.code) fail("G0", `${where} code 不同`);
      if (c.name !== s.name) fail("G0", `${where} name 不同: ${s.name} → ${c.name}`);
      if (c.group !== s.group) fail("G0", `${where} group 不同`);
      if (c.vector !== s.vector) fail("G0", `${where} vector 不同`);
      if ((c.subtitle ?? null) !== (s.subtitle ?? null)) fail("G0", `${where} subtitle 不同`);
      if (c.special !== s.special) fail("G0", `${where} special 不同`);
      if (c.hasKeywords !== s.hasKeywords) fail("G0", `${where} keywords 键存在性不同`);
    }
  }
  // 死代码区（仅 zh-CN）：questions 数组长度==24 且值恒为空串
  // en/ja/zh-TW 的 questions/gate/trigger 是 seed-translations 的翻译源（必须非空，filled 阶段检查）
  const zhCNSf = sfOf(i18nFiles["zh-CN"]);
  for (const stmt of zhCNSf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() !== "t") continue;
      if (!decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;
      const qNode = propOf(decl.initializer, "questions");
      if (qNode && ts.isArrayLiteralExpression(qNode)) {
        // 死代码区 questions 只含 24 个常规题（gate/trigger 是独立键）
        if (qNode.elements.length !== 24) fail("G0", `zh-CN 死代码区 questions 长度=${qNode.elements.length}，期望 24（常规题；gate/trigger 独立键）`);
        const nonEmpty = qNode.elements.filter((e) => {
          if (!ts.isObjectLiteralExpression(e)) return true;
          const opts = propOf(e, "options");
          if (!opts || !ts.isArrayLiteralExpression(opts)) return false;
          return opts.elements.some((o) => ts.isStringLiteral(o) && o.text !== "");
        });
        if (nonEmpty.length) fail("G0", `zh-CN 死代码区有非空选项（应保持空串）`);
      }
      const gateNode = propOf(decl.initializer, "gate");
      const trigNode = propOf(decl.initializer, "trigger");
      if (!gateNode || !trigNode) fail("G0", `zh-CN 死代码区缺 gate/trigger 键`);
    }
  }
  // en/ja/zh-TW：questions 是翻译源（seed-translations 按 order 顺序索引）——filled 阶段必须非空
  if (phase === "filled") {
    for (const loc of ["en", "ja", "zh-TW"]) {
      const sf = sfOf(i18nFiles[loc]);
      for (const stmt of sf.statements) {
        if (!ts.isVariableStatement(stmt)) continue;
        for (const decl of stmt.declarationList.declarations) {
          if (decl.name.getText() !== "t") continue;
          if (!decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;
          const qNode = propOf(decl.initializer, "questions");
          if (qNode && ts.isArrayLiteralExpression(qNode)) {
            if (qNode.elements.length !== 24) fail("G0", `${loc} 翻译源 questions 长度=${qNode.elements.length}，期望 24`);
            const emptyCount = qNode.elements.filter((e) => {
              if (!ts.isObjectLiteralExpression(e)) return false;
              const text = strVal(propOf(e, "text"));
              const opts = propOf(e, "options");
              if (!opts || !ts.isArrayLiteralExpression(opts)) return false;
              return !text || opts.elements.some((o) => !ts.isStringLiteral(o) || o.text === "");
            }).length;
            if (emptyCount) fail("G0", `${loc} 翻译源 questions 有 ${emptyCount} 项 text/options 为空（翻译源必须填满）`);
          }
          const gateNode = propOf(decl.initializer, "gate");
          const trigNode = propOf(decl.initializer, "trigger");
          for (const [name, node] of [["gate", gateNode], ["trigger", trigNode]] as const) {
            if (node && ts.isObjectLiteralExpression(node)) {
              const text = strVal(propOf(node, "text"));
              const opts = propOf(node, "options");
              const hasEmpty = !text || (opts && ts.isArrayLiteralExpression(opts) && opts.elements.some((o) => !ts.isStringLiteral(o) || o.text === ""));
              if (hasEmpty) fail("G0", `${loc} 翻译源 ${name} text/options 为空`);
            }
          }
        }
      }
    }
  }
  ok("G0", "逻辑字段/结构/死代码区断言完成");

  // ---- G3 key 镜像（skeleton 也跑：key 集合不应被删改）----
  const curKeys: Record<string, string[]> = {};
  for (const [loc, f] of Object.entries(i18nFiles)) curKeys[loc] = collectI18nKeys(f);
  const base = curKeys["zh-CN"];
  for (const [loc, ks] of Object.entries(curKeys)) {
    const missing = base.filter((k) => !ks.includes(k));
    const extra = ks.filter((k) => !base.includes(k));
    if (missing.length) fail("G3", `${loc} 缺键: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}`);
    if (extra.length) fail("G3", `${loc} 多余键: ${extra.slice(0, 8).join(", ")}${extra.length > 8 ? "…" : ""}`);
  }
  ok("G3", "四语言 key 镜像一致（以 zh-CN 为基准）");

  if (phase === "skeleton") {
    console.log("[--phase skeleton] 仅跑 G0/G3 结构类断言，跳过文案内容断言");
    return allOk;
  }

  // ---- G1 模板统计 ----
  const allLabels = cur.questions.flatMap((q, qi) => q.opts.map((o, oi) => ({ text: o.label, qi, oi })));
  const count = (s: string) => allLabels.filter((l) => l.text.includes(s)).length;
  const fakeCount = count("我从不假装");
  if (fakeCount !== 0) fail("G1", `"我从不假装" 出现 ${fakeCount} 次`);
  const admitCount = allLabels.filter((l) => /^[「“…]*你说得对/.test(l.text)).length;
  if (admitCount > 3) fail("G1", `"你说得对" 开头 ${admitCount} 次（≤3）`);
  // 相邻题共享开头（任何选项对前 6 字相同）
  for (let qi = 0; qi + 1 < cur.questions.length; qi++) {
    const a = cur.questions[qi].opts.map((o) => o.label.replace(/[「」…—·。，？?!！]/g, "").slice(0, 6)).filter(Boolean);
    const b = cur.questions[qi + 1].opts.map((o) => o.label.replace(/[「」…—·。，？?!！]/g, "").slice(0, 6)).filter(Boolean);
    for (const pa of a) {
      if (b.includes(pa)) fail("G1", `第${qi + 1}题与第${qi + 2}题共享开头 "${pa}"`);
    }
  }
  ok("G1", `模板统计完成（我从不假装=${fakeCount}，你说得对开头=${admitCount}）`);

  // ---- G2 句法与长度 ----
  for (let i = 0; i < cur.questions.length; i++) {
    const q = cur.questions[i];
    const t = q.text;
    if (!t) continue; // 空文案跳过（骨架阶段）
    if (t.length > 120) fail("G2", `第${i + 1}题 题干 ${t.length} 字（≤120）`);
    if (!t.includes("你")) fail("G2", `第${i + 1}题 题干无"你"（非逼问句法）`);
    for (const o of q.opts) {
      if (o.labelIsCode) continue; // 砝码编码 label 非文案，跳过长度
      if (o.label && o.label.length > 40) fail("G2", `第${i + 1}题 选项 ${o.label.length} 字（≤40）`);
    }
  }
  // 21 角色 desc 首句两两不同 + slogan 两两不同
  const descs = curAllTypes.map((t) => ({ code: t.code, desc: t.desc, slogan: t.slogan }));
  for (let i = 0; i < descs.length; i++) {
    for (let j = i + 1; j < descs.length; j++) {
      const a = descs[i];
      const b = descs[j];
      if (a.desc && b.desc && a.desc === b.desc) fail("G2", `角色 ${a.code}/${b.code} desc 完全相同`);
      if (a.slogan && b.slogan && a.slogan === b.slogan) fail("G2", `角色 ${a.code}/${b.code} slogan 完全相同`);
    }
  }
  ok("G2", `句法与长度断言完成（题干≤120/选项≤40/角色去重）`);

  // ---- G3 词表 ----
  const REJECTED = ["因子倾向", "因子共鸣度", "因子侵蚀", "相似度", "灵魂图谱"];
  // 跨 IP 共用层（四语言 i18n + 题库）禁 IP 专属词——"魔女"是产品名（魔女审判）允许，其余作品专属词禁用
  const IP_WORDS_PLATFORM = ["因子", "侵蚀", "监牢", "典狱长", "使魔", "残骸", "魔女化", "魔法少女"];
  // madoka pack 是小圆作品：魔法少女/魔女/魔女化是其世界观核心词，只禁 witch-trial 专属词
  const IP_WORDS_MADOKA = ["因子", "监牢", "典狱长", "使魔", "残骸", "侵蚀"];
  const allI18nText = Object.values(i18nFiles).map((f) => fs.readFileSync(f, "utf8")).join("\n");
  for (const w of REJECTED) {
    if (allI18nText.includes(w)) fail("G3", `REDESIGN 否决词 "${w}" 出现在 i18n`);
  }
  for (const w of IP_WORDS_PLATFORM) {
    if (allI18nText.includes(w)) fail("G3", `IP 专属词 "${w}" 出现在四语言 i18n（平台层禁 IP 词）`);
  }
  const quizText = fs.readFileSync(quizFile, "utf8");
  for (const w of IP_WORDS_PLATFORM) {
    // 题库区：QUESTIONS 数组之后（排除 PERSONALITY_TYPES 的 witch-trial 角色区）
    const qIdx = quizText.indexOf("export const QUESTIONS");
    const questionsRegion = quizText.slice(qIdx);
    if (questionsRegion.includes(w)) fail("G3", `IP 专属词 "${w}" 出现在题库区（跨 IP 共用题禁 IP 词）`);
  }
  const madokaText = fs.readFileSync(madokaFile, "utf8");
  for (const w of IP_WORDS_MADOKA) {
    if (madokaText.includes(w)) fail("G3", `witch-trial 专属词 "${w}" 出现在 madoka pack`);
  }
  ok("G3", `词表断言完成（否决词/IP 词扫描）`);

  // ---- G4 语义指针 ----
  const gateQ = cur.questions[17];
  if (gateQ) {
    const vals = gateQ.opts.map((o) => o.value).sort();
    const want = ["destroy", "peace", "seen", "undecided"].sort();
    if (JSON.stringify(vals) !== JSON.stringify(want)) {
      fail("G4", `门控 value 集合=${vals.join(",")}，期望 ${want.join(",")}`);
    }
    for (const o of gateQ.opts) {
      if (!o.label) fail("G4", `门控题选项(${o.value}) label 为空`);
    }
  }
  const trigQ = cur.questions[18];
  if (trigQ) {
    const fired = trigQ.opts.filter((o) => o.trigger === "SPECIAL_A");
    if (fired.length !== 1) fail("G4", `触发题 SPECIAL_A 数量=${fired.length}，期望恰好 1`);
    if (fired[0] && !fired[0].label) fail("G4", `触发题 SPECIAL_A 选项 label 为空`);
  }
  const weightQ = cur.questions[13];
  if (weightQ && weightQ.renderType === "weight") {
    for (const o of weightQ.opts) {
      if (!/^weight::[012]\|[012]\|[012]$/.test(o.label)) fail("G4", `砝码编码 label 非法: ${o.label}`);
    }
  }
  ok("G4", `语义指针断言完成（门控 4 value/触发 SPECIAL_A/砝码编码）`);

  return allOk;
}

// diff 报告 ---------------------------------------------------------------------

function cmdDiff() {
  const snap = readSnapshot();
  const cur = parseContentFile(path.join(ROOT, "src/data/quiz-content.ts"));
  const curMadoka = parseMadokaFile(path.join(ROOT, "src/content/packs/madoka/config.ts"));
  console.log("== 逻辑字段差异（当前 vs 快照）==");
  let n = 0;
  for (let i = 0; i < Math.max(snap.questions.length, cur.questions.length); i++) {
    const s = snap.questions[i];
    const c = cur.questions[i];
    if (!s || !c) {
      console.log(`  第${i + 1}题: 一侧缺失 (snap=${!!s}, cur=${!!c})`);
      n++;
      continue;
    }
    if (s.dim !== c.dim) { console.log(`  第${i + 1}题 dim: ${s.dim} → ${c.dim}`); n++; }
    if ((s.renderType ?? null) !== (c.renderType ?? null)) { console.log(`  第${i + 1}题 renderType: ${s.renderType} → ${c.renderType}`); n++; }
    for (let j = 0; j < Math.max(s.opts.length, c.opts.length); j++) {
      const so = s.opts[j];
      const co = c.opts[j];
      if (!so || !co) { console.log(`  第${i + 1}题选项${j + 1}: 一侧缺失`); n++; continue; }
      if ((so.score ?? null) !== (co.score ?? null)) { console.log(`  第${i + 1}题选项${j + 1} score: ${so.score} → ${co.score}`); n++; }
      if ((so.value ?? null) !== (co.value ?? null)) { console.log(`  第${i + 1}题选项${j + 1} value: ${so.value} → ${co.value}`); n++; }
      if ((so.trigger ?? null) !== (co.trigger ?? null)) { console.log(`  第${i + 1}题选项${j + 1} trigger: ${so.trigger} → ${co.trigger}`); n++; }
      if (co.labelIsCode && so.label !== co.label) { console.log(`  第${i + 1}题选项${j + 1} 砝码编码: ${so.label} → ${co.label}`); n++; }
    }
  }
  for (let i = 0; i < Math.max(snap.types.length, curMadoka.length + cur.types.length); i++) {
    const s = snap.types[i];
    const c = [...cur.types, ...curMadoka][i];
    if (!s || !c) { console.log(`  角色#${i + 1}: 一侧缺失 (snap=${s?.code}, cur=${c?.code})`); n++; continue; }
    for (const f of ["code", "name", "group", "vector", "subtitle", "special"] as const) {
      if (String(s[f] ?? "") !== String(c[f] ?? "")) { console.log(`  角色${s.code} ${f}: ${s[f]} → ${c[f]}`); n++; }
    }
  }
  if (n === 0) console.log("  无差异 ✓");
  else console.log(`\n共 ${n} 处差异`);
}

// keys 报告 ---------------------------------------------------------------------

function cmdKeys() {
  const i18nFiles: Record<string, string> = {
    "zh-CN": path.join(ROOT, "src/i18n/zh-CN.ts"),
    en: path.join(ROOT, "src/i18n/en.ts"),
    ja: path.join(ROOT, "src/i18n/ja.ts"),
    "zh-TW": path.join(ROOT, "src/i18n/zh-TW.ts"),
  };
  const keys: Record<string, string[]> = {};
  for (const [loc, f] of Object.entries(i18nFiles)) keys[loc] = collectI18nKeys(f);
  const base = keys["zh-CN"];
  let n = 0;
  for (const [loc, ks] of Object.entries(keys)) {
    const missing = base.filter((k) => !ks.includes(k));
    const extra = ks.filter((k) => !base.includes(k));
    if (missing.length) { console.log(`${loc} 缺 ${missing.length} 键: ${missing.join(", ")}`); n++; }
    if (extra.length) { console.log(`${loc} 多 ${extra.length} 键: ${extra.join(", ")}`); n++; }
  }
  if (n === 0) console.log(`四语言 key 镜像一致 ✓（共 ${base.length} 键）`);
}

// main --------------------------------------------------------------------------

const cmd = process.argv[2];
const phase = process.argv.includes("--phase") ? process.argv[process.argv.indexOf("--phase") + 1] : "filled";
if (!["snapshot", "gates", "diff", "keys"].includes(cmd ?? "")) {
  console.error(`用法: pnpm exec tsx scripts/verify-rewrite.ts <snapshot|gates|diff|keys> [--phase skeleton|filled]`);
  process.exit(2);
}
if (cmd === "snapshot") {
  cmdSnapshot();
} else if (cmd === "keys") {
  cmdKeys();
} else if (cmd === "diff") {
  cmdDiff();
} else {
  const snap = readSnapshot();
  const ok = gates(snap, phase as "skeleton" | "filled");
  if (!ok) process.exit(1);
  console.log("\n[PASS] 全部闸门通过 ✓");
}
