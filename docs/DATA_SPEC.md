# 数据层规范 v1 —— 所有 data/*.js 必须严格遵守

> 引擎（`src/systems/effects.js`）按下述 schema 执行。**任何超出的字段或 op 都会被忽略或报错。**
> 具体定义文件必须是**纯数据**：不 import、不写函数、不用计算属性。全部用字面量。`cards.js` 和 `index.js` 等聚合注册模块可以 import 并合并这些定义。
> 当前规模：247 卡、8 旅者、116 敌人、64 遗物、36 药水、88 事件、30 状态、16 设施、12 员工、10 升级、12 委托、12 区域、108 固定编队、14 地点类型。设计见 `docs/CONTENT_DESIGN.md` 和 `docs/LEVEL_DESIGN.md`。

---

## 通用：效果数组 `effects: [...]`

每张牌/药水/遗物/敌人招式/事件结果，效果都是一个**操作数组** `ops`。引擎按顺序执行。

### 1. 伤害 / 格挡 / 生命

| op | 字段 | 含义 |
|---|---|---|
| `damage` | `v` | 对目标造成伤害（受力量/易伤/虚弱/攻城/虚化影响） |
| `damageAll` | `v` | 对当前施放方的所有存活对手造成伤害；玩家施放命中敌人，敌人施放命中玩家 |
| `block` | `v` | 获得格挡（受敏捷/脆骨/空壳影响） |
| `blockAll` | `v` | 获得格挡（单体，通常只用于自身） |
| `heal` | `n` | 回复生命（不超过最大生命） |
| `loseHp` | `n` | 直接扣血，**无视格挡** |
| `maxHp` | `n` | 在本次远征中修改最大生命，同时修改存活旅者的当前生命；不会复活已死亡旅者 |
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

- `t`（target）可选，缺省为 `target`。取值：`target`(卡牌指定) / `self` / `allEnemies` / `all` / `random`。
  事件、遗物钩子里没有"卡牌指定"，请显式写 `t`。

目标按执行上下文解析，`all` 不是跨阵营通用目标：

| 执行上下文 | `self` | `all` | `allEnemies` / `random` / `target` |
|---|---|---|---|
| 玩家卡牌或玩家遗物 | 当前施放者 | 当前施放者及全部存活敌人 | `allEnemies` 为全部存活敌人；`random` 随机一个；`target` 为已指定目标，未指定时取第一个存活敌人 |
| 敌方主动效果（招式、入场、回合开始） | 施放该效果的敌人 | 存活玩家 | 存活玩家 |
| 敌人死亡效果 `onDeath` | 死亡的敌人 | 存活敌方同伴，不含尸体或玩家 | 存活玩家 |
| 战斗外事件或药水 | 当前旅者 | 当前旅者 | 当前旅者 |

敌人给自己施加状态必须显式使用 `t:'self'`；死亡时给同伴施加状态使用 `t:'all'`。`buff` / `debuff` 对已死亡的单位不生效。

### 3. 抽牌 / 能量 / 牌库操作

