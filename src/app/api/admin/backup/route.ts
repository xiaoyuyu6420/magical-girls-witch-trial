import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * 全量内容备份（比 Excel 覆盖面全）：题目+选项+角色+批注，含全部 translations。
 * GET  = 导出 JSON；POST = 导入恢复（题目按 order 对位更新文案/结构，角色按 code upsert，批注整包替换）。
 * 注意：导入会覆盖现有同键内容——请先用 GET 留存当前备份。
 */

interface BackupQuestion {
  order: number; dim: string; text: string; meta: string;
  type: string; renderType: string; translations: string;
  options: { label: string; score: number; value: string | null; trigger: string | null; posture: string | null }[];
}
interface Backup {
  version: 1;
  exportedAt: string;
  questions: BackupQuestion[];
  types: Record<string, unknown>[];
  annotations: { node: number; tier: string; text: string; order: number }[];
}

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const [questions, types, annotations] = await Promise.all([
      db.question.findMany({
        orderBy: { order: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      }),
      db.personalityType.findMany({ orderBy: { id: "asc" } }),
      db.annotation.findMany({ orderBy: [{ node: "asc" }, { tier: "asc" }, { order: "asc" }] }),
    ]);
    const backup: Backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      questions: questions.map((q) => ({
        order: q.order, dim: q.dim, text: q.text, meta: q.meta,
        type: q.type, renderType: q.renderType, translations: q.translations,
        options: q.options.map((o) => ({
          label: o.label, score: o.score, value: o.value, trigger: o.trigger, posture: o.posture,
        })),
      })),
      types,
      annotations: annotations.map((a) => ({ node: a.node, tier: a.tier, text: a.text, order: a.order })),
    };
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="witch-trial-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    console.error(e);
    return apiError("Failed to export backup", 500, e);
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const backup = JSON.parse(await req.text()) as Backup;
    if (backup.version !== 1 || !Array.isArray(backup.questions) || !Array.isArray(backup.types)) {
      return NextResponse.json({ error: "无效的备份文件" }, { status: 400 });
    }

    let qUpdated = 0;
    let qSkipped = 0;
    await db.$transaction(async (tx) => {
      // 题目：按 order 对位（结构必须与现库一致——order/选项数对得上才更新文案与 translations）
      const dbQuestions = await tx.question.findMany({
        orderBy: { order: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      });
      for (const bq of backup.questions) {
        const dbQ = dbQuestions.find((q) => q.order === bq.order);
        if (!dbQ || dbQ.options.length !== bq.options.length) { qSkipped++; continue; }
        await tx.question.update({
          where: { id: dbQ.id },
          data: {
            text: bq.text, meta: bq.meta, dim: bq.dim,
            type: (bq.type as "normal" | "gate" | "trigger") ?? "normal",
            renderType: bq.renderType ?? "normal",
            translations: bq.translations ?? "{}",
          },
        });
        for (let j = 0; j < bq.options.length; j++) {
          await tx.option.update({
            where: { id: dbQ.options[j].id },
            data: { label: bq.options[j].label },
          });
        }
        qUpdated++;
      }

      // 角色：按 code upsert 文案字段
      for (const t of backup.types) {
        const code = String(t.code ?? "");
        if (!code) continue;
        const data = {
          name: String(t.name ?? ""), subtitle: (t.subtitle as string) ?? null,
          group: String(t.group ?? "B"), vector: String(t.vector ?? ""),
          slogan: String(t.slogan ?? ""), desc: String(t.desc ?? ""),
          keywords: (t.keywords as string) ?? null,
          translations: String(t.translations ?? "{}"),
          prosecution: String(t.prosecution ?? ""), softlanding: String(t.softlanding ?? ""),
          tags: String(t.tags ?? ""),
        };
        await tx.personalityType.upsert({ where: { code }, update: data, create: { code, ...data } });
      }

      // 批注：整包替换
      if (Array.isArray(backup.annotations)) {
        await tx.annotation.deleteMany();
        if (backup.annotations.length > 0) {
          await tx.annotation.createMany({
            data: backup.annotations.map((a) => ({
              node: a.node, tier: a.tier, text: a.text, order: a.order,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true, questionsUpdated: qUpdated, questionsSkipped: qSkipped, types: backup.types.length });
  } catch (e) {
    console.error(e);
    return apiError("Failed to restore backup", 500, e);
  }
}
