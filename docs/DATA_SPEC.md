# 数据层规范 v1 —— 所有 data/*.js 必须严格遵守

> 引擎（`src/systems/effects.js`）按下述 schema 执行。**任何超出的字段或 op 都会被忽略或报错。**
> 数据文件必须是**纯数据**：不 import 任何东西、不写函数、不用计算属性。全部用字面量。

---

## 通用：效果数组 `effects: [...]`

每张牌/药水/遗物/敌人招式/事件结果，效果都是一个**操作数组** `ops`。引擎按顺序执行。

### 1. 伤害 / 格挡 / 生命

| op | 字段 | 含义 |
|---|---|---|
| `damage` | `v` | 对目标造成伤害（受力量/易伤/虚弱/攻城/虚化影响） |
| `damageAll` | `v` | 对所有存活敌人造成伤害 |
| `block` | `v` | 获得格挡（受敏捷/脆骨/空壳影响） |
| `blockAll` | `v` | 获得格挡（单体，通常只用于自身） |
| `heal` | `n` | 回复生命（不超过最大生命） |
| `loseHp` | `n` | 直接扣血，**无视格挡** |
| `maxHp` | `n` | 永久提升最大生命（同时回复 n） |
| `doubleBlock` | — | 当前格挡翻倍 |
| `gold` | `n` | 获得金币 |

### 2. 状态
| op | 字段 | 含义 |
|---|---|---|
| `buff` | `s`, `v`, `t?` | 施加正面/中性状态 |
| `debuff` | `s`, `v`, `t?` | 施加负面状态（自动被「神器」抵挡） |

- `s`（status）必须是 `src/data/statuses.js` 中已存在的 key。
  可用：`strength dexterity vulnerable weak frail poison burn thorns regen artifact metallicize ritual intangible entangled barricade echo focus resolve overload mark bind haste fury drain siege hollow static shroud leech splinter`

> 注意：`slow`（迟缓）**不存在**，早期草稿里的这个名字已由 `drain`（蚀骨）取代。
> 引擎对未知 status 会打 warn 并静默跳过，不会报错——所以这类笔误必须靠 `tools/validate.js` 拦截。

- **反向也成立**：在 `statuses.js` 里新增状态时，必须同时在 `src/systems/` 或 `src/ui/` 中
  实现它文案承诺的机制。`tools/validate.js` 会扫描全部状态 id，只要某个状态在引擎/UI 中
  零引用，就判定为「只有文案的空壳」并报错。
  （历史上 `barricade` 壁垒、`splinter` 碎裂就是这样漏掉的：文案写得很清楚，引擎里一行都没有。）

- `t`（target）可选，缺省继承卡牌的 `target`。取值：`target`(卡牌指定) / `self` / `allEnemies` / `all` / `random`。
  事件、遗物钩子里没有"卡牌指定"，请显式写 `t`。

### 3. 抽牌 / 能量 / 牌库操作

| op | 字段 | 含义 |
|---|---|---|
| `draw` | `n` | 抽 n 张牌（弃牌堆空则洗回） |
| `energy` | `n` | 获得 n 点能量 |
| `scry` | `n` | 预知 n（可弃掉任意张） |
| `addHand` | `card`, `n?` | 把牌加入手牌 |
| `addDiscard` | `card`, `n?` | 把牌加入弃牌堆 |
| `addDeck` | `card` | 把牌永久加入牌组（战后奖励类） |
| `shuffleIn` | `card`, `n?` | 洗入抽牌堆（随机位置） |
| `exhaustSelf` | — | 消耗本牌 |
| `retainSelf` | — | 本回合保留此牌不弃 |
| `removeCard` | — | 从牌组永久随机移除一张牌（仅事件/遗物） |
| `upgradeCard` | `n?` | 随机升级牌组 n 张牌（仅事件/遗物） |

### 4. 控制流

| op | 字段 | 含义 |
|---|---|---|
| `repeat` | `n`, `then:[ops]` | 内层效果重复 n 次 |
| `if` | `cond`, `then:[ops]`, `else:[ops]` | 条件分支 |

`cond` 对象（全部为 `type` 判别）：

