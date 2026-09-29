// ============ 地窟地图生成 ============
import { RNG } from '../core/rng.js';

const NODE_KINDS = {
  battle: { name: '遭遇', glyph: '⚔', color: '#e06c6c', danger: 1 },
  sentry: { name: '前哨', glyph: '⌂', color: '#c0c8d4', danger: 0 },
  elite: { name: '精英', glyph: '☗', color: '#ff9f43', danger: 2 },
  event: { name: '异象', glyph: '?', color: '#9d7fea', danger: 0 },
  shop: { name: '商队', glyph: '⌂', color: '#4ecdc4', danger: 0 },
  rest: { name: '篝火', glyph: '▲', color: '#7bed9f', danger: 0 },
  treasure: { name: '宝库', glyph: '◆', color: '#feca57', danger: 0 },
  boss: { name: '首领', glyph: '☠', color: '#ff4757', danger: 3 },
};

export { NODE_KINDS };

export function nodeInfo(kind) { return NODE_KINDS[kind] || NODE_KINDS.battle; }

export const ACT_CONFIG = {
  1: { rows: 15, cols: 4, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 3 },
  2: { rows: 18, cols: 4, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 3 },
  3: { rows: 20, cols: 5, eliteFrom: 2, shopCount: 2, restCount: 1, eventCount: 4 },
};

export function generateMap(run, act) {
  const cfg = ACT_CONFIG[act] || ACT_CONFIG[1];
  const rng = run.rng;
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
      const forced = (c === 0 && r === 0) || (c === cur.length - 1 && r === rows - 2);
      if (forced) node.links = [options[0]];
      else {
        const picked = rng.sample(options, rng.int(1, Math.min(3, options.length)));
        node.links = picked.sort((a, b) => a - b);
        // 保证不出现断头路：至少一个后继
        if (!node.links.length) node.links = [options[0]];
      }
    }
  }

  // 3) 分配节点类型
  assignTypes(grid, cfg, rng, rows);

  const map = {
    act, rows, cols, grid, cfg,
    currentId: null,
    visited: [],
    complete: false,
  };
  for (const row of grid) for (const n of row) n.state = 'available';
  // 起始行只有 1 个入口可选
  grid[0].forEach((n, i) => { n.state = i === 0 ? 'available' : 'hidden'; });
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

  // 随机行预算
  let elites = 2 + (rows > 16 ? 1 : 0);
  let shops = cfg.shopCount;
  let events = cfg.eventCount;
  let rests = cfg.restCount - 1; // 已用掉一个
  const midRows = [];
  for (let r = 1; r < treasureRow; r++) midRows.push(r);

  // 保证前 3 行全是战斗/精英
  for (let r = 1; r <= Math.min(3, treasureRow - 1); r++) {
    for (const n of grid[r]) n.type = r >= cfg.eliteFrom && elites > 0 && rng.chance(0.14) ? (elites--, 'elite') : 'battle';
  }

  // 商店：固定分散在中间
  const shopRows = pickSpreadRows(midRows.filter((r) => r > 3), shops, rng);
  for (const r of shopRows) {
    for (const n of grid[r]) { n.type = 'shop'; }
  }
  shops -= shopRows.length;

  // 剩余行铺满
  for (let r = 1; r < treasureRow; r++) {
    for (const n of grid[r]) {
      if (n.type) continue;
      const roll = rng.next();
      if (r >= cfg.eliteFrom && elites > 0 && roll < 0.12) { n.type = 'elite'; elites--; }
      else if (events > 0 && roll < 0.26) { n.type = 'event'; events--; }
      else if (rests > 0 && roll < 0.31) { n.type = 'rest'; rests--; }
      else n.type = 'battle';
    }
  }
  // 兜底：没有空节点
  for (let r = 1; r < rows - 1; r++) for (const n of grid[r]) if (!n.type) n.type = 'battle';
  // 每行不能同时出现两个商店
  for (let r = 0; r < rows; r++) {
    const shopsInRow = grid[r].filter((n) => n.type === 'shop');
    if (shopsInRow.length > 1) for (let i = 1; i < shopsInRow.length; i++) shopsInRow[i].type = 'battle';
  }
}

function pickSpreadRows(rows, count, rng) {
  if (count <= 0 || rows.length === 0) return [];
  const span = rows.length;
  const step = span / count;
  const out = [];
  for (let i = 0; i < count; i++) {
    let r = Math.floor(step * i + step / 2);
    r = Math.max(1, Math.min(rows.length - 1, r + rng.int(-1, 1)));
    let tries = 0;
    while (out.includes(r) && tries < 8) { r = Math.max(1, Math.min(rows.length - 1, r + 1)); tries++; }
    if (!out.includes(r)) out.push(r);
  }
  return out.sort((a, b) => a - b);
}

// ---------- 查询 ----------

export function findNode(map, id) {
  if (!map) return null;
  for (const row of map.grid) for (const n of row) if (n.id === id) return n;
  return null;
}

export function entryNodes(map) {
  return map ? map.grid[0].filter((n) => n.state !== 'done') : [];
}

export function reachableNodes(map) {
  if (!map) return [];
  if (!map.currentId) return entryNodes(map);
  const cur = findNode(map, map.currentId);
  if (!cur) return entryNodes(map);
  return cur.links.map((c) => findNode(map, c)).filter(Boolean).filter((n) => n.state !== 'done');
}

export function enterNode(run, nodeId) {
  const map = run.map;
  const node = findNode(map, nodeId);
  if (!node) return null;
  if (map.currentId) {
    const cur = findNode(map, map.currentId);
    if (cur && !cur.links.includes(nodeId)) return null;
  }
  node.state = 'done';
  map.currentId = nodeId;
  map.visited.push(nodeId);
  run.stats.nodesVisited += 1;
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
  const start = map.currentId ? [map.currentId] : map.grid[0].map((n) => n.id);
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
