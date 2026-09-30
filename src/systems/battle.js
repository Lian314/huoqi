// ============ 回合制战斗引擎 ============
import { STATUS } from '../data/index.js';
import { RNG } from '../core/rng.js';
import { cardDisplay } from '../core/run.js';
import { describe } from './describe.js';
import { regionById, encounterById } from '../data/regions.js';
import {
  resolveOps, drawCards, gainBlock, dealDamage, heal, addStatus,
  logLine, relicHook, checkPlayerDeath, fx,
} from './effects.js';
import { clamp } from '../core/utils.js';

let BATTLE_ID = 0;

export function makeCombatant(opts) {
  const hpMax = opts.maxHp;
  return {
    uid: opts.uid,
    defId: opts.defId,
    name: opts.name,
    glyph: opts.glyph || '?',
    color: opts.color || '#888',
    size: opts.size || 'normal',
    isPlayer: !!opts.isPlayer,
    hp: clamp(opts.hp ?? hpMax, 0, hpMax),
    maxHp: hpMax,
    block: 0,
    status: {},
    def: opts.def || null,
    moves: opts.moves || [],
    intent: null,
    forcedNext: null,
    usedMoves: new Set(),
    shake: 0,
    flash: 0,
    dead: false,
  };
}

/** 组合一场战斗的敌人 */
export function pickEncounter(run, act, tier, opts = {}) {
  const region = run.map?.act === act ? regionById(run.map.regionId) : null;
  if (region) {
    const node = run.map.grid.flat().find((entry) => entry.id === run.map.currentId);
    const fixed = encounterById(region.id, opts.encounterId || node?.encounterId);
    const pool = region.encounters.filter((entry) => entry.tier === tier);
    const picked = fixed?.tier === tier ? fixed : run.rng.weighted(pool, (entry) => entry.weight || 1);
    if (picked) return picked.enemies.map((id) => run.pool.enemies.get(id)).filter(Boolean);
  }
  const all = Array.from(run.pool.enemies.values());
  if (tier === 'boss') {
    const bosses = all.filter((e) => e.act === act && e.tier === 'boss');
    return [pickOne(run, bosses)];
  }
  if (tier === 'elite') {
    const elites = all.filter((e) => e.act === act && e.tier === 'elite');
    return [pickOne(run, elites)];
  }
  if (tier === 'sentry') {
    const s = all.filter((e) => e.tier === 'normal' && e.hp[1] <= 14);
    return [pickOne(run, s)];
  }
  const normals = all.filter((e) => e.act === act && e.tier === 'normal');
  // 1/4 概率双怪
  const count = normals.length > 2 && rng2(run).chance(0.28) ? 2 : 1;
  return Array.from({ length: count }, () => pickOne(run, normals));
}

function rng2(run) { return run.rng; }

function pickOne(run, arr) {
  if (!arr.length) return null;
  return run.rng.pick(arr);
}

