// 战斗之外的结算（事件、商店、篝火、遗物钩子）
import { resolveOps, logLine } from './effects.js';

export function makeRunCtx(run, opts = {}) {
  const self = {
    uid: 'self', name: run.charName, glyph: run.charGlyph,
    hp: run.hp, maxHp: run.maxHp, block: 0,
    status: opts.status ? { ...opts.status } : {},
    isPlayer: true,
  };
  const battle = {
    run, uidSeq: 1, turn: 0, phase: 'event',
    enemies: [], player: self,
    draw: [], hand: [], discard: [], exhaustPile: [], powers: [],
    cardsPlayedThisTurn: [], pending: [], fx: [], log: [],
    doubleNextAttack: null,
  };
  return {
    battle, run, self, target: opts.target || null,
    rng: run.rng, perspective: 'player', inRun: true,
    onGrantRelic: () => run.grantRelic?.('random'),
  };
}

/** 应用一组效果并同步回 run */
export function applyRunEffects(run, ops, opts = {}) {
  const ctx = makeRunCtx(run, opts);
  if (ops?.length) resolveOps(ops, ctx);
  run.maxHp = Math.max(1, ctx.self.maxHp);
  run.hp = Math.max(0, Math.min(run.maxHp, ctx.self.hp));
  return { log: ctx.battle.log, ctx };
}

export function formatLog(log) {
  return (log || []).map((l) => l.text).join('\n');
}
