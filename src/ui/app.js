// ============ 应用控制器 ============
import { el, clear, $ } from '../core/utils.js';
import { toast, closeAllModals } from './fx.js';
import { heartsEl } from './components.js';
import {
  loadMeta, saveMeta, newMeta, bonuses, nightName, settleNight, MAX_NIGHT, isFinalNight,
} from '../systems/meta.js';
import { newRun, grantRelic, grantRandomRelic, rollRelicReward, grantPotion, addCard, cardDisplay } from '../core/run.js';
import { enterNode, generateMap, isMapComplete, findNode, actProgress } from '../systems/map.js';
import { startBattle, pickEncounter, cardCost } from '../systems/battle.js';
import { relicHook, resolveOps } from '../systems/effects.js';
import { relic as relicDef, potion as potionDef, card as cardDef, ALL_CARDS } from '../data/index.js';

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
    this._saveTimer = null;
  }

  // ---------- 生命周期 ----------
  start() {
    this.bindKeys();
    const b = bonuses(this.meta);
    if (this.meta.flags.firstRun) this.goto('title');
    else this.goto('tavern');
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
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => saveMeta(this.meta), 200);
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

  openDeck() {
    if (!this.run) return;
    openDeckViewer(this);
  }

  // ---------- HUD ----------
  hud(opts = {}) {
    const { showDeck = true, right = null } = opts;
    const run = this.run;
    const b = this.bonuses;
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

    const hpPct = run.hp / run.maxHp;
    hud.append(
      el('div', { class: 'hud-brand' }, '焰契'),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' },
        el('span', { class: 'k' }, '生命'),
        el('span', { class: 'bar-mini' }, el('i', { style: { width: `${Math.max(0, hpPct * 100)}%` } })),
        el('span', { class: 'v hp-text' }, `${run.hp}/${run.maxHp}`),
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
        const d = pid ? potionDef(pid) : null;
        return el('button', {
          class: `potion-btn ${d ? '' : 'empty'}`,
          title: d ? `${d.name}\n${d.desc}` : '空槽位',
          onclick: () => d && this.usePotionOutOfBattle(d),
        }, d ? (d.glyph || '🧪') : '·');
      })),
      el('div', { class: 'hud-spacer' }),
      el('span', { class: 'act-chip' }, `第 ${run.night} 夜 · 幕 ${run.act}`),
    );

    if (right) hud.append(right);
    if (showDeck) {
      hud.append(el('button', { class: 'btn sm ghost', onclick: () => this.openDeck(), title: '查看牌组 (D)' }, '牌组'));
    }
    return hud;
  }

  usePotionOutOfBattle(def) {
    if (!this.run) return;
    if (this.run.potions.length < this.run.potionSlots) {
      toast('没有空槽位', 'bad');
      return;
    }
    const i = this.run.potions.indexOf(def.id);
    if (i < 0) return;
    // 战斗外使用：直接结算（target 类型的药水在战斗外只对自己生效）
    const fake = {
      log: [], fx: [], turn: 0, enemies: [], uidSeq: 1,
      player: { uid: 'p', name: this.run.charName, hp: this.run.hp, maxHp: this.run.maxHp, block: 0, status: {} },
      pending: [], draw: [], hand: [], discard: [],
    };
    const ctx = {
      battle: fake, run: this.run, self: fake.player, target: null, rng: this.run.rng,
      perspective: 'player', inRun: true, onGrantRelic: () => {},
    };
    this.run.potions.splice(i, 1);
    resolveOps(def.effects || [], ctx);
    this.run.hp = fake.player.hp;
    this.run.maxHp = fake.player.maxHp;
    toast(`使用 ${def.name}`, 'good');
    this.rerender();
  }

  rerender() {
    const p = this.params;
    this.goto(this.screenName, p);
  }

  // ---------- 游戏流程 ----------
  startExpedition(characterId) {
    const b = this.bonuses;
    const run = newRun(this.meta, characterId, { seed: undefined });
    run.meta = this.meta;
    run.night = this.meta.night;
    run.difficulty = this.meta.night;
    run.act = isFinalNight(this.meta.night) ? 3 : Math.min(3, this.meta.night);

    // 元进度加成
    run.gold += b.gold;
    run.maxHp += b.maxHp;
    run.hp = run.maxHp;
    run.potionSlots += b.potionSlots;
    run.bonusDamage = b.damagePlus;
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
      const c = run.rng.pick(Array.from(this.runPool()).filter((x) => ['uncommon', 'rare'].includes(x.rarity)));
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

    this.run = run;
    this.battle = null;
    this.save();
    this.goto('map');
  }

  runPool() {
    return ALL_CARDS;
  }

  abandonRun(reason = '你收起了行囊。') {
    if (!this.run) return;
    this.finishRun(false, { reason, floor: this.run.act });
  }

  // ---------- 节点 ----------
  enterMapNode(node) {
    const run = this.run;
    const nodeData = enterNode(run, node);
    if (!nodeData) return;
    const b = this.bonuses;
    // 遗物：进入节点
    const ctx = { battle: null, run, self: { uid: 'p', name: run.charName, hp: run.hp, maxHp: run.maxHp, block: 0, status: {} }, target: null, rng: run.rng, perspective: 'player' };
    relicHook(ctx, 'onNodeEnter', { ctx });

    switch (nodeData.type) {
      case 'battle': this.beginEncounter('normal'); break;
      case 'sentry': this.beginEncounter('sentry', true); break;
      case 'elite': this.beginEncounter('elite'); break;
      case 'boss': this.beginEncounter('boss'); break;
      case 'event': this.goto('event', { nodeId: nodeData.id }); break;
      case 'shop': this.goto('shop', { nodeId: nodeData.id }); break;
      case 'rest': this.goto('camp', { mode: 'rest', nodeId: nodeData.id }); break;
      case 'treasure': this.goto('camp', { mode: 'treasure', nodeId: nodeData.id }); break;
      default: this.goto('map');
    }
    this.save();
  }

  beginEncounter(tier, tutorial = false) {
    const run = this.run;
    run.encounterCount += 1;
    // 克隆敌人定义，避免污染静态数据
    let encounter = pickEncounter(run, run.act, tier).filter(Boolean);
    encounter = encounter.map((d) => {
      const copy = { ...d, moves: d.moves, onDeath: d.onDeath, onBattleStart: d.onBattleStart, onTurnStart: d.onTurnStart };
      if (run.enemyHpMul) {
        const base = Math.round(((d.hp[0] + d.hp[1]) / 2) * run.enemyHpMul);
        copy.hp = [base, base + Math.max(2, Math.round((d.hp[1] - d.hp[0]) * run.enemyHpMul))];
      }
      return copy;
    });
    if (!encounter.length) { toast('没有找到敌人', 'bad'); this.goto('map'); return; }
    this.battleTier = tier;
    this.battle = startBattle(run, encounter, { tier, tutorial });
    this.goto('battle');
  }

  onBattleEnd(won) {
    const run = this.run;
    if (!won) {
      this.battle = null;
      this.finishRun(false, { reason: '你倒在了地窟里。' });
      return;
    }
    // 胜利结算
    let gold = 0;
    for (const e of (this.battle?.enemies || [])) {
      if (e.def) gold += run.rng.int(e.def.gold[0], e.def.gold[1]);
    }
    if (this.battleTier === 'elite') gold += 25 + this.bonuses.eliteBonus * 15;
    if (this.battleTier === 'boss') gold += 90;
    gold = Math.round(gold * (1 + this.bonuses.eliteBonus * 0.05));
    run.gold += gold;
    run.stats.goldEarned += gold;
    if (this.battleTier === 'elite') run.stats.elites += 1;
    if (this.battleTier === 'boss') run.stats.bosses += 1;
    this.rewardGold = gold;
    this.battle = null;
    this.goto('reward', { tier: this.battleTier, nodeId: this.run.map.currentId });
  }

  /** 节点结算完毕：判断换幕 / 结束远征 */
  afterNode() {
    const run = this.run;
    if (!run) { this.goto('map'); return; }
    if (this.battleTier === 'boss') {
      if (run.act >= 3) {
        this.finishRun(true, {
          reason: isFinalNight(this.meta.night)
            ? '执政官沉回海底。锈锚酒馆的灯还亮着。'
            : '你带着满身的伤和一张越来越厚的牌组回到了酒馆。',
        });
        return;
      }
      run.act += 1;
      run.bossesBeaten = (run.bossesBeaten || 0) + 1;
      run.map = generateMap(run, run.act);
      run.carryStatuses = null;
      // 幕间休整
      const b = this.bonuses;
      if (b.restHeal) run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * 0.25));
      toast(`第 ${run.act} 幕 · 更深一层`, 'gold');
    }
    this.goto('map');
  }

  // ---------- 远征结束 ----------
  finishRun(victory, extra = {}) {
    const run = this.run;
    if (!run) return;
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
      const keep = this.bonuses.keepGold;
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
      deck: run.deck.length, character: run.charName, time: Date.now(),
    });
    if (this.meta.history.length > 60) this.meta.history.pop();
    if (!victory) this.meta.hearts = Math.max(0, this.meta.hearts - 1);

    this.runResult = result;
    this.run = null;
    this.save();
    this.goto('summary', { result, victory });
  }

  advanceNight() {
    if (this.meta.hearts <= 0) { this.goto('summary', { gameOver: true }); return; }
    const s = settleNight(this.meta, this.runResult);
    this.lastSettle = s;
    this.meta.night += 1;
    this.runResult = null;
    this.save();
    if (this.meta.hearts <= 0) { this.goto('summary', { gameOver: true }); return; }
    if (this.meta.night > MAX_NIGHT) { this.goto('tavern', { crowned: true }); return; }
    this.goto('tavern', { nightJustPassed: true });
  }

  openDeck() {
    if (this.run) openDeckViewer(this);
  }
}

export { nightName, MAX_NIGHT, isFinalNight };
