import { el, clear } from '../../core/utils.js';
import { panel, toast, modal, sectionTitle } from '../fx.js';
import { choiceEl, cardEl } from '../components.js';
import { card as cardDef, relic as relicDef } from '../../data/index.js';
import { removeCardAt, upgradeCardAt, grantRelic, rollRelicReward, cardDisplay } from '../../core/run.js';
import { applyRunEffects, formatLog } from '../../systems/outcome.js';
import { relicHook } from '../../systems/effects.js';
import { makeRunCtx } from '../../systems/outcome.js';

export function renderCamp({ app, root, params, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('map'); return; }
  const b = app.bonuses;
  const mode = params.mode || 'rest';
  const nodeId = params.nodeId || run.map.currentId;
  run.campStates ||= {};
  const state = run.campStates[nodeId] ||= { mode, used: false, note: null };
  let active = true;
  onDispose?.(() => { active = false; });
  const canAct = () => active && app.run === run && !state.used;

  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap-narrow' });
  scroll.append(wrap);
  root.append(scroll);

  function finish(note) {
    if (!canAct()) return false;
    state.used = true;
    state.note = note || '火堆熄了。你该上路了。';
    if (mode === 'rest') {
      const ctx = makeRunCtx(run);
      relicHook(ctx, 'onRest', { ctx, self: ctx.self });
      run.hp = Math.max(0, Math.min(run.maxHp, ctx.self.hp));
    }
    app.save();
    app.rerender();
    return true;
  }

  function renderFinished() {
    clear(wrap);
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '30px 0' } },
        el('div', { class: 'big-glyph' }, mode === 'rest' ? '🔥' : '💎'),
      ),
      panel(null, el('p', { style: { fontSize: '15px', lineHeight: 2, margin: 0, textAlign: 'center' } }, state.note)),
      el('div', { style: { textAlign: 'center', marginTop: '18px' } },
        el('button', { class: 'btn primary xl', onclick: () => app.afterNode() }, '继续深入'),
      ),
    );
  }

  if (state.used) { renderFinished(); return; }

  if (mode === 'rest') {
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '10px 0' } },
        el('div', { class: 'big-glyph' }, '🔥'),
        el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '5px', margin: '6px 0' } }, '篝 火'),
        el('p', { style: { color: 'var(--fg-dim)' } }, '灰烬噼啪作响。火光是这条地窟里唯一还算温暖的东西。'),
      ),
    );

    const healAmt = Math.round(run.maxHp * 0.32);
    const opts = [
      {
        name: '休 息',
        desc: `回复 ${healAmt} 点生命（当前 ${run.hp}/${run.maxHp}）。`,
        disabled: run.hp >= run.maxHp,
        onClick: () => {
          if (!canAct()) return;
          const before = run.hp;
          run.hp = Math.min(run.maxHp, run.hp + healAmt);
          finish(`你合了会儿眼，回复了 ${run.hp - before} 点生命。`);
        },
      },
      {
        name: '锻 炼',
        desc: '把一张牌磨到更锋利。（升级一张卡牌）',
        disabled: !run.deck.some((c) => !c.upgraded && cardDef(c.id)?.upgrade),
        onClick: () => pickCard('选择要升级的牌', (idx) => {
          const c = upgradeCardAt(run, idx);
          if (!c) return false;
          return finish(`【${cardDef(c.id)?.name}】被磨得更利了。`);
        }, true),
      },
    ];
    if (b.campfireRemove) {
      opts.push({
        name: '投 火',
        desc: '把一张不需要的牌扔进火里。（永久移除一张牌）',
        disabled: run.deck.length <= 5,
        onClick: () => pickCard('选择要烧掉的牌', (idx) => {
          if (!app.bonuses.campfireRemove || run.deck.length <= 5) { toast('无法继续投火', 'bad'); return false; }
          const c = removeCardAt(run, idx);
          if (!c) return false;
          return finish(`【${cardDef(c.id)?.name}】在火里卷曲、发黑，然后不见了。`);
        }),
      });
    }

    const row = el('div', { class: 'choice-row' });
    for (const o of opts) row.append(choiceEl(o));
    wrap.append(row);
    if (b.restHeal) {
      wrap.append(el('div', { class: 'hint', style: { textAlign: 'center', marginTop: '12px' } },
        '客房已建成：击败精英后回复 25% 最大生命。'));
    }
  } else {
    // 宝库
    state.gold ??= run.rng.int(35, 65) + (run.act - 1) * 25;
    state.relics ||= rollRelicReward(run, 3).map((r) => r.id);
    const g = state.gold;
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '10px 0' } },
        el('div', { class: 'big-glyph' }, '💎'),
        el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '5px', margin: '6px 0' } }, '封 存 的 宝 库'),
        el('p', { style: { color: 'var(--fg-dim)' } }, '有人把东西藏在这里，然后就再也没有回来取。'),
      ),
    );
    const relics = state.relics.map(relicDef).filter(Boolean);
    wrap.append(panel(`金币 · ${g}`, el('div', { class: 'hint' }, '你把袋子沉甸甸地背了起来。'),
      el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '12px' } },
        el('button', {
          class: 'btn primary', onclick: () => { if (!canAct()) return; run.gold += g; run.stats.goldEarned += g; finish(`你拿走了 ${g} 金币。`); },
        }, '全部拿走'),
        el('button', { class: 'btn ghost', onclick: () => finish('你什么也没拿。') }, '空手离开'),
      ),
    ));
    if (relics.length) {
      wrap.append(panel('一 堆 零 碎', el('div', { class: 'card-grid' },
        relics.map((r) => {
          const box = el('div', { style: { position: 'relative' } },
            cardEl({ ...r, type: 'power', art: r.glyph, text: r.desc, cost: 0, rarity: r.rarity, name: r.name }));
          box.append(el('button', {
            class: 'btn sm gold',
            style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', zIndex: 6 },
            onclick: () => { if (!canAct()) return; if (!grantRelic(run, r.id)) return; run.gold += g; run.stats.goldEarned += g; finish(`你带走了 ${r.name}，还有 ${g} 金币。`); },
          }, '取走'));
          return box;
        }),
      )));
    }
  }

  function pickCard(title, cb, onlyNotUpgraded = false) {
    if (!canAct()) return;
    const grid = el('div', { class: 'card-grid' });
    let closed = false;
    let picked = false;
    let close = () => {};
    run.deck.forEach((inst) => {
      const d = cardDisplay(run, inst);
      if (!d) return;
      if (onlyNotUpgraded && (inst.upgraded || !d.upgrade)) return;
      grid.append(cardEl(d, { size: '', onClick: () => {
        if (closed || picked || !canAct()) return;
        const idx = run.deck.findIndex((c) => c.uid === inst.uid);
        if (idx < 0) { toast('这张牌已不在牌组中', 'bad'); return; }
        if (onlyNotUpgraded && run.deck[idx].upgraded) { toast('这张牌已升级', 'bad'); return; }
        if (cb(idx) === false) return;
        picked = true;
        close();
      } }));
    });
    close = modal({ title, sub: '点击一张牌', body: grid, actions: [{ label: '取消', kind: 'ghost' }], onClose: () => { closed = true; } });
  }
}
