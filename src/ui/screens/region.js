import { el, clear } from '../../core/utils.js';
import { regionsOf } from '../../data/regions.js';

export function regionBanner(region, opts = {}) {
  if (!region) return el('div', { class: 'region-banner empty' });
  return el('section', {
    class: `region-banner ${opts.compact ? 'compact' : ''}`,
    style: { '--region-color': region.color || '#2ec4b6' },
    dataset: { regionId: region.id },
  },
    el('img', {
      class: 'region-landscape', src: region.art || `/assets/regions/${region.id}.svg`,
      alt: region.name, draggable: 'false',
    }),
    el('div', { class: 'region-banner-copy' },
      el('span', { class: 'region-eyebrow' }, opts.kicker || `第 ${region.act} 幕 · ${region.title || '深港航路'}`),
      el('h2', {}, region.name),
      el('p', {}, opts.text ?? region.text ?? ''),
    ),
  );
}

export function regionChoice(region, selected, onSelect) {
  return el('button', {
    class: `region-choice ${selected ? 'picked' : ''}`,
    style: { '--region-color': region.color || '#2ec4b6' },
    'aria-pressed': String(selected),
    dataset: { regionId: region.id },
    onclick: () => onSelect(region.id),
  },
    el('img', {
      class: 'region-choice-art', src: region.art || `/assets/regions/${region.id}.svg`,
      alt: '', draggable: 'false',
    }),
    el('div', { class: 'region-choice-copy' },
      el('div', { class: 'region-choice-heading' },
        el('strong', {}, region.name),
        el('span', { class: 'region-choice-check', 'aria-hidden': 'true' }, selected ? '✓' : '◇'),
      ),
      el('span', { class: 'region-choice-title' }, region.title || ''),
      el('p', {}, region.text || ''),
      region.rule ? el('div', { class: 'region-choice-rule' },
        el('b', {}, region.rule.name),
        el('span', {}, region.rule.text),
      ) : null,
    ),
  );
}

export function renderRegion({ app, root, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('tavern'); return; }
  const act = run.pendingAct;
  if (!act) { app.goto('map'); return; }
  const options = regionsOf(act);
  let picked = options[0]?.id;
  let active = true;
  let departing = false;
  onDispose?.(() => { active = false; });

  root.classList.add('region-screen');
  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap region-transition' });
  const choices = el('div', { class: 'region-choices' });
  const detail = el('div', { class: 'region-departure' });
  scroll.append(wrap);
  root.append(scroll);
  wrap.append(
    el('header', { class: 'level-section-head' },
      el('span', { class: 'region-eyebrow' }, `已通过第 ${run.act} 幕`),
      el('h1', {}, `第 ${act} 幕 · 选择下一段航路`),
      el('div', { class: 'route-status' },
        el('span', {}, `生命 ${run.hp}/${run.maxHp}`),
        el('span', {}, `牌组 ${run.deck.length} 张`),
        el('span', {}, `金币 ${run.gold}`),
      ),
    ),
    choices,
    detail,
  );

  function renderChoices() {
    clear(choices);
    clear(detail);
    choices.append(...options.map((region) => regionChoice(region, region.id === picked, (id) => {
      if (!active || departing || app.run !== run || run.pendingAct !== act) return;
      picked = id;
      renderChoices();
    })));
    const region = options.find((entry) => entry.id === picked);
    if (!region) {
      detail.append(el('p', { class: 'hint' }, '当前航路暂不可通行。'));
      return;
    }
    detail.append(el('button', {
      class: 'btn primary xl region-enter',
      dataset: { regionId: picked },
      onclick: () => {
        if (!active || departing || app.run !== run || run.pendingAct !== act) return;
        departing = true;
        app.continueToAct(picked);
      },
    }, `进入 ${region.name} →`));
  }

  renderChoices();
}
