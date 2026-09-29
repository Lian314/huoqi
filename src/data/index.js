// 数据注册表：加载全部静态数据并提供查询
import { CARDS } from './cards.js';
import { CHARACTERS } from './characters.js';
import { ENEMIES } from './enemies.js';
import { RELICS } from './relics.js';
import { POTIONS } from './potions.js';
import { EVENTS } from './events.js';
import { STATUS, STATUS_IDS } from './statuses.js';

export { STATUS, STATUS_IDS };

const idx = (arr) => {
  const m = new Map();
  const dup = [];
  for (const it of arr) {
    if (!it || !it.id) { console.warn('[data] 缺少 id 的条目', it); continue; }
    if (m.has(it.id)) dup.push(it.id);
    m.set(it.id, it);
  }
  if (dup.length) console.warn('[data] 重复 id:', dup.join(', '));
  return m;
};

export const CARD_MAP = idx(CARDS);
export const CHAR_MAP = idx(CHARACTERS);
export const ENEMY_MAP = idx(ENEMIES);
export const RELIC_MAP = idx(RELICS);
export const POTION_MAP = idx(POTIONS);
export const EVENT_MAP = idx(EVENTS);

export const card = (id) => CARD_MAP.get(id) || null;
export const character = (id) => CHAR_MAP.get(id) || null;
export const enemy = (id) => ENEMY_MAP.get(id) || null;
export const relic = (id) => RELIC_MAP.get(id) || null;
export const potion = (id) => POTION_MAP.get(id) || null;
export const eventDef = (id) => EVENT_MAP.get(id) || null;

export const ALL_CARDS = CARDS;
export const ALL_CHARACTERS = CHARACTERS;
export const ALL_ENEMIES = ENEMIES;
export const ALL_RELICS = RELICS;
export const ALL_POTIONS = POTIONS;
export const ALL_EVENTS = EVENTS;

/** 角色已解锁：unlock.embers === 0 */
export const STARTER_CHARACTERS = CHARACTERS.filter((c) => !c.unlock || !c.unlock.embers);

/** 战斗奖励池：排除 special / curse / 未解锁 */
export function rewardPool(unlocked = null) {
  return CARDS.filter((c) => {
    if (c.rarity === 'special' || c.rarity === 'curse') return false;
    if (c.unlock?.embers && unlocked && !unlocked.has(c.id)) return false;
    return true;
  });
}

/** 角色专属初始遗物：无论 rarity 标注如何，都不进入随机遗物池 */
export const STARTER_RELICS = new Set([
  'relic_ember_heart', 'relic_copper_key', 'relic_salt_ledger', 'relic_tide_locket', 'relic_ash_charm',
]);

/** 遗物池：排除 starter 遗物 */
export function relicPool(unlocked = null) {
  return RELICS.filter((r) => {
    if (r.rarity === 'starter' || STARTER_RELICS.has(r.id)) return false;
    if (r.unlock?.embers && unlocked && !unlocked.has(r.id)) return false;
    return true;
  });
}

export function enemiesOf(act, tier) {
  return ENEMIES.filter((e) => e.act === act && e.tier === tier);
}

export function eventsOf(act) {
  return EVENTS.filter((e) => !e.act || e.act === act || e.act === 0);
}

export const RARITY_LABEL = {
  common: '普通', uncommon: '罕见', rare: '稀有', special: '特殊', curse: '诅咒', boss: '首领', starter: '初始', shop: '商店',
};

export const RARITY_COLOR = {
  common: '#9aa4b2', uncommon: '#4ea8de', rare: '#e5a50a', special: '#c77dff', curse: '#8b5a9e', boss: '#ff4757', starter: '#7b8794', shop: '#2ed573',
};
