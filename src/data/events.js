// ============ 探索事件数据 ============
// 纯数据：不 import、不写函数、不写逻辑，全部字面量。
// 严格遵守 docs/DATA_SPEC.md：所有 op 名、字段名、条件对象均取自规范。
// 共 28 个：act 0 通用 5 个 / act 1 八个 / act 2 八个 / act 3 七个。

export const EVENTS = [

  // ==================== act:0 通用 ====================

  {
    id: 'ev_road_kiln',
    name: '路边熔炉',
    glyph: '🜂',
    act: 0,
    text: '熔炉的余温还没散，柜台上压着一只陌生的手。炉膛里的火是青白色的，照得墙上的影子往反方向爬。炉膛边摆着一只铁钳，钳口还温着。',
    options: [
      {
        label: '把手伸进炉膛',
        desc: '损失 6 点生命，获得 60 金币与 1 层「仪式」。',
        result: {
          text: '你抓出一把还烫手的硬币，火舌顺着袖口爬进血管，在某个地方点了引子。',
          effects: [
            { op: 'loseHp', n: 6 },
            { op: 'gold', n: 60 },
            { op: 'buff', s: 'ritual', v: 1, t: 'self' },
          ],
        },
      },
      {
        label: '让同行者先伸手',
        desc: '移除牌组中的一张牌，损失 4 点生命，获得一张「灼热挥砍」。',
        result: {
          text: '他伸手的时候没出声，炉膛替他出了声。你把炉底压着的那张牌抽了出来，那东西已经发红。',
          effects: [
            { op: 'removeCard' },
            { op: 'loseHp', n: 4 },
            { op: 'addDeck', card: 'c_ember_slash' },
          ],
        },
      },
      {
        label: '熄了它',
        result: { text: '你用湿麻袋盖住炉口。火没有熄，只是转到了更深处。' },
      },
    ],
  },

  {
    id: 'ev_dry_well',
    name: '干井',
    glyph: '💧',
    act: 0,
    text: '井口用铁栅封着，栅缝里卡着几十只前任打水人的手套。往下看是黑，黑得不自然，像井底压着一整层没熄的夜。旁边拴着一根锈绳，绳子还在轻轻晃。',
    options: [
      {
        label: '把绳子和命一起押上',
        desc: '若掷中，获得 110 金币；否则损失 8 点生命。',
        result: {
          text: '绳子放到底，撞上的不是水。你拽上来的是钱，压得绳子烫手；或者是一只手，它替你付了力气。',
          effects: [
            {
              op: 'if',
              cond: { type: 'chance', p: 0.6 },
              then: [{ op: 'gold', n: 110 }],
              else: [{ op: 'loseHp', n: 8 }],
            },
          ],
        },
      },
      {
        label: '只捞浮在上面的',
        desc: '获得 40~60 金币。',
        result: {
          text: '你只捡浅的那一层，指甲缝里全是别人的东西。',
          loot: { gold: [40, 60] },
        },
      },
      {
        label: '把井盖盖回去',
        result: { text: '有些井底埋的不是水，是等着有人再往下看。' },
      },
    ],
  },

  {
    id: 'ev_scrap_shrine',
    name: '废铁神龛',
    glyph: '🕯',
    act: 0,
    text: '半截排气管道被摆成了神龛，管口朝上，里面塞满了齿轮、断针和烧焦的骨头。有人在这儿跪过，膝盖印还在油污里。神龛边缘压着一卷没拆完的铜皮。',
    options: [
      {
        label: '拆掉一块朽木',
        desc: '移除牌组中的一张牌。',
        result: {
          text: '你从自己的行囊里挑出最烂的一张，压进管口。管子合拢的声音像有人在很远的地方点头。',
          effects: [{ op: 'removeCard' }],
        },
      },
      {
        label: '给它换块新铜',
        desc: '升级牌组中的 2 张牌。',
        result: {
          text: '铜皮被敲成两片，正好覆住牌面上最旧的两道刮痕。',
          effects: [{ op: 'upgradeCard', n: 2 }],
        },
      },
      {
        label: '在灰前跪一会儿',
        desc: '回复 15 点生命，并从三件遗物中挑选一件。',
        result: {
          text: '膝盖陷进灰里的时候，有东西从管子里滑进你掌心——它挑了你。',
          effects: [{ op: 'heal', n: 15 }],
          loot: { relics: 1 },
        },
      },
    ],
  },

  {
    id: 'ev_potion_trader',
    name: '药水贩子',
    glyph: '🧪',
    act: 0,
    text: '他推着一辆没有轮子的手推车，车斗里塞满了没标签的瓶子，颜色都不太对。他说自己不做买卖，只换故事。你身上最不值钱的东西，恰好是故事。',
    options: [
      {
        label: '报出一个秘密',
        desc: '移除牌组中的一张牌，并获得 1~2 瓶随机药水。',
        result: {
          text: '你说了某个同行者的名字。他挑出瓶子的时候手很稳，稳得像早就知道你会说谁。',
          effects: [{ op: 'removeCard' }],
          loot: { potions: [1, 2] },
        },
      },
      {
        label: '反问他从哪儿来',
        desc: '损失 5 点生命，获得 1 瓶随机药水。',
        result: {
          text: '他掀开袖子给你看那道疤。你看清了，手也伸了过去。',
          effects: [{ op: 'loseHp', n: 5 }],
          loot: { potions: [1, 1] },
        },
      },
      {
        label: '转身就走',
        result: { text: '车轮碾过砂石的声音一直跟了你半条街。' },
      },
    ],
  },

  {
    id: 'ev_ash_bargain',
    name: '灰烬契约',
    glyph: '📜',
    act: 0,
    text: '契约摊在铁皮桌上，纸是压出来的，笔画陷进纸里像刻上去的。签字栏下面用极小的字写着代价，字太小，像是怕被谁看见。灰从桌子腿往上爬，爬到契约边缘就停住了。',
    options: [
      {
        label: '按下手印',
        desc: '永久失去 8 点最大生命，并从三件遗物中挑选一件。',
        result: {
          text: '印泥是温的。松开手时，胸腔里空出一小块地方，凉得能听见风。',
          effects: [{ op: 'maxHp', n: -8 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '撕掉契约',
        desc: '移除牌组中的一张牌。',
        result: {
          text: '纸撕开的声音很脆。摊主没拦你，只是把那支笔重新摆正。',
          effects: [{ op: 'removeCard' }],
        },
      },
      {
        label: '把他连同契约一起烧了',
        result: { text: '火烧到签名那一栏就熄了。灰烬里没有字，只有一枚还没凉透的指印。' },
      },
    ],
  },

  // ==================== act:1 边境 ====================

  {
    id: 'ev_toll_gate',
    name: '收费哨卡',
    glyph: '🚧',
    act: 1,
    text: '哨卡横在唯一一条能走的路上，栅门是拿棺材板钉的。守门的独眼机器人正拿一块磨刀石敲自己的关节，敲得有节奏，像在数数。岗亭顶上挂着一块手写的牌子：过路费，或过路费的一部分。',
    options: [
      {
        label: '硬闯',
        desc: '损失 10 点生命，并获得 45~60 金币。',
        result: {
          text: '栅门在你肩上散架。它没有追，只是继续敲那块磨刀石，敲得更快了一点。',
          effects: [{ op: 'loseHp', n: 10 }],
          loot: { gold: [45, 60] },
        },
      },
      {
        label: '卸下它的护甲板',
        desc: '移除牌组中的一张牌。',
        result: {
          text: '护甲板下来的时候，你顺手把自己最不趁手的那件装备留在了原地。反正它也不需要护甲。',
          effects: [{ op: 'removeCard' }],
        },
      },
      {
        label: '交足过路费',
        desc: '升级牌组中的 2 张牌。',
        req: { gold: 40 },
        result: {
          text: '它把钱扫进铁盒，头也不回地敲了敲岗亭柱子。柱子里的弹簧松开，一段崭新的行程从你脚下开始。',
          effects: [{ op: 'upgradeCard', n: 2 }],
        },
      },
    ],
  },

  {
    id: 'ev_wounded_scav',
    name: '断腿的拾荒者',
    glyph: '🩸',
    act: 1,
    text: '他靠在翻倒的推车边，断腿用传动轴绑着，轴还在慢慢转。看见你背包的形状，他笑了，笑得比哭还省力气。他说他包里还剩几瓶没碎的药剂，但那也是别人的腿换来的。',
    options: [
      {
        label: '分他一半口粮',
        desc: '失去 50 金币，回复 20 点生命，并获得 1 瓶随机药水。',
        req: { gold: 50 },
        result: {
          text: '他把盐块和药一起塞给你，说这是利息。推车上的传动轴转了最后半圈，停了。',
          effects: [
            { op: 'gold', n: -50 },
            { op: 'heal', n: 20 },
          ],
          loot: { potions: [1, 1] },
        },
      },
      {
        label: '拿了他的刀就走',
        desc: '永久失去 5 点最大生命，并获得一张卡牌（三选一）。',
        result: {
          text: '刀很沉。走出三步你才明白，他绑腿的那根传动轴是从你身上拆下来的。',
          effects: [{ op: 'maxHp', n: -5 }],
          loot: { cards: 1 },
        },
      },
      {
        label: '这不该由你决定',
        result: { text: '你绕过了推车。走出半里地，你还记得那根轴转动的节奏。' },
      },
    ],
  },

  {
    id: 'ev_salt_merchant',
    name: '盐贩',
    glyph: '🧂',
    act: 1,
    text: '他把盐装在一格格铁盒里，盒盖上贴着价目，价目是用刀尖刻的，刻得很客气。他的秤砣是块打磨过的骨头，沉得不像话。他说边区的盐从不零卖，只整批走。',
    options: [
      {
        label: '零买三份',
        desc: '连续三次各获得 15 金币，共 45 金币。',
        result: {
          text: '他数了三遍，每一遍都少一块。你没敢再数第四遍。',
          effects: [{ op: 'repeat', n: 3, then: [{ op: 'gold', n: 15 }] }],
        },
      },
      {
        label: '整批拿走',
        desc: '获得 100 金币，并移除牌组中的一张牌。',
        result: {
          text: '整批拿走要押一件你随身带着的东西。他挑了最旧的那件，你没拦。',
          effects: [
            { op: 'gold', n: 100 },
            { op: 'removeCard' },
          ],
        },
      },
      {
        label: '用盐换干净的水',
        desc: '回复 20 点生命，并获得 1 瓶随机药水。',
        result: {
          text: '水是甜的，你含了很久才咽下去。',
          effects: [{ op: 'heal', n: 20 }],
          loot: { potions: [1, 1] },
        },
      },
    ],
  },

  {
    id: 'ev_forge_wagon',
    name: '流动锻炉',
    glyph: '🔨',
    act: 1,
    text: '一辆焊死的货车停在道边，车厢就是炉子，烟囱伸到车顶，上面挂着十几把钳子。锻锤自己会落，节奏和你的心跳差半拍。锻炉旁贴着价目，最后一行是：淬火不退货。',
    options: [
      {
        label: '把整副牌淬进火里',
        desc: '升级牌组中的 2 张牌，损失 8 点生命。',
        result: {
          text: '两张牌翻了个面，纹路深了一截。疼是别人的，牌是你的。',
          effects: [
            { op: 'upgradeCard', n: 2 },
            { op: 'loseHp', n: 8 },
          ],
        },
      },
      {
        label: '只淬最烂的那张',
        desc: '移除牌组中的一张牌，回复 12 点生命。',
        result: {
          text: '抽出来那张已经卷边了。你把它扔进炉里，火安静了很久，像松了口气。',
          effects: [
            { op: 'removeCard' },
            { op: 'heal', n: 12 },
          ],
        },
      },
      {
        label: '让锻锤自己挑',
        desc: '一半几率升级 2 张牌；另一半几率永久失去 6 点最大生命。',
        result: {
          text: '锤子落下去了。成不成，全看你站得离炉口有多近。',
          effects: [
            {
              op: 'if',
              cond: { type: 'chance', p: 0.5 },
              then: [{ op: 'upgradeCard', n: 2 }],
              else: [{ op: 'maxHp', n: -6 }],
            },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_silent_bell',
    name: '无声钟楼',
    glyph: '🕰',
    act: 1,
    text: '钟楼还在，铜钟也还在，只是钟舌不见了。风穿过钟腹的声音不像风，像有人在很慢地吸气。楼下的告示写着：摘铃者得物，摘铃者受誓。',
    options: [
      {
        label: '摘下钟舌',
        desc: '获得一张卡牌（三选一），并永久加入一张诅咒牌「锈蚀之誓」。',
        result: {
          text: '钟舌比想象中轻。落地的一刻它才显出重量——它开始往下长，长进你的牌里。',
          effects: [{ op: 'addDeck', card: 'c_curse_rusty_oath' }],
          loot: { cards: 1 },
        },
      },
      {
        label: '砸碎钟摆',
        desc: '损失 12 点生命，获得 70 金币。',
        result: {
          text: '铜声闷在墙里，钟楼只轻轻一沉。落地的铜够付很久的过路费。',
          effects: [
            { op: 'loseHp', n: 12 },
            { op: 'gold', n: 70 },
          ],
        },
      },
      {
        label: '捂住耳朵快走',
        result: { text: '那口呼吸一直跟到镇口，才慢慢松开你的骨头。' },
      },
    ],
  },

  {
    id: 'ev_mirror_pool',
    name: '镜池',
    glyph: '🪞',
    act: 1,
    text: '一池黑水静得不像水，倒影里的你比他该有的样子更完整。池底沉着碎镜片，每一片里都有一张没在看你的人脸。水面偶尔鼓一下，像底下有人呼吸。',
    options: [
      {
        label: '低头看自己的倒影',
        desc: '移除牌组中的一张牌，获得 65 金币。',
        result: {
          text: '他替你从口袋里拿走了最不值钱的一件，然后把一枚硬币按在你掌心——硬币是热的。',
          effects: [
            { op: 'removeCard' },
            { op: 'gold', n: 65 },
          ],
        },
      },
      {
        label: '砸碎池面',
        desc: '损失 7 点生命，获得 2 张「灼热挥砍」。',
        result: {
          text: '水溅起来的时候，每一滴里都有一个你，全部朝同一个方向扑过来。',
          effects: [
            { op: 'loseHp', n: 7 },
            { op: 'addHand', card: 'c_ember_slash', n: 2 },
          ],
        },
      },
      {
        label: '让倒影替你愈合',
        desc: '回复 25 点生命，并永久加入一张诅咒牌「镜中胎记」。',
        req: { hpBelow: 0.5 },
        result: {
          text: '伤口合上的时候，镜面上多出一个印记，位置和形状都是你的。它留在了牌上。',
          effects: [
            { op: 'heal', n: 25 },
            { op: 'addDeck', card: 'c_curse_mirror_mark' },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_bone_merchant',
    name: '骨商',
    glyph: '🦴',
    act: 1,
    text: '他的铺子没有屋顶，骨头按大小码得整整齐齐，像菜摊。柜台后面坐着一个没有下半身的影子，正在给一堆肋骨抛光。他说他不做买卖，只做抵押。',
    options: [
      {
        label: '把铜钥匙押给他',
        desc: '获得一张卡牌（三选一），并回复 15 点生命。',
        req: { relic: 'relic_copper_key' },
        result: {
          text: '他掂了掂钥匙，笑出声——第一次有活物在他柜台上笑。他多给了你一卷绷带和一次选择。',
          effects: [{ op: 'heal', n: 15 }],
          loot: { cards: 1 },
        },
      },
      {
        label: '用骨头付账',
        desc: '损失 10 点生命，获得 80 金币与 2 张打击牌。',
        result: {
          text: '他从自己身上拆了两根，按斤算价，然后递给你两张写着旧事的牌。',
          effects: [
            { op: 'loseHp', n: 10 },
            { op: 'gold', n: 80 },
            { op: 'addHand', card: 'c_strike', n: 2 },
          ],
        },
      },
      {
        label: '把自己的肋骨卖给他',
        desc: '永久失去 10 点最大生命，并从三件遗物中挑选一件。',
        result: {
          text: '刀口比想象中干净。收据他没给你，他说有些东西不该留凭证。',
          effects: [{ op: 'maxHp', n: -10 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '走出去',
        result: { text: '抛光声跟了你一路，一直没停。' },
      },
    ],
  },

  {
    id: 'ev_last_caravan',
    name: '最后一支商队',
    glyph: '🐫',
    act: 1,
    text: '十二头驮兽停在路边，一动不动，像是睡着了，也像是死了。领队掀开帘子，里面全是咳嗽声。他说往南三十里就安全了，但骆驼只肯再走一趟。他看着你的牌袋。',
    options: [
      {
        label: '加入他们',
        desc: '移除牌组中的一张牌，升级牌组中的 2 张牌，损失 6 点生命。',
        result: {
          text: '你背起了最重的那个。夜里有人往你包里塞了两样东西，没叫醒你，也没道谢。',
          effects: [
            { op: 'removeCard' },
            { op: 'upgradeCard', n: 2 },
            { op: 'loseHp', n: 6 },
          ],
        },
      },
      {
        label: '抢走他们的水袋',
        desc: '获得 40~60 金币，并永久失去 4 点最大生命。',
        result: {
          text: '水袋很沉。沉到走出那条烟，你才发现自己一路没敢喝。',
          effects: [{ op: 'maxHp', n: -4 }],
          loot: { gold: [40, 60] },
        },
      },
      {
        label: '装作没看见',
        result: { text: '车队走的时候没有回头。三十里外确实安全——安全得很空。' },
      },
    ],
  },

  // ==================== act:2 深处 ====================

  {
    id: 'ev_piston_shrine',
    name: '活塞神龛',
    glyph: '⚙',
    act: 2,
    text: '一台报废的蒸汽机跪在管道尽头，活塞还在动，一上一下，永远差着半寸。凹槽里积着黑亮的油，油面映出你跪下来的膝盖。神龛要的从来不是钱，它要一件没用的东西。',
    options: [
      {
        label: '献上一点血',
        desc: '损失 14 点生命，并从三件遗物中挑选一件。',
        result: {
          text: '活塞落到底，压出一声满足的响。机器里滚出一件东西，还带着体温。',
          effects: [{ op: 'loseHp', n: 14 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '献上一张废牌',
        desc: '移除牌组中的一张牌，升级牌组中的 2 张牌。',
        result: {
          text: '废牌沉进油里，被顶成两片薄的，正好垫在两个齿轮之间。机器顺了，牌也顺了。',
          effects: [
            { op: 'removeCard' },
            { op: 'upgradeCard', n: 2 },
          ],
        },
      },
      {
        label: '拆走活塞',
        desc: '获得 90 金币，并永久失去 5 点最大生命。',
        result: {
          text: '活塞离开的那一瞬，你胸腔里空出的那块刚好对上。神龛没有阻止你，它只是记录了。',
          effects: [
            { op: 'maxHp', n: -5 },
            { op: 'gold', n: 90 },
          ],
        },
      },
      {
        label: '把整副牌都推下去',
        desc: '移除牌组中的一张牌，并获得 1~2 瓶随机药水。',
        req: { curseOnly: true },
        result: {
          text: '牌一副副沉进黑油，油面再没合拢。机器吐出两瓶浑浊的东西，像是回礼，也像是谢罪。',
          effects: [{ op: 'removeCard' }],
          loot: { potions: [1, 2] },
        },
      },
    ],
  },

  {
    id: 'ev_glassworks',
    name: '玻璃工坊',
    glyph: '🔬',
    act: 2,
    text: '窑里烧着一块永远不化的玻璃，工人正往里加最后一把柴。他说你脸色不好，窑火能治，也能烧得更狠。他没说哪种，他让你自己选边站。',
    options: [
      {
        label: '在窑前拉一炉玻璃',
        desc: '升级牌组中的 3 张牌，损失 8 点生命。',
        result: {
          text: '三张牌在退火里慢慢变薄，边缘锋利得像刚出炉。退火没做完，你的手就一直抖。',
          effects: [
            { op: 'upgradeCard', n: 3 },
            { op: 'loseHp', n: 8 },
          ],
        },
      },
      {
        label: '拿碎片换酒',
        desc: '损失 10 点生命，获得 1 张「灼热挥砍」与 1 张火焰牌。',
        result: {
          text: '他用一块边角料给你换了一整晚的酒。酒是烫的，牌也是。',
          effects: [
            { op: 'loseHp', n: 10 },
            { op: 'addHand', card: 'c_ember_slash', n: 1 },
            { op: 'addHand', card: 'c_burn_wave', n: 1 },
          ],
        },
      },
      {
        label: '看窑火里的自己',
        desc: '回复 22 点生命，并永久加入一张诅咒牌「窑热症」。',
        req: { hpBelow: 0.5 },
        result: {
          text: '窑火把你烤回了原来的样子，连旧伤的位置都对上了。那点热气留在了牌里，没走。',
          effects: [
            { op: 'heal', n: 22 },
            { op: 'addDeck', card: 'c_curse_kiln_fever' },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_hangman_road',
    name: '绞索路',
    glyph: '🪢',
    act: 2,
    text: '两排绞架沿着山脊排开，绳子多到像晾衣绳，上面挂着的东西已经分不出原来的形状。风一吹，绳结就一起点头，点的频率很整齐。地上散着几把还够得着的刀。',
    options: [
      {
        label: '割断最下面那根',
        desc: '移除牌组中的 2 张牌。',
        req: { deckSizeBelow: 14 },
        result: {
          text: '两样东西落地，没有声音。你的牌袋轻了，风从空出来的地方穿了过去。',
          effects: [
            { op: 'removeCard' },
            { op: 'removeCard' },
          ],
        },
      },
      {
        label: '把自己也挂上去',
        desc: '损失 18 点生命，并从三件遗物中挑选一件。',
        result: {
          text: '绳子比想象中结实。下来的时候，衣襟里多了一样别人留下的东西。',
          effects: [{ op: 'loseHp', n: 18 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '数一数还剩几根',
        desc: '获得 15~30 金币。',
        result: {
          text: '数到一半你就停了，把数出来的数目换成了钱。绳结还在替你点完剩下的。',
          loot: { gold: [15, 30] },
        },
      },
    ],
  },

  {
    id: 'ev_third_hand',
    name: '熔炉的第三只手',
    glyph: '🖐',
    act: 2,
    text: '熔炉的余温还没散，柜台上压着一只陌生的手——断了腕，切口很平，像被机器咬下来的。手指还保持着抓握的姿势，掌心里压着东西。同行的人盯着它，没伸手。',
    options: [
      {
        label: '把手伸进炉膛',
        desc: '获得 100 金币，失去 9 点生命。',
        result: {
          text: '你把掌心那点东西倒出来，是钱。手指一根根松开时，你听见自己少了一块。',
          effects: [
            { op: 'gold', n: 100 },
            { op: 'loseHp', n: 9 },
          ],
        },
      },
      {
        label: '让同行者先伸手',
        desc: '永久失去 8 点最大生命，并从三件遗物中挑选一件。',
        result: {
          text: '他没有伸手，是你替他伸手的。之后谁也没再提那只断腕。',
          effects: [{ op: 'maxHp', n: -8 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '这不该由你决定',
        desc: '移除牌组中的一张牌，回复 14 点生命。',
        result: {
          text: '你们合力把炉门关上。回家路上你顺手丢了一张牌，心里莫名松了一点。',
          effects: [
            { op: 'removeCard' },
            { op: 'heal', n: 14 },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_broker',
    name: '掮客',
    glyph: '🗝',
    act: 2,
    text: '他在管道拐角摆了一张折叠桌，桌上摊着三张空白地图，每张都在慢慢自己改画。他说他不卖路，他卖「知道」。他还说，有些知道听完就不能留在脑子里。',
    options: [
      {
        label: '让他把这一段路说清楚',
        desc: '回复 16 点生命，并移除牌组中的一张牌。',
        result: {
          text: '他说完了。你发现自己从没听清，反而更确定前路能走。他满意地收走了你脑子里的一个角落。',
          effects: [
            { op: 'heal', n: 16 },
            { op: 'removeCard' },
          ],
        },
      },
      {
        label: '付钱买下消息',
        desc: '移除牌组中的一张牌，并从三件遗物中挑选一件。',
        req: { gold: 60 },
        result: {
          text: '钱推过去，地图收回来，第三张空白的也收进了你口袋。他说你会用到，而且用得上不止一次。',
          effects: [{ op: 'removeCard' }],
          loot: { relics: 1 },
        },
      },
      {
        label: '拧断他的脖子',
        desc: '损失 6 点生命，获得 85 金币。',
        result: {
          text: '他甚至没喊。三张地图自己叠好，落进你手里，像早就签好了收据。',
          effects: [
            { op: 'loseHp', n: 6 },
            { op: 'gold', n: 85 },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_ash_priest',
    name: '灰烬祭司',
    glyph: '🕯',
    act: 2,
    text: '他站在一个还没熄的灰堆前，手里托着一枚火种，火种在你脸上的投影里会动。他说边区只剩两种人：烧得尽的，和烧不完的。他要看看你是哪一种。',
    options: [
      {
        label: '把火种交给他',
        desc: '若牌组中有 3 张以上火焰牌，获得 120 金币；否则获得 40 金币。',
        result: {
          text: '他翻了两下你的牌袋，报了个数。火种在他指间亮了一下，又暗下去。',
          effects: [
            {
              op: 'if',
              cond: { type: 'deckCount', card: '火焰', gte: 3 },
              then: [{ op: 'gold', n: 120 }],
              else: [{ op: 'gold', n: 40 }],
            },
          ],
        },
      },
      {
        label: '抢走他的火种',
        desc: '损失 10 点生命，并获得一张卡牌（三选一）。',
        result: {
          text: '火种在你手里跳了一下就不烫了。他甚至没拦，只是把灰堆重新拢好。',
          effects: [{ op: 'loseHp', n: 10 }],
          loot: { cards: 1 },
        },
      },
      {
        label: '请他为下一场祝福',
        desc: '获得 2 层「仪式」。',
        result: {
          text: '他把灰按在你胸口，说这是种子，别急着挖出来。之后每场开始前，你都能感觉到它在数拍子。',
          effects: [{ op: 'buff', s: 'ritual', v: 2, t: 'self' }],
        },
      },
    ],
  },

  {
    id: 'ev_iron_lung',
    name: '铁肺医馆',
    glyph: '🫁',
    act: 2,
    text: '医馆挂着一排铁肺，空的位子比满的多。坐诊医生自己也戴着半边外壳，说话有回声。他说进来的人大部分不是想活，是想换个能撑久一点的容器。',
    options: [
      {
        label: '换上铁肺',
        desc: '永久失去 6 点最大生命，回复 40 点生命。',
        result: {
          text: '外壳扣上的时候咔了一声，很妥帖。它替你呼吸，也替你决定什么时候该停。',
          effects: [
            { op: 'maxHp', n: -6 },
            { op: 'heal', n: 40 },
          ],
        },
      },
      {
        label: '把旧肺还回去',
        desc: '移除牌组中的一张牌，并获得一张卡牌（三选一）。',
        result: {
          text: '他收下旧肺，递给你一张别的。他说新的总比旧的值钱，哪怕它不是你的。',
          effects: [{ op: 'removeCard' }],
          loot: { cards: 1 },
        },
      },
      {
        label: '偷走库存里的旧零件',
        desc: '损失 5 点生命，获得 70 金币。',
        result: {
          text: '零件在麻袋里叮当作响。走到街角你才发现，少的那点气是给自己留的。',
          effects: [
            { op: 'loseHp', n: 5 },
            { op: 'gold', n: 70 },
          ],
        },
      },
      {
        label: '让他们先给你看诊',
        desc: '失去 60 金币，回复 32 点生命。',
        req: { gold: 60 },
        result: {
          text: '账单比病历厚。医生说治好一个人不容易，让一个人破产很容易。',
          effects: [
            { op: 'gold', n: -60 },
            { op: 'heal', n: 32 },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_cinder_market',
    name: '灰烬集市',
    glyph: '🏪',
    act: 2,
    text: '摊位是用锅炉壳改的，招牌上还留着出厂编号。卖家不说价格，只说「这个能换什么」。收摊的时候他们会把最没用的那堆免费倒掉——只要你肯自己挑。',
    options: [
      {
        label: '清空废料堆',
        desc: '移除牌组中的 3 张牌。',
        req: { deckSizeAbove: 20 },
        result: {
          text: '你挑到后面就不用挑了，因为剩下的都该走。摊主看了一眼你的牌袋，第一次没有报价。',
          effects: [
            { op: 'removeCard' },
            { op: 'removeCard' },
            { op: 'removeCard' },
          ],
        },
      },
      {
        label: '掏空钱袋',
        desc: '损失 10 点生命，获得 120 金币与 2 张重击牌。',
        result: {
          text: '他把钱倒进麻袋，又顺手塞了两件货。他说你今天的脸比平时值钱。',
          effects: [
            { op: 'loseHp', n: 10 },
            { op: 'gold', n: 120 },
            { op: 'addHand', card: 'c_bash', n: 2 },
          ],
        },
      },
      {
        label: '守到收摊',
        desc: '回复 18 点生命，获得 1 张防御牌，并获得 1~2 瓶随机药水。',
        result: {
          text: '收摊前的半小时是白捡的。你把别人不要的护具穿上了，意外的合身。',
          effects: [
            { op: 'heal', n: 18 },
            { op: 'addHand', card: 'c_guard', n: 1 },
          ],
          loot: { potions: [1, 2] },
        },
      },
    ],
  },

  // ==================== act:3 终局 ====================

  {
    id: 'ev_final_ledger',
    name: '最后的账本',
    glyph: '📜',
    act: 3,
    text: '账本摊在最后一间还亮着灯的屋子里，每一页都是名字，最后几页还是空的。记账人说：写上名字的路才走得通。他把笔推过来，笔尖朝着你，没朝着他。',
    options: [
      {
        label: '把你的名字写上去',
        desc: '升级牌组中的 2 张牌，损失 20 点生命。',
        result: {
          text: '墨一落笔就没干，像是账本在收。写完你咳了很久，咳出来的东西是热的。',
          effects: [
            { op: 'upgradeCard', n: 2 },
            { op: 'loseHp', n: 20 },
          ],
        },
      },
      {
        label: '写别人的名字',
        desc: '永久失去 10 点最大生命，并从三件遗物中挑选一件。',
        result: {
          text: '他替你还了墨钱，还多给了一样东西。他说这笔账记在你身上，不是那个人身上。',
          effects: [{ op: 'maxHp', n: -10 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '合上账本',
        result: { text: '最后一页空着。你合上它的时候，屋里所有的灯都矮了一寸。' },
      },
    ],
  },

  {
    id: 'ev_the_last_forge',
    name: '最后一座锻炉',
    glyph: '🔥',
    act: 3,
    text: '炉膛大得能站人，火是白的，照不出影子。旁边的淬火槽里沉着一批别人留下的牌，被烧得只剩编号。守炉的人已经不在了，火还替他烧着。',
    options: [
      {
        label: '把整副牌浸进淬火槽',
        desc: '把牌组中 30% 的攻击牌转为「灼热挥砍」。',
        result: {
          text: '出水的时候它们已经不是原来的东西了，刃口还冒着白气。原来的招式，被水声盖掉了。',
          effects: [{ op: 'custom', fn: 'convertDeckToBurn', p: 0.3 }],
        },
      },
      {
        label: '只淬最上面一张',
        desc: '升级牌组中的 2 张牌，获得 60 金币。',
        result: {
          text: '底下那批你没能动。炉子把这一张的价码付给了你，剩下的算是留给后来人的。',
          effects: [
            { op: 'upgradeCard', n: 2 },
            { op: 'gold', n: 60 },
          ],
        },
      },
      {
        label: '把炉子砸了',
        desc: '移除牌组中的 2 张牌，失去 12 点生命。',
        result: {
          text: '火从炉底漏出来，烧得很安静。白火灭了以后，路上第一次真正黑了。',
          effects: [
            { op: 'removeCard' },
            { op: 'removeCard' },
            { op: 'loseHp', n: 12 },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_crown_of_ash',
    name: '灰烬王冠',
    glyph: '👑',
    act: 3,
    text: '王座上放着一顶用炉渣压出来的冠，戴上去很轻，像什么都没戴。戴过它的人名字都被从账本上刮掉了，刮得很干净。王座底座刻着一行字：轻，是因为里面空了。',
    options: [
      {
        label: '戴上它',
        desc: '永久失去 12 点最大生命，并从三件遗物中挑选一件。',
        result: {
          text: '戴上的一瞬所有声音都退远了，只剩下你自己的。它从里面掏走的那块，从没打算还。',
          effects: [{ op: 'maxHp', n: -12 }],
          loot: { relics: 1 },
        },
      },
      {
        label: '把它熔了',
        desc: '损失 15 点生命，获得 150 金币。',
        result: {
          text: '炉渣化开的时候很响。所有轻的东西，都得靠重的来换。',
          effects: [
            { op: 'loseHp', n: 15 },
            { op: 'gold', n: 150 },
          ],
        },
      },
      {
        label: '推倒王座',
        desc: '移除牌组中的一张牌，并获得一张卡牌（三选一）。',
        result: {
          text: '王座底下压着一卷没人要的东西。你只拿走了里面最像机会的那一份。',
          effects: [{ op: 'removeCard' }],
          loot: { cards: 1 },
        },
      },
    ],
  },

  {
    id: 'ev_last_lamp',
    name: '末灯',
    glyph: '💡',
    act: 3,
    text: '整条街只剩这一盏灯，灯油的味道浓得像血。灯下坐着两个人，都说自己先到的。其中一个已经很久没睡了，眼白布满血丝，正在数灯芯的圈数。',
    options: [
      {
        label: '用最后一盏灯照路',
        desc: '回复 30 点生命，并移除牌组中的一张牌。',
        result: {
          text: '光走多远，伤口就合到多远。走完这一段，你发现自己少带了一样行李——而且不记得是什么时候丢的。',
          effects: [
            { op: 'heal', n: 30 },
            { op: 'removeCard' },
          ],
        },
      },
      {
        label: '把它留给下一个人',
        desc: '从三件遗物中挑选一件。',
        result: {
          text: '你起身的时候，灯芯忽然矮了一截，像是松了口气。走出很远你也没回头。',
          loot: { relics: 1 },
        },
      },
      {
        label: '砸碎它换钱',
        desc: '获得 70 金币，并获得 1~2 瓶随机药水。',
        result: {
          text: '玻璃碎片里还含着一点没烧完的光。那两个人一起低下头，谁也没说话。',
          effects: [{ op: 'gold', n: 70 }],
          loot: { potions: [1, 2] },
        },
      },
    ],
  },

  {
    id: 'ev_deep_choir',
    name: '深渊唱诗班',
    glyph: '🎶',
    act: 3,
    text: '地下的合唱没有喉咙，只有管道在响，音一高一低，永不重复。中间站着一个穿铜盔的指挥，正等着有人跟唱。他抬手时，你发现自己手里的牌正在发热。',
    options: [
      {
        label: '跟着唱完这一段',
        desc: '获得一张「灼热挥砍」，永久加入一张诅咒牌「合唱回声」，并永久失去 5 点最大生命。',
        result: {
          text: '唱到最后一个音时，铜盔转向你。回声留在了牌里，每抽一张都在唱。',
          effects: [
            { op: 'addDeck', card: 'c_ember_slash' },
            { op: 'addDeck', card: 'c_curse_choir_echo' },
            { op: 'maxHp', n: -5 },
          ],
        },
      },
      {
        label: '捂住耳朵跑',
        desc: '损失 11 点生命，并获得 60~90 金币。',
        result: {
          text: '唱声一直追到管道口才停。你怀里不知什么时候多了一把不属于你的硬币。',
          effects: [{ op: 'loseHp', n: 11 }],
          loot: { gold: [60, 90] },
        },
      },
      {
        label: '割断指挥的喉咙',
        desc: '移除牌组中的 2 张牌，损失 8 点生命。',
        result: {
          text: '没有唱声的那一秒很安静。安静里，你听见自己牌袋里少了两张东西落地。',
          effects: [
            { op: 'removeCard' },
            { op: 'removeCard' },
            { op: 'loseHp', n: 8 },
          ],
        },
      },
    ],
  },

  {
    id: 'ev_god_of_cogs',
    name: '齿神',
    glyph: '⚙',
    act: 3,
    text: '巨大的齿轮从穹顶垂下来，咬合得极慢，每转一格，整座圣所就跟着响一次。神像只有一个齿，其余都空着，空着的地方摆着祷告者的旧物。它不催你，它有的是时间。',
    options: [
      {
        label: '向齿神献上第一次祈祷',
        desc: '移除牌组中的一张牌，并从三件遗物中挑选一件。',
        req: { noRelic: 'relic_ash_charm' },
        result: {
          text: '空着的齿槽接住了你的东西。齿轮咬合的那一声，像有人第一次点头。',
          effects: [{ op: 'removeCard' }],
          loot: { relics: 1 },
        },
      },
      {
        label: '把自己的手当齿用',
        desc: '永久失去 6 点最大生命，获得 110 金币。',
        result: {
          text: '换下来的指骨很沉，也很好使。神像转过一格，从此每一格都有你的份。',
          effects: [
            { op: 'maxHp', n: -6 },
            { op: 'gold', n: 110 },
          ],
        },
      },
      {
        label: '转身就走',
        result: { text: '身后咬合声没停，只是慢了一拍，像是记住了你的脚步。' },
      },
    ],
  },

  {
    id: 'ev_the_last_rest',
    name: '最后的驿站',
    glyph: '🛏',
    act: 3,
    text: '驿站的床只剩一张，干净的，床单是新的——这反而最吓人。掌柜坐在柜台后敲算盘，说这里赌最后一次，赢了就往南走，输了也往南走。他把你的钱袋看了很久。',
    options: [
      {
        label: '把身上的钱全押上',
        desc: '若掷中，获得 200 金币；否则失去 15 点生命。',
        req: { gold: 80 },
        result: {
          text: '算盘声停了。他盯着你看了一路，既像恭喜，也像提前收尸。',
          effects: [
            {
              op: 'if',
              cond: { type: 'chance', p: 0.5 },
              then: [{ op: 'gold', n: 200 }],
              else: [{ op: 'loseHp', n: 15 }],
            },
          ],
        },
      },
      {
        label: '拿够就收手',
        desc: '获得 70~110 金币。',
        result: {
          text: '他数完就把算盘扣上了，好像这个数目本来就该是你的。',
          loot: { gold: [70, 110] },
        },
      },
      {
        label: '把最后一张床让给别人',
        desc: '回复 35 点生命，并永久加入一张诅咒牌「失眠」。',
        result: {
          text: '你在灶边坐到天亮。伤是好了，天亮之后还是不肯睡——从今往后都不会了。',
          effects: [
            { op: 'heal', n: 35 },
            { op: 'addDeck', card: 'c_curse_insomnia' },
          ],
        },
      },
    ],
  },

];
