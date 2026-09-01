// 角色立绘映射：走 /api/asset/{CODE} 路由——优先后台「素材库」上传的替换图（data 卷），
// 回退镜像内置 public/characters 底图（GPT Image 风格化重绘前的占位素材）。
// 魔女审判 14 张 = manosaba.com 官网立绘 + 萌娘百科月代雪；小圆 9 张 = Puella Magi Wiki 官方透明 PNG。
// UNSET（未定之魂）为站内原创角色，暂无图，结果卡保持星印占位层。
const CHARACTER_IMAGES: Record<string, string> = {
  // ── 魔女审判 ──
  EMMA: "/api/asset/EMMA",
  HIRO: "/api/asset/HIRO",
  MERURU: "/api/asset/MERURU",
  HANNA: "/api/asset/HANNA",
  SHERRY: "/api/asset/SHERRY",
  ANAN: "/api/asset/ANAN",
  LEIA: "/api/asset/LEIA",
  COCO: "/api/asset/COCO",
  MIRIA: "/api/asset/MIRIA",
  MARGO: "/api/asset/MARGO",
  NOAH: "/api/asset/NOAH",
  NANOKA: "/api/asset/NANOKA",
  ALISA: "/api/asset/ALISA",
  YUKI: "/api/asset/YUKI",
  // ── 魔法少女小圆 ──
  MADOKA: "/api/asset/MADOKA",
  HOMURA: "/api/asset/HOMURA",
  SAYAKA: "/api/asset/SAYAKA",
  KYOKO: "/api/asset/KYOKO",
  MAMI: "/api/asset/MAMI",
  homura_devil: "/characters/homura_devil.png",
  madoka_god: "/characters/madoka_god.png",
  sayaka_siren: "/characters/sayaka_siren.png",
  kyoko_pragmatist: "/characters/kyoko_pragmatist.png",
};

export function characterImage(code: string): string | undefined {
  return CHARACTER_IMAGES[code];
}