| op | 字段 | 含义 |
|---|---|---|
| `draw` | `n` | 抽 n 张牌；抽牌堆空时将弃牌堆洗回，受手牌上限和缠绕限制 |
| `energy` | `n` | 获得 n 点能量 |
| `scry` | `n` | 预知 n（可弃掉任意张） |
| `addHand` | `card`, `n?` | 把牌加入手牌 |
| `addDiscard` | `card`, `n?` | 把牌加入弃牌堆 |
| `addDeck` | `card` | 把牌永久加入牌组（战后奖励类） |
| `shuffleIn` | `card`, `n?` | 洗入抽牌堆（随机位置） |
| `exhaustSelf` | — | 消耗本牌 |
| `retainSelf` | — | 本回合保留此牌不弃 |
| `removeCard` | — | 从本次远征的牌组永久随机移除一张牌，可用于事件/遗物/药水 |
| `upgradeCard` | `n?` | 随机升级本次远征牌组中尚未升级且有 `def.upgrade` 定义的 n 张可升级牌，可用于事件/遗物/药水 |

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
{type:'deckCount', card:'火焰', gte:3}   牌组中该 id 或 tag 的牌 >= 3 张
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
{type:'hasRelic', r:'relic_ember_heart'}
```

`firstCardOfTurn` 在本张牌写入出牌记录前判断，因此每回合只命中第一张；`turn.n` 是“当前回合不大于 n”，用于前 n 回合，不是指定第 n 回合。`typePlayed.n` 也按当前已记录的牌判断，触发 `onAttack` / `onCardPlay` 时尚未包含本张。

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

升级覆盖 `cost`、`text`、`effects` 及 `target`、`exhaust`、`ethereal`、`innate`、`retain`、`playable` 等属性；省略的字段沿用原值。`0` 和 `false` 是有效覆盖值。战斗和 UI 使用同一份合并后的定义，静态数据与卡牌实例的 `id` / `uid` 不会因此改变。

**要求**：
- `type:'power'` 的牌必须自解释、永久生效（引擎在打出时结算一次并保留在场）。
- 每个 `unlock.embers > 0` 的牌都必须是**强力且罕见**的。
- 至少 12 张牌带 `unlock`，分布在 uncommon/rare，作为元进度奖励。

## 角色 `CHARACTERS` (src/data/characters.js)

```js
{ id:'ch_ashborn', name:'烬裔', title:'锈锚酒馆老板',
  glyph:'🜂', color:'#ff6b35', hp:70, gold:100,
  lore:'……',
  mechanic:'每场战斗开始时获得 1 层力量，以灼烧构筑持续伤害。',
  relic:'relic_ember_heart',
  rewardTags:['火焰'],          // 战后候选中匹配任一 tag 的权重为 3，其他为 1
  deck:[
    'c_strike','c_strike',
    'c_ember_slash','c_ember_slash','c_ember_slash',
    'c_guard','c_guard','c_guard','c_bash','c_burn_wave'
  ], // 10 张
  unlock:{embers:0}
}
```
- 当前 8 个角色；烬裔与铆工默认可选，其他角色由 `unlock.embers` 控制。
- 每个角色起手牌组必须**围绕该角色 mechanic**，且 10 张牌不能重复超过 3 张同名牌。
- `rewardTags` 只改变标准卡牌奖励的候选权重，不改变稀有度，不解锁未开放的卡，也不强制奖励只能来自该流派。
- `portrait` 是可选的头像路径；新增旅者使用 `/assets/characters/riveter.svg`、`lantern.svg`、`oathbound.svg`，缺省时使用 `glyph`。
- 新增铆钉、幽灯、血誓各 24 张卡：普通 8 / 罕见 8 / 稀有 6 / 特殊 2。特殊牌通过生成或事件获得，不进入标准战后稀有度池。

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
- `dmg`：可选的旧版说明字段；当前意图伤害从 `effects` 动态计算，不读取这个常数
- `weight`：权重，不填默认 1
- `requireTurn:[a,b]`：仅在第 a..b 回合可选
- `requireHpBelow:0.5` / `requireHpAbove:0.5`
- `requireStatusPlayer:{s:'vulnerable',gte:2}`
- `requireSelfStatus:{s:'ritual',gte:3}`
- `once:true` 仅一次
- `next:'moveId'` 选中后强制下一次
- `tell`：一句台词

意图伤害的规则：

- 选定的招式保留 `moveId`；刷新数字时不重新抽取招式。
- 在单位、状态、牌堆与 RNG 的副本上解析 `effects`，包含 `if`、`repeat` 和数值 token；按敌人行动顺序处理仪式转力量等伤害前状态变化。
- 玩家回合中的预测先投影结束回合时的手牌归位与按回合衰减的状态。玩家出牌或使用药水后会重新计算数字。
- 显示指向玩家的各段攻击伤害总和。该值不扣格挡，不受玩家剩余生命上限限制，不计毒、灼烧、荆棘或遗物钩子的额外结算。
- 首回合护符会在预测副本中抵消相应攻击段；预测不消耗真实护符次数，也不改变真实 RNG、单位状态、牌堆、日志或统计。

当前 116 个敌人：第一幕普通 20（含 2 旧前哨）/ 精英 7 / Boss 5；第二幕与第三幕分别普通 18 / 精英 7 / Boss 5；第四至第六幕分别普通 4 / 精英 2 / Boss 2。每个区域新增普通 2、精英 1、Boss 1，并通过固定编队引用新敌或对应幕的旧敌。
精英/Boss 至少 2 阶段（用 `requireHpBelow` 切换招式），Boss 必须有 `next` 链或权重倾斜。
`next` 的目标必须存在，并满足其 `require*` 条件；条件不满足时按当前可用招式重新选择。新增重击链必须有实际不攻击的恢复窗口。
血量条件使用严格比较；高阶段可用 `requireHpAbove:0.49`，低阶段用 `requireHpBelow:0.5`，保证精确半血仍有攻击出口。永久标记、灼烧与成长招式必须有次数上限。

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

这是数据语法的钩子名白名单。当前调用点覆盖战斗生命周期、进节点与休息；`onRunStart` / `onShop` 尚无调用点，新增内容不得依赖它们。钩子上下文固定为存活玩家；同一遗物的同一钩子执行期间不会重入，防止伤害/格挡钩子互相递归。

`mod` 数值修正（全部为加法，除注明外）：
```js
mod:{ damagePlus:1, blockPlus:1, energyPlus:1, maxHpPlus:5, goldPlus:25,
      handPlus:1, drawPlus:1, healPlus:2, cardRewardPlus:1, shopPriceMul:0.9,
      eliteDamagePlus:3, potionSlotsPlus:1, mapReveal:1, enemyHpMul:1 }
