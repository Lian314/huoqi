import { el, clear } from '../../core/utils.js';
import { panel, statBox, toast, sectionTitle } from '../fx.js';
import { MAX_NIGHT, isFinalNight, nightName } from '../../systems/meta.js';

export function renderSummary({ app, root, params }) {
  const meta = app.meta;
  const r = params.result || meta.pendingResult;

  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap-narrow' });
  scroll.append(wrap);
  root.append(scroll);

  if (params.gameOver || meta.ending === 'lost' || (!r && meta.hearts <= 0)) {
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '26px 0' } },
        el('div', { class: 'big-glyph' }, '🕯️'),
        el('h1', { class: 'title-xl', style: { fontSize: '32px' } }, '灯 灭 了'),
        el('p', { class: 'subtitle' }, '锈 锚 酒 馆 沉 入 灰 烬'),
      ),
      panel('最后的账本',
        el('div', { class: 'stat-grid' },
          statBox(meta.stats.runs, '远征'),
          statBox(meta.stats.wins, '成功'),
          statBox(meta.stats.bestNight, '最远夜数'),
          statBox(meta.stats.totalKills, '总击杀'),
        ),
      ),
      el('div', { style: { textAlign: 'center', margin: '20px 0 40px' } },
        el('button', { class: 'btn primary xl', onclick: () => app.goto('tavern', { gameOver: true }) }, '回到码头'),
      ),
    );
    return;
  }

  if (!r) {
    wrap.append(el('div', { style: { textAlign: 'center', padding: '40px 0' } },
      el('button', { class: 'btn primary', onclick: () => app.goto('tavern') }, '返回酒馆'),
    ));
    return;
  }

  const victory = r.victory;
  const finalNight = isFinalNight(meta.night);

  wrap.append(
    el('div', { style: { textAlign: 'center', padding: '18px 0 6px' } },
      el('div', { class: 'big-glyph' }, victory ? (finalNight ? '🌅' : '🏆') : '💀'),
      el('h1', { class: 'title-xl', style: { fontSize: '32px' } }, victory ? (finalNight ? '潮 退 了' : '归 来') : '折 损'),
      el('p', { class: 'subtitle' }, nightName(meta.night)),
    ),
  );

  wrap.append(panel(victory ? '远征报告' : '败退报告',
    el('p', { style: { fontSize: '15px', lineHeight: 2, textAlign: 'center', margin: '0 0 14px' }, text: r.reason }),
    el('div', { class: 'stat-grid' },
      statBox(r.floor, '推进到第几幕'),
      statBox(r.kills, '击杀'),
      statBox(r.elites || 0, '精英'),
      statBox(r.bosses || 0, '首领'),
      statBox(r.hpLeft, '剩余生命'),
      statBox(r.deckSize, '牌组张数'),
      statBox(r.damageDealt ?? 0, '造成伤害'),
      statBox(r.damageTaken ?? 0, '承受伤害'),
      statBox(r.turns ?? 0, '战斗回合'),
      statBox(r.potionsUsed ?? 0, '使用药水'),
      statBox(r.goldEarned, '本局收入'),
      statBox(r.keptGold != null ? r.keptGold : 0, '带回金币'),
    ),
    el('div', { class: 'divider' }),
    el('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' } },
      el('div', { style: { textAlign: 'center' } },
        el('div', { style: { color: '#b197fc', fontSize: '12px', letterSpacing: '2px' } }, '灰烬印记'),
        el('div', { class: 'mono', style: { fontSize: '30px', fontWeight: 800, color: '#b197fc' } }, `+${r.embers}`),
      ),
      victory ? null : el('div', { style: { textAlign: 'center' } },
        el('div', { style: { color: '#ff8a8a', fontSize: '12px', letterSpacing: '2px' } }, '熄灭的灯'),
        el('div', { class: 'mono', style: { fontSize: '30px', fontWeight: 800, color: '#ff8a8a' } }, '-1'),
      ),
    ),
    r.lostGold ? el('div', { class: 'hint', style: { textAlign: 'center', marginTop: '10px' } }, `撤退途中遗失了 ${r.lostGold} 金币。`) : null,
  ));

  if (r.healPct > 0 && victory) {
    wrap.append(el('div', { class: 'hint', style: { textAlign: 'center' } }, '医师莫尔替你处理了伤口。'));
  }
  if (r.regions?.length) wrap.append(el('section', { class: 'region-report' },
    el('h3', {}, '走过的区域'),
    el('p', {}, r.regions.map((entry) => entry.name || `第 ${entry.act} 幕`).join(' · ')),
    el('div', { class: 'stat-grid' }, statBox(r.sitesVisited || 0, '特殊地点'),
      statBox(r.trialsCleared || 0, '完成试炼'), statBox(r.vaultsOpened || 0, '打开密库')),
  ));
  if (r.commission) {
    const commission = r.commission;
    wrap.append(el('section', { class: 'commission-report' },
      el('h3', {}, commission.name),
      el('div', { class: commission.success ? 'good-text' : 'hint' }, commission.reason),
      el('ul', { class: 'commission-goals' }, (commission.goals || []).map((goal) =>
        el('li', {}, `${goal.label} ${goal.value}/${goal.target}${goal.metric === 'hpPercent' ? '%' : ''}`))),
      commission.success ? el('div', { class: 'commission-payout' },
        `+${commission.gold} 金币 · +${commission.embers} 印记 · +${commission.reputation} 公会声望`) : null,
    ));
  }

  wrap.append(el('div', { style: { textAlign: 'center', margin: '22px 0 44px' } },
    el('button', {
      class: 'btn primary xl',
      onclick: () => app.advanceNight(r),
    }, finalNight ? '回到酒馆' : meta.hearts > 0 ? '进入下一夜' : '灯芯已尽'),
  ));
}
