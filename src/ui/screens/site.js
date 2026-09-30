import { el, clear } from '../../core/utils.js';
import { modal, toast } from '../fx.js';
import { cardEl } from '../components.js';
import { card as cardDef } from '../../data/index.js';
import { regionById } from '../../data/regions.js';
import { siteDef } from '../../data/sites.js';
import { cardDisplay } from '../../core/run.js';
import { findNode } from '../../systems/map.js';
import { siteState, siteChoices, chooseSite } from '../../systems/sites.js';
import { regionBanner } from './region.js';

export function renderSite({ app, root, params = {}, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('tavern'); return; }
  const nodeId = params.nodeId || run.map.currentId;
  const node = findNode(run.map, nodeId);
  const definition = node && siteDef(node.type);
  const state = node && siteState(run, node);
  if (!node || !definition || !state || run.map.currentId !== nodeId) { app.goto('map'); return; }
  let active = true;
  let busy = false;
  onDispose?.(() => { active = false; });
  const canAct = () => active && !busy && app.run === run && run.map.currentId === nodeId;

  root.classList.add('site-screen');
  let hud = app.hud();
  root.append(hud);
  root.append(regionBanner(regionById(run.map.regionId || run.regionId), {
    compact: true, kicker: `第 ${run.act} 幕 · ${definition.name}`,
  }));
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap-narrow site-content' });
  scroll.append(wrap);
  root.append(scroll);

  function renderContent() {
    clear(wrap);
    wrap.append(el('header', { class: 'site-intro' },
      el('span', { class: 'region-eyebrow', style: { color: definition.color } }, `${definition.glyph} · 第 ${node.row + 1} 层`),
      el('h1', {}, definition.name),
      el('p', {}, definition.text),
    ));
    if (state.result?.text) {
      wrap.append(el('section', { class: 'site-result' },
        el('h2', {}, state.battle?.phase === 'between' ? '第一轮已完成' : state.resolved ? '此处已结算' : '守卫已经就位'),
        el('p', {}, state.result.text),
      ));
    }

    if (state.resolved) {
      wrap.append(el('div', { class: 'site-result-actions' }, el('button', {
        class: 'btn primary site-continue',
        onclick: () => {
          if (!canAct()) return;
          busy = true;
          app.afterNode();
        },
      }, '继续深入 →')));
      return;
    }

    const choices = siteChoices(run, node);
    if (choices.length) {
      wrap.append(el('div', { class: 'site-choices' }, choices.map((choice) =>
        el('button', {
          class: 'site-choice', disabled: choice.disabled,
          dataset: { choiceId: choice.id, action: choice.action },
          onclick: () => {
            if (!canAct() || state.resolved) return;
            if (choice.action === 'upgrade' || choice.action === 'remove') pickCard(choice);
            else commitChoice(choice.id);
          },
        },
          el('b', {}, choice.name),
          el('p', {}, choice.text),
          choice.disabled && choice.reason ? el('span', { class: 'site-reason' }, choice.reason) : null,
        ))));
    } else if (state.battle?.phase === 'fighting') {
      wrap.append(el('div', { class: 'site-result-actions' }, el('button', {
        class: 'btn primary site-battle-resume',
        onclick: () => {
          if (!canAct()) return;
          busy = true;
          app.beginSiteBattle();
        },
      }, '进入守卫战 →')));
    }
  }

  function commitChoice(id, opts = {}) {
    if (!canAct() || state.resolved) return false;
    busy = true;
    const result = chooseSite(run, node, id, opts);
    if (!result.ok) {
      busy = false;
      toast(result.why || '这项选择已失效', 'bad');
      return false;
    }
    app.save();
    if (result.kind === 'battle') app.beginSiteBattle();
    else if (result.kind === 'reward') app.goto('reward', { step: result.rewardStep, from: 'site', nodeId });
    else {
      busy = false;
      const nextHud = app.hud();
      hud.replaceWith(nextHud);
      hud = nextHud;
      renderContent();
    }
    return true;
  }

  function pickCard(choice) {
    if (!canAct()) return;
    const grid = el('div', { class: 'card-grid site-card-picker' });
    const upgrade = choice.action === 'upgrade';
    let closed = false;
    let picked = false;
    let close = () => {};
    for (const instance of run.deck) {
      if (upgrade && (instance.upgraded || !cardDef(instance.id)?.upgrade)) continue;
      const definition = cardDisplay(run, instance);
      if (!definition) continue;
      grid.append(cardEl(definition, { onClick: () => {
        if (closed || picked || !canAct()) return;
        if (!run.deck.some((entry) => entry.uid === instance.uid)) {
          toast('这张牌已不在牌组中', 'bad');
          return;
        }
        if (!commitChoice(choice.id, { cardUid: instance.uid })) return;
        picked = true;
        close();
      } }));
    }
    if (!grid.children.length) { toast(upgrade ? '没有可升级的牌' : '牌组中没有可移除的牌', 'bad'); return; }
    close = modal({
      title: upgrade ? '选择要升级的牌' : '选择要移除的牌',
      sub: upgrade ? '永久升级，本次远征保留。' : '支付 35 金币，永久移除。',
      body: grid, wide: true,
      actions: [{ label: '取消', kind: 'ghost' }],
      onClose: () => { closed = true; },
    });
  }

  renderContent();
}
