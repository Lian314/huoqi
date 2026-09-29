// 种子化随机数：保证一局游戏可完整复现
// mulberry32 —— 快速、分布足够好、状态只有 32 位

export class RNG {
  constructor(seed = 1) {
    this.seed = seed >>> 0 || 1;
    this.calls = 0;
  }

  /** [0,1) */
  next() {
    this.calls++;
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** [min,max] 整数 */
  int(min, max) {
    if (max === undefined) { max = min; min = 0; }
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** [min,max) 浮点 */
  float(min, max) {
    return this.next() * (max - min) + min;
  }

  /** 概率判定 */
  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** 洗牌（返回新数组） */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** 不重复抽取 n 个 */
  sample(arr, n) {
    return this.shuffle(arr).slice(0, Math.min(n, arr.length));
  }

  /** 加权抽取 items 数组，weightFn 默认取 .weight */
  weighted(items, weightFn = (x) => x.weight ?? 1) {
    const valid = items.filter((x) => x && weightFn(x) > 0);
    if (valid.length === 0) return undefined;
    let total = 0;
    for (const it of valid) total += weightFn(it);
    let roll = this.next() * total;
    for (const it of valid) {
      roll -= weightFn(it);
      if (roll <= 0) return it;
    }
    return valid[valid.length - 1];
  }

  /** [min,max] 近似正态（用于奖励数值浮动） */
  around(center, spread) {
    const u = (this.next() + this.next() + this.next()) / 3;
    return Math.max(1, Math.round(center + (u - 0.5) * 2 * spread));
  }

  fork(salt = 0) {
    return new RNG((this.seed ^ ((salt + 1) * 0x9e3779b9)) >>> 0);
  }

  state() {
    return { seed: this.seed, calls: this.calls };
  }
}

let globalRng = new RNG((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);

export function getRng() { return globalRng; }
export function setRng(rng) { globalRng = rng; return globalRng; }
export function newRunRng(seed) {
  globalRng = new RNG(seed);
  return globalRng;
}

export function makeSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function seedToText(seed) {
  const words = ['灰烬', '锈铁', '潮汐', '硫火', '断塔', '夜航', '苍白', '裂隙',
    '铜钥', '荒原', '深潜', '低语', '拾骨', '落星', '雾锁', '旧誓'];
  const a = words[seed % words.length];
  const b = words[(seed >>> 8) % words.length];
  const n = (seed >>> 16) % 1000;
  return `${a}${b}·${n}`;
}
