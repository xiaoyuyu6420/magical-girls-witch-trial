// 角色立绘映射：public/characters/ 下的临时底图（GPT Image 风格化重绘前的占位素材）。
// 魔女审判 14 张 = manosaba.com 官网立绘 + 萌娘百科月代雪；小圆 9 张 = Puella Magi Wiki 官方透明 PNG。
// UNSET（未定之魂）为站内原创角色，暂无图，结果卡保持星印占位层。
const CHARACTER_IMAGES: Record<string, string> = {
  // ── 魔女审判 ──
  EMMA: "/characters/EMMA.jpg",
  HIRO: "/characters/HIRO.jpg",
  MERURU: "/characters/MERURU.jpg",
  HANNA: "/characters/HANNA.jpg",
  SHERRY: "/characters/SHERRY.jpg",
  ANAN: "/characters/ANAN.jpg",
  LEIA: "/characters/LEIA.jpg",
  COCO: "/characters/COCO.jpg",
  MIRIA: "/characters/MIRIA.jpg",
  MARGO: "/characters/MARGO.jpg",
  NOAH: "/characters/NOAH.jpg",
  NANOKA: "/characters/NANOKA.jpg",
  ALISA: "/characters/ALISA.jpg",
  YUKI: "/characters/YUKI.png",
  // ── 魔法少女小圆 ──
  MADOKA: "/characters/MADOKA.png",
  HOMURA: "/characters/HOMURA.png",
  SAYAKA: "/characters/SAYAKA.png",
  KYOKO: "/characters/KYOKO.png",
  MAMI: "/characters/MAMI.png",
  homura_devil: "/characters/homura_devil.png",
  madoka_god: "/characters/madoka_god.png",
  sayaka_siren: "/characters/sayaka_siren.png",
  kyoko_pragmatist: "/characters/kyoko_pragmatist.png",
};

export function characterImage(code: string): string | undefined {
  return CHARACTER_IMAGES[code];
}
