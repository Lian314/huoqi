// 通用 UI 组件：卡牌、状态、意图、战斗单位、HUD
import { el } from '../core/utils.js';
import { STATUS, RARITY_LABEL } from '../data/index.js';
import { describe, decorate } from '../systems/describe.js';
import { cardDisplay } from '../core/run.js';
import { popAt, flashNode } from './fx.js';

const TYPE_LABEL = { attack: '攻击', skill: '技能', power: '力量', curse: '诅咒' };

/* ---------------- 卡牌 ---------------- */
export function cardEl(def, opts = {}) {
  const { size = '', count = null, disabled = false, onClick = null, onHover = null, hint = false, upgradeable = false } = opts;
  if (!def) return el('div');

  const text = def.text || describe(def.effects);
  const node = el('div', {
    class: `card ${def.type} ${size} ${def.upgraded ? 'upgraded' : ''} ${disabled ? 'disabled' : ''} ${hint ? 'playable-hint' : ''}`,
    title: opts.title || text,
    onclick: onClick ? (e) => { e.stopPropagation(); onClick(node, e); } : null,
    onpointerenter: onHover ? () => onHover(node) : null,
  });

  node.append(el('div', { class: 'card-cost' + (def.cost < 0 ? ' x' : ''), text: def.cost < 0 ? 'X' : String(def.cost ?? 0) }));
  node.append(el('div', { class: `card-rarity ${def.rarity || 'common'}` }));
  node.append(el('div', { class: 'card-art' }, def.art || def.name?.[0] || '?'));
  node.append(el('div', { class: 'card-name', text: def.name }));
  node.append(el('div', { class: 'card-type', text: TYPE_LABEL[def.type] || def.type }));
  node.append(el('div', { class: 'card-text', html: decorate(text) }));
  if (def.tags?.length) {
    node.append(el('div', { class: 'card-tags' }, def.tags.slice(0, 3).map((t) => el('span', { class: 'card-tag', text: t }))));
  }
  if (def.exhaust) node.append(el('div', { class: 'card-badge', text: '消耗' }));
  else if (def.ethereal) node.append(el('div', { class: 'card-badge', text: '虚无' }));
  else if (def.innate) node.append(el('div', { class: 'card-badge', text: '起手' }));
  if (def.unlock?.embers && !opts.hideUnlock) node.append(el('div', { class: 'card-badge', style: { bottom: '22px', right: '7px' }, text: `印记${def.unlock.embers}` }));
  if (count != null) node.append(el('div', { class: 'count-badge', text: `×${count}` }));
  if (upgradeable) node.append(el('div', { class: 'card-badge', style: { bottom: '22px', left: '7px', right: 'auto' }, text: '可升级' }));
  return node;
}

export function instCardEl(run, inst, opts = {}) {
  return cardEl(cardDisplay(run, inst), opts);
}

export function cardTooltipHtml(def) {
  return `<b>${def.name}</b> · ${TYPE_LABEL[def.type]} · ${RARITY_LABEL[def.rarity] || def.rarity}<br>
    <span style="color:#9aa4b2">${def.text || describe(def.effects)}</span>`;
}

/* ---------------- 状态 ---------------- */
export function statusPips(who) {
  const wrap = el('div', { class: 'statuses' });
  const ids = Object.keys(who.status || {}).filter((k) => STATUS[k] && who.status[k] !== 0);
  for (const id of ids) {
    const s = STATUS[id];
    const n = who.status[id];
    wrap.append(el('div', {
      class: 'status-pip', style: { borderColor: s.color, color: s.color },
      title: `${s.name}（${n} 层）：${s.desc}`,
    },
      el('span', { class: 'g', text: s.glyph }),
      el('span', { class: 'n', text: String(n) }),
    ));
  }
  return wrap;
}

/* ---------------- 敌人意图 ---------------- */
const INTENT_ICON = {
  attack: '⚔', attackDefend: '⚔', defend: '🛡', buff: '▲', attackBuff: '⚔',
  debuff: '☠', attackDebuff: '⚔', unknown: '?', sleep: '💤', stun: '✷',
};
const INTENT_TEXT = {
  attack: '攻击', attackDefend: '攻击/防御', defend: '防御', buff: '强化', attackBuff: '攻击/强化',
  debuff: '削弱', attackDebuff: '攻击/削弱', unknown: '不明', sleep: '未醒', stun: '失能',
};

export function intentEl(enemy) {
  const it = enemy.intent;
  if (!it) return null;
  const showDmg = it.kind?.startsWith('attack') && it.dmg > 0;
  return el('div', {
    class: `intent ${it.kind || 'unknown'} ${it.hidden ? 'hidden' : ''}`,
    title: it.hidden ? '意图被遮蔽' : `${INTENT_TEXT[it.kind] || '行动'}：${it.name || ''}${it.tell ? ' — ' + it.tell : ''}`,
  },
    el('span', { text: INTENT_ICON[it.kind] || '?' }),
    showDmg ? el('span', { class: 'dmg', text: String(it.dmg) }) : null,
  );
}

