import { el, clear } from '../../core/utils.js';
import { panel, toast, statBox } from '../fx.js';
import { cardEl, relicChipEl } from '../components.js';
import { ALL_CHARACTERS, relic as relicDef, card as cardDef } from '../../data/index.js';
import { regionsOf } from '../../data/regions.js';
import { bonuses, isFinalNight } from '../../systems/meta.js';
import { regionChoice } from './region.js';

function travelerArt(character) {
  return character.portrait
    ? el('img', { class: 'traveler-portrait', src: character.portrait, alt: character.name })
    : el('span', {}, character.glyph);
}

export function renderSelect({ app, root, onDispose }) {
  const meta = app.meta;
  const b = bonuses(meta);
  let picked = meta.lastCharacter || ALL_CHARACTERS.find((c) => !c.unlock?.embers)?.id;
  const regions = regionsOf(Math.min(6, meta.night));
  let pickedRegion = regions[0]?.id;
  let active = true;
  let departing = false;
  onDispose?.(() => { active = false; });

  const wrap = el('div', { class: 'wrap' });
  const head = el('div', {});
  const regionWrap = el('section', { class: 'select-regions' });
  const listWrap = el('div', {});
  const detail = el('div', {});
  const departure = el('footer', { class: 'select-departure' });
  wrap.append(regionWrap, el('h2', { class: 'traveler-selection-title' }, '出发旅者'), listWrap, detail);
  root.classList.add('select-screen');
  root.append(head);
  root.append(el('div', { class: 'scroll' }, wrap));
  root.append(departure);

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
    const row = el('div', { class: 'choice-row traveler-choices' });
    for (const c of ALL_CHARACTERS) {
      const ok = unlocked(c);
      const locked = !ok;
      row.append(el('button', {
        class: `choice ${picked === c.id ? 'picked' : ''} ${locked ? 'disabled' : ''}`,
        'aria-pressed': String(picked === c.id),
        dataset: { characterId: c.id },
        onclick: () => {
          if (!active || departing) return;
          if (locked) { toast('该旅者尚未在名录中解锁', 'bad'); return; }
          picked = c.id;
          meta.lastCharacter = c.id;
          app.save();
          renderAll();
        },
      },
        el('div', { class: 'traveler-art', style: { fontSize: '40px', textAlign: 'center', filter: locked ? 'grayscale(1)' : '' } }, travelerArt(c)),
        el('div', { class: 'nm', style: { textAlign: 'center', fontSize: '18px' } }, c.name),
        el('div', { class: 'hint traveler-title', style: { textAlign: 'center' } }, c.title),
        el('div', { class: 'ds', style: { textAlign: 'center', marginTop: '6px' } },
          `生命 ${c.hp} · 金币 ${c.gold}`),
        locked ? el('div', { class: 'req', style: { textAlign: 'center' } }, `名录未解锁（✦ ${c.unlock.embers}）`) : null,
      ));
    }
    listWrap.append(row);
  }

  function renderRegions() {
    clear(regionWrap);
    regionWrap.append(
      el('h2', {}, `第 ${Math.min(6, meta.night)} 幕 · 出发航路`),
      el('div', { class: 'region-choices' }, regions.map((region) =>
        regionChoice(region, region.id === pickedRegion, (id) => {
          if (!active || departing) return;
          pickedRegion = id;
          renderRegions();
          renderDetail();
        }))),
    );
  }

  function renderDetail() {
    clear(detail);
    clear(departure);
    const c = ALL_CHARACTERS.find((x) => x.id === picked);
    if (!c) return;
    const ok = unlocked(c);
    if (!ok) return;

    const deck = (c.deck || []).map((id) => cardDef(id)).filter(Boolean);
    const baseHp = c.hp + b.maxHp;
    const baseGold = c.gold + b.gold;
    const relic = relicDef(c.relic);

    const preparation = panel('出发准备',
      el('div', { style: { textAlign: 'center', marginBottom: '10px' } },
        el('div', { class: 'traveler-art large', style: { fontSize: '44px' } }, travelerArt(c)),
        el('h2', { style: { margin: '4px 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '0' } }, c.name),
        el('div', { class: 'hint' }, c.title),
        el('p', { style: { color: 'var(--fg-dim)', fontStyle: 'italic', maxWidth: '560px', margin: '10px auto 0' } }, c.lore),
      ),

      el('div', { class: 'stat-grid', style: { margin: '14px 0' } },
        statBox(baseHp, '最大生命'),
        statBox(baseGold, '起始金币'),
        statBox(b.potionSlots + 3, '药水栏位'),
        statBox(c.deck.length + b.startCurses + b.startCards, '起始牌数'),
      ),

      el('div', { style: { borderLeft: '3px solid var(--ember)', padding: '6px 0 6px 12px', margin: '12px 0', background: 'rgba(255,107,53,.05)' } },
        el('div', { style: { color: 'var(--ember-2)', fontSize: '12px', marginBottom: '4px' } }, '特性'),
        el('div', { style: { fontSize: '14px', lineHeight: '1.7' } }, c.mechanic),
      ),

      relic ? el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', margin: '12px 0' } },
        relicChipEl(relic),
        el('div', {}, el('b', {}, relic.name), el('div', { class: 'hint' }, relic.desc)),
      ) : null,

      b.startRelics || b.startPotions || b.startCards ? el('div', { class: 'hint', style: { marginTop: '6px' } },
        `装备加成：起始 +${b.startCards} 张稀有卡、+${b.startRelics} 件随机遗物、+${b.startPotions} 瓶药水${b.startCurses ? `、+${b.startCurses} 张通用牌` : ''}。`) : null,
    );
    preparation.classList.add('departure-preparation');
    detail.append(preparation);

    detail.append(el('section', { class: 'departure-deck' },
      el('h3', {}, '起手牌组'),
      el('div', { class: 'card-grid' }, deck.map((d) => cardEl(d, { size: '' }))),
    ));

    const region = regions.find((entry) => entry.id === pickedRegion);
    departure.append(
      el('span', { class: 'departure-label' }, `${c.name} · 第 ${meta.night} 夜`),
      el('button', {
        class: 'btn primary xl expedition-enter',
        disabled: !region,
        dataset: { regionId: pickedRegion, characterId: c.id },
        onclick: () => {
          if (!active || departing || !region || app.meta !== meta || picked !== c.id || pickedRegion !== region.id) return;
          departing = true;
          if (isFinalNight(meta.night)) toast('终夜不可回头。', 'bad');
          app.startExpedition(c.id, { regionId: pickedRegion });
        },
      }, region ? `进入 ${region.name} →` : '航路暂不可通行'),
    );
  }

  function renderAll() { renderHead(); renderRegions(); renderList(); renderDetail(); }
  renderAll();
}
