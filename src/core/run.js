// ============ 远征（单局）状态 ============
import { RNG, makeSeed, seedToText } from './rng.js';
import { CARD_MAP, ALL_CHARACTERS, ENEMY_MAP, RELIC_MAP, POTION_MAP, STARTER_RELICS, character as charDef, relic as relicDef, card as cardDef } from '../data/index.js';
import { triggerCurse } from '../systems/effects.js';
import { generateMap } from '../systems/map.js';
import { USABLE_FACILITIES, USABLE_UPGRADES } from '../data/facilities.js';
import { expeditionEndAct } from '../data/regions.js';

export function newRun(meta, characterId, opts = {}) {
  const seed = opts.seed ?? makeSeed();
  const rng = new RNG(seed);
  const ch = charDef(characterId) || ALL_CHARACTERS[0];

  const run = {
    seed,
    seedText: seedToText(seed),
    rng,
    uidSeq: 1,
    deckSeq: 1,
    encounterCount: 0,
    week: 1,
    night: meta?.night ?? 1,

    characterId: ch.id,
    charName: ch.name,
    charTitle: ch.title,
    charGlyph: ch.glyph,
    charColor: ch.color,
    mechanic: ch.mechanic,
    rewardTags: ch.rewardTags || [],

    maxHp: ch.hp,
    hp: ch.hp,
    gold: ch.gold,

    deck: [],
    relics: [],
    potions: [],
    potionSlots: 3,

    act: opts.act ?? 1,
    endAct: opts.endAct ?? expeditionEndAct(opts.act ?? 1),
    map: null,
    pendingAct: null,
    keys: 0,
    blessings: [],
    siteStates: {},
    areaHistory: [],
    currentNode: null,
    pendingBattle: null,

    stats: {
      nodesVisited: 0, kills: 0, elites: 0, bosses: 0, cardsPlayed: 0,
      goldEarned: 0, damageDealt: 0, damageTaken: 0, turns: 0, potionsUsed: 0,
      cardsRemoved: 0, cardsAdded: 0, runs: 1,
      eventsVisited: 0, shopsVisited: 0, restsVisited: 0,
      sitesVisited: 0, regionsVisited: 0, keysFound: 0, keysSpent: 0, trialsCleared: 0, vaultsOpened: 0,
    },
    flags: {},
    carryStatuses: null,
    log: [],
    result: null,
  };

  run.pool = {
    cards: CARD_MAP,
    enemies: ENEMY_MAP,
    relics: RELIC_MAP,
    potions: POTION_MAP,
  };
  run.relicDefs = RELIC_MAP;
  run.charDef = ch;

  for (const id of ch.deck || []) run.deck.push({ id, uid: `d${run_deckSeq(run)}`, upgraded: false });

  if (ch.relic) run.relics.push(ch.relic);

  // 角色特性：跨战斗继承的起始状态
  if (ch.id === 'ch_ashborn') run.carryStatuses = { burn: 2 };

  // 运行时钩子（供效果解析器调用）
  run.grantRelic = (id) => (id === 'random' ? grantRandomRelic(run) : grantRelic(run, id));
  run.onEnemyKill = (e) => {
    run.stats.kills += 1;
    if (e?.def?.tier === 'elite') run.stats.eliteKills = (run.stats.eliteKills || 0) + 1;
  };

  run.map = generateMap(run, run.act, opts.regionId);
  run.encounterCount = 0;
  return run;
}

function run_deckSeq(run) { return run.deckSeq++; }

export function addCard(run, id, upgraded = false) {
  const inst = { id, uid: `d${run.deckSeq++}`, upgraded };
  run.deck.push(inst);
  run.stats.cardsAdded++;
  // 诅咒牌：进入牌组即刻结算自身代价（它们永远无法被打出）
  if (cardDef(id)?.playable === false) {
    triggerCurse({ battle: null, run, self: null, target: null, rng: run.rng }, id);
  }
  return inst;
}

export function removeCardAt(run, index) {
  if (!run.deck.length) return null;
  const [c] = run.deck.splice(index, 1);
  run.stats.cardsRemoved++;
  return c;
}

export function upgradeCardAt(run, index) {
  const c = run.deck[index];
  if (!c || c.upgraded || !cardDef(c.id)?.upgrade) return null;
  c.upgraded = true;
  return c;
}

export function cardDisplay(run, inst) {
  const def = cardDef(inst.id);
  if (!def) return null;
  const c = { ...def };
  if (inst.upgraded && def.upgrade) {
    Object.assign(c, def.upgrade);
    c.id = def.id;
    c.name = def.upgrade.name ?? def.name + '+';
  }
  c.instanceUid = inst.uid;
  c.upgraded = !!inst.upgraded;
  return c;
}

