// ============ 效果解析器 ============
// 引擎的唯一真相来源：卡牌、药水、遗物钩子、敌人招式、事件结果全部走这里。
import { STATUS, card as cardDef } from '../data/index.js';
import { normStacks } from '../data/statuses.js';

// ---------- 基础工具 ----------

export function logLine(battle, text, kind = 'info') {
  if (!battle) return;
  battle.log ||= [];
  battle.log.push({ text, kind, turn: battle.turn });
  if (battle.log.length > 220) battle.log.shift();
}

export function fx(battle, type, data) {
  if (!battle) return;
  battle.fx ||= [];
  battle.fx.push({ type, ...data });
}

/**
 * 诅咒牌入场结算。
 * playable:false 的牌永远不会被 playCard 触发，所以必须在「进入牌组」这一刻
 * 把它自己的 effects 结算一次（代价已经写死在卡面上，如「获得 1 层脆骨」）。
 * 战斗中进入手牌/牌堆时用真实战斗 ctx，战斗外用一个一次性的伪战斗对象。
 */
export function triggerCurse(ctx, cardId) {
  const def = cardDef(cardId);
  if (!def || def.playable !== false) return [];
  const ops = Array.isArray(def.effects) ? def.effects : [];
  if (!ops.length) return [];

  if (ctx.battle && ctx.battle.run === ctx.run) {
    logLine(ctx.battle, `【${def.name}】缠上了你。`, 'bad');
    resolveOps(ops, ctx);
    return ctx.battle.log;
  }

  // 战斗外：构造一次性伪战斗对象，结算后同步回 run
  const run = ctx.run;
  if (!run) return [];
  const self = {
    uid: 'self', name: run.charName, glyph: run.charGlyph,
    hp: run.hp, maxHp: run.maxHp, block: 0, status: {}, isPlayer: true,
  };
  const battle = {
    run, uidSeq: 1, turn: 0, phase: 'event', enemies: [], player: self,
    draw: [], hand: [], discard: [], exhaustPile: [], powers: [],
    cardsPlayedThisTurn: [], pending: [], fx: [], log: [], doubleNextAttack: null,
  };
  const sub = {
    battle, run, self, target: null, rng: run.rng,
    perspective: 'player', inRun: true, onGrantRelic: () => {},
  };
  logLine(battle, `【${def.name}】缠上了你。`, 'bad');
  resolveOps(ops, sub);
  run.hp = Math.max(0, Math.min(run.maxHp, self.hp));
  run.maxHp = Math.max(1, self.maxHp);
  return battle.log;
}