```
{type:'hpBelow', p:0.5}          生命低于最大生命的 50%
{type:'hpBelow', n:20}           生命低于 20
{type:'hpAbove', p:0.5}          生命高于 50%
{type:'hasStatus', s:'vulnerable', gte:2}
{type:'noStatus', s:'vulnerable'}
{type:'deckCount', card:'burn', gte:3}   牌组中该牌 >= 3 张
{type:'typePlayed', t:'attack', n:2}     本回合已打出该类型牌 >= 2 张
{type:'energy', n:0}             剩余能量 <= 0
{type:'handSize', n:2}           手牌数 <= 2
{type:'discardSize', n:2}        弃牌堆 <= 2
{type:'turn', n:1}               当前回合 <= 1
{type:'enemyCount', n:2}         存活敌人数 <= 2
{type:'chance', p:0.5}
{type:'firstCardOfTurn'}
{type:'lastCardPlayed'}
{type:'targetLow', p:0.4}        目标生命低于 40%
{type:'hasRelic', r:'ember_heart'}
```

### 5. 数值 token（`v` / `n` 位置可用）

| 写法 | 含义 |
|---|---|
| `6` | 常数 |
| `'S'` | 当前力量层数 |
| `'2S'` | 力量 × 2 |
| `'B'` | 当前格挡 |
| `'hand'` | 当前手牌数 |
| `'deck'` | 牌组总张数 |
| `'discard'` | 弃牌堆张数 |

> `'hand'` 按**打出瞬间**计，包含正在打出的这张牌。
> 「清空手牌中的炸药」「每有一张手牌」这类效果都应包含本张，否则单独打出时恒为 0。

#### ⚠ `damage` / `damageAll` 与 token 的关键陷阱

攻击伤害的公式是 **`最终伤害 = v + 力量层数`**（还要再过虚弱 / 易伤 / 遗物加成）。
所以当文案写的是「**等同于**你 X 的伤害」时，token 算出的值**已经是最终伤害**，
绝不能让它再被加一次力量。此时必须标 `raw:true`：

```js
// ✗ 错：文案说「等同于力量的伤害」，实际打出 2×力量
{op:'damage', v:'S'}

// ✓ 对：力量不再叠加，实际就是 1×力量
{op:'damage', v:'S', raw:true}

// ✓ 「等同于 2 倍力量的伤害」
{op:'damage', v:'2S', raw:true}
```

`raw:true` 只对 `damage` / `damageAll` 有意义。
`block` / `buff` / `debuff` / `heal` / `scry` 本就不叠力量，**不要**加。

**判定规则（`tools/validate.js` 强制执行）**：若卡面文案出现「等同于」或「等于」，
则该卡所有以 token 作 `v` 的 `damage` / `damageAll` 必须带 `raw:true`，反之亦然。
写文案时把「+N 点伤害」和「等同于 N 的伤害」区分清楚，就能自然对上。

### 6. 命名特殊效果 `custom`（白名单，务必只从这 8 个里选）

| fn | 附加字段 | 效果 |
|---|---|---|
| `shuffleDiscardToDeck` | — | 洗回整个弃牌堆 |
| `shuffleDrawPile` | — | 洗乱抽牌堆 |
| `doubleNextAttack` | — | 本场战斗下一张攻击牌伤害翻倍 |
| `healPerHandCard` | `n` | 每 1 张手牌回复 n 生命 |
| `burnPerCardInHand` | — | 手牌中每有一张牌，对随机敌人造成 2 点伤害 |
| `loseEnergyThenDraw` | `n` | 失去 n 能量后抽 2 张 |
| `grantRandomRelic` | — | 立刻获得一件随机遗物 |
| `convertDeckToBurn` | `p` | 把牌组中 p 比例的攻击牌转为「灼热挥砍」（仅事件） |

---

## 卡牌 `CARDS` (src/data/cards.js)