export function deckSummary(run) {
  const counts = new Map();
  for (const c of run.deck) {
    const k = `${c.id}|${c.upgraded ? 1 : 0}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([k, n]) => {
    const [id, up] = k.split('|');
    return { def: cardDisplay(run, { id, upgraded: up === '1' }), count: n };
  }).sort((a, b) => {
    const t = { attack: 0, skill: 1, power: 2, curse: 3 };
    return (t[a.def.type] - t[b.def.type]) || a.def.cost - b.def.cost || a.def.name.localeCompare(b.def.name);
  });
}

export function deckStats(run) {
  const s = { attack: 0, skill: 0, power: 0, curse: 0, total: run.deck.length };
  for (const c of run.deck) {
    const d = cardDef(c.id);
    if (d?.type) s[d.type] = (s[d.type] || 0) + 1;
  }
  return s;
}

// ---------- 奖励生成 ----------

const RARITY_WEIGHT = { common: 62, uncommon: 28, rare: 10 };
const RARITY_TIER_UP = { common: 0, uncommon: 1, rare: 2 };

export function rollCardReward(run, count = 3, opts = {}) {
  const { pool } = run;
  const unlocked = run.meta?.unlocks;
  const rareBonus = opts.rareBias || 0;
  const seen = new Set();
  const out = [];
  const tries = count * 30;
  for (let i = 0; i < tries && out.length < count; i++) {
    const roll = run.rng.next() * 100;
    let rarity = roll < 12 + rareBonus * 8 ? 'rare' : roll < 12 + rareBonus * 8 + 30 ? 'uncommon' : 'common';
    if (opts.upgradeChance && run.rng.chance(opts.upgradeChance)) { /* 升级由选择后处理 */ }
    const tier = (RARITY_TIER_UP[rarity] || 0) + (opts.rarityBoost || 0);
    const cands = Array.from(pool.cards.values()).filter((c) => {
      if (c.rarity !== rarity) return false;
      if (c.rarity === 'special' || c.rarity === 'curse') return false;
      if (c.unlock?.embers && unlocked && !unlocked.cards?.has(c.id)) return false;
      if (opts.tags && !opts.tags.some((t) => c.tags?.includes(t))) return false;
      return true;
    });
    if (!cands.length) continue;
    const c = run.rewardTags?.length
      ? run.rng.weighted(cands, (entry) => entry.tags?.some((tag) => run.rewardTags.includes(tag)) ? 3 : 1)
      : run.rng.pick(cands);
    const key = c.id;
    if (seen.has(key) && cands.length > 1) { if (run.rng.chance(0.6)) continue; }
    seen.add(key);
    out.push(c);
  }
  return out;
}

export function rollRelicReward(run, count = 3) {
  const unlocked = run.meta?.unlocks;
  const out = [];
  const seen = new Set();
  for (let i = 0; i < count * 40 && out.length < count; i++) {
    const roll = run.rng.next() * 100;
    const rarity = roll < 8 ? 'rare' : roll < 32 ? 'uncommon' : 'common';
    const cands = Array.from(run.relicDefs.values()).filter((r) => {
      if (r.rarity !== rarity) return false;
      if (STARTER_RELICS.has(r.id)) return false;
      if (run.relics.includes(r.id)) return false;
      if (r.unlock?.embers && unlocked && !unlocked.relics?.has(r.id)) return false;
      return true;
    });
    if (!cands.length) continue;
    const r = run.rng.pick(cands);
    if (seen.has(r.id) && cands.length > 1) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

export function rollPotionReward(run, count = 2) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const cands = Array.from(run.pool.potions.values()).filter((p) => p.rarity !== 'rare' || run.rng.chance(0.2));
    if (!cands.length) break;
    out.push(run.rng.pick(cands));
  }
  return out;
}

export function grantRelic(run, id) {
  if (!id || run.relics.includes(id)) return null;
  const def = relicDef(id);
  if (!def) { console.warn('[relic] 未知道具', id); return null; }
  run.relics.push(id);
  if (def.mod?.maxHpPlus) { run.maxHp += def.mod.maxHpPlus; run.hp += def.mod.maxHpPlus; }
  if (def.mod?.potionSlotsPlus) run.potionSlots += def.mod.potionSlotsPlus;
  if (def.mod?.handPlus) run.handBonus = (run.handBonus || 0) + def.mod.handPlus;
  return def;
}

export function grantRandomRelic(run, rarity = null) {
  const unlocked = run.meta?.unlocks;
  const cands = Array.from(run.relicDefs.values()).filter((r) => {
    if (r.rarity === 'starter' || STARTER_RELICS.has(r.id)) return false;
    if (run.relics.includes(r.id)) return false;
    if (rarity && r.rarity !== rarity) return false;
    if (r.unlock?.embers && unlocked && !unlocked.relics?.has(r.id)) return false;
    return true;
  });
  if (!cands.length) return null;
  return grantRelic(run, run.rng.pick(cands).id);
}

export function grantPotion(run, id) {
  if (!id) return false;
  if (run.potions.length >= run.potionSlots) return false;
  run.potions.push(id);
  return true;
}

export { USABLE_FACILITIES, USABLE_UPGRADES, makeSeed, RNG };
