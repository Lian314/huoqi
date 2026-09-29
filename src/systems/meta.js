// ============ 元进度（跨局持久化）============
import { FACILITIES, STAFF, UPGRADES, NIGHT_NAMES, TIDE_FLAVOR } from '../data/facilities.js';

const KEY = 'emberpact.save.v1';
const SEEN_KEY = 'emberpact.seen.v1';

export const FACILITY_MAP = Object.fromEntries(FACILITIES.map((f) => [f.id, f]));
export const STAFF_MAP = Object.fromEntries(STAFF.map((s) => [s.id, s]));
export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export const MAX_NIGHT = 6;   // 第 6 夜 = 终局决战

export function newMeta() {
  const facilities = {};
  for (const f of FACILITIES) facilities[f.id] = 0;
  for (const f of FACILITIES) if (f.start) facilities[f.id] = 1;
  return {
    version: 1,
    gold: 90,
    embers: 0,
    hearts: 3,
    maxHearts: 3,
    night: 1,
    facilities,
    staff: [],
    upgrades: {},
    unlocks: { cards: new Set(), relics: new Set(), characters: new Set() },
    history: [],
    stats: { runs: 0, wins: 0, deaths: 0, bestNight: 0, totalKills: 0, totalGold: 0, cardsPlayed: 0, bossKills: 0 },
    flags: { tutorialDone: false, firstRun: true },
    lastCharacter: null,
  };
}

function reviveSets(meta) {
  meta.unlocks.cards = new Set(meta.unlocks.cards || []);
  meta.unlocks.relics = new Set(meta.unlocks.relics || []);
  meta.unlocks.characters = new Set(meta.unlocks.characters || []);
  return meta;
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newMeta();
    const m = JSON.parse(raw);
    if (!m || m.version !== 1) return newMeta();
    // 兼容
    const base = newMeta();
    const merged = { ...base, ...m, facilities: { ...base.facilities, ...(m.facilities || {}) }, upgrades: { ...(m.upgrades || {}) }, stats: { ...base.stats, ...(m.stats || {}) }, flags: { ...base.flags, ...(m.flags || {}) } };
    return reviveSets(merged);
  } catch (e) {
    console.warn('[meta] 存档损坏，重建', e);
    return newMeta();
  }
}