```js
{ id:'c_ember_slash',          // 唯一，前缀 c_
  name:'灼热挥砍',
  type:'attack',               // 'attack' | 'skill' | 'power' | 'curse'
  rarity:'common',             // 'common'|'uncommon'|'rare'|'special'|'curse'
  cost:1,                      // 0..4（power 可为 -1 = X 费）
  target:'enemy',              // 'enemy'|'allEnemies'|'self'|'none'
  tags:['火焰'],               // 用于「牌组中 X 张 Y」类效果
  text:'造成 6 点伤害。',        // 供 UI 展示，必须与 effects 一致
  effects:[{op:'damage', v:6}],
  exhaust:false,               // 打出即消耗
  ethereal:false,              // 若回合结束仍在手牌则消耗
  innate:false,                // 战斗开始必在起手
  retain:false,                // 回合结束保留
  playable:false,              // 诅咒牌专用：永远不能打出；其 effects 在【进入牌组的那一刻】自动结算一次
  upgrade:{                    // 升级后覆盖（不写的字段沿用原值）
    cost:0, text:'造成 9 点伤害。',
    effects:[{op:'damage', v:9}]
  },
  unlock:{embers:0}            // 0 = 默认可获得；>0 需在元进度中解锁
}
```

**关于 `playable:false`（诅咒牌）**

`playable:false` 的牌永远不会被 `playCard` 触发，因此它们的 `effects` 表达的是
「进入牌组时立刻结算一次」的入场代价，而不是打出后的效果。三条入场路径都会触发：

| 路径 | 触发点 |
|---|---|
| 局外获得（事件/奖励/商店/篝火） | `core/run.js` 的 `addCard()` |
| 战斗中获得 | `effects.js` 的 `addDeck` / `addHand` / `addDiscard` / `shuffleIn` |

因此 **诅咒牌的 `effects` 绝不能为空**——空 effects 意味着这张牌只在稀释牌组、
不给任何代价。`tools/validate.js` 会把这种卡判为错误。

若想要「可以打出、但打出即消耗」的诅咒牌，用 `rarity:'curse'` + `playable:true` +
`exhaust:true`，不要用 `playable:false`。
```

**要求**：
- `type:'power'` 的牌必须自解释、永久生效（引擎在打出时结算一次并保留在场）。
- 每个 `unlock.embers > 0` 的牌都必须是**强力且罕见**的。
- 至少 12 张牌带 `unlock`，分布在 uncommon/rare，作为元进度奖励。

## 角色 `CHARACTERS` (src/data/characters.js)

```js
{ id:'ch_ashborn', name:'烬裔', title:'锈锚酒馆老板',
  glyph:'🜂', color:'#ff6b5a', hp:72, gold:99,
  lore:'……',
  mechanic:'你的「灼烧」层数在战斗结束后不清空，下场战斗开始时保留一半。',
  relic:'relic_ember_heart',
  deck:['c_strike','c_strike','c_strike','c_strike','c_bash', ...], // 10 张
  unlock:{embers:0}
}
```
- 至少 4 个角色（1 个初始免费，其余 `unlock.embers > 0`）。
- 每个角色起手牌组必须**围绕该角色 mechanic**，且 10 张牌不能重复超过 4 张同名牌。

## 敌人 `ENEMIES` (src/data/enemies.js)

```js
{ id:'e_ghoul', name:'拾荒行尸', act:1, tier:'normal',   // 'normal'|'elite'|'boss'
  hp:[16,22], gold:[8,14],
  glyph:'🧟', color:'#7bd66b', size:'normal',          // 'small'|'normal'|'large'
  lore:'……',
  moves:[
    { id:'bite', name:'撕咬', intent:'attack', dmg:6, tell:'它张开了嘴。',
      weight:3, effects:[{op:'damage', v:6}] },
    { id:'howl', name:'嚎叫', intent:'debuff', weight:1,
      requireTurn:[2],                                   // 仅第 2 回合及以后
      effects:[{op:'debuff', s:'vulnerable', v:2, t:'all'}] }
  ],
  onDeath:[{op:'buff', s:'ritual', v:1, t:'all'}]        // 可选，作用于"存活同伴"
}
```

招式字段：
- `intent`：`attack` `attackDefend` `defend` `buff` `debuff` `attackDebuff` `attackBuff` `unknown` `sleep`(未醒) `stun`
- `dmg`：**必填**（UI 意图显示的伤害数字），要和 effects 里的实际伤害一致
- `weight`：权重，不填默认 1
- `requireTurn:[a,b]`：仅在第 a..b 回合可选
- `requireHpBelow:0.5` / `requireHpAbove:0.5`
- `requireStatusPlayer:{s:'vulnerable',gte:2}`
- `requireSelfStatus:{s:'ritual',gte:3}`
- `once:true` 仅一次
- `next:'moveId'` 选中后强制下一次
- `tell`：一句台词

**要求**：每幕 10 个普通敌人 + 3 个精英 + 1 个 Boss（3 幕 = 42 个），外加 2 个"前哨"杂兵。
精英/Boss 至少 2 阶段（用 `requireHpBelow` 切换招式），Boss 必须有 `next` 链或权重倾斜。

## 遗物 `RELICS` (src/data/relics.js)

```js
{ id:'relic_ember_heart', name:'余烬之心', rarity:'starter',
  glyph:'❤️', desc:'每场战斗开始时获得 1 层力量。',
  flavor:'还在跳。',
  hooks:{ onBattleStart:[{op:'buff', s:'strength', v:1, t:'self'}] },
  mod:{}                       // 见下
}
```

可用钩子（每个都是 ops 数组）：
`onRunStart` `onBattleStart` `onTurnStart` `onTurnEnd` `onCardPlay` `onAttack` `onBlock` `onKill` `onRest` `onShop` `onHpLost` `onDamageDealt` `onNodeEnter`

`mod` 数值修正（全部为加法，除注明外）：
```js
mod:{ damagePlus:1, blockPlus:1, energyPlus:1, maxHpPlus:5, goldPlus:25,
      handPlus:1, drawPlus:1, healPlus:2, cardRewardPlus:1, shopPriceMul:0.9,
      eliteDamagePlus:3, potionSlotsPlus:1, mapReveal:1, enemyHpMul:1 }
