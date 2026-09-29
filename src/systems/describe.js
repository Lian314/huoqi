// 效果数组 → 中文描述（数据未写 text 时的兜底渲染）
import { STATUS } from '../data/index.js';

const T = {
  S: '力量', '2S': '力量的2倍', B: '当前格挡', hand: '手牌数', deck: '牌组张数', discard: '弃牌堆张数',
};

const COND = {
  hpBelow: (c) => c.p != null ? `生命低于最大生命的 ${Math.round(c.p * 100)}%` : `生命低于 ${c.n}`,
  hpAbove: (c) => c.p != null ? `生命高于最大生命的 ${Math.round(c.p * 100)}%` : `生命高于 ${c.n}`,
  hasStatus: (c) => `【${STATUS[c.s]?.name || c.s}】不少于 ${c.gte ?? 1} 层`,
  noStatus: (c) => `没有【${STATUS[c.s]?.name || c.s}】`,
  deckCount: (c) => `牌组中【${c.card}】不少于 ${c.gte ?? 1} 张`,
  typePlayed: (c) => `本回合已打出 ${c.n ?? 1} 张以上${({ attack: '攻击', skill: '技能', power: '力量' })[c.t] || c.t}牌`,
  energy: (c) => `剩余能量不超过 ${c.n}`,
  handSize: (c) => `手牌数不超过 ${c.n}`,
  discardSize: (c) => `弃牌堆不超过 ${c.n} 张`,
  turn: (c) => `当前是第 ${c.n} 回合或更早`,
  enemyCount: (c) => `存活敌人不超过 ${c.n} 个`,
  chance: (c) => `${Math.round((c.p ?? .5) * 100)}% 概率`,
  firstCardOfTurn: () => `这是本回合的第一张牌`,
  lastCardPlayed: () => `本回合已经打过牌`,
  targetLow: (c) => `目标生命低于 ${Math.round((c.p ?? .4) * 100)}%`,
  hasRelic: (c) => `持有遗物 ${c.r}`,
};

const CUSTOM_T = {
  shuffleDiscardToDeck: '将弃牌堆洗回抽牌堆',
  shuffleDrawPile: '洗乱抽牌堆',
  doubleNextAttack: '下一张攻击牌伤害翻倍',
  healPerHandCard: (o) => `每张手牌回复 ${o.n ?? 1} 点生命`,
  burnPerCardInHand: '每张手牌对随机敌人造成 2 点伤害',
  loseEnergyThenDraw: (o) => `失去 ${o.n ?? 1} 点能量后抽 2 张牌`,
  grantRandomRelic: '获得一件随机遗物',
  convertDeckToBurn: (o) => `将 ${Math.round((o.p ?? .5) * 100)}% 的攻击牌转化为【灼热挥砍】`,
};

function val(v) {
  if (typeof v === 'number') return String(v);
  if (T[v]) return T[v];
  return String(v ?? 0);
}

const TARGET_T = { self: '自身', allEnemies: '所有敌人', all: '所有角色', random: '随机敌人', target: '目标' };
function tgt(t) { return TARGET_T[t] ? `（${TARGET_T[t]}）` : ''; }

export function describe(ops) {
  if (!ops || !ops.length) return '';
  const parts = [];
  for (const op of ops) {
    if (!op || !op.op) continue;
    switch (op.op) {
      case 'damage': parts.push(`造成 ${val(op.v)} 点伤害${tgt(op.t)}`); break;
      case 'damageAll': parts.push(`对所有敌人造成 ${val(op.v)} 点伤害`); break;
      case 'block': case 'blockAll': parts.push(`获得 ${val(op.v)} 点格挡`); break;
      case 'doubleBlock': parts.push('格挡翻倍'); break;
      case 'heal': parts.push(`回复 ${val(op.n)} 点生命`); break;
      case 'loseHp': parts.push(`失去 ${val(op.n)} 点生命`); break;
      case 'maxHp': parts.push(`最大生命 +${val(op.n)}`); break;
      case 'gold': parts.push(`获得 ${op.n} 金币`); break;
      case 'buff': parts.push(`获得 ${val(op.v)} 层【${STATUS[op.s]?.name || op.s}】${tgt(op.t)}`); break;
      case 'debuff': parts.push(`施加 ${val(op.v)} 层【${STATUS[op.s]?.name || op.s}】${tgt(op.t)}`); break;
      case 'draw': parts.push(`抽 ${val(op.n)} 张牌`); break;
      case 'energy': parts.push(`获得 ${val(op.n)} 点能量`); break;
      case 'scry': parts.push(`预知 ${val(op.n)} 张`); break;
      case 'addHand': parts.push(`将 ${op.n ?? 1} 张牌置入手牌`); break;
      case 'addDiscard': parts.push(`将 ${op.n ?? 1} 张牌置入弃牌堆`); break;
      case 'addDeck': parts.push('将一张牌永久加入牌组'); break;
      case 'shuffleIn': parts.push(`将 ${op.n ?? 1} 张牌洗入抽牌堆`); break;
      case 'exhaustSelf': parts.push('消耗此牌'); break;
      case 'retainSelf': parts.push('此牌本回合保留'); break;
      case 'removeCard': parts.push('从牌组中移除一张牌'); break;
      case 'upgradeCard': parts.push(`升级牌组中 ${op.n ?? 1} 张牌`); break;
      case 'repeat': parts.push(`重复 ${val(op.n)} 次：${describe(op.then)}`); break;
      case 'if': {
        const c = COND[op.cond?.type] ? COND[op.cond.type](op.cond) : '满足条件';
        const t = op.then?.length ? describe(op.then) : '';
        const e = op.else?.length ? `；否则：${describe(op.else)}` : '';
        parts.push(`若${c}，${t}${e}`);
        break;
      }
      case 'custom': {
        const d = CUSTOM_T[op.fn];
        parts.push(typeof d === 'function' ? d(op) : (d || '特殊效果'));
        break;
      }
      default: break;
    }
  }
  return parts.join('。') + (parts.length ? '。' : '');
}

/** 描述中的数字高亮（返回 HTML） */
export function decorate(text) {
  return String(text || '')
    .replace(/(\d+)(?![a-zA-Z%])/g, '<em>$1</em>')
    .replace(/(【[^】]*】)/g, '<b>$1</b>');
}
