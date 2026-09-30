// 港城六区域专属事件：每区 3 个，每个 3 条互斥选择。
// 战斗外收益只使用可持久化的生命、金币和牌组操作。

export const HARBOR_EVENTS = [
  {
    id: 'ev_h_rust_toll', name: '锈闸收费亭', glyph: '闸', act: 1, regionId: 'r_rust_quay',
    text: '收费亭的抽屉浮在水面上，闸吏用一枚弯钉替每个过路人盖章。他愿意把印章借给你，也愿意收下你肩上最后一段干净的布。',
    options: [
      { label: '买一枚检修印', desc: '支付 25 金币，随机升级至多 1 张可升级牌。', req: { gold: 25 },
        result: { text: '弯钉在牌角敲出新的槽口，闸吏收下了工钱。', effects: [{ op: 'gold', n: -25 }, { op: 'upgradeCard', n: 1 }] } },
      { label: '替他拧开锈闸', desc: '损失 4 点生命，获得 36 金币。',
        result: { text: '锈边割开手掌，闸门终于动了。他把抽屉里的一小把硬币倒给你。', effects: [{ op: 'loseHp', n: 4 }, { op: 'gold', n: 36 }] } },
      { label: '捡走浮出的零钱', desc: '获得 10 金币。',
        result: { text: '水把几枚漏记的零钱推到你脚边，闸吏没有低头。', effects: [{ op: 'gold', n: 10 }] } },
    ],
  },
  {
    id: 'ev_h_drowned_toolbox', name: '浸潮工具箱', glyph: '箱', act: 1, regionId: 'r_rust_quay',
    text: '木箱拴在岸桩上，潮水每退一寸，箱盖就露出一寸。箱里有压好的铁片、能把旧牌剪净的钳子，还有一卷尚未泡透的止血布。',
    options: [
      { label: '收下补片箱', desc: '支付 30 金币，将 1 张「补片箱」永久加入本次远征牌组。', req: { gold: 30 },
        result: { text: '你压紧箱盖，把里面仍干燥的备用铁片一并背走。', effects: [{ op: 'gold', n: -30 }, { op: 'addDeck', card: 'c_r_supply_crate' }] } },
      { label: '借钳子剪掉累赘', desc: '支付 12 金币，随机永久移除 1 张牌。', req: { gold: 12, deckSizeAbove: 5 },
        result: { text: '钳口咬住一张已经卷边的牌，剪下来的部分落进潮里。', effects: [{ op: 'gold', n: -12 }, { op: 'removeCard' }] } },
      { label: '只拿止血布', desc: '回复 8 点生命。',
        result: { text: '最里面的布还带着干燥的温度，足够把伤口扎牢。', effects: [{ op: 'heal', n: 8 }] } },
    ],
  },
  {
    id: 'ev_h_chain_ferry', name: '链索摆渡', glyph: '渡', act: 1, regionId: 'r_rust_quay',
    text: '没有船的摆渡人坐在链索上，身后是一段刚露出水面的栈桥。他说这条路有三种走法，走过之后，价钱便写进你的行囊。',
    options: [
      { label: '乘坐温箱过潮', desc: '支付 35 金币，回复 16 点生命。', req: { gold: 35 },
        result: { text: '他把温箱推上链索，过岸时连疼痛都慢了半拍。', effects: [{ op: 'gold', n: -35 }, { op: 'heal', n: 16 }] } },
      { label: '沿链索攀过去', desc: '损失 4 点生命，随机升级至多 1 张可升级牌。',
        result: { text: '铁链磨破手掌，也把一件旧装备磨出了趁手的新刃口。', effects: [{ op: 'loseHp', n: 4 }, { op: 'upgradeCard', n: 1 }] } },
      { label: '背一包旧船货', desc: '获得 12 金币，将 1 张「打击」永久加入本次远征牌组。',
        result: { text: '货包里有一把笨重的旧刀，报酬正好绑在刀鞘上。', effects: [{ op: 'gold', n: 12 }, { op: 'addDeck', card: 'c_strike' }] } },
    ],
  },

  {
    id: 'ev_h_keel_market', name: '船骨小市', glyph: '市', act: 1, regionId: 'r_ship_grave',
    text: '摊位挂在倒扣船底的肋板间。店主把船上最后的闸门密钥摆在最高处，低处只剩旧刀和一只供人扔牌的漏底篮子。',
    options: [
      { label: '买下闸门密钥', desc: '支付 40 金币，将 1 张「闸门密钥」永久加入本次远征牌组。', req: { gold: 40 },
        result: { text: '密钥沿着你的指缝展开，像一面尚未合拢的铁闸。', effects: [{ op: 'gold', n: -40 }, { op: 'addDeck', card: 'c_r_gate_key' }] } },
      { label: '托他处理旧牌', desc: '支付 20 金币，随机永久移除 1 张牌。', req: { gold: 20, deckSizeAbove: 5 },
        result: { text: '旧牌落进篮底，下面的海水把它带走了。', effects: [{ op: 'gold', n: -20 }, { op: 'removeCard' }] } },
      { label: '替他背走烫手货', desc: '获得 26 金币，将 1 张「灰烬飞镖」永久加入本次远征牌组。',
        result: { text: '他把一袋仍温着的飞镖和工钱绑在一起递给你。', effects: [{ op: 'gold', n: 26 }, { op: 'addDeck', card: 'c_f_cinder_dart' }] } },
    ],
  },
  {
    id: 'ev_h_bilge_winch', name: '舱底绞盘', glyph: '盘', act: 1, regionId: 'r_ship_grave',
    text: '绞盘已经浸在舱底，却还在往上拉东西。齿轮旁钉着维修价目；重物下面压着钱袋，轴心里藏着一枚从未松动的锚栓。',
    options: [
      { label: '请船匠修整装备', desc: '支付 32 金币，随机升级至多 2 张可升级牌。', req: { gold: 32 },
        result: { text: '船匠让齿轮只转了两格，两件装备便重新咬合。', effects: [{ op: 'gold', n: -32 }, { op: 'upgradeCard', n: 2 }] } },
      { label: '用肩膀抬起重物', desc: '本次远征最大生命和当前生命各减少 3，获得 60 金币。',
        result: { text: '钱袋到了手里，肩膀却留下再也伸不直的旧伤。', effects: [{ op: 'maxHp', n: -3 }, { op: 'gold', n: 60 }] } },
      { label: '徒手拔出锚栓', desc: '损失 5 点生命，将 1 张「锚栓」永久加入本次远征牌组。',
        result: { text: '栓头割破了手，整根锚栓终于从轴心里脱出。', effects: [{ op: 'loseHp', n: 5 }, { op: 'addDeck', card: 'c_r_anchor_bolt' }] } },
    ],
  },
  {
    id: 'ev_h_wreck_memory', name: '船名残页', glyph: '页', act: 1, regionId: 'r_ship_grave',
    text: '一本航海簿夹在沉船窗缝里，名字大都被海水洗掉。守簿人能划去一页旧事，也能让你看见过去的自己；桌边还剩一点热汤。',
    options: [
      { label: '请他划去一页', desc: '支付 25 金币，随机永久移除 1 张牌。', req: { gold: 25, deckSizeAbove: 5 },
        result: { text: '他收下钱，把其中一页连同你背包里的旧物一并抹去。', effects: [{ op: 'gold', n: -25 }, { op: 'removeCard' }] } },
      { label: '从倒影中取出静镜', desc: '损失 3 点生命，将 1 张「静镜」永久加入本次远征牌组。',
        result: { text: '窗缝割开袖口，镜面却干净得能照见尚未发生的事。', effects: [{ op: 'loseHp', n: 3 }, { op: 'addDeck', card: 'c_l_quiet_lens' }] } },
      { label: '帮他搬走汤锅', desc: '回复 6 点生命，获得 6 金币。',
        result: { text: '你分到最后一碗热汤，还有锅底压着的几枚零钱。', effects: [{ op: 'heal', n: 6 }, { op: 'gold', n: 6 }] } },
    ],
  },

  {
    id: 'ev_h_missing_bell', name: '失舌钟', glyph: '钟', act: 2, regionId: 'r_bell_corridor',
    text: '钟腹里没有钟舌，只有一束被困住的光。看钟人伸出两根手指，示意可以花钱取光，也可以亲手把裂缝撑开。',
    options: [
      { label: '买下钟腹的光', desc: '支付 40 金币，将 1 张「分光棱刺」永久加入本次远征牌组。', req: { gold: 40 },
        result: { text: '光被分成几根细棱，压进了你的牌袋。', effects: [{ op: 'gold', n: -40 }, { op: 'addDeck', card: 'c_l_split_ray' }] } },
      { label: '徒手撑开钟缝', desc: '损失 6 点生命，随机升级至多 2 张可升级牌。',
        result: { text: '钟缝划开双手，溢出的光把两张旧牌照得焕然一新。', effects: [{ op: 'loseHp', n: 6 }, { op: 'upgradeCard', n: 2 }] } },
      { label: '捡走脱落的铜片', desc: '获得 16 金币。',
        result: { text: '几块铜片仍带着回声，足够付一顿饭钱。', effects: [{ op: 'gold', n: 16 }] } },
    ],
  },
  {
    id: 'ev_h_echo_tax', name: '回声税', glyph: '税', act: 2, regionId: 'r_bell_corridor',
    text: '税吏在雾里数你的脚步，每多一次回声就添一笔。账桌上放着可作抵押的旧兵器、一叠夜渡凭证，以及一张清账收据。',
    options: [
      { label: '付钱注销一笔旧账', desc: '支付 36 金币，随机永久移除 1 张牌。', req: { gold: 36, deckSizeAbove: 5 },
        result: { text: '注销印盖下去，行囊里的一件累赘也失去了名字。', effects: [{ op: 'gold', n: -36 }, { op: 'removeCard' }] } },
      { label: '留血换夜渡凭证', desc: '损失 6 点生命，将 1 张「夜渡凭证」永久加入本次远征牌组。',
        result: { text: '凭证沾上你的血，钟声便不再追问它属于谁。', effects: [{ op: 'loseHp', n: 6 }, { op: 'addDeck', card: 'c_l_night_pass' }] } },
      { label: '代领两件过期抵押物', desc: '获得 50 金币，将 2 张「打击」永久加入本次远征牌组。',
        result: { text: '税吏给了佣金，两件粗重的旧兵器也归你负责。', effects: [{ op: 'gold', n: 50 }, { op: 'addDeck', card: 'c_strike' }, { op: 'addDeck', card: 'c_strike' }] } },
    ],
  },
  {
    id: 'ev_h_bell_oil', name: '旧钟油', glyph: '油', act: 2, regionId: 'r_bell_corridor',
    text: '钟油匠坐在巨钟底下，油壶里只剩三个底。他会给伤口抹油，也会把闭合的灯光封进牌里，最后一种油则专用来修整旧器。',
    options: [
      { label: '买一份暖油', desc: '支付 32 金币，回复 22 点生命。', req: { gold: 32 },
        result: { text: '暖油沿着伤口渗进去，钟轴也安静了一会儿。', effects: [{ op: 'gold', n: -32 }, { op: 'heal', n: 22 }] } },
      { label: '让他封住一束灯光', desc: '损失 5 点生命，将 1 张「闭光闪」永久加入本次远征牌组。',
        result: { text: '封灯的针扎进指腹，抽出的光却牢牢留在了牌上。', effects: [{ op: 'loseHp', n: 5 }, { op: 'addDeck', card: 'c_l_shutter_flash' }] } },
      { label: '帮忙打磨钟轴', desc: '获得 14 金币，随机升级至多 1 张可升级牌。',
        result: { text: '钟油匠付了工钱，顺手给你最旧的器具抛了光。', effects: [{ op: 'gold', n: 14 }, { op: 'upgradeCard', n: 1 }] } },
    ],
  },

  {
    id: 'ev_h_mirror_census', name: '盐镜户册', glyph: '册', act: 2, regionId: 'r_salt_mirror',
    text: '户册同时记着真人与倒影，每行姓名后都留着一道盐线。册吏可以把你写得更强，也可以划去行囊里的一件旧物；空白页角压着零钱。',
    options: [
      { label: '让倒影替你重写姓名', desc: '本次远征最大生命和当前生命各减少 3，随机升级至多 2 张可升级牌。',
        result: { text: '倒影少写了一段呼吸，多写了两件能用更久的兵器。', effects: [{ op: 'maxHp', n: -3 }, { op: 'upgradeCard', n: 2 }] } },
      { label: '购买一行注销许可', desc: '支付 45 金币，随机永久移除 1 张牌。', req: { gold: 45, deckSizeAbove: 5 },
        result: { text: '盐线合拢，一张旧牌从这一页往后的旅程中消失。', effects: [{ op: 'gold', n: -45 }, { op: 'removeCard' }] } },
      { label: '收起未登记的零钱', desc: '获得 18 金币。',
        result: { text: '零钱没有倒影，册吏只好把它们全给你。', effects: [{ op: 'gold', n: 18 }] } },
    ],
  },
  {
    id: 'ev_h_glass_ford', name: '碎镜浅滩', glyph: '滩', act: 2, regionId: 'r_salt_mirror',
    text: '浅滩上铺满镜片，摆镜人按大小给它们定价。最整齐的一块能封住攻击，碎片中央有一盏远标灯，岸边是干净的雨水。',
    options: [
      { label: '买走整块护镜', desc: '支付 45 金币，将 1 张「镜面封锁」永久加入本次远征牌组。', req: { gold: 45 },
        result: { text: '护镜合到牌背上，水里的刀影再也透不过来。', effects: [{ op: 'gold', n: -45 }, { op: 'addDeck', card: 'c_l_mirror_lock' }] } },
      { label: '踩着碎镜取灯', desc: '损失 5 点生命，将 1 张「远标灯」永久加入本次远征牌组。',
        result: { text: '鞋底留下几道血印，灯终于照到了另一条水道。', effects: [{ op: 'loseHp', n: 5 }, { op: 'addDeck', card: 'c_l_distant_beacon' }] } },
      { label: '用岸边雨水洗伤', desc: '回复 10 点生命。',
        result: { text: '雨水洗掉盐粒，伤口终于不再刺痛。', effects: [{ op: 'heal', n: 10 }] } },
    ],
  },
  {
    id: 'ev_h_salt_surgeon', name: '盐线缝医', glyph: '缝', act: 2, regionId: 'r_salt_mirror',
    text: '缝医用盐线缝身体，也缝那些被水泡开的牌角。他的长针能拓宽胸腔，短针能止住流血；若你肯替他试针，他就免费修整两件装备。',
    options: [
      { label: '购买长针缝合', desc: '支付 48 金币，本次远征最大生命和当前生命各增加 4。', req: { gold: 48 },
        result: { text: '长针从旧疤中穿过，留下一段更稳的呼吸。', effects: [{ op: 'gold', n: -48 }, { op: 'maxHp', n: 4 }] } },
      { label: '替他试一遍盐针', desc: '损失 6 点生命，随机升级至多 2 张可升级牌。',
        result: { text: '盐针让你绷紧了手，他趁这时缝好了两张旧牌的边角。', effects: [{ op: 'loseHp', n: 6 }, { op: 'upgradeCard', n: 2 }] } },
      { label: '购买短针止血', desc: '支付 20 金币，回复 16 点生命。', req: { gold: 20 },
        result: { text: '短针走完一圈，伤口被盐线牢牢拢住。', effects: [{ op: 'gold', n: -20 }, { op: 'heal', n: 16 }] } },
    ],
  },

  {
    id: 'ev_h_oath_exchange', name: '血契兑换处', glyph: '兑', act: 3, regionId: 'r_blood_city',
    text: '兑换员用血滴称量契约。玻璃柜里摆着一份赤潮总誓，柜下是换取寿命的现钱，门边还坐着负责修整誓器的老匠。',
    options: [
      { label: '购买赤潮总誓', desc: '支付 55 金币，将 1 张「赤潮总誓」永久加入本次远征牌组。', req: { gold: 55 },
        result: { text: '契约离开玻璃柜，开始跟着你的脉搏翻页。', effects: [{ op: 'gold', n: -55 }, { op: 'addDeck', card: 'c_o_crimson_covenant' }] } },
      { label: '兑换一段寿命', desc: '本次远征最大生命和当前生命各减少 4，获得 95 金币。',
        result: { text: '兑换员剪去一小段盐线，把等重的硬币推到你面前。', effects: [{ op: 'maxHp', n: -4 }, { op: 'gold', n: 95 }] } },
      { label: '以血酬劳老匠', desc: '损失 7 点生命，随机升级至多 2 张可升级牌。',
        result: { text: '血滴落到两件誓器上，旧纹路重新开始跳动。', effects: [{ op: 'loseHp', n: 7 }, { op: 'upgradeCard', n: 2 }] } },
    ],
  },
  {
    id: 'ev_h_red_registry', name: '红册见证', glyph: '红', act: 3, regionId: 'r_blood_city',
    text: '见证人守着一本厚红册，所有被注销的债都夹在里面。他能替你抹去两条旧债，也能见证一份最后誓约；旁边的清水只给尚未签字的人。',
    options: [
      { label: '付钱注销两条旧债', desc: '支付 45 金币，随机永久移除 2 张牌。', req: { gold: 45, deckSizeAbove: 6 },
        result: { text: '见证人在红册上画了两道线，你的行囊也轻了两件。', effects: [{ op: 'gold', n: -45 }, { op: 'repeat', n: 2, then: [{ op: 'removeCard' }] }] } },
      { label: '签下最后誓约', desc: '损失 6 点生命，将 1 张「最后誓约」永久加入本次远征牌组。',
        result: { text: '最后一笔由血写成，见证人把契纸折进你的牌袋。', effects: [{ op: 'loseHp', n: 6 }, { op: 'addDeck', card: 'c_o_last_covenant' }] } },
      { label: '先喝水再走', desc: '回复 12 点生命。',
        result: { text: '水没有契约的味道，足够让脉搏重新稳下来。', effects: [{ op: 'heal', n: 12 }] } },
    ],
  },
  {
    id: 'ev_h_courier_rest', name: '送契者歇棚', glyph: '歇', act: 3, regionId: 'r_blood_city',
    text: '驿卒在歇棚里把送不出去的契约晒干。棚主有一张空床、一段活肉补缀，还有一封愿意连同跑腿费一起交给你的血誓凭记。',
    options: [
      { label: '租下空床', desc: '支付 38 金币，回复 24 点生命。', req: { gold: 38 },
        result: { text: '你在干燥的床上睡过片刻，伤口也跟着歇了一会儿。', effects: [{ op: 'gold', n: -38 }, { op: 'heal', n: 24 }] } },
      { label: '用旧伤换活肉', desc: '损失 4 点生命，将 1 张「活肉补缀」永久加入本次远征牌组。',
        result: { text: '棚主剥下一片旧疤，换上一段仍能回应脉搏的补缀。', effects: [{ op: 'loseHp', n: 4 }, { op: 'addDeck', card: 'c_o_flesh_patch' }] } },
      { label: '接过未投的凭记', desc: '获得 16 金币，将 1 张「血誓凭记」永久加入本次远征牌组。',
        result: { text: '跑腿费已经付过，凭记却一直没有等来收件人。', effects: [{ op: 'gold', n: 16 }, { op: 'addDeck', card: 'c_o_blood_token' }] } },
    ],
  },

  {
    id: 'ev_h_court_evidence', name: '灰庭物证室', glyph: '证', act: 3, regionId: 'r_ash_court',
    text: '物证员把灰里的兵器按案号排列。他可以为你重整三件装备，也可以让你拿一件旧物换走冲床；待搬走的旧刀旁边压着一袋工钱。',
    options: [
      { label: '购买三件检修服务', desc: '支付 55 金币，随机升级至多 3 张可升级牌。', req: { gold: 55 },
        result: { text: '物证员磨去三处旧案号，把焕新的装备归还给你。', effects: [{ op: 'gold', n: -55 }, { op: 'upgradeCard', n: 3 }] } },
      { label: '用旧物换冲床', desc: '损失 5 点生命，随机永久移除 1 张牌，再加入 1 张「堡垒冲床」。', req: { deckSizeAbove: 5 },
        result: { text: '灰架划伤手背，一件旧物被收进证袋，沉重的冲床终于交到你手里。', effects: [{ op: 'loseHp', n: 5 }, { op: 'removeCard' }, { op: 'addDeck', card: 'c_r_bastion_press' }] } },
      { label: '帮忙搬走旧刀', desc: '获得 65 金币，将 1 张「打击」永久加入本次远征牌组。',
        result: { text: '工钱归你，没能入证的那把旧刀也一并留给了你。', effects: [{ op: 'gold', n: 65 }, { op: 'addDeck', card: 'c_strike' }] } },
    ],
  },
  {
    id: 'ev_h_ash_verdict', name: '未决判词', glyph: '判', act: 3, regionId: 'r_ash_court',
    text: '判词上只写了一半姓名，另一半正从灰里慢慢长出来。书记员可以把它写成新生，也可以付费删去一项旧证据；沉默的人则能喝一碗庭后的暖水。',
    options: [
      { label: '请判词重铸血肉', desc: '本次远征最大生命和当前生命各减少 4，加入 1 张「重铸血肉」。',
        result: { text: '判词先取走一小段生命，再把未来重铸自己的方法交给你。', effects: [{ op: 'maxHp', n: -4 }, { op: 'addDeck', card: 'c_o_heart_forging' }] } },
      { label: '支付删证费用', desc: '支付 40 金币，随机永久移除 1 张牌。', req: { gold: 40, deckSizeAbove: 5 },
        result: { text: '书记员收下费用，一项旧证据连同旧牌都成了灰。', effects: [{ op: 'gold', n: -40 }, { op: 'removeCard' }] } },
      { label: '把姓名留空', desc: '回复 14 点生命。',
        result: { text: '书记员递来暖水，判词上的空白暂时停止生长。', effects: [{ op: 'heal', n: 14 }] } },
    ],
  },
  {
    id: 'ev_h_judge_lantern', name: '法官遗灯', glyph: '灯', act: 3, regionId: 'r_ash_court',
    text: '遗灯放在法官空椅旁，灯光照不到自己的影子。守灯人要一笔买灯钱；若你肯伸手触碰灯芯，他愿意修好两件旧器。椅子下还藏着一包口粮。',
    options: [
      { label: '买下黑灯密约', desc: '支付 55 金币，将 1 张「黑灯密约」永久加入本次远征牌组。', req: { gold: 55 },
        result: { text: '灯芯熄灭，约定却留在你的牌面上，等下一次重新点燃。', effects: [{ op: 'gold', n: -55 }, { op: 'addDeck', card: 'c_l_black_lantern' }] } },
      { label: '伸手触碰灯芯', desc: '损失 7 点生命，随机升级至多 2 张可升级牌。',
        result: { text: '灯芯咬住指尖，守灯人借这一点光重新淬亮两件装备。', effects: [{ op: 'loseHp', n: 7 }, { op: 'upgradeCard', n: 2 }] } },
      { label: '收下椅下口粮', desc: '回复 10 点生命，获得 10 金币。',
        result: { text: '口粮尚未落灰，袋口绑着法官没有花完的零钱。', effects: [{ op: 'heal', n: 10 }, { op: 'gold', n: 10 }] } },
    ],
  },
];
