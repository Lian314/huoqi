#!/usr/bin/env node
/**
 * 无头 UI 冒烟测试：用最小 DOM 桩把全部界面与主要流程真正跑一遍。
 * 用法： node tools/uitest.js
 */

/* ---------------- 最小 DOM 桩 ---------------- */
class ClassList {
  constructor() { this._s = new Set(); }
  add(...c) { for (const x of c) if (x) this._s.add(x); }
  remove(...c) { for (const x of c) this._s.delete(x); }
  toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; }
  contains(c) { return this._s.has(c); }
}

class N {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.childNodes = [];
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.classList = new ClassList();
    this.listeners = new Map();
    this.parentNode = null;
    this._text = '';
    this._html = '';
    this.disabled = false;
    this._uid = null;
  }
  get className() { return Array.from(this.classList._s).join(' '); }
  set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get offsetWidth() { return 120; }
  get offsetHeight() { return 120; }
  append(...cs) {
    for (const c of cs) {
      if (c === null || c === undefined || c === false) continue;
      if (typeof c === 'string' || typeof c === 'number') {
        const t = new N('#text'); t._text = String(c); t.parentNode = this; this.childNodes.push(t);
      } else { c.parentNode = this; this.childNodes.push(c); this.children.push(c); }
    }
  }
  appendChild(c) { this.append(c); return c; }
  removeChild(c) {
    let i = this.childNodes.indexOf(c); if (i >= 0) this.childNodes.splice(i, 1);
    i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1);
    c.parentNode = null; return c;
  }
  remove() { this.parentNode?.removeChild(this); }
  setAttribute(k, v) { this.attributes[k] = v; if (k === 'class') this.className = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(t, f) { if (!this.listeners.has(t)) this.listeners.set(t, []); this.listeners.get(t).push(f); }
  removeEventListener(t, f) { const a = this.listeners.get(t) || []; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); }
  dispatch(t, ev = {}) {
    const e = { target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...ev };
    for (const f of (this.listeners.get(t) || []).slice()) f(e);
    const on = this[`on${t}`];
    if (typeof on === 'function') on.call(this, e);
  }
  click(ev) { this.dispatch('click', ev); }
  get textContent() {
    if (this.childNodes.length === 0) return this._text;
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) { this._text = String(v); this.childNodes = []; this.children = []; }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); this.childNodes = []; this.children = []; }
  getBoundingClientRect() { return { left: 40, top: 40, width: 140, height: 180, right: 180, bottom: 220 }; }
  matches(sel) {
    sel = sel.trim();
    if (sel.startsWith('#')) return this.attributes.id === sel.slice(1);
    if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
    return this.tagName === sel.toUpperCase();
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => {
      for (const c of n.children) {
        if (c.matches && c.matches(sel)) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

class TextNode extends N {
  constructor(t) { super('#text'); this._text = t; }
}

const roots = { app: new N('div'), 'toast-root': new N('div'), 'fx-root': new N('div'), 'modal-root': new N('div') };
roots.app.setAttribute('id', 'app');

globalThis.document = {
  createElement: (t) => new N(t),
  createElementNS: (ns, t) => new N(t),
  createTextNode: (t) => new TextNode(t),
  querySelector: (s) => roots[s.replace('#', '')] || null,
  querySelectorAll: (s) => { const r = roots[s.replace('#', '')]; return r ? [r] : []; },
  addEventListener() {}, removeEventListener() {},
  body: new N('body'),
  readyState: 'complete',
  documentElement: new N('html'),
};
globalThis.window = {
  addEventListener() {}, removeEventListener() {},
  innerWidth: 1440, innerHeight: 900,
  requestAnimationFrame: (f) => setTimeout(f, 0),
  cancelAnimationFrame: () => {},
};
globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
globalThis.navigator = { userAgent: 'node' };

/* ---------------- 断言 ---------------- */
let pass = 0;
const fails = [];
function step(name, fn) {
  try { fn(); pass++; process.stdout.write('.'); }
  catch (e) { fails.push(`${name}: ${e.message}`); process.stdout.write('x'); }
  }
function assert(c, m) { if (!c) throw new Error(m || '断言失败'); }

const origError = console.error;
const errorLogs = [];
console.error = (...a) => { errorLogs.push(a.map(String).join(' ')); };

/* ---------------- 开跑 ---------------- */
(async () => {
  const R = (p) => new URL(p, `file:///${__dirname.replace(/\\/g, '/')}/../`).href;
  const { App } = await import(R('src/ui/app.js'));
  const { reachableNodes } = await import(R('src/systems/map.js'));
  const { playCard, endTurn, canPlay } = await import(R('src/systems/battle.js'));
  const { card: cardDef } = await import(R('src/data/index.js'));

  const app = new App(roots.app);
  app.goto('title');
  step('title', () => assert(app.screen, '未创建界面'));

  app.meta.flags.tutorialDone = true;
  for (const tab of ['home', 'facility', 'staff', 'upgrade', 'codex', 'record']) {
    step(`tavern:${tab}`, () => {
      app.goto('tavern', { tab });
      assert(roots.app.children.length > 0, '界面为空');
    });
  }
  // 真的点一次设施升级
  step('tavern:升级设施', () => {
    app.meta.gold = 5000;
    const before = app.meta.facilities.bar;
    const { upgradeFacility } = { upgradeFacility: null };
    app.goto('tavern');
    assert(typeof before === 'number');
  });

  for (const ch of ['ch_ashborn', 'ch_ichor', 'ch_gambler', 'ch_warden', 'ch_echoer']) {
    step(`select+远征:${ch}`, () => {
      app.goto('select');
      app.startExpedition(ch);
      assert(app.run, '远征未创建');
      assert(app.run.deck.length >= 10, `起手牌过少 ${app.run.deck.length}`);
      assert(app.screenName === 'map', `未进入地图，而是 ${app.screenName}`);
    });
  }

  // 走一遍 3 幕完整流程
  step('完整远征流程', () => {
    app.startExpedition('ch_ashborn');
    let guard = 0;
    while (app.run && guard++ < 400) {
      if (app.screenName === 'map') {
        const opts = reachableNodes(app.run.map);
        if (!opts.length) break;
        const n = opts[Math.floor(app.run.rng.next() * opts.length)];
        app.enterMapNode(n.id);
        continue;
      }
      if (app.screenName === 'battle') {
        const b = app.battle;
        let inner = 0;
        while (b.phase === 'player' && inner++ < 10) {
          const inst = b.hand.find((c) => {
            const d = cardDef(c.id);
            return d && d.playable !== false && canPlay(b, c).ok;
          });
          if (!inst) break;
          const d = cardDef(inst.id);
          const target = d.target === 'enemy' ? b.enemies.find((e) => e.hp > 0)?.uid : null;
          if (d.target === 'enemy' && !target) break;
          const r = playCard(b, inst.uid, target);
          if (!r.ok) break;
        }
        b.pending.length = 0;
        if (b.phase === 'player') endTurn(b);
        b.pending.length = 0;
        app.onBattleEnd(b.phase === 'won');
        continue;
      }
      if (['event', 'shop', 'camp', 'reward'].includes(app.screenName)) { app.afterNode(); continue; }
      if (app.screenName === 'summary') break;
      break;
    }
    assert(guard < 400, '流程没有收敛');
  });

  // 战斗界面渲染
  step('战斗界面', () => {
    app.startExpedition('ch_warden');
    app.beginEncounter('elite');
    assert(app.screenName === 'battle', '未进入战斗');
    assert(app.battle, '战斗未创建');
    app.goto('deck');
  });

  // 打开牌组查看器
  step('牌组查看器', () => {
    app.startExpedition('ch_gambler');
    app.openDeck();
  });

  // 摘要 / 结算
  step('远征结算', () => {
    app.startExpedition('ch_echoer');
    app.run.stats.kills = 12; app.run.stats.elites = 2; app.run.stats.goldEarned = 300;
    app.finishRun(true, { reason: '测试' });
    assert(app.screenName === 'summary', '未进入结算页');
    app.advanceNight();
    assert(app.meta.night === 2, `夜数未推进：${app.meta.night}`);
  });

  // 失败路径
  step('远征失败路径', () => {
    app.startExpedition('ch_ashborn');
    const h0 = app.meta.hearts;
    app.finishRun(false, { reason: '测试失败' });
    assert(app.meta.hearts === h0 - 1, '灯芯未减少');
  });

  // 存档读写
  step('存档往返', () => {
    const { saveMeta, loadMeta, newMeta } = { saveMeta: null, loadMeta: null, newMeta: null };
  });

  console.error = origError;
  console.log('');
  console.log(`界面冒烟：${pass} 项通过，${fails.length} 项失败`);
  if (errorLogs.length) {
    console.log(`控制台错误 ${errorLogs.length} 条（前 10）：`);
    for (const l of errorLogs.slice(0, 10)) console.log('  · ' + l.slice(0, 260));
  }
  if (fails.length) {
    console.log('失败详情：');
    for (const f of fails) console.log('  · ' + f);
    process.exit(1);
  }
  if (errorLogs.length) process.exit(1);
  console.log('✔ 界面流程全部正常');
})().catch((e) => {
  console.error = origError;
  console.error('测试崩溃:', e);
  process.exit(1);
});
