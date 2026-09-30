import { el, clear } from '../../core/utils.js';
import { confirmDialog, toast } from '../fx.js';
import { NODE_KINDS, ACT_CONFIG, reachableNodes, findNode, farthestReachable } from '../../systems/map.js';
import { regionById } from '../../data/regions.js';
import { enemy as enemyDef, eventDef } from '../../data/index.js';
import { siteDef } from '../../data/sites.js';
import { siteChoices } from '../../systems/sites.js';
import { regionBanner } from './region.js';

const ROW_H = 78;
const SITE_KINDS = new Set(['forge', 'shrine', 'supply', 'trial', 'vault', 'waystation']);

export function renderMap({ app, root, params = {}, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('tavern'); return; }
  const map = run.map;
  const region = regionById(map.regionId || run.regionId);
  const cfg = ACT_CONFIG[map.act] || ACT_CONFIG[1];
  const height = (map.grid.length - 1) * ROW_H + 112;
  const current = findNode(map, map.currentId);
  const currentRow = current ? current.row : -1;
  const options = reachableNodes(map);
  const optionIds = new Set(options.map((node) => node.id));
  const far = farthestReachable(map);
  const showRow = Math.max(far.row, currentRow + 1 + (app.bonuses.mapReveal || 0));
  let selected = findNode(map, params.previewNodeId);
  let active = true;
  let entering = false;
  onDispose?.(() => { active = false; });
  const canAct = () => active && app.run === run && run.map === map && !entering;

  root.classList.add('map-screen');
  root.append(app.hud({ right: el('button', {
    class: 'btn sm danger', onclick: async () => {
      if (!canAct()) return;
      const ok = await confirmDialog('撤退？', '本次远征将直接结束，损失大部分金币与一枚灯芯。', '撤退', 'danger');
      if (ok && canAct()) app.abandonRun('你带着残躯退回酒馆。');
    },
  }, '撤退') }));
  root.append(regionBanner(region, { compact: true, kicker: `第 ${run.night} 夜 · 第 ${map.act} 幕` }));

  const legend = el('details', { class: 'map-legend' },
    el('summary', {}, '地点图例'),
    el('div', { class: 'legends' }, Object.entries(NODE_KINDS).map(([, info]) =>
      el('div', { class: 'legend-item' },
        el('i', { style: { borderColor: info.color, color: info.color } }, info.glyph), info.name))),
  );
  root.append(el('div', { class: 'map-toolbar' },
    el('div', { class: 'route-status' },
      el('span', {}, `航路 ${map.visited.length} / ${map.grid.length}`),
      el('span', { class: 'keys-stat' }, `钥匙 ${run.keys || 0}`),
      region?.rule ? el('span', { title: region.rule.text }, region.rule.name) : null,
    ),
    legend,
  ));

  const workspace = el('div', { class: 'map-workspace' });
  const scroll = el('div', { class: 'map-path-scroll' });
  const canvas = el('div', { class: 'map-canvas', style: { height: `${height}px` } });
  const previewBody = el('div', { class: 'map-preview-body' });
  const previewActions = el('footer', { class: 'map-preview-actions' });
  const preview = el('aside', { class: 'map-preview', 'aria-label': '地点详情', 'aria-live': 'polite' }, previewBody, previewActions);
  scroll.append(canvas);
  workspace.append(scroll, preview);
  root.append(workspace);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-svg');
  svg.setAttribute('viewBox', `0 0 1000 ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  canvas.append(svg);
  const nodeEls = new Map();
  const edgeEls = [];

  function pos(node) {
    const columns = map.cols || cfg.cols;
    const rowSize = map.grid[node.row]?.length || node.rows || columns;
    return {
      x: ((node.col + (columns - rowSize) / 2 + 0.5) / columns) * 100,
      y: 56 + (map.grid.length - 1 - node.row) * ROW_H,
    };
  }

  function encounterFor(node) {
    return region?.encounters?.find((entry) => entry.id === node.encounterId);
  }

  function detailsFor(node) {
    const encounter = encounterFor(node);
    const event = node.eventId ? eventDef(node.eventId) : null;
    const site = SITE_KINDS.has(node.type) ? siteDef(node.siteId) || siteDef(node.type) : null;
    const info = NODE_KINDS[node.type] || NODE_KINDS.battle;
    return { encounter, event, site, info, name: encounter?.name || event?.name || site?.name || info.name };
  }

  for (const row of map.grid) {
    for (const node of row) {
      if (node.row > showRow) continue;
      for (const id of node.links) {
        const next = findNode(map, id);
        if (!next || next.row > showRow) continue;
        const a = pos(node), b = pos(next);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (a.x + b.x) * 5;
        path.setAttribute('d', `M ${a.x * 10} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x * 10} ${b.y}`);
        path.setAttribute('class', `map-edge ${node.id === map.currentId ? 'active' : ''} ${node.state === 'done' && node.row <= currentRow ? 'passed' : ''}`);
        svg.append(path);
        edgeEls.push({ path, from: node.id, to: next.id });
      }
    }
  }

  for (const row of map.grid) {
    for (const node of row) {
      const { info, name } = detailsFor(node);
      const p = pos(node);
      const hidden = node.row > showRow;
      const isOption = optionIds.has(node.id) && !hidden;
      const classes = ['map-node', node.type];
      if (node.id === map.currentId) classes.push('current');
      else if (node.state === 'done') classes.push('done');
      else if (isOption) classes.push('available');
      else if (hidden) classes.push('hidden');
      else classes.push('revealed');
      const button = el('button', {
        class: classes.join(' '),
        style: { left: `${p.x}%`, top: `${p.y}px`, borderColor: isOption || node.state === 'done' ? info.color : '' },
        title: hidden ? '未明地点' : `${info.name} · ${name}${isOption ? '（可前往）' : node.state === 'done' ? '（已通过）' : ''}`,
        disabled: hidden,
        'aria-pressed': String(selected?.id === node.id),
        'aria-label': hidden ? '未明地点' : `${info.name}：${name}`,
        dataset: { nodeId: node.id },
        onclick: () => selectNode(node),
      },
        hidden ? '?' : info.glyph,
        el('span', { class: 'sub' }, hidden ? '' : info.name),
      );
      canvas.append(button);
      nodeEls.set(node.id, button);
    }
  }

  function selectNode(node) {
    if (!canAct() || node.row > showRow) return;
    selected = node;
    app.params.previewNodeId = node.id;
    renderPreview();
    requestAnimationFrame(() => {
      if (selected?.id === node.id) focusNode(node);
    });
  }

  function focusNode(node) {
    if (!canAct() || !node) return;
    const button = nodeEls.get(node.id);
    if (!button) return;
    const viewport = scroll.getBoundingClientRect();
    const bounds = button.getBoundingClientRect();
    const label = button.querySelector('.sub')?.getBoundingClientRect();
    const bottom = Math.max(bounds.bottom, label?.bottom || bounds.bottom);
    if (bounds.top >= viewport.top + 8 && bottom <= viewport.bottom - 8) return;
    scroll.scrollTop = Math.max(0, pos(node).y - (scroll.clientHeight || viewport.height || 400) / 2);
  }

  function section(title, ...children) {
    return el('section', { class: 'node-preview-section' }, el('h3', {}, title), children);
  }

  function enemyList(group, trial = false) {
    const multiplier = (run.enemyHpMul || 1) * (group.tier === 'sentry' ? 0.65 : 1);
    return el('div', { class: 'node-enemy-list' }, group.enemies.map((id) => enemyDef(id)).filter(Boolean).map((enemy) => {
      const hp = enemy.hp.map((value) => Math.max(1, Math.round(value * multiplier)));
      return el('div', { class: 'node-enemy' },
        el('span', { 'aria-hidden': 'true' }, enemy.glyph),
        el('div', {},
          el('b', {}, enemy.name),
          el('small', {}, `生命 ${hp[0] === hp[1] ? hp[0] : hp.join('–')}${trial ? ' · 试炼力量 +1' : ''}`),
        ),
      );
    }));
  }

  function renderPreview() {
    clear(previewBody);
    clear(previewActions);
    preview.classList.toggle('has-selection', !!selected);
    previewBody.scrollTop = 0;
    for (const [id, button] of nodeEls) {
      button.classList.toggle('selected', selected?.id === id);
      button.setAttribute('aria-pressed', String(selected?.id === id));
    }
    for (const edge of edgeEls) edge.path.classList.toggle('selected', edge.to === selected?.id && edge.from === map.currentId);

    if (!selected) {
      previewBody.append(el('span', { class: 'node-preview-kind' }, `第 ${currentRow + 2} 层`), el('h2', {}, '前方航路'));
      for (const node of options) {
        const { info, name } = detailsFor(node);
        previewBody.append(el('button', { class: 'node-route-option', onclick: () => selectNode(node) }, `${info.glyph} ${name} →`));
      }
      if (region?.rule) previewBody.append(ruleSection());
      return;
    }

    const node = selected;
    const { encounter, event, site, info, name } = detailsFor(node);
    previewBody.append(
      el('span', { class: 'node-preview-kind', style: { color: info.color } }, `${info.name} · 第 ${node.row + 1} 层`),
      el('h2', {}, name),
    );
    if (site) {
      previewBody.append(el('p', { class: 'node-preview-text' }, site.text));
      const waves = node.waves?.map((id) => region?.encounters?.find((entry) => entry.id === id)).filter(Boolean);
      const groups = waves?.length ? waves : encounter ? [encounter] : [];
      if (groups.length) previewBody.append(section(groups.length > 1 ? '两轮守卫' : '守卫',
        el('div', { class: 'node-option-list' }, groups.map((group, index) => el('div', { class: 'node-option-preview' },
          el('b', {}, `${groups.length > 1 ? `${index + 1}. ` : ''}${group.name}`),
          enemyList(group, node.type === 'trial'),
        )))));
      const choices = siteChoices(run, node);
      previewBody.append(section('收益与代价', el('div', { class: 'node-option-list' }, choices.map((choice) =>
        el('div', { class: 'node-option-preview' },
          el('b', {}, choice.name),
          el('span', {}, choice.text),
          choice.disabled && choice.reason ? el('span', { class: 'unavailable' }, choice.reason) : null,
        )))));
    } else if (encounter) {
      previewBody.append(section('敌群', enemyList(encounter)));
      previewBody.append(section('胜利收益', el('p', {}, node.type === 'boss'
        ? map.act >= run.endAct ? '金币、首领奖励与成功归航。' : '金币、首领奖励与通往下一幕的航路。'
        : node.type === 'elite' ? '金币、卡牌、精英遗物奖励与 1 把钥匙。' : '金币与战后卡牌奖励。')));
    } else if (event) {
      previewBody.append(el('p', { class: 'node-preview-text' }, event.text));
      previewBody.append(section('抉择与代价', el('div', { class: 'node-option-list' }, (event.options || []).map((option) =>
        el('div', { class: 'node-option-preview' },
          el('b', {}, option.label),
          el('span', {}, option.desc || option.result?.text || ''),
          option.req?.gold ? el('span', {}, `需要 ${option.req.gold} 金币`) : null,
        )))));
    } else {
      const descriptions = {
        shop: '商队提供卡牌、遗物与药水，也可支付金币移除卡牌。',
        rest: '回复生命或升级一张可升级牌；具备营火能力时可永久移除卡牌。',
        treasure: '选择一件遗物并带走封存金币，也可空手离开。',
        sentry: '前哨守卫封住了入口。击败它，打开本幕的航路。',
        battle: '清除敌人，获得金币与战后卡牌奖励。',
        elite: '击败精英，获得金币、卡牌、遗物奖励与 1 把钥匙。',
        boss: map.act >= run.endAct ? '击败本幕首领，完成本夜远征。' : '击败本幕首领，开启下一段航路。',
        event: '航路上出现了异象。',
      };
      previewBody.append(el('p', { class: 'node-preview-text' }, descriptions[node.type] || info.name));
    }
    if (region?.rule) previewBody.append(ruleSection());

    const canEnter = optionIds.has(node.id) && node.state === 'available';
    previewActions.append(el('button', {
      class: 'btn primary map-enter',
      disabled: !canEnter,
      dataset: { nodeId: node.id },
      onclick: () => {
        if (!canAct()) return;
        const available = reachableNodes(map).some((entry) => entry.id === node.id);
        if (!available) { toast('这条路径已经无法前往', 'bad'); return; }
        entering = true;
        app.enterMapNode(node.id);
      },
    }, canEnter ? `进入 ${name} →` : node.state === 'done' ? '已通过此地点' : '当前路径不可前往'));
  }

  function ruleSection() {
    return el('details', { class: 'node-preview-section node-preview-rule' },
      el('summary', {}, `区域规则 · ${region.rule.name}`),
      el('p', {}, region.rule.text),
    );
  }

  renderPreview();
  requestAnimationFrame(() => {
    focusNode(selected || options[0] || current);
  });
}
