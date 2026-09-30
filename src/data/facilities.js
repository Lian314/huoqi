// ============ 酒馆：设施 / 员工 / 局外升级 ============
// 经营层的全部可购买内容。纯数据。

export const FACILITIES = [
  {
    id: 'bar', name: '吧台', glyph: '🍺', max: 3, cost: [0, 90, 220], income: [10, 22, 38],
    desc: '每晚基础收入 +{income}。', start: true,
  },
  {
    id: 'forge', name: '铁砧', glyph: '🔨', max: 3, cost: [120, 200, 340], income: [0, 6, 14],
    desc: '每晚收入 +{income}；第 {lv} 级起，篝火/铁砧可升级卡牌。', effects: { forgeUpgrade: 1 },
  },
  {
    id: 'apothecary', name: '药剂台', glyph: '⚗️', max: 2, cost: [150, 300], income: [0, 8],
    desc: '每晚收入 +{income}；药水栏位 +{lv}。', effects: { potionSlots: 1 },
  },
  {
    id: 'rooms', name: '客房', glyph: '🛏️', max: 2, cost: [110, 240], income: [0, 5],
    desc: '每晚收入 +{income}；击败精英与进入下一幕时回复 25% 最大生命。', effects: { restHeal: true },
  },
  {
    id: 'intel', name: '情报网', glyph: '🕸️', max: 2, cost: [140, 280], income: [0, 7],
    desc: '每晚收入 +{income}；地图多揭示 {lv} 行，商店价格 -{pct}%。',
    effects: { mapReveal: 1, shopDiscount: 0.1 },
  },
  {
    id: 'docks', name: '码头', glyph: '⚓', max: 2, cost: [160, 320], income: [4, 12],
    desc: '每晚收入 +{income}；商店多 1 张卡牌，{lv} 级起战后有几率进"到货"折扣。',
    effects: { shopCards: 1, dealChance: 0.25 },
  },
  {
    id: 'crypt', name: '密室', glyph: '🕯️', max: 2, cost: [180, 360], income: [0, 10],
    desc: '每晚收入 +{income}；战斗奖励的遗物候选 +{lv}。', effects: { relicChoice: 1 },
  },
  {
    id: 'furnace', name: '熔炉', glyph: '🔥', max: 2, cost: [200, 380], income: [0, 12],
    desc: '每晚收入 +{income}；篝火可移除卡牌。', effects: { campfireRemove: true },
  },
  {
    id: 'stage', name: '舞台', glyph: '🎭', max: 2, cost: [170, 330], income: [0, 9],
    desc: '每晚收入 +{income}；战斗后卡牌奖励 +{lv} 张。', effects: { cardChoice: 1 },
  },
  {
    id: 'vault', name: '金库', glyph: '🔐', max: 2, cost: [190, 370], income: [8, 20],
    desc: '每晚收入 +{income}；所有酒馆收入 +{pct}%。', effects: { incomePct: 0.15 },
  },
  {
    id: 'ward', name: '护符墙', glyph: '🛡️', max: 2, cost: [210, 400], income: [0, 11],
    desc: '每晚收入 +{income}；远征失败保留 {pct}% 金币。', effects: { keepGold: 0.3 },
  },
  {
    id: 'lighthouse', name: '灯塔', glyph: '🗼', max: 2, cost: [230, 430], income: [0, 13],
    desc: '每晚收入 +{income}；每晚潮汐伤害 -{lv}。', effects: { tideWard: 1 },
  },
  {
    id: 'potion_still', name: '药水增效台', glyph: '⚗️', max: 2, cost: [130, 230], income: [2, 7],
    desc: '每晚收入 +{income}；药水效果的正数数值 +{lv}。', effects: { potionPower: 1 },
  },
  {
    id: 'commission_house', name: '委托所', glyph: '📋', max: 2, cost: [90, 180], income: [2, 6],
    desc: '每晚收入 +{income}；委托候选 +{lv}，完成委托的金币报酬 +{commissionGold}。',
    effects: { commissionChoices: 1, commissionGoldPlus: 10 },
  },
  {
    id: 'training_yard', name: '演武场', glyph: '🎯', max: 2, cost: [120, 220], income: [0, 4],
    desc: '每晚收入 +{income}；每场战斗首回合多抽 {lv} 张牌。', effects: { firstTurnDrawPlus: 1 },
  },
  {
    id: 'supply_depot', name: '补给库', glyph: '📦', max: 2, cost: [110, 200], income: [2, 5],
    desc: '每晚收入 +{income}；远征起始额外携带 {lv} 瓶随机药水，受药水栏位上限限制。', effects: { startPotions: 1 },
  },
];

