// ============ 地窟地图生成 ============
import { RNG } from '../core/rng.js';
import { ALL_EVENTS } from '../data/index.js';
import { CHAPTERS, regionById, regionsOf } from '../data/regions.js';
import { SITE_TYPES } from '../data/sites.js';

const NODE_KINDS = {
  battle: { name: '遭遇', glyph: '⚔', color: '#e06c6c', danger: 1 },
  sentry: { name: '前哨', glyph: '⌂', color: '#c0c8d4', danger: 0 },
  elite: { name: '精英', glyph: '☗', color: '#ff9f43', danger: 2 },
  event: { name: '异象', glyph: '?', color: '#9d7fea', danger: 0 },
  shop: { name: '商队', glyph: '⌂', color: '#4ecdc4', danger: 0 },
  rest: { name: '篝火', glyph: '▲', color: '#7bed9f', danger: 0 },
  treasure: { name: '宝库', glyph: '◆', color: '#feca57', danger: 0 },
  boss: { name: '首领', glyph: '☠', color: '#ff4757', danger: 3 },
  ...Object.fromEntries(Object.entries(SITE_TYPES).map(([type, def]) => [type, { ...def, danger: ['trial', 'vault'].includes(type) ? 2 : 0 }])),
};

export { NODE_KINDS };

export function nodeInfo(kind) { return NODE_KINDS[kind] || NODE_KINDS.battle; }

export const ACT_CONFIG = CHAPTERS;

export function generateMap(run, act, requestedRegionId = null) {
  const cfg = ACT_CONFIG[act] || ACT_CONFIG[1];
  const rng = run.rng;
  const regions = regionsOf(act);
  const region = regions.find((entry) => entry.id === requestedRegionId) || rng.pick(regions);
  const rows = cfg.rows;
  const cols = cfg.cols;
  const grid = [];

  // 1) 每行节点数
  for (let r = 0; r < rows; r++) {
    let n = cols;
    if (r === 0) n = Math.max(2, cols - 1);
    if (r === rows - 1) n = 1;
    if (r === rows - 2) n = 1;
    if (r === rows - 3) n = 1;
    const row = [];
    for (let c = 0; c < n; c++) {
      row.push({ id: `n${act}_${r}_${c}`, act, row: r, col: c, rows: n, type: 'battle', links: [], state: 'locked' });
    }
    grid.push(row);
  }

  // 2) 连边
  for (let r = 0; r < rows - 1; r++) {
    const cur = grid[r];
    const nxt = grid[r + 1];
    // 第一个节点必须连第一个
    for (let c = 0; c < cur.length; c++) {
      const node = cur[c];
      const options = [];
      for (let k = Math.max(0, c - 1); k <= Math.min(nxt.length - 1, c + 1); k++) options.push(k);
      if (!options.length) options.push(Math.min(c, nxt.length - 1));
      {
        const picked = rng.sample(options, rng.int(Math.min(2, options.length), Math.min(3, options.length)));
        for (const k of [Math.min(c, nxt.length - 1), Math.min(c + 1, nxt.length - 1)]) {
          if (!picked.includes(k)) picked.push(k);
        }
        node.links = picked.sort((a, b) => a - b).map((k) => nxt[k].id);
        // 保证不出现断头路：至少一个后继
        if (!node.links.length) node.links = [nxt[options[0]].id];
      }
    }
  }

  // 3) 分配节点类型
  assignTypes(grid, cfg, rng, rows);

  const map = {
    act, rows, cols, grid, cfg, regionId: region?.id || null,
    currentId: null,
    visited: [],
    complete: false,
  };
  // 起始行只有 1 个入口可选
  grid[0].forEach((n, i) => { n.state = i === 0 ? 'available' : 'hidden'; });
  for (const row of grid) for (const node of row) configureNode(run, map, node);
  return map;
}

