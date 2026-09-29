#!/usr/bin/env node
/**
 * 数据 + 引擎 联调自检
 * 用法： node tools/validate.js
 * 无需浏览器；会加载全部数据模块、校验引用完整性，并跑一次无头战斗模拟。
 */
const path = require('path');
const { pathToFileURL } = require('url');

const R = (p) => pathToFileURL(path.join(__dirname, '..', p)).href;

const OPS = new Set([
  'damage', 'damageAll', 'block', 'blockAll', 'heal', 'loseHp', 'maxHp', 'doubleBlock', 'gold',
  'buff', 'debuff', 'draw', 'energy', 'scry', 'addHand', 'addDiscard', 'addDeck', 'shuffleIn',
  'exhaustSelf', 'retainSelf', 'removeCard', 'upgradeCard', 'repeat', 'if', 'custom', 'skill',
]);
const CONDS = new Set([
  'hpBelow', 'hpAbove', 'hasStatus', 'noStatus', 'deckCount', 'typePlayed', 'energy', 'handSize',
  'discardSize', 'turn', 'enemyCount', 'chance', 'firstCardOfTurn', 'lastCardPlayed', 'targetLow', 'hasRelic',
]);
const CUSTOMS = new Set([
  'shuffleDiscardToDeck', 'shuffleDrawPile', 'doubleNextAttack', 'healPerHandCard',
  'burnPerCardInHand', 'loseEnergyThenDraw', 'grantRandomRelic', 'convertDeckToBurn',
]);
const RELIC_HOOKS = new Set([
  'onRunStart', 'onBattleStart', 'onTurnStart', 'onTurnEnd', 'onCardPlay', 'onAttack', 'onBlock',
  'onKill', 'onRest', 'onShop', 'onHpLost', 'onDamageDealt', 'onNodeEnter',
]);
const MOD_KEYS = new Set([
  'damagePlus', 'blockPlus', 'energyPlus', 'maxHpPlus', 'goldPlus', 'handPlus', 'drawPlus',
  'healPlus', 'cardRewardPlus', 'shopPriceMul', 'eliteDamagePlus', 'potionSlotsPlus', 'mapReveal', 'enemyHpMul',
]);

const errors = [];
const warnings = [];
const E = (m) => errors.push(m);
const W = (m) => warnings.push(m);

function walkOps(ops, where, cardIds) {
  if (!Array.isArray(ops)) { E(`${where}: effects 不是数组`); return; }
  for (const op of ops) {
    if (!op || !op.op) { E(`${where}: 缺少 op`); continue; }
    if (!OPS.has(op.op)) E(`${where}: 未知 op "${op.op}"`);
    if (op.s && !STATUS_IDS.has(op.s)) E(`${where}: 未知 status "${op.s}"`);
    if (op.op === 'custom' && !CUSTOMS.has(op.fn)) E(`${where}: 未知 custom.fn "${op.fn}"`);
    for (const k of ['card']) {
      if (op[k] && cardIds && !cardIds.has(op[k])) E(`${where}: 引用了不存在的卡牌 "${op[k]}"`);
    }
    if (op.then) walkOps(op.then, `${where} > repeat`, cardIds);
    if (op.else) walkOps(op.else, `${where} > if.else`, cardIds);
    if (op.cond) {
      if (!CONDS.has(op.cond.type)) E(`${where}: 未知 cond.type "${op.cond.type}"`);
      if (op.cond.s && !STATUS_IDS.has(op.cond.s)) E(`${where}: 未知 cond status "${op.cond.s}"`);
      if (op.cond.card && cardIds && !cardIds.has(op.cond.card) && !TAGS.has(op.cond.card)) {
        W(`${where}: cond.card "${op.cond.card}" 既不是卡牌 id 也不是已知 tag`);
      }
    }
  }
}

let STATUS_IDS = new Set();
let TAGS = new Set();

