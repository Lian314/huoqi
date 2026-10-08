import { el } from '../../core/utils.js';
import { modal } from '../fx.js';
import { hasSave, wipeMeta, newMeta, MAX_NIGHT } from '../../systems/meta.js';

export function renderTitle({ app, root }) {
  const enter = () => {
    app.meta.flags.firstRun = false;
    app.save();
    app.resume();
  };
  const wrap = el('div', { class: 'wrap', style: { padding: '40px 0 20px', textAlign: 'center' } });

  wrap.append(el('div', { class: 'title-hero-emblem' }, el('span', { class: 'title-emblem-core' }, '🏮')));
  wrap.append(el('h1', { class: 'title-xl' }, '焰 契'));
  wrap.append(el('p', { class: 'subtitle' }, '锈 锚 酒 馆'));
  wrap.append(el('div', { style: { maxWidth: '620px', margin: '24px auto 0', color: 'var(--fg-dim)', fontSize: '14.5px', lineHeight: '1.9' } },
    el('div', {}, '灰烬潮每隔一夜就涨高一寸。'),
    el('div', {}, '你是锈锚酒馆最后一个老板。'),
    el('div', {}, '经营它、武装它、派它的人下去——再把人带回来。'),
  ));

  const row = el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '34px' } });
  if (hasSave()) {
    row.append(
      el('button', { class: 'btn primary xl', onclick: enter }, '继续守夜'),
      el('button', {
        class: 'btn danger', onclick: async () => {
          const ok = await confirmRestart();
          if (ok) { wipeMeta(); app.meta = newMeta(); app.run = null; app.battle = null; app.runResult = null; app.save(); app.goto('title'); }
        },
      }, '重开守夜'),
    );
  } else {
    row.append(el('button', { class: 'btn primary xl', onclick: enter }, '点亮第一盏灯'));
  }
  row.append(el('button', { class: 'btn ghost', onclick: showHelp }, '玩法说明'));
  wrap.append(row);

  wrap.append(el('div', { class: 'hint', style: { marginTop: '26px' } },
    `一局守夜共 ${MAX_NIGHT} 夜。灯芯只有三根。`));

  root.append(wrap);
  root.append(el('div', { style: { flex: '1' } }));
}

async function confirmRestart() {
  return new Promise((res) => {
    modal({
      title: '重开守夜？',
      sub: '当前的金币、设施、员工、解锁与全部进度都会被抹去。',
      dismissable: true,
      onClose: () => res(false),
      actions: [
        { label: '再想想', kind: 'ghost', onClick: () => res(false) },
        { label: '抹去重来', kind: 'danger', onClick: () => res(true) },
      ],
    });
  });
}

function showHelp() {
  modal({
    title: '玩法说明',
    wide: true,
    body: el('div', { style: { fontSize: '13.5px', lineHeight: '1.85', color: 'var(--fg-dim)' } },
      el('h4', { style: { color: 'var(--ember-2)', margin: '10px 0 4px', letterSpacing: '2px' } }, '一、经营'),
      el('div', {}, '酒馆是跨局保留的。每一夜你可以升级设施（每晚被动收入）、雇佣员工（提升远征中的战斗能力）、购买局外升级、用「灰烬印记」解锁强力卡牌与遗物。夜里去不去地窟由你决定——不去也能赚钱，但潮水不会等人。'),
      el('h4', { style: { color: 'var(--ember-2)', margin: '14px 0 4px', letterSpacing: '2px' } }, '二、远征'),
      el('div', {}, '选一位旅者，组建牌组，进入分支地图。战斗是回合制卡牌对战：每回合 3 点能量、5 张手牌，攻击会消耗敌人格挡。击败敌人后从 3 张牌里选 1 张加入牌组，并获得金币。'),
      el('h4', { style: { color: 'var(--ember-2)', margin: '14px 0 4px', letterSpacing: '2px' } }, '三、状态'),
      el('div', {}, '力量提高攻击伤害，敏捷提高格挡，易伤让你承受更多伤害，中毒与灼烧无视格挡且不衰减，荆棘反弹伤害，金属化/再生/仪式在回合结算时自动生效。神器可以抵消负面状态。'),
      el('h4', { style: { color: 'var(--ember-2)', margin: '14px 0 4px', letterSpacing: '2px' } }, '四、目标'),
      el('div', {}, `撑过 ${MAX_NIGHT} 夜。灯芯（3 根）每损失一次就少一根——远征失败即熄灭一盏。灯芯耗尽，锈锚酒馆沉入灰烬。`),
    ),
    actions: [{ label: '明白了', kind: 'primary' }],
  });
}
