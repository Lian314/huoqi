class ClassList {
  constructor() { this.values = new Set(); }
  add(...names) { for (const name of names) if (name) this.values.add(name); }
  remove(...names) { for (const name of names) this.values.delete(name); }
  contains(name) { return this.values.has(name); }
  toggle(name, force = !this.contains(name)) {
    force ? this.add(name) : this.remove(name);
    return force;
  }
}

class Node {
  constructor(tag, nodeType = 1) {
    this.nodeType = nodeType;
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.classList = new ClassList();
    this.listeners = new Map();
    this.parentNode = null;
    this.disabled = false;
    this._text = '';
    this._html = '';
  }
  get children() { return this.childNodes.filter((child) => child.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get className() { return Array.from(this.classList.values).join(' '); }
  set className(value) { this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean)); }
  get clientWidth() { return 800; }
  get offsetWidth() { return 120; }
  get offsetHeight() { return 120; }
  append(...children) {
    for (let child of children) {
      if (child == null) continue;
      if (!child.nodeType) {
        const text = new Node('#text', 3);
        text._text = String(child);
        child = text;
      }
      child.remove();
      child.parentNode = this;
      this.childNodes.push(child);
    }
  }
  appendChild(child) { this.append(child); return child; }
  prepend(...children) {
    const previous = this.childNodes.slice();
    this.append(...children);
    for (const child of previous) this.append(child);
  }
  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    if (index >= 0) this.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  remove() { this.parentNode?.removeChild(this); }
  replaceWith(child) {
    const parent = this.parentNode;
    if (!parent) return;
    child.remove();
    parent.childNodes[parent.childNodes.indexOf(this)] = child;
    child.parentNode = parent;
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = value;
    if (name === 'disabled') this.disabled = true;
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  dispatch(type, extra = {}) {
    const event = { target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...extra };
    const pending = [];
    for (const fn of this.listeners.get(type) || []) pending.push(fn(event));
    if (typeof this['on' + type] === 'function') pending.push(this['on' + type](event));
    return Promise.all(pending);
  }
  click(extra) { return this.disabled ? Promise.resolve() : this.dispatch('click', extra); }
  get textContent() {
    return this.childNodes.length ? this.childNodes.map((child) => child.textContent).join('') : this._text;
  }
  set textContent(value) {
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    this._text = String(value);
  }
  get innerHTML() { return this._html; }
  set innerHTML(value) { this.textContent = ''; this._html = String(value); }
  getBoundingClientRect() { return { left: 40, top: 40, width: 140, height: 180, right: 180, bottom: 220 }; }
  matches(selector) {
    if (this.nodeType !== 1) return false;
    if (selector.startsWith('#')) return this.attributes.id === selector.slice(1);
    if (selector.startsWith('.')) return selector.slice(1).split('.').every((name) => this.classList.contains(name));
    return this.tagName === selector.toUpperCase();
  }
  querySelectorAll(selector) {
    const out = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) out.push(child);
        visit(child);
      }
    };
    visit(this);
    return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function installDOM() {
  const roots = Object.fromEntries(['app', 'toast-root', 'fx-root', 'modal-root'].map((id) => {
    const node = new Node('div');
    node.setAttribute('id', id);
    return [id, node];
  }));
  const body = new Node('body');
  body.append(...Object.values(roots));
  const events = new Node('window');
  const requestAnimationFrame = (fn) => {
    const timer = setTimeout(fn, 0);
    timer.unref();
    return timer;
  };
  globalThis.document = {
    createElement: (tag) => new Node(tag),
    createElementNS: (_, tag) => new Node(tag),
    createTextNode: (text) => { const node = new Node('#text', 3); node.textContent = text; return node; },
    querySelector: (selector) => body.querySelector(selector),
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    body, documentElement: new Node('html'), readyState: 'complete',
  };
  globalThis.window = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    innerWidth: 1440, innerHeight: 900,
    requestAnimationFrame, cancelAnimationFrame: clearTimeout,
  };
  globalThis.requestAnimationFrame = requestAnimationFrame;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'node' } });
  return { roots, store, events };
}

module.exports = { installDOM, Node };
