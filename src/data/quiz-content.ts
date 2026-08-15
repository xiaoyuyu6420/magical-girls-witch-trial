// ============================================================================
// Quiz Content Data —「审判庭」posture 评分体系
// ----------------------------------------------------------------------------
// 移植自 HTML「审判庭·灵魂裁决与魔女降临」原型。三态姿态评分：
//   A = 粉饰（伪装的光明）  B = 清醒（直视的痛）  C = 扭曲（以恶为甲）
// 配合 Q18 路径(path)、Q8/Q22 倾向(tendency)、Q19 钥匙(keyUnlocked) 匹配 5 角色。
// ============================================================================

import type { DimDef } from "@/pack/types";
import {
  DIMENSIONS as PACK_DIMENSIONS,
  WEIGHTS as PACK_WEIGHTS,
  ALGO_CONFIG as PACK_ALGO_CONFIG,
  type DimCode,
} from "@/content/packs/witch-trial/config";

export type { DimDef, DimCode };
/**
 * Re-export pack engine config（向后兼容旧 import）。
 * ⚠️ posture 体系下 dimensions/weights/algo 不再参与评分，仅保留以避免破坏 import。
 */
export const DIMENSIONS = PACK_DIMENSIONS;
export const WEIGHTS = PACK_WEIGHTS;
export const ALGO_CONFIG = PACK_ALGO_CONFIG;

// ----------------------------------------------------------------------------
// 角色定义（5 角色，移植 HTML characterDatabase）
// ----------------------------------------------------------------------------
export interface PersonalityTypeDef {
  code: string;
  name: string;
  subtitle?: string;
  group: string;
  /** posture 体系不用 12 维向量；保留字段兼容旧 schema，留空 */
  vector: string;
  slogan: string;
  desc: string;
  keywords?: string;
  special?: boolean;
  /** 角色 IP 归属：madoka（魔法少女小圆）/ witch-trial（原创） */
  ipCode?: string;
  /** 审判官逼视（结果页"控诉"文案） */
  prosecution: string;
  /** 温柔落点（结果页"心灵安全网"文案） */
  softlanding: string;
  /** 角色标签，逗号分隔 */
  tags: string;
}

export const PERSONALITY_TYPES: PersonalityTypeDef[] = [
  {
    code: "homura_devil",
    name: "晓美焰 · 执念的黑化魔女",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "",
    desc: "",
    tags: "撕碎契约,极黑独占,深渊主宰,痛苦化剑",
    prosecution:
      "你不再相信任何温情与规则了。现实用一次次的背叛与冷眼教会了你：善良只会被当成软柿子。于是你收起眼泪，握紧了拳头。你宁可被全世界当成冷酷的魔女，也绝不再给任何人伤害你的机会。",
    softlanding:
      "带着硬壳活着并不耻辱，那是你长出的刺。在深夜卸下装甲时，请记得：那个渴望被拥抱的小女孩并没有消失，她一直在等你带她回家。",
  },
  {
    code: "madoka_god",
    name: "鹿目圆 · 终极救赎的圆环之理",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "",
    desc: "",
    tags: "纯洁殉道,大爱无疆,温热理想,承载希望",
    prosecution:
      "看清了世界的残酷与谎言后，你依然没有选择毁灭。你习惯将委屈咽下，用包容去体谅每一个伤害你的人。你常被误以为软弱，但选择“温柔”需要巨大的勇气。",
    softlanding:
      "你的善良是残破世界里最后的圣光，但也请多爱自己一点。你不需要背负所有人的幸福。",
  },
  {
    code: "sayaka_siren",
    name: "美树沙耶香 · 理想主义破灭的痛楚",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "",
    desc: "",
    tags: "正义执念,自卑撕裂,理想粉碎,痛楚成歌",
    prosecution:
      "你曾拥有最纯粹的正义感，却在现实的摩擦中被碾得粉碎。你无法忍受丑陋，更无法接受嫉妒中的自己。你的黑化是因为理想主义崩塌时的反噬。",
    softlanding:
      "承认自己的微瑕，并不代表你背叛了正义。学会与残缺的自己和解，是灵魂成熟的必经试炼。",
  },
  {
    code: "kyoko_pragmatist",
    name: "佐仓杏子 · 利己外衣下的真心",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "",
    desc: "",
    tags: "冷酷伪装,利己自存,孤高义气,燃尽执念",
    prosecution:
      "你曾被信仰深深伤害过，因此穿上了“只为自己而活”的冷酷装甲。你嘴上说着算计，对虚伪嗤之以鼻，但真正看到身陷深渊的同伴时，你依然会挺身而出。",
    softlanding:
      "别再用冷漠掩饰热忱。懂得保护自己固然聪明，但遇到值得的人时，不妨试着再次伸出双手。",
  },
  {
    code: "emma_truth",
    name: "樱羽艾玛 · 寻求真相的清醒审判者",
    subtitle: "默认审判者",
    group: "fallback",
    ipCode: "witch-trial",
    vector: "",
    slogan: "",
    desc: "",
    tags: "剥落面具,直视血淋,清醒审判,坚守真实",
    prosecution:
      "你不容易被谎言蒙蔽，也不屑于用虚幻的安慰欺骗自己。哪怕真相剥开后鲜血淋漓，你依然选择睁大眼睛清醒地看着。",
    softlanding:
      "清醒是一种高贵的能力，但过程往往伴随着剧痛。在看清世界残酷的同时，也请保留一角给温柔。",
  },
];