export function saveMeta(meta) {
  try {
    const copy = { ...meta, unlocks: { cards: [...meta.unlocks.cards], relics: [...meta.unlocks.relics], characters: [...meta.unlocks.characters] } };
    localStorage.setItem(KEY, JSON.stringify(copy));
    return true;
  } catch (e) { console.warn('[meta] 保存失败', e); return false; }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function wipeMeta() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function markSeen(flag) {
  try {
    const s = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    s[flag] = true;
    localStorage.setItem(SEEN_KEY, JSON.stringify(s));
  } catch {}
}
export function hasSeen(flag) {
  try { return !!JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')[flag]; } catch { return false; }
}

export function nightName(n) { return NIGHT_NAMES[Math.min(n - 1, NIGHT_NAMES.length - 1)] || `第 ${n} 夜`; }
export function nightFlavor(n) { return TIDE_FLAVOR[Math.min(n - 1, TIDE_FLAVOR.length - 1)] || ''; }

export function isFinalNight(n) { return n >= MAX_NIGHT; }

// ---------- 聚合成加成表 ----------

export function bonuses(meta) {
  const b = {
    gold: 0, maxHp: 0, potionSlots: 0, startCards: 0, startRelics: 0, startPotions: 0,
    startCurses: 0,
    incomeFlat: 0, incomePct: 0, damagePlus: 0, drawPlus: 0, firstTurnDrawPlus: 0,
    shopDiscount: 0, mapReveal: 0, cardChoice: 0, relicChoice: 0, shopCards: 0,
    relicFind: 0, eliteBonus: 0, potionPower: 0, runEndHealPct: 0, keepGold: 0,
    tideWard: 0, campfireRemove: false, forgeUpgrade: 0, restHeal: false,
    dealChance: 0, bossWard: false, insurance: 0,
  };
  // 设施
  for (const f of FACILITIES) {
    const lv = meta.facilities[f.id] || 0;
    if (lv <= 0) continue;
    if (f.effects) {
      if (f.effects.incomeFlat) b.incomeFlat += f.income[lv] || 0;
      if (f.effects.incomePct) b.incomePct += f.effects.incomePct;
      if (f.effects.potionSlots) b.potionSlots += f.effects.potionSlots;
      if (f.effects.mapReveal) b.mapReveal += f.effects.mapReveal;
      if (f.effects.shopDiscount) b.shopDiscount += f.effects.shopDiscount;
      if (f.effects.shopCards) b.shopCards += f.effects.shopCards;
      if (f.effects.relicChoice) b.relicChoice += f.effects.relicChoice;
      if (f.effects.cardChoice) b.cardChoice += f.effects.cardChoice;
      if (f.effects.keepGold) b.keepGold = Math.max(b.keepGold, f.effects.keepGold);
      if (f.effects.tideWard) b.tideWard += f.effects.tideWard;
      if (f.effects.campfireRemove) b.campfireRemove = true;
      if (f.effects.forgeUpgrade) b.forgeUpgrade = Math.max(b.forgeUpgrade, f.effects.forgeUpgrade);
      if (f.effects.restHeal) b.restHeal = true;
      if (f.effects.dealChance) b.dealChance += f.effects.dealChance;
    }
  }
  // 员工
  for (const sid of meta.staff) {
    const s = STAFF_MAP[sid];
    if (!s?.mods) continue;
    const m = s.mods;
    if (m.incomeFlat) b.incomeFlat += m.incomeFlat;
    if (m.incomePct) b.incomePct += m.incomePct;
    if (m.damagePlus) b.damagePlus += m.damagePlus;
    if (m.firstTurnDrawPlus) b.firstTurnDrawPlus += m.firstTurnDrawPlus;
    if (m.mapReveal) b.mapReveal += m.mapReveal;
    if (m.eliteBonus) b.eliteBonus += m.eliteBonus;
    if (m.potionPower) b.potionPower += m.potionPower;
    if (m.shopDiscount) b.shopDiscount += m.shopDiscount;
    if (m.startCards) b.startCards += m.startCards;
    if (m.relicFind) b.relicFind += m.relicFind;
    if (m.runEndHealPct) b.runEndHealPct += m.runEndHealPct;
  }
  // 升级
  for (const [uid, lv] of Object.entries(meta.upgrades || {})) {
    const u = UPGRADE_MAP[uid];
    if (!u) continue;
    if (uid === 'u_gold') b.gold += u.v * lv;
    if (uid === 'u_hp') b.maxHp += u.v * lv;
    if (uid === 'u_start_card') b.startCards += u.v * lv;
    if (uid === 'u_start_relic') b.startRelics += u.v * lv;
    if (uid === 'u_potion') b.startPotions += u.v * lv;
    if (uid === 'u_deck_dilution') b.startCurses += u.v * lv;
    if (uid === 'u_card_removal') b.campfireRemove = true;
    if (uid === 'u_boss_ward') b.bossWard = true;
    if (uid === 'u_insurance') b.keepGold += 0.3;
  }
  return b;
}

// ---------- 夜晚结算 ----------

export function settleNight(meta, result) {
  const inc = nightlyIncome(meta);
  meta.gold += inc.net;
  const tide = tideDamage(meta);
  meta.hearts = Math.max(0, meta.hearts - tide);
  return { income: inc, tide };
}

export function nightlyIncome(meta) {
  let base = 0;
  for (const f of FACILITIES) {
    const lv = meta.facilities[f.id] || 0;
    if (lv > 0) base += f.income[lv] || 0;
  }
  const staffFlat = (meta.staff || []).reduce((a, sid) => a + (STAFF_MAP[sid]?.wage || 0), 0);
  const b = bonuses(meta);
  const pct = 1 + b.incomePct;
  const total = Math.round((base + b.incomeFlat) * pct);
  return { base, staffFlat, total, wages: staffFlat, net: total - staffFlat };
}

/** 每夜潮汐伤害（夜 1 起逐夜加压，最终夜 3 点） */
const TIDE_TABLE = [0, 0, 1, 1, 2, 2, 3];

export function tideDamage(meta) {
  const b = bonuses(meta);
  const raw = TIDE_TABLE[Math.min(meta.night, TIDE_TABLE.length - 1)] ?? 0;
  return Math.max(0, raw - b.tideWard);
}

// ---------- 购买 ----------

export function facilityCost(meta, id) {
  const f = FACILITY_MAP[id];
  if (!f) return Infinity;
  const lv = meta.facilities[id] || 0;
  if (lv >= f.max) return Infinity;
  return f.cost[lv] ?? Infinity;
}

export function upgradeFacility(meta, id) {
  const cost = facilityCost(meta, id);
  if (!Number.isFinite(cost) || meta.gold < cost) return false;
  meta.gold -= cost;
  meta.facilities[id] = (meta.facilities[id] || 0) + 1;
  return true;
}

export function hireStaff(meta, id) {
  const s = STAFF_MAP[id];
  if (!s || meta.staff.includes(id) || meta.gold < s.cost) return false;
  meta.gold -= s.cost;
  meta.staff.push(id);
  return true;
}

export function dismissStaff(meta, id) {
  const i = meta.staff.indexOf(id);
  if (i < 0) return false;
  const s = STAFF_MAP[id];
  meta.staff.splice(i, 1);
  if (s) meta.gold += Math.floor(s.cost * 0.4);
  return true;
}

export function upgradeCost(meta, id) {
  const u = UPGRADE_MAP[id];
  if (!u) return Infinity;
  const lv = meta.upgrades[id] || 0;
  if (lv >= (u.max || 1)) return Infinity;
  return Math.round(u.cost * (1 + lv * 0.6));
}

export function buyUpgrade(meta, id) {
  const cost = upgradeCost(meta, id);
  if (!Number.isFinite(cost) || meta.gold < cost) return false;
  meta.gold -= cost;
  meta.upgrades[id] = (meta.upgrades[id] || 0) + 1;
  return true;
}

export function isUnlocked(meta, kind, id) {
  return meta.unlocks[kind]?.has?.(id) || false;
}

export function unlockItem(meta, kind, id, cost) {
  if (isUnlocked(meta, kind, id) || meta.embers < cost) return false;
  meta.embers -= cost;
  meta.unlocks[kind].add(id);
  return true;
}

export function facilityDesc(f, lv) {
  const income = f.income[lv] || 0;
  const pct = Math.round((f.effects?.shopDiscount || 0) * 100);
  const keep = Math.round((f.effects?.keepGold || 0) * 100);
  return f.desc
    .replace('{income}', income)
    .replace('{lv}', lv)
    .replace('{pct}', pct)
    .replace('{keep}', keep);
}
