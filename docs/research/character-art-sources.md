# 角色卡重绘底图来源清单

> 用途：结果页翻转角色卡的 GPT Image 风格化重绘底图。素材在本地 `assets/raw-characters/`（版权图，已 gitignore 不入库）。
> 若素材丢失，按本清单重新获取。

## 魔女审判 15 角色 — `assets/raw-characters/witch-trial/`

来源：用户提供的《魔法少女の魔女审判》官方设定集 PDF（112 页，2480×3508 @300dpi），从 `assets/raw-characters/pdf-extract/pNNN.jpg` 复制命名。设定集 PDF 原件：`/Users/munich/Downloads/魔法少女の魔女审判设定集.zip`。

| 文件 | 设定集页 | 备注 |
|---|---|---|
| EMMA.jpg | p004 | 樱羽艾玛主立绘；EMMA_alt.jpg=p006 动作参考 |
| HIRO.jpg | p010 | 二阶堂希罗；HIRO_alt.jpg=p017（9 姿势集） |
| MERURU.jpg | p018 | 冰上梅露露；MERURU_alt.jpg=p025 魔女化形态 |
| HANNA.jpg | p026 | 远野汉娜 |
| SHERRY.jpg | p032 | 橘雪莉 |
| ANAN.jpg | p038 | 夏目安安 |
| LEIA.jpg | p044 | 莲见蕾雅；LEIA_alt.jpg=p050 |
| COCO.jpg | p052 | 泽渡可可；COCO_alt.jpg=p059 三视图 |
| MIRIA.jpg | p060 | 佐伯米莉亚 |
| MARGO.jpg | p066 | 宝生玛格；MARGO_alt.jpg=p073 魔女化形态 |
| NOAH.jpg | p074 | 城崎诺亚 |
| NANOKA.jpg | p080 | 黑部奈叶香 |
| ALISA.jpg | p086 | 紫藤亚里沙；ALISA_alt.jpg=p093 魔女化形态 |
| YUKI.jpg | p097 | 月代雪（大魔女）；YUKI_alt.jpg=p099 |
| GOKUCHO.jpg | p095 | 典狱长（站内未用，备用） |

其他可用页：p003 十五人总览、p094 看守三视图、p096「なれはて達」魔女化合集（未标注角色）。

⚠️ 注意：设定集扫描件带"学習交流専用"平铺水印（扫描分享版），文字环绕立绘但不遮挡主体；GPT Image 风格化重绘时影响很小。

## 小圆 9 角色 — `assets/raw-characters/madoka/`

来源：Puella Magi Wiki（wiki.puella-magi.net）官方立绘，全部透明背景 PNG。

| 文件 | 分辨率 | 来源 |
|---|---|---|
| MADOKA.png | 1220×1360 | https://images.puella-magi.net/8/80/Madoka_Full.png |
| HOMURA.png | 1220×1360 | https://images.puella-magi.net/4/42/Homura_Full.png（经典黑长直） |
| SAYAKA.png | 1220×1360 | https://images.puella-magi.net/3/39/Sayaka_Full.png |
| KYOKO.png | 1220×1360 | https://images.puella-magi.net/3/3a/Kyoko_Full.png |
| MAMI.png | 1220×1360 | https://images.puella-magi.net/3/36/Mami_Full.png |
| homura_devil.png | 1280×1600 | https://images.puella-magi.net/a/a5/Akuma_homura.png（恶魔形态） |
| madoka_god.png | 842×1291 | https://images.puella-magi.net/b/b7/Ultimate_Madoka_profile_full.png（圆环之理） |
| sayaka_siren.png | 1024×1024 | https://images.puella-magi.net/a/a5/Oktavia_Rebellion_Transparent.png（人鱼魔女） |
| kyoko_pragmatist.png | 652×1602 | https://images.puella-magi.net/8/8a/Main_kyoko_1.png（Wraith Arc 形态） |

## 未覆盖

- **UNSET（未定之魂）**：站内原创 fallback，无官方图。建议重绘阶段用生成图（哥特问号/雾中剪影意象）或不放图。
- 魔女化合集页 p096 中 2 个形态未对应角色，如需全员魔女化卡可人工辨认。
