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
  /** 旧版结果解读字段；保留给现有数据库与 API 兼容 */
  prosecution: string;
  /** 旧版行动建议字段；新版结果页不再单独渲染 */
  softlanding: string;
  /** 旧版角色标签，逗号分隔；与 keywords 同步以兼容旧客户端 */
  tags: string;
}

export const PERSONALITY_TYPES: PersonalityTypeDef[] = [
  {
    code: "homura_devil",
    name: "晓美焰 · 执念的黑化魔女",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "重要的人一旦认定，你就很难退开。",
    desc: "你不是拒绝亲近，只是靠近之前会观察很久。一旦认定一个人重要，你会把对方的事当成自己的事；局面失控时，又会先收紧边界，尽量自己处理。你和焰相似的地方不是什么黑化，而是这份很难收回的认真。",
    keywords: "谨慎,边界感,行动先于表达",
    tags: "谨慎,边界感,行动先于表达",
    prosecution: "你不是拒绝亲近，只是靠近之前会观察很久。一旦认定一个人重要，你会把对方的事当成自己的事；局面失控时，又会先收紧边界，尽量自己处理。",
    softlanding: "在意一个人，不等于要替所有变数负责。把担心提前说出来，对方才有机会和你一起处理。",
  },
  {
    code: "madoka_god",
    name: "鹿目圆 · 终极救赎的圆环之理",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "你常常先注意到别人的需要。",
    desc: "气氛一不对，你通常会先看谁在难受，然后想自己能做什么。照顾人时你很有行动力，问题是自己的需要常常被排到后面。你和圆相似的地方，是温柔不只是态度，也会真的动手去做。",
    keywords: "敏感,照顾,行动力",
    tags: "敏感,照顾,行动力",
    prosecution: "气氛一不对，你通常会先看谁在难受，然后想自己能做什么。照顾人时你很有行动力，问题是自己的需要常常被排到后面。",
    softlanding: "答应照顾别人之前，先确认自己还有余裕。长期硬撑出来的体贴，最后容易变成委屈。",
  },
  {
    code: "sayaka_siren",
    name: "美树沙耶香 · 理想主义破灭的痛楚",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "你对公平和承诺很敏感。",
    desc: "答应过的事，你会当真；看到敷衍和偏袒，也比一般人更难受。事情没做好时，你容易先检讨自己，再把失望压成愤怒。你和沙耶香相似的地方，是不愿意用“随便啦”处理重要关系。",
    keywords: "原则感,认真,自我要求",
    tags: "原则感,认真,自我要求",
    prosecution: "答应过的事，你会当真；看到敷衍和偏袒，也比一般人更难受。事情没做好时，你容易先检讨自己，再把失望压成愤怒。",
    softlanding: "失望时先分清：哪部分是自己的责任，哪部分是别人的选择。不是每件事都要先归因给自己。",
  },
  {
    code: "kyoko_pragmatist",
    name: "佐仓杏子 · 利己外衣下的真心",
    group: "main",
    ipCode: "madoka",
    vector: "",
    slogan: "你的关心，常常包在现实判断里。",
    desc: "你习惯先算可行性，再决定要不要投入，不喜欢把气氛说得很满。但真正认定一个人后，你会用具体行动帮忙，只是不一定会承认自己在意。你和杏子相似的地方，是嘴上留余地，事上不轻易退。",
    keywords: "务实,有底线,嘴硬心软",
    tags: "务实,有底线,嘴硬心软",
    prosecution: "你习惯先算可行性，再决定要不要投入，不喜欢把气氛说得很满。但真正认定一个人后，你会用具体行动帮忙，只是不一定会承认自己在意。",
    softlanding: "把在意说得更直接一点，关系会少一些猜测；帮忙前讲清界限，也更容易长期相处。",
  },
  {
    code: "emma_truth",
    name: "樱羽艾玛 · 寻求真相的清醒审判者",
    subtitle: "默认审判者",
    group: "fallback",
    ipCode: "witch-trial",
    vector: "",
    slogan: "你想弄清楚事情本来的样子。",
    desc: "你不擅长用“算了”糊过去。一句话前后对不上，或者有人在关系里回避问题，你会注意到，也会想继续问。答案让人不舒服时，你仍宁愿先知道事实，再决定怎么处理。",
    keywords: "求真,有边界,不轻易自欺",
    tags: "求真,有边界,不轻易自欺",
    prosecution: "你不擅长用“算了”糊过去。一句话前后对不上，或者有人在关系里回避问题，你会注意到，也会想继续问。",
    softlanding: "追问之前，先分清已确认的事实和自己的猜测。把两者摊开，问题会更容易谈。",
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
      { label: "今天一定会有好事发生吧。见到谁，都笑着打个招呼。", posture: "A", score: 2 },
      { label: "像平常一样平平静静地过完，就已经很好了。", posture: "B", score: 2 },
      { label: "其实有点累。还是打起精神，把那副“没问题”的样子穿好。", posture: "A", score: 3 },
    ]),
  // Q2
  NQ("Q2 · 小团体的温热",
    "放学后的教室，大家围在一起热烈地讨论着周末的聚会。有人忽然转过头，微笑着拉住我的手：“你肯定也会来的，对吧？少了你可不行。”那一刻——",
    [
      { label: "心里一暖，我用力点头。被这样需要着，真好。", posture: "A", score: 2 },
      { label: "我笑着答应了，心里有点发紧——怕哪天自己不够好，这份热闹就散了。", posture: "A", score: 3 },
      { label: "我礼貌地应和着。心里清楚，这样的热闹，散起来也快。", posture: "B", score: 2 },
    ]),
  // Q3
  NQ("Q3 · 雨夜的伞檐",
    "深秋的雨夜，图书馆关门了。我站在门口，旁边是那个平时很少说话、有些孤僻的同班同学。她正窘迫地看着雨幕，手里没有任何雨具。而我手里恰好有一把伞。那一刻——",
    [
      { label: "我把伞递过去，笑着说“一起走吧”。做了件小事，心里挺踏实的。", posture: "A", score: 2 },
      { label: "我犹豫了一下才开口邀请。做朋友的可能不大，但顺路的事，做了就做了。", posture: "B", score: 2 },
      { label: "我递过伞，心里记下了这份人情：下次小组作业，她也该帮我一回。", posture: "C", score: 2 },
    ]),
  // Q4
  NQ("Q4 · 被赋予的使命",
    "老师或长辈当着众人的面，将一项重要的任务交到了我手里，并拍着我的肩膀说：“你是最让人放心的。”那一刻——",
    [
      { label: "我挺直了背。被人这么信任着，心里暗暗较劲：绝不能搞砸。", posture: "A", score: 3 },
      { label: "肩膀好像一下子沉了。我笑着应下来，可这份期待压得人喘不过气。", posture: "A", score: 3 },
      { label: "我客气地接下。心里明白，好听话说在前面，往后这摊事就都是我的了。", posture: "C", score: 2 },
    ]),
  // Q5
  NQ("Q5 · 无声的妥协",
    "朋友聚餐时，大家都高声赞同去吃某家我不喜欢的餐厅。当有人顺口问起我的意见时——",
    [
      { label: "我立刻说“那家我也超想去”。大家吃得开心，比我想吃什么重要。", posture: "A", score: 3 },
      { label: "我笑着说“都行”，把想说的那句话咽了回去。", posture: "B", score: 2 },
      { label: "我耸耸肩说“随便”。有点凉——好像也没人真的想问我。", posture: "C", score: 2 },
    ]),
  // Q6
  NQ("Q6 · 镜中的变身",
    "深夜，我站在洗手间的镜子前，看着镜子里疲惫又平凡的自己，脑海中忽然闪过小时候关于“魔法少女”的幻想。如果真的能获得某种力量——",
    [
      { label: "我想拥有守护大家的魔法，让所有人的眼泪都能消失。", posture: "A", score: 2 },
      { label: "我想变得完美，不再因为那些软弱和不完美，在人前抬不起头。", posture: "A", score: 3 },
      { label: "我想拥有隐身的能力——至少消失的时候，谁也找不到我。", posture: "B", score: 2 },
    ]),
  // Q7
  NQ("Q7 · 光芒下的阴影",
    "看着舞台中央那个光彩照人、被所有人簇拥的朋友，我站在台下阴暗的角落里默默鼓掌。那一刻——",
    [
      { label: "我是真心为她高兴。她这么耀眼，我这当朋友的，脸上也有光。", posture: "A", score: 2 },
      { label: "我使劲鼓掌，掌心有点发凉：为什么站在光里的，永远不是我？", posture: "B", score: 3 },
      { label: "我在台下冷冷看着。风光嘛，都是暂时的——站得越高，摔得越狠。", posture: "C", score: 3 },
    ]),
  // Q8 天平题（scale）
  {
    dim: "POSTURE", meta: "Q8 · 守护与自我", type: "normal", renderType: "scale",
    text: "天平两端，一端是“压下自己的情绪，换大家都好”，另一端是“守住自己的界限，哪怕让身边的人失望”。你把筹码放在——",
    options: [
      { label: "牺牲自我，换取温暖与安宁。【纯洁牺牲倾向】", posture: "A", score: 3, value: "SACRIFICE" },
      { label: "守住界限，哪怕承受孤立与冷眼。【极黑独占/自存倾向】", posture: "B", score: 3, value: "OBSESSION" },
    ],
  },
  // Q9
  NQ("Q9 · 脆弱时的怀抱",
    "遇到极度委屈的事情时，蜷缩在房间角落里的我，第一个闪过的念头是——",
    [
      { label: "想被谁抱一下，听一句“没事的，都会过去”。", posture: "A", score: 2 },
      { label: "想快点硬气起来。往后的事自己扛，不用再看谁的脸色。", posture: "B", score: 3 },
      { label: "不再指望了。反正从来没有人真的来过。", posture: "C", score: 3 },
    ]),
  // Q10
  NQ("Q10 · 规训下的顺从",
    "面对长辈不容置疑的命令和对未来的安排，即使与我内心的渴望背道而驰，我通常会——",
    [
      { label: "相信他们是为我好，顺着铺好的路往下走。", posture: "A", score: 3 },
      { label: "表面乖乖配合，私下偷偷留一块只属于自己的地方。", posture: "B", score: 2 },
      { label: "心里抗拒得整宿睡不着，可第二天还是乖乖照做了。", posture: "C", score: 2 },
    ]),
  // Q11
  NQ("Q11 · 完美无瑕的谎言",
    "当别人关切地问起“你最近还好吗”时，我的第一反应往往是——",
    [
      { label: "笑得比谁都快：“我挺好的。”反正大家想听的也是这句。", posture: "A", score: 4 },
      { label: "开个玩笑岔过去。自己的坏情绪，不想拿去麻烦别人。", posture: "B", score: 2 },
      { label: "淡淡回一句“还行”，涌到嘴边的话又咽了回去。", posture: "C", score: 3 },
    ]),
  // Q12
  NQ("Q12 · 理想主义的微霜",
    "第一次发现自己敬佩的人私下里也会说谎、利己、展现丑陋的一面时，那一刻——",
    [
      { label: "我又震惊又难过，但还是忍不住替他找理由开脱。", posture: "A", score: 3 },
      { label: "有点幻灭。原来谁都一样，只能慢慢接受。", posture: "B", score: 3 },
      { label: "心里冷笑了一下：看吧，根本就没有真正干净的人。", posture: "C", score: 3 },
    ]),
  // Q13
  NQ("Q13 · 被轻描淡写的付出",
    "我熬夜几天几夜做出的努力，在会议上被上司或同伴轻飘飘地一笔带过，甚至将功劳归于他人。那一刻，我——",
    [
      { label: "深吸一口气，安慰自己：没关系，事情做好就行，下次再努力。", posture: "A", score: 3 },
      { label: "指甲掐进掌心。我清楚自己熬了几个通宵，也清楚这口气只能自己咽。", posture: "B", score: 3 },
      { label: "心里冷笑：行。既然真心不值钱，往后我也只是应付差事。", posture: "C", score: 3 },
    ]),
  // Q14 砝码题（weight）—— 三槽：A假装平静 / B暗中反抗 / C彻底放弃，总和=3
  {
    dim: "POSTURE", meta: "Q14 · 崩塌时刻的筹码分配", type: "normal", renderType: "weight",
    text: "误解和压力一件接一件压下来，快撑不住了。把手里仅剩的 3 点心理筹码，分给下面三种应对方式：",
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
      { label: "我默默关掉界面，劝自己：谁人背后不说人，她只是无心，我们还是朋友。", posture: "A", score: 3 },
      { label: "手心一点点凉下去，我按下了“退出群聊”。这段关系到这儿吧，回不去了。", posture: "B", score: 3 },
      { label: "我保存了截图。心里某扇门关上了——往后对她，我也留一手。", posture: "C", score: 4 },
    ]),
  // Q16
  NQ("Q16 · 无声的冷眼旁观",
    "高中那年，那个全班避之不及的同学默不作声地坐在我身旁。朋友拉拉我的袖子：“走了，别沾上晦气。”我看着她抠着桌角起皮漆的双手。那一刻——",
    [
      { label: "我起身走开，替自己找好了理由：不过是去买个水，这风又不是我扬的。", posture: "A", score: 3 },
      { label: "胃里一阵发紧，我还是低声说了句“我先走了”。我知道，我也算其中一个。", posture: "B", score: 3 },
      { label: "我把椅子往外挪了挪：可怜之人必有可恨之处，她那样，她自己也有份。", posture: "C", score: 3 },
    ]),
  // Q17
  NQ("Q17 · 以爱为名的勒索",
    "拿着不理想的成绩/绩效回家，父母长久地叹气：“我们一辈子的心血都白费了，你对得起我们吗？”那一刻——",
    [
      { label: "我赶忙道歉，保证下次一定考好。他们也是为我操心，累坏了。", posture: "A", score: 3 },
      { label: "我低头站着不吭声。心里清楚，他们要的是那张成绩单，不是我。", posture: "B", score: 3 },
      { label: "看着他们斑白的头发，我心里竟然有点痛快：行啊，我烂给你们看。", posture: "C", score: 4 },
    ]),
  // Q18 门控题（gate）—— 四路径
  {
    dim: "GATE", meta: "Q18 · 灵魂的路径抉择", type: "gate",
    text: "伪装一层层剥落，现实的凉意从头浇到脚。站在这道无声的悬崖边，你心里最响的声音是——",
    options: [
      { label: "【毁灭线】这个世界又脏又不公——那就掀翻它，让一切归于灰烬。", posture: "C", score: 4, value: "destroy" },
      { label: "【被看见线】哪怕流血、哪怕粉身碎骨，我也要这世界睁开眼，看看我究竟有多痛！", posture: "B", score: 4, value: "seen" },
      { label: "【平静线】闭上眼，不再挣扎。接受所有的残缺和遗憾，让自己慢慢沉下去。", posture: "A", score: 4, value: "peace" },
      { label: "【游离线】我不知道……我就悬在风里，找不到落脚的地方，也不知道要去哪。", posture: "B", score: 3, value: "undecided" },
    ],
  },
  // Q19 触发题（trigger）—— keyUnlocked
  {
    dim: "TRIGGER", meta: "Q19 · 隐藏角色契约", type: "trigger",
    text: "迷雾深处，走出一个小声啜泣的小孩——是小时候的你。她怀里抱着一把生锈的钥匙，抬头问你：“你还愿意相信奇迹吗？”",
    options: [
      { label: "接过那把沾血的钥匙，握紧拳头。（触发：黑化魔女 / 执念神明隐藏分支）", posture: "C", score: 3, value: "true" },
      { label: "摇摇头，转身走入迷雾之中。（维持：常规审判线）", posture: "B", score: 2, value: "false" },
    ],
  },
  // Q20
  NQ("Q20 · 无法逃离的自卑",
    "每当走在热闹的大街上，感觉周围人的目光扫过自己时，我身体最直观的反应是——",
    [
      { label: "立刻挺直腰板，步子迈得又稳又大——装也要装出自信的样子。", posture: "A", score: 3 },
      { label: "后背发凉，手心出汗。那种“我不够好”的感觉，走到哪都甩不掉。", posture: "B", score: 3 },
      { label: "心里开始挑别人的刺：那人的发型、那人的穿搭……挑着挑着，自己好像真的好受了点。", posture: "C", score: 3 },
    ]),
  // Q21
  NQ("Q21 · 控制与互戕的爱情",
    "伴侣频繁挑剔我的穿着、朋友圈和言行，并表达“我都是为了你好”。那一刻——",
    [
      { label: "我笨拙地照他说的改。他这么挑剔，大概是真的在乎我吧。", posture: "A", score: 3 },
      { label: "我很累，但还是说了“不”。我知道这句话一出口，这段感情可能就到头了。", posture: "B", score: 3 },
      { label: "我反过来挑剔他的身材和收入。他挑我一句，我顶回去一句，谁也别想占上风。", posture: "C", score: 4 },
    ]),
  // Q22 天平题（scale）
  {
    dim: "POSTURE", meta: "Q22 · 终极代价", type: "normal", renderType: "scale",
    text: "审判官把你逼到死角，天平两端只能选一个：是“牺牲你自己，换爱过你的人重新幸福”，还是“拉着整个世界陪葬，也要抱紧你唯一的真情”？",
    options: [
      { label: "宁愿献祭自我，换取他人的光明。【纯洁殉道】", posture: "A", score: 3, value: "SACRIFICE" },
      { label: "宁可毁灭世界，也绝不放手执念。【极黑独占】", posture: "C", score: 4, value: "OBSESSION" },
    ],
  },
  // Q23
  NQ("Q23 · 隐秘的恶意与嫉妒",
    "听说那个处处压你一头、一直完美的人突然栽了大跟头，我心里第一下闪过的念头是——",
    [
      { label: "我慌忙把那点念头压下去，骂自己“怎么能这么想”，然后照常发去一句问候。", posture: "A", score: 3 },
      { label: "我承认那一秒有点暗爽。紧接着就是愧疚：我怎么是这样的人。", posture: "B", score: 3 },
      { label: "爽，是真的爽。等这一天很久了——凭什么好事全让你占了。", posture: "C", score: 4 },
    ]),
  // Q24
  NQ("Q24 · 被榨干后的废弃",
    "曾经对你嘘寒问暖的团体或领导，在你失去了利用价值后，迅速将你边缘化。面对这种冷酷——",
    [
      { label: "我照旧帮着做杂事，替他们想：大家只是太忙，不是故意晾着我。", posture: "A", score: 3 },
      { label: "我默默收拾好东西离开。被用完就丢，这事儿我记下了。", posture: "B", score: 3 },
      { label: "面上不吵不闹，心里已经把他们拉黑。再找我帮忙？抱歉，我可“忙”着呢。", posture: "C", score: 4 },
    ]),
  // Q25
  NQ("Q25 · 悬崖边的告别",
    "如果所有希望都破灭了，站在路的尽头，看着那个一路伤痕累累的自己，我想对她说——",
    [
      { label: "“没关系的，再坚持一下，明天阳光一定会照进来的。”（哪怕你自己都不太信）", posture: "A", score: 3 },
      { label: "“辛苦你了。这一路很痛，但我陪着你，我们不逃了。”", posture: "B", score: 3 },
      { label: "“这些痛我都记着。往后谁再伤我们，我们就还回去。”", posture: "C", score: 4 },
    ]),
  // Q26
  NQ("Q26 · 审判终章确认",
    "审判的声音在空旷的精神世界回响：“看清了吗？这就是你皮囊底下的真实——懦弱、妥协、阴暗、执拗，一样都不少的你。现在，愿意带着这副真面目，签下这份生存契约吗？”",
    [
      { label: "我闭上眼不敢直视，依然祈求能有一道圣光洗净我所有的脏污。【虚幻祷告】", posture: "A", score: 5 },
      { label: "我睁开眼，直视着审判官：“这就是残破的我，我带着这些伤痕与丑陋继续活着。”【清醒接纳】", posture: "B", score: 5 },
      { label: "我夺过契约撕碎：“我不需要你的审判！我的阴暗就是我的武器，我自会成为自己的神！”【彻底黑化】", posture: "C", score: 5 },
    ]),
];
