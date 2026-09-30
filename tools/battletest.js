#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const source = (name) => pathToFileURL(path.join(__dirname, '..', 'src', name)).href;

(async () => {
  const { newRun, grantRelic } = await import(source('core/run.js'));
  const { newMeta } = await import(source('systems/meta.js'));
  const { startBattle, endTurn, playCard, canPlay, makeCtx, usePotion, checkBattleEnd,
    refreshIntents, potionEffects, syncBattleRun } = await import(source('systems/battle.js'));
  const { resolveOps, dealDamage, gainBlock, drawCards, heal } = await import(source('systems/effects.js'));
  const { applyRunEffects } = await import(source('systems/outcome.js'));
  const { enemy, CARD_MAP, potion, relic, ALL_ENEMIES } = await import(source('data/index.js'));
  const failures = [];
  let passed = 0;
  const originalError = console.error;
  const effectErrors = [];
  console.error = (...args) => { effectErrors.push(args); originalError(...args); };

  function test(name, fn) {
    try { fn(); passed++; console.log(`PASS ${name}`); }
    catch (err) { failures.push(name); console.log(`FAIL ${name}: ${err.stack}`); }
  }
  function freshRun(overrides = {}) {
    const run = newRun(newMeta(), 'ch_ashborn', { seed: 4242 });
    run.relics = [];
    run.carryStatuses = null;
    run.deck = Array.from({ length: 24 }, (_, i) => ({ id: 'c_strike', uid: `d${i}`, upgraded: false }));
    return Object.assign(run, overrides);
  }
  function arena({ count = 1, enemyId = 'e_iron_rats', run = freshRun() } = {}) {
    const def = enemy(enemyId);
    const battle = startBattle(run, Array.from({ length: count }, () => ({ ...def, hp: [1000, 1000] })));
    battle.hand = [];
    battle.player.status = {};
    battle.player.block = 0;
    battle.energy = 99;
    for (const e of battle.enemies) { e.status = {}; e.block = 0; }
    battle.fx = [];
    battle.log = [];
    return { run, battle, player: battle.player, foe: battle.enemies[0] };
  }
  function put(battle, id, upgraded = false) {
    const inst = { id, uid: `test#${battle.uidSeq++}`, upgraded };
    battle.hand.push(inst);
    return inst;
  }
  function play(battle, id, upgraded = false, target = battle.enemies[0]?.uid) {
    const inst = put(battle, id, upgraded);
    assert.equal(playCard(battle, inst.uid, target).ok, true);
    return inst;
  }
  function force(battle, index, moveId) {
    battle.enemies[index].intent = { moveId, kind: 'attack', hidden: false, dmg: 0 };
  }
  function probeRelic(run, hooks) {
    run.relicDefs = new Map(run.relicDefs);
    run.relicDefs.set('relic_test_probe', { id: 'relic_test_probe', hooks });
    run.relics = ['relic_test_probe'];
  }
  function withCard(def, fn) {
    assert.equal(CARD_MAP.has(def.id), false);
    CARD_MAP.set(def.id, def);
    try { fn(); } finally { CARD_MAP.delete(def.id); }
  }
  function snapshot(battle) {
    return JSON.stringify({
      rng: battle.rng.state(), runRng: battle.run.rng.state(), stats: battle.run.stats,
      player: { hp: battle.player.hp, block: battle.player.block, status: battle.player.status },
      enemies: battle.enemies.map((e) => ({ hp: e.hp, block: e.block, status: e.status,
        used: [...e.usedMoves], forcedNext: e.forcedNext, moveId: e.intent?.moveId, hidden: e.intent?.hidden })),
      deck: battle.run.deck, hand: battle.hand, draw: battle.draw, discard: battle.discard,
      log: battle.log, fx: battle.fx, pending: battle.pending,
      double: battle.doubleNextAttack, ward: battle.bossWardReady,
    });
  }

  test('current HP and burn survive the battle boundary without double max-HP gain', () => {
    const run = freshRun({ hp: 9, carryStatuses: { burn: 2 } });
    const battle = startBattle(run, [{ ...enemy('e_iron_rats'), hp: [100, 100] }]);
    assert.equal(battle.player.hp, 9);
    assert.equal(battle.player.status.burn, 2);
    resolveOps([{ op: 'maxHp', n: 5 }], makeCtx(battle, battle.player, null, 'potion'));
    battle.player.hp = 8;
    battle.player.status.burn = 7;
    syncBattleRun(battle);
    syncBattleRun(battle);
    assert.equal(run.hp, 8);
    assert.equal(run.maxHp, 75);
    assert.deepEqual(run.carryStatuses, { burn: 3 });
    const next = startBattle(run, [enemy('e_iron_rats')]);
    assert.equal(next.player.hp, 8);
    assert.equal(next.player.maxHp, 75);
    assert.equal(next.player.status.burn, 3);
  });

  test('outside random relic HP gains preserve preceding effects and later healing', () => {
    for (const priorMaxHpGain of [0, 4]) {
      const run = freshRun({ hp: 30 });
      run.relicDefs = new Map([['relic_blood_overseer', relic('relic_blood_overseer')]]);
      applyRunEffects(run, [
        { op: 'loseHp', n: 5 },
        { op: 'maxHp', n: priorMaxHpGain },
        { op: 'custom', fn: 'grantRandomRelic' },
        { op: 'heal', n: 3 },
      ]);
      assert.equal(run.hp, 48 + priorMaxHpGain);
      assert.equal(run.maxHp, 90 + priorMaxHpGain);
      assert.deepEqual(run.relics, ['relic_blood_overseer']);
    }
  });

  test('battle random relic HP gains use the live player and survive settlement', () => {
    const run = freshRun({ hp: 60 });
    run.relicDefs = new Map([['relic_blood_overseer', relic('relic_blood_overseer')]]);
    const { battle, player } = arena({ run });
    player.hp = 30;
    resolveOps([
      { op: 'loseHp', n: 5 },
      { op: 'custom', fn: 'grantRandomRelic' },
      { op: 'heal', n: 3 },
    ], makeCtx(battle, player, null, 'test'));
    assert.equal(player.hp, 48);
    assert.equal(player.maxHp, 90);
    syncBattleRun(battle);
    syncBattleRun(battle);
    assert.equal(run.hp, 48);
    assert.equal(run.maxHp, 90);
    const next = startBattle(run, [enemy('e_iron_rats')]);
    assert.equal(next.player.hp, 48);
    assert.equal(next.player.maxHp, 90);
  });

  test('Soul Furnace grants a real max-HP relic exactly once', () => {
    const run = freshRun({ hp: 30 });
    run.relicDefs = new Map([['relic_blood_overseer', relic('relic_blood_overseer')]]);
    const { battle, player } = arena({ run });
    resolveOps([{ op: 'loseHp', n: 18 }], makeCtx(battle, player, null, 'test'));
    play(battle, 'c_f_soul_furnace', false, null);
    assert.equal(player.hp, 32);
    assert.equal(player.maxHp, 90);
    play(battle, 'c_f_soul_furnace', false, null);
    assert.equal(player.hp, 32);
    assert.deepEqual(run.relics, ['relic_blood_overseer']);
    syncBattleRun(battle);
    assert.equal(run.hp, 32);
    assert.equal(run.maxHp, 90);
  });

  test('random relic max-HP grants and later healing cannot revive a dead player', () => {
    const ops = [{ op: 'loseHp', n: 1 },
      { op: 'custom', fn: 'grantRandomRelic' }, { op: 'heal', n: 50 }];
    for (const inBattle of [false, true]) {
      const run = freshRun({ hp: 1 });
      run.relicDefs = new Map([['relic_blood_overseer', relic('relic_blood_overseer')]]);
      if (inBattle) {
        const { battle, player } = arena({ run });
        resolveOps(ops, makeCtx(battle, player, null, 'test'));
        assert.equal(player.hp, 0);
        assert.equal(player.dead, true);
        checkBattleEnd(battle);
        assert.equal(battle.phase, 'lost');
        syncBattleRun(battle);
      } else {
        const { ctx } = applyRunEffects(run, ops);
        assert.equal(ctx.self.hp, 0);
        assert.equal(ctx.self.dead, true);
      }
      assert.equal(run.hp, 0);
      assert.equal(run.maxHp, 90);
      assert.deepEqual(run.relics, ['relic_blood_overseer']);
    }
  });

  test('upgraded card cost, damage and effects match the displayed card', () => {
    const { battle, foe } = arena();
    battle.energy = 0;
    const guard = put(battle, 'c_guard', true);
    assert.equal(canPlay(battle, guard).cost, 0);
    assert.equal(playCard(battle, guard.uid).ok, true);
    assert.equal(battle.player.block, 8);
    battle.energy = 1;
    play(battle, 'c_bash', true);
    assert.equal(battle.energy, 0);
    assert.equal(foe.hp, 989);
    assert.equal(foe.status.vulnerable, 2);
  });

  test('upgrade target and exhaust overrides are used by the engine', () => {
    withCard({ id: 'c_test_upgrade', name: 'Upgrade fixture', type: 'attack', cost: 2,
      target: 'enemy', effects: [{ op: 'damage', v: 9 }],
      upgrade: { cost: 0, type: 'skill', target: 'self', exhaust: true, effects: [{ op: 'block', v: 2 }] } }, () => {
      const { battle, foe } = arena();
      battle.energy = 0;
      const inst = play(battle, 'c_test_upgrade', true, null);
      assert.equal(battle.player.block, 2);
      assert.equal(foe.hp, 1000);
      assert.equal(battle.exhaustPile.includes(inst), true);
      assert.equal(battle.discard.includes(inst), false);
    });
  });

  test('upgraded retain and unplayable flags are respected', () => {
    withCard({ id: 'c_test_retain', name: 'Retain fixture', type: 'skill', cost: 1,
      target: 'self', effects: [{ op: 'block', v: 1 }], upgrade: { retain: true, playable: false } }, () => {
      const { battle } = arena();
      const inst = put(battle, 'c_test_retain', true);
      assert.equal(canPlay(battle, inst).ok, false);
      force(battle, 0, 'e_iron_rats_nip');
      endTurn(battle);
      assert.equal(battle.hand.includes(inst), true);
      assert.equal(battle.discard.includes(inst), false);
    });
  });

  test('thorns kill the last enemy through the full death and victory path once', () => {
    const { run, battle, player, foe } = arena();
    player.hp = 10; player.status.thorns = 3; foe.hp = 3;
    probeRelic(run, { onKill: [{ op: 'gold', n: 17 }] });
    const gold = run.gold;
    force(battle, 0, 'e_iron_rats_nip');
    endTurn(battle);
    checkBattleEnd(battle);
    assert.equal(battle.phase, 'won');
    assert.equal(player.hp, 7);
    assert.equal(foe.dead, true);
    assert.equal(run.stats.kills, 1);
    assert.equal(run.gold - gold, 17);
    assert.deepEqual(battle.fx.filter((f) => f.type === 'enemy-death').map((f) => f.uid), ['e0']);
    assert.equal(battle.fx.filter((f) => f.type === 'win').length, 1);
  });

  test('enemy onDeath buffs living allies while thorns kills belong to the player', () => {
    const { run, battle, player, foe } = arena({ count: 2 });
    run.relics = ['relic_widow_pepper'];
    player.hp = 20; player.status.thorns = 3; foe.hp = 3;
    force(battle, 0, 'e_iron_rats_nip'); force(battle, 1, 'e_iron_rats_nip');
    endTurn(battle);
    assert.equal(foe.dead, true);
    assert.equal(run.stats.kills, 1);
    assert.equal(player.status.strength, 2);
    assert.equal(battle.enemies[1].status.strength, 1);
    assert.equal(run.stats.damageDealt, 6);
    assert.equal(run.stats.damageTaken, 7);
  });

  test('enemy lethal damage loses without a player enemy-death event or kill rewards', () => {
    const { run, battle, player } = arena();
    player.hp = 2;
    probeRelic(run, { onKill: [{ op: 'gold', n: 17 }] });
    const gold = run.gold;
    force(battle, 0, 'e_iron_rats_nip');
    endTurn(battle);
    assert.equal(battle.phase, 'lost');
    assert.equal(player.dead, true);
    assert.equal(run.stats.kills, 0);
    assert.equal(run.gold, gold);
    assert.equal(battle.fx.some((f) => f.type === 'enemy-death' && f.uid === 'player'), false);
    assert.equal(battle.fx.filter((f) => f.type === 'lose').length, 1);
    assert.equal(run.stats.turns, 1);
  });

  test('simultaneous death loses on either side and onKill healing cannot revive the player', () => {
    for (const playerActs of [false, true]) {
      const { run, battle, player, foe } = arena();
      run.relics = ['relic_vulture_eye'];
      battle.rng.chance = () => true;
      if (playerActs) {
        player.hp = 1; foe.hp = 1; foe.status.thorns = 1;
        play(battle, 'c_strike');
      } else {
        player.hp = 2; player.status.thorns = 3; foe.hp = 3;
        force(battle, 0, 'e_iron_rats_nip'); endTurn(battle);
      }
      assert.equal(battle.phase, 'lost');
      assert.equal(player.hp, 0);
      assert.equal(foe.hp, 0);
      assert.equal(run.stats.kills, 1);
      assert.equal(battle.log.some((l) => l.kind === 'win'), false);
      assert.equal(battle.fx.filter((f) => f.type === 'lose').length, 1);
    }
  });

  test('healing and max-HP effects do not resurrect dead combatants', () => {
    const { battle, player, foe } = arena();
    const ctx = makeCtx(battle, player, foe, 'test');
    player.hp = 0; foe.hp = 0; foe.dead = true;
    assert.equal(heal(ctx, player, 10), 0);
    assert.equal(heal(ctx, foe, 10), 0);
    resolveOps([{ op: 'maxHp', n: 5 }, { op: 'heal', n: 5 }], ctx);
    assert.equal(player.hp, 0);
    assert.equal(foe.hp, 0);
  });

  test('poison and burn deaths execute kill hooks once and regen cannot undo death', () => {
    const { run, battle, foe } = arena();
    foe.hp = 1; foe.status = { poison: 2, burn: 3, regen: 10 };
    probeRelic(run, { onKill: [{ op: 'gold', n: 5 }] });
    const gold = run.gold;
    force(battle, 0, 'e_iron_rats_nip'); endTurn(battle);
    assert.equal(battle.phase, 'won');
    assert.equal(foe.hp, 0);
    assert.equal(run.stats.kills, 1);
    assert.equal(run.stats.damageDealt, 1);
    assert.equal(run.gold - gold, 5);
  });

  test('onKill heals the player without reviving the killed enemy', () => {
    const { run, battle, player, foe } = arena();
    run.relics = ['relic_vulture_eye']; battle.rng.chance = () => true;
    player.hp = 20; foe.hp = 1;
    play(battle, 'c_strike');
    assert.equal(player.hp, 24);
    assert.equal(foe.hp, 0);
    assert.equal(foe.dead, true);
    assert.equal(battle.phase, 'won');
  });

  test('HP-lost relics belong only to the player', () => {
    const { run, battle, player, foe } = arena();
    run.relics = ['relic_iron_pact']; foe.hp = 30; foe.maxHp = 100;
    play(battle, 'c_strike');
    assert.equal(foe.status.strength || 0, 0);
    assert.equal(player.status.strength || 0, 0);
    player.hp = 30;
    resolveOps([{ op: 'damage', v: 3 }], makeCtx(battle, foe, player, 'enemy', true));
    assert.equal(player.status.strength, 2);
    assert.equal(foe.status.strength || 0, 0);
  });

  test('damage-dealt relics ignore enemy attacks and fully blocked damage', () => {
    const { run, battle, player, foe } = arena();
    run.relics = ['relic_crimson_thread']; foe.hp = 30; foe.maxHp = 100; battle.energy = 5;
    foe.block = 10; play(battle, 'c_strike');
    assert.equal(battle.energy, 4);
    foe.block = 0; play(battle, 'c_strike');
    assert.equal(battle.energy, 4);
    player.hp = 20;
    resolveOps([{ op: 'damage', v: 3 }], makeCtx(battle, foe, player, 'enemy', true));
    assert.equal(battle.energy, 4);
  });

  test('block relics and numeric bonuses never apply to enemies', () => {
    const { run, battle, player, foe } = arena();
    run.relics = ['relic_ash_charm', 'relic_whetstone_plate', 'relic_deep_lung'];
    run.bonusDamage = 2;
    const ctx = makeCtx(battle, player, foe, 'test');
    assert.equal(gainBlock(ctx, foe, 5), 5);
    assert.equal(foe.hp, 1000);
    foe.block = 0;
    assert.equal(gainBlock(ctx, player, 5), 6);
    assert.equal(foe.hp, 994);
    player.block = 0;
    const hp = player.hp;
    resolveOps([{ op: 'damage', v: 3 }], makeCtx(battle, foe, player, 'enemy', true));
    assert.equal(player.hp, hp - 3);
    const before = foe.hp;
    play(battle, 'c_strike');
    assert.equal(before - foe.hp, 9);
  });

  test('healPlus increases only player healing', () => {
    const { run, battle, player, foe } = arena();
    const relic = [...run.relicDefs.values()].find((r) => r.mod?.healPlus === 2);
    assert.ok(relic);
    run.relics = [relic.id]; player.hp = 20; foe.hp = 10;
    const ctx = makeCtx(battle, player, foe, 'test');
    assert.equal(heal(ctx, player, 2), 4);
    assert.equal(heal(ctx, foe, 2), 2);
  });

  test('reentrant damage and HP-loss hooks terminate without swallowing errors', () => {
    const { run, battle, player, foe } = arena();
    probeRelic(run, { onDamageDealt: [{ op: 'damage', v: 1, t: 'target' }],
      onHpLost: [{ op: 'loseHp', n: 1 }] });
    dealDamage(makeCtx(battle, player, foe, 'test'), player, foe, 5);
    assert.equal(foe.hp, 994);
    assert.equal(run.stats.damageDealt, 6);
    dealDamage(makeCtx(battle, foe, player, 'enemy', true), foe, player, 3);
    assert.equal(run.stats.damageTaken, 4);
    assert.equal(battle.activeRelicHooks.size, 0);
  });

  test('active enemy all debuffs target the player while onDeath all targets allies', () => {
    const { battle, player, foe } = arena({ count: 2 });
    resolveOps([{ op: 'debuff', s: 'weak', v: 2, t: 'all' }], makeCtx(battle, foe, player, 'enemy', true));
    assert.equal(player.status.weak, 2);
    assert.equal(foe.status.weak || 0, 0);
    assert.equal(battle.enemies[1].status.weak || 0, 0);
    foe.hp = 1; play(battle, 'c_strike');
    assert.equal(battle.enemies[1].status.strength, 1);
    assert.equal(player.status.strength || 0, 0);
  });

  test('handPlus is counted once and generated cards obey the same cap', () => {
    const run = freshRun(); grantRelic(run, 'relic_oil_lamp');
    const { battle, player } = arena({ run });
    battle.draw = run.deck.map((c) => ({ ...c })); battle.discard = [];
    const ctx = makeCtx(battle, player, null, 'test');
    drawCards(ctx, 99);
    assert.equal(battle.hand.length, 11);
    player.status.overload = 2; drawCards(ctx, 99);
    assert.equal(battle.hand.length, 13);
    resolveOps([{ op: 'addHand', card: 'c_guard', n: 3 }], ctx);
    assert.equal(battle.hand.length, 13);
    assert.equal(battle.discard.length, 3);
  });

  test('first-turn draw bonus applies once and turns count player turns only', () => {
    const run = freshRun({ firstTurnDrawPlus: 2 });
    const battle = startBattle(run, [{ ...enemy('e_iron_rats'), hp: [1000, 1000] }]);
    assert.equal(battle.hand.length, 7);
    assert.equal(run.stats.turns, 1);
    force(battle, 0, 'e_iron_rats_nip'); endTurn(battle);
    assert.equal(battle.hand.length, 5);
    assert.equal(run.stats.turns, 2);
  });

  test('boss ward blocks one first-turn attack hit and ignores self-loss and burn', () => {
    const { run, battle, player, foe } = arena({ run: freshRun({ bossWard: true }) });
    const move = { id: 'triple', name: 'Triple', intent: 'attack',
      effects: [{ op: 'repeat', n: 3, then: [{ op: 'damage', v: 5 }] }] };
    foe.def = { ...foe.def, moves: [move] };
    player.status.burn = 2;
    resolveOps([{ op: 'loseHp', n: 1 }], makeCtx(battle, player, null, 'card'));
    assert.equal(battle.bossWardReady, true);
    force(battle, 0, 'triple'); refreshIntents(battle);
    assert.equal(foe.intent.dmg, 10);
    assert.equal(battle.bossWardReady, true);
    endTurn(battle);
    assert.equal(player.hp, 57);
    assert.equal(run.stats.damageTaken, 13);
    assert.equal(battle.bossWardReady, false);
    force(battle, 0, 'triple'); refreshIntents(battle);
    assert.equal(foe.intent.dmg, 15);
    endTurn(battle);
    assert.equal(run.stats.damageTaken, 30);
  });

  test('potions use the Map, apply potionPower, and only count successful player-phase uses', () => {
    const { run, battle, player, foe } = arena({ run: freshRun({ potionPower: 2 }) });
    run.potions = ['p_warm_brandy', 'p_cinder_dust']; player.hp = 20;
    assert.equal(usePotion(battle, 'p_warm_brandy').ok, true);
    assert.equal(player.hp, 34);
    assert.equal(run.stats.potionsUsed, 1);
    assert.equal(usePotion(battle, 'p_cinder_dust').ok, false);
    for (const phase of ['enemy', 'won', 'lost']) {
      battle.phase = phase;
      assert.equal(usePotion(battle, 'p_cinder_dust', foe.uid).ok, false);
    }
    assert.equal(run.potions.length, 1);
    assert.equal(run.stats.potionsUsed, 1);
    battle.phase = 'player';
    assert.equal(usePotion(battle, 'p_cinder_dust', foe.uid).ok, true);
    assert.equal(foe.status.burn, 6);
    assert.equal(run.stats.potionsUsed, 2);
    assert.equal(potion('p_cinder_dust').effects[0].v, 4);
  });

  test('potionPower recursively changes effect magnitudes, preserving counts, conditions and tokens', () => {
    const def = { effects: [{ op: 'repeat', n: 2, then: [{ op: 'damage', v: 3 }] },
      { op: 'if', cond: { type: 'chance', p: 0.25 }, then: [{ op: 'heal', n: 2 }],
        else: [{ op: 'energy', n: -1 }, { op: 'damage', v: 'S' }] }] };
    const before = JSON.stringify(def);
    const boosted = potionEffects({ potionPower: 2 }, def);
    assert.equal(boosted[0].n, 2);
    assert.equal(boosted[0].then[0].v, 5);
    assert.equal(boosted[1].cond.p, 0.25);
    assert.equal(boosted[1].then[0].n, 4);
    assert.equal(boosted[1].else[0].n, -1);
    assert.equal(boosted[1].else[1].v, 'S');
    assert.equal(JSON.stringify(def), before);
  });

  test('intents use actual 3S offering semantics, including ritual, weak and vulnerability', () => {
    const { battle, player, foe } = arena({ enemyId: 'e_flesh_zealot' });
    foe.status = { strength: 3, ritual: 2, weak: 1 };
    player.status.vulnerable = 2;
    force(battle, 0, 'e_flesh_zealot_offering');
    const before = snapshot(battle);
    refreshIntents(battle);
    assert.equal(foe.intent.dmg, 16);
    assert.equal(snapshot(battle), before);
    const hp = player.hp;
    endTurn(battle);
    assert.equal(hp - player.hp, 16);
    assert.equal(foe.status.strength, 5);
    assert.equal(foe.status.ritual, 0);
  });

  test('multi-hit intents count modifiers per hit and repeated preview has no live side effects', () => {
    const { run, battle, player, foe } = arena({ enemyId: 'e_gas_mantis' });
    probeRelic(run, { onHpLost: [{ op: 'buff', s: 'strength', v: 2, t: 'self' }] });
    foe.status = { strength: 2, weak: 1 }; player.status.vulnerable = 2;
    battle.doubleNextAttack = { uid: 'player', consumed: false };
    force(battle, 0, 'e_gas_mantis_triple');
    const before = snapshot(battle);
    refreshIntents(battle); refreshIntents(battle);
    assert.equal(foe.intent.dmg, 21);
    assert.equal(snapshot(battle), before);
    const hp = player.hp;
    endTurn(battle);
    assert.equal(hp - player.hp, 21);
    assert.equal(player.status.strength, 6);
    assert.deepEqual(battle.doubleNextAttack, { uid: 'player', consumed: false });
  });

  test('preview respects effect ordering and consumes only a copied RNG', () => {
    const { battle, player, foe } = arena();
    foe.status = { strength: 1, ritual: 2 };
    const move = { id: 'ordered', name: 'Ordered', intent: 'attack', effects: [
      { op: 'custom', fn: 'shuffleDrawPile' }, { op: 'buff', s: 'strength', v: 2, t: 'self' },
      { op: 'debuff', s: 'vulnerable', v: 2, t: 'all' },
      { op: 'repeat', n: 2, then: [{ op: 'damage', v: 'S' }] },
    ] };
    foe.def = { ...foe.def, moves: [move] }; force(battle, 0, 'ordered');
    const before = snapshot(battle);
    refreshIntents(battle);
    assert.equal(foe.intent.dmg, 30);
    assert.equal(snapshot(battle), before);
    const hp = player.hp; endTurn(battle);
    assert.equal(hp - player.hp, 30);
  });

  test('weak applied during the player turn refreshes the same announced move', () => {
    const { battle, foe } = arena();
    force(battle, 0, 'e_iron_rats_nip'); refreshIntents(battle);
    assert.equal(foe.intent.dmg, 3);
    const rng = battle.rng.state();
    play(battle, 'c_cold_iron');
    assert.equal(foe.intent.moveId, 'e_iron_rats_nip');
    assert.equal(foe.intent.dmg, 2);
    assert.deepEqual(battle.rng.state(), rng);
  });

  test('all real enemy moves predict the damage resolver under neutral and modified statuses', () => {
    let checked = 0;
    for (const def of ALL_ENEMIES) {
      for (const move of def.moves) {
        for (const modified of [false, true]) {
          const { battle, player, foe } = arena({ enemyId: def.id, run: freshRun({ hp: 1000, maxHp: 1000 }) });
          battle.phase = 'enemy';
          if (modified) {
            foe.status = { strength: 2, weak: 1, ritual: 1 };
            player.status = { vulnerable: 2, intangible: 1, siege: 2, mark: 1 };
          }
          force(battle, 0, move.id);
          const before = snapshot(battle);
          refreshIntents(battle);
          assert.equal(snapshot(battle), before, `${def.id}/${move.id} mutated live state`);
          const predicted = foe.intent.dmg;
          if (foe.status.ritual) {
            foe.status.strength += foe.status.ritual;
            foe.status.ritual = 0;
          }
          battle.fx = [];
          resolveOps(move.effects, makeCtx(battle, foe, player, 'enemy', true));
          const actual = battle.fx.filter((f) => f.type === 'damage' && f.uid === player.uid)
            .reduce((total, f) => total + f.amount, 0);
          assert.equal(predicted, actual, `${def.id}/${move.id}, modified=${modified}`);
          checked++;
        }
      }
    }
    assert.ok(checked > 250);
    console.log(`  checked ${checked} enemy move/status combinations`);
  });

  test('the next attack doubles the whole card without being consumed by relic damage', () => {
    const { run, battle, player, foe } = arena();
    run.relics = ['relic_ash_charm'];
    play(battle, 'c_cinder_charge');
    gainBlock(makeCtx(battle, player, null, 'test'), player, 1);
    assert.equal(battle.doubleNextAttack.consumed, false);
    const hp = foe.hp;
    play(battle, 'c_piston_kick');
    assert.equal(hp - foe.hp, 22);
    assert.equal(battle.doubleNextAttack, null);
  });

  test('damage statistics count HP lost after block and count thorns exactly once', () => {
    const { run, battle, player, foe } = arena();
    foe.block = 4; foe.status.thorns = 2;
    play(battle, 'c_strike');
    assert.equal(run.stats.damageDealt, 2);
    assert.equal(run.stats.damageTaken, 2);
    player.block = 2;
    resolveOps([{ op: 'damage', v: 3 }], makeCtx(battle, foe, player, 'enemy', true));
    assert.equal(run.stats.damageTaken, 3);
    assert.equal(run.stats.damageDealt, 2);
  });

  console.error = originalError;
  assert.equal(effectErrors.length, 0, 'effect interpreter must not swallow test errors');
  console.log(`Battle regression: ${passed} passed, ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
