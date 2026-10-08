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
    onclick: onClick ? (e) => { e.stopPropagation(); return onClick(node, e); } : null,
    onpointerenter: onHover ? () => onHover(node) : null,
  });

  node.append(el('div', { class: 'card-cost' + (def.cost < 0 ? ' x' : ''), text: def.cost < 0 ? 'X' : String(def.cost ?? 0) }));
  node.append(el('div', { class: `card-rarity ${def.rarity || 'common'}` }));
  node.append(el('div', { class: 'card-name', text: def.name }));
  node.append(el('div', { class: 'card-type', text: TYPE_LABEL[def.type] || def.type }));
  node.append(el('div', { class: 'card-art' }, def.portrait
    ? el('img', { src: def.portrait, alt: def.name, class: 'card-portrait' })
    : def.art || def.name?.[0] || '?'));
  node.append(el('div', { class: 'card-text', html: decorate(text) }));
  if (def.tags?.length) {
    node.append(el('div', { class: 'card-tags' }, def.tags.slice(0, 3).map((t) => el('span', { class: 'card-tag', text: t }))));
  }
  const footer = el('div', { class: 'card-footer' });
  if (def.exhaust) footer.append(el('div', { class: 'card-badge', text: '消耗' }));
  else if (def.ethereal) footer.append(el('div', { class: 'card-badge', text: '虚无' }));
  else if (def.innate) footer.append(el('div', { class: 'card-badge', text: '起手' }));
  if (def.unlock?.embers && !opts.hideUnlock) footer.append(el('div', { class: 'card-badge', text: `印记${def.unlock.embers}` }));
  if (count != null) node.append(el('div', { class: 'count-badge', text: `×${count}` }));
  if (upgradeable) footer.append(el('div', { class: 'card-badge', text: '可升级' }));
  node.append(footer);
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
    class: `combatant standee ${sizeCls} ${c.hp <= 0 ? 'dead' : ''} ${targetable ? 'targetable' : ''}`,
    dataset: { uid: c.uid },
    onclick: onClick ? () => onClick(c, node) : null,
    onpointerenter: onHover ? () => onHover(c, node) : null,
  });
  node._uid = c.uid;

  // 1. 浮动头顶意图
  const it = intentEl(c);
  if (it) node.append(it);

  // 2. 角色立牌主体（无框/拱形剪影 + 呼吸律动）
  const figure = el('div', { class: 'cbt-figure' });
  const hasArt = !!(c.art || c.portrait);
  if (hasArt) {
    const imgWrap = el('div', { class: 'cbt-standee-frame' },
      el('img', {
        class: 'cbt-glyph-img cbt-standee-img',
        src: c.art || c.portrait,
        alt: c.name,
      }),
    );
    figure.append(imgWrap);
  } else {
    const emblem = el('div', {
      class: 'cbt-glyph cbt-glyph-emblem',
      style: { borderColor: c.color || 'var(--line-2)' },
    }, el('span', { class: 'cbt-glyph-symbol', text: c.glyph || '?' }));
    figure.append(emblem);
  }

  // 瞄准锁定准星
  figure.append(el('div', { class: 'cbt-target-reticle' }));

  // 接触地面的暗影与地台
  figure.append(el('div', { class: 'cbt-pedestal' },
    el('div', { class: 'cbt-pedestal-shadow' }),
    el('div', { class: 'cbt-pedestal-plate' }),
  ));
  node.append(figure);

  // 3. 单位铭牌与生命值面板
  const vitals = el('div', { class: 'cbt-vitals' });
  vitals.append(el('div', { class: 'cbt-name', text: c.name }));

  const hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
  const barNode = el('div', { class: 'hpbar' },
    el('i', { class: `hp ${hpPct < .34 ? 'low' : ''}`, style: { width: `${Math.max(0, hpPct * 100)}%` } }),
    el('div', { class: 'cbt-hpnum mono', text: `${c.hp} / ${c.maxHp}` }),
  );
  if (c.block > 0) barNode.append(el('div', { class: 'blockchip', text: `⛨ ${c.block}` }));
  vitals.append(barNode);
  vitals.append(statusPips(c));
  node.append(vitals);

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
    disabled: !def || opts.disabled,
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
