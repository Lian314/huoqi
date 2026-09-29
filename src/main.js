// 入口
import { App } from './ui/app.js';
import { toast } from './ui/fx.js';
import { $ } from './core/utils.js';

function boot() {
  const root = $('#app');
  if (!root) { console.error('#app 未找到'); return; }

  // 背景余烬
  spawnEmbers();

  const app = new App(root);
  window.__APP__ = app;

  window.addEventListener('error', (e) => {
    console.error('[全局错误]', e.error || e.message);
    toast('出错了：' + (e.error?.message || e.message), 'bad', 3600);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[未处理的 Promise]', e.reason);
  });

  app.start();
}

function spawnEmbers() {
  const layer = document.querySelector('.bg-embers');
  if (!layer) return;
  const n = window.innerWidth < 700 ? 14 : 26;
  for (let i = 0; i < n; i++) {
    const i2 = document.createElement('i');
    i2.style.left = `${Math.random() * 100}%`;
    i2.style.animationDuration = `${9 + Math.random() * 14}s`;
    i2.style.animationDelay = `${Math.random() * 12}s`;
    const s = 1.5 + Math.random() * 2.5;
    i2.style.width = `${s}px`;
    i2.style.height = `${s}px`;
    i2.style.opacity = `${0.3 + Math.random() * 0.5}`;
    if (Math.random() < 0.25) i2.style.background = '#e5a50a';
    layer.append(i2);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