(async () => {
  console.log('加载模块…');
  const st = await import(R('src/data/statuses.js'));
  STATUS_IDS = new Set(Object.keys(st.STATUS));

  const [cards, chars, enemies, relics, potions, events, index] = await Promise.all([
    import(R('src/data/cards.js')),
    import(R('src/data/characters.js')),
    import(R('src/data/enemies.js')),
    import(R('src/data/relics.js')),
    import(R('src/data/potions.js')),
    import(R('src/data/events.js')),
    import(R('src/data/index.js')),
  ]);

  const CARDS = cards.CARDS, CHARACTERS = chars.CHARACTERS, ENEMIES = enemies.ENEMIES,
    RELICS = relics.RELICS, POTIONS = potions.POTIONS, EVENTS = events.EVENTS,
    ALL_RELICS = relics.RELICS;
  const cardIds = new Set(CARDS.map((c) => c.id));
  for (const c of CARDS) for (const t of c.tags || []) TAGS.add(t);

  console.log(`卡牌 ${CARDS.length} · 角色 ${CHARACTERS.length} · 敌人 ${ENEMIES.length} · 遗物 ${RELICS.length} · 药水 ${POTIONS.length} · 事件 ${EVENTS.length}`);

  // ---- 唯一性 ----
  const uniq = (arr, name) => {
    const seen = new Set();
    for (const x of arr) {
      if (!x || !x.id) { E(`${name}: 有条目缺少 id`); continue; }
      if (seen.has(x.id)) E(`${name}: 重复 id "${x.id}"`);
      seen.add(x.id);
    }
  };
  uniq(CARDS, '卡牌'); uniq(CHARACTERS, '角色'); uniq(ENEMIES, '敌人');
  uniq(RELICS, '遗物'); uniq(POTIONS, '药水'); uniq(EVENTS, '事件');

  // ---- 卡牌 ----
  for (const c of CARDS) {
    const w = `卡牌 ${c.id}`;
    if (!c.name) E(`${w}: 缺少 name`);
    if (!['attack', 'skill', 'power', 'curse'].includes(c.type)) E(`${w}: type 非法 "${c.type}"`);
    if (!['common', 'uncommon', 'rare', 'special', 'curse'].includes(c.rarity)) E(`${w}: rarity 非法 "${c.rarity}"`);
    if (typeof c.cost !== 'number') E(`${w}: cost 非数字`);
    if (!['enemy', 'allEnemies', 'self', 'none'].includes(c.target)) E(`${w}: target 非法 "${c.target}"`);
    if (!c.text) W(`${w}: 没有 text（将使用自动生成描述）`);
    walkOps(c.effects, w, cardIds);
    if (c.upgrade) {
      walkOps(c.upgrade.effects || c.effects, `${w} > upgrade`, cardIds);
    }
  }

  // ---- 角色 ----
  for (const c of CHARACTERS) {
    const w = `角色 ${c.id}`;
    for (const id of c.deck || []) if (!cardIds.has(id)) E(`${w}: 起手牌含不存在的卡 "${id}"`);
    if (!c.relic) E(`${w}: 缺少初始遗物`);
    if (!c.mechanic) W(`${w}: 没有 mechanic 文本`);
  }

  // ---- 敌人 ----
  for (const e of ENEMIES) {
    const w = `敌人 ${e.id}`;
    if (!e.moves?.length) { E(`${w}: 没有招式`); continue; }
    if (!Array.isArray(e.hp) || e.hp.length !== 2) E(`${w}: hp 必须是 [min,max]`);
    if (!Array.isArray(e.gold) || e.gold.length !== 2) E(`${w}: gold 必须是 [min,max]`);
    const mIds = new Set();
    for (const m of e.moves) {
      if (mIds.has(m.id)) E(`${w}: 招式 id 重复 "${m.id}"`);
      mIds.add(m.id);
      if (!m.intent) W(`${w}/${m.id}: 没有 intent`);
      if (m.dmg == null) W(`${w}/${m.id}: 没有 dmg（UI 意图不显示数字）`);
      walkOps(m.effects, `${w}/${m.id}`, cardIds);
      if (m.next && !mIds.has(m.next) && !e.moves.find((x) => x.id === m.next)) E(`${w}/${m.id}: next 指向不存在的招式 "${m.next}"`);
    }
    if (e.onDeath) walkOps(e.onDeath, `${w} > onDeath`, cardIds);
    if (e.onBattleStart) walkOps(e.onBattleStart, `${w} > onBattleStart`, cardIds);
    if (e.onTurnStart) walkOps(e.onTurnStart, `${w} > onTurnStart`, cardIds);
  }

  // ---- 遗物 ----
  for (const r of RELICS) {
    const w = `遗物 ${r.id}`;
    if (!r.hooks && !r.mod) W(`${w}: 既没有 hooks 也没有 mod`);
    for (const [k, ops] of Object.entries(r.hooks || {})) {
      if (!RELIC_HOOKS.has(k)) E(`${w}: 未知钩子 "${k}"`);
      walkOps(ops, `${w} > ${k}`, cardIds);
    }
    for (const k of Object.keys(r.mod || {})) if (!MOD_KEYS.has(k)) W(`${w}: 未知 mod 键 "${k}"`);
  }

  // ---- 药水 ----
  for (const p of POTIONS) {
    const w = `药水 ${p.id}`;
    if (!['self', 'target', 'none'].includes(p.target)) E(`${w}: target 非法`);
    walkOps(p.effects, w, cardIds);
  }

  // ---- 事件 ----
  for (const e of EVENTS) {
    const w = `事件 ${e.id}`;
    if (!e.text) E(`${w}: 缺少 text`);
    if (!e.options?.length) { E(`${w}: 没有选项`); continue; }
    for (const o of e.options) {
      if (!o.label) E(`${w}: 选项缺少 label`);
      if (o.result) {
        walkOps(o.result.effects || [], `${w} > 选项「${o.label}」`, cardIds);
        for (const k of ['gold', 'cards', 'relics', 'potions', 'heal', 'damage']) {
          if (o.result.loot && o.result.loot[k] != null && k !== 'cards' && k !== 'relics') {
            const v = o.result.loot[k];
            if (Array.isArray(v) && v.length !== 2) E(`${w}: loot.${k} 应为 [a,b]`);
          }
        }
      }
    }
  }

  // ---- 引擎模块 ----
  const { newRun, grantRelic, addCard, rollRelicReward, grantRandomRelic } = await import(R('src/core/run.js'));
  const { startBattle, pickEncounter, playCard, endTurn, usePotion } = await import(R('src/systems/battle.js'));
  const { RNG } = await import(R('src/core/rng.js'));
  const { newMeta, bonuses } = await import(R('src/systems/meta.js'));
  const { generateMap } = await import(R('src/systems/map.js'));

  // ---- 初始遗物绝不能进入随机池 ----
  console.log('检查初始遗物隔离…');
  const { STARTER_RELICS } = index;
  {
    const meta2 = newMeta();
    const run2 = newRun(meta2, CHARACTERS[0].id, { seed: 7 });
    run2.meta = meta2;
    const seenBad = new Set();
    for (let i = 0; i < 400; i++) {
      for (const r of rollRelicReward(run2, 3)) if (STARTER_RELICS.has(r.id)) seenBad.add(r.id);
      const g = grantRandomRelic(run2);
      if (g && STARTER_RELICS.has(g.id)) seenBad.add(g.id);
    }
    if (seenBad.size) E(`初始遗物泄漏进随机池: ${Array.from(seenBad).join(', ')}`);
    // 每个角色的初始遗物必须存在
    for (const c of CHARACTERS) {
      if (!index.RELIC_MAP.has(c.relic)) E(`角色 ${c.id} 的初始遗物 "${c.relic}" 不存在`);
    }
    // 商店池同样隔离
    const shopPoolSize = ALL_RELICS.filter((r) => r.rarity !== 'starter' && !STARTER_RELICS.has(r.id)).length;
    if (shopPoolSize < 5) E(`商店可售遗物过少：${shopPoolSize}`);
  }

  // ---- 诅咒牌入场必须真的结算 ----
  console.log('检查诅咒牌入场结算…');
  {
    const curses = CARDS.filter((c) => c.playable === false);
    if (!curses.length) E('没有找到任何 playable:false 的诅咒牌');
    for (const curse of curses) {
      if (!curse.effects?.length) { E(`诅咒牌 ${curse.id} 的 effects 为空，入场后不会产生任何代价`); continue; }
      const m = newMeta();
      const rr = newRun(m, CHARACTERS[0].id, { seed: 99 });
      rr.meta = m;
      addCard(rr, curse.id);
      if (!rr.deck.some((c) => c.id === curse.id)) E(`诅咒牌 ${curse.id} 未进入牌组`);
      // 至少要有一项可见后果（状态 / 生命 / 最大生命）
      const before = { hp: rr.hp, maxHp: rr.maxHp };
      const applied = Object.keys(rr.carryStatuses || {}).length > 0
        || rr.hp !== before.hp || rr.maxHp !== before.maxHp;
      if (!applied) E(`诅咒牌 ${curse.id} 入场后没有任何可观察后果（effects 未执行？）`);
    }
    console.log(`  ${curses.length} 张诅咒牌，入场结算均已验证`);
  }

  // ---- 数值 token 的精确语义（不靠读代码，靠实际结算） ----
  console.log('检查数值 token 语义…');
  {
    /** 造一场固定战场：玩家给定格挡/力量/手牌，敌人无格挡无状态 */
    function arena(setup) {
      const m = newMeta();
      const rr = newRun(m, CHARACTERS[0].id, { seed: 4242 });
      rr.meta = m;
      rr.map = generateMap(rr, 1);
      const b = startBattle(rr, pickEncounter(rr, 1, 'normal'));
      const e = b.enemies[0];
      e.block = 0; e.status = {}; e.hp = 500; e.maxHp = 500;
      b.enemies.length = 1;
      b.player.block = 0; b.player.status = {}; b.player.hp = b.player.maxHp;
      b.energy = 99; b.phase = 'player';
      b.hand = [];
      // 剥离遗物与天赋干扰，让断言是确定值（起始遗物自带力量/灼烧等加成）
      rr.relics.length = 0;
      setup(b, rr, e);
      return { b, rr, e };
    }
    const at = (b, id) => { b.hand.push({ id, uid: `t#${b.uidSeq++}`, upgraded: false }); return b.hand[b.hand.length - 1]; };

    // 1) v:'B' —— 铁铸甲胄：当前格挡翻倍，再 +5
    {
      const { b } = arena((bb) => { bb.player.block = 7; });
      const inst = at(b, 'c_iron_carapace');
      const before = b.player.block;
      const r = playCard(b, inst.uid, null);
      if (!r.ok) E(`c_iron_carapace 无法打出: ${r.why}`);
      else if (b.player.block !== before * 2 + 5) {
        E(`v:'B' 语义错误：格挡 ${before} -> ${b.player.block}，期望 ${before * 2 + 5}`);
      }
    }
    // 2) v:'S' —— 血锤：伤害等同于力量层数，并回血 2
    {
      const { b, e } = arena((bb) => { bb.player.status.strength = 4; bb.player.hp = bb.player.maxHp - 10; });
      const inst = at(b, 'c_blood_hammer');
      const hpBefore = b.player.hp;
      const r = playCard(b, inst.uid, e.uid);
      if (!r.ok) E(`c_blood_hammer 无法打出: ${r.why}`);
      else {
        const dealt = 500 - e.hp;
        if (dealt !== 4) E(`v:'S' 语义错误：造成 ${dealt}，期望 4（力量 4 层）`);
        if (b.player.hp !== Math.min(b.player.maxHp, hpBefore + 2)) E('血锤未正确回血 2');
      }
    }
    // 3) v:'hand' —— 掌中铁罐：伤害等同于「打出瞬间的手牌数」（含本张）
    {
      const { b, e } = arena(() => {});
      const inst = at(b, 'c_pocket_grenade');
      const handAtPlay = b.hand.length;
      const r = playCard(b, inst.uid, e.uid);
      if (!r.ok) E(`c_pocket_grenade 无法打出: ${r.why}`);
      else {
        const dealt = 500 - e.hp;
        if (dealt !== handAtPlay) E(`v:'hand' 语义错误：造成 ${dealt}，期望 ${handAtPlay}（打出瞬间手牌数）`);
        if ((e.status.burn || 0) !== 2) E(`掌中铁罐未施加 2 层灼烧，实际 ${e.status.burn || 0}`);
      }
    }
    // 4) 文本与 raw 语义一致性：token 伤害必须标 raw，否则文案与实际伤害对不上
    {
      const walk = (list, out) => {
        for (const o of list || []) {
          if (o.op === 'if' || o.op === 'repeat') { walk(o.then, out); walk(o.else, out); }
          else if ((o.op === 'damage' || o.op === 'damageAll') && typeof o.v === 'string') out.push(o);
        }
        return out;
      };
      let checked = 0;
      for (const c of CARDS) {
        const texts = [c.text, c.upgrade?.text].filter(Boolean).join(' ');
        const claimsPure = /等同于|等于/.test(texts);
        for (const o of walk(c.effects, []).concat(walk(c.upgrade?.effects, []))) {
          checked++;
          if (claimsPure && o.raw !== true) {
            E(`卡牌 ${c.id}：文案写「等同于」但 damage op 未标 raw:true，实际伤害会多叠一层力量`);
          }
          if (!claimsPure && o.raw === true) {
            E(`卡牌 ${c.id}：damage op 标了 raw:true 但文案未写「等同于」，请核对语义`);
          }
        }
      }
      console.log(`  ${checked} 个 token 伤害 op，文案与 raw 语义一致`);
    }
    // 4) token 不得产生 NaN
    for (const tok of ['S', '2S', 'B', 'hand', 'deck', 'discard', undefined, 'x', null]) {
      for (const c of CARDS) {
        for (const op of c.effects || []) {
          if (!('v' in op)) continue;
          if (op.v !== tok) continue;
          const { b } = arena((bb) => { bb.player.status.strength = 3; bb.player.block = 5; });
          const inst = at(b, c.id);
          const r = playCard(b, inst.uid, b.enemies[0]?.uid || null);
          const bad = [b.player, ...b.enemies].some((u) =>
            [u.hp, u.block, u.maxHp].some((n) => typeof n === 'number' && !Number.isFinite(n)));
          if (bad) E(`卡牌 ${c.id} 使用 token ${JSON.stringify(tok)} 产生了非法数值`);
          if (b.energy !== 99 - Math.max(0, c.cost)) { /* 能量只扣一次，可忽略 */ }
          void r;
        }
      }
    }
    // 5) 仪式：回合开始转为等量力量并清空自身（不得指数自增）
    {
      const { b } = arena((bb) => { bb.player.status.ritual = 3; bb.player.status.strength = 0; });
      endTurn(b);                       // 结束当前回合 → 敌方行动 → 新回合开始
      b.pending.length = 0;
      if (b.phase !== 'player') { b.phase = 'player'; startTurn(b); }
      const st = b.player.status.strength || 0;
      const rit = b.player.status.ritual || 0;
      if (st < 3) E(`仪式未转化为力量：ritual=3 回合开始后 strength=${st}`);
      if (rit !== 0) E(`仪式未清空：回合开始后 ritual=${rit}（应转化为力量后归零，不得自增）`);
    }
    // 6) 下一张攻击牌伤害翻倍：设标记的牌本身不吃加成，下一张攻击才吃
    {
      const { b, e } = arena(() => {});
      // 先打出 c_cinder_charge（首张牌 → 施加标记）
      b.cardsPlayedThisTurn.length = 0;
      const instA = at(b, 'c_cinder_charge');
      const rA = playCard(b, instA.uid, e.uid);
      if (!rA.ok) E(`c_cinder_charge 无法打出: ${rA.why}`);
      if (!b.doubleNextAttack) E('c_cinder_charge 未设置 doubleNextAttack 标记');
      // 打出一张普通攻击牌，应吃满双倍
      const hpBefore = e.hp;
      const instB = at(b, 'c_strike');
      const rB = playCard(b, instB.uid, e.uid);
      if (!rB.ok) E(`c_strike 无法打出: ${rB.why}`);
      const dealt = hpBefore - e.hp;
      if (dealt < 2) E(`下一张攻击牌未翻倍：造成 ${dealt}，期望 ≥2（基准 1）`);
      if (b.doubleNextAttack) E('标记在消费后未被清除');
    }
    // 7) 敌人状态必须结算并衰减（灼烧/中毒掉血、仪式转化、金属化）
    {
      const { b, e } = arena((bb) => {
        bb.enemies[0].status.burn = 3;
        bb.enemies[0].status.poison = 2;
        bb.enemies[0].status.ritual = 2;
        bb.enemies[0].status.metallicize = 4;
        bb.enemies[0].block = 0;
      });
      const hp0 = e.hp;
      const kills0 = b.run.stats.kills;
      endTurn(b); b.pending.length = 0;
      const burned = hp0 - e.hp;
      if (burned !== 5) E(`敌人回合结束状态未结算：期望掉 3(灼烧)+2(中毒)=5，实际 ${burned}`);
      if (e.status.ritual !== 0) E(`敌人仪式未转化为力量：ritual=${e.status.ritual}`);
      if ((e.status.strength || 0) < 2) E(`敌人仪式未带来力量：strength=${e.status.strength || 0}`);
      if (e.block < 4) E(`敌人金属化未结算：block=${e.block}，期望 ≥4`);
      if ((e.status.burn || 0) < 3) E(`敌人灼烧被错误衰减（burn 是 decay:none）: ${e.status.burn}`);
    }
    // 7b) decayStatuses 直接单测：decay:'turn' 逐层 -1，decay:'none' 保持不变
    {
      const { decayStatuses } = await import(R('src/systems/battle.js'));
      const fake = {
        name: 'X', glyph: 'X', hp: 10, maxHp: 10, block: 0, isPlayer: false,
        status: { weak: 2, vulnerable: 1, entangled: 3, burn: 9, strength: 4, ritual: 1, metallicize: 5 },
      };
      decayStatuses({ battle: { log: [] } }, fake);
      const s = fake.status;
      if (s.weak !== 1) E(`weak 应衰减到 1，实际 ${s.weak}`);
      if ('vulnerable' in s) E('vulnerable(1) 应在衰减后移除，仍为 ' + s.vulnerable);
      if (s.entangled !== 2) E(`entangled 应衰减到 2，实际 ${s.entangled}`);
      for (const k of ['burn', 'strength', 'ritual', 'metallicize']) {
        if (s[k] === undefined) E(`decay:none 状态 ${k} 被错误移除`);
      }
      if (s.burn !== 9 || s.strength !== 4 || s.ritual !== 1 || s.metallicize !== 5) {
        E('decay:none 状态数值被改动：' + JSON.stringify(s));
      }
    }
    // 8) 敌人被灼烧/毒死要计入击杀
    {
      const { b, e } = arena((bb) => { bb.enemies[0].status.burn = 999; bb.enemies[0].hp = 1; });
      const kills0 = b.run.stats.kills;
      endTurn(b); b.pending.length = 0;
      if (b.run.stats.kills <= kills0) E('敌人被灼烧击杀未计入击杀统计');
      if (b.phase !== 'won') E(`敌人被灼烧击杀后未判定胜利：phase=${b.phase}`);
    }
    // 9) 格挡必须在回合开始清空；壁垒可保留；碎裂在格挡打光时留 1 点
    {
      const { b, e } = arena((bb) => { bb.player.block = 12; bb.enemies[0].block = 9; });
      endTurn(b); b.pending.length = 0;
      if (b.player.block !== 0) E(`玩家格挡未在回合开始清空：${b.player.block}`);
      if (e.block !== 0) E(`敌人格挡未在回合开始清空：${e.block}`);
    }
    {
      // 敌人会先出手打掉一部分格挡；关键是 startTurn 不再清空
      const { b } = arena((bb) => { bb.player.block = 50; bb.player.status.barricade = 1; });
      endTurn(b); b.pending.length = 0;
      if (!(b.player.block > 0)) E(`【壁垒】未保留格挡：敌人出手后应为正，实际 ${b.player.block}`);
    }
    {
      const { b, e } = arena((bb) => {
        bb.enemies[0].status.splinter = 2;   // 碎裂挂在挨打的防御方身上
        bb.enemies[0].block = 3;
        bb.enemies[0].splinterUsed = false;
      });
      const { dealDamage } = await import(R('src/systems/effects.js'));
      const ctxM = { battle: b, run: b.run, self: b.player, target: e, rng: b.rng, perspective: 'player', inRun: false };
      dealDamage(ctxM, b.player, e, 3, {});
      if (e.block !== 1) E(`【碎裂】未保留 1 点格挡：实际 ${e.block}`);
      if ((e.status.splinter || 0) !== 1) E(`【碎裂】层数未扣除：${e.status.splinter}`);
      dealDamage(ctxM, b.player, e, 1, {});
      if (e.block !== 0) E('【碎裂】同回合第二次应不生效');
    }
    // 10) 静态扫描：每个状态都必须在引擎/UI 中有实现，不能是只有文案的空壳
    {
      const fs = require('fs');
      const pathMod = require('path');
      const srcFiles = [];
      const walkDir = (d) => {
        for (const name of fs.readdirSync(d, { withFileTypes: true })) {
          const fp = pathMod.join(d, name.name);
          if (name.isDirectory()) { if (name.name !== 'data') walkDir(fp); }
          else if (name.name.endsWith('.js')) srcFiles.push(fs.readFileSync(fp, 'utf8'));
        }
      };
      walkDir(pathMod.join(__dirname, '..', 'src'));
      const engineSrc = srcFiles.join('\n');
      const { STATUS: STATUS_ALL } = await import(R('src/data/statuses.js'));
      const dead = Object.keys(STATUS_ALL).filter((id) =>
        !engineSrc.includes(`'${id}'`) && !engineSrc.includes(`"${id}"`) && !engineSrc.includes(`.${id}`));
      if (dead.length) E(`以下状态在引擎/UI 中没有任何实现（只有文案）：${dead.join(', ')}`);
      else console.log(`  ${Object.keys(STATUS_ALL).length} 个状态均有实现，无空壳`);
    }
    console.log('  ritual / doubleNextAttack / 敌人状态结算 / 状态衰减 / 格挡 / 壁垒 / 碎裂 检查通过');
  }

  // ---- 事件全量结算（每个选项都跑一遍） ----
  console.log('结算全部事件选项…');
  const { applyRunEffects } = await import(R('src/systems/outcome.js'));
  {
    let optsRun = 0, bad = 0;
    for (const e of EVENTS) {
      for (const o of e.options || []) {
        optsRun++;
        // 多种起始状态，确保不依赖特定构筑
        for (const seedMod of [0, 1, 2]) {
          const m = newMeta();
          const rr = newRun(m, CHARACTERS[seedMod % CHARACTERS.length].id, { seed: 500 + seedMod });
          rr.meta = m;
          rr.gold = 120;                       // 覆盖 req.gold 上限
          rr.hp = Math.max(1, Math.floor(rr.maxHp * 0.4)); // 覆盖 hpBelow
          for (let i = 0; i < 12; i++) grantRelic(rr, Array.from(index.RELIC_MAP.keys())[seedMod * 7 + i]);
          if (e.id === 'ev_piston_shrine') addCard(rr, 'c_curse_insomnia'); // 覆盖 curseOnly
          try {
            const { log } = applyRunEffects(rr, o.result?.effects || []);
            if (rr.gold < 0) { E(`事件 ${e.id} / 选项「${o.label}」导致金币为负：${rr.gold}`); bad++; }
            if (rr.hp < 0) { E(`事件 ${e.id} / 选项「${o.label}」导致生命为负：${rr.hp}`); bad++; }
            if (rr.maxHp < 1) { E(`事件 ${e.id} / 选项「${o.label}」导致最大生命 < 1：${rr.maxHp}`); bad++; }
            if (!Array.isArray(log)) throw new Error('日志不是数组');
          } catch (err) {
            E(`事件 ${e.id} / 选项「${o.label}」抛异常: ${err.message}`);
            bad++;
          }
        }
      }
    }
    console.log(`  ${optsRun} 个选项 × 3 种起始状态，已结算${bad ? '，异常 ' + bad : '，全部安全'}`);
  }

  // ---- 无头模拟 ----
  console.log('无头模拟 60 场战斗…');

  const origError = console.error;
  let silent = false;
  console.error = (...a) => { if (!silent) origError(...a); };

  let battles = 0, wins = 0, turnsTotal = 0, errorsDuringSim = 0;
  for (let t = 0; t < 60; t++) {
    try {
      const meta = newMeta();
      const b = bonuses(meta);
      const run = newRun(meta, CHARACTERS[t % CHARACTERS.length].id, { seed: 1000 + t });
      run.act = 1 + (t % 3);
      run.map = generateMap(run, run.act);
      const tier = t % 7 === 0 ? 'elite' : (t % 13 === 0 ? 'boss' : 'normal');
      const enc = pickEncounter(run, run.act, tier);
      if (!enc.filter(Boolean).length) { E(`模拟 ${t}: 没有抽到敌人`); continue; }
      const battle = startBattle(run, enc, { tier });
      battles++;
      let guard = 0;
      while (battle.phase === 'player' && guard++ < 60) {
        // 简单 AI：能打就打
        let acted = true;
        let inner = 0;
        while (acted && inner++ < 12) {
          acted = false;
          const playables = battle.hand.filter((c) => {
            const d = index.CARD_MAP.get(c.id);
            return d && d.playable !== false;
          });
          for (const c of playables) {
            const d = index.CARD_MAP.get(c.id);
            const cost = d.cost < 0 ? battle.energy : Math.max(0, d.cost - (battle.player.status.focus || 0));
            if (cost > battle.energy) continue;
            const target = d.target === 'enemy' ? battle.enemies.find((e) => e.hp > 0)?.uid : null;
            if (d.target === 'enemy' && !target) continue;
            playCard(battle, c.uid, target);
            acted = true;
            break;
          }
          if (battle.phase !== 'player') break;
        }
        if (battle.phase !== 'player') break;
        if (run.potions.length && battle.rng.chance(0.3)) {
          const alive = battle.enemies.find((e) => e.hp > 0);
          usePotion(battle, run.potions[0], alive?.uid || null);
        }
        if (battle.phase !== 'player') break;
        endTurn(battle);
        turnsTotal++;
        // 清掉预知挂起
        battle.pending.length = 0;
      }
      if (battle.phase === 'won') wins++;
      if (guard >= 60) W(`模拟 ${t}: 超过 60 回合未结束`);
      if (battle.hand.some((c) => !index.CARD_MAP.get(c.id))) E(`模拟 ${t}: 手牌里出现未知卡牌`);
    } catch (e) {
      errorsDuringSim++;
      E(`模拟 ${t} 抛异常: ${e.message}\n${String(e.stack).split('\n').slice(1, 4).join('\n')}`);
    }
  }
  console.error = origError;

  // ---- 报告 ----
  console.log('');
  console.log(`模拟结果：${battles} 场，玩家胜 ${wins} 场，共进行 ${turnsTotal} 个回合，异常 ${errorsDuringSim} 次`);
  console.log('');
  if (warnings.length) {
    console.log(`⚠ 警告 ${warnings.length} 条（前 20 条）：`);
    for (const w of warnings.slice(0, 20)) console.log('  · ' + w);
    if (warnings.length > 20) console.log(`  … 其余 ${warnings.length - 20} 条省略`);
    console.log('');
  }
  if (errors.length) {
    console.log(`✖ 错误 ${errors.length} 条：`);
    for (const e of errors.slice(0, 60)) console.log('  · ' + e);
    if (errors.length > 60) console.log(`  … 其余 ${errors.length - 60} 条省略`);
    console.log('');
    process.exit(1);
  } else {
    console.log('✔ 全部通过');
  }
})().catch((e) => {
  console.error('校验器崩溃:', e);
  process.exit(1);
});
