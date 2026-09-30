import { siteDef } from '../data/sites.js';
import { card, potion } from '../data/index.js';
import { upgradeCardAt, removeCardAt, rollPotionReward, grantPotion } from '../core/run.js';
import { applyRunEffects } from './outcome.js';

export function siteState(run, node) {
  if (!run || !node || !siteDef(node.type)) return null;
  run.siteStates ||= {};
  return run.siteStates[node.id] ||= {
    nodeId: node.id, type: node.type, choice: null, resolved: false, result: null, battle: null, goldEarned: 0,
  };
}

export function siteChoices(run, node) {
  const state = siteState(run, node);
  if (!state || state.resolved) return [];
  if (state.battle) {
    return state.battle.phase === 'between' ? [
      { id: 'continue', name: '继续第二轮', text: '第一轮已结束并回复 6 点生命。完成下一轮后获得卡牌、遗物、钥匙与额外 45 金币。', action: 'battle' },
      { id: 'retreat', name: '撤出试炼', text: '保留第一轮战斗所得金币，放弃最终奖励。', action: 'done' },
    ] : [];
  }
  const option = (id, name, text, action = 'done', disabled = false, reason = '') => ({ id, name, text, action, disabled, reason });
  const canUpgrade = run.deck.some((inst) => !inst.upgraded && card(inst.id)?.upgrade);
  const choices = {
    forge: [
      option('upgrade', '磨利工具', '免费永久升级一张可升级牌。', 'upgrade', !canUpgrade, '没有可升级的牌'),
      option('remove', '卸下负担', '支付 35 金币，永久移除一张牌。', 'remove', run.gold < 35 || run.deck.length <= 5, '需要 35 金币，且牌组超过 5 张'),
    ],
    shrine: [
      option('blood', '燃血烛', '失去 8 点生命。接下来 3 场战斗开战获得 2 层力量。', 'done', run.hp <= 8, '生命必须超过 8'),
      option('veil', '覆盐帷', '失去 6 点生命。接下来 3 场战斗首回合获得 8 点格挡。', 'done', run.hp <= 6, '生命必须超过 6'),
      option('calm', '熄去旧烛', '回复 8 点生命。'),
    ],
    supply: [
      option('potions', '取走药箱', '获得至多 2 瓶随机药水，受空槽数量限制。', 'done', run.potions.length >= run.potionSlots, '药水栏已满'),
      option('card', '取走牌袋', '从战后卡牌候选中收下一张牌。', 'reward'),
      option('key', '取走封印钥匙', '获得 1 把钥匙，可无战斗打开密库。'),
    ],
    trial: [
      option('undertake', '走入两道闸门', '连续两轮遭遇，所有敌人额外获得 1 层力量。首轮后回复 6 生命；两轮全胜获得卡牌、遗物、钥匙及额外 45 金币。', 'battle'),
    ],
    vault: [
      option('unlock', '用钥匙开封', '消耗 1 把封印钥匙，直接获得一件遗物。', 'reward', (run.keys || 0) < 1, '需要 1 把封印钥匙'),
      option('assault', '击败库房守卫', '挑战区域精英。胜利获得卡牌、遗物和精英金币，并获得 1 把钥匙。', 'battle'),
    ],
    waystation: [
      option('rest', '休整', `回复 ${Math.round(run.maxHp * 0.2)} 点生命。`),
      option('shelter', '备下护盾', '接下来 2 场战斗首回合获得 6 点格挡。'),
      option('buyKey', '交换钥匙', '支付 25 金币，获得 1 把封印钥匙。', 'done', run.gold < 25, '需要 25 金币'),
    ],
  };
  return [...choices[node.type], option('leave', '继续赶路', '离开此处。')];
}

export function gainKeys(run, count = 1) {
  run.keys = (run.keys || 0) + count;
  run.stats.keysFound = (run.stats.keysFound || 0) + count;
}

function blessing(run, id, name, remaining, ops) {
  run.blessings ||= [];
  const old = run.blessings.find((entry) => entry.id === id && entry.remaining > 0);
  if (old) old.remaining = Math.max(old.remaining, remaining);
  else run.blessings.push({ id, name, remaining, firstTurn: ops });
}

