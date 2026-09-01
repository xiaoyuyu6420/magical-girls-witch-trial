import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { apiError } from "@/lib/utils";
import {
  ASSETS_DIR, KNOWN_ASSETS, listAssets, safeAssetCode,
} from "@/lib/assets";

export const dynamic = "force-dynamic";

/** GET：素材清单（内置角色图 + 用户已替换状态） */
export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const items = await listAssets();
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return apiError("Failed to list assets", 500, e);
  }
}

/**
 * POST：上传替换角色图（multipart：code + file）。
 * 存 {ASSETS_DIR}/{CODE}.{ext}——ASSETS_DIR 在 data 卷内，容器重建不丢。
 * 前端 /api/asset/{CODE} 优先读这里，无则回退镜像内置 public/characters。
 */
export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const form = await req.formData();
    const code = safeAssetCode(String(form.get("code") || ""));
    const file = form.get("file");
    if (!code || !KNOWN_ASSETS.has(code)) {
      return NextResponse.json({ error: "未知的素材代码" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG / PNG / WebP" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大（≤5MB）" }, { status: 400 });
    }
    const { mkdir, writeFile, rm } = await import("node:fs/promises");
    const path = await import("node:path");
    await mkdir(ASSETS_DIR, { recursive: true });
    // 先清同 code 旧扩展名，再写入新文件（保证一码一图）
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      await rm(path.join(ASSETS_DIR, `${code}.${ext}`), { force: true });
    }
    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    await writeFile(path.join(ASSETS_DIR, `${code}.${ext}`), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true, code, url: `/api/asset/${code}?v=${Date.now()}` });
  } catch (e) {
    console.error(e);
    return apiError("Failed to upload asset", 500, e);
  }
}

/** DELETE：恢复内置图（删除用户上传的替换版） */
export async function DELETE(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const code = safeAssetCode(req.nextUrl.searchParams.get("code") || "");
    if (!code || !KNOWN_ASSETS.has(code)) {
      return NextResponse.json({ error: "未知的素材代码" }, { status: 400 });
    }
    const { rm, readdir } = await import("node:fs/promises");
    const path = await import("node:path");
    try {
      const files = await readdir(ASSETS_DIR);
      for (const f of files) {
        if (f.startsWith(`${code}.`)) await rm(path.join(ASSETS_DIR, f), { force: true });
      }
    } catch { /* 目录不存在 = 已是内置 */ }
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    console.error(e);
    return apiError("Failed to reset asset", 500, e);
  }
}
