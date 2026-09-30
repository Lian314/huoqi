import { COMMISSIONS } from '../data/commissions.js';
import { RNG } from '../core/rng.js';
import { configureNode } from './map.js';

export function commissionById(id) {
  return COMMISSIONS.find((entry) => entry.id === id) || null;
}

export function commissionRank(reputation = 0) {
  if (reputation >= 20) return { name: '锈锚盟约', multiplier: 1.3, next: null };
  if (reputation >= 15) return { name: '可靠的船灯', multiplier: 1.2, next: 20 };
  if (reputation >= 6) return { name: '登记的旅者', multiplier: 1.1, next: 15 };
  return { name: '无名的来客', multiplier: 1, next: 6 };
}

export function ensureCommissionBoard(meta, count = 3) {
  const board = meta.commissions ||= {
    night: 0, offers: [], selectedId: null, resolved: false,
    reputation: 0, completed: [], lastResult: null,
  };
  if (board.night !== meta.night) {
    board.night = meta.night;
    board.offers = [];
    board.selectedId = null;
    board.resolved = false;
  }
  const completed = new Set(board.completed.map((entry) => entry.id));
  const remaining = COMMISSIONS.filter((entry) => !completed.has(entry.id));
  const pool = remaining.length ? remaining : COMMISSIONS;
  const rng = new RNG((0x51a7c3 ^ meta.night * 7919 ^ (meta.stats?.runs || 0) * 104729) >>> 0);
  const ranked = rng.shuffle(pool);
  const wanted = Math.min(pool.length, Math.max(3, count));
  for (const entry of ranked) {
    if (board.offers.length >= wanted) break;
    if (!board.offers.includes(entry.id)) board.offers.push(entry.id);
  }
  return board;
}

export function chooseCommission(meta, id, count = 3) {
  if (meta.ending || meta.pendingResult || meta.hearts <= 0) return false;
  const board = ensureCommissionBoard(meta, count);
  if (board.resolved || (id != null && !board.offers.includes(id))) return false;
  board.selectedId = id;
  return true;
}

export function beginCommission(meta, run, count = 3) {
  const board = ensureCommissionBoard(meta, count);
  const entry = commissionById(board.selectedId);
  run.commission = entry && !board.resolved ? {
    id: entry.id, night: meta.night, baselineRelics: run.relics.length,
    baselineStats: { ...run.stats }, settled: false,
  } : null;
  if (run.commission) ensureCommissionRoute(run, entry);
  return run.commission;
}

function ensureCommissionRoute(run, entry) {
  const map = run.map;
  if (!map || map.currentId) return;
  const types = { eventsVisited: 'event', elites: 'elite' };
  for (const goal of entry.goals) {
    const type = types[goal.metric];
    if (!type) continue;
    const paths = new Map();
    for (const row of [...map.grid].reverse()) {
      for (const node of row) {
        const tails = node.links.map((id) => paths.get(id)).filter(Boolean);
        const best = tails.sort((a, b) => b.count - a.count)[0];
        paths.set(node.id, { count: (node.type === type ? 1 : 0) + (best?.count || 0),
          nodes: [node, ...(best?.nodes || [])] });
      }
    }
    const path = map.grid[0].filter((node) => node.state === 'available')
      .map((node) => paths.get(node.id)).sort((a, b) => b.count - a.count)[0];
    const missing = Math.max(0, goal.target - (path?.count || 0));
    if (!missing || !path) continue;
    // Keep the opening fights and fixed treasure/rest/boss rows intact.
    const candidates = path.nodes.filter((node) => node.type === 'battle'
      && node.row >= 4 && node.row < map.rows - 3);
    for (let i = 0; i < Math.min(missing, candidates.length); i++) {
      const node = candidates[Math.floor((i + 1) * candidates.length / (missing + 1))];
      node.type = type;
      configureNode(run, map, node);
    }
  }
}

export function commissionProgress(run) {
  const entry = commissionById(run?.commission?.id);
  if (!entry) return [];
  return entry.goals.map((goal) => {
    let value;
    if (goal.metric === 'relicsFound') value = Math.max(0, run.relics.length - run.commission.baselineRelics);
    else if (goal.metric === 'hpPercent') value = Math.floor(100 * Math.max(0, run.hp) / Math.max(1, run.maxHp));
    else value = Math.max(0, (run.stats?.[goal.metric] || 0) - (run.commission.baselineStats?.[goal.metric] || 0));
    return { ...goal, value, complete: value >= goal.target };
  });
}

export function commissionReward(meta, entry, bonus = 0) {
  return Math.round((entry.gold + bonus) * commissionRank(meta.commissions?.reputation).multiplier);
}

export function settleCommission(meta, run, victory, bonus = 0) {
  const commission = run?.commission;
  const entry = commissionById(commission?.id);
  if (!entry || commission.settled) return null;
  const board = ensureCommissionBoard(meta);
  if (board.resolved || board.night !== commission.night || board.selectedId !== entry.id) return null;
  commission.settled = true;
  board.resolved = true;
  const goals = commissionProgress(run);
  const success = !!victory && goals.every((goal) => goal.complete);
  const result = {
    id: entry.id, name: entry.name, night: commission.night, success, goals,
    gold: success ? commissionReward(meta, entry, bonus) : 0,
    embers: success ? entry.embers : 0, reputation: success ? entry.reputation : 0,
    reason: success ? '委托已交付' : victory ? '目标未达成' : '未能归来',
  };
  if (success) {
    meta.gold += result.gold;
    meta.embers += result.embers;
    board.reputation += result.reputation;
    board.completed.unshift({ id: entry.id, name: entry.name, night: commission.night,
      gold: result.gold, embers: result.embers, reputation: result.reputation });
  }
  board.lastResult = result;
  return result;
}

export function expireCommission(meta) {
  const board = meta.commissions;
  if (!board || board.night !== meta.night || board.resolved || !board.selectedId) return;
  board.resolved = true;
  board.lastResult = { id: board.selectedId, name: commissionById(board.selectedId)?.name,
    night: meta.night, success: false, gold: 0, embers: 0, reputation: 0, goals: [], reason: '本夜未出发' };
}