/* ---------------- 战斗单位 ---------------- */
export function combatantEl(c, opts = {}) {
  const { onClick = null, targetable = false, onHover = null } = opts;
  const sizeCls = c.size === 'large' ? 'big' : c.size === 'tall' ? 'tall' : '';
  const node = el('div', {
    class: `combatant ${sizeCls} ${c.hp <= 0 ? 'dead' : ''} ${targetable ? 'targetable' : ''}`,
    dataset: { uid: c.uid },
    onclick: onClick ? () => onClick(c, node) : null,
    onpointerenter: onHover ? () => onHover(c, node) : null,
  });
  node._uid = c.uid;

  const it = intentEl(c);
  if (it) node.append(it);

  node.append(el('div', { class: 'cbt-head' },
    el('div', { class: 'cbt-glyph', style: { borderColor: c.color || 'var(--line-2)' }, text: c.glyph || '?' }),
    el('div', {},
      el('div', { class: 'cbt-name', text: c.name }),
      el('div', { class: 'cbt-hpnum mono', text: `${c.hp} / ${c.maxHp}` }),
    ),
  ));

  const hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
  const barNode = el('div', { class: 'hpbar' },
    el('i', { class: `hp ${hpPct < .34 ? 'low' : ''}`, style: { width: `${Math.max(0, hpPct * 100)}%` } }),
  );
  if (c.block > 0) barNode.append(el('div', { class: 'blockchip', text: `⛨ ${c.block}` }));
  node.append(barNode);
  node.append(statusPips(c));
  return node;
}

export function updateCombatant(node, c) {
  if (!node) return;
  const hpBar = node.querySelector('.hp');
  if (hpBar) {
    const pct = c.maxHp > 0 ? Math.max(0, c.hp / c.maxHp) : 0;
    hpBar.style.width = `${pct * 100}%`;
    hpBar.classList.toggle('low', pct < .34);
  }
  const num = node.querySelector('.cbt-hpnum');
  if (num) num.textContent = `${c.hp} / ${c.maxHp}`;
  let block = node.querySelector('.blockchip');
  if (c.block > 0) {
    if (!block) {
      block = el('div', { class: 'blockchip' });
      node.querySelector('.hpbar')?.append(block);
    }
    block.textContent = `⛨ ${c.block}`;
  } else block?.remove();

  const old = node.querySelector('.statuses');
  const fresh = statusPips(c);
  if (old) old.replaceWith(fresh); else node.append(fresh);

  const oldIntent = node.querySelector('.intent');
  if (oldIntent) oldIntent.remove();
  const it = intentEl(c);
  if (it) node.prepend(it);

  node.classList.toggle('dead', c.hp <= 0);
}

/* ---------------- 遗物 / 药水 ---------------- */
export function relicChipEl(def, opts = {}) {
  const chip = el('div', {
    class: `relic-chip ${def.rarity || 'common'}`,
    text: def.glyph || def.name[0],
    title: `${def.name}（${RARITY_LABEL[def.rarity] || def.rarity}）\n${def.desc}${def.flavor ? '\n——' + def.flavor : ''}`,
  });
  if (opts.onClick) chip.addEventListener('click', () => opts.onClick(def, chip));
  return chip;
}

export function potionBtnEl(def, opts = {}) {
  return el('button', {
    class: `potion-btn ${def ? '' : 'empty'}`,
    title: def ? `${def.name}（${RARITY_LABEL[def.rarity]}）\n${def.desc}` : '空槽位',
    onclick: () => opts.onClick?.(def),
  }, def ? (def.glyph || '🧪') : '·');
}

/* ---------------- 选择卡 ---------------- */
export function choiceEl({ name, desc, req, disabled, onClick, glyph, tag }) {
  return el('div', {
    class: `choice ${disabled ? 'disabled' : ''}`,
    onclick: disabled ? null : onClick,
  },
    glyph ? el('div', { style: { fontSize: '30px', textAlign: 'center', marginBottom: '6px' } }, glyph) : null,
    el('div', { class: 'nm' }, name, tag ? el('span', { class: 'tagline', style: { marginLeft: '6px' } }, tag) : null),
    desc ? el('div', { class: 'ds', text: desc }) : null,
    req ? el('div', { class: 'req', text: req }) : null,
  );
}

export function heartsEl(meta) {
  const wrap = el('div', { class: 'hearts', title: `灯芯：${meta.hearts}/${meta.maxHearts}` });
  for (let i = 0; i < meta.maxHearts; i++) {
    wrap.append(el('span', { class: `heart ${i < meta.hearts ? '' : 'lost'}` }, '🕯️'));
  }
  return wrap;
}

export { TYPE_LABEL };
