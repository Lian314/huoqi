#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const source = (name) => pathToFileURL(path.join(__dirname, '..', 'src', name)).href;
const ENEMY_IDS = [
  'e_dock_riveter', 'e_bilge_lamplighter', 'e_chain_tollman', 'e_pressure_runner',
  'e_dock_pressure_master', 'e_guild_chain_foreman', 'e_dock_guildmaster', 'e_ghost_ferry_keeper',
  'e_ghost_lantern_scout', 'e_fog_ticket_clerk', 'e_lantern_chain_guard', 'e_ash_bell_tracker',
  'e_lantern_inquisitor', 'e_tide_glass_diver', 'e_ghost_lantern_marshall', 'e_submerged_beacon',
  'e_blood_ledger_scribe', 'e_contract_bailiff', 'e_salt_witness', 'e_cinder_notary',
  'e_oath_executioner', 'e_council_sealkeeper', 'e_blood_contract_speaker', 'e_red_council_engine',
];
const EVENT_IDS = [
  'ev_road_stamp_broker', 'ev_repair_crane', 'ev_lantern_market', 'ev_salt_infirmary',
  'ev_discard_ferry', 'ev_sealed_paybox', 'ev_guild_gate', 'ev_boiler_exam',
  'ev_rivet_wages', 'ev_chain_memorial', 'ev_dock_soup', 'ev_sunk_workshop',
  'ev_night_pass', 'ev_lantern_rollcall', 'ev_fog_auction', 'ev_glass_autopsy',
  'ev_patrol_cache', 'ev_drowned_choir', 'ev_last_covenant', 'ev_council_quorum',
  'ev_blood_tax', 'ev_red_archive', 'ev_final_seal', 'ev_ash_amnesty',
];

function walkOps(ops) {
  return (ops || []).flatMap((op) => [op, ...walkOps(op.then), ...walkOps(op.else)]);
}

function baseDamage(ops) {
  return (ops || []).reduce((total, op) => {
    if (op.op === 'damage' || op.op === 'damageAll') return total + Number(op.v);
    if (op.op === 'repeat') return total + op.n * baseDamage(op.then);
    return total;
  }, 0);
}

