import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 批注条目（后台编辑用） */
interface AnnotationRow {
  id?: number;
  node: number;
  tier: string;
  text: string;
  order: number;
}

const VALID_NODES = [5, 10, 15];
const VALID_TIERS = ["H", "M", "L"];

function validate(row: AnnotationRow): string | null {
  if (!VALID_NODES.includes(row.node)) return "node 必须是 5 / 10 / 15";
  if (!VALID_TIERS.includes(row.tier)) return "tier 必须是 H / M / L";
  if (typeof row.text !== "string" || row.text.trim().length === 0) return "文案不能为空";
  if (row.text.length > 500) return "文案过长（≤500 字）";
  if (!Number.isInteger(row.order) || row.order < 0) return "order 必须是非负整数";
  return null;
}

/** GET：全量批注（按 node/tier/order 排序），供后台列表 */
export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const rows = await db.annotation.findMany({
      orderBy: [{ node: "asc" }, { tier: "asc" }, { order: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return apiError("Failed to load annotations", 500, e);
  }
}

/**
 * PUT：整包保存（与 questions 的 bulk 语义一致）。
 * 请求体 = 全量条目数组；服务端 deleteMany + createMany 重建——
 * 批注无关联数据，整包替换最简单且天然处理删除/排序。
 */
export async function PUT(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const body = (await req.json()) as AnnotationRow[];
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "body must be an array" }, { status: 400 });
    }
    for (const row of body) {
      const err = validate(row);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    await db.$transaction(async (tx) => {
      await tx.annotation.deleteMany();
      if (body.length > 0) {
        await tx.annotation.createMany({
          data: body.map((r, i) => ({
            node: r.node, tier: r.tier, text: r.text.trim(), order: Number.isInteger(r.order) ? r.order : i,
          })),
        });
      }
    });
    return NextResponse.json({ ok: true, count: body.length });
  } catch (e) {
    console.error(e);
    return apiError("Failed to save annotations", 500, e);
  }
}