```

**要求**：共 40 件。rarity 分布：starter 4 / common 16 / uncommon 12 / rare 6 / boss 2。

## 药水 `POTIONS` (src/data/potions.js)

```js
{ id:'p_ember_tonic', name:'余烬药酒', rarity:'common',   // 'common'|'uncommon'|'rare'
  glyph:'🍶', color:'#ff9a3c', target:'none',            // 'self'|'target'|'none'
  desc:'回复 12 点生命，获得 2 层力量。',
  effects:[{op:'heal', n:12},{op:'buff', s:'strength', v:2, t:'self'}] }
```
共 24 瓶。

## 探索事件 `EVENTS` (src/data/events.js)

```js
{ id:'ev_old_ledger', name:'残破账本', glyph:'📜', act:1,
  text:'柜台的抽屉深处压着一本被虫蛀的账本……',
  options:[
    { label:'仔细研读',
      desc:'移除牌组中一张牌，并获得 30 金币。',
      req:{ gold:0 },                                   // 可选前置条件
      result:{ text:'你烧掉了那一页。',
               effects:[{op:'removeCard'},{op:'gold', n:30}] } },
    { label:'合上抽屉', result:{ text:'有些账不该算。' } }
  ] }
```
- `result.loot` 可选：`{ gold:[a,b], cards:1, relics:1, potions:[1,2], heal:[a,b], damage:[a,b] }`
  - `cards:1` = 走标准战后三选一奖励；`relics:1` = 三选一遗物
- `req` 可选：`{ gold:50, hpBelow:0.5, deckSizeAbove:20, relic:'xxx', noRelic:'xxx', curseOnly:true }`
- 共 24 个事件，按 `act` 分 1/2/3，另有 4 个 `act:0` 通用事件。

---

## 硬性规则

1. 所有 `id` 全局唯一，`c_` `ch_` `e_` `relic_` `p_` `ev_` 前缀区分。
2. 卡牌的 `target` 与 `effects` 中 `t:'target'` 的用法必须自洽：`target:'self'` 的牌不能写 `t:'target'`。
3. 不确定引擎是否支持 → **只用本文档写到的字段**。宁可少写一个效果，也不要写错 op 名。
4. 中文文案，风格：末世边境 + 硫火与蒸汽。避免"Assassin"式直译。
5. 文件末尾统一 `export const ALL = [...]` 之类的聚合导出会被引擎自动使用；也可只导出上述命名常量。
