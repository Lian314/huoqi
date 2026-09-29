// 通用工具函数

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0);
export const uniq = (arr) => Array.from(new Set(arr));
export const last = (arr) => arr[arr.length - 1];

export function groupBy(arr, keyFn) {
  const out = {};
  for (const it of arr) {
    const k = keyFn(it);
    (out[k] ||= []).push(it);
  }
  return out;
}

/** 洗牌（Fisher-Yates），返回新数组 */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deepClone(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(deepClone);
  const out = {};
  for (const k in o) out[k] = deepClone(o[k]);
  return out;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(4)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pct(n) {
  return `${Math.round(n * 100)}%`;
}

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function uid(prefix = 'id') {
  uid._n = (uid._n || 0) + 1;
  return `${prefix}_${Date.now().toString(36)}_${uid._n}`;
}

/** 从加权表随机 n 个不重复项 */
export function pickWeighted(rng, items, n, weightFn = (x) => x.weight ?? 1) {
  const pool = items.slice();
  const out = [];
  while (out.length < n && pool.length) {
    const it = rng.weighted(pool, weightFn);
    if (!it) break;
    out.push(it);
    pool.splice(pool.indexOf(it), 1);
  }
  return out;
}

export const EVENT_BUS_MARK = '__dsh_event_bus__';
