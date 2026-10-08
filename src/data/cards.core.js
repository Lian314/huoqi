// ============ 基础卡池 CARDS_CORE ============
// 纯数据：不 import、不含任何函数与逻辑，全部字面量。
// 规模：30 张 = 4 攻击 / 1 技能（固定 5 张，其他数据文件依赖其 id）+ 14 攻击 / 11 技能。
// 分布：common 23、uncommon 6、rare 1；其中 6 张（约 20%）无 upgrade。
// 字段契约见 docs/DATA_SPEC.md，状态 key 见 src/data/statuses.js。

export const CARDS_CORE = [
  // ============================================================
  // 固定 5 张 —— events.js / potions.js / relics.js / enemies.js 引用其 id
  // ============================================================
  { id:'c_strike', name:'挥击', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['打击'],
    portrait:'/assets/cards/c_strike.jpg',
    text:'造成 6 点伤害。', effects:[{op:'damage', v:6}],
    upgrade:{ text:'造成 9 点伤害。', effects:[{op:'damage', v:9}] } },

  { id:'c_bash', name:'重击', type:'attack', rarity:'common', cost:2, target:'enemy', tags:['打击'],
    portrait:'/assets/cards/c_bash.jpg',
    text:'造成 8 点伤害。施加 2 层易伤。', effects:[{op:'damage', v:8},{op:'debuff', s:'vulnerable', v:2, t:'target'}],
    upgrade:{ cost:1, text:'造成 11 点伤害。施加 2 层易伤。', effects:[{op:'damage', v:11},{op:'debuff', s:'vulnerable', v:2, t:'target'}] } },

  { id:'c_guard', name:'格挡', type:'skill', rarity:'common', cost:1, target:'self', tags:['防御'],
    portrait:'/assets/cards/c_guard.jpg',
    text:'获得 5 点格挡。', effects:[{op:'block', v:5}],
    upgrade:{ cost:0, text:'获得 8 点格挡。', effects:[{op:'block', v:8}] } },

  { id:'c_ember_slash', name:'灼热挥砍', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['火焰','斩击'],
    text:'造成 7 点伤害。施加 2 层灼烧。', effects:[{op:'damage', v:7},{op:'debuff', s:'burn', v:2, t:'target'}],
    upgrade:{ cost:0, text:'造成 10 点伤害。施加 3 层灼烧。', effects:[{op:'damage', v:10},{op:'debuff', s:'burn', v:3, t:'target'}] } },

  { id:'c_burn_wave', name:'燃焰浪', type:'attack', rarity:'uncommon', cost:2, target:'allEnemies', tags:['火焰'],
    text:'对所有敌人造成 8 点伤害并施加 2 层灼烧。', effects:[{op:'damageAll', v:8},{op:'debuff', s:'burn', v:2, t:'allEnemies'}],
    upgrade:{ cost:1, text:'对所有敌人造成 11 点伤害并施加 3 层灼烧。', effects:[{op:'damageAll', v:11},{op:'debuff', s:'burn', v:3, t:'allEnemies'}] } },

  // ============================================================
  // 攻击 —— 基础机制池（11 张 common）
  // ============================================================

  { id:'c_piston_kick', name:'活塞突踢', art:'🦿', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['机械','打击','重复'],
    text:'造成 5 点伤害。随后连续造成 2 次 3 点伤害。',
    effects:[{op:'damage', v:5},{op:'repeat', n:2, then:[{op:'damage', v:3, t:'target'}]}],
    upgrade:{ text:'造成 7 点伤害。随后连续造成 2 次 4 点伤害。',
      effects:[{op:'damage', v:7},{op:'repeat', n:2, then:[{op:'damage', v:4, t:'target'}]}] } },

  { id:'c_cold_iron', name:'冷铁凿击', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['冰霜','打击'],
    text:'造成 6 点伤害。施加 2 层虚弱与 1 层易伤。',
    effects:[{op:'damage', v:6},{op:'debuff', s:'weak', v:2, t:'target'},{op:'debuff', s:'vulnerable', v:1, t:'target'}],
    upgrade:{ text:'造成 9 点伤害。施加 2 层虚弱与 2 层易伤。',
      effects:[{op:'damage', v:9},{op:'debuff', s:'weak', v:2, t:'target'},{op:'debuff', s:'vulnerable', v:2, t:'target'}] } },

  { id:'c_slag_flick', name:'熔渣弹指', type:'attack', rarity:'common', cost:0, target:'enemy', tags:['火焰','迅捷'],
    text:'造成 5 点伤害。施加 1 层灼烧。',
    effects:[{op:'damage', v:5},{op:'debuff', s:'burn', v:1, t:'target'}],
    upgrade:{ text:'造成 7 点伤害。施加 2 层灼烧。',
      effects:[{op:'damage', v:7},{op:'debuff', s:'burn', v:2, t:'target'}] } },

  { id:'c_bone_scatter', name:'碎骨乱掷', type:'attack', rarity:'common', cost:1, target:'none', tags:['打击','重复'],
    text:'对随机敌人造成 3 次 3 点伤害。',
    effects:[{op:'repeat', n:3, then:[{op:'damage', v:3, t:'random'}]}],
    upgrade:{ text:'对随机敌人造成 4 次 3 点伤害。',
      effects:[{op:'repeat', n:4, then:[{op:'damage', v:3, t:'random'}]}] } },

  { id:'c_rust_lance', name:'锈枪突刺', type:'attack', rarity:'common', cost:2, target:'enemy', tags:['机械','打击'],
    text:'造成 9 点伤害。50% 概率对目标施加 4 层中毒。',
    effects:[{op:'damage', v:9},{op:'if', cond:{type:'chance', p:0.5}, then:[{op:'debuff', s:'poison', v:4, t:'target'}]}],
    upgrade:{ text:'造成 12 点伤害。75% 概率对目标施加 5 层中毒。',
      effects:[{op:'damage', v:12},{op:'if', cond:{type:'chance', p:0.75}, then:[{op:'debuff', s:'poison', v:5, t:'target'}]}] } },

  { id:'c_pocket_grenade', name:'掌中铁罐', type:'attack', rarity:'common', cost:2, target:'allEnemies', tags:['机械','火焰'],
    text:'对所有敌人造成等同于你手牌数的伤害。施加 2 层灼烧。',
    effects:[{op:'damageAll', v:'hand', raw:true},{op:'debuff', s:'burn', v:2, t:'allEnemies'}],
    upgrade:{ text:'对所有敌人造成等同于你手牌数的伤害。施加 3 层灼烧。获得 4 点格挡。',
      effects:[{op:'damageAll', v:'hand', raw:true},{op:'debuff', s:'burn', v:3, t:'allEnemies'},{op:'block', v:4}] } },

  { id:'c_blood_hammer', name:'血锤', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['血祭','打击'],
    text:'造成等同于你力量层数的伤害。回复 2 点生命。',
    effects:[{op:'damage', v:'S', raw:true},{op:'heal', n:2}],
    upgrade:{ text:'造成等同于你 2 倍力量层数的伤害。回复 2 点生命。',
      effects:[{op:'damage', v:'2S', raw:true},{op:'heal', n:2}] } },

  { id:'c_steam_press', name:'蒸汽冲压', type:'attack', rarity:'common', cost:2, target:'enemy', tags:['机械','打击'],
    text:'获得 5 点格挡。造成 8 点伤害。',
    effects:[{op:'block', v:5},{op:'damage', v:8}],
    upgrade:{ text:'获得 8 点格挡。造成 11 点伤害。',
      effects:[{op:'block', v:8},{op:'damage', v:11}] } },

  { id:'c_static_charge', name:'静电蓄能', art:'⚡', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['雷光','迅捷'],
    text:'造成 6 点伤害。对目标施加 1 层标记。获得 1 层静电。',
    effects:[{op:'damage', v:6},{op:'debuff', s:'mark', v:1, t:'target'},{op:'buff', s:'static', v:1, t:'self'}],
    upgrade:{ text:'造成 8 点伤害。对目标施加 2 层标记。获得 1 层静电。',
      effects:[{op:'damage', v:8},{op:'debuff', s:'mark', v:2, t:'target'},{op:'buff', s:'static', v:1, t:'self'}] } },

  { id:'c_harpoon_line', name:'鱼叉索', type:'attack', rarity:'common', cost:1, target:'enemy', tags:['打击','迅捷'],
    text:'造成 6 点伤害。抽 1 张牌。',
    effects:[{op:'damage', v:6},{op:'draw', n:1}],
    upgrade:{ text:'造成 9 点伤害。抽 1 张牌。',
      effects:[{op:'damage', v:9},{op:'draw', n:1}] } },

  { id:'c_plague_tide', name:'疫潮', type:'attack', rarity:'common', cost:2, target:'allEnemies', tags:['毒'],
    text:'对所有敌人造成 5 点伤害。施加 3 层中毒。',
    effects:[{op:'damageAll', v:5},{op:'debuff', s:'poison', v:3, t:'allEnemies'}],
    upgrade:{ text:'对所有敌人造成 8 点伤害。施加 4 层中毒。',
      effects:[{op:'damageAll', v:8},{op:'debuff', s:'poison', v:4, t:'allEnemies'}] } },

  // ---- 攻击 uncommon ----

  { id:'c_guillotine_drop', name:'断头台坠落', type:'attack', rarity:'uncommon', cost:3, target:'enemy', tags:['斩击','血祭'],
    text:'造成 16 点伤害。失去 3 点生命。对目标施加 3 层易伤。',
    effects:[{op:'damage', v:16},{op:'loseHp', n:3},{op:'debuff', s:'vulnerable', v:3, t:'target'}],
    upgrade:{ text:'造成 22 点伤害。失去 2 点生命。对目标施加 3 层易伤。',
      effects:[{op:'damage', v:22},{op:'loseHp', n:2},{op:'debuff', s:'vulnerable', v:3, t:'target'}] } },

  { id:'c_cinder_charge', name:'燃烬冲锋', type:'attack', rarity:'uncommon', cost:1, target:'enemy', tags:['火焰','迅捷'],
    text:'若这是本回合打出的第一张牌，本场战斗下一张攻击牌伤害翻倍；否则造成 10 点伤害。',
    effects:[{op:'if', cond:{type:'firstCardOfTurn'}, then:[{op:'custom', fn:'doubleNextAttack'}], else:[{op:'damage', v:10, t:'target'}]}],
    upgrade:{ text:'若这是本回合打出的第一张牌，本场战斗下一张攻击牌伤害翻倍；否则造成 14 点伤害。',
      effects:[{op:'if', cond:{type:'firstCardOfTurn'}, then:[{op:'custom', fn:'doubleNextAttack'}], else:[{op:'damage', v:14, t:'target'}]}] } },

  // ---- 攻击 rare ----

  { id:'c_titan_piston', name:'泰坦冲锤', art:'🔨', type:'attack', rarity:'rare', cost:3, target:'enemy', tags:['机械','打击'],
    text:'造成 14 点伤害。若目标生命低于 40%，再连续造成 2 次 8 点伤害。',
    effects:[{op:'damage', v:14},{op:'if', cond:{type:'targetLow', p:0.4}, then:[{op:'repeat', n:2, then:[{op:'damage', v:8, t:'target'}]}]}],
    upgrade:{ text:'造成 18 点伤害。若目标生命低于 40%，再连续造成 2 次 10 点伤害。',
      effects:[{op:'damage', v:18},{op:'if', cond:{type:'targetLow', p:0.4}, then:[{op:'repeat', n:2, then:[{op:'damage', v:10, t:'target'}]}]}] } },

  // ============================================================
  // 技能 —— 基础机制池（8 张 common）
  // ============================================================

  { id:'c_brace', name:'铁壁架势', type:'skill', rarity:'common', cost:1, target:'self', tags:['防御'],
    text:'获得 6 点格挡。若你的生命低于 50%，额外获得 1 层敏捷。',
    effects:[{op:'block', v:6},{op:'if', cond:{type:'hpBelow', p:0.5}, then:[{op:'buff', s:'dexterity', v:1, t:'self'}]}],
    upgrade:{ text:'获得 9 点格挡。若你的生命低于 50%，额外获得 1 层敏捷。',
      effects:[{op:'block', v:9},{op:'if', cond:{type:'hpBelow', p:0.5}, then:[{op:'buff', s:'dexterity', v:1, t:'self'}]}] } },

  { id:'c_flare', name:'引火', type:'skill', rarity:'common', cost:0, target:'self', tags:['火焰','能量'],
    text:'若你手牌不超过 2 张，获得 2 点能量；否则获得 1 点能量。对随机敌人施加 2 层灼烧。',
    effects:[{op:'if', cond:{type:'handSize', n:2}, then:[{op:'energy', n:2}], else:[{op:'energy', n:1}]},
      {op:'debuff', s:'burn', v:2, t:'random'}] },

  { id:'c_pocket_ledger', name:'袖珍账簿', type:'skill', rarity:'common', cost:1, target:'self', tags:['弃牌','秘术'],
    text:'若当前回合是第 1 回合，抽 3 张牌；否则抽 2 张牌。预知 1。',
    effects:[{op:'if', cond:{type:'turn', n:1}, then:[{op:'draw', n:3}], else:[{op:'draw', n:2}]},{op:'scry', n:1}],
    upgrade:{ cost:0, text:'若当前回合是第 1 回合，抽 3 张牌；否则抽 2 张牌。预知 2。',
      effects:[{op:'if', cond:{type:'turn', n:1}, then:[{op:'draw', n:3}], else:[{op:'draw', n:2}]},{op:'scry', n:2}] } },

  { id:'c_iron_carapace', name:'铁铸甲胄', type:'skill', rarity:'common', cost:2, target:'self', tags:['防御','转化','机械'],
    text:'当前格挡翻倍。获得 5 点格挡。',
    effects:[{op:'block', v:'B'},{op:'block', v:5}],
    upgrade:{ cost:1, text:'当前格挡翻倍。获得 8 点格挡。获得 2 层荆棘。',
      effects:[{op:'block', v:'B'},{op:'block', v:8},{op:'buff', s:'thorns', v:2, t:'self'}] } },

  { id:'c_dredge', name:'淘洗废渣', type:'skill', rarity:'common', cost:0, target:'self', tags:['弃牌','机械'],
    text:'若弃牌堆不超过 2 张，抽 3 张牌；否则将弃牌堆洗回抽牌堆，然后抽 1 张牌。',
    effects:[{op:'if', cond:{type:'discardSize', n:2}, then:[{op:'draw', n:3}],
      else:[{op:'custom', fn:'shuffleDiscardToDeck'},{op:'draw', n:1}]}] },

  { id:'c_hollow_breath', name:'空息', art:'🌫', type:'skill', rarity:'common', cost:1, target:'self', tags:['秘术','诅咒'], ethereal:true,
    text:'抽 3 张牌。洗乱抽牌堆。无实体：回合结束时若仍在手牌中，本牌被消耗。',
    effects:[{op:'draw', n:3},{op:'custom', fn:'shuffleDrawPile'}] },

  { id:'c_ashen_routine', name:'灰烬热身', type:'skill', rarity:'common', cost:1, target:'self', tags:['迅捷','机械'], innate:true,
    text:'获得 5 点格挡。获得 1 点能量。' , effects:[{op:'block', v:5},{op:'energy', n:1}] },

  { id:'c_bone_sieve', name:'骨筛', art:'⚙', type:'skill', rarity:'common', cost:1, target:'self', tags:['血祭','转化'], exhaust:true,
    text:'每 1 张手牌回复 1 点生命。获得 1 层再生。消耗。',
    effects:[{op:'custom', fn:'healPerHandCard', n:1},{op:'buff', s:'regen', v:1, t:'self'},{op:'exhaustSelf'}] },

  // ---- 技能 uncommon ----

  { id:'c_blood_pact', name:'血契', art:'🩸', type:'skill', rarity:'uncommon', cost:0, target:'self', tags:['血祭','转化'], exhaust:true,
    text:'失去 4 点生命。获得 2 层力量；若此时你的生命低于 40%，改为获得 3 层力量。消耗。',
    effects:[{op:'loseHp', n:4},
      {op:'if', cond:{type:'hpBelow', p:0.4}, then:[{op:'buff', s:'strength', v:3, t:'self'}], else:[{op:'buff', s:'strength', v:2, t:'self'}]},
      {op:'exhaustSelf'}],
    upgrade:{ text:'失去 3 点生命。获得 3 层力量；若此时你的生命低于 40%，改为获得 4 层力量。消耗。',
      effects:[{op:'loseHp', n:3},
        {op:'if', cond:{type:'hpBelow', p:0.4}, then:[{op:'buff', s:'strength', v:4, t:'self'}], else:[{op:'buff', s:'strength', v:3, t:'self'}]},
        {op:'exhaustSelf'}] } },

  { id:'c_debt_collector', name:'债主', type:'skill', rarity:'uncommon', cost:1, target:'self', tags:['能量','诅咒'], exhaust:true,
    text:'失去 1 点能量后抽 2 张牌。若本回合已打出 2 张以上攻击牌，额外抽 1 张牌。消耗。',
    effects:[{op:'custom', fn:'loseEnergyThenDraw', n:1},
      {op:'if', cond:{type:'typePlayed', t:'attack', n:2}, then:[{op:'draw', n:1}]},{op:'exhaustSelf'}],
    upgrade:{ text:'失去 1 点能量后抽 2 张牌。若本回合已打出 2 张以上攻击牌，额外抽 2 张牌。消耗。',
      effects:[{op:'custom', fn:'loseEnergyThenDraw', n:1},
        {op:'if', cond:{type:'typePlayed', t:'attack', n:2}, then:[{op:'draw', n:2}]},{op:'exhaustSelf'}] } },

  { id:'c_cinder_storm', name:'灰烬风暴', art:'🌪', type:'skill', rarity:'uncommon', cost:1, target:'allEnemies', tags:['火焰'], exhaust:true,
    text:'手牌中每有一张牌，对随机敌人造成 2 点伤害。对所有敌人施加 3 层灼烧。消耗。',
    effects:[{op:'custom', fn:'burnPerCardInHand'},{op:'debuff', s:'burn', v:3, t:'allEnemies'},{op:'exhaustSelf'}] },
];
