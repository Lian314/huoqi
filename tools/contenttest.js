#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const source = (name) => pathToFileURL(path.join(__dirname, '..', 'src', name)).href;

(async () => {
  const { CARDS_DEPTHS } = await import(source('data/cards.depths.js'));
  const { CARD_SOURCES } = await import(source('data/cards.js'));
  const { ALL_CARDS, ALL_CHARACTERS, ALL_ENEMIES, CARD_MAP, RELIC_MAP, STARTER_RELICS,
    rewardPool, relicPool, enemy, potion } = await import(source('data/index.js'));
  const { newRun, cardDisplay, rollCardReward, rollRelicReward, grantRandomRelic, upgradeCardAt } = await import(source('core/run.js'));
  const { newMeta } = await import(source('systems/meta.js'));
  const { startBattle, endTurn, playCard, canPlay, makeCtx, syncBattleRun, potionEffects,
    usePotion, potionDisplay } = await import(source('systems/battle.js'));
  const { resolveOps } = await import(source('systems/effects.js'));
  const { applyRunEffects } = await import(source('systems/outcome.js'));
  const failures = [];
  const effectErrors = [];
  const originalError = console.error;
  let passed = 0;
  console.error = (...args) => { effectErrors.push(args); originalError(...args); };

  async function test(name, fn) {
    try { await fn(); passed++; console.log(`PASS ${name}`); }
    catch (err) { failures.push(name); console.log(`FAIL ${name}: ${err.stack}`); }
  }
  function fresh(characterId = 'ch_riveter', opts = {}) {
    const meta = newMeta();
    const run = newRun(meta, characterId, { seed: 4242, ...opts });
    run.meta = meta;
    return run;
  }
  function arena(count = 1) {
    const run = fresh();
    run.relics = [];
    run.hp = 80; run.maxHp = 100;
    run.deck = Array.from({ length: 24 }, (_, i) => ({ id: 'c_strike', uid: `d${i}`, upgraded: false }));
    const battle = startBattle(run, Array.from({ length: count }, () => ({ ...enemy('e_iron_rats'), hp: [1000, 1000] })));
    battle.hand = [];
    battle.player.status = {};
    battle.player.block = 0;
    battle.energy = 99;
    return { run, battle, player: battle.player, foe: battle.enemies[0] };
  }
  function play(battle, id, upgraded = false, target = battle.enemies.find((e) => e.hp > 0)?.uid) {
    const inst = { id, uid: `content#${battle.uidSeq++}`, upgraded };
    battle.hand.push(inst);
    const result = playCard(battle, inst.uid, target);
    assert.equal(result.ok, true, `${id}: ${result.why || 'cannot play'}`);
    return inst;
  }
  function force(battle, index, moveId) {
    battle.enemies[index].intent = { moveId, kind: 'attack', hidden: false, dmg: 0 };
  }
  function walk(ops) {
    return (ops || []).flatMap((op) => [op, ...walk(op.then), ...walk(op.else)]);
  }
  function runToEnd(battle, maxTurns = 60) {
    let turns = 0;
    while (battle.phase === 'player' && turns < maxTurns) {
      let actions = 0;
      while (battle.phase === 'player') {
        const inst = battle.hand.find((entry) => canPlay(battle, entry).ok);
        if (!inst) break;
        assert.ok(actions++ < 32, 'a player turn must have a finite number of actions');
        const target = battle.enemies.find((entry) => entry.hp > 0)?.uid;
        assert.equal(playCard(battle, inst.uid, target).ok, true);
      }
      if (battle.phase === 'player') endTurn(battle);
      battle.pending.length = 0;
      turns++;
      assert.ok(Number.isFinite(battle.player.hp) && Number.isFinite(battle.player.block));
    }
    assert.ok(['won', 'lost'].includes(battle.phase), `battle still ${battle.phase} after ${turns} turns`);
    return turns;
  }

  await test('72 school cards have complete upgrades, distinct effects and the intended rarity split', () => {
    assert.equal(CARDS_DEPTHS.length, 72);
    assert.equal(new Set(CARDS_DEPTHS.map((card) => card.id)).size, 72);
    assert.deepEqual(CARD_SOURCES.depths, { total: 72, added: 72, dropped: 0 });
    for (const school of ['铆钉', '幽灯', '血誓']) {
      const cards = CARDS_DEPTHS.filter((card) => card.tags.includes(school));
      assert.equal(cards.length, 24);
      assert.deepEqual(Object.fromEntries(['common', 'uncommon', 'rare', 'special']
        .map((rarity) => [rarity, cards.filter((card) => card.rarity === rarity).length])),
      { common: 8, uncommon: 8, rare: 6, special: 2 });
    }
    for (const card of CARDS_DEPTHS) {
      assert.ok(card.upgrade?.text && card.upgrade.effects?.length, `${card.id}: missing upgrade`);
      if (card.rarity === 'common') assert.equal(card.unlock.embers, 0, card.id);
      assert.equal(ALL_CARDS.filter((other) => other.id !== card.id && other.cost === card.cost
        && other.type === card.type && !!other.exhaust === !!card.exhaust
        && JSON.stringify(other.effects) === JSON.stringify(card.effects)).length, 0, `${card.id}: duplicate effects`);
    }
  });

  for (const upgraded of [false, true]) {
    await test(`all 72 ${upgraded ? 'upgraded' : 'base'} school cards execute in neutral and prepared combat states`, () => {
      let checked = 0;
      for (const card of CARDS_DEPTHS) {
        for (const prepared of [false, true]) {
          const { run, battle, player } = arena(2);
          if (prepared) {
            player.hp = 25; player.block = 12;
            player.status = { strength: 3, dexterity: 2, echo: 1, focus: 2,
              leech: 1, barricade: 1, splinter: 2 };
            battle.cardsPlayedThisTurn = [{ type: 'skill' }, { type: 'skill' }, { type: 'attack' }, { type: 'attack' }];
          }
          const inst = play(battle, card.id, upgraded);
          const shown = cardDisplay(run, inst);
          assert.ok(Number.isFinite(player.hp) && player.hp >= 0 && player.hp <= player.maxHp, card.id);
          assert.ok(Number.isFinite(player.block) && player.block >= 0, card.id);
          assert.ok(Number.isFinite(battle.energy) && battle.energy >= 0, card.id);
          assert.ok(battle.hand.length <= 10, card.id);
          assert.ok(battle.enemies.every((foe) => Number.isFinite(foe.hp) && foe.hp >= 0), card.id);
          assert.equal(run.stats.cardsPlayed, 1, card.id);
          assert.equal(battle.exhaustPile.includes(inst), shown.exhaust === true || shown.type === 'power', card.id);
          syncBattleRun(battle);
          assert.equal(run.hp, player.hp, card.id);
          assert.equal(run.maxHp, player.maxHp, card.id);
          checked++;
        }
      }
      assert.equal(checked, 144);
    });
  }

  await test('rivet barricade retains block and converts it to damage without adding strength twice', () => {
    const { battle, player, foe } = arena();
    player.status.strength = 5;
    play(battle, 'c_r_locking_beam');
    play(battle, 'c_r_seam_guard', true);
    play(battle, 'c_r_plate_ram');
    assert.equal(player.block, 19);
    assert.equal(foe.hp, 981);
    force(battle, 0, 'e_iron_rats_nip');
    endTurn(battle);
    assert.equal(battle.turn, 2);
    assert.equal(player.block, 16);
    assert.equal(player.hp, 80);
  });

  await test('lantern marks apply to each hit while existing echo repeats one whole card', () => {
    const { battle, player, foe } = arena();
    play(battle, 'c_l_distant_beacon');
    play(battle, 'c_l_echo_lamp');
    assert.equal(player.status.echo, 1);
    assert.deepEqual(battle.pending.map((pending) => pending.n), [2, 2]);
    play(battle, 'c_l_trail_light');
    assert.equal(foe.hp, 966);
    assert.equal(foe.status.mark, 6);
    assert.equal(player.status.echo || 0, 0);
  });

  await test('echo gained by a card is saved for the next card unless echo existed before play', () => {
    for (const initialEcho of [0, 1]) {
      const { battle, player } = arena();
      player.status.echo = initialEcho;
      play(battle, 'c_l_echo_lamp');
      assert.equal(player.status.echo, initialEcho === 0 ? 1 : 2);
      assert.equal(battle.pending.length, initialEcho === 0 ? 1 : 2);
      const block = player.block;
      play(battle, 'c_r_seam_guard');
      assert.equal(player.block - block, 14);
      assert.equal(player.status.echo || 0, initialEcho);
    }
  });

  await test('blood oaths pay HP for strength and multi-hit attacks only trigger leech once', () => {
    for (const echo of [0, 1]) {
      const { battle, player, foe } = arena();
      player.hp = 20;
      play(battle, 'c_o_leech_covenant');
      play(battle, 'c_o_scar_count');
      assert.equal(player.hp, 14);
      assert.equal(player.status.strength, 2);
      player.status.echo = echo;
      play(battle, 'c_o_debt_hook');
      assert.equal(1000 - foe.hp, echo ? 28 : 14);
      assert.equal(player.hp, echo ? 11 : 13);
    }
  });

  await test('blood healing and max-HP growth cannot undo a fatal payment', () => {
    const { run, battle, player } = arena();
    player.hp = 3;
    play(battle, 'c_o_heart_forging');
    assert.equal(battle.phase, 'lost');
    assert.equal(player.hp, 0);
    assert.equal(player.maxHp, 106);
    syncBattleRun(battle);
    assert.equal(run.hp, 0);
    assert.equal(run.maxHp, 106);
  });

  await test('new zero-cost, healing and generated-card engines have finite uses', () => {
    for (const card of CARDS_DEPTHS) {
      for (const upgraded of [false, true]) {
        const def = upgraded ? { ...card, ...card.upgrade } : card;
        const ops = walk(def.effects);
        if (def.cost === 0) assert.ok(def.exhaust || def.type === 'power', `${card.id}: reusable zero-cost card`);
        if (ops.some((op) => ['heal', 'maxHp', 'addHand', 'addDiscard', 'shuffleIn'].includes(op.op))) {
          assert.ok(def.exhaust || def.type === 'power', `${card.id}: reusable healing or generation`);
        }
        for (const op of ops.filter((entry) => ['addHand', 'addDiscard', 'shuffleIn'].includes(entry.op))) {
          const generated = CARD_MAP.get(op.card);
          assert.equal(generated.rarity, 'special', card.id);
          assert.equal(generated.exhaust, true, card.id);
          assert.equal(walk(generated.effects).some((entry) => ['addHand', 'addDiscard', 'shuffleIn'].includes(entry.op)), false, op.card);
        }
      }
    }
  });

  await test('all eight characters have themed ten-card decks and isolated starter relics', () => {
    assert.equal(ALL_CHARACTERS.length, 8);
    assert.equal(ALL_CHARACTERS[0].deck[0], 'c_strike');
    for (const character of ALL_CHARACTERS) {
      assert.equal(character.deck.length, 10, character.id);
      const counts = new Map();
      for (const id of character.deck) {
        assert.ok(CARD_MAP.has(id), `${character.id}/${id}`);
        counts.set(id, (counts.get(id) || 0) + 1);
      }
      assert.ok(Math.max(...counts.values()) <= 4, character.id);
      const run = fresh(character.id);
      assert.deepEqual(run.relics, [character.relic]);
      assert.deepEqual(run.rewardTags, character.rewardTags);
      const battle = startBattle(run, [{ ...enemy('e_iron_rats'), hp: [1000, 1000] }]);
      assert.equal(battle.player.status.splinter || 0, character.id === 'ch_riveter' ? 1 : 0);
      assert.equal(battle.player.status.focus || 0, character.id === 'ch_lantern' ? 1 : 0);
      assert.equal(battle.player.status.resolve || 0, character.id === 'ch_oathbound' ? 2 : 0);
      if (character.id === 'ch_riveter') assert.equal(battle.player.block, 4);
    }
    assert.equal(relicPool().some((relic) => STARTER_RELICS.has(relic.id)), false);
    const run = fresh();
    run.meta.unlocks.relics = new Set(RELIC_MAP.keys());
    for (let i = 0; i < 80; i++) {
      for (const relic of rollRelicReward(run)) assert.equal(STARTER_RELICS.has(relic.id), false, relic.id);
      const granted = grantRandomRelic(run);
      if (granted) assert.equal(STARTER_RELICS.has(granted.id), false, granted.id);
    }
  });

  await test('lantern starter focus discounts one card and oath resolve only provides a limited window', () => {
    const lantern = fresh('ch_lantern');
    const lightBattle = startBattle(lantern, [{ ...enemy('e_iron_rats'), hp: [1000, 1000] }]);
    const energy = lightBattle.energy;
    play(lightBattle, 'c_l_wick_cut');
    assert.equal(lightBattle.energy, energy);
    assert.equal(lightBattle.player.status.focus || 0, 0);
    play(lightBattle, 'c_l_wick_cut');
    assert.equal(lightBattle.energy, energy - 1);
    const oath = fresh('ch_oathbound');
    oath.hp = 1;
    const oathBattle = startBattle(oath, [{ ...enemy('e_iron_rats'), hp: [1000, 1000] }]);
    force(oathBattle, 0, 'e_iron_rats_nip');
    endTurn(oathBattle);
    assert.equal(oathBattle.player.hp, 1);
    assert.equal(oathBattle.player.status.resolve || 0, 0);
    force(oathBattle, 0, 'e_iron_rats_nip');
    endTurn(oathBattle);
    assert.equal(oathBattle.phase, 'lost');
  });

  await test('school rewards are favored within a rarity while cross-school cards remain available', () => {
    const run = fresh();
    run.pool = { ...run.pool, cards: new Map(['c_r_rivet_strike', 'c_l_sidelight'].map((id) => [id, CARD_MAP.get(id)])) };
    let school = 0;
    for (let i = 0; i < 800; i++) {
      const choices = rollCardReward(run, 1);
      assert.equal(choices.length, 1);
      if (choices[0].tags.includes('铆钉')) school++;
    }
    assert.ok(school > 530 && school < 680, `favored school appeared ${school}/800 times`);
  });

  await test('reward unlock filters exclude locked, special and curse cards and admit purchased cards', () => {
    const locked = CARD_MAP.get('c_r_bastion_press');
    const run = fresh();
    run.pool = { ...run.pool, cards: new Map([locked.id, 'c_r_rivet_strike', 'c_r_spare_plate', 'c_curse_rusty_oath']
      .map((id) => [id, CARD_MAP.get(id)])) };
    for (let i = 0; i < 80; i++) {
      const choice = rollCardReward(run, 1);
      assert.equal(choice.length, 1);
      assert.equal(choice[0].id, 'c_r_rivet_strike');
    }
    run.meta.unlocks.cards.add(locked.id);
    let rare = 0;
    for (let i = 0; i < 80; i++) {
      const [choice] = rollCardReward(run, 1);
      assert.ok(['common', 'rare'].includes(choice.rarity));
      if (choice.id === locked.id) rare++;
    }
    assert.ok(rare > 0);
    const pool = rewardPool(new Set());
    assert.equal(pool.some((card) => ['special', 'curse'].includes(card.rarity) || card.unlock?.embers > 0), false);
  });

  await test('carrier death cannot leave the iron priest in an endless barricade battle', () => {
    const run = fresh('ch_echoer', { seed: 1004, act: 2 });
    const battle = startBattle(run, [enemy('e_chitin_carrier'), enemy('e_iron_priest')]);
    const carrier = battle.enemies[0];
    const priest = battle.enemies[1];
    resolveOps([{ op: 'damage', v: 1000, raw: true }], makeCtx(battle, battle.player, carrier, 'test'));
    assert.equal(carrier.dead, true);
    assert.equal(priest.status.barricade, 1);
    // Recreate the defensive state that previously left both sides unable to end combat.
    battle.player.hp = 4;
    priest.hp = 26; priest.block = 40; priest.status.metallicize = 12;
    const turns = runToEnd(battle, 40);
    assert.ok(turns <= 40);
  });

  await test('rivet starter and a built barricade deck finish real boss encounters within a turn limit', () => {
    let encounters = 0;
    for (const boss of ALL_ENEMIES.filter((entry) => entry.tier === 'boss')) {
      for (const built of [false, true]) {
        const run = fresh('ch_riveter', { seed: 900 + encounters, act: boss.act });
        if (built) {
          run.deck = ['c_r_rivet_strike', 'c_r_rivet_strike', 'c_r_seam_guard', 'c_r_seam_guard',
            'c_r_plate_ram', 'c_r_plate_ram', 'c_r_locking_beam', 'c_r_iron_horizon',
            'c_r_bastion_press', 'c_r_emergency_bulkhead']
            .map((id, index) => ({ id, uid: `built#${index}`, upgraded: boss.act > 1 }));
        }
        const battle = startBattle(run, [boss], { tier: 'boss' });
        const turns = runToEnd(battle);
        assert.ok(turns <= 60, boss.id);
        encounters++;
      }
    }
    assert.ok(encounters >= 18);
    console.log(`  completed ${encounters} boss/deck combinations`);
  });

  await test('potion power strengthens combat values while preserving permanent operations and generated cards', () => {
    const run = fresh();
    run.potionPower = 4;
    const oil = potion('p_tempering_oil');
    const trance = potion('p_battle_trance');
    const sulfur = potion('p_sulfur_draft');
    const marrow = potion('p_marrow_cordial');
    assert.ok(oil && trance && sulfur && marrow);
    const before = JSON.stringify([oil, trance, sulfur, marrow]);
    const oils = potionEffects(run, oil);
    assert.equal(walk(oils).find((op) => op.op === 'upgradeCard').n, 1);
    applyRunEffects(run, oils);
    assert.equal(run.deck.filter((card) => card.upgraded).length, 1);
    assert(potionDisplay(run, oil).desc.includes('1 张牌'));
    assert(potionDisplay(run, trance).desc.includes('5 点能量'));
    assert(potionDisplay(run, trance).desc.includes('2 张【重击】'));
    const { battle, player } = arena();
    battle.run.potionPower = 4;
    battle.run.potions = [trance.id, sulfur.id, marrow.id];
    const energy = battle.energy;
    const hand = battle.hand.length;
    assert.equal(usePotion(battle, trance.id).ok, true);
    assert.equal(battle.energy - energy, 5);
    assert.equal(battle.hand.length - hand, 3);
    assert.equal(battle.hand.filter((card) => card.id === 'c_burn_wave').length, 1);
    assert.equal(battle.hand.filter((card) => card.id === 'c_bash').length, 2);
    const hp = player.hp;
    const nextEnergy = battle.energy;
    assert.equal(usePotion(battle, sulfur.id).ok, true);
    assert.equal(battle.energy - nextEnergy, 7);
    assert.equal(hp - player.hp, 3);
    const maxHp = player.maxHp;
    assert.equal(usePotion(battle, marrow.id).ok, true);
    assert.equal(player.maxHp - maxHp, 3);
    assert.equal(JSON.stringify([oil, trance, sulfur, marrow]), before);
  });

  await test('permanent upgrades always choose an eligible card and reject cards without upgrade effects', () => {
    const run = fresh();
    const unchanged = ALL_CARDS.find((card) => !card.upgrade);
    assert(unchanged);
    run.deck = Array.from({ length: 12 }, (_, i) => ({ id: unchanged.id, uid: `fixed#${i}`, upgraded: false }));
    run.deck.push({ id: 'c_strike', uid: 'eligible', upgraded: false });
    assert.equal(upgradeCardAt(run, 0), null);
    applyRunEffects(run, potionEffects(run, potion('p_tempering_oil')));
    assert.equal(run.deck.at(-1).upgraded, true);
    assert(run.deck.slice(0, -1).every((card) => !card.upgraded));
    applyRunEffects(run, [{ op: 'upgradeCard', n: 10 }]);
    assert.equal(run.deck.filter((card) => card.upgraded).length, 1);
  });

  await test('new enemy moves and event choices execute through their real encounter paths', async () => {
    const { validateEncounters } = require('./encountertest.js');
    const result = await validateEncounters();
    assert.equal(result.checkedEnemies, 24);
    assert.equal(result.checkedEvents, 24);
    assert.ok(result.checkedMoves > 0 && result.checkedOptions > 0);
    console.log(`  checked ${result.checkedMoves} new moves and ${result.checkedOptions} event choices`);
  });

  console.error = originalError;
  await test('content effects execute without swallowed interpreter errors', () => assert.equal(effectErrors.length, 0));
  console.log(`Content regression: ${passed} passed, ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