export function startBattle(run, encounter, opts = {}) {
  const rng = new RNG((run.seed + run.encounterCount * 7919 + run.rng.calls) >>> 0);
  const battle = {
    id: ++BATTLE_ID,
    rng,
    run,
    uidSeq: 1,
    turn: 0,
    phase: 'start',       // start | player | enemy | won | lost
    energy: 0,
    maxEnergy: 3,
    draw: [],
    hand: [],
    discard: [],
    exhaustPile: [],
    powers: [],
    cardsPlayedThisTurn: [],
    cardsPlayedAll: [],
    pending: [],
    log: [],
    fx: [],
    eliteFight: opts.tier === 'elite' || opts.tier === 'boss',
    tier: opts.tier || 'normal',
    doubleNextAttack: null,
    tutorial: opts.tutorial || false,
    bossWardReady: !!run.bossWard,
    region: regionById(opts.regionId),
    encounterName: opts.encounterName || '',
    siteWave: opts.siteWave || null,
    extraEnemyStart: opts.enemyStart || [],
    blessings: (run.blessings || []).filter((entry) => entry.remaining > 0).map((entry) => ({ ...entry })),
  };

  // 玩家
  const maxHp = run.maxHp;
  battle.player = makeCombatant({
    uid: 'player', name: run.charName, glyph: run.charGlyph, color: run.charColor,
    maxHp, hp: run.hp, isPlayer: true, defId: run.characterId,
  });
  // 跨局继承的灼烧等（角色特性）
  if (run.carryStatuses) {
    for (const [k, v] of Object.entries(run.carryStatuses)) battle.player.status[k] = v;
  }

  // 敌人
  battle.enemies = encounter.filter(Boolean).map((def, i) => {
    const hp = rng.int(def.hp[0], def.hp[1]);
    const c = makeCombatant({
      uid: `e${i}`, defId: def.id, name: def.name, glyph: def.glyph, color: def.color,
      size: def.size, maxHp: hp, def, moves: def.moves,
    });
    c.maxHpBase = hp;
    return c;
  });

  // 洗牌起始牌组
  battle.draw = run.deck.map((c) => ({ ...c }));
  battle.draw = rng.shuffle(battle.draw);

  // 遗物：战斗开始
  const ctx = makeCtx(battle, battle.player, null, 'battle');
  relicHook(ctx, 'onBattleStart', { ctx });
  for (const e of battle.enemies) {
    if (e.def?.onBattleStart?.length) resolveOps(e.def.onBattleStart, makeCtx(battle, e, battle.player, 'enemy', true));
    if (battle.region?.rule.enemyStart?.length) resolveOps(battle.region.rule.enemyStart, makeCtx(battle, e, battle.player, 'region', true));
    if (battle.extraEnemyStart.length) resolveOps(battle.extraEnemyStart, makeCtx(battle, e, battle.player, 'site', true));
  }
  if (battle.region?.rule.playerStart?.length) resolveOps(battle.region.rule.playerStart, ctx);
  for (const entry of run.blessings || []) if (entry.remaining > 0) entry.remaining -= 1;
  run.blessings = (run.blessings || []).filter((entry) => entry.remaining > 0);

  logLine(battle, `⚔ 战斗开始：${battle.enemies.map((e) => e.name).join('、')}`.replace('⚔ ', '⚔ '), 'battle');
  startTurn(battle);
  return battle;
}

export function makeCtx(battle, self, target, source, fromEnemy = false, card = null) {
  return {
    battle,
    run: battle.run,
    self,
    target,
    source,
    card,
    rng: battle.rng,
    perspective: fromEnemy ? 'enemy' : 'player',
    exhaustCard: false,
    onGrantRelic: () => battle.run.grantRelic?.('random'),
  };
}

// ---------- 回合流程 ----------

export function startTurn(battle) {
  if (battle.phase === 'won' || battle.phase === 'lost') return;
  if (checkBattleEnd(battle)) return;
  battle.turn += 1;
  if (battle.run.stats) battle.run.stats.turns = (battle.run.stats.turns || 0) + 1;
  if (battle.turn > 1) battle.bossWardReady = false;
  battle.phase = 'player';
  battle.cardsPlayedThisTurn = [];
  // 注意：这里【不清】doubleNextAttack。卡面写的是「本场战斗下一张攻击牌伤害翻倍」，
  // 该标记应一直存活到被下一次攻击消费为止（见 calcAttackDamage）。

  const p = battle.player;
  const ctx = makeCtx(battle, p, null, 'turn');

  // 格挡在回合开始时清空；【壁垒】可使其跨回合保留
  if (!(p.status.barricade > 0)) p.block = 0;
  p.splinterUsed = false;   // 碎裂每回合只触发一次

  // 最大能量
  battle.maxEnergy = 3 + relicModOf(battle, 'energyPlus');
  battle.energy = battle.maxEnergy;

  // 回合开始状态
  // 仪式：每回合开始转化为等量力量，然后清空自身（与 statuses.js 文案一致）
  if (p.status.ritual) {
    const n = p.status.ritual;
    addStatus(ctx, p, 'strength', n);
    p.status.ritual = 0;
    logLine(battle, `【仪式】为你带来 ${n} 点力量。`, 'good');
  }
  if (p.status.haste) drawCards(ctx, p.status.haste);

  // 遗物：回合开始
  relicHook(ctx, 'onTurnStart', { ctx, self: p, target: null });
  if (battle.turn === 1) {
    if (battle.region?.rule.firstTurn?.length) resolveOps(battle.region.rule.firstTurn, ctx);
    for (const entry of battle.blessings) resolveOps(entry.firstTurn, ctx);
  }

  // 敌人入场效果
  for (const e of battle.enemies) {
    if (e.hp > 0 && e.def?.onTurnStart?.length) {
      resolveOps(e.def.onTurnStart, makeCtx(battle, e, p, 'enemy', true));
    }
  }

  // 抽牌
  const drawN = 5 + relicModOf(battle, 'drawPlus') + (battle.run.bonusDraw || 0) + (p.status.overload || 0)
    + (battle.turn === 1 ? (battle.run.firstTurnDrawPlus || 0) : 0);
  drawCards(ctx, drawN);

  // 敌人意图
  rollIntents(battle);
  if (p.status.shroud) { /* 意图隐藏由 UI 处理 */ }

  fx(battle, 'turn-start', { turn: battle.turn });
  checkBattleEnd(battle);
}