export const STAFF = [
  {
    id: 's_barkeep', name: '阿铎', title: '酒保', glyph: '🧑‍🍳', cost: 120, wage: 10,
    lore: '他记得每个常客的酒，也记得你没付的那几杯。',
    mods: { incomeFlat: 14, firstTurnDrawPlus: 1 },
    desc: '每晚收入 +14。远征中每场战斗首回合多抽 1 张。',
  },
  {
    id: 's_smith', name: '赫妲', title: '铁匠', glyph: '🧑‍🏭', cost: 180, wage: 16,
    lore: '「刀不认人，但铁认钱。」',
    mods: { incomeFlat: 0, damagePlus: 1 },
    desc: '攻击伤害 +1。',
  },
  {
    id: 's_physician', name: '莫尔', title: '医师', glyph: '🧑‍⚕️', cost: 210, wage: 18,
    lore: '她收两倍诊金，因为这里死人多。',
    mods: { incomeFlat: 0, runEndHealPct: 0.25 },
    desc: '每次远征结束回复 25% 最大生命。',
  },
  {
    id: 's_scout', name: '苔', title: '斥候', glyph: '🧝', cost: 160, wage: 12,
    lore: '她从不说自己看见了什么，只说"那边不能去"。',
    mods: { incomeFlat: 6, mapReveal: 1, eliteBonus: 1 },
    desc: '每晚收入 +6；地图多揭示 1 行；精英奖励金币 +15。',
  },
  {
    id: 's_accountant', name: '窄框', title: '账房', glyph: '🧑‍💼', cost: 150, wage: 11,
    lore: '他从不抬头，但没人敢少报一枚硬币。',
    mods: { incomeFlat: 0, incomePct: 0.2 },
    desc: '酒馆收入 +20%。',
  },
  {
    id: 's_cook', name: '热锅', title: '厨师', glyph: '🧑‍🍳', cost: 140, wage: 10,
    lore: '汤里什么都放，除了盐——盐用完了。',
    mods: { incomeFlat: 8, potionPower: 1 },
    desc: '每晚收入 +8；药水效果数值 +1。',
  },
  {
    id: 's_broker', name: '双舌', title: '掮客', glyph: '🧑‍🦱', cost: 250, wage: 22,
    lore: '他能替你买到任何东西，前提是你不问他从哪儿买的。',
    mods: { incomeFlat: 0, shopDiscount: 0.2 },
    desc: '商店价格 -20%。',
  },
  {
    id: 's_archivist', name: '灰页', title: '档案员', glyph: '🧑‍🎓', cost: 270, wage: 20,
    lore: '她收集的全是没发生过的事。',
    mods: { incomeFlat: 0, startCards: 1, relicFind: 0.15 },
    desc: '远征起始牌组 +1 张随机卡；遗物出现几率 +15%。',
  },
  {
    id: 's_distiller', name: '松釜', title: '蒸馏师', glyph: '🧑‍🔬', cost: 170, wage: 12,
    lore: '他把每一滴酒分成三层，最底下那层只给要远行的人。',
    mods: { incomeFlat: 4, potionPower: 1 },
    desc: '每晚收入 +4；药水效果的正数数值 +1。',
  },
  {
    id: 's_quartermaster', name: '乌簿', title: '补给官', glyph: '🧑‍💼', cost: 110, wage: 8,
    lore: '账本上没有欠条，只有下一趟出门前要补齐的东西。',
    mods: { incomeFlat: 8, startPotions: 1 },
    desc: '每晚收入 +8；每次远征起始额外携带 1 瓶随机药水，受栏位上限限制。',
  },
  {
    id: 's_drillmaster', name: '钢靴', title: '教头', glyph: '🧑‍✈️', cost: 160, wage: 12,
    lore: '她只练第一步。第一步站稳的人，往往还能迈出第二步。',
    mods: { incomeFlat: 0, firstTurnDrawPlus: 1 },
    desc: '每场战斗首回合多抽 1 张牌。',
  },
  {
    id: 's_sentinel', name: '雾哨', title: '港卫', glyph: '🧑‍🚒', cost: 150, wage: 10,
    lore: '他巡一趟码头，回来总会让每个人把肩带收紧一点。',
    mods: { incomeFlat: 2, maxHp: 6 },
    desc: '每晚收入 +2；远征最大生命 +6。',
  },
];