```

当前已消费的修正：`damagePlus` / `blockPlus` / `energyPlus` / `drawPlus` / `handPlus` / `healPlus` / `eliteDamagePlus`；获得遗物时应用 `maxHpPlus` / `potionSlotsPlus`。上例中的 `goldPlus` / `cardRewardPlus` / `shopPriceMul` / `mapReveal` / `enemyHpMul` 是遗留声明，新增遗物不得使用没有消费入口的字段。

共 64 件。rarity 分布：starter 7 / common 25 / uncommon 20 / rare 9 / boss 3。角色绑定的起始遗物与 `rarity:'starter'` 均不得进入随机奖励、商店或随机起始遗物池。

开战遗物在首回合之前执行，随后 `startTurn` 会清空格挡和重置能量。因此首回合格挡/能量应放入 `onTurnStart`，条件用 `{type:'turn',n:1}`；专注、坚毅等按回合衰减的状态必须按实际消费时点写文案。新增遗物禁止无限逐牌回血、返还能量循环或无限叠加坚毅。

## 药水 `POTIONS` (src/data/potions.js)

```js
{ id:'p_ember_tonic', name:'余烬药酒', rarity:'common',   // 'common'|'uncommon'|'rare'
  glyph:'🍶', color:'#ff9a3c', target:'none',            // 'self'|'target'|'none'
  desc:'回复 12 点生命，获得 2 层力量。',
  effects:[{op:'heal', n:12},{op:'buff', s:'strength', v:2, t:'self'}] }