function relicModOf(battle, key) {
  let t = 0;
  for (const rid of battle.run.relics || []) {
    const d = battle.run.relicDefs?.get?.(rid);
    const v = d?.mod?.[key];
    if (typeof v === 'number') t += v;
  }
  return t;
}

export function rollIntents(battle) {
  for (const e of battle.enemies) {
    if (e.hp <= 0) continue;
    const move = chooseMove(battle, e);
    if (!move) continue;
    e.forcedNext = move.next || null;
    if (move.once) e.usedMoves.add(move.id);
    const hide = (battle.player.status.shroud || 0) > 0 && battle.rng.chance(0.25);
    e.intent = {
      moveId: move.id, name: move.name, kind: move.intent || 'unknown',
      tell: move.tell || '', hidden: hide,
      dmg: 0,
    };
  }
  refreshIntents(battle);
}

export function refreshIntents(battle) {
  if (!battle.enemies.some((e) => e.hp > 0 && e.intent)) return;
  const copyUnit = (c) => ({ ...c, status: { ...c.status }, usedMoves: new Set(c.usedMoves) });
  const copyCards = (cards) => cards.map((c) => ({ ...c }));
  const rng = new RNG(1);
  rng.seed = battle.rng.seed;
  rng.calls = battle.rng.calls;
  const run = { ...battle.run, deck: copyCards(battle.run.deck), relics: [...battle.run.relics],
    stats: { ...battle.run.stats }, grantRelic: () => null, onEnemyKill: () => {} };
  const projected = { ...battle, run, rng, player: copyUnit(battle.player),
    enemies: battle.enemies.map(copyUnit), hand: copyCards(battle.hand), draw: copyCards(battle.draw),
    discard: copyCards(battle.discard), exhaustPile: copyCards(battle.exhaustPile),
    powers: copyCards(battle.powers), cardsPlayedThisTurn: [...battle.cardsPlayedThisTurn],
    pending: [], log: [], fx: [], activeRelicHooks: new Set(),
    doubleNextAttack: battle.doubleNextAttack ? { ...battle.doubleNextAttack } : null };
  // Preview the announced moves on copies, without running relics or committing damage.
  if (battle.phase === 'player') {
    decayStatuses(null, projected.player);
    const retained = [];
    for (const inst of projected.hand) {
      const def = cardDisplay(run, inst);
      if (inst.retain || def?.retain) retained.push(inst);
      else if (def?.ethereal) projected.exhaustPile.push(inst);
      else projected.discard.push(inst);
    }
    projected.hand = retained;
  }
  const preview = { hits: [], doubleNextAttack: projected.doubleNextAttack };
  for (let i = 0; i < projected.enemies.length; i++) {
    const e = projected.enemies[i];
    const live = battle.enemies[i];
    if (e.hp <= 0 || !e.intent) continue;
    const move = e.def?.moves?.find((m) => m.id === e.intent.moveId);
    if (!move) continue;
    if (!(e.status.barricade > 0)) e.block = 0;
    if (e.status.ritual) {
      e.status.strength = (e.status.strength || 0) + e.status.ritual;
      e.status.ritual = 0;
    }
    preview.hits = [];
    const ctx = makeCtx(projected, e, projected.player, 'enemy', true);
    ctx.preview = preview;
    resolveOps(move.effects || [], ctx);
    live.intent.dmg = preview.hits.filter((h) => h.uid === projected.player.uid)
      .reduce((total, h) => total + h.amount, 0);
    decayStatuses(null, e);
  }
}

export function chooseMove(battle, e) {
  const def = e.def;
  if (!def?.moves?.length) return null;
  if (e.forcedNext) {
    const m = def.moves.find((x) => x.id === e.forcedNext);
    e.forcedNext = null;
    if (m && moveAllowed(battle, e, m)) return m;
  }
  let cands = def.moves.filter((m) => moveAllowed(battle, e, m));
  if (!cands.length) cands = def.moves.filter((m) => !m.requireTurn && !m.requireHpBelow && !m.requireHpAbove);
  if (!cands.length) cands = def.moves;
  return battle.rng.weighted(cands, (m) => m.weight ?? 1) || def.moves[0];
}

