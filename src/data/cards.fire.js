// ============ 卡池 F：火焰 / 灼烧主题 ============
// 纯数据：字面量，单引号，无 import / 无函数 / 无逻辑。
// op、cond、custom 严格遵循 docs/DATA_SPEC.md 与 src/systems/effects.js 的白名单。
// status id 严格取自 src/data/statuses.js。
// 灼烧（burn）decay:'none' —— 不衰减，可作为持续伤害核心。

export const CARDS_FIRE = [

  // ==================== 攻击牌 17 ====================

  {
    id: 'c_f_slag_fist', name: '熔渣拳', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['火焰', '打击'], art: '熔',
    text: '造成 6 点伤害，施加 3 层灼烧。',
    effects: [{ op: 'damage', v: 6 }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '造成 9 点伤害，施加 4 层灼烧。',
      effects: [{ op: 'damage', v: 9 }, { op: 'debuff', s: 'burn', v: 4, t: 'target' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_tinderbox', name: '火绒匣', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
    tags: ['火焰'], art: '燧',
    text: '造成 4 点伤害并施加 2 层灼烧。若你没有剩余能量，额外施加 3 层灼烧。',
    effects: [
      { op: 'damage', v: 4 },
      { op: 'debuff', s: 'burn', v: 2, t: 'target' },
      { op: 'if', cond: { type: 'energy', n: 0 }, then: [{ op: 'debuff', s: 'burn', v: 3, t: 'target' }], else: [] },
    ],
    exhaust: false, ethereal: true, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_sulfur_lash', name: '硫火鞭', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['火焰', '打击'],
    text: '若你生命低于最大生命的一半，造成 12 点伤害并施加 1 层易伤；否则造成 8 点伤害并施加 1 层易伤。',
    effects: [
      {
        op: 'if',
        cond: { type: 'hpBelow', p: 0.5 },
        then: [{ op: 'damage', v: 12 }, { op: 'debuff', s: 'vulnerable', v: 1, t: 'target' }],
        else: [{ op: 'damage', v: 8 }, { op: 'debuff', s: 'vulnerable', v: 1, t: 'target' }],
      },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '若你生命低于最大生命的一半，造成 16 点伤害并施加 1 层易伤；否则造成 11 点伤害并施加 1 层易伤。',
      effects: [
        {
          op: 'if',
          cond: { type: 'hpBelow', p: 0.5 },
          then: [{ op: 'damage', v: 16 }, { op: 'debuff', s: 'vulnerable', v: 1, t: 'target' }],
          else: [{ op: 'damage', v: 11 }, { op: 'debuff', s: 'vulnerable', v: 1, t: 'target' }],
        },
      ],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_cinder_dart', name: '灰烬飞镖', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
    tags: ['火焰', '重复'],
    text: '对目标造成 3 次 2 点伤害。',
    effects: [{ op: 'repeat', n: 3, then: [{ op: 'damage', v: 2 }] }],
    exhaust: false, ethereal: true, innate: false, retain: false,
    upgrade: {
      text: '对目标造成 4 次 3 点伤害。',
      effects: [{ op: 'repeat', n: 4, then: [{ op: 'damage', v: 3 }] }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_ember_burst', name: '爆燃', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies',
    tags: ['火焰'], art: '🔥',
    text: '对所有敌人造成 5 点伤害并施加 2 层灼烧。若这是第 1 回合，额外对所有敌人造成 4 点伤害。',
    effects: [
      { op: 'damageAll', v: 5 },
      { op: 'debuff', s: 'burn', v: 2, t: 'allEnemies' },
      { op: 'if', cond: { type: 'turn', n: 1 }, then: [{ op: 'damageAll', v: 4 }], else: [] },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '对所有敌人造成 8 点伤害并施加 3 层灼烧。若这是第 1 回合，额外对所有敌人造成 6 点伤害。',
      effects: [
        { op: 'damageAll', v: 8 },
        { op: 'debuff', s: 'burn', v: 3, t: 'allEnemies' },
        { op: 'if', cond: { type: 'turn', n: 1 }, then: [{ op: 'damageAll', v: 6 }], else: [] },
      ],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_cinder_rain', name: '落灰', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies',
    tags: ['火焰'],
    text: '重复 2 次：对所有敌人造成 2 点伤害并施加 1 层灼烧。',
    effects: [{ op: 'repeat', n: 2, then: [{ op: 'damageAll', v: 2 }, { op: 'debuff', s: 'burn', v: 1, t: 'allEnemies' }] }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_ashen_grip', name: '灰烬之握', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['火焰', '打击'],
    text: '造成 5 点伤害，施加 2 层虚弱。',
    effects: [{ op: 'damage', v: 5 }, { op: 'debuff', s: 'weak', v: 2, t: 'target' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '造成 7 点伤害，施加 3 层虚弱。',
      effects: [{ op: 'damage', v: 7 }, { op: 'debuff', s: 'weak', v: 3, t: 'target' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_oil_splash', name: '油泼', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['火焰'],
    text: '造成 3 点伤害，施加 5 层灼烧。',
    effects: [{ op: 'damage', v: 3 }, { op: 'debuff', s: 'burn', v: 5, t: 'target' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '造成 5 点伤害，施加 7 层灼烧。',
      effects: [{ op: 'damage', v: 5 }, { op: 'debuff', s: 'burn', v: 7, t: 'target' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_flare_lunge', name: '焰刺突进', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    tags: ['火焰', '迅捷'],
    text: '若这是本回合打出的第一张牌，造成 12 点伤害；否则造成 5 点伤害。',
    effects: [
      { op: 'if', cond: { type: 'firstCardOfTurn' }, then: [{ op: 'damage', v: 12 }], else: [{ op: 'damage', v: 5 }] },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '若这是本回合打出的第一张牌，造成 16 点伤害；否则造成 7 点伤害。',
      effects: [
        { op: 'if', cond: { type: 'firstCardOfTurn' }, then: [{ op: 'damage', v: 16 }], else: [{ op: 'damage', v: 7 }] },
      ],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_press_stamp', name: '冲压印', type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
    tags: ['机械'],
    text: '失去 2 点生命，造成 13 点伤害。',
    effects: [{ op: 'loseHp', n: 2 }, { op: 'damage', v: 13 }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '失去 1 点生命，造成 17 点伤害。',
      effects: [{ op: 'loseHp', n: 1 }, { op: 'damage', v: 17 }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_rivet_rain', name: '铆钉雨', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies',
    tags: ['机械', '打击'],
    text: '对所有敌人施加 1 层易伤。若存活敌人不多于 2 个，重复 2 次对所有敌人造成 5 点伤害；否则对所有敌人造成 6 点伤害。',
    effects: [
      { op: 'debuff', s: 'vulnerable', v: 1, t: 'allEnemies' },
      {
        op: 'if',
        cond: { type: 'enemyCount', n: 2 },
        then: [{ op: 'repeat', n: 2, then: [{ op: 'damageAll', v: 5 }] }],
        else: [{ op: 'damageAll', v: 6 }],
      },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_searing_brand', name: '烙印', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    tags: ['火焰', '诅咒'], art: '烙',
    text: '造成 4 点伤害，施加等同于你力量值的灼烧，并施加 2 层标记。',
    effects: [
      { op: 'damage', v: 4 },
      { op: 'debuff', s: 'burn', v: 'S', t: 'target' },
      { op: 'debuff', s: 'mark', v: 2, t: 'target' },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '造成 6 点伤害，施加等同于你力量值的灼烧，并施加 3 层标记。',
      effects: [
        { op: 'damage', v: 6 },
        { op: 'debuff', s: 'burn', v: 'S', t: 'target' },
        { op: 'debuff', s: 'mark', v: 3, t: 'target' },
      ],
    },
    unlock: { embers: 40 },
  },
  {
    id: 'c_f_boiler_burst', name: '锅炉爆裂', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
    tags: ['火焰', '血祭'], art: '蒸',
    text: '失去 3 点生命，造成等同于你力量值两倍的伤害。消耗。',
    effects: [{ op: 'loseHp', n: 3 }, { op: 'damage', v: '2S', raw:true }],
    exhaust: true, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '失去 2 点生命，造成等同于你力量值两倍的伤害，施加 3 层灼烧。消耗。',
      effects: [{ op: 'loseHp', n: 2 }, { op: 'damage', v: '2S', raw:true }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
    },
    unlock: { embers: 60 },
  },
  {
    id: 'c_f_furnace_lung', name: '熔炉之肺', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    tags: ['火焰', '重复'],
    text: '重复 2 次：造成 4 点伤害并施加 2 层灼烧。',
    effects: [{ op: 'repeat', n: 2, then: [{ op: 'damage', v: 4 }, { op: 'debuff', s: 'burn', v: 2, t: 'target' }] }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '重复 3 次：造成 4 点伤害并施加 2 层灼烧。',
      effects: [{ op: 'repeat', n: 3, then: [{ op: 'damage', v: 4 }, { op: 'debuff', s: 'burn', v: 2, t: 'target' }] }],
    },
    unlock: { embers: 60 },
  },
  {
    id: 'c_f_pyre_cleave', name: '火刑斩', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
    tags: ['火焰', '斩击'], art: '燄',
    text: '造成等同于你力量值两倍的伤害，施加 3 层灼烧。',
    effects: [{ op: 'damage', v: '2S', raw:true }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '造成等同于你力量值两倍的伤害，施加 3 层灼烧与 1 层易伤。',
      effects: [
        { op: 'damage', v: '2S', raw:true },
        { op: 'debuff', s: 'burn', v: 3, t: 'target' },
        { op: 'debuff', s: 'vulnerable', v: 1, t: 'target' },
      ],
    },
    unlock: { embers: 80 },
  },
  {
    id: 'c_f_backdraft', name: '回燃', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
    tags: ['火焰'],
    text: '若目标生命低于 40%，造成 20 点伤害并施加 4 层灼烧；否则造成 10 点伤害并施加 2 层灼烧。',
    effects: [
      {
        op: 'if',
        cond: { type: 'targetLow', p: 0.4 },
        then: [{ op: 'damage', v: 20 }, { op: 'debuff', s: 'burn', v: 4, t: 'target' }],
        else: [{ op: 'damage', v: 10 }, { op: 'debuff', s: 'burn', v: 2, t: 'target' }],
      },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '若目标生命低于 40%，造成 26 点伤害并施加 4 层灼烧；否则造成 13 点伤害并施加 3 层灼烧。',
      effects: [
        {
          op: 'if',
          cond: { type: 'targetLow', p: 0.4 },
          then: [{ op: 'damage', v: 26 }, { op: 'debuff', s: 'burn', v: 4, t: 'target' }],
          else: [{ op: 'damage', v: 13 }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
        },
      ],
    },
    unlock: { embers: 150 },
  },
  {
    id: 'c_f_overheat_vent', name: '排气阀爆裂', type: 'attack', rarity: 'rare', cost: 3, target: 'allEnemies',
    tags: ['火焰', '机械'],
    text: '获得 6 点格挡。对所有敌人造成等同于你当前格挡值的伤害，并施加 3 层灼烧。消耗。',
    effects: [
      { op: 'block', v: 6 },
      { op: 'damageAll', v: 'B', raw:true },
      { op: 'debuff', s: 'burn', v: 3, t: 'allEnemies' },
    ],
    exhaust: true, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '获得 8 点格挡。对所有敌人造成等同于你当前格挡值的伤害，并施加 4 层灼烧。消耗。',
      effects: [
        { op: 'block', v: 8 },
        { op: 'damageAll', v: 'B', raw:true },
        { op: 'debuff', s: 'burn', v: 4, t: 'allEnemies' },
      ],
    },
    unlock: { embers: 120 },
  },

  // ==================== 技能牌 8 ====================

  {
    id: 'c_f_smoke_veil', name: '硝烟壁', type: 'skill', rarity: 'common', cost: 1, target: 'self',
    tags: ['防御', '火焰'],
    text: '获得 6 点格挡，并对所有敌人施加 1 层虚弱。',
    effects: [{ op: 'block', v: 6 }, { op: 'debuff', s: 'weak', v: 1, t: 'allEnemies' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '获得 9 点格挡，并对所有敌人施加 2 层虚弱。',
      effects: [{ op: 'block', v: 9 }, { op: 'debuff', s: 'weak', v: 2, t: 'allEnemies' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_tar_sprayer', name: '焦油喷壶', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    tags: ['火焰', '毒'], art: '油',
    text: '对所有敌人施加 2 层中毒与 3 层灼烧。',
    effects: [{ op: 'debuff', s: 'poison', v: 2, t: 'allEnemies' }, { op: 'debuff', s: 'burn', v: 3, t: 'allEnemies' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '对所有敌人施加 3 层中毒与 5 层灼烧。',
      effects: [{ op: 'debuff', s: 'poison', v: 3, t: 'allEnemies' }, { op: 'debuff', s: 'burn', v: 5, t: 'allEnemies' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_coalsong', name: '灰烬摇篮曲', type: 'skill', rarity: 'common', cost: 1, target: 'self',
    tags: ['火焰', '防御'], art: '灰',
    text: '每 1 张手牌回复 2 点生命，获得 4 点格挡。',
    effects: [{ op: 'custom', fn: 'healPerHandCard', n: 2 }, { op: 'block', v: 4 }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '每 1 张手牌回复 3 点生命，获得 6 点格挡。',
      effects: [{ op: 'custom', fn: 'healPerHandCard', n: 3 }, { op: 'block', v: 6 }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_heat_shield', name: '隔热甲', type: 'skill', rarity: 'common', cost: 2, target: 'self',
    tags: ['防御', '机械'],
    text: '获得 8 点格挡，并获得 2 层金属化。',
    effects: [{ op: 'block', v: 8 }, { op: 'buff', s: 'metallicize', v: 2, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_cinder_shuffle', name: '灰烬翻洗', type: 'skill', rarity: 'common', cost: 1, target: 'self',
    tags: ['弃牌', '转化'],
    text: '将整个弃牌堆洗回抽牌堆，然后失去 1 点能量并抽 2 张牌。消耗。',
    effects: [{ op: 'custom', fn: 'shuffleDiscardToDeck' }, { op: 'custom', fn: 'loseEnergyThenDraw', n: 1 }],
    exhaust: true, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '将整个弃牌堆洗回抽牌堆，然后抽 2 张牌。消耗。',
      effects: [{ op: 'custom', fn: 'shuffleDiscardToDeck' }, { op: 'custom', fn: 'loseEnergyThenDraw', n: 0 }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_blood_boiler', name: '血沸', type: 'skill', rarity: 'common', cost: 1, target: 'self',
    tags: ['血祭', '火焰'], art: '血',
    text: '失去 4 点生命，获得 3 层力量。',
    effects: [{ op: 'loseHp', n: 4 }, { op: 'buff', s: 'strength', v: 3, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '失去 3 点生命，获得 4 层力量。',
      effects: [{ op: 'loseHp', n: 3 }, { op: 'buff', s: 'strength', v: 4, t: 'self' }],
    },
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_ash_bath', name: '灰浴', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['火焰'],
    text: '对所有敌人施加 2 层灼烧。若你有 6 层以上灼烧，对所有敌人造成 12 点伤害；若你的牌组中有 4 张以上【火焰】牌，再对所有敌人造成 8 点伤害。',
    effects: [
      { op: 'debuff', s: 'burn', v: 2, t: 'allEnemies' },
      { op: 'if', cond: { type: 'hasStatus', s: 'burn', gte: 6 }, then: [{ op: 'damageAll', v: 12 }], else: [] },
      { op: 'if', cond: { type: 'deckCount', card: '火焰', gte: 4 }, then: [{ op: 'damageAll', v: 8 }], else: [] },
    ],
    exhaust: false, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '对所有敌人施加 3 层灼烧。若你有 8 层以上灼烧，对所有敌人造成 18 点伤害；若你的牌组中有 3 张以上【火焰】牌，再对所有敌人造成 12 点伤害。',
      effects: [
        { op: 'debuff', s: 'burn', v: 3, t: 'allEnemies' },
        { op: 'if', cond: { type: 'hasStatus', s: 'burn', gte: 8 }, then: [{ op: 'damageAll', v: 18 }], else: [] },
        { op: 'if', cond: { type: 'deckCount', card: '火焰', gte: 3 }, then: [{ op: 'damageAll', v: 12 }], else: [] },
      ],
    },
    unlock: { embers: 80 },
  },
  {
    id: 'c_f_conflagration', name: '燎原', type: 'skill', rarity: 'rare', cost: 2, target: 'none',
    tags: ['火焰', '转化'],
    text: '手牌中每有一张牌，对随机敌人造成 2 点伤害。对所有敌人施加 4 层灼烧。若你的手牌不多于 2 张，对所有敌人造成 10 点伤害。消耗。',
    effects: [
      { op: 'custom', fn: 'burnPerCardInHand' },
      { op: 'debuff', s: 'burn', v: 4, t: 'allEnemies' },
      { op: 'if', cond: { type: 'handSize', n: 2 }, then: [{ op: 'damageAll', v: 10 }], else: [] },
    ],
    exhaust: true, ethereal: false, innate: false, retain: false,
    upgrade: {
      text: '手牌中每有一张牌，对随机敌人造成 2 点伤害。对所有敌人施加 6 层灼烧。若你的手牌不多于 2 张，对所有敌人造成 16 点伤害。消耗。',
      effects: [
        { op: 'custom', fn: 'burnPerCardInHand' },
        { op: 'debuff', s: 'burn', v: 6, t: 'allEnemies' },
        { op: 'if', cond: { type: 'handSize', n: 2 }, then: [{ op: 'damageAll', v: 16 }], else: [] },
      ],
    },
    unlock: { embers: 180 },
  },

  // ==================== 力量牌 5 ====================

  {
    id: 'c_f_ember_lung', name: '燃肺', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
    tags: ['火焰', '血祭'],
    text: '永久：获得 2 层力量与 1 层荆棘。',
    effects: [{ op: 'buff', s: 'strength', v: 2, t: 'self' }, { op: 'buff', s: 'thorns', v: 1, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_slag_engine', name: '渣滓引擎', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
    tags: ['机械', '火焰'],
    text: '永久：每打出一张攻击牌，对随机敌人造成 1 点伤害。',
    effects: [{ op: 'buff', s: 'fury', v: 2, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 0 },
  },
  {
    id: 'c_f_ashen_forge', name: '灰烬熔炉', type: 'power', rarity: 'uncommon', cost: 2, target: 'self',
    tags: ['防御', '机械'],
    text: '永久：每回合结束时获得 3 点格挡。',
    effects: [{ op: 'buff', s: 'metallicize', v: 3, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 120 },
  },
  {
    id: 'c_f_pyre_pact', name: '炎盟', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
    tags: ['血祭', '火焰'],
    text: '永久：每回合开始时额外抽 1 张牌；每打出一张攻击牌，恢复 1 点生命。',
    effects: [{ op: 'buff', s: 'haste', v: 1, t: 'self' }, { op: 'buff', s: 'leech', v: 1, t: 'self' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 150 },
  },
  {
    id: 'c_f_soul_furnace', name: '魂炉', type: 'power', rarity: 'rare', cost: -1, target: 'self',
    tags: ['秘术', '机械'],
    text: '消耗你本回合的全部能量。永久：立刻获得一件随机遗物。',
    effects: [{ op: 'custom', fn: 'grantRandomRelic' }],
    exhaust: false, ethereal: false, innate: false, retain: false,
    unlock: { embers: 300 },
  },

];
