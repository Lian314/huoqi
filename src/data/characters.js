// ============ 可选旅者 ============
// mechanic 会在界面上以文本展示；引擎本身不自动实现，需要由对应卡牌/遗物承担。
export const CHARACTERS = [
  {
    id: 'ch_ashborn', name: '烬裔', title: '锈锚酒馆老板',
    glyph: '🜂', color: '#ff6b35', hp: 70, gold: 100,
    lore: '炉子从没冷过。冷下来的那天，他也是从炉膛里爬出来的。',
    mechanic: '灼烧是他的语言。每场战斗开始时获得 1 点力量；灼烧层数不衰减，可被多张牌反复叠加。',
    relic: 'relic_ember_heart',
    deck: [
      'c_strike', 'c_strike', 'c_strike', 'c_strike',
      'c_bash', 'c_bash',
      'c_guard', 'c_guard',
      'c_ember_slash', 'c_ember_slash',
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'ch_ichor', name: '毒医', title: '被酒馆收留的江湖郎中',
    glyph: '⚗', color: '#74b816', hp: 66, gold: 110,
    lore: '她说她只治两种病：还没死的，和快死的。',
    mechanic: '以毒攻敌。中毒无视格挡且逐层递减；她倾向叠加中毒而不是一次爆发，并能用生命换取毒素。',
    relic: 'relic_tide_locket',
    deck: [
      'c_strike', 'c_strike', 'c_strike',
      'c_guard', 'c_guard', 'c_guard',
      'c_bash', 'c_bash',
      'c_ember_slash', 'c_ember_slash',
    ],
    unlock: { embers: 5 },
  },
  {
    id: 'ch_gambler', name: '赌徒', title: '把命押在下一张牌上',
    glyph: '🂡', color: '#e5a50a', hp: 62, gold: 125,
    lore: '「牌不会骗人。发牌的人才会。」',
    mechanic: '弃牌即资源。弃牌堆能被反复洗回，能量与抽牌随弃牌数增长，牌组越薄越危险。',
    relic: 'relic_copper_key',
    deck: [
      'c_strike', 'c_strike', 'c_strike', 'c_strike',
      'c_guard', 'c_guard',
      'c_bash',
      'c_ember_slash', 'c_ember_slash', 'c_burn_wave',
    ],
    unlock: { embers: 10 },
  },
  {
    id: 'ch_warden', name: '铁壁', title: '守过三座已经塌掉的门',
    glyph: '🛡', color: '#4dabf7', hp: 78, gold: 95,
    lore: '他数得清自己身上每一道疤，也数得清别人欠他的。',
    mechanic: '护甲即武器。荆棘反弹、格挡转化与金属化是他的核心，被动挨打会让他越打越强。',
    relic: 'relic_ash_charm',
    deck: [
      'c_guard', 'c_guard', 'c_guard', 'c_guard', 'c_guard',
      'c_strike', 'c_strike', 'c_strike',
      'c_bash', 'c_ember_slash',
    ],
    unlock: { embers: 15 },
  },
  {
    id: 'ch_echoer', name: '回响者', title: '她听得见牌还没打出来时的声音',
    glyph: '◎', color: '#9775fa', hp: 64, gold: 105,
    lore: '「这张牌会杀死它。」——她说的通常不是这张牌。',
    mechanic: '效果会被重复触发。回响、无实体与"打出后回到手上"构成循环，牌组越独特收益越高。',
    relic: 'relic_salt_ledger',
    deck: [
      'c_strike', 'c_strike', 'c_strike',
      'c_guard', 'c_guard',
      'c_bash', 'c_bash',
      'c_ember_slash', 'c_ember_slash', 'c_burn_wave',
    ],
    unlock: { embers: 20 },
  },
];
