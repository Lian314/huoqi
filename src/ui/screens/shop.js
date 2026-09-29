import { el, clear } from '../../core/utils.js';
import { panel, toast, sectionTitle, statBox, confirmDialog, modal } from '../fx.js';
import { cardEl, choiceEl, relicChipEl } from '../components.js';
import { ALL_CARDS, ALL_RELICS, ALL_POTIONS, card as cardDef, relic as relicDef, potion as potionDef, RARITY_LABEL } from '../../data/index.js';
import { grantRelic, grantPotion, addCard, removeCardAt, upgradeCardAt } from '../../core/run.js';
import { isUnlocked } from '../../systems/meta.js';
import { relicHook } from '../../systems/effects.js';
import { makeRunCtx } from '../../systems/outcome.js';

const CARD_PRICE = { common: [45, 62], uncommon: [72, 96], rare: [128, 165] };
const RELIC_PRICE = { common: [140, 180], uncommon: [220, 275], rare: [300, 375], boss: [420, 500] };
const POTION_PRICE = { common: [45, 60], uncommon: [70, 92], rare: [105, 135] };

export function renderShop({ app, root, params }) {
  const run = app.run;
  const b = app.bonuses;
  const nodeId = params.nodeId;

  if (!run.shopState || run.shopState.node !== nodeId) {
    const mult = (1 - Math.min(0.55, b.shopDiscount));
    const cards = [];
    const wantCards = 5 + b.shopCardsBonus;
    const pool = ALL_CARDS.filter((c) => ['common', 'uncommon', 'rare'].includes(c.rarity) && c.rarity !== 'curse');
    for (let i = 0; i < wantCards; i++) {
      const roll = run.rng.next();
      const rarity = roll < 0.62 ? 'common' : roll < 0.9 ? 'uncommon' : 'rare';
      const cands = pool.filter((c) => c.rarity === rarity);
      const c = run.rng.pick(cands);
      if (!c) continue;
      const [lo, hi] = CARD_PRICE[rarity];
      cards.push({ id: c.id, price: Math.round(run.rng.int(lo, hi) * mult), sold: false });
    }
    const relics = [];
    const rpool = ALL_RELICS.filter((r) => r.rarity !== 'starter' && !['relic_ember_heart', 'relic_copper_key', 'relic_salt_ledger', 'relic_tide_locket', 'relic_ash_charm'].includes(r.id) && !run.relics.includes(r.id));
    for (const r of run.rng.sample(rpool, 3)) {
      const [lo, hi] = RELIC_PRICE[r.rarity] || [150, 200];
      relics.push({ id: r.id, price: Math.round(run.rng.int(lo, hi) * mult), sold: false });
    }
    const potions = [];
    const ppool = Array.from(ALL_POTIONS);
    for (const p of run.rng.sample(ppool, 3)) {
      const [lo, hi] = POTION_PRICE[p.rarity] || [60, 90];
      potions.push({ id: p.id, price: Math.round(run.rng.int(lo, hi) * mult), sold: false });
    }
    run.shopState = { node: nodeId, cards, relics, potions, removeCost: 60 + run.stats.cardsRemoved * 25, removals: run.stats.cardsRemoved };
  }

  const shop = run.shopState;
  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap' });
  scroll.append(wrap);
  root.append(scroll);

  function render() {
    clear(wrap);
    wrap.append(el('div', { class: 'tavern-hero' },
      el('div', { class: 'big-glyph' }, '🧳'),
      el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '6px', margin: '6px 0 2px' } }, '游 商 货 担'),
      el('p', { style: { color: 'var(--fg-dim)' } }, '「挑吧。潮水不等人，我也不等你。」'),
    ));

    // 遗物
    const relicPanel = panel('遗 物');
    const rlist = el('div', { style: { display: 'grid', gap: '9px' } });
    for (const item of shop.relics) {
      const d = relicDef(item.id);
      if (!d) continue;
      rlist.append(el('div', { class: 'shop-item' },
        el('div', { class: 'icon', text: d.glyph || '🔩' }),
        el('div', { class: 'body' },
          el('div', { class: 'nm' }, d.name, ' ', el('span', { class: 'tagline' }, RARITY_LABEL[d.rarity])),
          el('div', { class: 'ds' }, d.desc),
        ),
        item.sold ? el('span', { class: 'tagline bad' }, '已售出')
          : el('button', {
            class: `btn sm ${run.gold >= item.price ? 'gold' : 'ghost'}`,
            disabled: run.gold < item.price,
            onclick: () => {
              run.gold -= item.price;
              grantRelic(run, d.id);
              item.sold = true;
              toast(`获得遗物：${d.name}`, 'gold');
              app.save(); render();
            },
          }, `💰 ${item.price}`),
      ));
    }
    if (!shop.relics.length) rlist.append(el('div', { class: 'hint' }, '今天的架子上没有像样的东西。'));
    relicPanel.append(rlist);
    wrap.append(relicPanel);

    // 药水
    const potPanel = panel('药 剂');
    const plist = el('div', { class: 'btn-grid' });
    for (const item of shop.potions) {
      const d = potionDef(item.id);
      if (!d) continue;
      plist.append(el('div', { class: 'shop-item' },
        el('div', { class: 'icon', text: d.glyph || '🧪' }),
        el('div', { class: 'body' },
          el('div', { class: 'nm' }, d.name),
          el('div', { class: 'ds' }, d.desc),
        ),
        item.sold ? el('span', { class: 'tagline bad' }, '已售')
          : el('button', {
            class: `btn sm ${run.gold >= item.price && run.potions.length < run.potionSlots ? 'gold' : 'ghost'}`,
            disabled: run.gold < item.price || run.potions.length >= run.potionSlots,
            onclick: () => {
              if (!grantPotion(run, d.id)) { toast('药水栏已满', 'bad'); return; }
              run.gold -= item.price; item.sold = true;
              toast(`获得 ${d.name}`, 'good');
              app.save(); render();
            },
          }, `💰 ${item.price}`),
      ));
    }
    potPanel.append(plist);
    if (run.potions.length >= run.potionSlots) potPanel.append(el('div', { class: 'hint', style: { marginTop: '8px' } }, '药水栏已满。'));
    wrap.append(potPanel);

    // 卡牌
    const cardPanel = panel('牌 张');
    const grid = el('div', { class: 'card-grid', style: { marginTop: '6px' } });
    for (const item of shop.cards) {
      const d = cardDef(item.id);
      if (!d) continue;
      const box = el('div', { style: { position: 'relative' } }, cardEl(d, { size: '' }));
      box.append(el('button', {
        class: `btn sm ${item.sold ? 'ghost' : run.gold >= item.price ? 'gold' : 'ghost'}`,
        style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '10px', zIndex: 6, minWidth: '72px' },
        disabled: item.sold || run.gold < item.price,
        onclick: () => {
          run.gold -= item.price;
          addCard(run, d.id);
          item.sold = true;
          toast(`获得卡牌：${d.name}`, 'good');
          app.save(); render();
        },
      }, item.sold ? '已购' : `💰 ${item.price}`));
      grid.append(box);
    }
    cardPanel.append(grid);
    wrap.append(cardPanel);

    // 服务
    const svc = el('div', { class: 'btn-grid', style: { marginTop: '4px' } });
    const canRemove = b.campfireRemove || run.deck.length > 5;
    svc.append(el('div', { class: 'shop-item' },
      el('div', { class: 'icon' }, '🪚'),
      el('div', { class: 'body' },
        el('div', { class: 'nm' }, '拆解服务'),
        el('div', { class: 'ds' }, b.campfireRemove ? '从牌组中永久移除一张牌。' : '（需要「拆解台」升级）'),
      ),
      el('button', {
        class: `btn sm ${run.gold >= shop.removeCost && b.campfireRemove ? 'gold' : 'ghost'}`,
        disabled: run.gold < shop.removeCost || !b.campfireRemove,
        onclick: () => openCardPicker('移除一张牌', (idx) => {
          const c = run.deck[idx];
          run.gold -= shop.removeCost;
          removeCardAt(run, idx);
          shop.removeCost += 25;
          toast(`拆解了【${cardDef(c.id)?.name}】`, 'gold');
          app.save(); render();
        }, canRemove),
      }, `💰 ${shop.removeCost}`),
    ));

    if (b.forgeUpgrade > 0) {
      const cost = 70 + run.stats.cardsPlayed * 0;
      svc.append(el('div', { class: 'shop-item' },
        el('div', { class: 'icon' }, '🔨'),
        el('div', { class: 'body' },
          el('div', { class: 'nm' }, '就地锻造'),
          el('div', { class: 'ds' }, '升级牌组中的一张牌。'),
        ),
        el('button', {
          class: `btn sm ${run.gold >= 70 ? 'gold' : 'ghost'}`,
          disabled: run.gold < 70,
          onclick: () => openCardPicker('升级一张牌', (idx) => {
            if (run.deck[idx].upgraded) { toast('这张牌已升级', 'bad'); return; }
            run.gold -= 70;
            upgradeCardAt(run, idx);
            toast('锻造完成', 'good');
            app.save(); render();
          }, true),
        }, '💰 70'),
      ));
    }
    if (run.hp < run.maxHp) {
      svc.append(el('div', { class: 'shop-item' },
        el('div', { class: 'icon' }, '🍶'),
        el('div', { class: 'body' },
          el('div', { class: 'nm' }, '热汤与烈酒'),
          el('div', { class: 'ds' }, `回复 ${Math.round(run.maxHp * 0.3)} 点生命。`),
        ),
        el('button', {
          class: `btn sm ${run.gold >= 45 ? 'gold' : 'ghost'}`,
          disabled: run.gold < 45,
          onclick: () => {
            run.gold -= 45;
            const before = run.hp;
            run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * 0.3));
            toast(`回复 ${run.hp - before} 点生命`, 'good');
            app.save(); render();
          },
        }, '💰 45'),
      ));
    }
    wrap.append(panel('附 赠 服 务', svc));

    wrap.append(el('div', { style: { textAlign: 'center', padding: '20px 0 34px' } },
      el('button', { class: 'btn primary xl', onclick: () => app.afterNode() }, '离开货摊'),
    ));
  }

  function openCardPicker(title, cb, onlyNotUpgraded = false) {
    const grid = el('div', { class: 'card-grid' });
    run.deck.forEach((inst, idx) => {
      if (onlyNotUpgraded && inst.upgraded) return;
      const d = cardDef(inst.id);
      if (!d) return;
      grid.append(cardEl(d, { size: '', onClick: () => { cb(idx); } }));
    });
    if (!grid.children.length) grid.append(el('div', { class: 'hint' }, '没有可选的牌。'));
    modal({ title, sub: '点击一张牌', body: grid, actions: [{ label: '取消', kind: 'ghost' }] });
  }

  render();
}
