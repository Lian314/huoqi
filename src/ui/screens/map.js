import { el, clear } from '../../core/utils.js';
import { panel, toast, confirmDialog } from '../fx.js';
import { NODE_KINDS, reachableNodes, findNode, farthestReachable } from '../../systems/map.js';
import { ACT_CONFIG } from '../../systems/map.js';

const ROW_H = 78;

export function renderMap({ app, root }) {
  const run = app.run;
  if (!run) { app.goto('tavern'); return; }
  const map = run.map;
  const reveal = app.bonuses.mapReveal || 0;
  const cfg = ACT_CONFIG[map.act] || ACT_CONFIG[1];

  const height = map.grid.length * ROW_H + 40;

  root.append(app.hud({ right: el('button', {
    class: 'btn sm danger', onclick: async () => {
      const ok = await confirmDialog('撤退？', '本次远征将直接结束，损失大部分金币与一枚灯芯。', '撤退', 'danger');
      if (ok) app.abandonRun('你带着残躯退回酒馆。');
    },
  }, '撤退') }));

  const bar = el('div', { class: 'hud', style: { padding: '7px 16px', gap: '18px' } },
    el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '第'), el('span', { class: 'v' }, `${run.night} 夜`), el('span', { class: 'k' }, '·'), el('span', { class: 'v' }, `第 ${map.act} 幕`)),
    el('div', { class: 'hud-stat' }, el('span', { class: 'k' }, '进度'),
      el('span', { class: 'v' }, `${run.stats.nodesVisited}`),
      el('span', { class: 'k' }, `/ ${map.grid.length}`)),
    el('div', { class: 'hud-spacer' }),
    el('div', { class: 'legends' }, Object.entries(NODE_KINDS).filter(([k]) => k !== 'sentry').map(([k, v]) =>
      el('div', { class: 'legend-item' },
        el('i', { style: { borderColor: v.color, color: v.color } }, v.glyph),
        v.name,
      ),
    )),
  );
  root.append(bar);

  const scroll = el('div', { class: 'scroll' });
  const canvas = el('div', { class: 'map-canvas', style: { height: `${height}px`, minHeight: `${height}px` } });
  scroll.append(canvas);
  root.append(scroll);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-svg');
  svg.setAttribute('viewBox', `0 0 100 ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  canvas.append(svg);

  const cur = findNode(map, map.currentId);
  const far = farthestReachable(map);
  const options = reachableNodes(map);
  const optionIds = new Set(options.map((n) => n.id));
  const curRow = cur ? cur.row : -1;
  const showRow = Math.max(far.row, curRow + 1 + reveal);

  function pos(n) {
    const x = ((n.col + 0.5) / cfg.cols) * 100;
    const y = height - ((n.row + 0.5) / map.grid.length) * height;
    return { x, y };
  }

  function px(n) {
    const p = pos(n);
    return { x: (p.x / 100) * canvas.clientWidth, y: (p.y / height) * height };
  }

  // 边
  const curId = map.currentId;
  for (let r = 0; r < map.grid.length; r++) {
    for (const n of map.grid[r]) {
      if (n.row > showRow) continue;
      for (const cid of n.links) {
        const cn = findNode(map, cid);
        if (!cn || cn.row > showRow) continue;
        const a = pos(n), c = pos(cn);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (a.x + c.x) / 2;
        line.setAttribute('d', `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${c.y}, ${c.x} ${c.y}`);
        const isActive = n.id === curId;
        const isPast = n.state === 'done' && n.row <= curRow;
        line.setAttribute('class', `map-edge ${isActive ? 'active' : ''} ${isPast ? 'passed' : ''}`);
        svg.append(line);
      }
    }
  }

  // 节点
  for (let r = 0; r < map.grid.length; r++) {
    for (const n of map.grid[r]) {
      const info = NODE_KINDS[n.type] || NODE_KINDS.battle;
      const p = pos(n);
      const hidden = n.row > showRow;
      const isOpt = optionIds.has(n.id) && !hidden;
      const cls = ['map-node', n.type];
      if (n.state === 'done') cls.push('done');
      else if (n.id === curId) cls.push('current');
      else if (isOpt) cls.push('available');
      else if (hidden) cls.push('hidden');
      else if (n.row <= far.row) cls.push('revealed');

      const node = el('div', {
        class: cls.join(' '),
        style: { left: `${p.x}%`, top: `${p.y}px`, borderColor: isOpt || n.state === 'done' ? info.color : '' },
        title: `${info.name}${isOpt ? '（可前往）' : ''}`,
        onclick: isOpt ? () => app.enterMapNode(n.id) : null,
      },
        info.glyph,
        el('span', { class: 'sub', text: n.type === 'boss' ? '首领' : '' }),
      );
      canvas.append(node);
    }
  }

  // 底部提示
  scroll.append(el('div', { class: 'wrap', style: { paddingBottom: '30px' } },
    el('div', { class: 'hint', style: { textAlign: 'center' } },
      curRow < 0 ? '选择你要踏上的第一个节点。' : '沿着亮起的路径继续深入。'),
  ));

  // 首次自动滚动到底
  requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
}
