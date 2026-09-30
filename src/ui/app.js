// ============ 应用控制器 ============
import { el, clear } from '../core/utils.js';
import { toast, closeAllModals } from './fx.js';
import { heartsEl } from './components.js';
import {
  loadMeta, saveMeta, bonuses, nightName, settleNight, MAX_NIGHT, isFinalNight,
} from '../systems/meta.js';
import { newRun, grantRandomRelic, grantPotion, addCard } from '../core/run.js';
import { chapterForNight, expeditionEndAct, regionById, encounterById } from '../data/regions.js';
import { siteDef } from '../data/sites.js';
import { siteState, gainKeys, finishSiteBattle } from '../systems/sites.js';
import { enterNode, generateMap, findNode } from '../systems/map.js';
import { startBattle, pickEncounter, syncBattleRun, potionEffects, potionDisplay } from '../systems/battle.js';
import { relicHook } from '../systems/effects.js';
import { makeRunCtx, applyRunEffects } from '../systems/outcome.js';
import { beginCommission, commissionProgress, commissionById, settleCommission, expireCommission } from '../systems/commissions.js';
import { relic as relicDef, potion as potionDef, ALL_CARDS } from '../data/index.js';

import { renderTitle } from './screens/title.js';
import { renderTavern } from './screens/tavern.js';
import { renderSelect } from './screens/select.js';
import { renderMap } from './screens/map.js';
import { renderBattle } from './screens/battle.js';
import { renderEvent } from './screens/event.js';
import { renderShop } from './screens/shop.js';
import { renderCamp } from './screens/camp.js';
import { renderReward } from './screens/reward.js';
import { renderSummary } from './screens/summary.js';
import { renderRegion } from './screens/region.js';
import { renderSite } from './screens/site.js';
import { openDeckViewer } from './screens/deckview.js';

export class App {
  constructor(root) {
    this.root = root;
    this.meta = loadMeta();
    this.run = null;
    this.battle = null;
    this.screenName = null;
    this.params = {};
    this.disposers = [];
    this.runResult = this.meta.pendingResult;
    this.battleTier = null;
  }

  // ---------- 生命周期 ----------
  start() {
    this.bindKeys();
    if (this.meta.flags.firstRun && !this.meta.pendingResult && !this.meta.ending) this.goto('title');
    else this.resume();
  }

