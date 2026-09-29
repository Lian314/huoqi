// UI 特效与通用 DOM 工具
import { el, $, clear } from '../core/utils.js';

/* ---------------- Toast ---------------- */
export function toast(msg, kind = '', ms = 2400) {
  const root = $('#toast-root');
  if (!root) return;
  const t = el('div', { class: `toast ${kind}`, text: msg });
  root.append(t);
  setTimeout(() => t.remove(), ms + 400);
}

/* ---------------- 浮动数字 ---------------- */
export function floatNum(x, y, text, kind = 'dmg') {
  const root = $('#fx-root');
  if (!root) return;
  const n = el('div', { class: `float-num ${kind}`, text });
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
  root.append(n);
  setTimeout(() => n.remove(), 1150);
}

export function centerOf(node) {
  if (!node) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function popAt(node, text, kind = 'dmg') {
  const { x, y } = centerOf(node);
  floatNum(x, y, text, kind);
}

export function flashNode(node, kind = 'dmg') {
  if (!node) return;
  node.classList.remove(kind === 'dmg' ? 'flash-hit' : kind);
  void node.offsetWidth;
  node.classList.add(kind === 'dmg' ? 'flash-hit' : kind);
  if (kind === 'dmg') {
    node.classList.add('shake');
    setTimeout(() => node.classList.remove('shake'), 360);
  }
}

export function slashFx(node) {
  const root = $('#fx-root');
  if (!root || !node) return;
  const { x, y } = centerOf(node);
  const s = el('div', { class: 'slash' });
  s.style.left = `${x}px`; s.style.top = `${y}px`;
  root.append(s);
  setTimeout(() => s.remove(), 460);
}

/* ---------------- Modal ---------------- */
let modalStack = [];

export function modal({ title, sub, body, actions = [], onClose, wide = false, dismissable = true }) {
  const root = $('#modal-root');
  if (!root) return () => {};
  const content = el('div', { class: 'modal' });
  if (wide) content.style.width = 'min(860px, 96vw)';
  if (title) content.append(el('h2', { text: title }));
  if (sub) content.append(el('div', { class: 'modal-sub', text: sub }));
  if (body) content.append(typeof body === 'string' ? el('div', { html: body }) : body);

  const foot = el('div', { class: 'modal-foot' });
  for (const a of actions) {
    const b = el('button', {
      class: `btn ${a.kind || ''}`,
      disabled: a.disabled,
      onclick: () => { const r = a.onClick?.(); if (r !== false) close(); },
    }, a.label);
    foot.append(b);
  }
  content.append(foot);

  const mask = el('div', { class: 'modal-mask', onclick: (e) => { if (e.target === mask && dismissable) close(); } }, content);
  root.append(mask);
  modalStack.push(close);

  function close() {
    mask.remove();
    modalStack = modalStack.filter((f) => f !== close);
    onClose?.();
  }
  return close;
}

export function closeAllModals() {
  for (const f of modalStack.slice()) f();
  modalStack = [];
}

export function confirmDialog(title, sub, okLabel = '确定', kind = 'primary') {
  return new Promise((res) => {
    modal({
      title, sub, dismissable: false,
      body: '',
      actions: [
        { label: '取消', kind: 'ghost', onClick: () => res(false) },
        { label: okLabel, kind, onClick: () => res(true) },
      ],
    });
  });
}

/* ---------------- 通用元素 ---------------- */
export function panel(title, ...children) {
  const p = el('div', { class: 'panel' });
  if (title) p.append(el('h3', { text: title }));
  for (const c of children.flat(3)) if (c) p.append(c);
  return p;
}

export function statBox(n, label) {
  return el('div', { class: 'stat-box' },
    el('div', { class: 'n', text: String(n) }),
    el('div', { class: 'l', text: label }),
  );
}

export function tagged(text, kind = '') {
  return el('span', { class: `tagline ${kind}`, text });
}

export function bar(pct, cls = '') {
  return el('div', { class: `bar-mini ${cls}` }, el('i', { style: { width: `${Math.max(0, Math.min(100, pct * 100))}%` } }));
}

export function sectionTitle(main, sub) {
  return el('div', { style: { textAlign: 'center', margin: '6px 0 14px' } },
    el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '4px', margin: 0 } }, main),
    sub ? el('div', { class: 'hint', style: { letterSpacing: '2px' } }, sub) : null,
  );
}
