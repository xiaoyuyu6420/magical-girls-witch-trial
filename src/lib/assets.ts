import path from "node:path";
import { readdir } from "node:fs/promises";

/**
 * 素材（角色立绘）存储约定：
 * - 内置图：public/characters/{CODE}.{jpg,png}（随镜像分发）
 * - 后台替换图：{ASSETS_DIR}/{CODE}.{ext}——data 卷内，容器重建不丢；
 *   ASSETS_DIR 相对 cwd：本地 dev=项目根/data/uploads，容器=/app/data/uploads（volume）
 * - 公开访问：/api/asset/{CODE} 优先替换图，回退内置
 */
export const ASSETS_DIR = path.join(process.cwd(), "data", "uploads");

/** 已知素材代码（与 character-images.ts 的键一致） */
export const KNOWN_ASSETS = new Set([
  "ALISA", "ANAN", "COCO", "EMMA", "HANNA", "HIRO", "HOMURA", "KYOKO", "LEIA",
  "MADOKA", "MAMI", "MARGO", "MERURU", "MIRIA", "NANOKA", "NOAH", "SAYAKA",
  "SHERRY", "YUKI", "UNSET",
]);

/** 防路径穿越：只放行大写字母/数字/下划线 */
export function safeAssetCode(raw: string): string {
  return /^[A-Z0-9_]{1,32}$/.test(raw) ? raw : "";
}

/** 查找某 code 的当前图（先替换目录，后内置目录），返回绝对路径或 null */
export async function resolveAssetPath(code: string): Promise<string | null> {
  for (const dir of [ASSETS_DIR, path.join(process.cwd(), "public", "characters")]) {
    try {
      const files = await readdir(dir);
      const hit = files.find((f) => f.startsWith(`${code}.`));
      if (hit) return path.join(dir, hit);
    } catch { /* 目录不存在继续 */ }
  }
  return null;
}

/** 后台清单：内置全集 + 各 code 当前是否被替换 + 有效 URL（带 cache-bust） */
export async function listAssets(): Promise<{ code: string; replaced: boolean; url: string }[]> {
  let replacedNames: string[] = [];
  try {
    replacedNames = await readdir(ASSETS_DIR);
  } catch { /* 无替换目录 */ }
  return [...KNOWN_ASSETS].sort().map((code) => {
    const replaced = replacedNames.some((f) => f.startsWith(`${code}.`));
    return { code, replaced, url: `/api/asset/${code}?v=${replaced ? "u" : "b"}` };
  });
}
