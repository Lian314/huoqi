#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const source = (name) => pathToFileURL(path.join(__dirname, '..', 'src', name)).href;

(async () => {
  const { HARBOR_ENEMIES } = await import(source('data/enemies.harbor.js'));
  const { DEPTH_ENEMIES } = await import(source('data/enemies.depths.js'));
  const { HARBOR_EVENTS } = await import(source('data/events.harbor.js'));
  const { DEPTH_EVENTS } = await import(source('data/events.depths.js'));
  const { REGIONS, CHAPTERS, expeditionEndAct } = await import(source('data/regions.js'));
  const { SITE_TYPES } = await import(source('data/sites.js'));
  const { newRun } = await import(source('core/run.js'));
  const { newMeta } = await import(source('systems/meta.js'));
  const { startBattle, endTurn, playCard, canPlay, refreshIntents, rollIntents, pickEncounter } =
    await import(source('systems/battle.js'));
  const { entryNodes, enterNode, findNode, reachableNodes } = await import(source('systems/map.js'));
  const { applyRunEffects } = await import(source('systems/outcome.js'));
  const { siteChoices, chooseSite, finishSiteBattle } = await import(source('systems/sites.js'));
  const { ensureCommissionBoard, chooseCommission, beginCommission } = await import(source('systems/commissions.js'));
  const { ENEMY_MAP, EVENT_MAP, CARD_MAP, ALL_CHARACTERS, STATUS } = await import(source('data/index.js'));
  const enemies = [...HARBOR_ENEMIES, ...DEPTH_ENEMIES];
  const events = [...HARBOR_EVENTS, ...DEPTH_EVENTS];
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => { errors.push(args); originalError(...args); };
  const failures = [];
  let passed = 0;
  let checkedMoves = 0;
  let checkedMaps = 0;
  let simulations = 0;
  const pacing = {};
  function test(name, fn) {
    try { fn(); passed++; console.log(`PASS ${name}`); }
    catch (err) { failures.push(name); console.error(`FAIL ${name}: ${err.stack}`); }
  }
  function walk(ops) {
    return (ops || []).flatMap((op) => [op, ...walk(op.then), ...walk(op.else)]);
  }
  function chosenOps(ops, success) {
    return (ops || []).flatMap((op) => {
      if (op.op === 'if') return chosenOps(success ? op.then : op.else, success);
      if (op.op === 'repeat') return Array.from({ length: op.n }, () => chosenOps(op.then, success)).flat();
      return [op];
    });
  }
  function fresh({ seed = 4242, act = 4, regionId = null, character = 'ch_ashborn', hp = 5000 } = {}) {
    const meta = newMeta();
    meta.night = act;
    const run = newRun(meta, character, { seed, act, regionId });
    run.relics = [];
    run.carryStatuses = null;
    run.hp = hp;
    run.maxHp = hp;
    return run;
  }
  function eligible(move, ratio) {
    return (move.requireHpBelow == null || ratio < move.requireHpBelow)
      && (move.requireHpAbove == null || ratio > move.requireHpAbove);
  }
  const inert = { id: 'e_level_probe', name: 'Probe', act: 4, tier: 'normal', hp: [1000, 1000],
    gold: [0, 0], moves: [{ id: 'probe_wait', intent: 'defend', dmg: 0, effects: [] }] };
  function resources(run) {
    return JSON.stringify({ hp: run.hp, maxHp: run.maxHp, gold: run.gold, deck: run.deck,
      keys: run.keys, relics: run.relics, potions: run.potions, stats: run.stats, blessings: run.blessings });
  }
  function reachSite(run, type) {
    const targets = run.map.grid.flat().filter((node) => node.type === type);
    const queue = entryNodes(run.map).map((node) => [node]);
    const seen = new Set();
    while (queue.length) {
      const route = queue.shift();
      const last = route[route.length - 1];
      if (seen.has(last.id)) continue;
      seen.add(last.id);
      if (targets.includes(last)) {
        for (const node of route) assert.equal(enterNode(run, node.id), node);
        return last;
      }
      for (const id of last.links) queue.push([...route, findNode(run.map, id)]);
    }
    throw new Error(`No reachable ${type}`);
  }
  function maxRouteCount(map, type) {
    const counts = new Map();
    for (const row of [...map.grid].reverse()) for (const node of row) {
      counts.set(node.id, (node.type === type ? 1 : 0)
        + Math.max(0, ...node.links.map((id) => counts.get(id) || 0)));
    }
    return Math.max(...entryNodes(map).map((node) => counts.get(node.id)));
  }

  test('12 regions register complete same-act rosters, bounded teams and unique content IDs', () => {
    assert.equal(REGIONS.length, 12);
    assert.equal(enemies.length, 48);
    assert.equal(events.length, 36);
    const ids = [];
    for (const region of REGIONS) {
      ids.push(region.id);
      assert.equal(REGIONS.filter((r) => r.act === region.act).length, 2);
      assert.equal(region.art, `/assets/regions/${region.id}.svg`);
      for (const [tier, count] of [['normal', 4], ['elite', 2], ['boss', 2], ['sentry', 1]]) {
        assert.equal(region.encounters.filter((enc) => enc.tier === tier).length, count, `${region.id}/${tier}`);
      }
      for (const enc of region.encounters) {
        ids.push(enc.id);
        assert.ok(enc.weight > 0);
        assert.ok(enc.enemies.length >= 1 && enc.enemies.length <= 2);
        for (const id of enc.enemies) {
          assert.ok(ENEMY_MAP.has(id), `${enc.id}/${id}`);
          assert.equal(ENEMY_MAP.get(id).act, region.act);
          assert.equal(ENEMY_MAP.get(id).tier, enc.tier === 'sentry' ? 'normal' : enc.tier);
        }
      }
      assert.equal(region.eventIds.length, 3);
      for (const id of region.eventIds) {
        assert.equal(EVENT_MAP.get(id)?.regionId, region.id);
        assert.equal(EVENT_MAP.get(id)?.act, region.act);
      }
      for (const [tier, count] of [['normal', 2], ['elite', 1], ['boss', 1]]) {
        assert.equal(enemies.filter((e) => e.regionId === region.id && e.tier === tier).length, count);
      }
      for (const side of ['playerStart', 'enemyStart', 'firstTurn']) {
        for (const op of walk(region.rule[side])) {
          if (op.s) { assert.ok(STATUS[op.s]); assert.equal(op.t, 'self'); }
          if (side !== 'firstTurn') assert.ok(!['block', 'draw', 'energy'].includes(op.op));
        }
      }
    }
    for (const def of enemies) {
      ids.push(def.id);
      assert.ok(def.moves.length >= (def.tier === 'normal' ? 3 : 4));
      for (const move of def.moves) {
        ids.push(move.id);
        assert.ok(move.tell?.length);
        if (move.next) assert.ok(def.moves.some((m) => m.id === move.next));
        for (const op of walk(move.effects)) if (op.s) assert.ok(STATUS[op.s]);
      }
    }
    const budgets = { 4: { normal: [46, 72], elite: [135, 175], boss: [280, 315] },
      5: { normal: [55, 88], elite: [150, 195], boss: [300, 330] },
      6: { normal: [65, 98], elite: [175, 210], boss: [320, 350] } };
    for (const def of DEPTH_ENEMIES) {
      const [min, max] = budgets[def.act][def.tier];
      assert.ok(def.hp[0] >= min && def.hp[1] <= max, `${def.id} base HP before night multiplier`);
    }
    ids.push(...events.map((e) => e.id));
    assert.equal(new Set(ids).size, ids.length);
  });

  test('all new enemy moves predict the damage actually dealt in both HP phases', () => {
    for (const def of enemies) for (const move of def.moves) {
      for (const ratio of [0.8, 0.35]) {
        const battle = startBattle(fresh(), [{ ...def, hp: [1000, 1000] }]);
        const foe = battle.enemies[0];
        foe.hp = Math.round(1000 * ratio);
        foe.status = { strength: 2 };
        foe.usedMoves.clear();
        battle.player.status = { vulnerable: 2 };
        battle.player.block = 0;
        foe.intent = { moveId: move.id, hidden: false, dmg: 0 };
        refreshIntents(battle);
        const expected = foe.intent.dmg;
        const before = battle.player.hp;
        endTurn(battle);
        assert.equal(before - battle.player.hp, expected, `${move.id}/${ratio}`);
        if (move.next && eligible(def.moves.find((m) => m.id === move.next), foe.hp / foe.maxHp)) {
          assert.equal(foe.intent.moveId, move.next, `${move.id} actual chain`);
        }
      }
      checkedMoves++;
    }
    console.log(`  verified ${checkedMoves} moves in two phases`);
  });

  test('Boss chains preserve recovery and attacks at half HP without permanent growth', () => {
    for (const def of enemies.filter((e) => e.tier === 'boss')) {
      for (const move of def.moves.filter((m) => m.dmg > 0)) {
        const next = def.moves.find((m) => m.id === move.next);
        assert.ok(next && next.dmg === 0, `${move.id} recovery`);
      }
      for (const ratio of [0.8, 0.5, 0.35, 0.2]) {
        const battle = startBattle(fresh(), [{ ...def, hp: [1000, 1000] }], { tier: 'boss', regionId: def.regionId });
        const foe = battle.enemies[0];
        foe.hp = Math.round(1000 * ratio);
        foe.forcedNext = null;
        foe.usedMoves.clear();
        rollIntents(battle);
        let attacks = 0;
        let recovery = 0;
        for (let turn = 0; turn < 48; turn++) {
          const move = def.moves.find((m) => m.id === foe.intent.moveId);
          assert.ok(eligible(move, foe.hp / foe.maxHp), `${def.id}/${ratio}/${move.id}`);
          attacks += move.dmg > 0 ? 1 : 0;
          recovery += move.dmg === 0 ? 1 : 0;
          endTurn(battle);
          assert.equal(battle.phase, 'player');
          assert.ok((foe.status.strength || 0) <= 8, `${def.id} strength growth`);
          assert.ok((foe.status.metallicize || 0) <= 8, `${def.id} armor growth`);
          assert.ok((foe.status.thorns || 0) <= 5, `${def.id} thorns growth`);
          for (const [status, cap] of [['mark', 6], ['siege', 6], ['burn', 4]]) {
            assert.ok((battle.player.status[status] || 0) <= cap, `${def.id} permanent ${status} growth`);
          }
        }
        assert.ok(attacks > 0, `${def.id}/${ratio} no attack exit`);
        assert.ok(recovery > 0, `${def.id}/${ratio} no recovery`);
      }
    }
  });

  test('all 36 region events pay real costs and settle both probability outcomes', () => {
    let options = 0;
    for (const event of events) {
      assert.equal(event.options.length, 3);
      for (const option of event.options) {
        options++;
        const ops = walk(option.result.effects);
        assert.ok(option.desc?.length);
        assert.ok(!ops.some((op) => ['buff', 'draw', 'energy'].includes(op.op)));
        assert.ok(option.result.effects.length > 0, `${event.id} actual result`);
        if (event.act >= 4) assert.ok(option.result.effects.some((op) => op.op === 'removeCard' || op.op === 'loseHp'
          || (['gold', 'maxHp'].includes(op.op) && op.n < 0)), `${event.id} actual cost`);
        if (option.req?.gold) assert.ok(option.result.effects.some((op) => op.op === 'gold' && op.n === -option.req.gold));
        for (const op of ops) if (op.card) assert.ok(CARD_MAP.has(op.card), `${event.id}/${op.card}`);
        for (const success of [true, false]) {
          const run = fresh({ hp: 300 });
          run.hp = 100;
          run.gold = 500;
          run.deck = Array.from({ length: 24 }, (_, i) =>
            ({ id: i % 2 ? 'c_guard' : 'c_strike', uid: `event${i}`, upgraded: false }));
          run.rng.chance = () => success;
          const oldUids = run.deck.map((c) => c.uid);
          const { log, ctx } = applyRunEffects(run, option.result.effects);
          const chosen = chosenOps(option.result.effects, success);
          assert.ok(log.length);
          assert.ok(run.hp >= 0 && run.hp <= run.maxHp && run.maxHp >= 1 && run.gold >= 0);
          assert.equal(oldUids.filter((uid) => !run.deck.some((c) => c.uid === uid)).length,
            chosen.filter((op) => op.op === 'removeCard').length, `${event.id} removal`);
          for (const op of chosen.filter((op) => op.op === 'addDeck')) {
            assert.ok(run.deck.some((c) => c.id === op.card), `${event.id} permanent card`);
          }
          assert.equal(run.gold, 500 + chosen.filter((op) => op.op === 'gold').reduce((n, op) => n + op.n, 0));
          if (chosen.some((op) => op.op === 'upgradeCard')) assert.ok(run.deck.some((c) => c.upgraded));
          const hpPaid = chosen.filter((op) => op.op === 'loseHp').reduce((n, op) => n + op.n, 0);
          if (hpPaid) assert.ok(ctx.battle.fx.some((fx) => fx.type === 'damage' && fx.uid === 'self' && fx.hpLost > 0));
        }
      }
    }
    assert.equal(options, 108);
    console.log(`  settled ${options} choices in both probability outcomes`);
  });

  test('all six chapters have deterministic, connected maps with every new site reachable', () => {
    for (const region of REGIONS) for (let seed = 1; seed <= 16; seed++) {
      const options = { seed, act: region.act, regionId: region.id };
      const run = fresh(options);
      const map = run.map;
      assert.deepEqual(map, fresh(options).map, `${region.id}/${seed} determinism`);
      assert.equal(map.regionId, region.id);
      assert.equal(map.rows, CHAPTERS[region.act].rows);
      assert.equal(run.endAct, expeditionEndAct(region.act));
      const seen = new Set();
      const queue = entryNodes(map).map((node) => node.id);
      while (queue.length) {
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        const node = findNode(map, id);
        for (const nextId of node.links) {
          assert.equal(findNode(map, nextId)?.row, node.row + 1);
          queue.push(nextId);
        }
      }
      for (const kind of Object.keys(SITE_TYPES)) {
        assert.ok(map.grid.flat().some((node) => node.type === kind && seen.has(node.id)), `${region.id}/${seed}/${kind}`);
      }
      for (const node of map.grid.flat().filter((node) => node.row >= 4)) {
        assert.ok(seen.has(node.id), `${region.id}/${seed}/${node.id} unreachable middle node`);
      }
      assert.equal(map.grid.at(-3)[0].type, 'treasure');
      assert.equal(map.grid.at(-2)[0].type, 'rest');
      assert.equal(map.grid.at(-1)[0].type, 'boss');
      for (const node of map.grid.flat()) {
        if (node.eventId) {
          const event = EVENT_MAP.get(node.eventId);
          assert.ok(event && (!event.act || event.act === region.act));
          assert.ok(!event.regionId || event.regionId === region.id);
        }
        if (node.waves) assert.equal(new Set(node.waves).size, 2);
        if (node.encounterId) assert.ok(region.encounters.some((enc) => enc.id === node.encounterId));
      }
      for (let row = 0; row < map.rows; row++) {
        const reachable = reachableNodes(map);
        assert.ok(reachable.length);
        const node = reachable[(seed + row) % reachable.length];
        assert.equal(enterNode(run, node.id), node);
        assert.equal(enterNode(run, node.id), null);
      }
      assert.equal(map.complete, true);
      checkedMaps++;
    }
    console.log(`  verified ${checkedMaps} maps across all 12 regions`);
  });

  test('event and elite commissions retain a legal completion route in every chapter', () => {
    for (const region of REGIONS) for (let seed = 1; seed <= 8; seed++) {
      for (const [id, type, count] of [['commission_lantern', 'event', 2], ['commission_elite', 'elite', 1]]) {
        const meta = newMeta();
        meta.night = region.act;
        const board = ensureCommissionBoard(meta, 12);
        assert.ok(board.offers.includes(id));
        assert.equal(chooseCommission(meta, id, 12), true);
        const run = newRun(meta, 'ch_ashborn', { seed, act: region.act, regionId: region.id });
        assert.ok(beginCommission(meta, run, 12));
        assert.ok(maxRouteCount(run.map, type) >= count, `${region.id}/${seed}/${id}`);
        assert.equal(run.map.grid.at(-3)[0].type, 'treasure');
        assert.equal(run.map.grid.at(-2)[0].type, 'rest');
        assert.equal(run.map.grid.at(-1)[0].type, 'boss');
        for (const node of run.map.grid.flat().filter((n) => n.type === type)) {
          assert.ok(type === 'event' ? EVENT_MAP.has(node.eventId) : region.encounters.some((enc) => enc.id === node.encounterId));
        }
      }
    }
  });

  test('region starting rules and first-turn resources execute once through real battles', () => {
    for (const region of REGIONS) {
      const battle = startBattle(fresh({ act: region.act, regionId: region.id }), [inert], { regionId: region.id });
      for (const op of region.rule.playerStart) {
        assert.equal(battle.player.status[op.s], op.v, `${region.id} player ${op.s}`);
      }
      for (const op of region.rule.enemyStart) {
        assert.equal(battle.enemies[0].status[op.s], op.v, `${region.id} enemy ${op.s}`);
      }
      const extraEnergy = region.rule.firstTurn.filter((op) => op.op === 'energy').reduce((n, op) => n + op.n, 0);
      assert.equal(battle.energy, 3 + extraEnergy, `${region.id} energy`);
      const draw = region.rule.firstTurn.filter((op) => op.op === 'draw').reduce((n, op) => n + op.n, 0);
      assert.equal(battle.hand.length, Math.max(0, 5 - (battle.player.status.entangled || 0)) + draw, `${region.id} draw`);
      const block = region.rule.firstTurn.filter((op) => op.op === 'block').reduce((n, op) => n + op.v, 0);
      assert.equal(battle.player.block, battle.player.status.frail ? Math.floor(block * 0.75) : block, `${region.id} block`);
      const scry = region.rule.firstTurn.filter((op) => op.op === 'scry').reduce((n, op) => n + op.n, 0);
      assert.equal(battle.pending.filter((entry) => entry.kind === 'scry').reduce((n, entry) => n + entry.n, 0), scry);
      battle.pending.length = 0;
      const strength = battle.player.status.strength || 0;
      endTurn(battle);
      assert.equal(battle.energy, 3, `${region.id} energy repeated`);
      assert.equal(battle.player.block, 0, `${region.id} first-turn block repeated`);
      assert.equal(battle.player.status.strength || 0, strength, `${region.id} starting strength repeated`);
      assert.equal(battle.hand.length, 5, `${region.id} starting draw repeated`);
      assert.equal(battle.pending.length, 0, `${region.id} starting scry repeated`);
    }
  });

  test('sites reject unentered nodes, expired affordability, stale cards and duplicate choices', () => {
    const outside = fresh();
    outside.gold = 100;
    const node = outside.map.grid.flat().find((n) => n.type === 'waystation');
    const before = resources(outside);
    assert.equal(chooseSite(outside, node, 'buyKey').ok, false);
    assert.equal(resources(outside), before);
    const run = fresh();
    run.gold = 100;
    const forge = reachSite(run, 'forge');
    assert.ok(siteChoices(run, forge).some((o) => o.id === 'remove' && !o.disabled));
    run.gold = 34;
    let snapshot = resources(run);
    assert.equal(chooseSite(run, forge, 'remove', { cardUid: run.deck[0].uid }).ok, false);
    assert.equal(resources(run), snapshot);
    run.gold = 35;
    const staleUid = run.deck.shift().uid;
    snapshot = resources(run);
    assert.equal(chooseSite(run, forge, 'remove', { cardUid: staleUid }).ok, false);
    assert.equal(resources(run), snapshot);
    const uid = run.deck[0].uid;
    assert.equal(chooseSite(run, forge, 'remove', { cardUid: uid }).ok, true);
    assert.equal(run.gold, 0);
    assert.ok(!run.deck.some((c) => c.uid === uid));
    snapshot = resources(run);
    assert.equal(chooseSite(run, forge, 'remove', { cardUid: run.deck[0].uid }).ok, false);
    assert.equal(resources(run), snapshot);
    const shrineRun = fresh();
    const shrine = reachSite(shrineRun, 'shrine');
    shrineRun.hp = 8;
    snapshot = resources(shrineRun);
    assert.equal(chooseSite(shrineRun, shrine, 'blood').ok, false);
    assert.equal(resources(shrineRun), snapshot);
    const next = reachableNodes(shrineRun.map)[0];
    assert.ok(enterNode(shrineRun, next.id));
    assert.equal(chooseSite(shrineRun, shrine, 'calm').ok, false);
  });

  test('three-battle blessings are consumed by new battles and never by later turns', () => {
    const run = fresh();
    const shrine = reachSite(run, 'shrine');
    assert.equal(chooseSite(run, shrine, 'blood').ok, true);
    assert.equal(run.blessings[0].remaining, 3);
    for (let i = 0; i < 4; i++) {
      const battle = startBattle(run, [inert]);
      assert.equal(battle.player.status.strength || 0, i < 3 ? 2 : 0);
      const remaining = run.blessings[0]?.remaining || 0;
      assert.equal(remaining, Math.max(0, 2 - i));
      endTurn(battle);
      endTurn(battle);
      assert.equal(run.blessings[0]?.remaining || 0, remaining);
    }
  });

  test('trial continuation and key-vault settlement cannot duplicate permanent rewards', () => {
    const run = fresh();
    const trial = reachSite(run, 'trial');
    assert.equal(chooseSite(run, trial, 'undertake').kind, 'battle');
    assert.equal(chooseSite(run, trial, 'undertake').ok, false);
    run.hp = 100;
    assert.equal(finishSiteBattle(run, 20).kind, 'continue');
    assert.equal(run.hp, 106);
    assert.equal(finishSiteBattle(run, 20), null);
    assert.equal(run.hp, 106);
    assert.equal(chooseSite(run, trial, 'continue').kind, 'battle');
    const gold = run.gold;
    const result = finishSiteBattle(run, 30);
    assert.equal(result.kind, 'reward');
    assert.equal(result.gold, 95);
    assert.equal(run.gold, gold + 45);
    assert.equal(run.keys, 1);
    assert.equal(run.stats.trialsCleared, 1);
    assert.equal(finishSiteBattle(run, 30), null);
    assert.equal(run.keys, 1);
    const vaultRun = fresh();
    const vault = reachSite(vaultRun, 'vault');
    vaultRun.keys = 1;
    assert.equal(chooseSite(vaultRun, vault, 'unlock').rewardStep, 'relic');
    assert.equal(vaultRun.keys, 0);
    assert.equal(vaultRun.stats.keysSpent, 1);
    assert.equal(vaultRun.stats.vaultsOpened, 1);
    assert.equal(chooseSite(vaultRun, vault, 'unlock').ok, false);
    assert.equal(vaultRun.keys, 0);
  });

  test('every regional encounter terminates under its night multiplier and region rule', () => {
    const stalled = [];
    for (const region of REGIONS) {
      const multiplier = region.act <= 3 ? 1 : { 4: 1.3, 5: 1.6, 6: 1.9 }[region.act];
      pacing[region.id] = { battles: 0, wins: 0, totalTurns: 0, maxTurns: 0 };
      for (const encounter of region.encounters) for (const character of ALL_CHARACTERS) {
        for (const seed of [17, 1004, 4242]) {
          const meta = newMeta();
          meta.night = region.act;
          const run = newRun(meta, character.id, { seed, act: region.act, regionId: region.id });
          const mul = multiplier * (encounter.tier === 'sentry' ? 0.65 : 1);
          const defs = pickEncounter(run, region.act, encounter.tier, { encounterId: encounter.id })
            .map((def) => ({ ...def, hp: def.hp.map((n) => Math.max(1, Math.round(n * mul))) }));
          assert.deepEqual(defs.map((def) => def.id), encounter.enemies);
          const battle = startBattle(run, defs, { tier: encounter.tier, regionId: region.id });
          let turns = 0;
          let stagnantTurns = 0;
          while (battle.phase === 'player' && turns < 60) {
            const enemyHpBefore = battle.enemies.reduce((n, enemy) => n + enemy.hp, 0);
            let inner = 0;
            while (battle.phase === 'player' && inner++ < 20) {
              const incoming = battle.enemies.filter((e) => e.hp > 0).reduce((n, e) => n + (e.intent?.dmg || 0), 0);
              const needBlock = incoming > battle.player.block;
              const score = (inst) => {
                const card = CARD_MAP.get(inst.id);
                // Copper Key can recycle only guards; favor attacks after three idle turns.
                if (card.type === 'attack') return stagnantTurns >= 3 ? 6 : needBlock ? 2 : 4;
                if (card.type === 'power') return 3;
                if (walk(card.effects).some((op) => op.op === 'block')) return needBlock ? 4 : 1;
                return 2;
              };
              const inst = battle.hand.filter((c) => CARD_MAP.get(c.id)?.playable !== false && canPlay(battle, c).ok)
                .sort((a, b) => score(b) - score(a))[0];
              if (!inst) break;
              const card = CARD_MAP.get(inst.id);
              const target = card.target === 'enemy' ? battle.enemies.find((e) => e.hp > 0)?.uid : null;
              assert.equal(playCard(battle, inst.uid, target).ok, true);
              battle.pending.length = 0;
            }
            if (battle.phase === 'player') endTurn(battle);
            battle.pending.length = 0;
            const enemyHpAfter = battle.enemies.reduce((n, enemy) => n + enemy.hp, 0);
            stagnantTurns = enemyHpAfter < enemyHpBefore ? 0 : stagnantTurns + 1;
            turns++;
          }
          if (!['won', 'lost'].includes(battle.phase)) stalled.push(`${encounter.id}/${character.id}/${seed}`);
          const stats = pacing[region.id];
          stats.battles++;
          stats.wins += battle.phase === 'won' ? 1 : 0;
          stats.totalTurns += turns;
          stats.maxTurns = Math.max(stats.maxTurns, turns);
          simulations++;
        }
      }
    }
    assert.deepEqual(stalled, [], 'Every regional encounter must terminate within 60 turns');
    for (const stats of Object.values(pacing)) {
      stats.averageTurns = Number((stats.totalTurns / stats.battles).toFixed(1));
      delete stats.totalTurns;
    }
    console.log(`  completed ${simulations} battles: ${JSON.stringify(pacing)}`);
  });

  console.error = originalError;
  if (errors.length && !failures.length) failures.push('interpreter errors');
  console.log(`Level regression: ${passed} passed, ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
})().catch((err) => { console.error(err); process.exitCode = 1; });
