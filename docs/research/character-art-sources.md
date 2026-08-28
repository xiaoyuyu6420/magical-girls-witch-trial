# 角色卡重绘底图来源清单

> 用途：结果页翻转角色卡的 GPT Image 风格化重绘底图。素材在本地 `assets/raw-characters/`（版权图，已 gitignore 不入库）。
> 若素材丢失，按本清单重新获取。

## 魔女审判 14 角色 — `assets/raw-characters/witch-trial/`

**2026-08-29 已替换为无水印版**：14 个主立绘全部换成官方无水印图。原图源（设定集扫描件，带"学習交流専用"平铺水印）仍可在 `assets/raw-characters/pdf-extract/pNNN.jpg` 找到，`*_alt.jpg` 动作参考文件保留为原扫描版。

### 现行来源（无水印官方图）

- **13 名囚人**（EMMA~ALISA，jpg 1184×781）：官网 manosaba.com「キャラクター」区角色立绘（点击可看 1920×1080 详情卡），页面 JS 动态渲染（Studio 平台，资产在 `storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/`），Playwright + 系统 Chrome 抓取。深黑背景单人上半身立绘，无水印。
- **YUKI**（png 2368×3776 透明底）：萌娘百科「月代雪」条目立绘图 `storage.moegirl.org.cn/moegirl/commons/7/7f/月代雪立绘.png`（URL 去掉 `!/...` 水印变换参数即原图）。官网角色区只有 13 名囚人，大魔女 YUKI 不在其中；game8 相关页（707757）也无高清立绘。**注意：YUKI 主文件后缀已从 .jpg 改为 .png（保留透明通道）。**

| 文件 | 分辨率 | 来源 |
|---|---|---|
| EMMA.jpg | 1184×781 | manosaba.com 立绘（桜羽エマ） |
| HIRO.jpg | 1184×781 | manosaba.com 立绘（二階堂ヒロ） |
| MERURU.jpg | 1184×781 | manosaba.com 立绘（氷上メルル） |
| HANNA.jpg | 1184×781 | manosaba.com 立绘（遠野ハンナ） |
| SHERRY.jpg | 1184×781 | manosaba.com 立绘（橘シェリー） |
| ANAN.jpg | 1184×781 | manosaba.com 立绘（夏目アンアン） |
| LEIA.jpg | 1184×781 | manosaba.com 立绘（蓮見レイア） |
| COCO.jpg | 1184×781 | manosaba.com 立绘（沢渡ココ） |
| MIRIA.jpg | 1184×781 | manosaba.com 立绘（佐伯ミリア） |
| MARGO.jpg | 1184×781 | manosaba.com 立绘（宝生マーゴ） |
| NOAH.jpg | 1184×781 | manosaba.com 立绘（城ヶ崎ノア） |
| NANOKA.jpg | 1184×781 | manosaba.com 立绘（黒部ナノカ） |
| ALISA.jpg | 1184×781 | manosaba.com 立绘（紫藤アリサ） |
| YUKI.png | 2368×3776 | 萌娘百科 月代雪立绘.png（大魔女，透明底全身） |

### 备用图源（game8.jp，均无水印）

- 13 囚人角色页有 1920×1080「组合设定图」（全身立绘+半身像+表情差分，深紫红纹理背景），如 EMMA=game8.jp/manosaba/703846；全身立绘占左侧约 1/3（裁剪后约 576×864，低于短边 600 要求故未采用）。
- game8 各角色页 ID：EMMA=703846、HIRO=705070、MERURU=705081、HANNA=705079、SHERRY=705078、ANAN=705071、LEIA=705073、COCO=705080、MIRIA=705074、MARGO=705075、NOAH=705072、NANOKA=705076、ALISA=705077；YUKI=707757（正体考察页，无高清立绘）。
- 2026-07 起 13 囚人有小说版新规立绘（KADOKAWA X 公开，角スニーカー文庫『魔法少女ノ魔女裁判』1 巻）。

### 原扫描版（历史来源，已废弃）

原主立绘来自用户提供的《魔法少女の魔女审判》官方设定集 PDF（112 页，2480×3508 @300dpi），从 `assets/raw-characters/pdf-extract/pNNN.jpg` 复制命名。设定集 PDF 原件：`/Users/munich/Downloads/魔法少女の魔女审判设定集.zip`。

| 文件 | 设定集页 | 备注 |
|---|---|---|
| EMMA_alt.jpg | p006 | 动作参考（保留扫描版） |
| HIRO_alt.jpg | p017 | 9 姿势集 |
| MERURU_alt.jpg | p025 | 魔女化形态 |
| LEIA_alt.jpg | p050 | |
| COCO_alt.jpg | p059 | 三视图 |
| MARGO_alt.jpg | p073 | 魔女化形态 |
| ALISA_alt.jpg | p093 | 魔女化形态 |
| YUKI_alt.jpg | p099 | |
| GOKUCHO.jpg | p095 | 典狱长（站内未用，备用，仍是扫描版） |

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
