#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const R = (p) => pathToFileURL(path.join(__dirname, '..', p)).href;

(async () => {
  const { newRun, addCard, cardDisplay, rollCardReward } = await import(R('src/core/run.js'));
  const { entryNodes, reachableNodes, enterNode, findNode, isMapComplete, farthestReachable } = await import(R('src/systems/map.js'));
  const { newMeta, loadMeta, saveMeta, bonuses, nightlyIncome, facilityDesc, MAX_NIGHT } = await import(R('src/systems/meta.js'));
  const { FACILITIES } = await import(R('src/data/facilities.js'));
  const { CARD_MAP, card: cardDef } = await import(R('src/data/index.js'));
  const { ensureCommissionBoard, chooseCommission, beginCommission, commissionProgress,
    commissionRank, settleCommission, expireCommission } = await import(R('src/systems/commissions.js'));
  let passed = 0;
  function check(name, test) {
    test();
    passed += 1;
    console.log(`PASS ${name}`);
  }

  for (const [act, rows] of [[1, 15], [2, 18], [3, 20], [4, 20], [5, 22], [6, 24]]) {
    check(`act ${act}: complete connected paths across 32 seeds`, () => {
      for (let seed = 1; seed <= 32; seed++) {
        const run = newRun(newMeta(), 'ch_ashborn', { seed, act });
        const map = run.map;
        assert.equal(run.act, act);
        assert.equal(map.act, act);
        assert.equal(map.rows, rows);
        assert.equal(entryNodes(map).length, 1);
        assert.equal(map.grid.flat().filter((n) => n.state === 'available').length, 1);
        assert.equal(farthestReachable(map).row, rows - 1);
        for (const n of map.grid.flat()) {
          if (n.row < rows - 1) assert(n.links.length > 0, `${n.id} has no successor`);
          for (const id of n.links) {
            assert.equal(typeof id, 'string');
            const next = findNode(map, id);
            assert(next, `${id} does not exist`);
            assert.equal(next.row, n.row + 1);
          }
        }
        for (let row = 0; row < rows; row++) {
          const options = reachableNodes(map);
          assert(options.length > 0, `seed ${seed}, row ${row} is blocked`);
          assert(options.every((n) => n.row === row));
          const node = options[(seed + row) % options.length];
          assert.equal(enterNode(run, node.id), node);
          assert.equal(enterNode(run, node.id), null, 'visited node can be entered twice');
        }
        assert.equal(map.visited.length, rows);
        assert.equal(new Set(map.visited).size, rows);
        assert.equal(run.stats.nodesVisited, rows);
        assert.equal(reachableNodes(map).length, 0);
        assert.equal(isMapComplete(map), true);
        assert.equal(map.complete, true);
      }
    });
  }

  check('reject hidden entries, skipped rows, disconnected and duplicate nodes without changing progress', () => {
    const run = newRun(newMeta(), 'ch_ashborn', { seed: 9 });
    const snapshot = () => JSON.stringify({ map: run.map, stats: run.stats });
    const before = snapshot();
    assert.equal(enterNode(run, 'missing'), null);
    assert.equal(enterNode(run, run.map.grid[0][1].id), null);
    assert.equal(enterNode(run, run.map.grid[2][0].id), null);
    assert.equal(snapshot(), before);
    const first = reachableNodes(run.map)[0];
    enterNode(run, first.id);
    const disconnected = run.map.grid[1].find((n) => !first.links.includes(n.id));
    assert(disconnected);
    const afterEntry = snapshot();
    assert.equal(enterNode(run, disconnected.id), null);
    assert.equal(enterNode(run, first.id), null);
    assert.equal(snapshot(), afterEntry);
    run.map.currentId = 'missing';
    assert.deepEqual(reachableNodes(run.map), []);
    assert.equal(enterNode(run, first.links[0]), null);
  });

  check('map generation is deterministic for seed and act', () => {
    const make = () => newRun(newMeta(), 'ch_ashborn', { seed: 7788, act: 2 }).map;
    assert.deepEqual(make(), make());
  });

  check('facility income at every level, including maximum levels', () => {
    const expected = {
      bar: [0, 10, 22, 38], forge: [0, 0, 6, 14], apothecary: [0, 0, 8],
      rooms: [0, 0, 5], intel: [0, 0, 7], docks: [0, 4, 12], crypt: [0, 0, 10],
      furnace: [0, 0, 12], stage: [0, 0, 9], vault: [0, 8, 20],
      ward: [0, 0, 11], lighthouse: [0, 0, 13],
      potion_still: [0, 2, 7], commission_house: [0, 2, 6],
      training_yard: [0, 0, 4], supply_depot: [0, 2, 5],
    };
    for (const f of FACILITIES) {
      for (let lv = 0; lv <= f.max; lv++) {
        const meta = newMeta();
        for (const id of Object.keys(meta.facilities)) meta.facilities[id] = 0;
        meta.facilities[f.id] = lv;
        const income = nightlyIncome(meta);
        assert.equal(income.base, expected[f.id][lv], `${f.id} level ${lv}`);
        const total = f.id === 'vault' && lv > 0 ? Math.round(expected[f.id][lv] * 1.15) : expected[f.id][lv];
        assert.equal(income.total, total);
        assert.equal(income.net, total);
        assert(facilityDesc(f, lv).includes(String(expected[f.id][lv])));
      }
    }
    const meta = newMeta();
    for (const f of FACILITIES) meta.facilities[f.id] = f.max;
    assert.equal(nightlyIncome(meta).base, 181);
    assert.equal(nightlyIncome(meta).net, 208);
  });

  check('quantity bonuses follow facility levels and fixed effects remain fixed', () => {
    const meta = newMeta();
    for (const level of [1, 2]) {
      for (const f of FACILITIES) meta.facilities[f.id] = level;
      const b = bonuses(meta);
      for (const key of ['potionSlots', 'mapReveal', 'relicChoice', 'cardChoice', 'tideWard']) assert.equal(b[key], level, key);
      assert.equal(b.shopCards, 1);
      assert.equal(b.shopDiscount, 0.1);
      assert.equal(b.incomePct, 0.15);
      assert.equal(b.keepGold, 0.3);
      assert.equal(b.dealChance, 0.25);
      assert.equal(b.forgeUpgrade, 1);
      assert.equal(b.campfireRemove, true);
      assert.equal(b.restHeal, true);
    }
    meta.upgrades.u_insurance = 1;
    assert.equal(bonuses(meta).keepGold, 0.6);
  });

  check('upgraded card display includes zero costs, all override flags and instance identity', () => {
    const original = cardDef('c_guard');
    const guard = cardDisplay(null, { id: original.id, uid: 'guard-instance', upgraded: true });
    assert.equal(guard.cost, 0);
    assert.equal(guard.effects[0].v, 8);
    assert.equal(original.cost, 1);
    const id = 'c_progress_override_probe';
    const def = {
      id, name: 'Probe', type: 'skill', rarity: 'common', cost: 2, target: 'enemy',
      exhaust: true, ethereal: true, innate: false, retain: false, playable: true,
      effects: [{ op: 'block', v: 1 }],
      upgrade: {
        cost: 0, target: 'self', exhaust: false, ethereal: false, innate: true,
        retain: true, playable: false, effects: [{ op: 'block', v: 5 }],
      },
    };
    CARD_MAP.set(id, def);
    try {
      const inst = { id, uid: 'override-instance', upgraded: true };
      const shown = cardDisplay(null, inst);
      assert.equal(shown.name, 'Probe+');
      assert.equal(shown.instanceUid, inst.uid);
      assert.equal(shown.upgraded, true);
      assert.equal(shown.id, id);
      assert.equal(shown.cost, 0);
      assert.equal(shown.target, 'self');
      assert.equal(shown.exhaust, false);
      assert.equal(shown.ethereal, false);
      assert.equal(shown.innate, true);
      assert.equal(shown.retain, true);
      assert.equal(shown.playable, false);
      assert.equal(shown.effects[0].v, 5);
      assert.equal(def.exhaust, true);
      assert.equal(def.effects[0].v, 1);
    } finally {
      CARD_MAP.delete(id);
    }
  });

  check('card reward pools continue to exclude locked cards', () => {
    const meta = newMeta();
    const run = newRun(meta, 'ch_ashborn', { seed: 321 });
    run.meta = meta;
    const open = cardDef('c_strike');
    const locked = { ...open, id: 'c_progress_locked_probe', unlock: { embers: 10 } };
    run.pool.cards = new Map([[open.id, open], [locked.id, locked]]);
    assert(rollCardReward(run, 20).every((c) => c.id === open.id));
    meta.unlocks.cards.add(locked.id);
    assert(rollCardReward(run, 20).some((c) => c.id === locked.id));
  });

  check('commission offers and selection remain stable and completed offers rotate out', () => {
    const meta = newMeta();
    const board = ensureCommissionBoard(meta);
    assert.deepEqual(board.offers, ensureCommissionBoard(newMeta()).offers);
    assert.equal(board.offers.length, 3);
    const firstOffers = [...board.offers];
    assert.equal(chooseCommission(meta, firstOffers[0]), true);
    assert.equal(chooseCommission(meta, 'missing'), false);
    assert.equal(board.selectedId, firstOffers[0]);
    ensureCommissionBoard(meta, 5);
    assert.deepEqual(board.offers.slice(0, 3), firstOffers);
    assert.equal(new Set(board.offers).size, 5);
    board.completed.push({ id: firstOffers[0], night: 1 });
    meta.night = 2;
    ensureCommissionBoard(meta, 12);
    assert.equal(board.selectedId, null);
    assert.equal(board.resolved, false);
    assert(!board.offers.includes(firstOffers[0]));
  });

  check('event and elite commissions have legal routes in all acts across 128 seeds', () => {
    for (const act of [1, 2, 3, 4, 5, 6]) {
      for (let seed = 1; seed <= 128; seed++) {
        for (const [id, type, target] of [
          ['commission_lantern', 'event', 2], ['commission_elite', 'elite', 1],
        ]) {
          const meta = newMeta();
          ensureCommissionBoard(meta, 12);
          assert(chooseCommission(meta, id, 12));
          const run = newRun(meta, 'ch_riveter', { seed, act });
          const before = run.map.grid.flat().map((n) => ({ id: n.id, row: n.row, type: n.type, links: [...n.links] }));
          const rngCalls = run.rng.calls;
          beginCommission(meta, run, 12);
          assert.equal(run.rng.calls, rngCalls, 'route guarantee consumed expedition RNG');
          for (const original of before) {
            const node = findNode(run.map, original.id);
            assert.deepEqual(node.links, original.links);
            if (original.row < 4 || original.row >= run.map.rows - 3 || original.type !== 'battle') {
              assert.equal(node.type, original.type, 'protected node changed');
            }
          }
          const scores = new Map();
          scores.set(entryNodes(run.map)[0].id, 0);
          for (const row of run.map.grid) {
            for (const node of row) {
              if (!scores.has(node.id)) continue;
              const score = scores.get(node.id) + (node.type === type ? 1 : 0);
              if (node.type === 'boss') assert(score >= target, `act ${act}, seed ${seed}, ${type}: unreachable goal`);
              for (const next of node.links) scores.set(next, Math.max(scores.get(next) ?? -1, score));
            }
          }
          assert(scores.has(run.map.grid.at(-1)[0].id), 'no legal route to boss');
          const same = newRun(meta, 'ch_riveter', { seed, act });
          beginCommission(meta, same, 12);
          assert.deepEqual(same.map, run.map);
        }
      }
    }
  });

  check('commission progress excludes starting bonuses and requires a successful return', () => {
    const meta = newMeta();
    ensureCommissionBoard(meta, 12);
    chooseCommission(meta, 'commission_archive', 12);
    const run = newRun(meta, 'ch_lantern', { seed: 81 });
    addCard(run, 'c_strike');
    addCard(run, 'c_guard');
    beginCommission(meta, run, 12);
    assert.equal(commissionProgress(run)[0].value, 0);
    for (let i = 0; i < 3; i++) addCard(run, 'c_strike');
    assert.equal(commissionProgress(run)[0].value, 3);
    assert.equal(commissionProgress(run)[0].complete, true);
    const before = { gold: meta.gold, embers: meta.embers };
    const result = settleCommission(meta, run, false, 20);
    assert.equal(result.success, false);
    assert.equal(result.reason, '未能归来');
    assert.equal(meta.gold, before.gold);
    assert.equal(meta.embers, before.embers);
    assert.equal(meta.commissions.reputation, 0);
    assert.equal(settleCommission(meta, run, true, 20), null);
  });

  check('skipping a night expires a commission and blocks stale choices', () => {
    const meta = newMeta();
    const id = ensureCommissionBoard(meta).offers[0];
    chooseCommission(meta, id);
    expireCommission(meta);
    assert.equal(meta.commissions.lastResult.reason, '本夜未出发');
    assert.equal(chooseCommission(meta, id), false);
    assert.equal(meta.commissions.completed.length, 0);
    meta.night += 1;
    const next = ensureCommissionBoard(meta).offers[0];
    assert.equal(chooseCommission(meta, next), true);
    for (const field of ['ending', 'pendingResult']) {
      meta[field] = field === 'ending' ? 'won' : { victory: true };
      assert.equal(chooseCommission(meta, next), false);
      meta[field] = null;
    }
  });

  check('all reputation tiers can affect rewards before the six-night campaign ends', () => {
    assert.equal(commissionRank(5).multiplier, 1);
    assert.equal(commissionRank(6).multiplier, 1.1);
    assert.equal(commissionRank(15).multiplier, 1.2);
    assert.equal(commissionRank(20).multiplier, 1.3);
    assert.equal(commissionRank(20).next, null);
    assert(5 + 4 * 4 >= 20);
  });

  const store = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
  };
  try {
    check('commission selection and once-only payment survive save/load', () => {
      const meta = newMeta();
      ensureCommissionBoard(meta, 12);
      chooseCommission(meta, 'commission_chart', 12);
      meta.commissions.reputation = 20;
      saveMeta(meta);
      const loaded = loadMeta();
      assert.deepEqual(loaded.commissions, meta.commissions);
      const run = newRun(loaded, 'ch_riveter', { seed: 72 });
      beginCommission(loaded, run, 12);
      for (let i = 0; i < 10; i++) enterNode(run, reachableNodes(run.map)[0].id);
      const beforeGold = loaded.gold;
      const beforeEmbers = loaded.embers;
      const result = settleCommission(loaded, run, true, 10);
      assert.equal(result.success, true);
      assert.equal(result.gold, 78);
      assert.equal(loaded.gold, beforeGold + 78);
      assert.equal(loaded.embers, beforeEmbers + 4);
      assert.equal(loaded.commissions.reputation, 23);
      assert.equal(loaded.commissions.completed.length, 1);
      assert.equal(settleCommission(loaded, run, true, 10), null);
      saveMeta(loaded);
      const paid = loadMeta();
      assert.deepEqual(paid.commissions.lastResult, result);
      const staleRun = { ...run, commission: { ...run.commission, settled: false } };
      assert.equal(settleCommission(paid, staleRun, true, 10), null);
      assert.equal(paid.gold, beforeGold + 78);
    });

    check('pending results, terminal state and unlock sets survive save/load', () => {
      const meta = newMeta();
      assert.equal(meta.pendingResult, null);
      assert.equal(meta.ending, null);
      meta.pendingResult = { victory: true, night: 3, embers: 81, keptGold: 220 };
      meta.unlocks.cards.add('c_guard');
      assert.equal(saveMeta(meta), true);
      let loaded = loadMeta();
      assert.deepEqual(loaded.pendingResult, meta.pendingResult);
      assert.equal(loaded.ending, null);
      assert(loaded.unlocks.cards instanceof Set);
      assert(loaded.unlocks.cards.has('c_guard'));
      for (const ending of ['won', 'lost']) {
        meta.ending = ending;
        assert.equal(saveMeta(meta), true);
        loaded = loadMeta();
        assert.equal(loaded.ending, ending);
        assert.deepEqual(loaded.pendingResult, meta.pendingResult);
      }
    });

    check('older saves receive settlement defaults and terminal state migration', () => {
      function loadLegacy(changes) {
        const legacy = newMeta();
        delete legacy.pendingResult;
        delete legacy.ending;
        delete legacy.unlocks;
        delete legacy.commissions;
        Object.assign(legacy, changes);
        store.set('emberpact.save.v1', JSON.stringify(legacy));
        return loadMeta();
      }
      const active = loadLegacy({ night: 2 });
      assert.equal(active.pendingResult, null);
      assert.equal(active.ending, null);
      assert(active.unlocks.cards instanceof Set);
      assert.deepEqual(active.commissions, newMeta().commissions);
      assert.equal(loadLegacy({ hearts: 0 }).ending, 'lost');
      assert.equal(loadLegacy({ night: MAX_NIGHT + 1 }).ending, 'won');
      assert.equal(loadLegacy({ night: MAX_NIGHT + 1, hearts: 0 }).ending, 'lost');
    });
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }

  console.log(`Progress regression: ${passed} checks passed`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