```
共 36 瓶，common 15 / uncommon 14 / rare 7。

药水使用规则：

- 战斗中只能在玩家回合使用；`target:'target'` 需要一个存活敌人目标。成功使用才从药水栏移除并计入 `potionsUsed`。
- 战斗外只允许无需敌人目标、且全部顶层操作属于 `heal` / `maxHp` / `removeCard` / `upgradeCard` / `gold` / `addDeck` 的药水。`target:'target'`、战斗状态、抽牌与能量药水不能使用，也不会消耗。目前温麦酒、活力盐、蚀刻酸、码头膏、髓酿、淬牌油可在战斗外使用。
- 战斗外生命归零会立即结算远征失败，不能用药水复活。
- `run.potionPower` 为药水增效值。使用时复制效果数组，仅对 `damage` / `damageAll` / `block` / `heal` / `energy` / `draw` / `scry` / `buff` / `debuff` 的正数数字常量 `v` / `n` 加上该值，并递归处理 `then` / `else`。`barricade` 是开关，不提高其层数。
- `repeat.n`、条件参数、数值 token、零值和负值，以及 `loseHp` / `maxHp` / `gold` / `upgradeCard` / `removeCard` / 生成和添加牌的数量保持原值；`doubleNextAttack` 等开关型自定义操作也不增效。静态药水定义不变。
- 例如增效 `1` 会把回复 `12` 改为 `13`、力量 `2` 改为 `3`；`repeat.n=2` 内的伤害 `v=6` 会变为两次 `v=7`，重复次数仍为两次。
- 药水提示通过 `potionDisplay` 描述实际增效后的效果；原始文案中的基础数值不能代替增效后的提示。当前药水增效台满级 2、厨师 1、蒸馏师 1，总增效最多 4。

## 酒馆设施与员工 (src/data/facilities.js)

设施结构为 `{id,name,glyph,max,cost:[...],income:[...],desc,effects?,start?}`；`cost[lv]` 是从当前级升一级的费用，`income[lv-1]` 是已建成级别的每夜收入。设施收入、员工 `incomeFlat` 与 `incomePct` 算出毛收入后，再减全部员工工资。

新增数量效果按设施等级叠加：`gold` / `maxHp` / `startCards` / `startPotions` / `damagePlus` / `drawPlus` / `firstTurnDrawPlus` / `potionPower` / `commissionChoices` / `commissionGoldPlus`。已实现的药水栏位、地图揭示、卡牌候选、遗物候选与潮汐减免也按等级叠加；折扣、收入比例、失败保留比例等按对应消费规则处理，不得默认所有字段都按级增长。

员工结构为 `{id,name,title,glyph,cost,wage,lore,mods,desc}`，数量修正以一次雇佣为单位聚合。`startPotions` 受最终药水栏位上限限制，`firstTurnDrawPlus` 只影响每场首回合，`drawPlus` 影响每回合。新数据只能使用 `bonuses()` 与远征/战斗已有消费入口的字段。

设施描述支持 `{income}` / `{lv}` / `{pct}` / `{keep}` / `{commissionGold}`，最后一个等于该设施 `commissionGoldPlus * lv`。当前 16 设施、12 员工、10 局外升级；新增内容没有添加未接入引擎的升级。

## 码头委托 `COMMISSIONS` (src/data/commissions.js)

```js
{ id:'commission_alchemy', name:'药剂实地记录', patron:'药剂师联合', glyph:'⚗',
  text:'……',
  goals:[{metric:'potionsUsed',target:2,label:'使用药水'}],
  gold:75, embers:5, reputation:3 }
