import { el, clear } from '../../core/utils.js';
import { panel, toast, sectionTitle, statBox } from '../fx.js';
import { cardEl, relicChipEl, potionBtnEl } from '../components.js';
import { rollCardReward, rollRelicReward, rollPotionReward, grantRelic, grantPotion } from '../../core/run.js';
import { card as cardDef, relic as relicDef, potion as potionDef, RARITY_LABEL } from '../../data/index.js';
import { isUnlocked } from '../../systems/meta.js';

export function renderReward({ app, root, params }) {
  const run = app.run;
  if (!run) { app.goto('map'); return; }
  const b = app.bonuses;

  // 构建步骤队列
  if (!run._rewardQueue || run._rewardQueueKey !== rewardKey(params)) {
    const steps = [];
    if (params.step === 'card' || (!params.step && params.tier)) {
      const n = 3 + b.cardChoice + (params.tier === 'boss' ? 1 : 0);
      steps.push({ kind: 'card', count: n });
    }
    if (params.step === 'relic') steps.push({ kind: 'relic', count: 1 });
    if (!params.step && params.tier && ['elite', 'boss'].includes(params.tier)) {
      steps.push({ kind: 'relic', count: 1 + (b.relicChoice ? 1 : 0) });
    }
    if (!params.step && params.tier && run.rng.chance(params.tier === 'sentry' ? 0.35 : 0.55)) {
      steps.push({ kind: 'potion', count: run.rng.int(1, 2) });
    }
    if (!steps.length) steps.push({ kind: 'done' });
    run._rewardQueue = steps;
    run._rewardQueueKey = rewardKey(params);
    run._rewardGold = app.rewardGold || 0;
  }

  let idx = 0;
  const queue = run._rewardQueue;

  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap' });
  scroll.append(wrap);
  root.append(scroll);

  function next() {
    idx += 1;
    app.save();
    if (idx >= queue.length) {
      run._rewardQueue = null;
      run._rewardQueueKey = null;
      app.rewardGold = 0;
      app.afterNode();
      return;
    }
    render();
  }

  function render() {
    clear(wrap);
    const step = queue[idx];

    // 金币结算
    if (idx === 0 && run._rewardGold) {
      wrap.append(el('div', { style: { textAlign: 'center', padding: '20px 0 6px' } },
        el('div', { class: 'big-glyph' }, '💰'),
        el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '5px' } }, `+${run._rewardGold} 金币`),
      ));
    }

    if (step.kind === 'card') renderCard(step);
    else if (step.kind === 'relic') renderRelic(step);
    else if (step.kind === 'potion') renderPotion(step);
    else next();
  }

  function renderCard(step) {
    const pool = rollCardReward(run, step.count, { rareBias: (run.act - 1) });
    if (!pool.length) { toast('没有可选的卡牌'); next(); return; }
    wrap.append(sectionTitle('选 择 一 张 牌', `加入牌组 · 跳过不扣任何东西`));
    const grid = el('div', { class: 'card-grid' });
    let chosen = false;
    for (const d of pool) {
      const box = el('div', { style: { position: 'relative' } }, cardEl(d, { size: '' }));
      box.append(el('button', {
        class: 'btn sm primary', style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', zIndex: 6 },
        onclick: () => {
          if (chosen) return;
          chosen = true;
          run.deck.push({ id: d.id, uid: `d${run.deckSeq++}`, upgraded: false });
          run.stats.cardsAdded += 1;
          toast(`获得【${d.name}】`, 'good');
          next();
        },
      }, '收下'));
      grid.append(box);
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: next }, '不选，继续'),
    ));
  }

  function renderRelic(step) {
    const pool = rollRelicReward(run, Math.max(1, step.count + b.relicChoice));
    if (!pool.length) { toast('没有可选的遗物'); next(); return; }
    wrap.append(sectionTitle('遗 物', '只能带走一件'));
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px' } });
    let chosen = false;
    for (const d of pool.slice(0, Math.max(1, step.count))) {
      grid.append(el('div', {
        class: 'choice', onclick: () => {
          if (chosen) return;
          chosen = true;
          grantRelic(run, d.id);
          toast(`获得遗物：${d.name}`, 'gold');
          next();
        },
      },
        el('div', { style: { fontSize: '34px', textAlign: 'center' } }, d.glyph || '🔩'),
        el('div', { class: 'nm', style: { textAlign: 'center' } }, d.name, ' ', el('span', { class: 'tagline' }, RARITY_LABEL[d.rarity])),
        el('div', { class: 'ds', style: { textAlign: 'center' } }, d.desc),
        d.flavor ? el('div', { class: 'hint', style: { textAlign: 'center', fontStyle: 'italic', marginTop: '6px' } }, d.flavor) : null,
      ));
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: next }, '不拿，继续'),
    ));
  }

  function renderPotion(step) {
    const pool = rollPotionReward(run, step.count + 2);
    wrap.append(sectionTitle('药 水', `带一瓶，最多携带 ${run.potionSlots} 瓶`));
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' } });
    for (const d of pool) {
      grid.append(el('div', {
        class: 'choice', onclick: () => {
          if (!grantPotion(run, d.id)) { toast('药水栏已满', 'bad'); return; }
          toast(`获得 ${d.name}`, 'good');
          next();
        },
      },
        el('div', { style: { fontSize: '34px', textAlign: 'center' } }, d.glyph || '🧪'),
        el('div', { class: 'nm', style: { textAlign: 'center' } }, d.name, ' ', el('span', { class: 'tagline' }, RARITY_LABEL[d.rarity])),
        el('div', { class: 'ds', style: { textAlign: 'center' } }, d.desc),
      ));
    }
    wrap.append(grid);
    wrap.append(el('div', { style: { textAlign: 'center', margin: '18px 0 34px' } },
      el('button', { class: 'btn ghost', onclick: next }, '不拿，继续'),
    ));
  }

  render();
}

function rewardKey(params) {
  return `${params.step || 'auto'}|${params.tier || ''}|${params.from || ''}`;
}