function assignTypes(grid, cfg, rng, rows) {
  // 固定行
  grid[0].forEach((n) => { n.type = 'sentry'; });
  const treasureRow = rows - 3;
  const restRow = rows - 2;
  for (let r = 1; r < restRow; r++) {
    if (r === treasureRow) { grid[r].forEach((n) => { n.type = 'treasure'; }); continue; }
    for (const n of grid[r]) n.type = null;
  }
  grid[restRow].forEach((n) => { n.type = 'rest'; });
  grid[rows - 1].forEach((n) => { n.type = 'boss'; });

  for (let r = 1; r < treasureRow; r++) for (const node of grid[r]) node.type = 'battle';
  const midRows = rng.shuffle(Array.from({ length: treasureRow - 4 }, (_, i) => i + 4));
  const kinds = [
    ...Array(cfg.shopCount).fill('shop'), ...Object.keys(SITE_TYPES),
    ...Array(cfg.eventCount).fill('event'), ...Array(rows > 16 ? 3 : 2).fill('elite'),
  ];
  for (let i = 0; i < kinds.length; i++) {
    const row = grid[midRows[i % midRows.length]];
    const candidates = row.filter((node) => node.type === 'battle');
    if (candidates.length) rng.pick(candidates).type = kinds[i];
  }
}

export function configureNode(run, map, node) {
  const region = regionById(map.regionId);
  if (!region) return;
  const rng = new RNG((run.seed ^ map.act * 4099 ^ node.row * 7919 ^ node.col * 104729) >>> 0);
  delete node.encounterId;
  delete node.eventId;
  delete node.waves;
  const tier = { battle: 'normal', sentry: 'sentry', elite: 'elite', boss: 'boss', vault: 'elite' }[node.type];
  if (tier) {
    const pool = region.encounters.filter((entry) => entry.tier === tier);
    node.encounterId = rng.weighted(pool, (entry) => entry.weight || 1)?.id;
  } else if (node.type === 'trial') {
    node.waves = rng.sample(region.encounters.filter((entry) => entry.tier === 'normal'), 2).map((entry) => entry.id);
  } else if (node.type === 'event') {
    const used = new Set(map.grid.flat().filter((other) => other.id !== node.id).map((other) => other.eventId));
    const pool = ALL_EVENTS.filter((entry) => (!entry.act || entry.act === map.act)
      && (!entry.regionId || entry.regionId === region.id));
    const fresh = pool.filter((entry) => !used.has(entry.id));
    node.eventId = rng.weighted(fresh.length ? fresh : pool, (entry) => entry.regionId === region.id ? 3 : 1)?.id;
  }
}

// ---------- 查询 ----------

export function findNode(map, id) {
  if (!map) return null;
  for (const row of map.grid) for (const n of row) if (n.id === id) return n;
  return null;
}

export function entryNodes(map) {
  return map ? map.grid[0].filter((n) => n.state === 'available' && !map.visited.includes(n.id)) : [];
}

export function reachableNodes(map) {
  if (!map) return [];
  if (!map.currentId) return entryNodes(map);
  const cur = findNode(map, map.currentId);
  if (!cur) return [];
  return cur.links.map((id) => findNode(map, id)).filter((n) =>
    n && n.row === cur.row + 1 && n.state === 'available' && !map.visited.includes(n.id));
}

export function enterNode(run, nodeId) {
  const map = run?.map;
  const options = reachableNodes(map);
  const node = options.find((n) => n.id === nodeId);
  if (!node) return null;
  for (const option of options) if (option !== node) option.state = 'locked';
  node.state = 'done';
  map.currentId = nodeId;
  map.visited.push(nodeId);
  run.stats.nodesVisited += 1;
  for (const id of node.links) {
    const next = findNode(map, id);
    if (next && next.row === node.row + 1 && next.state !== 'done' && !map.visited.includes(id)) next.state = 'available';
  }
  map.complete = isMapComplete(map);
  return node;
}

export function isMapComplete(map) {
  const lastRow = map.grid[map.grid.length - 1];
  return lastRow.every((n) => n.state === 'done');
}

export function actProgress(map) {
  if (!map) return { done: 0, total: 1, pctDone: 0 };
  const cur = findNode(map, map.currentId);
  const row = cur ? cur.row : -1;
  const total = map.grid.length;
  return { done: row + 1, total, pctDone: (row + 1) / total };
}

/** 计算最远可达路径（用于小地图预览） */
export function farthestReachable(map) {
  if (!map) return { row: 0, col: 0 };
  let best = { row: 0, col: 0 };
  const start = map.currentId ? [map.currentId] : entryNodes(map).map((n) => n.id);
  const seen = new Set();
  const stack = start.slice();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const n = findNode(map, id);
    if (!n) continue;
    if (n.row > best.row) best = { row: n.row, col: n.col };
    for (const l of n.links) stack.push(l);
  }
  return best;
}