export function chooseSite(run, node, choiceId, opts = {}) {
  const state = siteState(run, node);
  if (!state || run.hp <= 0 || run.map.currentId !== node.id || !run.map.visited.includes(node.id)) {
    return { ok: false, why: '无法在此处行动' };
  }
  if (state.resolved) return { ok: false, why: '此处已结算' };
  const choice = siteChoices(run, node).find((entry) => entry.id === choiceId);
  if (!choice || choice.disabled) return { ok: false, why: choice?.reason || '这项选择已经失效' };
  let text = choice.text;
  let kind = choice.action === 'reward' ? 'reward' : 'done';
  let rewardStep = null;
  if (choiceId === 'continue') {
    state.battle.phase = 'fighting';
    return { ok: true, kind: 'battle' };
  }
  if (choiceId === 'upgrade' || choiceId === 'remove') {
    const index = run.deck.findIndex((inst) => inst.uid === opts.cardUid);
    if (index < 0) return { ok: false, why: '请选择牌组中的一张牌' };
    if (choiceId === 'upgrade') {
      const upgraded = upgradeCardAt(run, index);
      if (!upgraded) return { ok: false, why: '这张牌无法升级' };
      text = `【${card(upgraded.id).name}】已永久升级。`;
    } else {
      applyRunEffects(run, [{ op: 'gold', n: -35 }]);
      const removed = removeCardAt(run, index);
      text = `支付 35 金币，移除了【${card(removed.id).name}】。`;
    }
  } else if (choiceId === 'blood') {
    applyRunEffects(run, [{ op: 'loseHp', n: 8 }]);
    blessing(run, 'blood_candle', '燃血烛', 3, [{ op: 'buff', s: 'strength', v: 2, t: 'self' }]);
  } else if (choiceId === 'veil') {
    applyRunEffects(run, [{ op: 'loseHp', n: 6 }]);
    blessing(run, 'salt_veil', '覆盐帷', 3, [{ op: 'block', v: 8 }]);
  } else if (choiceId === 'calm') applyRunEffects(run, [{ op: 'heal', n: 8 }]);
  else if (choiceId === 'potions') {
    const found = [];
    for (const def of rollPotionReward(run, Math.min(2, run.potionSlots - run.potions.length))) {
      if (grantPotion(run, def.id)) found.push(potion(def.id).name);
    }
    text = `取走了${found.join('、')}。`;
  } else if (choiceId === 'key') gainKeys(run);
  else if (choiceId === 'card') rewardStep = 'card';
  else if (choiceId === 'unlock') {
    run.keys -= 1;
    run.stats.keysSpent = (run.stats.keysSpent || 0) + 1;
    run.stats.vaultsOpened = (run.stats.vaultsOpened || 0) + 1;
    rewardStep = 'relic';
  } else if (choiceId === 'undertake' || choiceId === 'assault') {
    const encounters = choiceId === 'undertake' ? node.waves : [node.encounterId];
    if (!encounters?.length || encounters.some((id) => !id)) return { ok: false, why: '守卫尚未就位' };
    state.battle = { wave: 0, phase: 'fighting', tier: choiceId === 'undertake' ? 'normal' : 'elite', encounters };
    run.activeSite = node.id;
    kind = 'battle';
  } else if (choiceId === 'rest') applyRunEffects(run, [{ op: 'heal', n: Math.round(run.maxHp * 0.2) }]);
  else if (choiceId === 'shelter') blessing(run, 'waystation_shield', '驿站护盾', 2, [{ op: 'block', v: 6 }]);
  else if (choiceId === 'buyKey') {
    applyRunEffects(run, [{ op: 'gold', n: -25 }]);
    gainKeys(run);
  }
  state.choice = choiceId;
  state.resolved = kind !== 'battle';
  if (choiceId === 'retreat') {
    run.activeSite = null;
    state.battle.phase = 'retreated';
  }
  state.result = { ok: true, kind, rewardStep, text };
  return state.result;
}

export function finishSiteBattle(run, gold) {
  const state = run.siteStates?.[run.activeSite];
  if (!state?.battle || state.resolved || state.battle.phase !== 'fighting') return null;
  state.goldEarned += gold;
  if (state.type === 'trial' && state.battle.wave === 0) {
    state.battle.wave = 1;
    state.battle.phase = 'between';
    applyRunEffects(run, [{ op: 'heal', n: 6 }]);
    state.result = { ok: true, kind: 'continue', text: '第一道闸门已清空。你在墙边包扎伤口，准备下一轮。' };
    return state.result;
  }
  state.battle.phase = 'won';
  state.resolved = true;
  run.activeSite = null;
  let bonus = 0;
  if (state.type === 'trial') {
    bonus = 45;
    applyRunEffects(run, [{ op: 'gold', n: bonus }]);
    gainKeys(run);
    run.stats.trialsCleared = (run.stats.trialsCleared || 0) + 1;
  } else run.stats.vaultsOpened = (run.stats.vaultsOpened || 0) + 1;
  state.result = { ok: true, kind: 'reward', tier: state.type, gold: state.goldEarned + bonus,
    text: state.type === 'trial' ? '两道闸门都已清空。封存的器物与你的钥匙一起交到了手中。' : '守卫倒下了，密库的封印已经解除。' };
  return state.result;
}
