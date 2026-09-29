import { el, clear } from '../../core/utils.js';
import { panel, statBox, toast, modal, confirmDialog, sectionTitle } from '../fx.js';
import { heartsEl } from '../components.js';
import {
  FACILITIES, STAFF, UPGRADES, NIGHT_NAMES,
} from '../../data/facilities.js';
import {
  bonuses, nightlyIncome, facilityCost, upgradeFacility, hireStaff, dismissStaff,
  upgradeCost, buyUpgrade, facilityDesc, nightFlavor, isFinalNight, MAX_NIGHT,
  tideDamage, newMeta,
} from '../../systems/meta.js';
import { ALL_CHARACTERS, ALL_CARDS, ALL_RELICS, RARITY_LABEL } from '../../data/index.js';
import { cardEl } from '../components.js';

const TABS = [
  { id: 'home', label: '账 房' },
  { id: 'facility', label: '设 施' },
  { id: 'staff', label: '人 手' },
  { id: 'upgrade', label: '装 备' },
  { id: 'codex', label: '图 鉴' },
  { id: 'record', label: '记 录' },
];

export function renderTavern({ app, root, params }) {
  const meta = app.meta;
  let tab = 'home';

  const header = el('div', {});
  const tabsBar = el('div', { class: 'hud', style: { gap: '6px', padding: '7px 14px' } });
  const body = el('div', { class: 'scroll' });
  const wrap = el('div', { style: { display: 'contents' } });
  wrap.append(header, tabsBar, body);
  root.append(wrap);

  function renderHeader() {
    clear(header);
    const b = bonuses(meta);
    const inc = nightlyIncome(meta);
    header.append(el('div', { class: 'hud' },
      el('div', { class: 'hud-brand' }, '锈锚酒馆'),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '第'), el('span', { class: 'v' }, `${meta.night}`), el('span', { class: 'k' }, '夜'), el('span', { class: 'k' }, '/'), el('span', { class: 'v' }, String(MAX_NIGHT))),
      el('div', { class: 'hud-stat' }, heartsEl(meta)),
      el('div', { class: 'hud-sep' }),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '💰'), el('span', { class: 'v gold-text' }, String(meta.gold))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '✦ 印记'), el('span', { class: 'v', style: { color: '#b197fc' } }, String(meta.embers))),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '📈'), el('span', { class: 'v good-text' }, `${inc.net >= 0 ? '+' : ''}${inc.net}`), el('span', { class: 'k' }, '/夜')),
      el('div', { class: 'hud-spacer' }),
      el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '远征'), el('span', { class: 'v' }, String(meta.stats.runs)), el('span', { class: 'k' }, '胜'), el('span', { class: 'v' }, String(meta.stats.wins))),
    ));
  }

  function renderTabs() {
    clear(tabsBar);
    for (const t of TABS) {
      tabsBar.append(el('button', {
        class: `btn sm ${tab === t.id ? 'primary' : 'ghost'}`,
        onclick: () => { tab = t.id; renderAll(); },
      }, t.label));
    }
  }

  function renderAll() { renderHeader(); renderTabs(); renderBody(); }

  function renderBody() {
    clear(body);
    const w = el('div', { class: 'wrap' });
    body.append(w);

    if (params.crowned) {
      w.append(panel('守夜结束',
        el('div', { style: { textAlign: 'center', lineHeight: '2' } },
          el('div', { class: 'big-glyph' }, '🌅'),
          el('h3', { style: { letterSpacing: '6px', color: 'var(--gold)' } }, '潮 退 了'),
          el('p', { style: { color: 'var(--fg-dim)' } }, '执政官沉回海底。锈锚酒馆的灯还亮着——有人会记住这个名字。'),
          el('div', { class: 'stat-grid', style: { marginTop: '16px' } },
            statBox(meta.stats.wins, '远征成功'),
            statBox(meta.stats.totalKills, '累计击杀'),
            statBox(meta.stats.totalGold, '累计金币'),
            statBox(meta.embers, '剩余印记'),
          ),
        ),
      ));
    }

    if (params.nightJustPassed) {
      const s = app.lastSettle;
      if (s) {
        w.append(el('div', { class: 'panel', style: { marginBottom: '14px', borderColor: 'rgba(229,165,10,.4)' } },
          el('div', { style: { textAlign: 'center', lineHeight: '1.9' } },
            el('div', { style: { color: 'var(--sulfur)', letterSpacing: '2px' } }, `上一夜结算：收入 ${s.income.net >= 0 ? '+' : ''}${s.income.net} 金币（毛 ${s.income.total} − 工资 ${s.income.wages}）`),
            s.tide > 0
              ? el('div', { class: 'danger-text' }, `潮水上涌，灯火黯淡了 ${s.tide} 盏。当前灯芯 ${meta.hearts}/${meta.maxHearts}。`)
              : el('div', { class: 'good-text' }, '灯塔守住了这一夜，灯芯无损。'),
          ),
        ));
      }
    }

    if (params.gameOver) {
      w.append(panel('守夜终结',
        el('div', { style: { textAlign: 'center' } },
          el('div', { class: 'big-glyph' }, '🕯️'),
          el('p', { style: { color: 'var(--fg-dim)', fontSize: '15px' } }, '最后一盏灯灭了。锈锚酒馆沉进灰烬。'),
          el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '16px' } },
            el('button', { class: 'btn primary', onclick: () => { app.meta = newMeta(); app.goto('title'); } }, '重新点灯'),
          ),
        ),
      ));
      return;
    }

    if (tab === 'home') renderHome(w);
    else if (tab === 'facility') renderFacility(w);
    else if (tab === 'staff') renderStaff(w);
    else if (tab === 'upgrade') renderUpgrade(w);
    else if (tab === 'codex') renderCodex(w);
    else if (tab === 'record') renderRecord(w);
  }

  // ---------- 账房 ----------
  function renderHome(w) {
    const b = bonuses(meta);
    const inc = nightlyIncome(meta);
    const tide = tideDamage(meta);
    const final = isFinalNight(meta.night);

    w.append(el('div', { class: 'tavern-hero' },
      el('div', { style: { fontSize: '13px', letterSpacing: '5px', color: 'var(--ember-2)' } }, NIGHT_NAMES[Math.min(meta.night - 1, NIGHT_NAMES.length - 1)]),
      el('p', { style: { color: 'var(--fg-dim)', maxWidth: '620px', margin: '8px auto 0' }, text: nightFlavor(meta.night) }),
    ));

    w.append(panel('今夜盘算',
      el('div', { class: 'stat-grid' },
        statBox(inc.total, '毛收入'),
        statBox(inc.wages, '员工工资'),
        statBox(inc.net, '净收入'),
        statBox(meta.facilities.bar || 0, '吧台等级'),
        statBox(meta.staff.length, '雇员'),
      ),
      el('div', { class: 'divider' }),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px' } },
        eff('远征加成', [
          bonusLine('最大生命', b.maxHp, `${b.maxHp > 0 ? '+' : ''}${b.maxHp}`),
          bonusLine('起始金币', b.gold, `+${b.gold}`),
          bonusLine('攻击伤害', b.damagePlus, `+${b.damagePlus}`),
          bonusLine('药水栏位', b.potionSlots, `+${b.potionSlots}`),
          bonusLine('卡牌奖励', b.cardChoice, `+${b.cardChoice}`),
          bonusLine('遗物候选', b.relicChoice, `+${b.relicChoice}`),
          bonusLine('商店折扣', b.shopDiscount, `-${Math.round(b.shopDiscount * 100)}%`),
          bonusLine('地图揭示', b.mapReveal, `+${b.mapReveal} 行`),
        ]),
        eff('风险与代价', [
          bonusLine('本夜潮汐伤害', tide, `-${tide} 灯芯`, tide > 0),
          bonusLine('失败保留金币', b.keepGold, `${Math.round(b.keepGold * 100)}%`),
          bonusLine('远征后回复', b.runEndHealPct, `${Math.round(b.runEndHealPct * 100)}%`),
          bonusLine('酒馆收入加成', b.incomePct, `+${Math.round(b.incomePct * 100)}%`, false, `${b.incomeFlat} 基础`),
        ]),
      ),
      el('div', { class: 'divider' }),
      el('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' } },
        el('button', {
          class: 'btn primary xl',
          onclick: () => app.goto('select'),
        }, final ? '⚔ 迎战 终夜' : '⚔ 出发远征'),
        el('button', {
          class: 'btn', onclick: async () => {
            const ok = await confirmDialog('闭门经营？',
              `今夜不下地窟。你将获得 ${inc.net} 金币收入，但潮水会上涨，损失 ${tide} 盏灯芯。之后夜数 +1。`,
              '开门迎客', 'primary');
            if (!ok) return;
            app.advanceNight();
          },
        }, `闭门经营（+${inc.net} 金币）`),
      ),
      el('div', { class: 'hint', style: { textAlign: 'center', marginTop: '10px' } },
        final ? '终夜只有一次机会——要么赢，要么酒馆沉没。' : `你也可以选择不下地窟。潮水不会因为你不来就退回去。`),
    ));

    if (!meta.flags.tutorialDone) {
      w.append(panel('给新来的老板',
        el('div', { style: { fontSize: '13.5px', lineHeight: '1.9', color: 'var(--fg-dim)' } },
          el('p', { style: { margin: '0 0 8px' } }, '① 每一夜你都可以「闭门经营」赚取被动收入并推进夜数，但潮汐会夺走灯芯。'),
          el('p', { style: { margin: '0 0 8px' } }, '② 也可以「出发远征」——那是一场完整的肉鸽跑图，死了会丢金币、灭一盏灯。'),
          el('p', { style: { margin: '0 0 8px' } }, '③ 灰烬印记来自远征成功后，可在「图鉴」里永久解锁卡牌、遗物与旅者。'),
          el('p', { style: { margin: 0 } }, '④ 灯芯共 3 盏。归零即守夜失败。'),
        ),
        el('div', { class: 'btn-row', style: { marginTop: '12px' } },
          el('button', {
            class: 'btn sm primary', onclick: () => { meta.flags.tutorialDone = true; app.save(); renderAll(); toast('已记下', 'good'); },
          }, '我知道了'),
        ),
      ));
    }
  }

  function eff(title, lines) {
    return el('div', {},
      el('div', { style: { color: 'var(--sulfur)', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' } }, title),
      ...lines,
    );
  }
  function bonusLine(k, v, text, danger = false, sub = '') {
    return el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', borderBottom: '1px dashed rgba(255,255,255,.06)' } },
      el('span', { style: { color: 'var(--fg-dim)' } }, k, sub ? el('span', { class: 'hint' }, ` (${sub})`) : null),
      el('span', { class: 'mono', style: { color: danger ? '#ff8a8a' : v ? 'var(--ember-2)' : 'var(--fg-mute)' } }, text),
    );
  }

  // ---------- 设施 ----------
  function renderFacility(w) {
    w.append(sectionTitle('酒 馆 设 施', '每晚自动产生收入，永久生效'));
    const grid = el('div', { class: 'tavern-grid' });
    const list = el('div', { style: { display: 'grid', gap: '8px' } });
    for (const f of FACILITIES) {
      const lv = meta.facilities[f.id] || 0;
      const cost = facilityCost(meta, f.id);
      const maxed = lv >= f.max;
      list.append(el('div', { class: `facility-row ${maxed ? 'maxed' : ''}` },
        el('div', { class: 'icon', text: f.glyph }),
        el('div', { style: { flex: 1, minWidth: 0 } },
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            el('b', {}, f.name),
            el('span', { class: 'lv-badge' }, `Lv.${lv}/${f.max}`),
            lv > 0 ? el('span', { class: 'hint' }, `每晚 +${f.income[lv] || 0}`) : null,
          ),
          el('div', { class: 'hint', style: { lineHeight: 1.45 } }, maxed ? f.desc : facilityDesc(f, Math.max(1, lv + 1))),
        ),
        el('button', {
          class: `btn sm ${maxed ? 'ghost' : 'gold'}`,
          disabled: maxed || meta.gold < cost,
          onclick: () => {
            if (upgradeFacility(meta, f.id)) {
              app.save();
              toast(`${f.name} 升至 Lv.${(meta.facilities[f.id] || 0)}`, 'good');
              renderAll();
            }
          },
        }, maxed ? '已满级' : `💰 ${cost}`),
      ));
    }
    grid.append(panel('修缮与扩建', list));
    w.append(grid);
  }

  // ---------- 员工 ----------
  function renderStaff(w) {
    w.append(sectionTitle('酒 馆 人 手', '长期雇佣，工资每晚结算，提供永久加成'));
    const grid = el('div', { class: 'tavern-grid' });
    const list = el('div', { style: { display: 'grid', gap: '10px' } });
    for (const s of STAFF) {
      const hired = meta.staff.includes(s.id);
      list.append(el('div', { class: `staff-card ${hired ? 'hired' : ''}` },
        el('div', { class: 'av', text: s.glyph }),
        el('div', { style: { flex: 1, minWidth: 0 } },
          el('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline' } },
            el('b', {}, s.name),
            el('span', { class: 'ttl' }, s.title),
            el('span', { class: 'hint mono' }, `工资 ${s.wage}/夜`),
          ),
          el('div', { style: { fontSize: '12.5px', color: 'var(--fg-dim)', margin: '3px 0' } }, s.desc),
          el('div', { class: 'lore' }, s.lore),
        ),
        el('button', {
          class: `btn sm ${hired ? 'ghost' : 'gold'}`,
          disabled: !hired && meta.gold < s.cost,
          onclick: async () => {
            if (hired) {
              const ok = await confirmDialog(`辞退 ${s.name}？`, '会返还 40% 的雇佣金。', '辞退', 'danger');
              if (!ok) return;
              dismissStaff(meta, s.id);
              toast(`${s.name} 走了`, 'bad');
            } else {
              if (hireStaff(meta, s.id)) toast(`${s.name} 入职`, 'good');
              else return;
            }
            app.save();
            renderAll();
          },
        }, hired ? '辞退' : `💰 ${s.cost}`),
      ));
    }
    grid.append(panel('招募', list));
    w.append(grid);
  }

  // ---------- 升级 ----------
  function renderUpgrade(w) {
    w.append(sectionTitle('远 征 装 备', '永久生效，影响每一次远征的开局'));
    const grid = el('div', { class: 'tavern-grid' });
    const list = el('div', { style: { display: 'grid', gap: '8px' } });
    for (const u of UPGRADES) {
      const lv = meta.upgrades[u.id] || 0;
      const cost = upgradeCost(meta, u.id);
      const maxed = lv >= (u.max || 1);
      list.append(el('div', { class: `facility-row ${maxed ? 'maxed' : ''}` },
        el('div', { class: 'icon', text: u.glyph }),
        el('div', { style: { flex: 1 } },
          el('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline' } },
            el('b', {}, u.name),
            el('span', { class: 'lv-badge' }, `Lv.${lv}/${u.max || 1}`),
          ),
          el('div', { class: 'hint' }, u.desc.replace('{v}', String((u.v || 1) * lv))),
        ),
        el('button', {
          class: `btn sm ${maxed ? 'ghost' : 'gold'}`,
          disabled: maxed || meta.gold < cost,
          onclick: () => {
            if (buyUpgrade(meta, u.id)) { app.save(); toast(`${u.name} 升级`, 'good'); renderAll(); }
          },
        }, maxed ? '已满级' : `💰 ${cost}`),
      ));
    }
    grid.append(panel('储备', list));
    w.append(grid);
  }

  // ---------- 图鉴 ----------
  function renderCodex(w) {
    let kind = 'cards';
    const holder = el('div', {});

    function renderInner() {
      clear(holder);
      const groups = {
        cards: {
          title: '卡 牌 图 鉴', cost: 2,
          items: ALL_CARDS.filter((c) => c.unlock?.embers && c.rarity !== 'curse'),
        },
        relics: {
          title: '遗 物 图 鉴', cost: 3,
          items: ALL_RELICS.filter((r) => r.unlock?.embers),
        },
        characters: {
          title: '旅 者 名 录', cost: 4,
          items: ALL_CHARACTERS.filter((c) => c.unlock?.embers),
        },
      };
      const g = groups[kind];
      holder.append(panel(g.title,
        el('div', { class: 'hint', style: { marginBottom: '12px' } }, `用远征累积的「灰烬印记」永久解锁。当前持有 ${meta.embers} ✦`),
        el('div', { class: 'card-grid' },
          g.items.map((it) => {
            const unlocked = meta.unlocks[kind].has(it.id);
            const cost = it.unlock.embers;
            const def = kind === 'characters' ? { ...it, type: 'power', art: it.glyph, text: it.mechanic, rarity: 'rare' } : it;
            const box = el('div', { style: { position: 'relative' } },
              cardEl(def, { count: null, disabled: !unlocked, size: '' }),
            );
            const btn = el('button', {
              class: `btn sm ${unlocked ? 'ghost' : 'gold'}`,
              style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', zIndex: 6 },
              disabled: unlocked || meta.embers < cost,
              onclick: () => {
                if (meta.embers < cost) { toast('印记不足', 'bad'); return; }
                meta.embers -= cost;
                meta.unlocks[kind].add(it.id);
                app.save();
                toast(`已解锁 ${it.name}`, 'gold');
                renderAll();
              },
            }, unlocked ? '已解锁' : `✦ ${cost}`);
            box.append(btn);
            return box;
          }),
        ),
      ));
    }

    const tabRow = el('div', { class: 'btn-row', style: { justifyContent: 'center', marginBottom: '14px' } },
      ...[['cards', '卡牌'], ['relics', '遗物'], ['characters', '旅者']].map(([k, label]) =>
        el('button', {
          class: `btn sm ${kind === k ? 'primary' : 'ghost'}`,
          onclick: () => { kind = k; renderInner(); for (const b of tabRow.children) b.className = 'btn sm ghost'; tabRow.children[['cards', 'relics', 'characters'].indexOf(k)].className = 'btn sm primary'; },
        }, label),
      ),
    );
    w.append(tabRow);
    w.append(holder);
    renderInner();
  }

  // ---------- 记录 ----------
  function renderRecord(w) {
    const h = meta.history;
    w.append(panel('守夜记录',
      el('div', { class: 'stat-grid', style: { marginBottom: '14px' } },
        statBox(meta.stats.runs, '远征次数'),
        statBox(meta.stats.wins, '成功'),
        statBox(meta.stats.deaths, '失败'),
        statBox(meta.stats.totalKills, '击杀'),
        statBox(meta.stats.bossKills, '首领'),
        statBox(meta.stats.cardsPlayed, '出牌'),
      ),
      !h.length ? el('div', { class: 'hint' }, '还没有远征记录。') :
        el('div', { style: { display: 'grid', gap: '6px', maxHeight: '46vh', overflowY: 'auto' } },
          h.map((x) => el('div', {
            class: 'shop-item',
            style: { padding: '8px 11px' },
          },
            el('div', { class: 'icon', text: x.victory ? '🏆' : '💀' }),
            el('div', { class: 'body' },
              el('div', { class: 'nm' }, `第 ${x.night} 夜 · ${x.character || '—'}`),
              el('div', { class: 'ds' }, `推进到第 ${x.floor} 幕 · 击杀 ${x.kills} · 剩余生命 ${x.hp} · 牌组 ${x.deck} 张`),
            ),
            el('div', { class: 'pr' }, `+${x.gold}`),
          )),
        ),
    ));
  }

  renderAll();
}