// ----------------------------------------------------------------------------
// 题目定义
// ----------------------------------------------------------------------------
export interface QuestionDef {
  /** posture 体系不使用维度；占位 "POSTURE" / "GATE" / "TRIGGER" */
  dim: string;
  text: string;
  meta: string;
  /** DB 打分语义：normal/gate/trigger */
  type: "normal" | "gate" | "trigger";
  /** 渲染类型：normal/scale/weight。默认 = type 或 normal */
  renderType?: "normal" | "scale" | "weight";
  options: {
    label: string;
    score?: number;
    /** gate:path(destroy/seen/peace/undecided) scale:tendency(SACRIFICE/OBSESSION) trigger:keyUnlocked("true"/"false") */
    value?: string;
    trigger?: string;
    /** 姿态：A=粉饰 B=清醒 C=扭曲（weight 题不用） */
    posture?: "A" | "B" | "C";
  }[];
}

/** 普通三态题构造器 */
const NQ = (
  meta: string,
  text: string,
  options: { label: string; posture: "A" | "B" | "C"; score: number }[],
): QuestionDef => ({
  dim: "POSTURE",
  meta,
  text,
  type: "normal",
  options,
});

export const QUESTIONS: QuestionDef[] = [
  // Q1
  NQ("Q1 · 晨光中的许愿",
    "清晨的阳光透过窗帘缝隙打在脸上，闹钟还没响。我睁开眼，看着天花板上的微尘在光里起舞。在那一刻，我心里悄悄浮现出对今天的期许——",
    [
      { label: "今天一定会有好事发生吧，我想把欢笑带给我遇到的每一个人。", posture: "A", score: 2 },
      { label: "只要能和平常一样平静、顺遂地度过，就已经足够幸运了。", posture: "B", score: 2 },
      { label: "其实有点疲惫，但还是强打起精神，准备穿上应对这个世界的伪装。", posture: "A", score: 3 },
    ]),
  // Q2
  NQ("Q2 · 小团体的温热",
    "放学后的教室，大家围在一起热烈地讨论着周末的聚会。有人忽然转过头，微笑着拉住我的手：“你肯定也会来的，对吧？少了你可不行。”那一刻——",
    [
      { label: "一阵暖流涌上心头，我用力地点点头，感觉自己终于被这个世界温柔地接纳了。", posture: "A", score: 2 },
      { label: "我笑着答应，心里却有一丝隐隐的惶恐，生怕自己表现得不够好而打破这份和谐。", posture: "A", score: 3 },
      { label: "我礼貌地应和着，心里却清楚，这种热络不过是转瞬即逝的泡沫。", posture: "B", score: 2 },
    ]),
  // Q3
  NQ("Q3 · 雨夜的伞檐",
    "深秋的雨夜，图书馆关门了。我站在门口，旁边是那个平时很少说话、有些孤僻的同班同学。她正窘迫地看着雨幕，手里没有任何雨具。而我手里恰好有一把伞。那一刻——",
    [
      { label: "我自然地撑开伞递过去，笑着说“一起走吧”，心里升起一股微小却真切的满足。", posture: "A", score: 2 },
      { label: "我犹豫了一下才开口邀请，虽然知道我们未必能成为朋友，但这不过是一件随手可做的善事。", posture: "B", score: 2 },
      { label: "我递过伞，心里却暗暗盘算：希望下次小组作业时，她能记得这份人情。", posture: "C", score: 2 },
    ]),
  // Q4
  NQ("Q4 · 被赋予的使命",
    "老师或长辈当着众人的面，将一项重要的任务交到了我手里，并拍着我的肩膀说：“你是最让人放心的。”那一刻——",
    [
      { label: "我挺直了脊背，内心充满了被信任的自豪，下定决心绝不辜负这份期望。", posture: "A", score: 3 },
      { label: "我感到肩膀上一沉，虽然微笑着答应，心里却泛起一阵被期待压得透不过气来的窒息感。", posture: "A", score: 3 },
      { label: "我谦逊地接下，心里却明白这不过是用好听的话套牢我的工具罢了。", posture: "C", score: 2 },
    ]),
  // Q5
  NQ("Q5 · 无声的妥协",
    "朋友聚餐时，大家都高声赞同去吃某家我不喜欢的餐厅。当有人顺口问起我的意见时——",
    [
      { label: "我欢快地说“我也觉得那家超棒”，只要大家开心，我的喜好并不重要。", posture: "A", score: 3 },
      { label: "我微笑着点头说“都可以”，默默收起了自己真实的念头。", posture: "B", score: 2 },
      { label: "我耸耸肩表示随意，心里却升起一丝被忽视的冷意。", posture: "C", score: 2 },
    ]),
  // Q6
  NQ("Q6 · 镜中的变身",
    "深夜，我站在洗手间的镜子前，看着镜子里疲惫又平凡的自己，脑海中忽然闪过小时候关于“魔法少女”的幻想。如果真的能获得某种力量——",
    [
      { label: "我想拥有守护大家的魔法，消除这世界上所有的眼泪和伤痛。", posture: "A", score: 2 },
      { label: "我想拥有让自己变得完美的力量，不再因为软弱和缺陷而自卑。", posture: "A", score: 3 },
      { label: "我想拥有隐身或消失的力量，彻底逃离这个令人窒息的世界。", posture: "B", score: 2 },
    ]),
  // Q7
  NQ("Q7 · 光芒下的阴影",
    "看着舞台中央那个光彩照人、被所有人簇拥的朋友，我站在台下阴暗的角落里默默鼓掌。那一刻——",
    [
      { label: "我是真心为她感到高兴，她的光芒仿佛也照亮了我微不足道的生活。", posture: "A", score: 2 },
      { label: "我卖力地鼓掌，心里却有一角在悄悄下坠，暗暗问自己“为什么我永远只能当陪衬”。", posture: "B", score: 3 },
      { label: "我冷眼看着这一切，心里默念：风光只是暂时的，站得越高，摔得越惨。", posture: "C", score: 3 },
    ]),
  // Q8 天平题（scale）
  {
    dim: "POSTURE", meta: "Q8 · 守护与自我", type: "normal", renderType: "scale",
    text: "假若天平的两端，一端是“不惜牺牲自己的情绪去换取大家的幸福”，另一端是“死守护住自己的界限哪怕让身边的人失望”。你会将筹码掷向——",
    options: [
      { label: "牺牲自我，换取温暖与安宁。【纯洁牺牲倾向】", posture: "A", score: 3, value: "SACRIFICE" },
      { label: "守住界限，哪怕承受孤立与冷眼。【极黑独占/自存倾向】", posture: "B", score: 3, value: "OBSESSION" },
    ],
  },
  // Q9
  NQ("Q9 · 脆弱时的怀抱",
    "遇到极度委屈的事情时，蜷缩在房间角落里的我，第一个闪过的念头是——",
    [
      { label: "渴望能有一个温暖的怀抱紧紧拥抱我，告诉我“一切都会好起来的”。", posture: "A", score: 2 },
      { label: "希望自己能快点坚强起来，像一把锋利的剑，不再需要任何人的垂怜。", posture: "B", score: 3 },
      { label: "不再抱有任何期待，毕竟从来没有人真正救过我。", posture: "C", score: 3 },
    ]),
  // Q10
  NQ("Q10 · 规训下的顺从",
    "面对长辈不容置疑的命令和对未来的安排，即使与我内心的渴望背道而驰，我通常会——",
    [
      { label: "选择相信他们是为我好，按部就班地走上被铺设好的道路。", posture: "A", score: 3 },
      { label: "表面上乖巧配合，私下里偷偷保留一小块属于自己的秘密领地。", posture: "B", score: 2 },
      { label: "内心剧烈地抗拒与撕扯，但在现实的威压下只能麻木地低头。", posture: "C", score: 2 },
    ]),
  // Q11
  NQ("Q11 · 完美无瑕的谎言",
    "当别人关切地问起“你最近还好吗”时，我的第一反应往往是——",
    [
      { label: "露出无瑕的微笑回答“我很好啊”，习惯性地展示阳光积极的一面。", posture: "A", score: 4 },
      { label: "开个玩笑搪塞过去，不希望自己的负面情绪麻烦到任何人。", posture: "B", score: 2 },
      { label: "冷淡地回一句“还行”，将所有涌动的痛苦死死封存在喉咙里。", posture: "C", score: 3 },
    ]),
  // Q12
  NQ("Q12 · 理想主义的微霜",
    "第一次发现自己敬佩的人私下里也会说谎、利己、展现丑陋的一面时，那一刻——",
    [
      { label: "我感到震惊和难过，但依然试图为对方寻找合理的解释。", posture: "A", score: 3 },
      { label: "我感到一阵幻灭，明白这个世界本就是残缺的，只能默默接受。", posture: "B", score: 3 },
      { label: "我心中升起一丝冷笑：看吧，根本没有真正干净的人。", posture: "C", score: 3 },
    ]),
  // Q13
  NQ("Q13 · 被轻描淡写的付出",
    "我熬夜几天几夜做出的努力，在会议上被上司或同伴轻飘飘地一笔带过，甚至将功劳归于他人。那一刻，我——",
    [
      { label: "深吸一口气安慰自己：没关系的，大家能把事情做好就行，我下次再努力。", posture: "A", score: 3 },
      { label: "指甲深深掐进掌心里，清醒地看着自己的心血被践踏，感到一阵恶心与徒劳。", posture: "B", score: 3 },
      { label: "心里泛起冷笑：既然你们不需要我的真心，那以后我也只会敷衍和作假。", posture: "C", score: 3 },
    ]),
  // Q14 砝码题（weight）—— 三槽：A假装平静 / B暗中反抗 / C彻底放弃，总和=3
  {
    dim: "POSTURE", meta: "Q14 · 崩塌时刻的筹码分配", type: "normal", renderType: "weight",
    text: "面对接踵而至的误解与压力，你的世界正处于崩塌边缘。请将手中仅存的 3 点心理筹码，分配给不同的应对姿态：",
    options: [
      { label: "weight::2|1|0", score: 3 },
      { label: "weight::2|0|1", score: 3 },
      { label: "weight::1|2|0", score: 2 },
      { label: "weight::0|2|1", score: 2 },
      { label: "weight::1|0|2", score: 2 },
      { label: "weight::0|1|2", score: 2 },
      { label: "weight::1|1|1", score: 1 },
    ],
  },
  // Q15
  NQ("Q15 · 被当作谈资的秘密",
    "偶然间，我在那个未曾把我拉入的群聊里，看见最亲近的朋友正用轻佻的字眼，把我藏得最深的伤痛当作谈资呈给众人看。那一刻——",
    [
      { label: "我默默关掉界面，劝自己：人都是要说闲话的，她一定只是无心的，我们还是朋友。", posture: "A", score: 3 },
      { label: "手心冰凉，我静静按下了“退出群聊”。我知道这段关系已经烂透了，再也回不去了。", posture: "B", score: 3 },
      { label: "我冷笑着保存了截图。这世上本就没有真心，来日方长，咱们看谁手里把柄多。", posture: "C", score: 4 },
    ]),
  // Q16
  NQ("Q16 · 无声的冷眼旁观",
    "高中那年，那个全班避之不及的同学默不作声地坐在我身旁。朋友拉拉我的袖子：“走了，别沾上晦气。”我看着她抠着桌角起皮漆的双手。那一刻——",
    [
      { label: "我顺从地起身走开，心里安慰自己：我不过是去买水，灰尘落在谁身上，不是我扬的风。", posture: "A", score: 3 },
      { label: "胃里一阵难受，但我还是低声说了句“我先走了”。我比谁都清楚，自己不过是个怯懦的共犯。", posture: "B", score: 3 },
      { label: "我把椅脚往外挪了挪，心生厌恶：可怜人必有可恨之处，她落得这般下场全是活该。", posture: "C", score: 3 },
    ]),
  // Q17
  NQ("Q17 · 以爱为名的勒索",
    "拿着不理想的成绩/绩效回家，父母长久地叹气：“我们一辈子的心血都白费了，你对得起我们吗？”那一刻——",
    [
      { label: "我赶忙道歉并保证下次做好，告诉自己：他们只是太累了，爱本来就是带着刺的。", posture: "A", score: 3 },
      { label: "我低头站着，任由窒息感吞噬自己。我很清楚，在这间屋子里我只是份寄托野心的资产。", posture: "B", score: 3 },
      { label: "我看着他们斑白的头发，心里升起一丝病态的快感：既然我只是傀儡，那就大家一起烂掉好了。", posture: "C", score: 4 },
    ]),
  // Q18 门控题（gate）—— 四路径
  {
    dim: "GATE", meta: "Q18 · 灵魂的路径抉择", type: "gate",
    text: "当所有的伪装剥落，现实的残酷如冰水般将你彻底浇透。站在这个无声的悬崖边，你内心中最强烈的声音是——",
    options: [
      { label: "【毁灭线】既然这个世界如此脏乱与不公，那就彻底掀翻它，让一切都归于灰烬。", posture: "C", score: 4, value: "destroy" },
      { label: "【被看见线】哪怕流血、哪怕粉身碎骨，我也要这世界睁开眼，看看我究竟有多痛！", posture: "B", score: 4, value: "seen" },
      { label: "【平静线】闭上双眼，不再挣扎，接受所有的残缺与遗憾，任由自己归于沉寂。", posture: "A", score: 4, value: "peace" },
      { label: "【游离线】我不知道……我只是在风里悬浮着，找不到落脚点，也不知该往何处去。", posture: "B", score: 3, value: "undecided" },
    ],
  },
  // Q19 触发题（trigger）—— keyUnlocked
  {
    dim: "TRIGGER", meta: "Q19 · 隐藏角色契约", type: "trigger",
    text: "迷雾深处，走出一个遍体鳞伤、正小声啜泣的“小时候的你”。她怀里抱着一把沾满锈迹与血迹的锁匙，抬起湿润的眼睛问你：“你还愿意相信奇迹吗？”",
    options: [
      { label: "接过那把沾血的钥匙，握紧拳头。（触发：黑化魔女 / 执念神明隐藏分支）", posture: "C", score: 3, value: "true" },
      { label: "摇摇头，转身走入迷雾之中。（维持：常规审判线）", posture: "B", score: 2, value: "false" },
    ],
  },
  // Q20
  NQ("Q20 · 无法逃离的自卑",
    "每当走在热闹的大街上，感觉周围人的目光扫过自己时，我身体最直观的反应是——",
    [
      { label: "立刻挺直腰板，露出完美的微笑，极力表现出毫无瑕疵的自信。", posture: "A", score: 3 },
      { label: "感到后背发凉、手心出汗，清醒地承受着那种根深蒂固的自卑感与无处遁形。", posture: "B", score: 3 },
      { label: "心里涌起一阵嫌恶，暗暗批判路人的穿搭与长相，用贬低他人来掩盖自己的虚怯。", posture: "C", score: 3 },
    ]),
  // Q21
  NQ("Q21 · 控制与互戕的爱情",
    "伴侣频繁挑剔我的穿着、朋友圈和言行，并表达“我都是为了你好”。那一刻——",
    [
      { label: "我笨拙地去改变自己，安慰自己：他只是太在乎我了，才会对我要求高。", posture: "A", score: 3 },
      { label: "我感到深深的疲惫并开口拒绝，哪怕我知道这句话说出口，感情可能就完蛋了。", posture: "B", score: 3 },
      { label: "我冷笑着反过来挑剔他的身材和收入：爱情不就是互相折磨吗？看谁狠得过谁。", posture: "C", score: 4 },
    ]),
  // Q22 天平题（scale）
  {
    dim: "POSTURE", meta: "Q22 · 终极代价", type: "normal", renderType: "scale",
    text: "审判官将你逼至死角，天平两端只能二选一：是“牺牲你自己，让身边所有爱过你的人重获幸福”，还是“拉着世界陪葬，只为抱紧你唯一的真情”？",
    options: [
      { label: "宁愿献祭自我，换取他人的光明。【纯洁殉道】", posture: "A", score: 3, value: "SACRIFICE" },
      { label: "宁可毁灭世界，也绝不放手执念。【极黑独占】", posture: "C", score: 4, value: "OBSESSION" },
    ],
  },
  // Q23
  NQ("Q23 · 隐秘的恶意与嫉妒",
    "当得知那个平时处处压你一头、完美无瑕的人突然遭遇了重大挫折时，你内心深处第一闪过的念头是——",
    [
      { label: "我惊慌地压下内心的波澜，不断责备自己“怎么能有这种坏心思”，强行展现关心。", posture: "A", score: 3 },
      { label: "我承认那一瞬间内心升起了一丝隐秘的轻松，虽然这让我感到愧疚与丑陋。", posture: "B", score: 3 },
      { label: "我感到无比惬意：苍天有眼，跌落神坛了吧，这才是你应得的报应。", posture: "C", score: 4 },
    ]),
  // Q24
  NQ("Q24 · 被榨干后的废弃",
    "曾经对你嘘寒问暖的团体或领导，在你失去了利用价值后，迅速将你边缘化。面对这种冷酷——",
    [
      { label: "我依然主动帮忙做杂事，告诉自己“大家只是太忙了，并不是故意冷落我”。", posture: "A", score: 3 },
      { label: "我静静收拾好东西离开，清醒地吞下“工具人被用完即丢”的残酷现实。", posture: "B", score: 3 },
      { label: "我在暗中破坏他们接下来的项目：既然你们不仁，那就别怪我让大家都干不成。", posture: "C", score: 4 },
    ]),
  // Q25
  NQ("Q25 · 悬崖边的告别",
    "假若所有的希望都已破灭，站在荒芜的终点，看着那个一路走来伤痕累累的自己，你想对她说——",
    [
      { label: "“没关系的，再坚持一下，明天阳光一定会照进来的。”（哪怕连你自己都不信）", posture: "A", score: 3 },
      { label: "“辛苦你了。这一路很痛，但我陪着你，我们不逃了。”", posture: "B", score: 3 },
      { label: "“把痛都化作恨吧，去让那些伤害过我们的人付出代价！”", posture: "C", score: 4 },
    ]),
  // Q26
  NQ("Q26 · 审判终章确认",
    "审判的声音在空旷的精神世界回响：“看清了吗？这就是你皮囊下的真实——包含了懦弱、妥协、阴暗与执拗的你自己。现在，你愿意以这样的真面目，签下这份生存的契约吗？”",
    [
      { label: "我闭上眼不敢直视，依然祈求能有一道圣光洗净我所有的脏污。【虚幻祷告】", posture: "A", score: 5 },
      { label: "我睁开眼，直视着审判官：“这就是残破的我，我带着这些伤痕与丑陋继续活着。”【清醒接纳】", posture: "B", score: 5 },
      { label: "我夺过契约撕碎：“我不需要你的审判！我的阴暗就是我的武器，我自会成为自己的神！”【彻底黑化】", posture: "C", score: 5 },
    ]),
];
