import { el, clear } from '../../core/utils.js';
import { panel, toast, sectionTitle } from '../fx.js';
import { choiceEl } from '../components.js';
import { applyRunEffects, formatLog } from '../../systems/outcome.js';
import { ALL_EVENTS, eventDef, relic as relicDef, potion as potionDef, card as cardDef } from '../../data/index.js';
import { grantRelic, grantPotion, rollRelicReward, rollPotionReward, addCard } from '../../core/run.js';
import { isUnlocked } from '../../systems/meta.js';
import { findNode } from '../../systems/map.js';

export function renderEvent({ app, root, params, onDispose }) {
  const run = app.run;
  if (!run) { app.goto('map'); return; }
  const nodeId = params.nodeId || run.map.currentId;

  // 为该节点确定一个事件（同一节点固定）
  if (!run.eventSeed) run.eventSeed = {};
  if (!run.eventSeed[nodeId]) {
    const act = run.act;
    const node = findNode(run.map, nodeId);
    const pool = ALL_EVENTS.filter((e) => (!e.act || e.act === act) && (!e.regionId || e.regionId === run.map.regionId));
    const ev = eventDef(node?.eventId) || run.rng.pick(pool.length ? pool : ALL_EVENTS);
    run.eventSeed[nodeId] = ev?.id;
  }
  const ev = eventDef(run.eventSeed[nodeId]) || ALL_EVENTS[0];

  run.eventOutcomes ||= {};
  let outcome = run.eventOutcomes[nodeId] || null;
  let active = true;
  onDispose?.(() => { active = false; });
  root.append(app.hud());
  const scroll = el('div', { class: 'scroll' });
  const wrap = el('div', { class: 'wrap-narrow' });
  scroll.append(wrap);
  root.append(scroll);

  function checkReq(req) {
    if (!req) return { ok: true };
    if (req.gold != null && run.gold < req.gold) return { ok: false, why: `需要 ${req.gold} 金币` };
    if (req.hpBelow != null && run.hp / run.maxHp >= req.hpBelow) return { ok: false, why: `生命需低于 ${Math.round(req.hpBelow * 100)}%` };
    if (req.deckSizeAbove != null && run.deck.length <= req.deckSizeAbove) return { ok: false, why: `牌组需超过 ${req.deckSizeAbove} 张` };
    if (req.deckSizeBelow != null && run.deck.length >= req.deckSizeBelow) return { ok: false, why: `牌组需少于 ${req.deckSizeBelow} 张` };
    if (req.relic && !run.relics.includes(req.relic)) return { ok: false, why: `需要持有 ${relicDef(req.relic)?.name || req.relic}` };
    if (req.noRelic && run.relics.includes(req.noRelic)) return { ok: false, why: `不能持有 ${relicDef(req.noRelic)?.name || req.noRelic}` };
    if (req.curseOnly) {
      const hasCurse = run.deck.some((c) => cardDef(c.id)?.rarity === 'curse');
      if (!hasCurse) return { ok: false, why: '需要牌组中至少有 1 张诅咒牌' };
    }
    return { ok: true };
  }

  function renderIntro() {
    clear(wrap);
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '10px 0 4px' } },
        el('div', { class: 'big-glyph' }, ev.glyph || '❓'),
        el('h2', { style: { fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '5px', margin: '6px 0' } }, ev.name),
      ),
      panel(null, el('p', { style: { fontSize: '15px', lineHeight: '1.95', margin: 0, whiteSpace: 'pre-line' }, text: ev.text })),
      el('div', { class: 'hint', style: { textAlign: 'center', margin: '14px 0 6px' } }, '你会怎么做？'),
    );

    const row = el('div', { class: 'choice-row' });
    for (const opt of ev.options || []) {
      const chk = checkReq(opt.req);
      row.append(choiceEl({
        name: opt.label,
        desc: opt.desc,
        req: chk.ok ? (opt.req ? '· 可选' : null) : `✕ ${chk.why}`,
        disabled: !chk.ok,
        onClick: () => doChoose(opt),
      }));
    }
    wrap.append(row);
    if (!(ev.options || []).length) setTimeout(() => backToMap(), 400);
  }

  function doChoose(opt) {
    if (!active || app.run !== run || run.eventOutcomes[nodeId]) return;
    const chk = checkReq(opt.req);
    if (!chk.ok) { toast(chk.why, 'bad'); return; }
    outcome = { choice: ev.options.indexOf(opt), log: [], lootNotes: [] };
    run.eventOutcomes[nodeId] = outcome;
    const result = opt.result || {};
    const { log } = applyRunEffects(run, result.effects);
    outcome.log = log;
    const lootNotes = outcome.lootNotes;
    const loot = result.loot || {};

    if (loot.gold) {
      const g = run.rng.int(loot.gold[0], loot.gold[1]);
      run.gold += g; run.stats.goldEarned += Math.max(0, g);
      lootNotes.push(`获得 ${g} 金币`);
    }
    if (loot.heal) {
      const h = run.rng.int(loot.heal[0], loot.heal[1]);
      const before = run.hp;
      run.hp = Math.min(run.maxHp, run.hp + h);
      lootNotes.push(`回复 ${run.hp - before} 点生命`);
    }
    if (loot.damage) {
      const d = run.rng.int(loot.damage[0], loot.damage[1]);
      const before = run.hp;
      run.hp = Math.max(1, run.hp - d);
      lootNotes.push(`失去 ${Math.min(d, before - 1)} 点生命`);
    }
    if (loot.potions) {
      const n = run.rng.int(loot.potions[0], loot.potions[1]);
      let got = 0;
      for (const p of rollPotionReward(run, n)) if (grantPotion(run, p.id)) got++;
      if (got) lootNotes.push(`获得 ${got} 瓶药水`);
    }

    if (run.hp <= 0) {
      run.hp = 1;
      setTimeout(() => { toast('你已经站不稳了', 'bad'); }, 400);
    }
    app.save();
    app.rerender();
  }

  function openReward(step) {
    if (!active || app.run !== run) return;
    app.goto('reward', { from: 'event', step, count: 1, nodeId });
  }

  function renderResult() {
    const result = ev.options[outcome.choice]?.result || {};
    const loot = result.loot || {};
    const log = outcome.log;
    const lootNotes = outcome.lootNotes;

    clear(wrap);
    wrap.append(
      el('div', { style: { textAlign: 'center', padding: '10px 0 4px' } },
        el('div', { class: 'big-glyph' }, '✦'),
      ),
      panel(null,
        el('p', { style: { fontSize: '15.5px', lineHeight: '1.95', margin: 0, whiteSpace: 'pre-line' }, text: result.text || '……' }),
        formatLog(log) ? el('div', { class: 'divider' }) : null,
        formatLog(log) ? el('div', { class: 'hint', style: { whiteSpace: 'pre-line', lineHeight: 1.8 } }, formatLog(log)) : null,
        lootNotes.length ? el('div', { class: 'divider' }) : null,
        lootNotes.length ? el('div', { style: { color: 'var(--sulfur)' } }, lootNotes.join(' · ')) : null,
      ),
    );

    const btns = el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '18px' } });
    if (loot.cards) btns.append(el('button', {
      class: 'btn primary', onclick: () => openReward('card'),
    }, '查看奖励卡牌'));
    if (loot.relics) btns.append(el('button', {
      class: 'btn primary', onclick: () => openReward('relic'),
    }, '取走遗物'));
    if (!btns.children.length) btns.append(el('button', { class: 'btn primary', onclick: backToMap }, '继续'));
    else btns.append(el('button', { class: 'btn ghost', onclick: backToMap }, '不拿了，继续'));
    wrap.append(btns);

  }

  function backToMap() {
    if (!active || app.run !== run) return;
    app.afterNode();
  }

  if (outcome) renderResult();
  else renderIntro();
}
