import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { apiError } from "@/lib/utils";
import zhCN from "@/i18n/zh-CN";
import zhTW from "@/i18n/zh-TW";
import en from "@/i18n/en";
import ja from "@/i18n/ja";

export const dynamic = "force-dynamic";

/**
 * 全站文案调配中心（CopyEntry 表）的后台编辑口。
 *
 * GET  → { entries: 全部覆盖行, defaults: { [locale]: { [点分路径]: 内置默认 } } }
 *        defaults 来自打包进代码的 i18n 文件（题库死骨架 questions/gate/trigger 除外），
 *        供后台显示占位/对比覆盖。home 组无内置默认（首页内联在 index.html）。
 * PUT  → { group, locale, items: [{ key, value }] }
 *        value 非空 = upsert 覆盖；value 留空 = 删除该行（恢复内置默认）。
 *        与 sync-content 的语义一致：yaml sync 会覆盖同 key 的 DB 值。
 */

const LOCALES = ["zh-CN", "zh-TW", "en", "ja"];
const GROUPS = ["ui", "home", "nf", "err"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BUNDLED: Record<string, any> = { "zh-CN": zhCN, "zh-TW": zhTW, en, ja };

/** 把嵌套 i18n 对象拍平成点分路径 → 非空字符串（跳过题库死骨架） */
function flattenI18n(
  obj: unknown,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  if (obj == null || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === "questions" || k === "gate" || k === "trigger") continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flattenI18n(v, path, out);
    else if (typeof v === "string" && v.trim() !== "") out[path] = v;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const entries = await db.copyEntry.findMany({
      orderBy: [{ group: "asc" }, { locale: "asc" }, { key: "asc" }],
    });
    const defaults: Record<string, Record<string, string>> = {};
    for (const locale of LOCALES) {
      defaults[locale] = flattenI18n(BUNDLED[locale]);
    }
    return NextResponse.json({ entries, defaults });
  } catch (e) {
    console.error(e);
    return apiError("Failed to load copy entries", 500, e);
  }
}

interface CopyItem {
  key: string;
  value: string;
}

export async function PUT(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const body = (await req.json()) as { group?: string; locale?: string; items?: CopyItem[] };
    const { group, locale, items } = body;
    if (!group || !GROUPS.includes(group)) {
      return NextResponse.json({ error: "group 必须是 ui / home / nf / err" }, { status: 400 });
    }
    if (!locale || !LOCALES.includes(locale)) {
      return NextResponse.json({ error: "locale 必须是 zh-CN / zh-TW / en / ja" }, { status: 400 });
    }
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items 必须是数组" }, { status: 400 });
    }
    let saved = 0;
    let removed = 0;
    for (const item of items) {
      if (typeof item.key !== "string" || item.key.trim() === "") {
        return NextResponse.json({ error: "key 不能为空" }, { status: 400 });
      }
      if (item.key.length > 200) {
        return NextResponse.json({ error: "key 过长" }, { status: 400 });
      }
      const value = typeof item.value === "string" ? item.value : "";
      if (value.length > 5000) {
        return NextResponse.json({ error: `${item.key}: 文案过长（≤5000 字）` }, { status: 400 });
      }
      if (value.trim() === "") {
        // 留空 = 恢复内置默认：删除覆盖行
        const res = await db.copyEntry.deleteMany({ where: { key: item.key, locale } });
        removed += res.count;
      } else {
        await db.copyEntry.upsert({
          where: { key_locale: { key: item.key, locale } },
          update: { group, value },
          create: { group, key: item.key, locale, value },
        });
        saved++;
      }
    }
    return NextResponse.json({ ok: true, saved, removed });
  } catch (e) {
    console.error(e);
    return apiError("Failed to save copy entries", 500, e);
  }
}