export const UPGRADES = [
  { id: 'u_gold', name: '私窖钱匣', glyph: '💰', cost: 120, max: 3, desc: '每次远征起始金币 +{v}。', v: 40 },
  { id: 'u_hp', name: '加固肋骨', glyph: '🦴', cost: 140, max: 3, desc: '最大生命 +{v}。', v: 8 },
  { id: 'u_start_card', name: '额外口粮', glyph: '🃏', cost: 160, max: 3, desc: '起始牌组 +{v} 张随机稀有卡。', v: 1 },
  { id: 'u_start_relic', name: '传家遗物', glyph: '🔩', cost: 260, max: 2, desc: '起始获得 {v} 件随机遗物。', v: 1 },
  { id: 'u_potion', name: '随身药箱', glyph: '⚗️', cost: 130, max: 3, desc: '起始携带 {v} 瓶随机药水。', v: 1 },
  { id: 'u_card_removal', name: '拆解台', glyph: '🪚', cost: 220, max: 1, desc: '篝火与商店可从牌组移除卡牌。' },
  { id: 'u_relic_smith', name: '遗物匠', glyph: '⚒️', cost: 300, max: 1, desc: '铁砧可升级遗物（提升 mod 数值）。' },
  { id: 'u_boss_ward', name: '首领护符', glyph: '🔰', cost: 280, max: 1, desc: '每场战斗首回合免疫一次伤害。' },
  { id: 'u_deck_dilution', name: '走私旧牌', glyph: '📦', cost: 90, max: 4, desc: '起始牌组加入 {v} 张通用弱牌（数量换灵活性）。', v: 2 },
  { id: 'u_insurance', name: '远征保险', glyph: '📜', cost: 340, max: 1, desc: '远征失败时额外保留 30% 金币。' },
];

export const UNLOCK_CATALOG = {
  cards: { cost: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], label: '卡牌图鉴' },
  relics: { cost: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], label: '遗物图鉴' },
  characters: { cost: [4, 8, 12, 16], label: '旅者名录' },
};

export const NIGHT_NAMES = [
  '第一夜 · 薄雾',
  '第二夜 · 铁雨',
  '第三夜 · 低潮',
  '第四夜 · 白骨潮',
  '第五夜 · 熔心将醒',
  '终夜 · 零火深渊',
];

export const TIDE_FLAVOR = [
  '海雾里传来第一声钟响。酒馆的门栓自己落了下去。',
  '硫味的雨下了整夜。有人在雾中敲了三次窗。',
  '潮水退到了不该退的位置，露出一整条船的肋骨。',
  '所有的灯同时灭了，然后所有的灯同时亮起——颜色是红的。',
  '地平线上有个东西站起来了，它的高度超过了云。',
  '执政官不再等待。它自己来了。',
];

export const USABLE_FACILITIES = FACILITIES;
export const USABLE_UPGRADES = UPGRADES;