async function validateEncounters() {
  const { newRun } = await import(source('core/run.js'));
  const { newMeta } = await import(source('systems/meta.js'));
  const { startBattle, endTurn, playCard, canPlay, refreshIntents, chooseMove, makeCtx } =
    await import(source('systems/battle.js'));
  const { dealDamage } = await import(source('systems/effects.js'));
  const { applyRunEffects } = await import(source('systems/outcome.js'));
  const { ENEMY_MAP, EVENT_MAP, CARD_MAP, STATUS, ALL_CHARACTERS } =
    await import(source('data/index.js'));

  const enemies = ENEMY_IDS.map((id) => {
    assert.ok(ENEMY_MAP.has(id), `Missing enemy ${id}`);
    return ENEMY_MAP.get(id);
  });
  const events = EVENT_IDS.map((id) => {
    assert.ok(EVENT_MAP.has(id), `Missing event ${id}`);
    return EVENT_MAP.get(id);
  });
  const failures = [];
  const effectErrors = [];
  const originalError = console.error;
  console.error = (...args) => { effectErrors.push(args); originalError(...args); };

  function freshRun(seed = 4242, character = 'ch_ashborn', hp = 500) {
    const run = newRun(newMeta(), character, { seed });
    run.relics = [];
    run.carryStatuses = null;
    run.maxHp = hp;
    run.hp = hp;
    return run;
  }
  function eligible(move, ratio) {
    return (move.requireHpBelow == null || ratio < move.requireHpBelow)
      && (move.requireHpAbove == null || ratio > move.requireHpAbove);
  }
  function selectedOps(ops, success) {
    return (ops || []).flatMap((op) => op.op === 'if'
      ? selectedOps(success ? op.then : op.else, success) : [op]);
  }

  let checkedMoves = 0;
  let simulations = 0;
  const pacing = {};
  try {
    for (const act of [1, 2, 3]) {
      for (const [tier, count] of [['normal', 4], ['elite', 2], ['boss', 2]]) {
        assert.equal(enemies.filter((e) => e.act === act && e.tier === tier).length, count);
      }
    }
    for (const act of [0, 1, 2, 3]) assert.equal(events.filter((e) => e.act === act).length, 6);

    for (const def of enemies) {
      const budgets = {
        1: { normal: [14, 42], elite: [56, 78], boss: [200, 240] },
        2: { normal: [28, 64], elite: [96, 130], boss: [250, 290] },
        3: { normal: [48, 100], elite: [150, 200], boss: [290, 320] },
      };
      const [minHp, maxHp] = budgets[def.act][def.tier];
      assert.ok(def.hp[0] >= minHp && def.hp[1] <= maxHp, `${def.id} HP budget`);
      assert.ok(def.moves.length >= (def.tier === 'normal' ? 3 : 4), `${def.id} moves`);
      assert.equal(new Set(def.moves.map((m) => m.id)).size, def.moves.length);
      for (const move of def.moves) {
        assert.ok(move.tell?.length, `${move.id} tell`);
        assert.equal(move.dmg, baseDamage(move.effects), `${move.id} damage contract`);
        if (move.next) assert.ok(def.moves.some((m) => m.id === move.next), `${move.id} next`);
        for (const op of walkOps(move.effects)) {
          if (op.s) assert.ok(STATUS[op.s], `${move.id} status ${op.s}`);
          if (op.card) assert.ok(CARD_MAP.has(op.card), `${move.id} card ${op.card}`);
        }

        // Run the actual enemy turn with modified strength and a debuffed player.
        const battle = startBattle(freshRun(), [def], { tier: def.tier });
        const foe = battle.enemies[0];
        foe.status = { strength: 2 };
        foe.usedMoves.clear();
        battle.player.status = { vulnerable: 2 };
        battle.player.block = 0;
        foe.intent = { moveId: move.id, hidden: false, dmg: 0 };
        refreshIntents(battle);
        const prediction = foe.intent.dmg;
        const before = battle.player.hp;
        endTurn(battle);
        assert.equal(before - battle.player.hp, prediction, `${move.id} intent matches damage`);
        assert.notEqual(battle.phase, 'lost', `${move.id} unexpectedly lethal`);
        if (move.next) {
          const next = def.moves.find((m) => m.id === move.next);
          if (eligible(next, foe.hp / foe.maxHp)) {
            assert.equal(foe.intent?.moveId, next.id, `${move.id} actual next`);
          }
        }
        checkedMoves++;
      }

      if (def.tier === 'boss') {
        for (const ratio of [0.8, 0.35]) {
          assert.ok(def.moves.some((m) => eligible(m, ratio) && m.dmg > 0), `${def.id} phase ${ratio}`);
          const battle = startBattle(freshRun(), [def], { tier: 'boss' });
          const foe = battle.enemies[0];
          foe.hp = Math.floor(foe.maxHp * ratio);
          const rolls = [];
          for (let i = 0; i < 40; i++) {
            const move = chooseMove(battle, foe);
            assert.ok(eligible(move, ratio), `${def.id} phase gate ${move.id}`);
            if (move.once) foe.usedMoves.add(move.id);
            foe.forcedNext = move.next || null;
            rolls.push(move.id);
          }
          assert.ok(rolls.some((id) => def.moves.find((m) => m.id === id).dmg > 0), `${def.id} attacks`);
          assert.ok(rolls.some((id) => def.moves.find((m) => m.id === id).dmg === 0), `${def.id} recovery`);
        }
        for (const move of def.moves.filter((m) => m.dmg > 0)) {
          const seen = new Set([move.id]);
          let next = def.moves.find((m) => m.id === move.next);
          while (next?.dmg > 0 && !seen.has(next.id)) {
            seen.add(next.id);
            next = def.moves.find((m) => m.id === next.next);
          }
          assert.ok(next && next.dmg === 0, `${move.id} must lead to recovery`);
        }
      }
    }

    const allyBattle = startBattle(freshRun(), [ENEMY_MAP.get('e_lantern_chain_guard'), enemies[8]]);
    allyBattle.player.block = 0;
    allyBattle.enemies[1].block = 0;
    dealDamage(makeCtx(allyBattle, allyBattle.player, allyBattle.enemies[0], 'test'),
      allyBattle.player, allyBattle.enemies[0], 500, { pierce: true, noThorns: true });
    assert.equal(allyBattle.enemies[1].status.artifact, 1, 'Death protection reaches the surviving ally');
    assert.equal(allyBattle.player.status.artifact || 0, 0, 'Death protection must not reach the player');

    for (const event of events) {
      assert.equal(event.options.length, 3, `${event.id} choices`);
      assert.equal(new Set(event.options.map((o) => o.label)).size, 3, `${event.id} labels`);
      for (const option of event.options) {
        assert.ok(option.desc?.length, `${event.id} cost description`);
        const ops = walkOps(option.result.effects);
        assert.ok(option.result.effects.some((op) =>
          (op.op === 'gold' && op.n < 0) || op.op === 'loseHp' || op.op === 'removeCard'
          || (op.op === 'maxHp' && op.n < 0)), `${event.id} unconditional cost`);
        assert.ok(!ops.some((op) => ['buff', 'draw', 'energy'].includes(op.op)), `${event.id} lasting effects`);
        if (option.req?.gold) {
          assert.ok(option.result.effects.some((op) => op.op === 'gold' && op.n === -option.req.gold),
            `${event.id} affordability must pay its cost`);
        }
        for (const op of ops) {
          if (op.card) assert.ok(CARD_MAP.has(op.card), `${event.id} card ${op.card}`);
          if (op.cond) assert.equal(op.cond.type, 'chance', `${event.id} supported branch`);
        }
        for (const success of [true, false]) {
          const run = freshRun(4242, 'ch_ashborn', 200);
          run.hp = 80;
          run.gold = 500;
          run.deck = Array.from({ length: 24 }, (_, i) =>
            ({ id: i % 2 ? 'c_guard' : 'c_strike', uid: `event${i}`, upgraded: false }));
          run.rng.chance = () => success;
          const originalDeck = run.deck.map((c) => c.uid);
          const { log } = applyRunEffects(run, option.result.effects);
          const chosen = selectedOps(option.result.effects, success);
          const removed = chosen.filter((op) => op.op === 'removeCard').length;
          const added = chosen.filter((op) => op.op === 'addDeck');
          assert.equal(originalDeck.filter((uid) => !run.deck.some((c) => c.uid === uid)).length,
            removed, `${event.id} random removal`);
          for (const op of added) assert.ok(run.deck.some((c) => c.id === op.card), `${event.id} permanent card`);
          assert.ok(run.hp >= 0 && run.hp <= run.maxHp && run.maxHp >= 1 && run.gold >= 0);
          assert.ok(log.length > 0, `${event.id} visible settlement`);
          if (chosen.some((op) => op.op === 'upgradeCard')) {
            assert.ok(run.deck.some((c) => c.upgraded), `${event.id} upgrade persists`);
          }
          const goldDelta = chosen.filter((op) => op.op === 'gold').reduce((sum, op) => sum + op.n, 0);
          assert.equal(run.gold, 500 + goldDelta, `${event.id} actual gold cost and reward`);
          if (chosen.some((op) => op.op === 'loseHp')) assert.ok(run.hp < 80, `${event.id} HP cost paid`);
          if (option.result.loot?.potions) assert.equal(option.result.loot.potions.length, 2);
          if (option.result.loot?.cards) assert.equal(option.result.loot.cards, 1);
          if (option.result.loot?.relics) assert.equal(option.result.loot.relics, 1);
        }
      }
    }

    // Starter decks expose defenses that could otherwise conceal a permanent stalemate.
    for (const def of enemies) {
      const group = `${def.act}/${def.tier}`;
      pacing[group] ||= { battles: 0, wins: 0, minTurns: 1000, maxTurns: 0, totalTurns: 0 };
      for (const character of ALL_CHARACTERS) {
        for (const seed of [17, 1004, 4242]) {
          const run = newRun(newMeta(), character.id, { seed });
          const battle = startBattle(run, [def], { tier: def.tier });
          let turns = 0;
          while (battle.phase === 'player' && turns < 60) {
            let inner = 0;
            while (battle.phase === 'player' && inner++ < 20) {
              const inst = battle.hand.find((c) => {
                const card = CARD_MAP.get(c.id);
                const target = card?.target === 'enemy' ? battle.enemies.find((e) => e.hp > 0)?.uid : null;
                return card && card.playable !== false && canPlay(battle, c, target).ok;
              });
              if (!inst) break;
              const card = CARD_MAP.get(inst.id);
              const target = card.target === 'enemy' ? battle.enemies.find((e) => e.hp > 0)?.uid : null;
              assert.equal(playCard(battle, inst.uid, target).ok, true);
              battle.pending.length = 0;
            }
            if (battle.phase === 'player') endTurn(battle);
            turns++;
            battle.pending.length = 0;
          }
          if (!['won', 'lost'].includes(battle.phase)) {
            failures.push(`${def.id}/${character.id}/${seed}: HP ${battle.player.hp}; foe HP ${battle.enemies[0].hp}`);
          }
          const stats = pacing[group];
          stats.battles++;
          stats.wins += battle.phase === 'won' ? 1 : 0;
          stats.minTurns = Math.min(stats.minTurns, turns);
          stats.maxTurns = Math.max(stats.maxTurns, turns);
          stats.totalTurns += turns;
          simulations++;
        }
      }
    }
    assert.deepEqual(failures, [], 'New encounters must terminate within 60 turns');
    assert.deepEqual(effectErrors, [], 'Enemy and event effects must not throw internally');
    for (const stats of Object.values(pacing)) {
      stats.averageTurns = Number((stats.totalTurns / stats.battles).toFixed(1));
      delete stats.totalTurns;
    }
    return { checkedEnemies: enemies.length, checkedMoves, checkedEvents: events.length,
      checkedOptions: events.reduce((sum, e) => sum + e.options.length, 0), simulations, pacing };
  } finally {
    console.error = originalError;
  }
}

module.exports = { validateEncounters };
if (require.main === module) {
  validateEncounters().then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((err) => { console.error(err); process.exitCode = 1; });
}
