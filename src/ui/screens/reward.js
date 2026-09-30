import { el, clear } from '../../core/utils.js';
import { toast, sectionTitle } from '../fx.js';
import { cardEl } from '../components.js';
import { rollCardReward, rollRelicReward, rollPotionReward, grantRelic, grantPotion, addCard } from '../../core/run.js';
import { card as cardDef, relic as relicDef, potion as potionDef, RARITY_LABEL } from '../../data/index.js';
import { potionDisplay } from '../../systems/battle.js';

export function renderReward({ app, root, params, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('map'); return; }
  const b = app.bonuses;

  const key = rewardKey(params, run.map.currentId);
  if (!run._rewardState || run._rewardState.key !== key) {
    const steps = [];
    if (params.step === 'card' || (!params.step && params.tier)) {
      const n = 3 + b.cardChoice + (params.tier === 'boss' ? 1 : 0);
      steps.push({ kind: 'card', count: n });
    }
    if (params.step === 'relic') steps.push({ kind: 'relic', count: (params.from === 'event' ? 3 : 1) + b.relicChoice });
    if (!params.step && ['elite', 'boss', 'trial', 'vault'].includes(params.tier)) {
      steps.push({ kind: 'relic', count: 1 + b.relicChoice });
    } else if (!params.step && params.tier === 'normal' && run.relicFind > 0 && run.rng.chance(Math.min(1, run.relicFind))) {
      steps.push({ kind: 'relic', count: 1 + b.relicChoice });
    }
    if (!params.step && params.tier && run.rng.chance(params.tier === 'sentry' ? 0.35 : 0.55)) {
      steps.push({ kind: 'potion', count: run.rng.int(1, 2) });
    }
    if (!steps.length) steps.push({ kind: 'done' });
    run._rewardState = { key, queue: steps, idx: 0, gold: params.step ? 0 : (app.rewardGold || 0), complete: false };
  }

  const state = run._rewardState;
  let active = true;
  onDispose?.(() => { active = false; });
  if (state.complete) { app.goto('map'); return; }

  let hud = app.hud();
  root.append(hud);
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap' });
  scroll.append(wrap);
  root.append(scroll);

  function next(expectedIdx, claim = null) {
    if (!active || app.run !== run || run._rewardState !== state || state.complete || state.idx !== expectedIdx) return;
    if (claim?.() === false) return;
    state.idx += 1;
    if (state.idx >= state.queue.length) state.complete = true;
    app.save();
    if (state.complete) {
      app.rewardGold = 0;
      app.afterNode();
      return;
    }
    render();
  }

  function render() {
    const nextHud = app.hud();
    hud.replaceWith(nextHud);
    hud = nextHud;
    clear(wrap);
    const idx = state.idx;
    const step = state.queue[idx];

    // 金币结算
    if (idx === 0 && state.gold) {
      wrap.append(el('div', { style: { textAlign: 'center', padding: '20px 0 6px' } },
        el('div', { class: 'big-glyph' }, '💰'),
        el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '5px' } }, `+${state.gold} 金币`),
      ));
    }

    if (step.kind === 'card') renderCard(step, idx);
    else if (step.kind === 'relic') renderRelic(step, idx);
    else if (step.kind === 'potion') renderPotion(step, idx);
    else next(idx);
  }

  function renderCard(step, idx) {
    step.offers ||= rollCardReward(run, step.count, { rareBias: Math.min(3, run.act - 1) + (params.tier === 'trial' ? 1 : 0) }).map((d) => d.id);
    const pool = step.offers.map(cardDef).filter(Boolean);
    if (!pool.length) { toast('没有可选的卡牌'); next(idx); return; }
    wrap.append(sectionTitle('选 择 一 张 牌', `加入牌组 · 跳过不扣任何东西`));
    const grid = el('div', { class: 'card-grid' });
    for (const d of pool) {
      const box = el('div', { style: { position: 'relative' } }, cardEl(d, { size: '' }));
      box.append(el('button', {
        class: 'btn sm primary', style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', zIndex: 6 },
        onclick: () => next(idx, () => {
          addCard(run, d.id);
          toast(`获得【${d.name}】`, 'good');
        }),
      }, '收下'));
      grid.append(box);
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: () => next(idx) }, '不选，继续'),
    ));
  }

  function renderRelic(step, idx) {
    step.offers ||= rollRelicReward(run, Math.max(1, step.count)).map((d) => d.id);
    const pool = step.offers.map(relicDef).filter(Boolean);
    if (!pool.length) { toast('没有可选的遗物'); next(idx); return; }
    wrap.append(sectionTitle('遗 物', '只能带走一件'));
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px' } });
    for (const d of pool) {
      grid.append(el('div', {
        class: 'choice', onclick: () => next(idx, () => {
          if (!grantRelic(run, d.id)) { toast('已持有这件遗物', 'bad'); return false; }
          toast(`获得遗物：${d.name}`, 'gold');
        }),
      },
        el('div', { style: { fontSize: '34px', textAlign: 'center' } }, d.glyph || '🔩'),
        el('div', { class: 'nm', style: { textAlign: 'center' } }, d.name, ' ', el('span', { class: 'tagline' }, RARITY_LABEL[d.rarity])),
        el('div', { class: 'ds', style: { textAlign: 'center' } }, d.desc),
        d.flavor ? el('div', { class: 'hint', style: { textAlign: 'center', fontStyle: 'italic', marginTop: '6px' } }, d.flavor) : null,
      ));
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: () => next(idx) }, '不拿，继续'),
    ));
  }

  function renderPotion(step, idx) {
    step.offers ||= rollPotionReward(run, step.count + 2).map((d) => d.id);
    const pool = step.offers.map((id) => potionDisplay(run, potionDef(id))).filter(Boolean);
    wrap.append(sectionTitle('药 水', `带一瓶，最多携带 ${run.potionSlots} 瓶`));
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' } });
    for (const d of pool) {
      grid.append(el('div', {
        class: 'choice', onclick: () => next(idx, () => {
          if (!grantPotion(run, d.id)) { toast('药水栏已满', 'bad'); return false; }
          toast(`获得 ${d.name}`, 'good');
        }),
      },
        el('div', { style: { fontSize: '34px', textAlign: 'center' } }, d.glyph || '🧪'),
        el('div', { class: 'nm', style: { textAlign: 'center' } }, d.name, ' ', el('span', { class: 'tagline' }, RARITY_LABEL[d.rarity])),
        el('div', { class: 'ds', style: { textAlign: 'center' } }, d.desc),
      ));
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: () => next(idx) }, '不拿，继续'),
    ));
  }

  render();
}

function rewardKey(params, currentId) {
  return `${params.nodeId || currentId || ''}|${params.step || 'auto'}|${params.tier || ''}|${params.from || ''}`;
}