  resume() {
    if (this.meta.hearts <= 0 && !this.meta.ending) this.meta.ending = 'lost';
    if (this.meta.ending === 'lost') {
      this.goto('summary', { gameOver: true });
    } else if (this.meta.ending === 'won') {
      this.goto('tavern', { crowned: true });
    } else if (this.meta.pendingResult) {
      this.runResult = this.meta.pendingResult;
      this.goto('summary', { result: this.runResult, victory: this.runResult.victory });
    } else {
      this.goto('tavern');
    }
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') closeAllModals();
      if (e.key === 'd' || e.key === 'D') {
        if (this.run && this.screenName !== 'battle') this.openDeck();
      }
    });
  }

  save() {
    return saveMeta(this.meta);
  }

  get bonuses() { return bonuses(this.meta); }

  // ---------- 路由 ----------
  goto(name, params = {}) {
    for (const d of this.disposers) { try { d(); } catch (e) { console.error(e); } }
    this.disposers = [];
    closeAllModals();
    this.screenName = name;
    this.params = params;
    clear(this.root);

    const screen = el('div', { class: 'screen' });
    this.root.append(screen);
    this.screen = screen;

    const ctx = { app: this, root: screen, params, onDispose: (f) => this.disposers.push(f) };
    const renderers = {
      title: renderTitle,
      tavern: renderTavern,
      select: renderSelect,
      map: renderMap,
      battle: renderBattle,
      event: renderEvent,
      shop: renderShop,
      camp: renderCamp,
      reward: renderReward,
      summary: renderSummary,
      region: renderRegion,
      site: renderSite,
    };
    const fn = renderers[name];
    if (!fn) { screen.append(el('div', { class: 'wrap', text: `未知界面：${name}` })); return; }
    try {
      fn(ctx);
    } catch (e) {
      console.error('[screen]', name, e);
      screen.append(el('div', { class: 'wrap' },
        el('div', { class: 'panel' },
          el('h3', {}, '界面出错'),
          el('pre', { style: { whiteSpace: 'pre-wrap', color: '#ff8a8a', fontSize: '12px' }, text: String(e?.stack || e) }),
        ),
      ));
    }
  }

  // ---------- HUD ----------
  hud(opts = {}) {
    const { showDeck = true, right = null } = opts;
    const run = this.run;
    const hud = el('div', { class: 'hud' });

    if (!run) {
      hud.append(
        el('div', { class: 'hud-brand' }, '焰契'),
        el('div', { class: 'hud-sep' }),
        el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '第'), el('span', { class: 'v' }, `${this.meta.night} 夜`), el('span', { class: 'k' }, '/'), el('span', { class: 'v' }, String(MAX_NIGHT))),
        el('div', { class: 'hud-sep' }),
        el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '💰'), el('span', { class: 'v gold-text' }, String(this.meta.gold))),
        el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '✦'), el('span', { class: 'v', style: { color: '#b197fc' } }, String(this.meta.embers))),
        el('div', { class: 'hud-stat' }, heartsEl(this.meta)),
      );
      hud.append(el('div', { class: 'hud-spacer' }));
      if (right) hud.append(right);
      return hud;
    }

    const player = this.battle?.player || run;
    const hpPct = player.hp / player.maxHp;
    hud.append(
      el('div', { class: 'hud-brand' }, '焰契'),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' },
        el('span', { class: 'k' }, '生命'),
        el('span', { class: 'bar-mini' }, el('i', { style: { width: `${Math.max(0, hpPct * 100)}%` } })),
        el('span', { class: 'v hp-text' }, `${player.hp}/${player.maxHp}`),
      ),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '💰'), el('span', { class: 'v gold-text' }, String(run.gold))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '🃏'), el('span', { class: 'v' }, String(run.deck.length))),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'relic-strip' }, run.relics.map((id) => {
        const d = relicDef(id);
        return d ? el('div', { class: `relic-chip ${d.rarity}`, text: d.glyph || d.name[0], title: `${d.name}\n${d.desc}` }) : null;
      })),
      el('div', { class: 'potion-strip' }, Array.from({ length: run.potionSlots }, (_, i) => {
        const pid = run.potions[i];
        const d = pid ? potionDisplay(run, potionDef(pid)) : null;
        const outside = this.canUsePotionOutOfBattle(d);
        return el('button', {
          class: `potion-btn ${d ? '' : 'empty'}`,
          disabled: !outside || !!this.battle,
          title: d ? `${d.name}\n${d.desc}${this.battle ? '\n在战斗药水栏使用' : !outside ? '\n仅限战斗中使用' : ''}` : '空槽位',
          onclick: () => d && this.usePotionOutOfBattle(d),
        }, d ? (d.glyph || '🧪') : '·');
      })),
      el('div', { class: 'hud-spacer' }),
      el('span', { class: 'act-chip' }, `第 ${run.night} 夜 · 幕 ${run.act}`),
    );
    if (this.screenName === 'map' && run.commission) {
      const entry = commissionById(run.commission.id);
      const goals = commissionProgress(run);
      hud.append(el('span', { class: 'commission-hud', title: goals.map((goal) => `${goal.label} ${goal.value}/${goal.target}`).join('\n') },
        `${entry.name} · ${goals.map((goal) => `${Math.min(goal.value, goal.target)}/${goal.target}${goal.metric === 'hpPercent' ? '%' : ''}`).join(' · ')}`));
    }
    if (run.keys || run.blessings?.length) {
      hud.append(el('span', { class: 'route-supplies', title: (run.blessings || []).map((entry) => `${entry.name} · 剩余 ${entry.remaining} 场`).join('\n') },
        `钥匙 ${run.keys || 0}${run.blessings?.length ? ` · ${run.blessings.map((entry) => `${entry.name} ${entry.remaining}`).join(' · ')}` : ''}`));
    }

    if (right) hud.append(right);
    if (showDeck) {
      hud.append(el('button', { class: 'btn sm ghost', onclick: () => this.openDeck(), title: '查看牌组 (D)' }, '牌组'));
    }
    return hud;
  }

  canUsePotionOutOfBattle(def) {
    return !!def && def.target !== 'target' && def.effects?.length > 0
      && def.effects.every((op) => ['heal', 'maxHp', 'removeCard', 'upgradeCard', 'gold', 'addDeck'].includes(op.op));
  }

  usePotionOutOfBattle(def) {
    if (!this.run || this.battle) return;
    if (this.run.hp <= 0) {
      this.finishRun(false, { reason: '你倒在了地窟里。' });
      return;
    }
    if (!this.canUsePotionOutOfBattle(def)) return;
    const i = this.run.potions.indexOf(def.id);
    if (i < 0) return;
    this.run.potions.splice(i, 1);
    applyRunEffects(this.run, potionEffects(this.run, def));
    this.run.stats.potionsUsed += 1;
    if (this.run.hp <= 0) {
      this.finishRun(false, { reason: '你倒在了地窟里。' });
      return;
    }
    toast(`使用 ${def.name}`, 'good');
    this.rerender();
  }

  rerender() {
    const p = this.params;
    this.goto(this.screenName, p);
  }

  // ---------- 游戏流程 ----------
  startExpedition(characterId, opts = {}) {
    if (this.meta.ending || this.meta.pendingResult || this.meta.hearts <= 0 || this.meta.night > MAX_NIGHT) {
      this.resume();
      return;
    }
    const b = this.bonuses;
    const act = chapterForNight(this.meta.night);
    const run = newRun(this.meta, characterId, { act, endAct: expeditionEndAct(act), seed: opts.seed, regionId: opts.regionId });
    run.meta = this.meta;
    run.night = this.meta.night;
    run.difficulty = this.meta.night;

    // 元进度加成
    run.gold += b.gold;
    run.maxHp += b.maxHp;
    run.hp = run.maxHp;
    run.potionSlots += b.potionSlots;
    run.bonusDamage = b.damagePlus;
    run.bonusDraw = b.drawPlus;
    run.firstTurnDrawPlus = b.firstTurnDrawPlus;
    run.shopDiscount = b.shopDiscount;
    run.mapReveal = b.mapReveal;
    run.cardChoiceBonus = b.cardChoice;
    run.relicChoiceBonus = b.relicChoice;
    run.shopCardsBonus = b.shopCards;
    run.relicFind = b.relicFind;
    run.potionPower = b.potionPower;
    run.eliteBonus = b.eliteBonus;
    run.bossWard = b.bossWard;
    run.campfireRemove = b.campfireRemove;
    run.forgeUpgrade = b.forgeUpgrade;
    run.restHeal = b.restHeal;

    // 起始卡
    for (let i = 0; i < b.startCurses; i++) {
      const junk = run.rng.pick(['c_strike', 'c_guard', 'c_bash']);
      addCard(run, junk);
    }
    for (let i = 0; i < b.startCards; i++) {
      const c = run.rng.pick(this.runPool().filter((x) => ['uncommon', 'rare'].includes(x.rarity)));
      if (c) addCard(run, c.id);
    }
    for (let i = 0; i < b.startRelics; i++) grantRandomRelic(run);
    for (let i = 0; i < b.startPotions; i++) {
      const p = run.rng.pick(Array.from(run.pool.potions.values()));
      grantPotion(run, p.id);
    }

    if (this.meta.night >= 4) {
      // 高潮夜：敌人体质强化
      run.enemyHpMul = 1 + (this.meta.night - 3) * 0.3;
    }
    beginCommission(this.meta, run, 3 + b.commissionChoices);

    this.run = run;
    this.battle = null;
    this.battleTier = null;
    this.rewardGold = 0;
    this.runResult = null;
    this.save();
    this.goto('map');
  }

  runPool() {
    return ALL_CARDS.filter((c) => !c.unlock?.embers || this.meta.unlocks.cards.has(c.id));
  }

  abandonRun(reason = '你收起了行囊。') {
    if (!this.run) return;
    this.finishRun(false, { reason, floor: this.run.act });
  }

  // ---------- 节点 ----------
  enterMapNode(node) {
    const run = this.run;
    if (!run || this.screenName !== 'map') return;
    const nodeData = enterNode(run, node);
    if (!nodeData) return;
    if (nodeData.type === 'event') run.stats.eventsVisited += 1;
    if (nodeData.type === 'shop') run.stats.shopsVisited += 1;
    if (nodeData.type === 'rest') run.stats.restsVisited += 1;
    if (siteDef(nodeData.type)) run.stats.sitesVisited += 1;
    if (run.map.visited.length === 1) {
      run.stats.regionsVisited += 1;
      run.areaHistory.push({ act: run.act, regionId: run.map.regionId, name: regionById(run.map.regionId)?.name });
    }
    this.battleTier = null;
    const ctx = makeRunCtx(run);
    relicHook(ctx, 'onNodeEnter', { ctx });
    run.maxHp = ctx.self.maxHp;
    run.hp = Math.max(0, Math.min(run.maxHp, ctx.self.hp));
    if (run.hp <= 0) {
      this.finishRun(false, { reason: '你倒在了地窟里。' });
      return;
    }

    switch (nodeData.type) {
      case 'battle': this.beginEncounter('normal'); break;
      case 'sentry': this.beginEncounter('sentry', true); break;
      case 'elite': this.beginEncounter('elite'); break;
      case 'boss': this.beginEncounter('boss'); break;
      case 'event': this.goto('event', { nodeId: nodeData.id }); break;
      case 'shop': this.goto('shop', { nodeId: nodeData.id }); break;
      case 'rest': this.goto('camp', { mode: 'rest', nodeId: nodeData.id }); break;
      case 'treasure': this.goto('camp', { mode: 'treasure', nodeId: nodeData.id }); break;
      default:
        if (siteDef(nodeData.type)) this.goto('site', { nodeId: nodeData.id });
        else this.goto('map');
    }
    this.save();
  }

  beginEncounter(tier, tutorial = false, opts = {}) {
    const run = this.run;
    if (!run || this.battle) return;
    run.encounterCount += 1;
    // 克隆敌人定义，避免污染静态数据
    let encounter = pickEncounter(run, run.act, tier, opts).filter(Boolean);
    encounter = encounter.map((d) => {
      const copy = { ...d, moves: d.moves, onDeath: d.onDeath, onBattleStart: d.onBattleStart, onTurnStart: d.onTurnStart };
      const mul = (run.enemyHpMul || 1) * (tier === 'sentry' ? 0.65 : 1);
      if (mul !== 1) {
        copy.hp = [Math.max(1, Math.round(d.hp[0] * mul)), Math.max(1, Math.round(d.hp[1] * mul))];
      }
      return copy;
    });
    if (!encounter.length) { toast('没有找到敌人', 'bad'); this.goto('map'); return; }
    this.battleTier = tier;
    const node = findNode(run.map, run.map.currentId);
    const group = encounterById(run.map.regionId, opts.encounterId || node?.encounterId);
    this.battle = startBattle(run, encounter, { tier, tutorial, regionId: run.map.regionId,
      encounterName: group?.name, enemyStart: opts.enemyStart, siteWave: opts.siteWave });
    this.goto('battle');
  }

  beginSiteBattle() {
    const run = this.run;
    if (!run || this.battle || this.screenName !== 'site') return;
    const node = findNode(run.map, run.map.currentId);
    const state = siteState(run, node);
    if (!state?.battle || state.resolved || state.battle.phase !== 'fighting' || run.activeSite !== node.id) return;
    const trial = node.type === 'trial';
    this.beginEncounter(state.battle.tier, false, {
      encounterId: state.battle.encounters[state.battle.wave],
      enemyStart: trial ? [{ op: 'buff', s: 'strength', v: 1, t: 'self' }] : [],
      siteWave: trial ? `${state.battle.wave + 1}/2` : null,
    });
  }

  onBattleEnd(won) {
    const run = this.run;
    const battle = this.battle;
    if (!run || !battle || !['won', 'lost'].includes(battle.phase)) return;
    syncBattleRun(battle);
    won = battle.phase === 'won';
    if (!won) {
      this.battle = null;
      this.finishRun(false, { reason: '你倒在了地窟里。' });
      return;
    }
    // 胜利结算
    let gold = 0;
    for (const e of battle.enemies) {
      if (e.def) gold += run.rng.int(e.def.gold[0], e.def.gold[1]);
    }
    if (this.battleTier === 'elite') gold += 25 + this.bonuses.eliteBonus * 15;
    if (this.battleTier === 'boss') gold += 90;
    gold = Math.round(gold * (1 + this.bonuses.eliteBonus * 0.05));
    run.gold += gold;
    run.stats.goldEarned += gold;
    if (this.battleTier === 'elite') {
      run.stats.elites += 1;
      gainKeys(run);
      if (this.bonuses.restHeal) applyRunEffects(run, [{ op: 'heal', n: Math.round(run.maxHp * 0.25) }]);
    }
    if (this.battleTier === 'boss') run.stats.bosses += 1;
    this.rewardGold = gold;
    this.battle = null;
    if (run.activeSite) {
      const nodeId = run.activeSite;
      const result = finishSiteBattle(run, gold);
      if (result?.kind === 'continue') { this.goto('site', { nodeId }); return; }
      if (result?.kind === 'reward') {
        this.rewardGold = result.gold;
        this.goto('reward', { tier: result.tier, from: 'site', nodeId });
        return;
      }
    }
    this.goto('reward', { tier: this.battleTier, nodeId: this.run.map.currentId });
  }

  /** 节点结算完毕：判断换幕 / 结束远征 */
  afterNode() {
    const run = this.run;
    if (!run) { this.resume(); return; }
    const boss = findNode(run.map, run.map.currentId)?.type === 'boss';
    this.battleTier = null;
    this.rewardGold = 0;
    run._rewardState = null;
    if (boss) {
      if (run.act >= run.endAct) {
        this.finishRun(true, {
          reason: isFinalNight(this.meta.night)
            ? '最后的封印熄灭了。锈锚酒馆的灯还亮着。'
            : '你带着满身的伤和一张越来越厚的牌组回到了酒馆。',
        });
        return;
      }
      run.pendingAct = run.act + 1;
      this.goto('region');
      return;
    }
    this.goto('map');
  }

  continueToAct(regionId) {
    const run = this.run;
    const region = regionById(regionId);
    if (!run || this.screenName !== 'region' || !run.pendingAct || region?.act !== run.pendingAct || region.act > run.endAct) return false;
    run.act = run.pendingAct;
    run.pendingAct = null;
    run.map = generateMap(run, run.act, regionId);
    run.carryStatuses = null;
    if (this.bonuses.restHeal) run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * 0.25));
    this.save();
    this.goto('map');
    return true;
  }

  // ---------- 远征结束 ----------
  finishRun(victory, extra = {}) {
    const run = this.run;
    if (!run) return;
    if (this.battle) syncBattleRun(this.battle);
    this.battle = null;
    const stats = run.stats;
    const result = {
      victory,
      floor: run.act,
      kills: stats.kills,
      bosses: stats.bosses,
      elites: stats.elites,
      goldEarned: stats.goldEarned,
      cardsPlayed: stats.cardsPlayed,
      damageDealt: stats.damageDealt,
      damageTaken: stats.damageTaken,
      turns: stats.turns,
      potionsUsed: stats.potionsUsed,
      regions: [...run.areaHistory],
      sitesVisited: stats.sitesVisited,
      trialsCleared: stats.trialsCleared,
      vaultsOpened: stats.vaultsOpened,
      hpLeft: Math.max(0, run.hp),
      maxHp: run.maxHp,
      deckSize: run.deck.length,
      character: run.charName,
      reason: extra.reason || (victory ? '灰烬潮退去。' : '你没能回来。'),
      embers: 0,
    };
    // 印记 = 幕数*6 + 精英*8 + 首领*14 + 存活层数
    result.embers = Math.max(1, Math.round(run.act * 6 + stats.elites * 8 + stats.bosses * 14 + (victory ? 40 : 0) + Math.floor(run.hp / Math.max(1, run.maxHp) * 10)));

    if (!victory) {
      const keep = Math.max(0, Math.min(1, this.bonuses.keepGold));
      const lost = Math.round(run.gold * (1 - keep));
      run.gold = Math.round(run.gold * keep);
      this.meta.gold += run.gold;
      result.keptGold = run.gold;
      result.lostGold = lost;
    } else {
      this.meta.gold += run.gold;
      result.keptGold = run.gold;
    }
    result.healPct = this.bonuses.runEndHealPct;
    result.commission = settleCommission(this.meta, run, victory, this.bonuses.commissionGoldPlus);

    // 统计与印记（统一在这里结算，advanceNight 只负责潮汐与推进）
    this.meta.stats.runs += 1;
    if (victory) this.meta.stats.wins += 1; else this.meta.stats.deaths += 1;
    this.meta.stats.bestNight = Math.max(this.meta.stats.bestNight, this.meta.night);
    this.meta.stats.totalKills += stats.kills;
    this.meta.stats.totalGold += stats.goldEarned;
    this.meta.stats.cardsPlayed += stats.cardsPlayed;
    this.meta.stats.bossKills += stats.bosses;
    this.meta.embers += result.embers;
    this.meta.history.unshift({
      night: this.meta.night, victory: !!victory, floor: run.act,
      gold: stats.goldEarned, kills: stats.kills, hp: Math.max(0, run.hp),
      damageDealt: stats.damageDealt, damageTaken: stats.damageTaken,
      turns: stats.turns, potionsUsed: stats.potionsUsed,
      commission: result.commission,
      regions: result.regions, sitesVisited: result.sitesVisited, trialsCleared: result.trialsCleared, vaultsOpened: result.vaultsOpened,
      deck: run.deck.length, character: run.charName, time: Date.now(),
    });
    if (this.meta.history.length > 60) this.meta.history.pop();
    if (!victory) this.meta.hearts = Math.max(0, this.meta.hearts - 1);

    this.runResult = result;
    this.meta.pendingResult = result;
    if (this.meta.hearts <= 0) this.meta.ending = 'lost';
    this.run = null;
    this.save();
    this.goto('summary', { result, victory });
  }

  advanceNight(expectedResult) {
    if (this.run) return;
    if (this.meta.ending) { this.resume(); return; }
    const result = this.meta.pendingResult || this.runResult;
    if (expectedResult && expectedResult !== result) return;
    if (!result) expireCommission(this.meta);
    if (this.meta.hearts <= 0 || isFinalNight(this.meta.night)) {
      this.meta.ending = this.meta.hearts > 0 && result?.victory ? 'won' : 'lost';
      this.meta.pendingResult = null;
      this.runResult = null;
      this.save();
      this.resume();
      return;
    }
    const s = settleNight(this.meta, result);
    this.lastSettle = s;
    this.meta.night += 1;
    this.meta.pendingResult = null;
    this.runResult = null;
    if (this.meta.hearts <= 0) this.meta.ending = 'lost';
    this.save();
    if (this.meta.ending) { this.resume(); return; }
    this.goto('tavern', { nightJustPassed: true });
  }

  openDeck() {
    if (this.run) openDeckViewer(this);
  }
}

export { nightName, MAX_NIGHT, isFinalNight };
