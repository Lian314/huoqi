// ============ 状态效果定义 ============
// decay:
//   'turn'  每回合结束层数 -1（易伤/虚弱/中毒/再生/金属化…）
//   'none'  永不衰减（力量/敏捷/荆棘/仪式…）
//   'untilCleared' 固定回合数，归零即移除
// bad: 是否为负面状态（受「神器」抵挡、影响 AI 意图）

export const STATUS = {
  strength:      { name: '力量',   glyph: '力', color: '#ff6b5a', decay: 'none', bad: false, desc: '每次攻击额外造成等量伤害。' },
  dexterity:     { name: '敏捷',   glyph: '敏', color: '#5ad1a0', decay: 'none', bad: false, desc: '每次获得格挡时额外获得等量格挡。' },
  vulnerable:    { name: '易伤',   glyph: '裂', color: '#ff8fb1', decay: 'turn', bad: true,  desc: '受到的攻击伤害提升 50%，回合结束 -1。' },
  weak:          { name: '虚弱',   glyph: '弱', color: '#9aa4b2', decay: 'turn', bad: true,  desc: '造成的攻击伤害降低 25%，回合结束 -1。' },
  frail:         { name: '脆骨',   glyph: '脆', color: '#b9a3e3', decay: 'turn', bad: true,  desc: '获得的格挡降低 25%，回合结束 -1。' },
  poison:        { name: '中毒',   glyph: '毒', color: '#7bd66b', decay: 'turn', bad: true,  desc: '回合结束受到等量伤害（无视格挡），随后层数 -1。' },
  burn:          { name: '灼烧',   glyph: '灼', color: '#ff9a3c', decay: 'none', bad: true,  desc: '每回合结束受到等量伤害，不衰减。' },
  thorns:        { name: '荆棘',   glyph: '棘', color: '#c98b4b', decay: 'none', bad: false, desc: '受到攻击时对攻击者造成等量伤害。' },
  regen:         { name: '再生',   glyph: '生', color: '#63e6b8', decay: 'turn', bad: false, desc: '回合结束恢复等量生命，随后层数 -1。' },
  artifact:      { name: '神器',   glyph: '器', color: '#d9c27a', decay: 'turn', bad: false, desc: '抵消接下来等量次负面状态。' },
  metallicize:   { name: '金属化', glyph: '金', color: '#e6c27a', decay: 'none', bad: false, desc: '回合结束获得等量格挡。' },
  ritual:        { name: '仪式',   glyph: '仪', color: '#a06cd5', decay: 'none', bad: false, desc: '每回合开始获得等量力量。' },
  intangible:    { name: '虚化',   glyph: '虚', color: '#8fd6ff', decay: 'turn', bad: false, desc: '受到的所有伤害 -1，回合结束 -1。' },
  entangled:     { name: '缠绕',   glyph: '缠', color: '#a0b0c0', decay: 'turn', bad: true,  desc: '每回合抽牌数减少等量（不低于 0），回合结束 -1。' },
  barricade:     { name: '壁垒',   glyph: '垒', color: '#cfa96a', decay: 'none', bad: false, desc: '格挡在回合结束时不再消失。' },
  echo:          { name: '回响',   glyph: '响', color: '#67c8ff', decay: 'none', bad: false, desc: '本回合内打出的牌效果再次触发一次（每张牌一次）。' },
  focus:         { name: '专注',   glyph: '专', color: '#ffd166', decay: 'turn', bad: false, desc: '下 N 张牌费用 -1。' },
  resolve:       { name: '坚毅',   glyph: '毅', color: '#8ecae6', decay: 'turn', bad: false, desc: '受到致命伤害时保留 1 点生命并消耗 1 层。' },
  overload:      { name: '超载',   glyph: '载', color: '#ff7a7a', decay: 'none', bad: false, desc: '每回合额外抽 N 张牌（抽牌上限提高）。' },
  mark:          { name: '标记',   glyph: '标', color: '#ff6ba8', decay: 'none', bad: true,  desc: '被标记的目标受到你造成的伤害额外 +N，不随回合衰减。' },
  bind:          { name: '束缚',   glyph: '缚', color: '#7f9cf5', decay: 'turn', bad: true,  desc: '获得格挡的数值减少等量，回合结束 -1。' },
  haste:         { name: '迅捷',   glyph: '疾', color: '#7ef0d0', decay: 'none', bad: false, desc: '每回合开始额外抽 N 张牌。' },
  fury:          { name: '暴怒',   glyph: '怒', color: '#ff5d3b', decay: 'none', bad: false, desc: '每打出一张攻击牌，对随机敌人造成 1 点伤害。' },
  drain:         { name: '蚀骨',   glyph: '蚀', color: '#9b6bff', decay: 'turn', bad: true,  desc: '回合结束受到等量伤害并回复等量生命，层数向下取半。' },
  siege:         { name: '攻城',   glyph: '城', color: '#e07a5f', decay: 'none', bad: true,  desc: '受到的伤害额外 +N。' },
  hollow:        { name: '空壳',   glyph: '空', color: '#6c757d', decay: 'turn', bad: true,  desc: '格挡上限降为 1，回合结束 -1。' },
  static:        { name: '静电',   glyph: '电', color: '#ffe066', decay: 'turn', bad: false, desc: '回合结束获得 N 点能量。' },
  shroud:        { name: '帷幕',   glyph: '幕', color: '#4d908e', decay: 'none', bad: false, desc: '敌人意图有 25% 概率被隐藏。' },
  leech:         { name: '汲取',   glyph: '汲', color: '#c44dff', decay: 'none', bad: false, desc: '每打出一张攻击牌，恢复 1 点生命。' },
  splinter:      { name: '碎裂',   glyph: '碎', color: '#adb5bd', decay: 'none', bad: false, desc: '每回合首次格挡归零时，保留 1 点格挡。' },
};

export const STATUS_IDS = Object.keys(STATUS);

/** 状态是负面吗（数据里的 debuff 会自动取反） */
export function isBadStatus(id) { return !!STATUS[id]?.bad; }

/** 归一化：最多 999 层，最少 0 */
export function normStacks(n) { return Math.max(0, Math.min(999, Math.round(n || 0))); }
