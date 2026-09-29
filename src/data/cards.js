// 卡池聚合入口 —— 引擎只从这里取卡
// 四个主题组 + 进阶补充组。
// id 冲突时：优先保留 effects 非空的定义（空效果 = 空壳卡，无任何实装价值），
// 仍然相同则保留先出现的一组，并记录冲突供排查。
import { CARDS_CORE } from './cards.core.js';
import { CARDS_FIRE } from './cards.fire.js';
import { CARDS_FROST } from './cards.frost.js';
import { CARDS_ARCANE } from './cards.arcane.js';
import { CARDS_B } from './cards.ext.js';

const GROUPS = [
  ['core', CARDS_CORE],
  ['fire', CARDS_FIRE],
  ['frost', CARDS_FROST],
  ['arcane', CARDS_ARCANE],
  ['ext', CARDS_B],
];

const hasEffects = (c) => Array.isArray(c.effects) && c.effects.length > 0;

export const CARDS = [];
export const CARD_CONFLICTS = [];
const seen = new Map();
const seenAt = new Map();
export const CARD_SOURCES = {};

for (const [name, list] of GROUPS) {
  let added = 0;
  let dropped = 0;
  for (const c of list || []) {
    if (!c || !c.id) { console.warn('[cards] 缺少 id 的条目'); continue; }
    const prev = seen.get(c.id);
    if (prev) {
      const keepNew = hasEffects(c) && !hasEffects(prev);
      if (keepNew) {
        // 用有实装效果的新定义替换旧定义
        const at = CARDS.indexOf(prev);
        if (at >= 0) CARDS[at] = c;
        seen.set(c.id, c);
        CARD_CONFLICTS.push({ id: c.id, kept: name, dropped: seenAt.get(c.id), why: '新定义有 effects' });
        dropped++;
      } else {
        CARD_CONFLICTS.push({ id: c.id, kept: seenAt.get(c.id), dropped: name, why: '保留先出现的定义' });
        dropped++;
      }
      continue;
    }
    seen.set(c.id, c);
    seenAt.set(c.id, name);
    CARDS.push(c);
    added++;
  }
  CARD_SOURCES[name] = { total: (list || []).length, added, dropped };
}

if (typeof console !== 'undefined' && typeof process !== 'undefined' && process.env?.EMBERPACT_VERBOSE) {
  console.log('[cards] 分组统计', CARD_SOURCES, '总计', CARDS.length);
  if (CARD_CONFLICTS.length) console.log('[cards] id 冲突', CARD_CONFLICTS);
}
