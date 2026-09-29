import { el, clear } from '../../core/utils.js';
import { cardEl, instCardEl } from '../components.js';
import { deckSummary, deckStats } from '../../core/run.js';
import { relic as relicDef } from '../../data/index.js';

export function openDeckViewer(app) {
  const run = app.run;
  if (!run) return;
  const root = app.root;
  let mode = 'group';

  const overlay = el('div', { class: 'deck-viewer' });
  const head = el('div', { class: 'hud', style: { borderRadius: '0' } });
  const body = el('div', { class: 'scroll wrap' });
  overlay.append(head, body);
  root.append(overlay);

  function render() {
    clear(head); clear(body);
    const list = deckSummary(run);
    const stats = deckStats(run);

    head.append(
      el('div', { class: 'hud-brand' }, '牌 组'),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '总张数'), el('span', { class: 'v' }, String(stats.total))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '攻击'), el('span', { class: 'v', style: { color: '#ff8787' } }, String(stats.attack))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '技能'), el('span', { class: 'v', style: { color: '#91d5ff' } }, String(stats.skill))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '力量'), el('span', { class: 'v', style: { color: '#d0bfff' } }, String(stats.power))),
      stats.curse ? el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '诅咒'), el('span', { class: 'v', style: { color: '#c77dff' } }, String(stats.curse))) : null,
      el('div', { class: 'hud-spacer' }),
      el('div', { class: 'btn-row' },
        el('button', {
          class: `btn sm ${mode === 'group' ? 'primary' : 'ghost'}`,
          onclick: () => { mode = 'group'; render(); },
        }, '按类型'),
        el('button', {
          class: `btn sm ${mode === 'list' ? 'primary' : 'ghost'}`,
          onclick: () => { mode = 'list'; render(); },
        }, '按张数'),
        el('button', { class: 'btn sm ghost', onclick: () => overlay.remove() }, '关闭 (Esc)'),
      ),
    );

    if (mode === 'group') {
      const order = ['attack', 'skill', 'power', 'curse'];
      for (const t of order) {
        const items = list.filter((x) => x.def.type === t);
        if (!items.length) continue;
        body.append(el('h4', {
          style: {
            margin: '20px 0 12px', color: 'var(--ember-2)', letterSpacing: '3px',
            borderBottom: '1px solid var(--line)', paddingBottom: '6px',
          },
        }, ({ attack: '攻 击', skill: '技 能', power: '力 量', curse: '诅 咒' })[t], ` · ${items.reduce((a, b) => a + b.count, 0)} 张`));
        body.append(el('div', { class: 'card-grid' },
          items.map((x) => cardEl(x.def, { count: x.count, size: '' })),
        ));
      }
    } else {
      body.append(el('div', { class: 'card-grid', style: { marginTop: '18px' } },
        run.deck.map((inst) => instCardEl(run, inst, { size: '' })),
      ));
    }

    if (run.relics.length) {
      body.append(el('h4', { style: { margin: '26px 0 10px', color: 'var(--ember-2)', letterSpacing: '3px', borderBottom: '1px solid var(--line)', paddingBottom: '6px' } }, '遗 物'));
      const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '10px' } });
      for (const id of run.relics) {
        const d = relicDef(id);
        if (!d) continue;
        grid.append(el('div', { class: 'shop-item' },
          el('div', { class: 'icon', text: d.glyph || '🔩' }),
          el('div', { class: 'body' }, el('div', { class: 'nm' }, d.name), el('div', { class: 'ds' }, d.desc)),
        ));
      }
      body.append(grid);
    }
  }

  render();
  const off = (e) => { if (e.key === 'Escape') { overlay.remove(); window.removeEventListener('keydown', off); } };
  window.addEventListener('keydown', off);
}
