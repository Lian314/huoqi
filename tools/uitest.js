#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { installDOM } = require('./dom.js');
const { roots } = installDOM();
const moduleURL = (file) => pathToFileURL(path.join(__dirname, '..', file)).href;

const errors = [];
const originalError = console.error;
console.error = (...args) => errors.push(args.map(String).join(' '));
let passed = 0;
const failures = [];
async function step(name, fn) {
  try { await fn(); passed++; process.stdout.write('.'); }
  catch (error) { failures.push(name + ': ' + error.message); process.stdout.write('x'); }
}
function button(text, root = roots.app) {
  const found = root.querySelectorAll('button').find((node) => node.textContent.includes(text) && !node.disabled);
  assert.ok(found, 'Missing enabled button: ' + text);
  return found;
}
async function withTimeout(promise, message, ms = 2500) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })]);
  } finally { clearTimeout(timer); }
}

(async () => {
  const { App } = await import(moduleURL('src/ui/app.js'));
  const { newMeta, saveMeta, loadMeta, facilityCost } = await import(moduleURL('src/systems/meta.js'));
  const { reachableNodes, configureNode } = await import(moduleURL('src/systems/map.js'));
  const { playCard, endTurn, canPlay } = await import(moduleURL('src/systems/battle.js'));
  const { cardDisplay, grantRelic } = await import(moduleURL('src/core/run.js'));
  const { ALL_CHARACTERS, ALL_EVENTS, card: cardDef, potion: potionDef } = await import(moduleURL('src/data/index.js'));
  const { FACILITIES, STAFF } = await import(moduleURL('src/data/facilities.js'));
  const { regionsOf, regionById, encounterById } = await import(moduleURL('src/data/regions.js'));
  const { commissionById, commissionProgress, settleCommission } = await import(moduleURL('src/systems/commissions.js'));
  const { confirmDialog, closeAllModals } = await import(moduleURL('src/ui/fx.js'));
  let previousApp;
  function fresh(night = 1) {
    previousApp?.goto('title');
    localStorage.clear();
    const app = new App(roots.app);
    app.meta = newMeta();
    app.meta.night = night;
    app.meta.flags = { tutorialDone: true, firstRun: false };
    app.meta.unlocks.characters = new Set(ALL_CHARACTERS.map((character) => character.id));
    previousApp = app;
    return app;
  }
  async function acceptCommission(app, id) {
    app.goto('tavern', { tab: 'commission' });
    const entry = commissionById(id);
    const offer = roots.app.querySelectorAll('.commission-offer').find((node) => node.textContent.includes(entry.name));
    assert.ok(offer, 'Commission is not offered: ' + id);
    await button('接下委托', offer).click();
    assert.equal(app.meta.commissions.selectedId, id);
    assert.equal(loadMeta().commissions.selectedId, id);
    return entry;
  }
  function strengthen(run) {
    run.hp = run.maxHp = 5000;
    run.bonusDamage = 100;
  }
  function winBattle(app) {
    const battle = app.battle;
    assert.ok(battle, 'No battle to complete');
    let turns = 0;
    while (battle.phase === 'player' && turns++ < 60) {
      let cards = 0;
      while (battle.phase === 'player' && cards++ < 30) {
        const inst = battle.hand.find((candidate) => canPlay(battle, candidate).ok);
        if (!inst) break;
        const def = canPlay(battle, inst).def;
        const target = def.target === 'enemy' ? battle.enemies.find((enemy) => enemy.hp > 0)?.uid : null;
        assert.ok(playCard(battle, inst.uid, target).ok);
        battle.pending.length = 0;
      }
      if (battle.phase === 'player') endTurn(battle);
    }
    assert.equal(battle.phase, 'won', 'Combat did not reach victory');
    app.onBattleEnd(true);
    return battle;
  }
  async function previewAndEnter(app, node) {
    const control = roots.app.querySelectorAll('.map-node').find((entry) => entry.dataset.nodeId === node.id);
    assert.ok(control, 'Map node is not rendered');
    const visited = app.run.map.visited.length;
    await control.click();
    assert.equal(app.screenName, 'map', 'Preview entered a node');
    assert.equal(app.run.map.visited.length, visited);
    const enter = roots.app.querySelector('.map-enter');
    assert.ok(enter && !enter.disabled, 'Preview has no usable enter control');
    await enter.click();
  }
  async function enterFixture(app, type) {
    const node = reachableNodes(app.run.map)[0];
    assert.ok(node, 'Fixture has no reachable node');
    node.type = type;
    configureNode(app.run, app.run.map, node);
    app.rerender();
    await previewAndEnter(app, node);
    return node;
  }
  async function advanceExpedition(app) {
    if (app.screenName === 'map') {
      const node = reachableNodes(app.run.map)[0];
      assert.ok(node, 'Expedition stalled with no reachable node');
      await previewAndEnter(app, node);
    } else if (app.screenName === 'battle') {
      if (roots['modal-root'].children.length) await button('确认', roots['modal-root']).click();
      winBattle(app);
    }
    else if (app.screenName === 'reward') await button('继续').click();
    else if (app.screenName === 'region') await roots.app.querySelector('.region-enter').click();
    else if (app.screenName === 'site') {
      const done = roots.app.querySelector('.site-continue');
      if (done) await done.click();
      else await button('继续赶路').click();
    } else if (app.screenName === 'shop') await button('离开货摊').click();
    else if (app.screenName === 'event') {
      const choices = roots.app.querySelectorAll('.choice').filter((node) => !node.classList.contains('disabled'));
      if (choices.length) await choices.at(-1).click();
      else await button('继续').click();
    } else if (app.screenName === 'camp') {
      const proceed = roots.app.querySelectorAll('button').find((node) => node.textContent.includes('继续深入'));
      if (proceed) await proceed.click();
      else if (app.params.mode === 'treasure') await button('全部拿走').click();
      else {
        const rest = roots.app.querySelectorAll('.choice').find((node) => node.textContent.includes('休 息') && !node.classList.contains('disabled'));
        if (rest) await rest.click();
        else {
          const upgrade = roots.app.querySelectorAll('.choice').find((node) => node.textContent.includes('锻 炼') && !node.classList.contains('disabled'));
          assert.ok(upgrade);
          await upgrade.click();
          const card = roots['modal-root'].querySelector('.card');
          assert.ok(card, 'No eligible upgrade card at camp');
          await card.click();
        }
      }
    } else assert.fail('Unexpected screen: ' + app.screenName);
  }

  await step('Title renders real controls', async () => {
    const app = fresh();
    app.goto('title');
    assert.ok(roots.app.querySelectorAll('button').length >= 2);
    assert.ok(!roots.app.textContent.includes('[object Object]'));
    await button('点亮第一盏灯').click();
    assert.equal(app.screenName, 'tavern');
  });
  for (const tab of ['home', 'commission', 'facility', 'staff', 'upgrade', 'codex', 'record']) {
    await step('Tavern tab: ' + tab, () => {
      const app = fresh();
      app.goto('tavern', { tab });
      assert.ok(roots.app.querySelectorAll('button').length > 0);
      if (tab === 'facility') assert.equal(roots.app.querySelectorAll('.facility-row').length, FACILITIES.length);
      if (tab === 'staff') assert.equal(roots.app.querySelectorAll('.staff-card').length, STAFF.length);
    });
  }
  await step('Facility purchase changes money and level', async () => {
    const app = fresh();
    app.meta.gold = 5000;
    app.goto('tavern', { tab: 'facility' });
    const level = app.meta.facilities.bar;
    const cost = facilityCost(app.meta, 'bar');
    await roots.app.querySelector('.facility-row').querySelector('button').click();
    assert.equal(app.meta.facilities.bar, level + 1);
    assert.equal(app.meta.gold, 5000 - cost);
    assert.equal(loadMeta().facilities.bar, level + 1);
  });
  await step('Commission draft survives refresh and can be withdrawn before departure', async () => {
    const app = fresh();
    app.meta.facilities.commission_house = 2;
    const entry = await acceptCommission(app, 'commission_hammer');
    assert.equal(roots.app.querySelectorAll('.commission-offer').length, 5);
    const offers = app.meta.commissions.offers.slice();
    app.goto('title');
    const restored = new App(roots.app);
    restored.start();
    assert.equal(restored.screenName, 'tavern');
    assert.deepEqual(restored.meta.commissions.offers, offers);
    assert.equal(restored.meta.commissions.selectedId, entry.id);
    restored.goto('tavern', { tab: 'commission' });
    assert.ok(roots.app.querySelector('.commission-offer.selected').textContent.includes(entry.name));
    await button('撤下委托').click();
    assert.equal(restored.meta.commissions.selectedId, null);
    assert.equal(loadMeta().commissions.selectedId, null);
    previousApp = restored;
  });
  await step('Starting card bonuses do not count as commission acquisitions', async () => {
    const app = fresh();
    app.meta.upgrades.u_start_card = 3;
    await acceptCommission(app, 'commission_archive');
    app.startExpedition('ch_riveter', { seed: 7 });
    assert.equal(app.run.stats.cardsAdded, 3);
    assert.equal(commissionProgress(app.run)[0].value, 0);
    app.run.gold = 1000;
    app.goto('shop', { nodeId: 'commission-shop' });
    await roots.app.querySelector('.card-grid').querySelector('button').click();
    await button('离开货摊').click();
    assert.equal(app.screenName, 'map');
    assert.equal(commissionProgress(app.run)[0].value, 1);
    assert.ok(roots.app.querySelector('.commission-hud').textContent.includes('1/3'));
  });
  await step('Met commission goals still fail on an abandoned expedition and survive refresh', async () => {
    const app = fresh();
    app.meta.facilities.commission_house = 2;
    app.meta.commissions.reputation = 6;
    await acceptCommission(app, 'commission_alchemy');
    app.startExpedition('ch_riveter', { seed: 7 });
    const run = app.run;
    run.hp = 30;
    run.potions = ['p_quay_salve', 'p_marrow_cordial'];
    app.rerender();
    assert.ok(roots.app.querySelector('.commission-hud').textContent.includes('0/2'));
    for (const name of ['码头膏', '髓酿']) {
      const potion = roots.app.querySelector('.hud').querySelectorAll('.potion-btn').find((node) => node.getAttribute('title')?.includes(name));
      assert.ok(potion && !potion.disabled);
      await potion.click();
    }
    assert.equal(run.stats.potionsUsed, 2);
    assert.equal(commissionProgress(run)[0].complete, true);
    assert.ok(roots.app.querySelector('.commission-hud').textContent.includes('2/2'));
    const gold = app.meta.gold;
    app.abandonRun('委托测试：撤退');
    const result = app.runResult.commission;
    assert.equal(result.success, false);
    assert.equal(result.reason, '未能归来');
    assert.equal(result.goals[0].value, 2);
    assert.equal(result.gold, 0);
    assert.equal(result.embers, 0);
    assert.equal(result.reputation, 0);
    assert.equal(app.meta.gold, gold);
    assert.equal(app.meta.commissions.reputation, 6);
    assert.equal(app.meta.commissions.completed.length, 0);
    assert.ok(roots.app.querySelector('.commission-report').textContent.includes('未能归来'));
    app.goto('title');
    const restored = new App(roots.app);
    restored.start();
    assert.equal(restored.screenName, 'summary');
    assert.deepEqual(restored.runResult.commission, result);
    assert.equal(settleCommission(restored.meta, run, true, 20), null);
    assert.equal(restored.meta.gold, gold);
    assert.equal(restored.meta.commissions.reputation, 6);
    previousApp = restored;
  });
  await step('Successful return without commission goals does not pay the commission', async () => {
    const app = fresh();
    await acceptCommission(app, 'commission_hammer');
    app.startExpedition('ch_riveter', { seed: 7 });
    const gold = app.meta.gold + app.run.gold;
    app.finishRun(true);
    assert.equal(app.runResult.commission.success, false);
    assert.equal(app.runResult.commission.reason, '目标未达成');
    assert.equal(app.runResult.commission.goals[0].value, 0);
    assert.equal(app.meta.gold, gold);
    assert.equal(app.meta.commissions.completed.length, 0);
    assert.equal(loadMeta().commissions.lastResult.success, false);
    assert.ok(roots.app.querySelector('.commission-report').textContent.includes('目标未达成'));
  });
  await step('Closing for business expires the selected commission without a payout', async () => {
    const app = fresh();
    await acceptCommission(app, 'commission_hammer');
    app.goto('tavern');
    const closing = button('闭门经营').click();
    await button('开门迎客', roots['modal-root']).click();
    await withTimeout(closing, 'Business confirmation did not complete');
    assert.equal(app.meta.night, 2);
    assert.equal(app.meta.commissions.selectedId, null);
    assert.equal(app.meta.commissions.lastResult.night, 1);
    assert.equal(app.meta.commissions.lastResult.reason, '本夜未出发');
    assert.equal(app.meta.commissions.lastResult.gold, 0);
    assert.equal(app.meta.commissions.reputation, 0);
    assert.equal(app.meta.commissions.completed.length, 0);
    assert.equal(loadMeta().commissions.lastResult.reason, '本夜未出发');
  });
  for (const character of ALL_CHARACTERS) {
    await step('Expedition: ' + character.id, () => {
      const app = fresh();
      app.goto('select');
      app.startExpedition(character.id, { seed: 7 });
      assert.equal(app.run.characterId, character.id);
      assert.equal(app.screenName, 'map');
      assert.ok(roots.app.querySelector('.map-node'));
      assert.equal(reachableNodes(app.run.map).length, 1);
    });
  }
  for (const night of [1, 2, 3, 4, 5, 6]) {
    await step('Initial act and map match: night ' + night, () => {
      const app = fresh(night);
      app.startExpedition('ch_ashborn', { seed: 7 });
      assert.equal(app.run.act, night);
      assert.equal(app.run.map.act, app.run.act);
      assert.equal(app.run.endAct, night <= 3 ? 3 : night);
    });
  }
  await step('Starting bonus respects locked cards', () => {
    const app = fresh();
    app.meta.upgrades.u_start_card = 3;
    app.startExpedition('ch_ashborn', { seed: 7 });
    for (const instance of app.run.deck) assert.ok(!cardDef(instance.id).unlock?.embers);
  });
  await step('Shop sells cards and old purchase cannot charge twice', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.gold = 1000;
    app.goto('shop', { nodeId: 'test-shop' });
    assert.equal(app.run.shopState.cards.length, 5);
    for (const item of app.run.shopState.cards) assert.ok(!cardDef(item.id).unlock?.embers);
    const item = app.run.shopState.cards[0];
    const buy = roots.app.querySelector('.card-grid').querySelector('button');
    const before = app.run.deck.length;
    await buy.click();
    await buy.click();
    assert.equal(app.run.deck.length, before + 1);
    assert.equal(app.run.gold, 1000 - item.price);
  });
  await step('Shop picker closes and cannot spend into negative money', async () => {
    const app = fresh();
    app.meta.upgrades.u_card_removal = 1;
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.gold = 65;
    app.goto('shop', { nodeId: 'remove-shop' });
    const removePanel = roots.app.querySelectorAll('.panel').find((node) => node.textContent.includes('拆解服务'));
    await removePanel.querySelectorAll('button').find((node) => node.textContent.includes('60')).click();
    const cards = roots['modal-root'].querySelectorAll('.card');
    const before = app.run.deck.length;
    await cards[0].click();
    await cards[1].click();
    assert.equal(roots['modal-root'].children.length, 0);
    assert.equal(app.run.gold, 5);
    assert.equal(app.run.deck.length, before - 1);
  });
  await step('Camp action survives potion redraw and rejects old picker', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.goto('camp', { nodeId: 'test-rest', mode: 'rest' });
    await roots.app.querySelectorAll('.choice').find((node) => node.textContent.includes('锻 炼')).click();
    const choices = roots['modal-root'].querySelectorAll('.card');
    await choices[0].click();
    await choices[1].click();
    assert.equal(app.run.deck.filter((card) => card.upgraded).length, 1);
    assert.equal(roots['modal-root'].children.length, 0);
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(app.run.hp, 42);
    assert.equal(app.run.potions.length, 0);
    assert.equal(roots.app.querySelectorAll('.choice').length, 0);
  });
  await step('Reward redraw keeps step and offers and rejects old claim', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.goto('reward', { tier: 'elite', nodeId: 'test-reward' });
    const offers = app.run._rewardState.queue[0].offers.slice();
    const staleClaim = button('收下');
    const before = app.run.deck.length;
    await staleClaim.click();
    assert.equal(app.run._rewardState.idx, 1);
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(app.run._rewardState.idx, 1);
    assert.deepEqual(app.run._rewardState.queue[0].offers, offers);
    await staleClaim.click();
    assert.equal(app.run.deck.length, before + 1);
    assert.equal(app.run.stats.potionsUsed, 1);
  });
  await step('Event cannot be chosen again after potion redraw', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.eventSeed = { 'test-event': ALL_EVENTS[0].id };
    app.goto('event', { nodeId: 'test-event' });
    const choices = roots.app.querySelectorAll('.choice');
    await choices[choices.length - 1].click();
    const outcome = JSON.stringify(app.run.eventOutcomes['test-event']);
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(JSON.stringify(app.run.eventOutcomes['test-event']), outcome);
    assert.equal(roots.app.querySelectorAll('.choice').length, 0);
  });
  await step('Combat-only potions are not consumed or redirected at the player outside battle', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.hp = 2;
    app.run.potions = ['p_iron_tonic', 'p_volatile_ash', 'p_sulfur_draft'];
    app.rerender();
    const potions = roots.app.querySelector('.hud').querySelectorAll('.potion-btn');
    assert.ok(potions.every((node) => node.disabled));
    for (const id of app.run.potions.slice()) {
      app.usePotionOutOfBattle(potionDef(id));
    }
    assert.equal(app.run.hp, 2);
    assert.deepEqual(app.run.potions, ['p_iron_tonic', 'p_volatile_ash', 'p_sulfur_draft']);
    assert.equal(app.run.stats.potionsUsed, 0);
  });
  await step('Permanent potions work outside battle and cannot revive a dead expedition', () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.hp = 30;
    app.run.potions = ['p_vital_salts', 'p_etching_acid', 'p_warm_brandy'];
    const maxHp = app.run.maxHp;
    const deckSize = app.run.deck.length;
    app.usePotionOutOfBattle(potionDef('p_vital_salts'));
    assert.equal(app.run.maxHp, maxHp + 5);
    assert.equal(app.run.hp, 40);
    app.usePotionOutOfBattle(potionDef('p_etching_acid'));
    assert.equal(app.run.deck.length, deckSize - 2);
    app.run.hp = 0;
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(app.run, null);
    assert.equal(app.meta.stats.deaths, 1);
    assert.equal(app.runResult.hpLeft, 0);
    assert.equal(app.runResult.potionsUsed, 2);
  });
  await step('Relic chance is consumed once per normal reward', () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.relicFind = 1;
    app.goto('reward', { tier: 'normal', nodeId: 'lucky-reward' });
    assert.ok(app.run._rewardState.queue.some((entry) => entry.kind === 'relic'));
    const calls = app.run.rng.calls;
    app.rerender();
    assert.equal(app.run.rng.calls, calls);
  });
  await step('Battle health is synchronized and cannot settle twice', () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.hp = 20;
    app.beginEncounter('sentry');
    assert.equal(app.battle.player.hp, 20);
    assert.equal(roots.app.querySelector('.hp-text').textContent, '20/70');
    app.battle.player.hp = 13;
    app.battle.phase = 'won';
    app.onBattleEnd(true);
    assert.equal(app.run.hp, 13);
    const gold = app.run.gold;
    app.onBattleEnd(true);
    assert.equal(app.run.gold, gold);
  });
  await step('Battle HUD cannot consume potion through outside path', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.potions = ['p_warm_brandy'];
    app.beginEncounter('sentry');
    app.battle.player.hp = 10;
    const hudPotion = roots.app.querySelector('.hud').querySelector('.potion-btn');
    assert.ok(hudPotion.disabled);
    await hudPotion.click();
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(app.battle.player.hp, 10);
    assert.equal(app.run.potions.length, 1);
  });
  for (const won of [false, true]) {
    await step('End-turn ' + (won ? 'victory' : 'death') + ' discards pending scry and settles without a modal', async () => {
      const app = fresh();
      app.startExpedition('ch_ichor', { seed: 7 });
      if (won) grantRelic(app.run, 'relic_gilded_crucible');
      else app.run.hp = 1;
      app.beginEncounter('sentry');
      const battle = app.battle;
      assert.ok(battle.draw.length > 0, 'Scry must have a card available to display');
      if (won) {
        for (const enemy of battle.enemies) { enemy.hp = 1; enemy.block = 0; }
      } else {
        const enemy = battle.enemies[0];
        const move = enemy.def.moves.find((candidate) => candidate.effects.some((op) => op.op === 'damage' && op.v > 0));
        assert.ok(move, 'A lethal enemy attack must be available');
        enemy.intent = { moveId: move.id, kind: move.intent, dmg: move.dmg, hidden: false };
      }
      let settlements = 0;
      const originalBattleEnd = app.onBattleEnd.bind(app);
      let resolveSettlement;
      const settled = new Promise((resolve) => { resolveSettlement = resolve; });
      app.onBattleEnd = (victory) => {
        settlements += 1;
        originalBattleEnd(victory);
        resolveSettlement();
      };
      await withTimeout(button('结束回合').click(), 'End-turn action waited for an irrelevant scry modal');
      assert.equal(battle.phase, won ? 'won' : 'lost');
      assert.equal(battle.pending.length, 0);
      assert.equal(roots['modal-root'].children.length, 0);
      await withTimeout(settled, 'Terminal battle did not settle automatically');
      assert.equal(settlements, 1);
      assert.equal(app.battle, null);
      assert.equal(app.screenName, won ? 'reward' : 'summary');
      if (!won) {
        assert.equal(app.runResult.victory, false);
        assert.equal(app.runResult.hpLeft, 0);
        assert.equal(app.meta.hearts, 2);
        assert.equal(app.meta.stats.deaths, 1);
      }
    });
  }
  await step('Completed result resumes after refresh without duplicate reward', async () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.finishRun(true);
    const savedGold = app.meta.gold;
    const savedEmbers = app.meta.embers;
    app.goto('title');
    const restored = new App(roots.app);
    restored.start();
    assert.equal(restored.screenName, 'summary');
    assert.equal(restored.runResult.victory, true);
    restored.startExpedition('ch_ashborn');
    assert.equal(restored.run, null);
    assert.equal(restored.meta.gold, savedGold);
    assert.equal(restored.meta.embers, savedEmbers);
    const nextNight = button('进入下一夜');
    await nextNight.click();
    assert.equal(restored.meta.night, 2);
    assert.equal(restored.meta.pendingResult, null);
    assert.equal(loadMeta().night, 2);
    const settledGold = restored.meta.gold;
    await nextNight.click();
    assert.equal(restored.meta.night, 2);
    assert.equal(restored.meta.gold, settledGold);
    previousApp = restored;
  });
  for (const victory of [false, true]) {
    await step('Final night remains ended after refresh: ' + victory, async () => {
      const app = fresh(6);
      app.startExpedition('ch_ashborn', { seed: 7 });
      app.finishRun(victory);
      await button('回到酒馆').click();
      assert.equal(app.meta.ending, victory ? 'won' : 'lost');
      const restored = new App(roots.app);
      restored.start();
      restored.startExpedition('ch_ashborn');
      assert.equal(restored.run, null);
      assert.equal(restored.meta.ending, victory ? 'won' : 'lost');
      assert.equal(restored.meta.night, 6);
      previousApp = restored;
    });
  }
  await step('Zero-heart old save cannot launch an expedition', () => {
    const app = fresh();
    app.meta.hearts = 0;
    saveMeta(app.meta);
    const restored = new App(roots.app);
    restored.start();
    restored.startExpedition('ch_ashborn');
    assert.equal(restored.run, null);
    assert.equal(restored.screenName, 'summary');
    previousApp = restored;
  });
  await step('Deck viewer renders upgraded cards', () => {
    const app = fresh();
    app.startExpedition('ch_ashborn', { seed: 7 });
    app.run.deck[0].upgraded = true;
    app.openDeck();
    assert.ok(document.body.querySelector('.card.upgraded'));
    assert.equal(cardDisplay(app.run, app.run.deck[0]).name, '挥击+');
  });
  await step('Departure keeps the selected region when changing travelers and ignores old controls', async () => {
    const app = fresh();
    app.goto('select');
    const second = roots.app.querySelectorAll('.region-choice')[1];
    const regionId = second.dataset.regionId;
    await second.click();
    const oldDeparture = roots.app.querySelector('.expedition-enter');
    await roots.app.querySelectorAll('.traveler-choices')[0].querySelectorAll('button')
      .find((node) => node.dataset.characterId === 'ch_riveter').click();
    await oldDeparture.click();
    assert.equal(app.run, null);
    await roots.app.querySelector('.expedition-enter').click();
    assert.equal(app.run.characterId, 'ch_riveter');
    assert.equal(app.run.map.regionId, regionId);
  });
  await step('Map preview keeps the pinned encounter through a potion redraw and rejects old entry', async () => {
    const app = fresh(4);
    app.startExpedition('ch_riveter', { seed: 912, regionId: regionsOf(4)[1].id });
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.rerender();
    const run = app.run;
    const node = reachableNodes(run.map)[0];
    const group = encounterById(run.map.regionId, node.encounterId);
    const calls = run.rng.calls;
    await roots.app.querySelectorAll('.map-node').find((entry) => entry.dataset.nodeId === node.id).click();
    assert.ok(roots.app.querySelector('.map-preview').textContent.includes(group.name));
    assert.equal(run.rng.calls, calls);
    assert.equal(run.map.visited.length, 0);
    const oldEntry = roots.app.querySelector('.map-enter');
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.equal(app.params.previewNodeId, node.id);
    await oldEntry.click();
    assert.equal(app.screenName, 'map');
    assert.equal(run.map.visited.length, 0);
    await roots.app.querySelector('.map-enter').click();
    assert.equal(app.screenName, 'battle');
    assert.deepEqual(app.battle.enemies.map((enemy) => enemy.def.id), group.enemies);
    assert.equal(app.battle.region.id, run.map.regionId);
    assert.equal(app.battle.encounterName, group.name);
    assert.equal(run.stats.regionsVisited, 1);
  });
  await step('An event shown on the map is the event entered without a second random roll', async () => {
    const app = fresh(5);
    app.startExpedition('ch_riveter', { seed: 222 });
    const node = reachableNodes(app.run.map)[0];
    node.type = 'event';
    configureNode(app.run, app.run.map, node);
    app.rerender();
    await roots.app.querySelectorAll('.map-node').find((entry) => entry.dataset.nodeId === node.id).click();
    const event = ALL_EVENTS.find((entry) => entry.id === node.eventId);
    assert.ok(roots.app.querySelector('.map-preview').textContent.includes(event.name));
    const calls = app.run.rng.calls;
    await roots.app.querySelector('.map-enter').click();
    assert.equal(app.screenName, 'event');
    assert.equal(app.run.eventSeed[node.id], event.id);
    assert.equal(app.run.rng.calls, calls);
    assert.ok(roots.app.textContent.includes(event.name));
  });
  await step('Opening regional scry runs before the first action and rejects its old confirmation', async () => {
    const app = fresh(2);
    app.startExpedition('ch_riveter', { seed: 44, regionId: 'r_bell_corridor' });
    await previewAndEnter(app, reachableNodes(app.run.map)[0]);
    const battle = app.battle;
    const top = battle.draw.slice(-2);
    assert.equal(battle.turn, 1);
    assert.equal(roots['modal-root'].querySelectorAll('.card').length, 2);
    assert.equal(battle.pending.length, 0);
    const endTurn = roots.app.querySelectorAll('button').find((node) => node.textContent.includes('结束回合'));
    assert.ok(endTurn?.disabled, 'End turn remains enabled during opening scry');
    await endTurn.click();
    assert.equal(battle.turn, 1);
    const cards = roots['modal-root'].querySelectorAll('.card');
    await cards[0].click();
    const confirm = button('确认', roots['modal-root']);
    await confirm.click();
    await Promise.resolve();
    assert.ok(!battle.draw.includes(top[0]));
    assert.ok(battle.discard.includes(top[0]));
    assert.ok(battle.draw.includes(top[1]));
    assert.equal(roots['modal-root'].children.length, 0);
    const snapshot = JSON.stringify({ draw: battle.draw, discard: battle.discard, log: battle.log });
    await cards[1].click();
    await confirm.click();
    assert.equal(JSON.stringify({ draw: battle.draw, discard: battle.discard, log: battle.log }), snapshot);
    assert.ok(!button('结束回合').disabled);
    await withTimeout(button('结束回合').click(), 'Opening scry did not release the action lock');
    assert.equal(battle.turn, 2);
    assert.equal(battle.pending.length, 0);
  });
  await step('Boss rewards open the next-region choice and only its current departure can advance', async () => {
    const app = fresh();
    app.meta.facilities.rooms = 1;
    app.startExpedition('ch_riveter', { seed: 443, regionId: regionsOf(1)[0].id });
    strengthen(app.run);
    await enterFixture(app, 'boss');
    winBattle(app);
    while (app.screenName === 'reward') await button('继续').click();
    assert.equal(app.screenName, 'region');
    assert.equal(app.run.pendingAct, 2);
    assert.equal(app.continueToAct(regionsOf(3)[0].id), false);
    const regionControl = roots.app.querySelectorAll('.region-choice')[1];
    const regionId = regionControl.dataset.regionId;
    await regionControl.click();
    app.run.hp = 20;
    app.run.carryStatuses = { burn: 3 };
    const depart = roots.app.querySelector('.region-enter');
    await depart.click();
    assert.equal(app.screenName, 'map');
    assert.equal(app.run.act, 2);
    assert.equal(app.run.map.regionId, regionId);
    assert.equal(app.run.hp, 1270);
    assert.equal(app.run.carryStatuses, null);
    assert.equal(app.run.map.visited.length, 0);
    assert.ok(roots.app.querySelector('.route-status').textContent.includes('0 / 18'));
    const map = app.run.map;
    await depart.click();
    assert.equal(app.run.map, map);
    assert.equal(app.run.hp, 1270);
    assert.equal(app.continueToAct(regionId), false);
  });
  await step('Forge upgrades the chosen instance once and a potion redraw preserves the result', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 91 });
    const node = await enterFixture(app, 'forge');
    await button('磨利工具').click();
    const controls = roots['modal-root'].querySelectorAll('.card');
    const uid = app.run.deck[1].uid;
    const gold = app.run.gold;
    await controls[1].click();
    await controls[0].click();
    assert.equal(app.run.deck.find((inst) => inst.uid === uid).upgraded, true);
    assert.equal(app.run.deck.filter((inst) => inst.upgraded).length, 1);
    assert.equal(app.run.gold, gold);
    assert.equal(app.run.siteStates[node.id].resolved, true);
    assert.equal(roots['modal-root'].children.length, 0);
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    assert.ok(roots.app.querySelector('.site-continue'));
    assert.equal(roots.app.querySelectorAll('.site-choice').length, 0);
  });
  await step('Forge rechecks removal funds and closes old pickers before charging once', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 91 });
    await enterFixture(app, 'forge');
    app.run.gold = 35;
    app.rerender();
    await button('卸下负担').click();
    const picker = roots['modal-root'].querySelectorAll('.card');
    const size = app.run.deck.length;
    app.run.gold = 0;
    await picker[0].click();
    assert.equal(app.run.deck.length, size);
    assert.equal(app.run.gold, 0);
    app.run.hp = 30;
    app.run.potions = ['p_warm_brandy'];
    app.usePotionOutOfBattle(potionDef('p_warm_brandy'));
    app.run.gold = 35;
    await picker[0].click();
    assert.equal(app.run.deck.length, size);
    app.rerender();
    await button('卸下负担').click();
    const controls = roots['modal-root'].querySelectorAll('.card');
    const chosenUid = app.run.deck[1].uid;
    await controls[1].click();
    await controls[0].click();
    assert.ok(!app.run.deck.some((inst) => inst.uid === chosenUid));
    assert.equal(app.run.deck.length, size - 1);
    assert.equal(app.run.gold, 0);
    assert.equal(app.run.stats.cardsRemoved, 1);
  });
  await step('Shrine payment and blessing show live HUD values and apply to the next battle', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 16, regionId: regionsOf(1)[0].id });
    app.run.hp = 30;
    const node = await enterFixture(app, 'shrine');
    const choice = button('燃血烛');
    await choice.click();
    await choice.click();
    assert.equal(app.run.hp, 22);
    assert.equal(app.run.blessings[0].remaining, 3);
    assert.equal(app.run.siteStates[node.id].resolved, true);
    assert.equal(roots.app.querySelector('.hp-text').textContent, '22/74');
    assert.ok(roots.app.querySelector('.route-supplies').textContent.includes('燃血烛 3'));
    await roots.app.querySelector('.site-continue').click();
    await enterFixture(app, 'battle');
    assert.equal(app.battle.player.status.strength, 2);
    assert.equal(app.run.blessings[0].remaining, 2);
  });
  await step('Supply potions respect the remaining slot and cannot be taken twice', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 91 });
    app.run.potions = ['p_warm_brandy', 'p_vital_salts'];
    await enterFixture(app, 'supply');
    const choice = button('取走药箱');
    await choice.click();
    await choice.click();
    assert.equal(app.run.potions.length, 3);
    assert.equal(roots.app.querySelector('.hud').querySelectorAll('.potion-btn').length, 3);
  });
  await step('Supply key unlocks a vault with one relic reward and no repeated key or claim', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 91 });
    await enterFixture(app, 'supply');
    const key = button('取走封印钥匙');
    await key.click();
    await key.click();
    assert.equal(app.run.keys, 1);
    assert.equal(app.run.stats.keysFound, 1);
    assert.ok(roots.app.querySelector('.route-supplies').textContent.includes('钥匙 1'));
    await roots.app.querySelector('.site-continue').click();
    await enterFixture(app, 'vault');
    const unlock = button('用钥匙开封');
    await unlock.click();
    await unlock.click();
    assert.equal(app.screenName, 'reward');
    assert.equal(app.run.keys, 0);
    assert.equal(app.run.stats.keysSpent, 1);
    assert.equal(app.run.stats.vaultsOpened, 1);
    assert.deepEqual(app.run._rewardState.queue.map((entry) => entry.kind), ['relic']);
    const size = app.run.relics.length;
    const relic = roots.app.querySelector('.choice');
    await relic.click();
    await relic.click();
    assert.equal(app.screenName, 'map');
    assert.equal(app.run.relics.length, size + 1);
  });
  await step('Trial completes two real battles with exactly one final reward bundle', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 417 });
    strengthen(app.run);
    const node = await enterFixture(app, 'trial');
    const run = app.run;
    const gold = run.gold;
    const earned = run.stats.goldEarned;
    const encounters = run.encounterCount;
    await button('走入两道闸门').click();
    assert.equal(app.battle.siteWave, '1/2');
    winBattle(app);
    assert.equal(app.screenName, 'site');
    assert.equal(run.siteStates[node.id].battle.phase, 'between');
    assert.equal(run.stats.trialsCleared, 0);
    assert.equal(run.keys, 0);
    const proceed = button('继续第二轮');
    await proceed.click();
    await proceed.click();
    assert.equal(app.battle.siteWave, '2/2');
    assert.equal(run.encounterCount, encounters + 2);
    winBattle(app);
    assert.equal(app.screenName, 'reward');
    assert.equal(app.params.tier, 'trial');
    assert.equal(run.siteStates[node.id].battle.phase, 'won');
    assert.equal(run.stats.trialsCleared, 1);
    assert.equal(run.keys, 1);
    assert.equal(run.activeSite, null);
    assert.equal(run.gold - gold, run.stats.goldEarned - earned);
    assert.equal(run.gold - gold, run.siteStates[node.id].goldEarned + 45);
    assert.equal(run._rewardState.gold, run.gold - gold);
    assert.ok(run._rewardState.queue.some((entry) => entry.kind === 'card'));
    assert.ok(run._rewardState.queue.some((entry) => entry.kind === 'relic'));
    const deckSize = run.deck.length;
    const relicSize = run.relics.length;
    const claim = button('收下');
    await claim.click();
    await claim.click();
    assert.equal(run.deck.length, deckSize + 1);
    const relic = roots.app.querySelector('.choice');
    await relic.click();
    await relic.click();
    while (app.screenName === 'reward') await button('继续').click();
    assert.equal(run.relics.length, relicSize + 1);
    assert.equal(run.stats.trialsCleared, 1);
    assert.equal(run.keys, 1);
    assert.equal(app.screenName, 'map');
  });
  await step('Retreat after trial wave one keeps its gold and does not leak final rewards into supply', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 418 });
    strengthen(app.run);
    const node = await enterFixture(app, 'trial');
    const run = app.run;
    const gold = run.gold;
    await button('走入两道闸门').click();
    winBattle(app);
    const retained = run.gold;
    assert.ok(retained > gold);
    const retreat = button('撤出试炼');
    await retreat.click();
    await retreat.click();
    assert.equal(run.siteStates[node.id].battle.phase, 'retreated');
    assert.equal(run.stats.trialsCleared, 0);
    assert.equal(run.activeSite, null);
    assert.equal(run.keys, 0);
    await roots.app.querySelector('.site-continue').click();
    assert.equal(run.gold, retained);
    assert.equal(app.rewardGold, 0);
    await enterFixture(app, 'supply');
    await button('取走牌袋').click();
    assert.equal(run._rewardState.gold, 0);
    assert.deepEqual(run._rewardState.queue.map((entry) => entry.kind), ['card']);
  });
  await step('Losing trial wave two ends the expedition without paying its final rewards', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 419 });
    strengthen(app.run);
    await enterFixture(app, 'trial');
    const run = app.run;
    await button('走入两道闸门').click();
    winBattle(app);
    const gold = run.gold;
    await button('继续第二轮').click();
    const battle = app.battle;
    battle.player.hp = 1;
    battle.player.block = 0;
    battle.player.status.resolve = 0;
    for (let turns = 0; battle.phase === 'player' && turns < 10; turns++) endTurn(battle);
    assert.equal(battle.phase, 'lost');
    app.onBattleEnd(false);
    assert.equal(app.screenName, 'summary');
    assert.equal(app.runResult.victory, false);
    assert.equal(app.runResult.trialsCleared, 0);
    assert.equal(app.runResult.keptGold + app.runResult.lostGold, gold);
    assert.equal(run.keys, 0);
    assert.equal(app.meta.stats.deaths, 1);
  });
  await step('Vault assault settles an elite once and awards exactly one key', async () => {
    const app = fresh();
    app.startExpedition('ch_riveter', { seed: 420 });
    strengthen(app.run);
    const node = await enterFixture(app, 'vault');
    await button('击败库房守卫').click();
    winBattle(app);
    const gold = app.run.gold;
    app.onBattleEnd(true);
    assert.equal(app.run.gold, gold);
    assert.equal(app.run.stats.elites, 1);
    assert.equal(app.run.stats.vaultsOpened, 1);
    assert.equal(app.run.keys, 1);
    assert.equal(app.run.stats.keysFound, 1);
    assert.equal(app.run.siteStates[node.id].resolved, true);
    assert.ok(app.run._rewardState.queue.some((entry) => entry.kind === 'relic'));
  });
  for (const [night, type] of [[4, 'elite'], [6, 'vault']]) {
    await step('Rooms heal after a late elite victory exactly once: ' + type, async () => {
      const app = fresh(night);
      app.meta.facilities.rooms = 1;
      app.startExpedition('ch_riveter', { seed: 421 });
      strengthen(app.run);
      app.run.hp = 200;
      await enterFixture(app, type);
      if (type === 'vault') await button('击败库房守卫').click();
      const battle = winBattle(app);
      assert.equal(app.run.hp, Math.min(app.run.maxHp, battle.player.hp + Math.round(app.run.maxHp * 0.25)));
      const hp = app.run.hp;
      app.onBattleEnd(true);
      assert.equal(app.run.hp, hp);
      assert.equal(app.run.stats.elites, 1);
      assert.equal(app.run.keys, 1);
    });
  }
  for (const night of [4, 5, 6]) {
    await step('Late-night chapter completes through actual map, reward and report controls: ' + night, async () => {
      const app = fresh(night);
      const region = regionsOf(night)[1];
      app.startExpedition('ch_riveter', { seed: 430 + night, regionId: region.id });
      strengthen(app.run);
      const run = app.run;
      let transitions = 0;
      while (app.run && transitions++ < 220) await advanceExpedition(app);
      assert.ok(transitions < 220, 'Late chapter did not finish');
      assert.equal(app.screenName, 'summary');
      assert.equal(app.runResult.victory, true);
      assert.equal(app.runResult.floor, night);
      assert.equal(app.runResult.bosses, 1);
      assert.equal(run.stats.nodesVisited, run.map.rows);
      assert.deepEqual(app.runResult.regions, [{ act: night, regionId: region.id, name: region.name }]);
      assert.ok(roots.app.querySelector('.region-report').textContent.includes(region.name));
      assert.deepEqual(loadMeta().pendingResult.regions, app.runResult.regions);
      assert.deepEqual(app.meta.history[0].regions, app.runResult.regions);
      assert.equal(app.meta.stats.wins, 1);
    });
  }
  await step('Commission selection, three-act progress, payout and reload use actual controls', async () => {
    const app = fresh();
    app.meta.facilities.commission_house = 1;
    app.meta.commissions.reputation = 6;
    const entry = await acceptCommission(app, 'commission_hammer');
    app.goto('tavern');
    await button('出发远征').click();
    const startExpedition = app.startExpedition.bind(app);
    app.startExpedition = (id, opts) => startExpedition(id, { ...opts, seed: 4242 });
    await roots.app.querySelector('.expedition-enter').click();
    const expedition = app.run;
    assert.equal(expedition.commission.id, entry.id);
    assert.equal(commissionProgress(expedition)[0].value, 0);
    // Isolate route and settlement from balance with a durable, strong test player.
    strengthen(app.run);
    let transitions = 0;
    let observedProgress = false;
    while (app.run && transitions++ < 300) {
      if (app.screenName === 'map') {
        const progress = commissionProgress(app.run)[0];
        const hud = roots.app.querySelector('.commission-hud');
        assert.ok(hud && hud.getAttribute('title').includes(`${progress.value}/${progress.target}`));
        if (progress.value > 0) observedProgress = true;
      }
      await advanceExpedition(app);
    }
    assert.ok(transitions < 300);
    assert.equal(app.screenName, 'summary');
    assert.equal(app.runResult.victory, true);
    assert.equal(app.runResult.bosses, 3);
    assert.equal(app.meta.stats.wins, 1);
    assert.equal(app.meta.history.length, 1);
    assert.equal(app.runResult.floor, 3);
    assert.ok(observedProgress, 'Commission HUD never displayed combat progress');
    const commission = app.runResult.commission;
    assert.equal(commission.success, true);
    assert.ok(commission.goals[0].value >= entry.goals[0].target);
    assert.equal(commission.gold, Math.round((entry.gold + 10) * 1.1));
    assert.equal(commission.embers, entry.embers);
    assert.equal(app.meta.commissions.reputation, 6 + entry.reputation);
    assert.equal(app.meta.commissions.completed.length, 1);
    assert.equal(app.meta.gold, 90 + app.runResult.keptGold + commission.gold);
    assert.equal(app.meta.embers, app.runResult.embers + commission.embers);
    assert.ok(roots.app.querySelector('.commission-report').textContent.includes('委托已交付'));
    const savedGold = app.meta.gold;
    const savedEmbers = app.meta.embers;
    app.goto('title');
    const restored = new App(roots.app);
    restored.start();
    assert.equal(restored.screenName, 'summary');
    assert.deepEqual(restored.runResult.commission, commission);
    assert.equal(restored.meta.commissions.completed.length, 1);
    assert.equal(settleCommission(restored.meta, expedition, true, 10), null);
    assert.equal(restored.meta.gold, savedGold);
    assert.equal(restored.meta.embers, savedEmbers);
    assert.ok(roots.app.querySelector('.commission-report').textContent.includes('委托已交付'));
    await button('进入下一夜').click();
    assert.equal(restored.meta.night, 2);
    assert.equal(restored.meta.commissions.selectedId, null);
    assert.equal(restored.meta.commissions.completed.length, 1);
    assert.equal(restored.meta.commissions.lastResult.id, entry.id);
    assert.equal(loadMeta().commissions.completed.length, 1);
    previousApp = restored;
  });

  await step('confirmDialog resolves false on closeAllModals / Escape without hanging', async () => {
    let resolved = null;
    const promise = confirmDialog('测试弹窗', '测试内容').then((res) => { resolved = res; });
    assert.equal(resolved, null);
    closeAllModals();
    await withTimeout(promise, 'confirmDialog failed to resolve on closeAllModals');
    assert.equal(resolved, false);
  });

  await step('Tavern lost ending restart requires confirmDialog and protects meta progression', async () => {
    const app = fresh(3);
    app.meta.ending = 'lost';
    app.meta.gold = 500;
    app.meta.facilities.dorm = 2;
    app.save();
    app.goto('tavern');
    const restartBtn = button('重新点灯', roots.app);
    await restartBtn.click();
    const modalEl = roots['modal-root'].querySelector('.modal');
    assert.ok(modalEl, 'Confirmation modal not shown');
    const cancelBtn = button('取消', roots['modal-root']);
    await cancelBtn.click();
    assert.equal(app.screenName, 'tavern');
    assert.equal(app.meta.gold, 500);
    assert.equal(app.meta.facilities.dorm, 2);

    await restartBtn.click();
    closeAllModals();
    assert.equal(app.screenName, 'tavern');
    assert.equal(app.meta.gold, 500);

    await restartBtn.click();
    const confirmBtn = button('清空重置', roots['modal-root']);
    await confirmBtn.click();
    assert.equal(app.screenName, 'title');
    assert.equal(app.meta.gold, 90);
    assert.equal(app.meta.night, 1);
  });

  previousApp?.goto('title');
  console.error = originalError;
  console.log('\nUI regression: ' + passed + ' passed, ' + failures.length + ' failed');
  for (const failure of failures) console.log('  ' + failure);
  for (const error of errors) console.log('  Console error: ' + error.slice(0, 600));
  if (failures.length || errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error = originalError;
  console.error(error);
  process.exitCode = 1;
});
