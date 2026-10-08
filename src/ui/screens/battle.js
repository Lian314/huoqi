import { el, clear, delay } from '../../core/utils.js';
import { toast, modal, popAt, flashNode, slashFx, panel } from '../fx.js';
import { cardEl, instCardEl, combatantEl, updateCombatant, potionBtnEl, TYPE_LABEL } from '../components.js';
import { playCard, endTurn, canPlay, cardCost, usePotion, refreshIntents, potionDisplay } from '../../systems/battle.js';
import { cardDisplay } from '../../core/run.js';
import { card as cardDef, potion as potionDef } from '../../data/index.js';

const INTENT_NAME = {
  attack: '攻击', attackDefend: '攻/防', defend: '防御', buff: '强化', attackBuff: '攻/强',
  debuff: '削弱', attackDebuff: '攻/削', unknown: '不明', sleep: '未醒', stun: '失能',
};

export function renderBattle({ app, root, onDispose }) {
  const run = app.run;
  const battle = app.battle;
  if (!battle || !run) { app.goto('map'); return; }

  let busy = false;
  let disposed = false;
  let endTimer = null;
  const isActive = () => !disposed && app.run === run && app.battle === battle;
  let targeting = null;     // {instUid, def}
  let hoveredEnemy = null;
  const nodes = { enemies: new Map(), log: null, hand: null, energy: null, piles: null, potions: null, powers: null };

  /* ---------- 结构 ---------- */
  const makeHud = () => app.hud({ showDeck: true, right: el('span', { class: 'act-chip' }, battle.tier === 'boss' ? '首领战' : battle.tier === 'elite' ? '精英战' : `第 ${battle.turn} 回合`) });
  let hud = makeHud();
  root.append(hud);
  if (battle.region) root.append(el('div', { class: 'battle-region-strip' },
    el('b', {}, battle.region.name),
    el('span', {}, battle.encounterName),
    battle.siteWave ? el('b', {}, `试炼 ${battle.siteWave}`) : null,
    el('span', { title: battle.region.rule.text }, `${battle.region.rule.name} · ${battle.region.rule.text}`),
    battle.blessings.length ? el('span', {}, battle.blessings.map((entry) => entry.name).join(' · ')) : null,
  ));

  const screen = el('div', { class: 'battle' });
  root.append(screen);

  const banner = el('div', {
    style: {
      position: 'absolute', inset: '0', display: 'none', placeItems: 'center',
      background: 'rgba(4,6,8,.55)', zIndex: '50', pointerEvents: 'none',
    },
  }, el('div', {
    style: {
      fontFamily: 'var(--font-display)', fontSize: '30px', letterSpacing: '10px',
      color: '#ff6b35', textShadow: '0 0 30px rgba(255,107,53,.7)',
    },
  }, '敌方回合'));
  screen.append(banner);

  const arena = el('div', { class: 'battle-arena' });
  const actNum = Math.min(6, Math.max(1, run?.act || 1));
  arena.style.backgroundImage = `linear-gradient(rgba(10,12,15,.6), rgba(10,12,15,.75)), url('/assets/backgrounds/bg_act${actNum}.jpg')`;
  arena.style.backgroundSize = 'cover';
  arena.style.backgroundPosition = 'center';
  screen.append(arena);
  arena.append(el('div', { class: 'arena-band' }));

  // 战斗日志
  const logBox = el('div', { class: 'battle-log' });
  nodes.log = logBox;
  arena.append(logBox);

  // 敌方
  const enemyRow = el('div', { class: 'enemy-row' });
  arena.append(enemyRow);

  // 场上力量牌
  nodes.powers = el('div', {
    style: { position: 'absolute', left: '16px', bottom: '210px', display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '240px', zIndex: 6 },
  });
  arena.append(nodes.powers);

  // 玩家面板
  const playerPanel = el('div', { class: 'player-panel' });
  const energyOrb = el('div', { class: 'energy-orb' });
  nodes.energy = energyOrb;
  playerPanel.append(energyOrb);
  const pName = el('div', { class: 'p-name' }, run.charName);
  const pHp = el('div', { class: 'cbt-hpnum mono' });
  const pHead = el('div', { class: 'p-head' }, pName, pHp);
  const pBar = el('div', { class: 'hpbar' });
  const pPiles = el('div', { class: 'piles' });
  nodes.piles = pPiles;
  const pPotions = el('div', { class: 'potion-strip', style: { marginTop: '9px', flexWrap: 'wrap' } });
  nodes.potions = pPotions;
  playerPanel.append(pHead, pBar, pPiles, pPotions);
  arena.append(playerPanel);
  const pNode = playerPanel;
  pNode._uid = 'player';

  // 手牌 + 结束回合
  const handZone = el('div', { class: 'hand-zone' });
  const hand = el('div', { class: 'hand' });
  nodes.hand = hand;
  const endTurnControl = el('button', { class: 'btn primary', onclick: onEndTurn }, '结束回合');
  handZone.append(hand);
  handZone.append(el('div', { class: 'endturn-wrap' },
    endTurnControl,
    el('button', { class: 'btn sm ghost', onclick: () => app.openDeck() }, '牌组'),
  ));
  screen.append(handZone);

  const targetHint = el('div', { class: 'target-hint', style: { display: 'none' } }, el('span', {}, '选择一个目标'));
  screen.append(targetHint);

  /* ---------- 同步 ---------- */
  function syncEnemies() {
    const alive = battle.enemies;
    // 移除死亡节点
    for (const [uid, node] of nodes.enemies) {
      if (!alive.find((e) => e.uid === uid)) { node.remove(); nodes.enemies.delete(uid); }
    }
    alive.forEach((e, i) => {
      let node = nodes.enemies.get(e.uid);
      const canTarget = !!targeting && e.hp > 0;
      if (!node) {
        node = combatantEl(e, {
          targetable: canTarget,
          onClick: () => onEnemyClick(e),
          onHover: () => { hoveredEnemy = e.uid; highlightLinks(true); },
        });
        node.addEventListener('pointerleave', () => { if (hoveredEnemy === e.uid) { hoveredEnemy = null; highlightLinks(false); } });
        nodes.enemies.set(e.uid, node);
        enemyRow.append(node);
      } else {
        updateCombatant(node, e);
        node.classList.toggle('targetable', canTarget);
        node.classList.toggle('hovered', hoveredEnemy === e.uid);
      }
    });
    // 排序（死亡的排后面）
    alive.forEach((e) => {
      const n = nodes.enemies.get(e.uid);
      if (n) enemyRow.append(n);
    });
  }

  function highlightLinks(on) {
    for (const c of hand.children) c.style.filter = on ? 'drop-shadow(0 0 6px rgba(255,107,53,.6))' : '';
  }

  function syncPlayer() {
    const p = battle.player;
    run.hp = p.hp;
    run.maxHp = p.maxHp;
    const pct = p.maxHp > 0 ? Math.max(0, p.hp / p.maxHp) : 0;
    pHp.textContent = `${p.hp} / ${p.maxHp}`;
    const fill = pBar.querySelector('.hp') || pBar.appendChild(el('i', { class: 'hp' }));
    fill.style.width = `${pct * 100}%`;
    fill.classList.toggle('low', pct < .34);
    let blockChip = pBar.querySelector('.blockchip');
    if (p.block > 0) {
      if (!blockChip) {
        blockChip = el('div', { class: 'blockchip' });
        pBar.append(blockChip);
      }
      blockChip.textContent = `⛨ ${p.block}`;
    } else {
      blockChip?.remove();
    }
    pName.textContent = run.charName;
    energyOrb.innerHTML = `${battle.energy}<small>/${battle.maxEnergy}</small>`;

    clear(pPiles);
    pPiles.append(
      el('div', { class: 'pile' }, el('b', {}, String(battle.draw.length)), '抽牌'),
      el('div', { class: 'pile' }, el('b', {}, String(battle.discard.length)), '弃牌'),
      el('div', { class: 'pile' }, el('b', {}, String(battle.exhaustPile.length)), '消耗'),
    );

    clear(pPotions);
    for (let i = 0; i < run.potionSlots; i++) {
      const pid = run.potions[i];
      const d = pid ? potionDisplay(run, potionDef(pid)) : null;
      pPotions.append(potionBtnEl(d, { disabled: busy || battle.phase !== 'player', onClick: () => d && onUsePotion(d) }));
    }

    // 场上力量
    clear(nodes.powers);
    for (const p of battle.powers) {
      nodes.powers.append(el('div', {
        class: 'relic-chip', style: { width: '26px', height: '26px', fontSize: '13px' },
        title: `力量牌：${p.name}`,
      }, p.glyph || p.name[0]));
    }
  }

  function syncHand() {
    clear(hand);
    for (const inst of battle.hand) {
      const def = cardDisplay(run, inst);
      if (!def) continue;
      const chk = canPlay(battle, inst);
      const hint = !busy && chk.ok && (!def.target || def.target === 'enemy');
      const shown = { ...def, cost: def.cost < 0 ? def.cost : cardCost(battle, def) };
      const node = cardEl(shown, {
        disabled: !chk.ok || busy,
        hint,
        onClick: () => onCardClick(inst, def),
        onHover: () => {},
      });
      node._inst = inst;
      hand.append(node);
    }
  }

  function syncLog() {
    if (!logBox) return;
    clear(logBox);
    for (const l of battle.log.slice(-40)) logBox.append(el('div', { class: l.kind || '', text: l.text }));
    logBox.scrollTop = logBox.scrollHeight;
  }

  function sync() {
    if (!isActive()) return;
    refreshIntents(battle);
    syncEnemies(); syncPlayer(); syncHand(); syncLog();
    endTurnControl.disabled = busy || battle.phase !== 'player';
    const nextHud = makeHud();
    hud.replaceWith(nextHud);
    hud = nextHud;
  }

  /* ---------- 交互 ---------- */
  function onCardClick(inst, def) {
    if (!isActive() || busy || battle.phase !== 'player' || targeting) return;
    const chk = canPlay(battle, inst);
    if (!chk.ok) { toast(chk.why || '无法打出', 'bad'); return; }
    if (def.target === 'enemy') {
      targeting = { instUid: inst.uid, def };
      targetHint.style.display = 'grid';
      syncEnemies(); syncHand();
      return;
    }
    return doPlay(inst.uid, null);
  }

  function onEnemyClick(e) {
    if (!isActive() || busy || battle.phase !== 'player' || !targeting || e.hp <= 0) return;
    if (targeting.potion) {
      const p = targeting.potion;
      targeting = null;
      targetHint.querySelector('span').textContent = '选择一个目标';
      targetHint.style.display = 'none';
      return resolveAction(() => usePotion(battle, p.id, e.uid));
    }
    const uid = targeting.instUid;
    targeting = null;
    targetHint.style.display = 'none';
    return doPlay(uid, e.uid);
  }

  function doPlay(uid, targetUid) {
    return resolveAction(() => playCard(battle, uid, targetUid));
  }

  async function resolveAction(action) {
    if (!isActive() || busy || battle.phase !== 'player') return;
    busy = true;
    try {
      sync();
      const res = await action();
      if (res?.ok === false) { toast(res.why || '无法使用', 'bad'); return; }
      if (!isActive()) return;
      sync();
      await pump();
      if (!isActive()) return;
      banner.style.display = 'none';
      sync();
      if (checkEnd()) return;
      await processPending();
    } catch (e) {
      console.error('[battle-ui]', e);
      toast('操作未完成', 'bad');
    } finally {
      busy = false;
      banner.style.display = 'none';
      if (isActive()) { sync(); checkEnd(); }
    }
  }

  async function onEndTurn() {
    if (!isActive() || busy || battle.phase !== 'player') return;
    cancelTargeting();
    await resolveAction(async () => {
      for (const c of hand.children) c.style.transition = 'transform .3s ease, opacity .3s ease';
      hand.style.transition = 'opacity .3s';
      hand.style.opacity = '0';
      await delay(220);
      if (!isActive()) return;
      clear(hand);
      hand.style.opacity = '1';
      banner.style.display = 'grid';
      await delay(320);
      if (!isActive()) return;
      endTurn(battle);
    });
    banner.style.display = 'none';
  }

  async function onUsePotion(def) {
    if (!isActive() || busy || battle.phase !== 'player') return;
    if (def.target === 'target') {
      targeting = { potion: def };
      targetHint.querySelector('span').textContent = '为药水选择一个目标';
      targetHint.style.display = 'grid';
      syncEnemies();
      return;
    }
    cancelTargeting();
    await resolveAction(() => usePotion(battle, def.id, null));
  }

  function cancelTargeting() {
    targeting = null;
    targetHint.querySelector('span').textContent = '选择一个目标';
    targetHint.style.display = 'none';
  }

  // 目标型药水
  /* ---------- 预知（scry） ---------- */
  async function processPending() {
    while (isActive()) {
      if (checkEnd() || !battle.pending.length) return;
      const p = battle.pending.shift();
      if (p.kind === 'scry') {
        await doScry(p.n);
      }
    }
  }

  function doScry(n) {
    return new Promise((resolve) => {
      const top = battle.draw.slice(-n);
      if (!top.length) { resolve(); return; }
      const grid = el('div', { class: 'card-grid' });
      const done = new Set();
      let closed = false;
      const body = el('div', {},
        el('div', { class: 'hint', style: { textAlign: 'center', marginBottom: '12px' } }, `抽牌堆顶 ${top.length} 张：点击要弃掉的牌。`),
        grid,
      );
      top.forEach((inst) => {
        const node = cardEl(cardDisplay(run, inst), {
          onClick: () => {
            if (closed || !isActive() || battle.phase !== 'player') return;
            if (done.has(inst.uid)) {
              done.delete(inst.uid);
              node.classList.remove('disabled');
              return;
            }
            done.add(inst.uid);
            node.classList.add('disabled');
          },
        });
        grid.append(node);
      });
      modal({
        title: '预  知', sub: '窥视抽牌堆顶', body,
        onClose: () => { closed = true; resolve(); },
        actions: [{ label: '确认', kind: 'primary', onClick: () => {
          if (closed || !isActive() || battle.phase !== 'player') { resolve(); return; }
          for (const inst of top) {
            if (!done.has(inst.uid)) continue;
            const i = battle.draw.indexOf(inst);
            if (i >= 0) { battle.draw.splice(i, 1); battle.discard.push(inst); }
          }
          battle.log.push({ text: `你窥见了未来，弃掉了 ${done.size} 张牌。`, kind: 'info', turn: battle.turn });
          resolve();
        } }],
      });
    });
  }

  /* ---------- 特效 ---------- */
  async function pump() {
    const queue = battle.fx.splice(0, battle.fx.length);
    for (const f of queue) {
      if (!isActive()) return;
      const c = findC(f.uid);
      const node = c?.uid === 'player' ? pNode : (c ? nodes.enemies.get(c.uid) : null);
      switch (f.type) {
        case 'damage': {
          if (node) {
            const { x, y } = center(node);
            popAt(node, String(f.hpLost || f.blocked || 0), 'dmg');
            flashNode(node, 'dmg');
            slashFx(node);
            if (f.blocked > 0) setTimeout(() => popAt(node, `⛨${f.blocked}`, 'block'), 130);
          }
          break;
        }
        case 'block': if (node) popAt(node, `+${f.amount}`, 'block'); break;
        case 'heal': if (node) popAt(node, `+${f.amount}`, 'heal'); break;
        case 'status': if (node) popAt(node, `${f.delta > 0 ? '+' : ''}${f.delta}`, 'status'); break;
        case 'enemy-death': if (node) { node.style.transition = 'all .4s'; node.style.opacity = '0'; node.style.transform = 'scale(.7)'; } break;
        case 'maxhp': if (node) popAt(node, `最大生命 ${f.delta > 0 ? '+' : ''}${f.delta}`, 'heal'); break;
        case 'card-played': break;
        default: break;
      }
      syncEnemies();
      if (f.type === 'damage' || f.type === 'enemy-death') await delay(110);
    }
    syncLog();
  }

  function center() { return { x: 0, y: 0 }; }
  function findC(uid) {    if (uid === 'player') return battle.player;
    return battle.enemies.find((e) => e.uid === uid) || null;
  }

  /* ---------- 结束 ---------- */
  let ended = false;
  function checkEnd() {
    if (battle.phase !== 'won' && battle.phase !== 'lost') return false;
    battle.pending.length = 0;
    if (ended) return true;
    ended = true;
    const won = battle.phase === 'won';
    endTimer = setTimeout(() => { if (isActive()) app.onBattleEnd(won); }, 620);
    return true;
  }

  // 键盘：数字键出牌
  const onKey = (e) => {
    if (!isActive() || busy || battle.phase !== 'player') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;
    if (e.ctrlKey || e.altKey || e.metaKey || document.querySelector('#modal-root')?.children.length || app.root.querySelector('.deck-viewer')) return;
    if (e.key === 'Escape') { cancelTargeting(); sync(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      const inst = battle.hand[n - 1];
      if (inst) { const def = cardDisplay(run, inst); if (def) onCardClick(inst, def); }
    }
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); onEndTurn(); }
  };
  window.addEventListener('keydown', onKey);
  onDispose(() => {
    disposed = true;
    clearTimeout(endTimer);
    window.removeEventListener('keydown', onKey);
  });

  sync();
  if (!checkEnd() && battle.pending.length) {
    busy = true;
    sync();
    processPending().catch((error) => {
      console.error('[battle-ui]', error);
      toast('操作未完成', 'bad');
    }).finally(() => {
      busy = false;
      if (isActive()) { sync(); checkEnd(); }
    });
  }
}
