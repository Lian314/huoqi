// ============ 秘术 / 血祭 / 诅咒 / 特殊牌（32 张） ============
// 纯数据：无 import、无函数、无逻辑，全部字面量。
// 依赖：docs/DATA_SPEC.md 的 op / cond / custom 白名单，状态 id 见 statuses.js。
// 唯一牌 id 前缀：c_a_ （常规秘术） 与 c_curse_ （诅咒）。
// events.js 会把 5 张固定诅咒加入牌组，id 不得改动。

export const CARDS_ARCANE = [
  // ---------- 诅咒（8） ----------
  {
    id: 'c_curse_rusty_oath', name: '锈誓', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    text: '无法打出。', effects: [],
  },
  {
    id: 'c_curse_mirror_mark', name: '镜痕', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    text: '无法打出。', effects: [],
  },
  {
    id: 'c_curse_kiln_fever', name: '窑热', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    text: '无法打出。', effects: [],
  },
  {
    id: 'c_curse_choir_echo', name: '合唱回声', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    text: '无法打出。', effects: [],
  },
  {
    id: 'c_curse_insomnia', name: '不眠', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    text: '无法打出。', effects: [],
  },
  {
    id: 'c_curse_hollow_anchor', name: '空锚', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: false,
    tags: ['诅咒', '防御'],
    art: '锚',
    text: '无法打出。进入牌组时：获得 2 层【空壳】。',
    effects: [{ op: 'debuff', s: 'hollow', v: 2, t: 'self' }],
  },
  {
    id: 'c_curse_blood_tally', name: '血账', type: 'curse', rarity: 'curse', cost: 0, target: 'none', playable: true,
    tags: ['诅咒', '血祭'],
    text: '消耗自身。失去 6 点生命。对所有敌人造成 2 次 12 点伤害，并获得 2 层【力量】。',
    effects: [
      { op: 'exhaustSelf' },
      { op: 'loseHp', n: 6 },
      { op: 'repeat', n: 2, then: [{ op: 'damageAll', v: 12 }] },
      { op: 'buff', s: 'strength', v: 2, t: 'self' },
    ],
  },
  {
    id: 'c_curse_tally_hook', name: '记帐钩', type: 'curse', rarity: 'curse', cost: 1, target: 'none', playable: true,
    tags: ['诅咒', '血祭', '转化'],
    text: '消耗自身。失去 8 点生命，最大生命 +12，升级牌组中 2 张牌。',
    effects: [
      { op: 'exhaustSelf' },
      { op: 'loseHp', n: 8 },
      { op: 'maxHp', n: 12 },
      { op: 'upgradeCard', n: 2 },
    ],
  },

  // ---------- 力量（12） ----------
  {
    id: 'c_a_molten_debt', name: '熔债', type: 'power', rarity: 'rare', cost: -1, target: 'none',
    tags: ['秘术', '机械'], art: '🜲',
    text: 'X 费。获得等同于你当前格挡层数的【力量】。',
    effects: [{ op: 'buff', s: 'strength', v: 'B', t: 'self' }],
    upgrade: {
      text: 'X 费。获得等同于你当前格挡层数的【力量】，并获得 2 层【荆棘】。',
      effects: [
        { op: 'buff', s: 'strength', v: 'B', t: 'self' },
        { op: 'buff', s: 'thorns', v: 2, t: 'self' },
      ],
    },
    unlock: { embers: 8 },
  },
  {
    id: 'c_a_iron_choir', name: '铁喉合唱', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    tags: ['秘术'], art: '🜛',
    text: '若你已有不少于 2 层【仪式】，获得 2 层【仪式】与 3 层【力量】；否则获得 2 层【仪式】与 1 层【力量】。',
    effects: [{
      op: 'if',
      cond: { type: 'hasStatus', s: 'ritual', gte: 2 },
      then: [{ op: 'buff', s: 'ritual', v: 2, t: 'self' }, { op: 'buff', s: 'strength', v: 3, t: 'self' }],
      else: [{ op: 'buff', s: 'ritual', v: 2, t: 'self' }, { op: 'buff', s: 'strength', v: 1, t: 'self' }],
    }],
    upgrade: {
      cost: 1,
      text: '若你已有不少于 2 层【仪式】，获得 2 层【仪式】与 4 层【力量】；否则获得 2 层【仪式】与 2 层【力量】。',
      effects: [{
        op: 'if',
        cond: { type: 'hasStatus', s: 'ritual', gte: 2 },
        then: [{ op: 'buff', s: 'ritual', v: 2, t: 'self' }, { op: 'buff', s: 'strength', v: 4, t: 'self' }],
        else: [{ op: 'buff', s: 'ritual', v: 2, t: 'self' }, { op: 'buff', s: 'strength', v: 2, t: 'self' }],
      }],
    },
    unlock: { embers: 9 },
  },
  {
    id: 'c_a_blood_prayer', name: '血债祷文', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    tags: ['血祭', '诅咒'],
    text: '最大生命 -6。回复等同于你当前【力量】层数的生命。获得 3 层【仪式】；若你的生命高于最大生命的 60%，额外获得 1 层【汲取】。',
    effects: [
      { op: 'maxHp', n: -6 },
      { op: 'heal', n: 'S' },
      { op: 'buff', s: 'ritual', v: 3, t: 'self' },
      { op: 'if', cond: { type: 'hpAbove', p: 0.6 }, then: [{ op: 'buff', s: 'leech', v: 1, t: 'self' }], else: [] },
    ],
    upgrade: {
      cost: 0,
      text: '最大生命 -4。回复等同于你当前【力量】层数的生命。获得 4 层【仪式】；若你的生命高于最大生命的 60%，额外获得 1 层【汲取】。',
      effects: [
        { op: 'maxHp', n: -4 },
        { op: 'heal', n: 'S' },
        { op: 'buff', s: 'ritual', v: 4, t: 'self' },
        { op: 'if', cond: { type: 'hpAbove', p: 0.6 }, then: [{ op: 'buff', s: 'leech', v: 1, t: 'self' }], else: [] },
      ],
    },
    unlock: { embers: 7 },
  },
  {
    id: 'c_a_fuse_spine', name: '引信脊', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['机械', '能量'],
    text: '若你的剩余能量不超过 0，获得 3 层【静电】与 1 层【超载】；否则获得 2 层【静电】。',
    effects: [{
      op: 'if',
      cond: { type: 'energy', n: 0 },
      then: [{ op: 'buff', s: 'static', v: 3, t: 'self' }, { op: 'buff', s: 'overload', v: 1, t: 'self' }],
      else: [{ op: 'buff', s: 'static', v: 2, t: 'self' }],
    }],
    upgrade: {
      cost: 0,
      text: '若你的剩余能量不超过 0，获得 4 层【静电】与 1 层【超载】；否则获得 3 层【静电】。',
      effects: [{
        op: 'if',
        cond: { type: 'energy', n: 0 },
        then: [{ op: 'buff', s: 'static', v: 4, t: 'self' }, { op: 'buff', s: 'overload', v: 1, t: 'self' }],
        else: [{ op: 'buff', s: 'static', v: 3, t: 'self' }],
      }],
    },
  },
  {
    id: 'c_a_resolve_iron', name: '铁骨誓', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['防御', '血祭'], art: '🜨',
    text: '若你的生命低于最大生命的 35%，获得 2 层【坚毅】与 1 层【神器】；否则获得 1 层【坚毅】与 2 层【荆棘】。',
    effects: [{
      op: 'if',
      cond: { type: 'hpBelow', p: 0.35 },
      then: [{ op: 'buff', s: 'resolve', v: 2, t: 'self' }, { op: 'buff', s: 'artifact', v: 1, t: 'self' }],
      else: [{ op: 'buff', s: 'resolve', v: 1, t: 'self' }, { op: 'buff', s: 'thorns', v: 2, t: 'self' }],
    }],
    upgrade: {
      cost: 0,
      text: '若你的生命低于最大生命的 35%，获得 3 层【坚毅】与 2 层【神器】；否则获得 2 层【坚毅】与 3 层【荆棘】。',
      effects: [{
        op: 'if',
        cond: { type: 'hpBelow', p: 0.35 },
        then: [{ op: 'buff', s: 'resolve', v: 3, t: 'self' }, { op: 'buff', s: 'artifact', v: 2, t: 'self' }],
        else: [{ op: 'buff', s: 'resolve', v: 2, t: 'self' }, { op: 'buff', s: 'thorns', v: 3, t: 'self' }],
      }],
    },
  },
  {
    id: 'c_a_hollow_crown', name: '空冠', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    tags: ['诅咒', '秘术'], art: '👑',
    text: '获得 2 层【虚化】、1 层【回响】与 2 层【力量】。',
    effects: [
      { op: 'buff', s: 'intangible', v: 2, t: 'self' },
      { op: 'buff', s: 'echo', v: 1, t: 'self' },
      { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] },
    ],
    upgrade: {
      cost: 2,
      text: '获得 3 层【虚化】、1 层【回响】与 2 层【力量】。',
      effects: [
        { op: 'buff', s: 'intangible', v: 3, t: 'self' },
        { op: 'buff', s: 'echo', v: 1, t: 'self' },
        { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] },
      ],
    },
    unlock: { embers: 10 },
  },
  {
    id: 'c_a_ledger_of_grief', name: '哀账', type: 'power', rarity: 'uncommon', cost: 0, target: 'none',
    tags: ['诅咒', '转化'],
    text: '若你的生命低于最大生命的 40%，获得 2 层【坚毅】与 2 层【仪式】；否则获得 3 层【仪式】。',
    effects: [{
      op: 'if',
      cond: { type: 'hpBelow', p: 0.4 },
      then: [{ op: 'buff', s: 'resolve', v: 2, t: 'self' }, { op: 'buff', s: 'ritual', v: 2, t: 'self' }],
      else: [{ op: 'buff', s: 'ritual', v: 3, t: 'self' }],
    }],
    upgrade: {
      text: '若你的生命低于最大生命的 40%，获得 3 层【坚毅】与 2 层【仪式】；否则获得 4 层【仪式】。',
      effects: [{
        op: 'if',
        cond: { type: 'hpBelow', p: 0.4 },
        then: [{ op: 'buff', s: 'resolve', v: 3, t: 'self' }, { op: 'buff', s: 'ritual', v: 2, t: 'self' }],
        else: [{ op: 'buff', s: 'ritual', v: 4, t: 'self' }],
      }],
    },
  },
  {
    id: 'c_a_salt_cult', name: '盐社', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['血祭', '秘术'],
    text: '若你没有【神器】，最大生命 -4 并获得 1 层【神器】；否则获得 3 层【荆棘】。',
    effects: [{
      op: 'if',
      cond: { type: 'noStatus', s: 'artifact' },
      then: [{ op: 'maxHp', n: -4 }, { op: 'buff', s: 'artifact', v: 1, t: 'self' }],
      else: [{ op: 'buff', s: 'thorns', v: 3, t: 'self' }],
    }],
    upgrade: {
      cost: 0,
      text: '若你没有【神器】，最大生命 -2 并获得 2 层【神器】；否则获得 4 层【荆棘】。',
      effects: [{
        op: 'if',
        cond: { type: 'noStatus', s: 'artifact' },
        then: [{ op: 'maxHp', n: -2 }, { op: 'buff', s: 'artifact', v: 2, t: 'self' }],
        else: [{ op: 'buff', s: 'thorns', v: 4, t: 'self' }],
      }],
    },
  },
  {
    id: 'c_a_scrap_crown', name: '废铁冠', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    tags: ['机械', '防御'],
    text: '获得 2 层【金属化】。若你持有【空心提灯】，额外获得 2 层【碎裂】；否则获得 1 层【碎裂】与 1 层【迅捷】。',
    effects: [
      { op: 'buff', s: 'metallicize', v: 2, t: 'self' },
      {
        op: 'if',
        cond: { type: 'hasRelic', r: 'relic_hollow_lantern' },
        then: [{ op: 'buff', s: 'splinter', v: 2, t: 'self' }],
        else: [{ op: 'buff', s: 'splinter', v: 1, t: 'self' }, { op: 'buff', s: 'haste', v: 1, t: 'self' }],
      },
    ],
    upgrade: {
      cost: 1,
      text: '获得 3 层【金属化】。若你持有【空心提灯】，额外获得 3 层【碎裂】；否则获得 2 层【碎裂】与 1 层【迅捷】。',
      effects: [
        { op: 'buff', s: 'metallicize', v: 3, t: 'self' },
        {
          op: 'if',
          cond: { type: 'hasRelic', r: 'relic_hollow_lantern' },
          then: [{ op: 'buff', s: 'splinter', v: 3, t: 'self' }],
          else: [{ op: 'buff', s: 'splinter', v: 2, t: 'self' }, { op: 'buff', s: 'haste', v: 1, t: 'self' }],
        },
      ],
    },
  },
  {
    id: 'c_a_final_anchor', name: '最终之锚', type: 'power', rarity: 'special', cost: 2, target: 'none',
    tags: ['机械', '防御'], art: '⚓',
    text: '获得 1 层【壁垒】、3 层【金属化】、2 层【坚毅】与 2 层【力量】。',
    effects: [
      { op: 'buff', s: 'barricade', v: 1, t: 'self' },
      { op: 'buff', s: 'metallicize', v: 3, t: 'self' },
      { op: 'buff', s: 'resolve', v: 2, t: 'self' },
      { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] },
    ],
    unlock: { embers: 12 },
  },
  {
    id: 'c_a_cinder_tongue', name: '烬舌', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['火焰', '诅咒'],
    text: '若本回合已打出至少 2 张攻击牌，获得 3 层【暴怒】与 1 层【力量】；否则获得 2 层【暴怒】。',
    effects: [{
      op: 'if',
      cond: { type: 'typePlayed', t: 'attack', n: 2 },
      then: [{ op: 'buff', s: 'fury', v: 3, t: 'self' }, { op: 'buff', s: 'strength', v: 1, t: 'self' }],
      else: [{ op: 'buff', s: 'fury', v: 2, t: 'self' }],
    }],
    upgrade: {
      cost: 0,
      text: '若本回合已打出至少 2 张攻击牌，获得 4 层【暴怒】与 2 层【力量】；否则获得 3 层【暴怒】。',
      effects: [{
        op: 'if',
        cond: { type: 'typePlayed', t: 'attack', n: 2 },
        then: [{ op: 'buff', s: 'fury', v: 4, t: 'self' }, { op: 'buff', s: 'strength', v: 2, t: 'self' }],
        else: [{ op: 'buff', s: 'fury', v: 3, t: 'self' }],
      }],
    },
  },
  {
    id: 'c_a_seventh_salt', name: '第七把盐', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    tags: ['转化', '火焰'], art: '🧂',
    text: '将你牌组中 50% 的攻击牌重铸为【灼热挥砍】。预知等同于你牌组张数的牌，并获得 2 层【力量】。',
    effects: [
      { op: 'custom', fn: 'convertDeckToBurn', p: 0.5 },
      { op: 'scry', n: 'deck' },
      { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] },
    ],
    upgrade: {
      cost: 1,
      text: '将你牌组中 75% 的攻击牌重铸为【灼热挥砍】。预知等同于你牌组张数的牌，并获得 3 层【力量】。',
      effects: [
        { op: 'custom', fn: 'convertDeckToBurn', p: 0.75 },
        { op: 'scry', n: 'deck' },
        { op: 'repeat', n: 3, then: [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] },
      ],
    },
    unlock: { embers: 11 },
  },

  // ---------- 技能（8） ----------
  {
    id: 'c_a_ash_rain', name: '灰雨', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['秘术', '火焰'], art: '🌧',
    text: '手牌中每有一张牌，对随机敌人造成 2 点伤害。将 1 张【灼热挥砍】洗入抽牌堆。',
    effects: [
      { op: 'custom', fn: 'burnPerCardInHand' },
      { op: 'shuffleIn', card: 'c_ember_slash', n: 1 },
    ],
    upgrade: {
      text: '手牌中每有一张牌，对随机敌人造成 2 点伤害。将 2 张【灼热挥砍】洗入抽牌堆。',
      effects: [
        { op: 'custom', fn: 'burnPerCardInHand' },
        { op: 'shuffleIn', card: 'c_ember_slash', n: 2 },
      ],
    },
    unlock: { embers: 6 },
  },
  {
    id: 'c_a_salt_prayer', name: '盐祷', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['秘术', '能量'],
    text: '若当前是第 1 回合或更早，获得 2 点能量并预知 3 张；否则获得 1 点能量并预知 2 张。',
    effects: [{
      op: 'if',
      cond: { type: 'turn', n: 1 },
      then: [{ op: 'energy', n: 2 }, { op: 'scry', n: 3 }],
      else: [{ op: 'energy', n: 1 }, { op: 'scry', n: 2 }],
    }],
    upgrade: {
      text: '若当前是第 1 回合或更早，获得 2 点能量并预知 5 张；否则获得 2 点能量并预知 2 张。',
      effects: [{
        op: 'if',
        cond: { type: 'turn', n: 1 },
        then: [{ op: 'energy', n: 2 }, { op: 'scry', n: 5 }],
        else: [{ op: 'energy', n: 2 }, { op: 'scry', n: 2 }],
      }],
    },
    unlock: { embers: 4 },
  },
  {
    id: 'c_a_lost_ledger', name: '失账', type: 'skill', rarity: 'rare', cost: 2, target: 'none',
    tags: ['转化', '弃牌'], art: '📕',
    text: '将弃牌堆洗回抽牌堆。若你牌组中【火焰】牌不少于 3 张，抽等同于当前手牌数的牌并升级牌组中 1 张牌；否则抽 3 张牌。',
    effects: [
      { op: 'custom', fn: 'shuffleDiscardToDeck' },
      {
        op: 'if',
        cond: { type: 'deckCount', card: '火焰', gte: 3 },
        then: [{ op: 'draw', n: 'hand' }, { op: 'upgradeCard', n: 1 }],
        else: [{ op: 'draw', n: 3 }],
      },
    ],
    upgrade: {
      cost: 1,
      text: '将弃牌堆洗回抽牌堆。若你牌组中【火焰】牌不少于 3 张，抽等同于当前手牌数的牌并升级牌组中 2 张牌；否则抽 4 张牌。',
      effects: [
        { op: 'custom', fn: 'shuffleDiscardToDeck' },
        {
          op: 'if',
          cond: { type: 'deckCount', card: '火焰', gte: 3 },
          then: [{ op: 'draw', n: 'hand' }, { op: 'upgradeCard', n: 2 }],
          else: [{ op: 'draw', n: 4 }],
        },
      ],
    },
    unlock: { embers: 9 },
  },
  {
    id: 'c_a_glass_breath', name: '玻璃吐息', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['迅捷', '秘术'],
    text: '若你的手牌数不超过 2，抽 3 张牌并获得 1 点能量；否则抽 2 张牌。',
    effects: [{
      op: 'if',
      cond: { type: 'handSize', n: 2 },
      then: [{ op: 'draw', n: 3 }, { op: 'energy', n: 1 }],
      else: [{ op: 'draw', n: 2 }],
    }],
    upgrade: {
      cost: 0,
      text: '若你的手牌数不超过 2，抽 4 张牌并获得 1 点能量；否则抽 3 张牌。',
      effects: [{
        op: 'if',
        cond: { type: 'handSize', n: 2 },
        then: [{ op: 'draw', n: 4 }, { op: 'energy', n: 1 }],
        else: [{ op: 'draw', n: 3 }],
      }],
    },
    unlock: { embers: 5 },
  },
  {
    id: 'c_a_bone_ledger', name: '骨账', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    tags: ['血祭', '防御'], art: '🦴',
    text: '消耗自身。失去 5 点生命，最大生命 +8，每 1 张手牌回复 2 点生命，获得 4 层【再生】与 2 层【力量】。',
    effects: [
      { op: 'loseHp', n: 5 },
      { op: 'maxHp', n: 8 },
      { op: 'custom', fn: 'healPerHandCard', n: 2 },
      { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'regen', v: 2, t: 'self' }] },
      { op: 'buff', s: 'strength', v: 2, t: 'self' },
      { op: 'exhaustSelf' },
    ],
    upgrade: {
      cost: 0,
      text: '消耗自身。失去 4 点生命，最大生命 +10，每 1 张手牌回复 3 点生命，获得 4 层【再生】与 3 层【力量】。',
      effects: [
        { op: 'loseHp', n: 4 },
        { op: 'maxHp', n: 10 },
        { op: 'custom', fn: 'healPerHandCard', n: 3 },
        { op: 'repeat', n: 2, then: [{ op: 'buff', s: 'regen', v: 2, t: 'self' }] },
        { op: 'buff', s: 'strength', v: 3, t: 'self' },
        { op: 'exhaustSelf' },
      ],
    },
    unlock: { embers: 7 },
  },
  {
    id: 'c_a_sixth_breath', name: '第六口气', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    tags: ['能量', '迅捷'],
    text: '失去 1 点能量后抽 2 张牌。若本回合已经打出过牌，额外获得 1 点能量。',
    effects: [
      { op: 'custom', fn: 'loseEnergyThenDraw', n: 1 },
      { op: 'if', cond: { type: 'lastCardPlayed' }, then: [{ op: 'energy', n: 1 }], else: [] },
    ],
    upgrade: {
      text: '抽 2 张牌。若本回合已经打出过牌，额外获得 2 点能量。',
      effects: [
        { op: 'custom', fn: 'loseEnergyThenDraw', n: 0 },
        { op: 'if', cond: { type: 'lastCardPlayed' }, then: [{ op: 'energy', n: 2 }], else: [] },
      ],
    },
    unlock: { embers: 6 },
  },
  {
    id: 'c_a_reliquary', name: '圣物匣', type: 'skill', rarity: 'special', cost: 2, target: 'none',
    tags: ['机械', '秘术'], art: '🧰',
    text: '立刻获得一件随机遗物。将 1 张【灼热挥砍】永久加入牌组，将 1 张基础防御牌置入手牌，抽 2 张牌，并使下一张攻击牌伤害翻倍。',
    effects: [
      { op: 'custom', fn: 'grantRandomRelic' },
      { op: 'addDeck', card: 'c_ember_slash' },
      { op: 'addHand', card: 'c_guard', n: 1 },
      { op: 'draw', n: 2 },
      { op: 'custom', fn: 'doubleNextAttack' },
    ],
    unlock: { embers: 11 },
  },
  {
    id: 'c_a_waste_ledger', name: '废账', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    tags: ['转化', '弃牌'],
    text: '洗乱抽牌堆。预知等同于弃牌堆张数的牌。若弃牌堆不超过 2 张，将弃牌堆洗回并抽 2 张牌；否则永久移除牌组中 1 张牌，抽 1 张牌并获得 1 点能量。',
    effects: [
      { op: 'custom', fn: 'shuffleDrawPile' },
      { op: 'scry', n: 'discard' },
      {
        op: 'if',
        cond: { type: 'discardSize', n: 2 },
        then: [{ op: 'custom', fn: 'shuffleDiscardToDeck' }, { op: 'draw', n: 2 }],
        else: [{ op: 'removeCard' }, { op: 'draw', n: 1 }, { op: 'energy', n: 1 }],
      },
    ],
    upgrade: {
      text: '洗乱抽牌堆。预知等同于弃牌堆张数的牌。若弃牌堆不超过 2 张，将弃牌堆洗回并抽 3 张牌；否则永久移除牌组中 1 张牌，抽 2 张牌并获得 1 点能量。',
      effects: [
        { op: 'custom', fn: 'shuffleDrawPile' },
        { op: 'scry', n: 'discard' },
        {
          op: 'if',
          cond: { type: 'discardSize', n: 2 },
          then: [{ op: 'custom', fn: 'shuffleDiscardToDeck' }, { op: 'draw', n: 3 }],
          else: [{ op: 'removeCard' }, { op: 'draw', n: 2 }, { op: 'energy', n: 1 }],
        },
      ],
    },
    unlock: { embers: 4 },
  },

  // ---------- 攻击（4） ----------
  {
    id: 'c_a_sear_brand', name: '烙印', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    tags: ['火焰', '诅咒'], art: '🔥',
    text: '若这是本回合的第一张牌，造成 9 点伤害并施加 3 层【灼烧】；否则造成 6 点伤害并施加 2 层【灼烧】。将 1 张【灼热挥砍】置入弃牌堆。',
    effects: [
      {
        op: 'if',
        cond: { type: 'firstCardOfTurn' },
        then: [{ op: 'damage', v: 9, t: 'target' }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
        else: [{ op: 'damage', v: 6, t: 'target' }, { op: 'debuff', s: 'burn', v: 2, t: 'target' }],
      },
      { op: 'addDiscard', card: 'c_ember_slash', n: 1 },
    ],
    upgrade: {
      cost: 0,
      text: '若这是本回合的第一张牌，造成 12 点伤害并施加 4 层【灼烧】；否则造成 8 点伤害并施加 3 层【灼烧】。将 1 张【灼热挥砍】置入弃牌堆。',
      effects: [
        {
          op: 'if',
          cond: { type: 'firstCardOfTurn' },
          then: [{ op: 'damage', v: 12, t: 'target' }, { op: 'debuff', s: 'burn', v: 4, t: 'target' }],
          else: [{ op: 'damage', v: 8, t: 'target' }, { op: 'debuff', s: 'burn', v: 3, t: 'target' }],
        },
        { op: 'addDiscard', card: 'c_ember_slash', n: 1 },
      ],
    },
    unlock: { embers: 5 },
  },
  {
    id: 'c_a_thousand_cuts', name: '千割', type: 'attack', rarity: 'rare', cost: 1, target: 'enemy',
    tags: ['斩击', '迅捷'], art: '🗡',
    text: '对目标造成 3 次 5 点伤害。若你已有不少于 3 层【力量】，再造成等同于你【力量】层数的伤害。',
    effects: [
      { op: 'repeat', n: 3, then: [{ op: 'damage', v: 5, t: 'target' }] },
      {
        op: 'if',
        cond: { type: 'hasStatus', s: 'strength', gte: 3 },
        then: [{ op: 'damage', v: 'S', raw:true, t: 'target' }],
        else: [],
      },
    ],
    upgrade: {
      text: '对目标造成 4 次 5 点伤害。若你已有不少于 3 层【力量】，再造成等同于你【力量】2 倍的伤害。',
      effects: [
        { op: 'repeat', n: 4, then: [{ op: 'damage', v: 5, t: 'target' }] },
        {
          op: 'if',
          cond: { type: 'hasStatus', s: 'strength', gte: 3 },
          then: [{ op: 'damage', v: '2S', raw:true, t: 'target' }],
          else: [],
        },
      ],
    },
    unlock: { embers: 6 },
  },
  {
    id: 'c_a_glass_crescent', name: '玻璃新月', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    tags: ['斩击', '秘术'],
    text: '对所有敌人造成 9 点伤害。若目标生命低于 40%，再对其造成 14 点伤害；此外每有一张手牌，再对目标造成 2 点伤害。',
    effects: [
      { op: 'damageAll', v: 9 },
      {
        op: 'if',
        cond: { type: 'targetLow', p: 0.4 },
        then: [{ op: 'damage', v: 14, t: 'target' }],
        else: [],
      },
      { op: 'repeat', n: 'hand', then: [{ op: 'damage', v: 2, t: 'target' }] },
    ],
    upgrade: {
      cost: 0,
      text: '对所有敌人造成 12 点伤害。若目标生命低于 40%，再对其造成 20 点伤害；此外每有一张手牌，再对目标造成 2 点伤害。',
      effects: [
        { op: 'damageAll', v: 12 },
        {
          op: 'if',
          cond: { type: 'targetLow', p: 0.4 },
          then: [{ op: 'damage', v: 20, t: 'target' }],
          else: [],
        },
        { op: 'repeat', n: 'hand', then: [{ op: 'damage', v: 2, t: 'target' }] },
      ],
    },
    unlock: { embers: 4 },
  },
  {
    id: 'c_a_verdict', name: '断罪', type: 'attack', rarity: 'special', cost: 3, target: 'enemy',
    tags: ['血祭'], art: '⚖',
    text: '消耗自身。失去 10 点生命。对目标造成 40 点伤害；若存活的敌人不超过 1 个，再对目标造成等同于你【力量】2 倍的伤害。施加 2 层【易伤】。',
    effects: [
      { op: 'loseHp', n: 10 },
      { op: 'damage', v: 40, t: 'target' },
      {
        op: 'if',
        cond: { type: 'enemyCount', n: 1 },
        then: [{ op: 'damage', v: '2S', raw:true, t: 'target' }],
        else: [],
      },
      { op: 'debuff', s: 'vulnerable', v: 2, t: 'target' },
      { op: 'exhaustSelf' },
    ],
    upgrade: {
      cost: 2,
      text: '消耗自身。失去 8 点生命。对目标造成 50 点伤害；若存活的敌人不超过 1 个，再对目标造成等同于你【力量】2 倍的伤害。施加 2 层【易伤】。',
      effects: [
        { op: 'loseHp', n: 8 },
        { op: 'damage', v: 50, t: 'target' },
        {
          op: 'if',
          cond: { type: 'enemyCount', n: 1 },
          then: [{ op: 'damage', v: '2S', raw:true, t: 'target' }],
          else: [],
        },
        { op: 'debuff', s: 'vulnerable', v: 2, t: 'target' },
        { op: 'exhaustSelf' },
      ],
    },
    unlock: { embers: 12 },
  },
];
