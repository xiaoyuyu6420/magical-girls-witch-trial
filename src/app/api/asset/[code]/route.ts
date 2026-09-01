import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolveAssetPath, safeAssetCode } from "@/lib/assets";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};

/**
 * 公开素材访问：/api/asset/{CODE}
 * 优先后台替换图（data 卷），回退镜像内置 public/characters。
 * 替换图带 ?v=u、内置 ?v=b 的 cache-bust 由清单侧拼接。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await params;
  const code = safeAssetCode(raw.toUpperCase());
  if (!code) return new NextResponse("Not found", { status: 404 });

  const filePath = await resolveAssetPath(code);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const buf = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "jpg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