function moveAllowed(battle, e, m) {
  if (m.once && e.usedMoves.has(m.id)) return false;
  if (m.requireTurn) {
    const [a, b] = m.requireTurn;
    if (battle.turn < a || (b != null && battle.turn > b)) return false;
  }
  if (m.requireHpBelow != null && e.hp / e.maxHp >= m.requireHpBelow) return false;
  if (m.requireHpAbove != null && e.hp / e.maxHp <= m.requireHpAbove) return false;
  if (m.requireStatusPlayer) {
    const s = battle.player.status[m.requireStatusPlayer.s] || 0;
    if (s < (m.requireStatusPlayer.gte ?? 1)) return false;
  }
  if (m.requireSelfStatus) {
    const s = e.status[m.requireSelfStatus.s] || 0;
    if (s < (m.requireSelfStatus.gte ?? 1)) return false;
  }
  return true;
}

// ---------- 出牌 ----------

export function cardCost(battle, def) {
  let c = def.cost;
  if (c < 0) return battle.energy;      // X 费
  const focus = battle.player.status.focus || 0;
  if (focus > 0) c -= 1;
  return Math.max(0, c);
}

export function canPlay(battle, inst) {
  const def = cardDisplay(battle.run, inst);
  if (!def) return { ok: false, why: '未知卡牌' };
  if (def.playable === false) return { ok: false, why: '这张牌无法打出' };
  if (battle.phase !== 'player' || battle.player.hp <= 0) return { ok: false, why: '现在不是你的回合' };
  const cost = cardCost(battle, def);
  if (battle.energy < cost) return { ok: false, why: '能量不足' };
  if (def.target === 'enemy') {
    const alive = battle.enemies.filter((e) => e.hp > 0);
    if (!alive.length) return { ok: false, why: '没有目标' };
  }
  return { ok: true, cost, def };
}

export function playCard(battle, cardUid, targetUid = null) {
  const idx = battle.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return { ok: false, why: '手牌中没有这张牌' };
  const inst = battle.hand[idx];
  const check = canPlay(battle, inst);
  if (!check.ok) return check;
  const def = check.def;

  const target = targetUid ? battle.enemies.find((e) => e.uid === targetUid && e.hp > 0) : null;
  if (def.target === 'enemy' && !target) return { ok: false, why: '请选择一个目标' };

  battle.energy -= check.cost;
  if ((battle.player.status.focus || 0) > 0 && def.cost >= 0) {
    addStatus(makeCtx(battle, battle.player, null, 'play'), battle.player, 'focus', -1);
  }
  const handAtPlay = battle.hand.length;   // 「每有一张手牌」按打出瞬间计，含本张
  const echoReady = (battle.player.status.echo || 0) > 0;
  battle.hand.splice(idx, 1);
  fx(battle, 'card-played', { cardId: inst.id, uid: inst.uid });

  const ctx = makeCtx(battle, battle.player, target, 'card', false, inst);
  ctx.handAtPlay = handAtPlay;
  ctx.cardType = def.type;
  ctx.doubleAttack = !!(def.type === 'attack' && battle.doubleNextAttack?.uid === battle.player.uid
    && !battle.doubleNextAttack.consumed);
  const effects = def.effects || [];
  resolveOps(effects, ctx);

  // 打出后置效果
  if (def.type === 'attack' && battle.player.hp > 0) {
    if (battle.player.status.fury) {
      const alive = battle.enemies.filter((e) => e.hp > 0);
      if (alive.length) {
        const t = battle.rng.pick(alive);
        dealDamage(ctx, battle.player, t, 1);
      }
    }
    if (battle.player.status.leech) heal(ctx, battle.player, 1);
    relicHook(ctx, 'onAttack', { ctx, self: battle.player, target });
  }
  // 回响：再触发一次
  if (echoReady && battle.player.hp > 0 && (battle.player.status.echo || 0) > 0 && !inst._echoUsed) {
    addStatus(ctx, battle.player, 'echo', -1);
    inst._echoUsed = true;
    const echoCtx = makeCtx(battle, battle.player, target, 'echo', false, inst);
    echoCtx.handAtPlay = handAtPlay;
    echoCtx.cardType = def.type;
    echoCtx.doubleAttack = ctx.doubleAttack;
    resolveOps(effects, echoCtx);
    ctx.exhaustCard ||= echoCtx.exhaustCard;
    inst._echoUsed = false;
  }

  relicHook(ctx, 'onCardPlay', { ctx, self: battle.player, target, cardId: inst.id, type: def.type });
  // A setup card keeps its marker; one attack card consumes it after all hits and echo.
  if (battle.doubleNextAttack?.consumed) battle.doubleNextAttack = null;

  battle.cardsPlayedThisTurn.push(def);
  battle.cardsPlayedAll.push(def);
  if (battle.run?.stats) battle.run.stats.cardsPlayed = (battle.run.stats.cardsPlayed || 0) + 1;

  // 归位
  if (def.type === 'power') {
    battle.powers.push({ id: inst.id, uid: inst.uid, name: def.name, glyph: def.art || def.name[0], upgraded: inst.upgraded });
    battle.exhaustPile.push(inst);
  } else if (def.exhaust || ctx.exhaustCard) {
    battle.exhaustPile.push(inst);
  } else {
    battle.discard.push(inst);
  }

  checkBattleEnd(battle);
  if (battle.phase === 'player') refreshIntents(battle);
  return { ok: true };
}