/** 所有遗物 mod 求和 */
export function relicMod(run, key) {
  let total = 0;
  if (!run?.relics) return 0;
  for (const rid of run.relics) {
    const r = run.relicDefs?.get?.(rid) || null;
    const v = r?.mod?.[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}
export function relicModMul(run, key) {
  let mul = 1;
  if (!run?.relics) return 1;
  for (const rid of run.relics) {
    const r = run.relicDefs?.get?.(rid) || null;
    const v = r?.mod?.[key];
    if (typeof v === 'number') mul *= v;
  }
  return mul;
}
export function hasRelic(run, id) { return !!run?.relics?.includes(id); }

// ---------- 数值 token ----------

export function resolveValue(token, ctx) {
  const { self } = ctx;
  const str = self?.status?.strength || 0;
  switch (token) {
    case 'S': return str;
    case '2S': return str * 2;
    case 'B': return ctx.self?.block || 0;
    case 'hand': return ctx.handAtPlay ?? (ctx.battle?.hand?.length || 0);
    case 'deck': return ctx.run?.deck?.length || 0;
    case 'discard': return ctx.battle?.discard?.length || 0;
    default: {
      const n = Number(token);
      return Number.isFinite(n) ? n : 0;
    }
  }
}

// ---------- 状态 ----------

export function addStatus(ctx, who, id, v) {
  if (!who || who.hp <= 0) return 0;
  if (!STATUS[id]) { console.warn('[status] 未知状态', id); return 0; }
  const def = STATUS[id];
  if (def.bad && who.status.artifact > 0) {
    who.status.artifact = Math.max(0, who.status.artifact - 1);
    logLine(ctx.battle, `${who.name} 的【神器】抵消了 ${def.name}。`, 'defend');
    fx(ctx.battle, 'status-immune', { uid: who.uid, status: id });
    return 0;
  }
  const before = who.status[id] || 0;
  const after = normStacks(before + v);
  who.status[id] = after;
  if (after !== before) {
    logLine(ctx.battle, `${who.name} ${v >= 0 ? '获得' : '失去'} ${def.name} ${Math.abs(after - before)} 层。`,
      def.bad ? 'bad' : 'good');
    fx(ctx.battle, 'status', { uid: who.uid, status: id, stacks: after, delta: after - before });
  }
  if (after <= 0) delete who.status[id];
  return after - before;
}

export function clearStatuses(who, ids) {
  for (const id of ids) delete who.status[id];
}

// ---------- 伤害 / 格挡 ----------

/** 攻击伤害计算（力量/虚弱/易伤/攻城/虚化/标记 + 遗物） */
/**
 * 攻击伤害结算。
 * raw:true 时 base 视为「最终伤害」——不再叠加力量。
 * 用于「造成等同于你力量层数的伤害」这类文案：力量已经算在 base 里了，
 * 否则会被加第二次。（`debuff`/`buff`/`block`/`heal` 本就不走这里，不受影响。）
 */
export function calcAttackDamage(ctx, attacker, defender, base, raw = false) {
  let d = raw ? base : base + (attacker.status.strength || 0);
  if (attacker.status.weak && !raw) d = Math.floor(d * 0.75);
  const double = ctx.preview ? ctx.preview.doubleNextAttack : ctx.battle?.doubleNextAttack;
  const isCardAttack = ctx.card && (ctx.cardType || cardDef(ctx.card.id)?.type) === 'attack'
    && (ctx.source === 'card' || ctx.source === 'echo');
  const doubleAttack = ctx.doubleAttack ?? (double?.uid === attacker.uid && !double.consumed);
  if (isCardAttack && doubleAttack) {
    d *= 2;
    if (double) double.consumed = true;
  }
  if (attacker.isPlayer) {
    d += relicMod(ctx.run, 'damagePlus') + (ctx.run?.bonusDamage || 0);
    if (!raw && ctx.battle?.eliteFight) d += relicMod(ctx.run, 'eliteDamagePlus');
  }
  // 防御方修正
  if (defender) {
    if (defender.status.vulnerable) d = Math.floor(d * 1.5);
    if (defender.status.siege) d += defender.status.siege;
    if (defender.status.intangible) d = Math.max(0, d - defender.status.intangible);
    if (defender.status.mark) d += defender.status.mark;
  }
  return Math.max(0, Math.floor(d));
}

/** 实际造成伤害（含格挡、荆棘、坚毅） */
export function dealDamage(ctx, attacker, defender, amount, opts = {}) {
  if (!defender || defender.hp <= 0 || amount <= 0) return { blocked: 0, hpLost: 0, dead: false };
  const battle = ctx.battle;
  const ward = defender.isPlayer && attacker && !attacker.isPlayer && opts.attack === true
    && battle.turn === 1 && battle.bossWardReady;
  if (ward) battle.bossWardReady = false;
  if (ctx.preview) {
    ctx.preview.hits.push({ uid: defender.uid, amount: ward ? 0 : amount });
    return { blocked: 0, hpLost: 0, dead: false };
  }
  if (ward) {
    logLine(battle, '【首领护符】抵消了这次攻击。', 'defend');
    fx(battle, 'damage', { uid: defender.uid, amount: 0, blocked: 0, hpLost: 0, lethal: false });
    return { blocked: 0, hpLost: 0, dead: false };
  }
  let dmg = amount;
  let blocked = 0;
  if (!opts.pierce) {
    const absorbed = Math.min(defender.block, dmg);
    blocked = absorbed;
    defender.block -= absorbed;
    dmg -= absorbed;
    // 碎裂：格挡被打光时保留 1 点（每回合一次）
    if (absorbed > 0 && defender.block <= 0 && defender.status.splinter > 0 && !defender.splinterUsed) {
      defender.splinterUsed = true;
      defender.status.splinter -= 1;
      if (defender.status.splinter <= 0) delete defender.status.splinter;
      defender.block = 1;
      logLine(ctx.battle, `${defender.name} 的【碎裂】留下 1 点格挡。`, 'defend');
    }
  }
  let hpLost = 0;
  if (dmg > 0) {
    hpLost = Math.min(defender.hp, dmg);
    defender.hp -= hpLost;
    // 坚毅：致命时保命
    if (defender.hp <= 0 && defender.status.resolve > 0) {
      defender.status.resolve -= 1;
      defender.hp = 1;
      hpLost -= 1;
      logLine(ctx.battle, `${defender.name} 以【坚毅】撑住了最后一击！`, 'defend');
    }
  }
  if (defender.hp <= 0) defender.hp = 0;
  fx(ctx.battle, 'damage', { uid: defender.uid, amount, blocked, hpLost, lethal: defender.hp <= 0 });
  const source = attacker || ctx.self;
  if (ctx.run?.stats && hpLost > 0) {
    const stats = ctx.run.stats;
    if (defender.isPlayer) stats.damageTaken = (stats.damageTaken || 0) + hpLost;
    else if (source?.isPlayer) stats.damageDealt = (stats.damageDealt || 0) + hpLost;
  }
  if (hpLost > 0) {
    if (defender.isPlayer) relicHook(ctx, 'onHpLost', { target: defender, amount: hpLost });
    if (source?.isPlayer && !defender.isPlayer) {
      relicHook(ctx, 'onDamageDealt', { source, target: defender, amount: hpLost });
    }
  }

  // 荆棘
  if (!opts.noThorns && attacker && attacker !== defender && defender.status.thorns > 0 && hpLost > 0) {
    const sub = { ...ctx, self: defender, target: attacker, source: 'thorns',
      perspective: defender.isPlayer ? 'player' : 'enemy' };
    const t = dealDamage(sub, defender, attacker, defender.status.thorns, { pierce: true, noThorns: true });
    logLine(ctx.battle, `【荆棘】反弹 ${t.hpLost} 点伤害给 ${attacker.name}。`, 'counter');
  }

  if (defender.hp <= 0) {
    logLine(ctx.battle, `${defender.name} 被击倒。`, 'kill');
    if (defender.isPlayer) checkPlayerDeath(ctx);
    else onEnemyDeath({ ...ctx, self: source }, defender);
    return { blocked, hpLost, dead: true };
  }
  return { blocked, hpLost, dead: false };
}

export function gainBlock(ctx, who, base) {
  if (!who || who.hp <= 0) return 0;
  if (who.status.bind) base = Math.max(0, base - who.status.bind);
  let b = base + (who.status.dexterity || 0) + (who.isPlayer ? relicMod(ctx.run, 'blockPlus') : 0);
  if (who.status.frail) b = Math.floor(b * 0.75);
  if (who.status.hollow) b = Math.min(b, 1);
  b = Math.max(0, Math.floor(b));
  who.block += b;
  fx(ctx.battle, 'block', { uid: who.uid, amount: b });
  if (who.isPlayer && b > 0) relicHook(ctx, 'onBlock', { target: who, amount: b });
  return b;
}

export function heal(ctx, who, n) {
  if (!who || who.hp <= 0 || who.dead || n <= 0) return 0;
  if (who.isPlayer) n += relicMod(ctx.run, 'healPlus');
  const before = who.hp;
  who.hp = Math.min(who.maxHp, who.hp + n);
  const gained = who.hp - before;
  if (gained > 0) {
    logLine(ctx.battle, `${who.name} 回复 ${gained} 点生命。`, 'heal');
    fx(ctx.battle, 'heal', { uid: who.uid, amount: gained });
  }
  return gained;
}

// ---------- 目标解析 ----------

function livingEnemies(battle) { return battle.enemies.filter((e) => e.hp > 0); }

function resolveTargets(ctx, t) {
  const { battle, self } = ctx;
  if (ctx.inRun && !battle.enemies?.length) {
    // 战斗之外的结算：没有敌人时，「目标」指向自身
    switch (t) {
      case 'self': return [self];
      case 'allEnemies': return [self];
      case 'all': return [self];
      case 'random': return [self];
      case 'target': default: return [self];
    }
  }
  if (ctx.perspective === 'enemy' || ctx.perspective === 'enemy-death') {
    const foe = battle.player;
    switch (t) {
      case 'self': return [self];
      case 'all': return ctx.perspective === 'enemy-death' ? livingEnemies(battle) : (foe?.hp > 0 ? [foe] : []);
      case 'allEnemies': return foe && foe.hp > 0 ? [foe] : [];
      case 'random': return foe && foe.hp > 0 ? [foe] : [];
      case 'target': default: return foe && foe.hp > 0 ? [foe] : [];
    }
  }
  switch (t) {
    case 'self': return [self];
    case 'allEnemies': return livingEnemies(battle);
    case 'all': return [self, ...livingEnemies(battle)];
    case 'random': { const l = livingEnemies(battle); return l.length ? [ctx.rng.pick(l)] : []; }
    case 'target':
    default: return ctx.target ? [ctx.target] : livingEnemies(battle).slice(0, 1);
  }
}

// ---------- 条件 ----------

export function evalCond(cond, ctx) {
  if (!cond) return true;
  const { battle, self, run, rng } = ctx;
  switch (cond.type) {
    case 'hpBelow': return cond.p != null ? self.hp / self.maxHp < cond.p : self.hp < cond.n;
    case 'hpAbove': return cond.p != null ? self.hp / self.maxHp > cond.p : self.hp > cond.n;
    case 'hasStatus': return (self.status[cond.s] || 0) >= (cond.gte ?? 1);
    case 'noStatus': return !(self.status[cond.s] > 0);
    case 'deckCount': return deckCount(ctx, cond.card) >= (cond.gte ?? 1);
    case 'typePlayed': return battle.cardsPlayedThisTurn.filter((c) => c.type === cond.t).length >= (cond.n ?? 1);
    case 'energy': return battle.energy <= (cond.n ?? 0);
    case 'handSize': return battle.hand.length <= (cond.n ?? 0);
    case 'discardSize': return battle.discard.length <= (cond.n ?? 0);
    case 'turn': return battle.turn <= (cond.n ?? 0);
    case 'enemyCount': return livingEnemies(battle).length <= (cond.n ?? 0);
    case 'chance': return rng.chance(cond.p ?? 0.5);
    case 'firstCardOfTurn': return battle.cardsPlayedThisTurn.length === 0;
    case 'lastCardPlayed': return battle.cardsPlayedThisTurn.length > 0;
    case 'targetLow': { const t = ctx.target; return t ? t.hp / t.maxHp < (cond.p ?? 0.4) : false; }
    case 'hasRelic': return hasRelic(run, cond.r);
    default: return false;
  }
}

export function deckCount(ctx, key) {
  const deck = ctx.run?.deck || [];
  let n = 0;
  for (const c of deck) {
    if (c.id === key) { n++; continue; }
    const def = cardDef(c.id);
    if (def?.tags?.includes(key)) n++;
  }
  return n;
}

// ---------- 遗物钩子 ----------

/** 触发遗物钩子；返回是否有任何钩子被触发 */
export function relicHook(ctx, hookName, payload = {}) {
  const run = ctx.run;
  if (!run?.relics || ctx.preview) return false;
  const player = ctx.battle?.player || ctx.self;
  if (!player || player.hp <= 0 || player.dead) return false;
  if (hookName === 'onHpLost' && !payload.target?.isPlayer) return false;
  if (hookName === 'onDamageDealt' && (!payload.source?.isPlayer || payload.target?.isPlayer)) return false;
  if (hookName === 'onBlock' && !payload.target?.isPlayer) return false;
  const owner = ctx.battle || ctx;
  const active = owner.activeRelicHooks ||= new Set();
  let fired = false;
  for (const rid of run.relics) {
    const def = run.relicDefs?.get?.(rid);
    const ops = def?.hooks?.[hookName];
    if (!ops || !ops.length) continue;
    const key = `${rid}:${hookName}`;
    if (active.has(key)) continue;
    fired = true;
    const sub = { ...ctx, hook: hookName, source: 'relic', perspective: 'player',
      self: player, target: payload.target ?? ctx.target, doubleAttack: false };
    active.add(key);
    try { resolveOps(ops, sub); } catch (e) { console.error(`[relic:${rid}:${hookName}]`, e); }
    finally { active.delete(key); }
  }
  return fired;
}

// ---------- 命名自定义效果（白名单） ----------

const CUSTOM = {
  shuffleDiscardToDeck(ctx) {
    const { battle } = ctx;
    if (!battle.discard.length) return;
    battle.draw.push(...battle.discard);
    battle.discard = [];
    logLine(battle, `弃牌堆被洗回抽牌堆（${battle.draw.length} 张）。`, 'good');
  },
  shuffleDrawPile(ctx) {
    const { battle, rng } = ctx;
    battle.draw = rng.shuffle(battle.draw);
    logLine(battle, '抽牌堆被洗乱。', 'info');
  },
  doubleNextAttack(ctx) {
    if (!ctx.battle.doubleNextAttack) ctx.battle.doubleNextAttack = { uid: ctx.self.uid, consumed: false };
    else ctx.battle.doubleNextAttack.consumed = false;   // 重复施加时刷新
    logLine(ctx.battle, '下一张攻击牌伤害翻倍。', 'good');
  },
  healPerHandCard(ctx, o = {}) {
    const n = resolveValue(o.n ?? 1, ctx) * resolveValue('hand', ctx);
    heal(ctx, ctx.self, n);
  },
  burnPerCardInHand(ctx) {
    for (let i = 0; i < resolveValue('hand', ctx); i++) {
      const list = livingEnemies(ctx.battle);
      if (!list.length) break;
      const t = ctx.rng.pick(list);
      dealDamage(ctx, ctx.self, t, 2);
    }
  },
  loseEnergyThenDraw(ctx, o = {}) {
    const n = resolveValue(o.n ?? 1, ctx);
    ctx.battle.energy = Math.max(0, ctx.battle.energy - n);
    drawCards(ctx, 2);
  },
  grantRandomRelic(ctx) {
    if (!ctx.onGrantRelic) return;
    const { run, battle } = ctx;
    const hpBefore = run?.hp;
    const maxHpBefore = run?.maxHp;
    ctx.onGrantRelic();
    const player = battle?.player || ctx.self;
    if (!run || !player || player === run) return;
    // run.hp can lag earlier effects; transfer only the grant's HP deltas.
    player.maxHp = Math.max(1, player.maxHp + run.maxHp - maxHpBefore);
    if (player.hp > 0 && !player.dead) {
      player.hp = Math.max(0, Math.min(player.maxHp, player.hp + run.hp - hpBefore));
    }
  },
  convertDeckToBurn(ctx, o = {}) {
    const p = o.p ?? 0.5;
    const deck = ctx.run?.deck || [];
    const attacks = deck.filter((c) => cardDef(c.id)?.type === 'attack');
    const n = Math.max(1, Math.round(attacks.length * p));
    ctx.rng.sample(attacks, n).forEach((c) => { c.id = 'c_ember_slash'; });
    logLine(ctx.battle, `${n} 张攻击牌被灼热重铸。`, 'good');
  },
};

// ---------- 牌堆操作 ----------

function handLimit(ctx) {
  return 10 + relicMod(ctx.run, 'handPlus') + (ctx.battle.player?.status?.overload || 0);
}

export function drawCards(ctx, n) {
  const { battle, rng } = ctx;
  let drawn = 0;
  const cap = handLimit(ctx);
  const ent = battle.player?.status?.entangled || 0;
  if (ent > 0) {
    const lost = Math.min(n, ent);
    n -= lost;
    logLine(battle, `【缠绕】使你少抽了 ${lost} 张牌。`, 'bad');
  }
  for (let i = 0; i < n; i++) {
    if (battle.hand.length >= cap) {
      logLine(battle, '手牌已满。', 'warn');
      break;
    }
    if (!battle.draw.length) {
      if (!battle.discard.length) break;
      battle.draw = rng.shuffle(battle.discard);
      battle.discard = [];
      logLine(battle, '弃牌堆洗回。', 'info');
      fx(battle, 'reshuffle', {});
    }
    const card = battle.draw.pop();
    if (!card) break;
    battle.hand.push(card);
    drawn++;
    fx(battle, 'draw', { cardId: card.id });
  }
  return drawn;
}

// ---------- 主解析 ----------

export function resolveOps(ops, ctx) {
  if (!ops || !ops.length) return;
  for (const op of ops) {
    try { execOp(op, ctx); } catch (e) { console.error('[effect]', JSON.stringify(op), e); }
  }
}

function execOp(op, ctx) {
  const { battle, self, rng, run } = ctx;
  if (!op || !op.op) return;

  switch (op.op) {
    // ---- 伤害 ----
    case 'damage': {
      const targets = resolveTargets(ctx, op.t || 'target');
      const base = resolveValue(op.v ?? 0, ctx);
      for (const t of targets) {
        if (t.hp <= 0) continue;
        const dmg = calcAttackDamage(ctx, self, t, base, op.raw === true);
        dealDamage(ctx, self, t, dmg, { attack: true });
      }
      break;
    }
    case 'damageAll': {
      const base = resolveValue(op.v ?? 0, ctx);
      for (const t of resolveTargets(ctx, 'allEnemies')) {
        const dmg = calcAttackDamage(ctx, self, t, base, op.raw === true);
        dealDamage(ctx, self, t, dmg, { attack: true });
      }
      break;
    }
    // ---- 格挡 ----
    case 'block': case 'blockAll': {
      gainBlock(ctx, self, resolveValue(op.v ?? 0, ctx));
      break;
    }
    case 'doubleBlock': {
      self.block *= 2;
      fx(battle, 'block', { uid: self.uid, amount: self.block });
      logLine(battle, `${self.name} 的格挡翻倍为 ${self.block}。`, 'good');
      break;
    }
    // ---- 生命 ----
    case 'heal': heal(ctx, self, resolveValue(op.n ?? 0, ctx)); break;
    case 'loseHp': {
      const n = resolveValue(op.n ?? 0, ctx);
      const r = dealDamage(ctx, null, self, n, { pierce: true, noThorns: true });
      logLine(battle, `${self.name} 失去 ${r.hpLost} 点生命。`, 'bad');
      break;
    }
    case 'maxHp': {
      const n = resolveValue(op.n ?? 0, ctx);
      self.maxHp = Math.max(1, self.maxHp + n);
      if (self.hp > 0 && !self.dead) self.hp = Math.max(0, Math.min(self.maxHp, self.hp + n));
      if (run && self.isPlayer) run.maxHp = Math.max(1, run.maxHp + n);
      logLine(battle, `最大生命 ${n >= 0 ? '+' : ''}${n}。`, n >= 0 ? 'good' : 'bad');
      fx(battle, 'maxhp', { uid: self.uid, delta: n });
      break;
    }
    // ---- 状态 ----
    case 'buff': case 'debuff': {
      const n = resolveValue(op.v ?? 0, ctx);
      if (!n) break;
      for (const t of resolveTargets(ctx, op.t || 'target')) addStatus(ctx, t, op.s, n);
      break;
    }
    // ---- 牌 / 能量 ----
    case 'draw': drawCards(ctx, resolveValue(op.n ?? 1, ctx)); break;
    case 'energy': battle.energy += resolveValue(op.n ?? 1, ctx); break;
    case 'scry': battle.pending.push({ kind: 'scry', n: resolveValue(op.n ?? 1, ctx) }); break;
    case 'addHand': case 'addDiscard': case 'shuffleIn': {
      const id = op.card; const n = resolveValue(op.n ?? 1, ctx);
      if (!cardDef(id)) { console.warn('[effect] 未知卡牌', id); break; }
      for (let i = 0; i < n; i++) {
        const inst = { id, uid: `${id}#${battle.uidSeq++}`, upgraded: false };
        if (op.op === 'addHand') {
          if (battle.hand.length < handLimit(ctx)) battle.hand.push(inst);
          else battle.discard.push(inst);
        }
        else if (op.op === 'addDiscard') battle.discard.push(inst);
        else battle.draw.splice(rng.int(0, battle.draw.length), 0, inst);
        triggerCurse(ctx, id);
      }
      logLine(battle, `${n >= 1 ? n : 1} 张【${cardDef(id)?.name}】加入${op.op === 'addHand' ? '手牌' : '牌堆'}。`, 'good');
      break;
    }
    case 'addDeck': {
      if (!run) break;
      if (op.card && !cardDef(op.card)) { console.warn('[effect] addDeck 未知卡牌', op.card); break; }
      run.deck.push({ id: op.card, uid: `deck#${run.deckSeq++}`, upgraded: false });
      if (run.stats) run.stats.cardsAdded = (run.stats.cardsAdded || 0) + 1;
      if (op.card) {
        if (op.card) logLine(battle, `【${cardDef(op.card)?.name}】永久加入牌组。`, 'good');
        triggerCurse(ctx, op.card);
      }
      break;
    }
    case 'exhaustSelf': if (ctx.card) ctx.exhaustCard = true; break;
    case 'retainSelf': if (ctx.card) ctx.card.retain = true; break;
    case 'removeCard': {
      if (!run?.deck?.length) break;
      const i = rng.int(0, run.deck.length - 1);
      const removed = run.deck.splice(i, 1)[0];
      if (run.stats) run.stats.cardsRemoved = (run.stats.cardsRemoved || 0) + 1;
      logLine(battle, `【${cardDef(removed.id)?.name}】已从牌组中永久移除。`, 'good');
      fx(battle, 'card-removed', { cardId: removed.id });
      break;
    }
    case 'upgradeCard': {
      const n = resolveValue(op.n ?? 1, ctx);
      const cands = run?.deck?.filter((c) => !c.upgraded && cardDef(c.id)?.upgrade) || [];
      for (const c of rng.sample(cands, n)) {
        c.upgraded = true;
        logLine(battle, `【${cardDef(c.id)?.name}】已升级。`, 'good');
        fx(battle, 'card-upgraded', { cardId: c.id });
      }
      break;
    }
    // ---- 资源 ----
    case 'gold': {
      const n = resolveValue(op.n ?? 0, ctx);
      if (run) {
        run.gold = Math.max(0, run.gold + n);
        if (n > 0) run.stats.goldEarned = (run.stats.goldEarned || 0) + n;
      }
      logLine(battle, n >= 0 ? `获得 ${n} 金币。` : `失去 ${-n} 金币。`, n >= 0 ? 'good' : 'bad');
      break;
    }
    // ---- 控制流 ----
    case 'repeat': {
      const n = resolveValue(op.n ?? 1, ctx);
      for (let i = 0; i < n; i++) resolveOps(op.then, { ...ctx, _rep: i });
      break;
    }
    case 'if': {
      if (evalCond(op.cond, ctx)) resolveOps(op.then, ctx);
      else resolveOps(op.else, ctx);
      break;
    }
    case 'custom': {
      const fn = CUSTOM[op.fn];
      if (!fn) { console.warn('[effect] 未知 custom:', op.fn); break; }
      fn(ctx, op);
      break;
    }
    case 'skill': break;
    default:
      console.warn('[effect] 未知 op:', op.op);
  }
}

export function onEnemyDeath(ctx, enemyC) {
  const { battle, self } = ctx;
  if (!enemyC || enemyC.hp > 0 || enemyC.isPlayer || enemyC.dead || ctx.preview) return;
  enemyC.dead = true;
  fx(battle, 'enemy-death', { uid: enemyC.uid });
  // 敌人 onDeath（作用于存活同伴）
  const def = enemyC.def;
  if (def?.onDeath?.length) {
    const sub = { ...ctx, self: enemyC, target: null, source: 'enemy-death',
      perspective: 'enemy-death', card: null, doubleAttack: false };
    resolveOps(def.onDeath, sub);
  }
  if (self?.isPlayer) {
    ctx.run?.onEnemyKill?.(enemyC);
    if (ctx.run) relicHook(ctx, 'onKill', { target: enemyC, ctx });
  }
}

export function checkPlayerDeath(ctx) {
  const player = ctx.battle?.player;
  if (!player || player.hp > 0 || ctx.preview) return false;
  player.hp = 0;
  player.dead = true;
  return true;
}
