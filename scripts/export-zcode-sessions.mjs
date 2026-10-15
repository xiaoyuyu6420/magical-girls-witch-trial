/**
 * 从 zcode 会话库导出指定项目的完整对话记录。
 * 产物：sessions/<slug>.md（人读）+ sessions/<session_id>.jsonl（机读，原文）
 *
 * 用法：node scripts/export-zcode-sessions.mjs [项目目录关键词，默认 magical-girls]
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const keyword = process.argv[2] ?? "magical-girls";
const dbPath = join(homedir(), ".zcode", "cli", "db", "db.sqlite");
const outDir = join(process.cwd(), "sessions");

const db = new DatabaseSync(dbPath, { readOnly: true });

const sessions = db
  .prepare(
    `SELECT id, slug, title, directory, version, task_type, parent_id,
            time_created, time_updated, time_archived
       FROM session
      WHERE directory LIKE ?
      ORDER BY time_created`,
  )
  .all(`%${keyword}%`);

if (sessions.length === 0) {
  console.error(`没有找到目录包含 "${keyword}" 的会话`);
  process.exit(1);
}

mkdirSync(join(outDir, "jsonl"), { recursive: true });

const messagesOf = db.prepare(
  `SELECT id, data FROM message WHERE session_id = ? ORDER BY sequence, time_created`,
);
// 注意：part 通过 message_id 关联到 message，不是 session_id
const partsOf = db.prepare(
  `SELECT data FROM part WHERE message_id = ? ORDER BY sequence, time_created`,
);

const iso = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 19);
const stamp = (ms) => iso(ms).slice(0, 10);

const index = [];

for (const s of sessions) {
  const messages = messagesOf.all(s.id);
  const lines = [];
  lines.push(`# ${s.title || s.slug}`);
  lines.push("");
  lines.push(
    `- 会话 ID: \`${s.id}\``,
    `- 时间: ${iso(s.time_created)} → ${iso(s.time_updated)}`,
    `- 工作目录: ${s.directory}`,
    `- 消息数: ${messages.length}`,
    `- 归档状态: ${s.time_archived ? "已归档" : "未归档"}`,
    "",
  );
  lines.push("---", "");

  const jsonl = [];
  for (const m of messages) {
    let data;
    try {
      data = JSON.parse(m.data);
    } catch {
      continue;
    }
    const role = data.role ?? "unknown";
    jsonl.push(JSON.stringify({ role, ...data }));

    const parts = partsOf.all(m.id);
    const text = [];
    for (const p of parts) {
      let pd;
      try {
        pd = JSON.parse(p.data);
      } catch {
        continue;
      }
      if (pd.type === "text" && typeof pd.text === "string" && pd.text.trim()) {
        text.push(pd.text);
      }
    }
    if (!text.length) continue;

    const label =
      role === "user" ? "## 👤 用户" : role === "assistant" ? "## 🤖 助手" : `## ${role}`;
    lines.push(label, text.join("\n\n"), "");

    // 工具调用与结果只记行数，收敛体积（原文保留在 jsonl）
    const tools = [];
    for (const p of parts) {
      let pd;
      try {
        pd = JSON.parse(p.data);
      } catch {
        continue;
      }
      if (pd.type === "tool") {
        const name = pd.tool ?? pd.name ?? pd.state?.title ?? "?";
        tools.push(String(name).split("\n")[0].slice(0, 60));
      }
    }
    if (tools.length) {
      lines.push(`> 🔧 工具调用 ${tools.length} 次: ${[...new Set(tools)].join(", ")}`, "");
    }
  }

  writeFileSync(join(outDir, `${s.slug}.md`), lines.join("\n"));
  writeFileSync(
    join(outDir, "jsonl", `${s.id}.jsonl`),
    jsonl.join("\n") + (jsonl.length ? "\n" : ""),
  );

  index.push({
    id: s.id,
    slug: s.slug,
    title: s.title,
    messages: messages.length,
    created: iso(s.time_created),
    updated: iso(s.time_updated),
    file: `${s.slug}.md`,
  });
  process.stdout.write(".");
}

index.sort((a, b) => a.created.localeCompare(b.created));
writeFileSync(
  join(outDir, "INDEX.md"),
  [
    "# 会话索引",
    "",
    `共 ${index.length} 个会话，导出自 zcode 会话库（原始数据见 jsonl/）。`,
    "",
    "| 时间 | 会话 | 消息数 | 文件 |",
    "| --- | --- | --- | --- |",
    ...index.map(
      (i) =>
        `| ${i.created.slice(0, 16)} | ${i.title.replace(/\|/g, "\\|").slice(0, 40)} | ${i.messages} | [md](${encodeURI(i.file)}) |`,
    ),
    "",
  ].join("\n"),
);

db.close();
console.log(`\n完成：${index.length} 个会话 → ${outDir}`);