// ---------- 结束回合 ----------

export function endTurn(battle) {
  if (battle.phase !== 'player') return;
  const p = battle.player;
  const ctx = makeCtx(battle, p, null, 'turn-end');

  // 弃掉手牌
  const retained = [];
  for (const c of battle.hand) {
    const def = cardDisplay(battle.run, c);
    if (c.retain || def?.retain) { retained.push(c); continue; }
    if (def?.ethereal) { battle.exhaustPile.push(c); continue; }
    battle.discard.push(c);
  }
  battle.hand = retained;
  fx(battle, 'hand-cleared', {});

  // 回合结束状态
  endOfTurnStatuses(ctx, p);
  relicHook(ctx, 'onTurnEnd', { ctx, self: p, target: null });
  decayStatuses(ctx, p);
  if (checkBattleEnd(battle)) return;

  // 敌人回合
  battle.phase = 'enemy';
  fx(battle, 'enemy-turn', {});
  runEnemyTurn(battle);
}

function endOfTurnStatuses(ctx, who) {
  const s = who.status;
  if (s.poison > 0) {
    dealDamage(ctx, null, who, s.poison, { pierce: true, noThorns: true });
  }
  if (s.burn > 0) {
    dealDamage(ctx, null, who, s.burn, { pierce: true, noThorns: true });
  }
  if (s.drain > 0) {
    const n = s.drain;
    const r = dealDamage(ctx, null, who, n, { pierce: true, noThorns: true });
    if (who.isPlayer) heal(ctx, who, r.hpLost);
    s.drain = Math.floor(n / 2);
    if (s.drain <= 0) delete s.drain;
  }
  if (s.regen > 0) heal(ctx, who, s.regen);
  if (s.metallicize > 0) gainBlock(ctx, who, s.metallicize);
  if (s.static > 0 && who.isPlayer) ctx.battle.energy += s.static;
}

export function decayStatuses(ctx, who) {
  for (const [id, v] of Object.entries({ ...who.status })) {
    const def = STATUS[id];
    if (!def) continue;
    if (def.decay === 'turn') {
      const nv = v - 1;
      if (nv <= 0) delete who.status[id];
      else who.status[id] = nv;
    }
  }
}

function runEnemyTurn(battle) {
  const p = battle.player;
  for (const e of battle.enemies) {
    if (e.hp <= 0) continue;
    if (battle.phase === 'lost') break;

    // 敌人格挡在其回合开始时清空（与玩家同一规则）
    if (!(e.status.barricade > 0)) e.block = 0;
    e.splinterUsed = false;

    // 仪式：敌人回合开始转化为等量力量（与玩家 startTurn 同一套语义）
    if (e.status.ritual) {
      const n = e.status.ritual;
      addStatus(makeCtx(battle, e, p, 'enemy', true), e, 'strength', n);
      e.status.ritual = 0;
      logLine(battle, `${e.name} 的【仪式】带来 ${n} 点力量。`, 'enemy');
    }

    const intent = e.intent;
    const move = (intent && e.def?.moves?.find((m) => m.id === intent.moveId)) || chooseMove(battle, e);
    if (!move) continue;
    if (move.once) e.usedMoves.add(move.id);
    e.forcedNext = move.next || null;
    const ctx = makeCtx(battle, e, p, 'enemy', true);
    logLine(battle, `${e.name} 使用了【${move.name}】。`, 'enemy');
    fx(battle, 'enemy-act', { uid: e.uid, intent: move.intent });
    resolveOps(move.effects || [], ctx);
    e.intent = null;

    // 敌人回合结束状态：灼烧/中毒/再生/金属化结算，然后衰减
    // 缺了这一步，敌人身上的状态永远不结算、也不衰减——整套 debuff 构筑形同虚设。
    // 用玩家视角的 ctx，让日志措辞与击杀归属（统计 / 遗物 onKill）都算在玩家头上。
    if (e.hp > 0) {
      const pctx = makeCtx(battle, battle.player, e, 'player', false);
      endOfTurnStatuses(pctx, e);
      decayStatuses(pctx, e);
    }

    // 敌人回合结算后检查
    if (p.hp <= 0) break;
  }
  if (checkBattleEnd(battle)) return;
  startTurn(battle);
}

