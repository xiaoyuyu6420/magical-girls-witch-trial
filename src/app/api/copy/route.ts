import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * /api/copy — 全站文案调配中心的公开读取口（CopyEntry 表）。
 *
 * 用法：
 *   GET /api/copy?locale=zh-CN          → { entries: { "result.share": "...", "nf.title": "..." } }
 *     （该语言全部覆盖值；home 组除外——首页走 group 模式。i18n.tsx 合并到内置默认之上。）
 *   GET /api/copy?group=home            → { byLocale: { "zh-CN": { tagline1: "..." }, ... } }
 *   GET /api/copy?group=home&locale=... → { entries: {...} }
 *
 * 行不存在 = 使用代码内置默认（src/i18n/*.ts、public/index.html），前端无感降级。
 */

const LOCALES = ["zh-CN", "zh-TW", "en", "ja"];
const GROUPS = ["ui", "home", "nf", "err"];

/** nf/err 组的 key 加组前缀后才是 i18n 点分路径（translations.nf.title） */
function toPath(group: string, key: string): string {
  return group === "nf" || group === "err" ? `${group}.${key}` : key;
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { id: "copy", capacity: 60, refillPerSec: 1 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const locale = req.nextUrl.searchParams.get("locale");
  const group = req.nextUrl.searchParams.get("group");

  try {
    if (locale) {
      if (!LOCALES.includes(locale)) {
        return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
      }
      const where = group && GROUPS.includes(group)
        ? { locale, group }
        : { locale, group: { not: "home" } }; // i18n 合并不含 home（首页自己拉）
      const rows = await db.copyEntry.findMany({ where });
      const entries: Record<string, string> = {};
      for (const r of rows) entries[toPath(r.group, r.key)] = r.value;
      return NextResponse.json({ locale, entries });
    }

    if (group) {
      if (!GROUPS.includes(group)) {
        return NextResponse.json({ error: "Invalid group" }, { status: 400 });
      }
      const rows = await db.copyEntry.findMany({ where: { group } });
      const byLocale: Record<string, Record<string, string>> = {};
      for (const r of rows) {
        (byLocale[r.locale] ??= {})[r.key] = r.value;
      }
      return NextResponse.json({ group, byLocale });
    }

    const rows = await db.copyEntry.findMany();
    const byLocale: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      (byLocale[r.locale] ??= {})[toPath(r.group, r.key)] = r.value;
    }
    return NextResponse.json({ byLocale });
  } catch (e) {
    console.error("Copy fetch error:", e);
    return NextResponse.json({ error: "Failed to load copy" }, { status: 500 });
  }
}