```

- 当前 12 条，全部要求成功归来且所有 `goals` 达成。目标只支持 `kills` / `elites` / `nodesVisited` / `potionsUsed` / `cardsRemoved` / `cardsAdded` / `relicsFound` / `cardsPlayed` / `damageDealt` / `goldEarned` / `eventsVisited` / `bosses` / `hpPercent`。
- 委托板每夜基础 3 个候选，增加 `commissionChoices` 后最多取剩余内容数量。候选按夜数与已完成远征数生成，同一夜保持稳定；优先排除已经成功交付的委托。只能选本夜候选之一，出发前可撤下或更换。
- `beginCommission` 在起始装备发放后写入 `run.commission`：`id` / `night` / `baselineRelics` / `baselineStats` / `settled`。因此起始加成不计入获得牌或遗物目标。异象/精英目标会补齐一条合法路线所需节点，保留入口、前三行战斗及固定宝库/篝火/首领行。
- 普通目标值是 `run.stats[metric] - baselineStats[metric]`，不低于 0；`relicsFound` 是当前遗物数减起始数；`hpPercent` 是归来生命比例向下取整。
- 委托金币为 `round((gold + commissionGoldPlus) * 声望倍率)`，按本次交付前的声望计算。声望 0 / 6 / 15 / 20 对应倍率 1 / 1.1 / 1.2 / 1.3。
- `settleCommission` 同时锁定本次远征 `settled` 与本夜委托板 `resolved`，成功才发放金币、印记和声望并加入 `completed`；失败和未达标均记录原因但不发委托奖励。未出发而闭门经营时由 `expireCommission` 记录“本夜未出发”。
- `meta.commissions` 保存 `night` / `offers` / `selectedId` / `resolved` / `reputation` / `completed` / `lastResult`；已结算委托也写入远征报告与历史。旧存档补齐缺省字段，读取结果不能再次支付。

统计来源：`playCard` 计出牌，成功用药计 `potionsUsed`，合法进入节点计探索及异象/商店/篝火次数，胜利结算计精英/首领；`addCard` 和 `addDeck` 均计 `cardsAdded`，`removeCardAt` 和效果 `removeCard` 均计 `cardsRemoved`。金币目标只累计本次新收入，不包含起始金币；伤害目标累计敌人实际失去的生命，格挡吸收和意图预览不计入。

## 元进度的首回合护符

`u_boss_ward` 为每场战斗提供一次首回合攻击免疫，普通、精英与首领战都适用：

- 每场重置，在第一个玩家回合及其后的敌方行动中有效；进入第二个玩家回合后失效。
- 抵消敌方 `damage` / `damageAll` 对玩家造成的第一个非零攻击段。多段招式只抵消第一段，后续段正常结算。
- 抵消发生在扣格挡之前，格挡完整保留；即使这次攻击本来能被格挡完全吸收，也会消耗护符次数。
- 不抵消自损、中毒、灼烧或荆棘反弹。

## 远征结算与存档

- `meta.pendingResult` 保存已经发放金币、印记并写入统计的远征结果，等待玩家确认下一夜；未终局时刷新恢复该结算页，不重复发奖，已终局时恢复结局界面。
- 非终夜确认时结算经营收入、工资与潮汐，增加夜数并清空 `pendingResult`；终夜确认直接确定结局。结算按钮传入它显示的结果对象，已经失效的按钮不能再次推进夜数。
- `meta.ending` 为 `null`、`'won'` 或 `'lost'`。终夜按远征结果确定结局，灯芯归零判失败；已有结局或待确认结果时不能发起新远征。
- 旧存档补齐这两个字段；灯芯归零迁移为失败，仍有灯芯且夜数超过六夜迁移为胜利。
- 委托报酬与远征资源在 `finishRun` 中一起发放，`advanceNight` 只结算经营与潮汐、推进夜数。成功交付的历史、声望和报告在刷新后保持不变。
- 此存档保存守夜与结算进度；进行中的地图、牌组和战斗状态没有远征中途续存。

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
- 共 88 个事件：第一幕 20 / 第二幕 20 / 第三幕 19 / 第四至第六幕各 6，另有 11 个 `act:0` 通用事件。36 个事件带 `regionId`，每区 3 个，只进入匹配区域的事件池。
- 每个新增事件包含 3 个互斥选项：金币交易、明确生命/最大生命风险、构筑调整。概率写在描述中，付款必须是实际负数 `gold`，随机移除或随机升级不能写成可指定选择。
- 当前节点的事件结果缓存到 `run.eventOutcomes[nodeId]`，使用药水造成重绘后仍显示已选结果。不得再次结算选择；点击时需要重新检查 `req`，不能仅依赖绘制时的启用状态。

## 区域、编队与地图 `REGIONS`

```js
{
  id: 'r_rust_quay', act: 1, name: '锈潮码头', title: '...', text: '...',
  color: '#...', art: '/assets/regions/r_rust_quay.svg',
  rule: { name: '...', text: '...', playerStart: [], enemyStart: [], firstTurn: [] },
  encounters: [{ id: 'enc_...', name: '...', tier: 'normal', weight: 1, enemies: ['e_...'] }],
  eventIds: ['ev_...']
}
```

- 每幕 2 区，每区普通编队 4、精英 2、首领 2、前哨 1；编队包含 1 至 2 个同幕敌人。
- `playerStart` / `enemyStart` 在对应单位入场时结算。首回合格挡、抽牌、能量、预知放在 `firstTurn`，避免被首回合重置清空。
- `CHAPTERS` 定义六幕行列：`15×4`、`18×4`、`20×5`、`20×5`、`22×5`、`24×5`；尾三层为单节点宝库、篝火、首领。
- 地图保存 `regionId`，战斗节点保存 `encounterId`，试炼保存两个编队 ID 的 `waves`，事件保存 `eventId`。预览与实际进入使用同一份固定内容。
- `configureNode` 使用从远征种子、幕、行、列派生的 RNG；详情查看不消耗远征 RNG。委托改换节点类型后必须重新配置内容。
- 第一、第二夜分别从幕 1、2 推进至幕 3；其余夜直接进入对应幕并于本幕归航。夜 4/5/6 生命倍率为 1.3/1.6/1.9，前哨额外乘 0.65；上下界分别取整且至少为 1。
- `run.pendingAct` 只在途中首领奖励结束后设置；`continueToAct` 检查当前幕间界面及目标区域的幕号，只推进一次。

## 特殊地点与有限祝福

- `SITE_TYPES` 定义 `forge`、`shrine`、`supply`、`trial`、`vault`、`waystation`；选项由 `siteChoices` 提供，实际结算由 `chooseSite` 处理。
- `run.siteStates[nodeId]` 保存 `choice`、`resolved`、`result`、`battle` 与 `goldEarned`；行动时必须是当前已访问节点、玩家仍存活、资源足够。具体牌操作按 `{cardUid}` 传入，点击时重新检查 UID、费用和资格。
- `chooseSite` 返回 `{ok,kind,rewardStep?,text?}`；`kind` 为 `done`、`reward` 或 `battle`。显式 `rewardStep` 不重复显示前一场的金币。
- 试炼先战斗 `wave:0`，胜后发本轮金币并回复 6 生命，进入 `phase:'between'`；继续后战斗 `wave:1`，两轮全胜再给 45 金币、1 钥匙及卡牌/遗物奖励。撤出保留首轮金币且不发最终奖励。
- 密库可消耗 1 钥匙选遗物，或战胜区域精英进入卡牌/遗物奖励。所有精英胜利的钥匙只在战斗结算时发 1 把，地点结算不再重复发。
- `run.blessings` 元素为 `{id,name,remaining,firstTurn:[ops]}`。开战快照有效祝福并减剩余场数一次，后续回合不触发；同名祝福补足剩余场数，不叠加效果。
- `run.stats` 新增 `regionsVisited`、`sitesVisited`、`keysFound`、`keysSpent`、`trialsCleared`、`vaultsOpened`；`run.areaHistory` 保存实际进入的区域。已结算报告和历史存档保留区域与地点统计。

---

## 硬性规则

1. 所有 `id` 全局唯一，`c_` `ch_` `e_` `relic_` `p_` `ev_` 前缀区分。
2. 卡牌的 `target` 与 `effects` 中 `t:'target'` 的用法必须自洽：`target:'self'` 的牌不能写 `t:'target'`。
3. 不确定引擎是否支持 → **只用本文档写到的字段**。宁可少写一个效果，也不要写错 op 名。
4. 中文文案，风格：末世边境 + 硫火与蒸汽。避免"Assassin"式直译。
5. 文件末尾统一 `export const ALL = [...]` 之类的聚合导出会被引擎自动使用；也可只导出上述命名常量。