export function checkBattleEnd(battle) {
  const p = battle.player;
  if (p.hp <= 0) {
    checkPlayerDeath(makeCtx(battle, p, null, 'battle-end'));
    if (battle.phase === 'lost') return true;
    battle.phase = 'lost';
    logLine(battle, '你倒下了……', 'lose');
    fx(battle, 'lose', {});
    return true;
  }
  if (battle.phase === 'won' || battle.phase === 'lost') return true;
  if (battle.enemies.every((e) => e.hp <= 0)) {
    battle.phase = 'won';
    logLine(battle, '战斗胜利！', 'win');
    fx(battle, 'win', {});
    return true;
  }
  return false;
}

// ---------- 药水 ----------

export function usePotion(battle, potionId, targetUid = null) {
  if (battle.phase !== 'player' || battle.player.hp <= 0) return { ok: false, why: '现在不能使用药水' };
  const run = battle.run;
  const i = run.potions.indexOf(potionId);
  if (i < 0) return { ok: false, why: '没有这瓶药水' };
  const def = run.pool.potions.get(potionId);
  if (!def) return { ok: false, why: '药水数据缺失' };
  const target = targetUid ? battle.enemies.find((e) => e.uid === targetUid && e.hp > 0) : null;
  if (def.target === 'target' && !target) return { ok: false, why: '请选择目标' };
  run.potions.splice(i, 1);
  if (run.stats) run.stats.potionsUsed = (run.stats.potionsUsed || 0) + 1;
  const ctx = makeCtx(battle, battle.player, target, 'potion');
  logLine(battle, `饮下【${def.name}】。`, 'potion');
  resolveOps(potionEffects(run, def), ctx);
  checkBattleEnd(battle);
  if (battle.phase === 'player') refreshIntents(battle);
  return { ok: true };
}

// ---------- 跨局状态继承（角色特性） ----------

export function potionEffects(run, def) {
  const power = Math.max(0, Number(run.potionPower) || 0);
  const scalable = new Set(['damage', 'damageAll', 'block', 'heal', 'energy', 'draw', 'scry', 'buff', 'debuff']);
  const boost = (ops) => (ops || []).map((op) => {
    const out = { ...op };
    if (scalable.has(op.op) && !['barricade', 'doubleNextAttack'].includes(op.s)) {
      for (const key of ['v', 'n']) {
        if (typeof out[key] === 'number' && out[key] > 0) out[key] += power;
      }
    }
    if (op.then) out.then = boost(op.then);
    if (op.else) out.else = boost(op.else);
    return out;
  });
  return boost(def.effects);
}

export function potionDisplay(run, def) {
  if (!def || !(run.potionPower > 0)) return def;
  return { ...def, desc: describe(potionEffects(run, def)) };
}

export function syncBattleRun(battle) {
  const { run, player } = battle;
  run.maxHp = Math.max(1, player.maxHp);
  run.hp = clamp(player.hp, 0, run.maxHp);
  if (run.characterId === 'ch_ashborn') {
    const burn = Math.floor((player.status.burn || 0) / 2);
    run.carryStatuses = burn > 0 ? { burn } : null;
  }
  return run;
}

export function exportCarry(run) {
  if (!run.carryStatuses) return null;
  const out = {};
  for (const [k, v] of Object.entries(run.carryStatuses)) {
    const half = Math.floor(v / 2);
    if (half > 0) out[k] = half;
  }
  return out;
}

export { clamp };
