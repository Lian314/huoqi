import { el, clear } from '../../core/utils.js';
import { sectionTitle, panel, toast, statBox } from '../fx.js';
import { cardEl, relicChipEl } from '../components.js';
import { ALL_CHARACTERS, relic as relicDef, card as cardDef } from '../../data/index.js';
import { bonuses, isFinalNight, MAX_NIGHT } from '../../systems/meta.js';
import { deckStats } from '../../core/run.js';

export function renderSelect({ app, root }) {
  const meta = app.meta;
  const b = bonuses(meta);
  let picked = meta.lastCharacter || ALL_CHARACTERS.find((c) => !c.unlock?.embers)?.id;

  const wrap = el('div', { class: 'wrap' });
  const head = el('div', {});
  const listWrap = el('div', {});
  const detail = el('div', {});
  wrap.append(head, listWrap, detail);
  root.append(head);
  root.append(el('div', { class: 'scroll' }, wrap));

  function unlocked(c) {
    return !c.unlock?.embers || meta.unlocks.characters.has(c.id);
  }

  function renderHead() {
    clear(head);
    head.append(el('div', { class: 'hud' },
      el('div', { class: 'hud-brand' }, '选 择 旅 者'),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '第'), el('span', { class: 'v' }, `${meta.night}`), el('span', { class: 'k' }, '夜')),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '💰'), el('span', { class: 'v gold-text' }, String(meta.gold))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '✦'), el('span', { class: 'v', style: { color: '#b197fc' } }, String(meta.embers))),
      el('div', { class: 'hud-spacer' }),
      el('button', { class: 'btn sm ghost', onclick: () => app.goto('tavern') }, '← 回酒馆'),
    ));
  }

  function renderList() {
    clear(listWrap);
    const row = el('div', { class: 'choice-row' });
    for (const c of ALL_CHARACTERS) {
      const ok = unlocked(c);
      const locked = !ok;
      row.append(el('div', {
        class: `choice ${picked === c.id ? 'picked' : ''} ${locked ? 'disabled' : ''}`,
        onclick: () => { if (locked) { toast('该旅者尚未在名录中解锁', 'bad'); return; } picked = c.id; meta.lastCharacter = c.id; app.save(); renderAll(); },
      },
        el('div', { style: { fontSize: '40px', textAlign: 'center', filter: locked ? 'grayscale(1)' : '' } }, c.glyph),
        el('div', { class: 'nm', style: { textAlign: 'center', fontSize: '18px' } }, c.name),
        el('div', { class: 'hint', style: { textAlign: 'center' } }, c.title),
        el('div', { class: 'ds', style: { textAlign: 'center', marginTop: '6px' } },
          `生命 ${c.hp} · 金币 ${c.gold}`),
        locked ? el('div', { class: 'req', style: { textAlign: 'center' } }, `名录未解锁（✦ ${c.unlock.embers}）`) : null,
      ));
    }
    listWrap.append(row);
  }

  function renderDetail() {
    clear(detail);
    const c = ALL_CHARACTERS.find((x) => x.id === picked);
    if (!c) return;
    const ok = unlocked(c);
    if (!ok) return;

    const deck = (c.deck || []).map((id) => cardDef(id)).filter(Boolean);
    const baseHp = c.hp + b.maxHp;
    const baseGold = c.gold + b.gold;
    const relic = relicDef(c.relic);

    detail.append(panel('出发准备',
      el('div', { style: { textAlign: 'center', marginBottom: '10px' } },
        el('div', { style: { fontSize: '44px' } }, c.glyph),
        el('h2', { style: { margin: '4px 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '4px' } }, c.name),
        el('div', { class: 'hint', style: { letterSpacing: '2px' } }, c.title),
        el('p', { style: { color: 'var(--fg-dim)', fontStyle: 'italic', maxWidth: '560px', margin: '10px auto 0' } }, c.lore),
      ),

      el('div', { class: 'stat-grid', style: { margin: '14px 0' } },
        statBox(baseHp, '最大生命'),
        statBox(baseGold, '起始金币'),
        statBox(b.potionSlots + 3, '药水栏位'),
        statBox(c.deck.length + b.startCurses + b.startCards, '起始牌数'),
      ),

      el('div', { style: { borderLeft: '3px solid var(--ember)', padding: '6px 0 6px 12px', margin: '12px 0', background: 'rgba(255,107,53,.05)' } },
        el('div', { style: { color: 'var(--ember-2)', fontSize: '12px', letterSpacing: '2px', marginBottom: '4px' } }, '特性'),
        el('div', { style: { fontSize: '14px', lineHeight: '1.7' } }, c.mechanic),
      ),

      relic ? el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', margin: '12px 0' } },
        relicChipEl(relic),
        el('div', {}, el('b', {}, relic.name), el('div', { class: 'hint' }, relic.desc)),
      ) : null,

      b.startRelics || b.startPotions || b.startCards ? el('div', { class: 'hint', style: { marginTop: '6px' } },
        `装备加成：起始 +${b.startCards} 张稀有卡、+${b.startRelics} 件随机遗物、+${b.startPotions} 瓶药水${b.startCurses ? `、+${b.startCurses} 张通用牌` : ''}。`) : null,
    ));

    detail.append(panel('起手牌组',
      el('div', { class: 'card-grid' }, deck.map((d) => cardEl(d, { size: '' }))),
    ));

    detail.append(el('div', { style: { textAlign: 'center', padding: '18px 0 30px' } },
      el('button', {
        class: 'btn primary xl',
        onclick: () => {
          if (isFinalNight(meta.night)) toast('终夜不可回头。', 'bad');
          app.startExpedition(c.id);
        },
      }, isFinalNight(meta.night) ? '⚔ 进入 终夜' : '↓ 进入 地窟'),
    ));
  }

  function renderAll() { renderHead(); renderList(); renderDetail(); }
  renderAll();
}
