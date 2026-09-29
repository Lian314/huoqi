// ============ 卡池 C：冰霜 / 毒 / 雷光 ============
// 纯数据：全部字面量，单引号，无 import / 无函数 / 无逻辑。
// op、cond、custom.fn 严格遵循 docs/DATA_SPEC.md；
// status id 严格取自 src/data/statuses.js（无 slow，迟滞一律用 drain 蚀骨）。
// 全部 id 以 c_i_ 前缀开头（ice / ichor / ion），与其他卡池不冲突。

export const CARDS_FROST = [

  // ==================== 冰霜：脆弱 / 迟滞 / 控制 ====================

  {
    id: 'c_i_frostbite', name: '冻疮啃咬', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['冰霜', '打击'], art: '❄',
    text: '造成 5 点伤害。目标获得 2 层脆骨。',
    effects: [{ op: 'damage', v: 5 }, { op: 'debuff', s: 'frail', v: 2, t: 'target' }],
    upgrade: { text: '造成 8 点伤害。目标获得 3 层脆骨。', effects: [{ op: 'damage', v: 8 }, { op: 'debuff', s: 'frail', v: 3, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_glacier_breath', name: '霜息喷涌', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies',
    tags: ['冰霜'],
    text: '对所有敌人造成 4 点伤害。全体敌人获得 1 层虚弱。',
    effects: [{ op: 'damageAll', v: 4 }, { op: 'debuff', s: 'weak', v: 1, t: 'allEnemies' }],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_shatter_quiet', name: '落针无声', type: 'attack', rarity: 'common', cost: 0, target: 'allEnemies',
    tags: ['冰霜', '迅捷'], art: '❄', exhaust: true,
    text: '对所有敌人造成 4 点伤害。全体敌人获得 1 层空壳。',
    effects: [{ op: 'damageAll', v: 4 }, { op: 'debuff', s: 'hollow', v: 1, t: 'allEnemies' }],
    upgrade: { text: '对所有敌人造成 6 点伤害。全体敌人获得 2 层空壳。', effects: [{ op: 'damageAll', v: 6 }, { op: 'debuff', s: 'hollow', v: 2, t: 'allEnemies' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_rime_lance', name: '霜棱贯穿', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
    tags: ['冰霜', '打击'], art: '棱', exhaust: true,
    text: '造成 13 点伤害。目标获得 3 层脆骨。',
    effects: [{ op: 'damage', v: 13 }, { op: 'debuff', s: 'frail', v: 3, t: 'target' }],
    upgrade: { text: '造成 17 点伤害。目标获得 4 层脆骨。', effects: [{ op: 'damage', v: 17 }, { op: 'debuff', s: 'frail', v: 4, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_hush_of_winter', name: '寒冬噤声', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['冰霜'],
    text: '目标获得 4 层蚀骨。若目标已有至少 2 层蚀骨，获得 1 点能量。',
    effects: [
      { op: 'debuff', s: 'drain', v: 4, t: 'target' },
      { op: 'if', cond: { type: 'hasStatus', s: 'drain', gte: 2 }, then: [{ op: 'energy', n: 1 }], else: [] },
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_hoarfrost_bind', name: '霜缚', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['冰霜'], art: '❄',
    text: '目标获得 2 层缠绕与 1 层虚弱。',
    effects: [{ op: 'debuff', s: 'entangled', v: 2, t: 'target' }, { op: 'debuff', s: 'weak', v: 1, t: 'target' }],
    upgrade: { text: '目标获得 3 层缠绕与 2 层虚弱。', effects: [{ op: 'debuff', s: 'entangled', v: 3, t: 'target' }, { op: 'debuff', s: 'weak', v: 2, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_glacier_march', name: '冰川行军', type: 'skill', rarity: 'uncommon', cost: 2, target: 'self',
    tags: ['冰霜', '防御'],
    text: '获得等同于你 2 倍【力量】层数的格挡与 11 点格挡。获得 1 层碎裂。',
    effects: [{ op: 'block', v: '2S' }, { op: 'block', v: 11 }, { op: 'buff', s: 'splinter', v: 1, t: 'self' }],
    upgrade: { text: '获得等同于你 2 倍【力量】层数的格挡与 15 点格挡。获得 2 层碎裂。', effects: [{ op: 'block', v: '2S' }, { op: 'block', v: 15 }, { op: 'buff', s: 'splinter', v: 2, t: 'self' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_permafrost_ward', name: '冻土庇护', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
    tags: ['冰霜', '防御'],
    text: '获得 9 点格挡。抽 1 张牌。若你的生命低于最大生命的一半，回复 6 点生命。',
    effects: [
      { op: 'block', v: 9 },
      { op: 'draw', n: 1 },
      { op: 'if', cond: { type: 'hpBelow', p: 0.5 }, then: [{ op: 'heal', n: 6 }], else: [] },
    ],
    upgrade: { text: '获得 12 点格挡。抽 1 张牌。若你的生命低于最大生命的一半，回复 9 点生命。', effects: [{ op: 'block', v: 12 }, { op: 'draw', n: 1 }, { op: 'if', cond: { type: 'hpBelow', p: 0.5 }, then: [{ op: 'heal', n: 9 }], else: [] }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_rime_heart', name: '霜心', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['冰霜', '防御'], art: '心',
    text: '获得 2 层金属化、3 层再生与 1 层神器。',
    effects: [
      { op: 'buff', s: 'metallicize', v: 2, t: 'self' },
      { op: 'buff', s: 'regen', v: 3, t: 'self' },
      { op: 'buff', s: 'artifact', v: 1, t: 'self' },
    ],
    upgrade: {
      text: '获得 3 层金属化、5 层再生与 2 层神器。',
      effects: [{ op: 'buff', s: 'metallicize', v: 3, t: 'self' }, { op: 'buff', s: 'regen', v: 5, t: 'self' }, { op: 'buff', s: 'artifact', v: 2, t: 'self' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_white_death', name: '白蚀', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    tags: ['冰霜', '秘术'], art: '❄',
    text: '获得 2 层虚化、2 层敏捷与 1 层专注。',
    effects: [
      { op: 'buff', s: 'intangible', v: 2, t: 'self' },
      { op: 'buff', s: 'dexterity', v: 2, t: 'self' },
      { op: 'buff', s: 'focus', v: 1, t: 'self' },
    ],
    upgrade: {
      text: '获得 3 层虚化、3 层敏捷与 2 层专注。',
      effects: [{ op: 'buff', s: 'intangible', v: 3, t: 'self' }, { op: 'buff', s: 'dexterity', v: 3, t: 'self' }, { op: 'buff', s: 'focus', v: 2, t: 'self' }],
    },
    unlock: { embers: 12 },
  },

  // ==================== 毒：中毒堆叠 ====================

  {
    id: 'c_i_venom_sleeve', name: '毒袖', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['毒', '打击'], art: '毒',
    text: '造成 6 点伤害。目标获得 3 层中毒。',
    effects: [{ op: 'damage', v: 6 }, { op: 'debuff', s: 'poison', v: 3, t: 'target' }],
    upgrade: { text: '造成 9 点伤害。目标获得 5 层中毒。', effects: [{ op: 'damage', v: 9 }, { op: 'debuff', s: 'poison', v: 5, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_bile_flask', name: '胆汁瓶', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
    tags: ['毒'], art: '毒', exhaust: true,
    text: '施加 2 次 3 层中毒。',
    effects: [{ op: 'repeat', n: 2, then: [{ op: 'debuff', s: 'poison', v: 3, t: 'target' }] }],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_septic_sting', name: '脓刺', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['毒', '打击'],
    text: '目标获得等同于你【力量】层数的中毒与 2 层脆骨。若你的手牌不多于 2 张，抽 1 张牌。',
    effects: [
      { op: 'debuff', s: 'poison', v: 'S', t: 'target' },
      { op: 'debuff', s: 'frail', v: 2, t: 'target' },
      { op: 'if', cond: { type: 'handSize', n: 2 }, then: [{ op: 'draw', n: 1 }], else: [] },
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_ichor_spores', name: '脓孢子', type: 'attack', rarity: 'uncommon', cost: 1, target: 'allEnemies',
    tags: ['毒', '秘术'], art: '孢',
    text: '对所有敌人施加 3 次 2 层中毒。若存活的敌人不多于 2 个，改为全体敌人直接获得 4 层中毒。',
    effects: [
      {
        op: 'if',
        cond: { type: 'enemyCount', n: 2 },
        then: [{ op: 'debuff', s: 'poison', v: 4, t: 'allEnemies' }],
        else: [{ op: 'repeat', n: 3, then: [{ op: 'debuff', s: 'poison', v: 2, t: 'allEnemies' }] }],
      },
    ],
    upgrade: {
      text: '对所有敌人施加 4 次 2 层中毒。若存活的敌人不多于 2 个，改为全体敌人直接获得 6 层中毒。',
      effects: [{
        op: 'if',
        cond: { type: 'enemyCount', n: 2 },
        then: [{ op: 'debuff', s: 'poison', v: 6, t: 'allEnemies' }],
        else: [{ op: 'repeat', n: 4, then: [{ op: 'debuff', s: 'poison', v: 2, t: 'allEnemies' }] }],
      }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_grave_bloom', name: '坟花绽放', type: 'attack', rarity: 'rare', cost: 2, target: 'allEnemies',
    tags: ['毒', '血祭'], art: '毒', ethereal: true,
    text: '全体敌人获得 6 层中毒。将整个弃牌堆洗回抽牌堆。',
    effects: [{ op: 'debuff', s: 'poison', v: 6, t: 'allEnemies' }, { op: 'custom', fn: 'shuffleDiscardToDeck' }],
    upgrade: { text: '全体敌人获得 9 层中毒。将整个弃牌堆洗回抽牌堆。', effects: [{ op: 'debuff', s: 'poison', v: 9, t: 'allEnemies' }, { op: 'custom', fn: 'shuffleDiscardToDeck' }] },
    unlock: { embers: 8 },
  },
  {
    id: 'c_i_rot_spread', name: '溃烂蔓延', type: 'skill', rarity: 'uncommon', cost: 1, target: 'allEnemies',
    tags: ['毒'],
    text: '全体敌人获得 3 层中毒。将 1 张【毒袖】洗入抽牌堆。',
    effects: [{ op: 'debuff', s: 'poison', v: 3, t: 'allEnemies' }, { op: 'shuffleIn', card: 'c_i_venom_sleeve', n: 1 }],
    upgrade: { text: '全体敌人获得 5 层中毒。将 2 张【毒袖】洗入抽牌堆。', effects: [{ op: 'debuff', s: 'poison', v: 5, t: 'allEnemies' }, { op: 'shuffleIn', card: 'c_i_venom_sleeve', n: 2 }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_toxin_reservoir', name: '毒腺储囊', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['毒', '秘术'],
    text: '目标获得等同于你 2 倍【力量】层数的中毒与 4 层中毒。若你的牌组中【毒袖】少于 3 张，改为只施加等同于你【力量】层数的中毒。',
    effects: [{
      op: 'if',
      cond: { type: 'deckCount', card: 'c_i_venom_sleeve', gte: 3 },
      then: [{ op: 'debuff', s: 'poison', v: '2S', t: 'target' }, { op: 'debuff', s: 'poison', v: 4, t: 'target' }],
      else: [{ op: 'debuff', s: 'poison', v: 'S', t: 'target' }],
    }],
    upgrade: {
      text: '目标获得等同于你 2 倍【力量】层数的中毒与 6 层中毒。若你的牌组中【毒袖】少于 3 张，改为只施加等同于你【力量】层数的中毒。',
      effects: [{
        op: 'if',
        cond: { type: 'deckCount', card: 'c_i_venom_sleeve', gte: 3 },
        then: [{ op: 'debuff', s: 'poison', v: '2S', t: 'target' }, { op: 'debuff', s: 'poison', v: 6, t: 'target' }],
        else: [{ op: 'debuff', s: 'poison', v: 'S', t: 'target' }],
      }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_bloodletting', name: '放血', type: 'skill', rarity: 'common', cost: 1, target: 'self',
    tags: ['毒', '血祭'], exhaust: true,
    text: '失去 3 点生命。回复等同于你手牌数量的生命。获得 1 点能量。若这是第 1 回合，额外获得 1 点能量。',
    effects: [
      { op: 'loseHp', n: 3 },
      { op: 'heal', n: 'hand' },
      { op: 'energy', n: 1 },
      { op: 'if', cond: { type: 'turn', n: 1 }, then: [{ op: 'energy', n: 1 }], else: [] },
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_ichor_censer', name: '脓香炉', type: 'power', rarity: 'common', cost: 1, target: 'none',
    tags: ['毒', '防御'], art: '炉',
    text: '获得 3 层荆棘与 1 层神器。',
    effects: [{ op: 'buff', s: 'thorns', v: 3, t: 'self' }, { op: 'buff', s: 'artifact', v: 1, t: 'self' }],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_plague_bearer', name: '疫携者', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    tags: ['毒', '秘术'], art: '毒',
    text: '获得 1 层迅捷、1 层暴怒与 1 层汲取。',
    effects: [
      { op: 'buff', s: 'haste', v: 1, t: 'self' },
      { op: 'buff', s: 'fury', v: 1, t: 'self' },
      { op: 'buff', s: 'leech', v: 1, t: 'self' },
    ],
    upgrade: {
      text: '获得 1 层迅捷、2 层暴怒与 2 层汲取。',
      effects: [{ op: 'buff', s: 'haste', v: 1, t: 'self' }, { op: 'buff', s: 'fury', v: 2, t: 'self' }, { op: 'buff', s: 'leech', v: 2, t: 'self' }],
    },
    unlock: { embers: 14 },
  },

  // ==================== 雷光：削弱与爆发 ====================

  {
    id: 'c_i_arc_jump', name: '弧光跃', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
    tags: ['雷光', '迅捷'], art: '⚡',
    text: '造成 4 点伤害。抽 1 张牌。若你的能量已耗尽，改为抽 2 张牌。',
    effects: [
      { op: 'damage', v: 4 },
      { op: 'if', cond: { type: 'energy', n: 0 }, then: [{ op: 'draw', n: 2 }], else: [{ op: 'draw', n: 1 }] },
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_spark_lash', name: '火花鞭', type: 'skill', rarity: 'common', cost: 0, target: 'enemy',
    tags: ['雷光'], art: '⚡', exhaust: true,
    text: '目标获得 3 层虚弱与 2 层易伤。',
    effects: [{ op: 'debuff', s: 'weak', v: 3, t: 'target' }, { op: 'debuff', s: 'vulnerable', v: 2, t: 'target' }],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_static_strike', name: '静电穿刺', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['雷光', '打击'],
    text: '造成 5 点伤害。目标获得 2 层易伤。',
    effects: [{ op: 'damage', v: 5 }, { op: 'debuff', s: 'vulnerable', v: 2, t: 'target' }],
    upgrade: { text: '造成 8 点伤害。目标获得 3 层易伤。', effects: [{ op: 'damage', v: 8 }, { op: 'debuff', s: 'vulnerable', v: 3, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_tesla_ribbon', name: '雷电缎带', type: 'attack', rarity: 'uncommon', cost: 2, target: 'allEnemies',
    tags: ['雷光'], art: '⚡',
    text: '对所有敌人造成 7 点伤害。全体敌人获得 2 层虚弱。',
    effects: [{ op: 'damageAll', v: 7 }, { op: 'debuff', s: 'weak', v: 2, t: 'allEnemies' }],
    upgrade: { text: '对所有敌人造成 10 点伤害。全体敌人获得 3 层虚弱。', effects: [{ op: 'damageAll', v: 10 }, { op: 'debuff', s: 'weak', v: 3, t: 'allEnemies' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_thunderhead', name: '雷霆首击', type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
    tags: ['雷光', '打击'], art: '⚡',
    text: '造成 10 点伤害。若目标生命低于 40%，改为造成等同于你 2 倍【力量】层数的伤害。',
    effects: [{
      op: 'if',
      cond: { type: 'targetLow', p: 0.4 },
      then: [{ op: 'damage', v: '2S', raw:true }],
      else: [{ op: 'damage', v: 10 }],
    }],
    upgrade: { text: '造成 14 点伤害。若目标生命低于 40%，改为造成等同于你 2 倍【力量】层数的伤害。', effects: [{ op: 'if', cond: { type: 'targetLow', p: 0.4 }, then: [{ op: 'damage', v: '2S', raw:true }], else: [{ op: 'damage', v: 14 }] }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_coil_discharge', name: '线圈放电', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    tags: ['雷光', '机械'], art: '线', ethereal: true,
    text: '造成 2 次 5 点伤害。目标获得 2 层虚弱。',
    effects: [
      { op: 'repeat', n: 2, then: [{ op: 'damage', v: 5 }] },
      { op: 'debuff', s: 'weak', v: 2, t: 'target' },
    ],
    upgrade: { text: '造成 3 次 5 点伤害。目标获得 3 层虚弱。', effects: [{ op: 'repeat', n: 3, then: [{ op: 'damage', v: 5 }] }, { op: 'debuff', s: 'weak', v: 3, t: 'target' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_copper_cage', name: '铜笼', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['雷光', '机械'], art: '笼',
    text: '获得等同于你手牌数量的格挡。目标获得 1 层缠绕与 1 层虚弱。若目标没有空壳，再施加 2 层空壳。',
    effects: [
      { op: 'block', v: 'hand' },
      { op: 'debuff', s: 'entangled', v: 1, t: 'target' },
      { op: 'debuff', s: 'weak', v: 1, t: 'target' },
      { op: 'if', cond: { type: 'noStatus', s: 'hollow' }, then: [{ op: 'debuff', s: 'hollow', v: 2, t: 'target' }], else: [] },
    ],
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_volley_arc', name: '电弧齐射', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies',
    tags: ['雷光'],
    text: '对所有敌人造成 2 次 3 点伤害。全体敌人获得 1 层易伤。将整个弃牌堆洗回抽牌堆。',
    effects: [
      { op: 'repeat', n: 2, then: [{ op: 'damageAll', v: 3 }] },
      { op: 'debuff', s: 'vulnerable', v: 1, t: 'allEnemies' },
      { op: 'custom', fn: 'shuffleDiscardToDeck' },
    ],
    upgrade: { text: '对所有敌人造成 2 次 4 点伤害。全体敌人获得 2 层易伤。将整个弃牌堆洗回抽牌堆。', effects: [{ op: 'repeat', n: 2, then: [{ op: 'damageAll', v: 4 }] }, { op: 'debuff', s: 'vulnerable', v: 2, t: 'allEnemies' }, { op: 'custom', fn: 'shuffleDiscardToDeck' }] },
    unlock: { embers: 0 },
  },
  {
    id: 'c_i_ion_storm', name: '离子风暴', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['雷光', '秘术'], art: '⚡',
    text: '获得 2 层静电与 1 层超载。',
    effects: [{ op: 'buff', s: 'static', v: 2, t: 'self' }, { op: 'buff', s: 'overload', v: 1, t: 'self' }],
    upgrade: { text: '获得 3 层静电与 2 层超载。', effects: [{ op: 'buff', s: 'static', v: 3, t: 'self' }, { op: 'buff', s: 'overload', v: 2, t: 'self' }] },
    unlock: { embers: 8 },
  },
  {
    id: 'c_i_arc_singularity', name: '弧光奇点', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy',
    tags: ['雷光', '秘术'], art: '⚡', exhaust: true,
    text: '获得 1 层力量与 1 层回响。造成等同于你牌组总张数的伤害。目标获得 3 层易伤。',
    effects: [
      { op: 'buff', s: 'strength', v: 1, t: 'self' },
      { op: 'buff', s: 'echo', v: 1, t: 'self' },
      { op: 'damage', v: 'deck', raw: true },
      { op: 'debuff', s: 'vulnerable', v: 3, t: 'target' },
    ],
    upgrade: { text: '获得 2 层力量与 1 层回响。造成等同于你牌组总张数的伤害。目标获得 4 层易伤。', effects: [{ op: 'buff', s: 'strength', v: 2, t: 'self' }, { op: 'buff', s: 'echo', v: 1, t: 'self' }, { op: 'damage', v: 'deck', raw: true }, { op: 'debuff', s: 'vulnerable', v: 4, t: 'target' }] },
    unlock: { embers: 16 },
  },

];
