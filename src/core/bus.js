// 极简事件总线
export class Bus {
  constructor() { this.map = new Map(); }
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }
  once(type, fn) {
    const off = this.on(type, (p) => { off(); fn(p); });
    return off;
  }
  off(type, fn) { this.map.get(type)?.delete(fn); }
  emit(type, payload) {
    for (const fn of Array.from(this.map.get(type) || [])) {
      try { fn(payload); } catch (e) { console.error(`[bus:${type}]`, e); }
    }
    for (const fn of Array.from(this.map.get('*') || [])) {
      try { fn({ type, payload }); } catch (e) { console.error('[bus:*]', e); }
    }
  }
  clear() { this.map.clear(); }
}

export const bus = new Bus();
