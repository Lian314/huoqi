// ============ 敌人数据 ============
// 基础 68 敌人；港区与深层区域模块追加专属敌人。
// 规则见 docs/DATA_SPEC.md：dmg 记录基础总伤害，意图由 effects 实时推演；
// 精英/Boss 用 requireHpBelow 切阶段；Boss 用 next 连招。
import { HARBOR_ENEMIES } from './enemies.harbor.js';
import { DEPTH_ENEMIES } from './enemies.depths.js';

const BASE_ENEMIES = [

  // ---------- ACT 1 · 前哨杂兵（教学用，hp ≤ 14）----------

  { id:'e_iron_rats', name:'铁齿鼠群', act:1, tier:'normal',
    hp:[6,9], gold:[3,6],
    glyph:'🐀', color:'#8a8f6b', size:'small',
    lore:'边境管道里最不缺的东西。它们先啃电缆，再啃人。',
    moves:[
      { id:'e_iron_rats_nip', name:'啃咬', intent:'attack', dmg:3, weight:4,
        tell:'细碎的爪声从瓦砾下涌出来。',
        effects:[{op:'damage', v:3}] },
      { id:'e_iron_rats_hide', name:'缩进骨堆', intent:'defend', dmg:0, weight:1,
        tell:'它们一起缩进了骨架的缝隙。',
        effects:[{op:'block', v:3}] },
      { id:'e_iron_rats_bristle', name:'炸毛', intent:'buff', dmg:0, weight:1,
        tell:'鼠群同时炸起了毛。',
        effects:[{op:'buff', s:'strength', v:1, t:'self'}] }
    ],
    onDeath:[{op:'buff', s:'strength', v:1, t:'all'}]
  },

  { id:'e_scarab_tide', name:'蚀铁甲虫', act:1, tier:'normal',
    hp:[9,14], gold:[4,7],
    glyph:'🪲', color:'#6f7a3a', size:'small',
    lore:'它们啃不动钢板，就先啃钢板上的人。',
    moves:[
      { id:'e_scarab_tide_chew', name:'啃噬装甲', intent:'attack', dmg:4, weight:4,
        tell:'甲壳刮过铁皮，声音很尖。',
        effects:[{op:'damage', v:4}] },
      { id:'e_scarab_tide_hide', name:'缩壳', intent:'defend', dmg:0, weight:2,
        tell:'六条腿一收，它变成一颗钉子。',
        effects:[{op:'block', v:5}] },
      { id:'e_scarab_tide_mist', name:'酸雾', intent:'attackDebuff', dmg:3, weight:1,
        requireTurn:[2],
        tell:'它背上的腺体裂开了。',
        effects:[
          {op:'damage', v:3},
          {op:'debuff', s:'weak', v:1, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 1 · 普通（10）----------

  { id:'e_ghoul', name:'拾荒行尸', act:1, tier:'normal',
    hp:[16,22], gold:[8,14],
    glyph:'🧟', color:'#7bd66b', size:'normal',
    lore:'它记得酒馆的灯，却忘了自己早就死在灯下。',
    moves:[
      { id:'e_ghoul_bite', name:'撕咬', intent:'attack', dmg:6, weight:3,
        tell:'它张开了嘴。',
        effects:[{op:'damage', v:6}] },
      { id:'e_ghoul_howl', name:'嚎叫', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2],
        tell:'巷子里的回应一声接一声。',
        effects:[{op:'debuff', s:'vulnerable', v:2, t:'all'}] }
    ]
  },

  { id:'e_rust_sentry', name:'锈甲哨兵', act:1, tier:'normal',
    hp:[24,30], gold:[8,14],
    glyph:'械', color:'#9a7b4f', size:'normal',
    lore:'守着一段早就不存在的边境，守了三百年。',
    moves:[
      { id:'e_rust_sentry_hammer', name:'铁锤', intent:'attack', dmg:8, weight:3,
        tell:'锈粉从拳面簌簌落下。',
        effects:[{op:'damage', v:8}] },
      { id:'e_rust_sentry_shield', name:'举盾', intent:'defend', dmg:0, weight:1,
        tell:'它把盾沿卡进了地缝里。',
        effects:[{op:'block', v:9}] },
      { id:'e_rust_sentry_valve', name:'泄压阀', intent:'attackDebuff', dmg:5, weight:1,
        requireTurn:[2],
        tell:'阀口喷出一圈白汽。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'frail', v:1, t:'all'}
        ] }
    ]
  },

  { id:'e_ash_hound', name:'灰烬猎犬', act:1, tier:'normal',
    hp:[14,20], gold:[5,9],
    glyph:'🐕', color:'#d2691e', size:'small',
    lore:'没人记得它被谁放出来，只记得它一直在跑。',
    moves:[
      { id:'e_ash_hound_pounce', name:'扑咬', intent:'attack', dmg:5, weight:4,
        tell:'灰毛炸开，它扑了上来。',
        effects:[{op:'damage', v:5}] },
      { id:'e_ash_hound_sniff', name:'嗅血', intent:'buff', dmg:0, weight:1,
        tell:'它深深吸了一口气。',
        effects:[{op:'buff', s:'strength', v:2, t:'self'}] },
      { id:'e_ash_hound_tuck', name:'夹尾', intent:'defend', dmg:0, weight:1,
        tell:'它把鼻子埋进了爪子里。',
        effects:[{op:'block', v:4}] }
    ]
  },

  { id:'e_scav_hunter', name:'拾荒者', act:1, tier:'normal',
    hp:[28,34], gold:[9,15],
    glyph:'🧍', color:'#c9a06b', size:'normal',
    lore:'他捡走了你丢下的东西，包括你丢掉的那部分。',
    moves:[
      { id:'e_scav_hunter_crowbar', name:'撬棍挥击', intent:'attack', dmg:10, weight:3,
        tell:'撬棍从下往上抬。',
        effects:[{op:'damage', v:10}] },
      { id:'e_scav_hunter_dust', name:'撒灰', intent:'attackDebuff', dmg:4, weight:2,
        tell:'一把炉灰扬进你的眼睛。',
        effects:[
          {op:'damage', v:4},
          {op:'debuff', s:'vulnerable', v:2, t:'all'}
        ] },
      { id:'e_scav_hunter_hunch', name:'缩肩', intent:'defend', dmg:0, weight:1,
        tell:'他把背包顶在了身前。',
        effects:[{op:'block', v:7}] }
    ]
  },

  { id:'e_sac_mother', name:'孢囊孵母', act:1, tier:'normal',
    hp:[20,26], gold:[10,16],
    glyph:'🫧', color:'#a06cd5', size:'normal',
    lore:'腹里的每一颗卵，都在替它数着时间。',
    moves:[
      { id:'e_sac_mother_gestate', name:'蠕动产卵', intent:'buff', dmg:0, weight:3,
        tell:'腹部的囊一鼓一鼓。',
        effects:[{op:'buff', s:'ritual', v:2, t:'self'}] },
      { id:'e_sac_mother_spit', name:'黏液喷吐', intent:'attackDebuff', dmg:5, weight:2,
        tell:'一坨温热的黏液挂在嘴边。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'weak', v:1, t:'all'}
        ] },
      { id:'e_sac_mother_spore', name:'孢子雨', intent:'attackDebuff', dmg:4, weight:1,
        once:true, requireTurn:[2],
        tell:'第一片孢子落地了。',
        effects:[
          {op:'damage', v:4},
          {op:'debuff', s:'poison', v:2, t:'all'}
        ] }
    ],
    onDeath:[{op:'buff', s:'regen', v:3, t:'all'}]
  },

  { id:'e_steam_adept', name:'蒸汽学徒', act:1, tier:'normal',
    hp:[18,24], gold:[7,12],
    glyph:'♨', color:'#7fd4c1', size:'normal',
    lore:'他把师父的排气阀拆下来，装在了自己身上。',
    moves:[
      { id:'e_steam_adept_jet', name:'泄压喷射', intent:'attackDebuff', dmg:5, weight:3,
        tell:'后背的阀门拧到了底。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_steam_adept_mend', name:'修补护具', intent:'defend', dmg:0, weight:1,
        tell:'它把甲片一块块扣回身上。',
        effects:[{op:'block', v:6}] },
      { id:'e_steam_adept_overload', name:'压力过载', intent:'buff', dmg:0, weight:1,
        requireTurn:[3], next:'e_steam_adept_jet',
        tell:'锅炉开始尖啸。',
        effects:[{op:'buff', s:'strength', v:3, t:'self'}] }
    ]
  },

  { id:'e_iron_jaw', name:'铁颚猎手', act:1, tier:'normal',
    hp:[30,36], gold:[10,16],
    glyph:'🔧', color:'#b08d57', size:'normal',
    lore:'它原本是拆解厂的钳子，后来学会了追着人跑。',
    moves:[
      { id:'e_iron_jaw_clamp', name:'铁颚合拢', intent:'attack', dmg:11, weight:3,
        tell:'钳口在合拢前停了一瞬。',
        effects:[{op:'damage', v:11}] },
      { id:'e_iron_jaw_recoil', name:'反冲装甲', intent:'attackBuff', dmg:5, weight:1,
        tell:'颚轴咬住了你的刃。',
        effects:[
          {op:'damage', v:5},
          {op:'buff', s:'thorns', v:2, t:'self'}
        ] },
      { id:'e_iron_jaw_plate', name:'铁皮', intent:'defend', dmg:0, weight:1,
        tell:'它把皮压平了，不留缝。',
        effects:[{op:'block', v:10}] }
    ],
    onDeath:[{op:'buff', s:'thorns', v:2, t:'all'}]
  },

  { id:'e_acid_slug', name:'腐蚀蛞蝓', act:1, tier:'normal',
    hp:[16,22], gold:[6,11],
    glyph:'🐌', color:'#9fd356', size:'normal',
    lore:'它爬过的地方，连钢筋都变成了一团泡沫。',
    moves:[
      { id:'e_acid_slug_spit', name:'酸液喷吐', intent:'attackDebuff', dmg:4, weight:3,
        tell:'一串气泡在它背上炸开。',
        effects:[
          {op:'damage', v:4},
          {op:'debuff', s:'poison', v:2, t:'all'}
        ] },
      { id:'e_acid_slug_glue', name:'分泌黏膜', intent:'defend', dmg:0, weight:2,
        tell:'它把自己黏在了石缝上。',
        effects:[
          {op:'block', v:5},
          {op:'buff', s:'thorns', v:1, t:'self'}
        ] },
      { id:'e_acid_slug_ball', name:'缩成球', intent:'attackDebuff', dmg:3, weight:1,
        requireTurn:[3],
        tell:'它缩成一团，酸雾弥漫开来。',
        effects:[
          {op:'damage', v:3},
          {op:'debuff', s:'frail', v:1, t:'all'}
        ] }
    ]
  },

  { id:'e_plague_apper', name:'疫医助手', act:1, tier:'normal',
    hp:[22,28], gold:[9,14],
    glyph:'🩺', color:'#c8d6a0', size:'normal',
    lore:'它坚持要治好你，用的是它自己剩下的那点药。',
    moves:[
      { id:'e_plague_apper_stitch', name:'缝合扎针', intent:'attackDebuff', dmg:6, weight:3,
        tell:'针尖上还挂着上一具尸体的线头。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'vulnerable', v:1, t:'all'}
        ] },
      { id:'e_plague_apper_wrap', name:'包扎', intent:'defend', dmg:0, weight:2,
        tell:'它把自己的绷带解了下来。',
        effects:[{op:'block', v:7}] },
      { id:'e_plague_apper_serum', name:'灌下血清', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2],
        tell:'浑浊的液体被灌进了你的喉咙。',
        effects:[
          {op:'debuff', s:'poison', v:3, t:'all'},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] }
    ],
    onDeath:[{op:'loseHp', n:6}]
  },

  { id:'e_slag_worker', name:'熔渣工', act:1, tier:'normal',
    hp:[34,42], gold:[12,18],
    glyph:'🔥', color:'#e07a3a', size:'normal',
    lore:'他一辈子只学会一件事：怎么把铁水泼得又远又准。',
    moves:[
      { id:'e_slag_worker_pour', name:'铁水浇铸', intent:'attackDebuff', dmg:12, weight:3,
        tell:'滚烫的铁水兜头浇下。',
        effects:[
          {op:'damage', v:12},
          {op:'debuff', s:'burn', v:2, t:'all'}
        ] },
      { id:'e_slag_worker_rod', name:'抡铁棍', intent:'attack', dmg:9, weight:2,
        tell:'铁棍从肩后抡了起来。',
        effects:[{op:'damage', v:9}] },
      { id:'e_slag_worker_quench', name:'淬火', intent:'defend', dmg:0, weight:1,
        tell:'它往自己身上浇了一勺冷水。',
        effects:[{op:'block', v:12}] },
      { id:'e_slag_worker_bellows', name:'炉火爆燃', intent:'attackDebuff', dmg:6, weight:1,
        once:true, requireTurn:[3], next:'e_slag_worker_pour',
        tell:'风箱被它一脚踹到底。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 1 · 精英（3）----------

  { id:'e_ghoul_overseer', name:'行尸监工', act:1, tier:'elite',
    hp:[58,68], gold:[30,45],
    glyph:'⚖', color:'#6f9a4a', size:'large',
    lore:'它不再自己动手，它只负责数数。',
    moves:[
      { id:'e_ghoul_overseer_inspect', name:'检阅部众', intent:'buff', dmg:0, weight:2,
        once:true, next:'e_ghoul_overseer_whip',
        tell:'它举起了鞭子，队伍立刻安静。',
        effects:[{op:'buff', s:'strength', v:3, t:'self'}] },
      { id:'e_ghoul_overseer_whip', name:'鞭笞', intent:'attack', dmg:9, weight:3,
        tell:'鞭梢带着锈屑。',
        effects:[{op:'damage', v:9}] },
      { id:'e_ghoul_overseer_swarm', name:'群尸合围', intent:'attackDebuff', dmg:7, weight:2,
        tell:'墙后的手一齐伸了出来。',
        effects:[
          {op:'damage', v:7},
          {op:'debuff', s:'vulnerable', v:2, t:'all'}
        ] },
      { id:'e_ghoul_overseer_frenzy', name:'监工狂怒', intent:'attackBuff', dmg:12, weight:4,
        requireHpBelow:0.5,
        tell:'锁链崩断。它开始咬自己的骨头。',
        effects:[
          {op:'damage', v:12},
          {op:'buff', s:'strength', v:3, t:'self'}
        ] }
    ]
  },

  { id:'e_bulwark_drummer', name:'锈鼓机兵', act:1, tier:'elite',
    hp:[66,78], gold:[32,48],
    glyph:'🥁', color:'#b8763a', size:'large',
    lore:'它把工厂的汽笛拆下来，绷在鼓面上。',
    moves:[
      { id:'e_bulwark_drummer_drum', name:'敲鼓', intent:'attackDebuff', dmg:6, weight:2,
        tell:'三声鼓点，你的呼吸乱了。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_bulwark_drummer_rivet', name:'钉合装甲', intent:'defend', dmg:0, weight:2,
        tell:'它把自己钉进了地面。',
        effects:[
          {op:'block', v:18},
          {op:'buff', s:'barricade', v:1, t:'self'}
        ] },
      { id:'e_bulwark_drummer_march', name:'齐步压境', intent:'attack', dmg:11, weight:3,
        next:'e_bulwark_drummer_drum',
        tell:'它把鼓当成了盾。',
        effects:[{op:'damage', v:11}] },
      { id:'e_bulwark_drummer_hammer', name:'过载汽锤', intent:'attackDebuff', dmg:16, weight:4,
        requireHpBelow:0.5,
        tell:'安全阀炸了，整台机器都在晃。',
        effects:[
          {op:'damage', v:16},
          {op:'debuff', s:'siege', v:2, t:'all'}
        ] }
    ]
  },

  { id:'e_bile_matron', name:'胆汁母蛛', act:1, tier:'elite',
    hp:[56,64], gold:[28,42],
    glyph:'🕷', color:'#7f9c4a', size:'large',
    lore:'腹里的卵比它自己更饿。',
    moves:[
      { id:'e_bile_matron_acid', name:'吐酸', intent:'attackDebuff', dmg:6, weight:3,
        tell:'一坨绿色的东西挂在丝线上。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'poison', v:2, t:'all'}
        ] },
      { id:'e_bile_matron_curl', name:'抱卵', intent:'defend', dmg:0, weight:2,
        tell:'八条腿把肚子裹了起来。',
        effects:[
          {op:'block', v:10},
          {op:'buff', s:'thorns', v:2, t:'self'}
        ] },
      { id:'e_bile_matron_snap', name:'断丝', intent:'attack', dmg:9, weight:2,
        requireTurn:[2], next:'e_bile_matron_acid',
        tell:'丝线绷断，啪的一声。',
        effects:[{op:'damage', v:9}] },
      { id:'e_bile_matron_hatch', name:'孵化毒潮', intent:'attackDebuff', dmg:9, weight:4,
        requireHpBelow:0.5,
        tell:'卵壳在你眼前裂开。',
        effects:[
          {op:'damage', v:9},
          {op:'debuff', s:'poison', v:4, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 1 · BOSS ----------

  { id:'e_rust_tide_warden', name:'锈潮守卫', act:1, tier:'boss',
    hp:[200,240], gold:[120,160],
    glyph:'⚙', color:'#a08c6a', size:'large',
    lore:'它守着的不是门，是一整片还没凉透的边境。',
    moves:[
      { id:'e_rust_tide_warden_seal', name:'铸壳', intent:'defend', dmg:0, weight:2,
        requireHpAbove:0.5, next:'e_rust_tide_warden_rivet',
        tell:'舱门合拢，铆钉咬死。它打算一直站下去。',
        effects:[
          {op:'block', v:30},
          {op:'buff', s:'metallicize', v:4, t:'self'}
        ] },
      { id:'e_rust_tide_warden_rivet', name:'铆钉齐射', intent:'attack', dmg:12, weight:3,
        tell:'一排铆钉从装甲缝里弹出来。',
        effects:[{op:'damage', v:12}] },
      { id:'e_rust_tide_warden_valve', name:'汽压过载', intent:'attackDebuff', dmg:8, weight:2,
        requireTurn:[2], next:'e_rust_tide_warden_rivet',
        tell:'压力表的红线越过了整个表盘。',
        effects:[
          {op:'damage', v:8},
          {op:'debuff', s:'frail', v:2, t:'all'},
          {op:'debuff', s:'vulnerable', v:2, t:'all'}
        ] },
      { id:'e_rust_tide_warden_hammer', name:'熔毁重锤', intent:'attackDebuff', dmg:18, weight:4,
        requireHpBelow:0.5, next:'e_rust_tide_warden_rivet',
        tell:'它把主轴硬拧成了锤子。轴心已经烧红。',
        effects:[
          {op:'damage', v:18},
          {op:'debuff', s:'siege', v:3, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 2 · 普通（10）----------

  { id:'e_fume_maw', name:'毒烟大口', act:2, tier:'normal',
    hp:[34,40], gold:[16,24],
    glyph:'👺', color:'#7a8f3a', size:'normal',
    lore:'没人知道它原来长什么样，烟熏掉了所有能辨认的部分。',
    moves:[
      { id:'e_fume_maw_fog', name:'喷吐毒雾', intent:'attackDebuff', dmg:7, weight:3,
        tell:'一口浓烟压过你的口鼻。',
        effects:[
          {op:'damage', v:7},
          {op:'debuff', s:'poison', v:2, t:'all'}
        ] },
      { id:'e_fume_maw_tuck', name:'缩颈', intent:'defend', dmg:0, weight:1,
        tell:'喉囊缩回了胸腔。',
        effects:[{op:'block', v:9}] },
      { id:'e_fume_maw_clear', name:'毒云凝聚', intent:'debuff', dmg:0, weight:1,
        once:true, requireTurn:[3],
        tell:'它把整条肺都清空了。',
        effects:[
          {op:'debuff', s:'poison', v:4, t:'all'},
          {op:'debuff', s:'frail', v:2, t:'all'}
        ] }
    ]
  },

  { id:'e_ash_climber', name:'灰烬攀爬者', act:2, tier:'normal',
    hp:[28,36], gold:[14,21],
    glyph:'🧗', color:'#b8a05a', size:'normal',
    lore:'它爬得比警报快。',
    moves:[
      { id:'e_ash_climber_rake', name:'铁爪抓挠', intent:'attack', dmg:10, weight:3,
        tell:'五道铁痕留在你的肩上。',
        effects:[{op:'damage', v:10}] },
      { id:'e_ash_climber_ash', name:'扬灰', intent:'attackDebuff', dmg:5, weight:2,
        tell:'它把墙皮一起刮了下来。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_ash_climber_perch', name:'架高', intent:'defend', dmg:0, weight:1,
        tell:'它把自己挂到了通风管上。',
        effects:[
          {op:'block', v:8},
          {op:'buff', s:'strength', v:1, t:'self'}
        ] }
    ]
  },

  { id:'e_slag_brute', name:'熔渣蛮兵', act:2, tier:'normal',
    hp:[56,64], gold:[20,28],
    glyph:'🪨', color:'#8a5a3a', size:'normal',
    lore:'废料场的守门人，从不挪窝。',
    moves:[
      { id:'e_slag_brute_anvil', name:'铁砧砸落', intent:'attack', dmg:15, weight:3,
        tell:'整块地砖跟着一起跳了起来。',
        effects:[{op:'damage', v:15}] },
      { id:'e_slag_brute_harden', name:'硬化外壳', intent:'defend', dmg:0, weight:2,
        tell:'它把表面的渣壳重新熔了一层。',
        effects:[
          {op:'block', v:18},
          {op:'buff', s:'thorns', v:2, t:'self'}
        ] },
      { id:'e_slag_brute_burst', name:'熔渣爆裂', intent:'attackDebuff', dmg:8, weight:1,
        requireTurn:[3],
        tell:'壳上的裂纹里喷出白浆。',
        effects:[
          {op:'damage', v:8},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] }
    ]
  },

  { id:'e_mite_swarm', name:'蚀骨螨群', act:2, tier:'normal',
    hp:[28,34], gold:[12,18],
    glyph:'🪲', color:'#a8b04a', size:'small',
    lore:'单独一只不算什么。它们从不单独来。',
    moves:[
      { id:'e_mite_swarm_gnaw', name:'群体啃食', intent:'attack', dmg:4, weight:4,
        tell:'螨群贴着袖口往里钻。',
        effects:[{op:'damage', v:4}] },
      { id:'e_mite_swarm_burrow', name:'钻进甲缝', intent:'defend', dmg:0, weight:2,
        tell:'它们从盾牌的接缝里挤了进去。',
        effects:[
          {op:'block', v:6},
          {op:'buff', s:'thorns', v:1, t:'self'}
        ] },
      { id:'e_mite_swarm_swell', name:'集体膨大', intent:'buff', dmg:0, weight:1,
        once:true,
        tell:'它们同时抬起了头。',
        effects:[{op:'buff', s:'strength', v:2, t:'self'}] }
    ]
  },

  { id:'e_bile_spitter', name:'胆汁喷吐者', act:2, tier:'normal',
    hp:[38,44], gold:[18,26],
    glyph:'🤮', color:'#9ac04a', size:'normal',
    lore:'它吐得远，也吐得准，两个都是天生的。',
    moves:[
      { id:'e_bile_spitter_jet', name:'胆汁喷射', intent:'attackDebuff', dmg:9, weight:3,
        tell:'一道黄线贴着地面飞过来。',
        effects:[
          {op:'damage', v:9},
          {op:'debuff', s:'poison', v:3, t:'all'}
        ] },
      { id:'e_bile_spitter_splash', name:'腐蚀喷溅', intent:'attackDebuff', dmg:6, weight:2,
        requireTurn:[2],
        tell:'它把胃里的东西全倒在了地上。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'frail', v:2, t:'all'}
        ] },
      { id:'e_bile_spitter_pouch', name:'缩进胃囊', intent:'defend', dmg:0, weight:1,
        tell:'它把自己折成了一个球。',
        effects:[{op:'block', v:12}] }
    ]
  },

  { id:'e_iron_priest', name:'铁炉祭司', act:2, tier:'normal',
    hp:[30,38], gold:[15,22],
    glyph:'🕯', color:'#d9a441', size:'normal',
    lore:'它向熔炉祷告，熔炉偶尔也会应一声。',
    moves:[
      { id:'e_iron_priest_prayer', name:'祷词', intent:'debuff', dmg:0, weight:2,
        next:'e_iron_priest_crosier',
        tell:'它在你的名字上画圈，施加标记和虚弱，下一回合挥出炉杖。',
        effects:[
          {op:'debuff', s:'mark', v:2, t:'all'},
          {op:'debuff', s:'weak', v:1, t:'all'}
        ] },
      { id:'e_iron_priest_bless', name:'铸铁祝祷', intent:'buff', dmg:0, weight:2,
        once:true, next:'e_iron_priest_crosier',
        tell:'铅在掌心凝成十字，只会祝祷一次，获得 3 层金属化，下一回合挥杖。',
        effects:[{op:'buff', s:'metallicize', v:3, t:'self'}] },
      { id:'e_iron_priest_coffer', name:'铁匣合拢', intent:'defend', dmg:0, weight:1,
        next:'e_iron_priest_crosier',
        tell:'祷告箱扣死，获得 12 点格挡，下一回合打开盖板挥出炉杖。',
        effects:[{op:'block', v:12}] },
      { id:'e_iron_priest_crosier', name:'炉杖敲击', intent:'attack', dmg:9, weight:3,
        tell:'炉杖已经举起，将造成 9 点基础伤害并消耗身上的 3 层金属化。',
        effects:[{op:'damage', v:9}, {op:'buff', s:'metallicize', v:-3, t:'self'}] }
    ]
  },

  { id:'e_wraith_drummer', name:'鼓噪亡魂', act:2, tier:'normal',
    hp:[36,46], gold:[17,25],
    glyph:'🥁', color:'#6f7f9c', size:'normal',
    lore:'没有鼓，却一直有声音。',
    moves:[
      { id:'e_wraith_drummer_din', name:'乱鼓', intent:'attackDebuff', dmg:6, weight:3,
        tell:'鼓点从四面八方挤过来。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'entangled', v:2, t:'all'}
        ] },
      { id:'e_wraith_drummer_growl', name:'低吼', intent:'attackDebuff', dmg:8, weight:2,
        tell:'那声音贴着你的耳膜刮过去。',
        effects:[
          {op:'damage', v:8},
          {op:'debuff', s:'drain', v:2, t:'all'}
        ] },
      { id:'e_wraith_drummer_gather', name:'聚拢声浪', intent:'defend', dmg:0, weight:1,
        tell:'所有的杂音收成了一堵墙。',
        effects:[
          {op:'block', v:12},
          {op:'buff', s:'strength', v:1, t:'self'}
        ] }
    ]
  },

  { id:'e_chitin_carrier', name:'甲壳搬运工', act:2, tier:'normal',
    hp:[40,48], gold:[19,27],
    glyph:'🦂', color:'#c8a24a', size:'normal',
    lore:'它搬的东西比它重十倍，它从不抱怨。',
    moves:[
      { id:'e_chitin_carrier_crate', name:'货柜砸落', intent:'attack', dmg:12, weight:3,
        tell:'柜子先落地，架子跟着塌。',
        effects:[{op:'damage', v:12}] },
      { id:'e_chitin_carrier_shell', name:'缩进背甲', intent:'defend', dmg:0, weight:2,
        tell:'背甲合上了，只剩一道缝。',
        effects:[
          {op:'block', v:14},
          {op:'buff', s:'thorns', v:3, t:'self'}
        ] },
      { id:'e_chitin_carrier_barb', name:'倒刺反击', intent:'attackDebuff', dmg:6, weight:1,
        requireTurn:[2],
        tell:'背甲的倒刺划过你的手腕。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'vulnerable', v:1, t:'all'}
        ] }
    ],
    onDeath:[{op:'buff', s:'barricade', v:1, t:'all'}]
  },

  { id:'e_vulture_script', name:'秃鹫抄本员', act:2, tier:'normal',
    hp:[28,36], gold:[16,24],
    glyph:'📜', color:'#c9c0a0', size:'normal',
    lore:'它抄下了你所有的招式，然后一条一条还给你。',
    moves:[
      { id:'e_vulture_script_knife', name:'笔刀划伤', intent:'attack', dmg:8, weight:2,
        tell:'蘸水笔当成了刀。',
        effects:[{op:'damage', v:8}] },
      { id:'e_vulture_script_copy', name:'抄录', intent:'attackDebuff', dmg:4, weight:2,
        tell:'它把你刚才那一下一笔笔记下了。',
        effects:[
          {op:'damage', v:4},
          {op:'debuff', s:'vulnerable', v:2, t:'all'},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_vulture_script_spread', name:'展翅后跳', intent:'defend', dmg:0, weight:2,
        tell:'它把翅膀张到了最大。',
        effects:[{op:'block', v:10}] }
    ]
  },

  { id:'e_slag_stalker', name:'熔渣潜行者', act:2, tier:'normal',
    hp:[44,52], gold:[20,28],
    glyph:'🗡', color:'#6a4a7a', size:'normal',
    lore:'你听见的脚步声，比它晚了半拍。',
    moves:[
      { id:'e_slag_stalker_backstab', name:'背刺', intent:'attack', dmg:14, weight:3,
        tell:'影子先动了。',
        effects:[{op:'damage', v:14}] },
      { id:'e_slag_stalker_trail', name:'拖尾', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2],
        tell:'地面的熔渣粘住了你的脚。',
        effects:[
          {op:'debuff', s:'drain', v:3, t:'all'},
          {op:'debuff', s:'entangled', v:1, t:'all'}
        ] },
      { id:'e_slag_stalker_hold', name:'屏息', intent:'defend', dmg:0, weight:1,
        tell:'它的呼吸消失了。',
        effects:[
          {op:'block', v:12},
          {op:'buff', s:'strength', v:2, t:'self'}
        ] }
    ]
  },

  // ---------- ACT 2 · 精英（3）----------

  { id:'e_iron_auctioneer', name:'锈铁拍卖官', act:2, tier:'elite',
    hp:[96,110], gold:[48,70],
    glyph:'💰', color:'#d4af37', size:'large',
    lore:'它拍卖的东西只有一样：还没到手的东西。',
    moves:[
      { id:'e_iron_auctioneer_gavel', name:'敲槌', intent:'attackDebuff', dmg:9, weight:3,
        tell:'一槌定音：你的力气临时归它保管。',
        effects:[
          {op:'damage', v:9},
          {op:'debuff', s:'weak', v:2, t:'all'},
          {op:'debuff', s:'frail', v:2, t:'all'}
        ] },
      { id:'e_iron_auctioneer_bid', name:'加价', intent:'attackDebuff', dmg:6, weight:2,
        requireTurn:[2], next:'e_iron_auctioneer_gavel',
        tell:'它在你的名字后面添了一个数字。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'mark', v:2, t:'all'}
        ] },
      { id:'e_iron_auctioneer_coffer', name:'出价', intent:'defend', dmg:0, weight:2,
        tell:'铁箱一层一层扣上。',
        effects:[
          {op:'block', v:22},
          {op:'buff', s:'barricade', v:1, t:'self'}
        ] },
      { id:'e_iron_auctioneer_settle', name:'清算', intent:'attackDebuff', dmg:20, weight:4,
        requireHpBelow:0.5,
        tell:'所有欠款，一次性结清。',
        effects:[
          {op:'damage', v:20},
          {op:'debuff', s:'siege', v:3, t:'all'}
        ] }
    ]
  },

  { id:'e_flesh_zealot', name:'血肉狂信', act:2, tier:'elite',
    hp:[118,130], gold:[50,74],
    glyph:'🔥', color:'#d9453a', size:'large',
    lore:'它割开自己，只为了让仪式更快完成。',
    moves:[
      { id:'e_flesh_zealot_chant', name:'诵祷', intent:'buff', dmg:0, weight:2,
        once:true, next:'e_flesh_zealot_offering',
        tell:'它割开胸口，对着空处念了一句。',
        effects:[{op:'buff', s:'ritual', v:3, t:'self'}] },
      { id:'e_flesh_zealot_offering', name:'献祭挥击', intent:'attack', dmg:6, weight:3,
        tell:'刀刃上浮着一层红。',
        effects:[{op:'damage', v:'2S'}] },
      { id:'e_flesh_zealot_pyre', name:'灼烧祷言', intent:'attackDebuff', dmg:6, weight:2,
        requireTurn:[2],
        tell:'它念出的每一个字都在冒烟。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] },
      { id:'e_flesh_zealot_burst', name:'献身爆发', intent:'attackDebuff', dmg:22, weight:4,
        requireHpBelow:0.5,
        tell:'它不再需要祷告了。',
        effects:[
          {op:'damage', v:22},
          {op:'debuff', s:'vulnerable', v:3, t:'all'}
        ] }
    ]
  },

  { id:'e_hive_midwife', name:'巢室助产士', act:2, tier:'elite',
    hp:[100,112], gold:[46,68],
    glyph:'🍼', color:'#b58ad6', size:'large',
    lore:'它接生的每一个东西，都比你先看到明天。',
    moves:[
      { id:'e_hive_midwife_deliver', name:'催产', intent:'attackDebuff', dmg:7, weight:3,
        tell:'它把手伸进了巢里。',
        effects:[
          {op:'damage', v:7},
          {op:'debuff', s:'poison', v:3, t:'all'}
        ] },
      { id:'e_hive_midwife_cocoon', name:'厚茧', intent:'defend', dmg:0, weight:2,
        tell:'它给自己裹上了一层硬壳。',
        effects:[
          {op:'block', v:20},
          {op:'buff', s:'thorns', v:3, t:'self'}
        ] },
      { id:'e_hive_midwife_inject', name:'灌注孢液', intent:'attackDebuff', dmg:5, weight:2,
        requireTurn:[2],
        tell:'黏稠的液体顺着针管压下来。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'poison', v:4, t:'all'},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_hive_midwife_resonate', name:'巢室共振', intent:'attackDebuff', dmg:10, weight:4,
        requireHpBelow:0.5,
        tell:'整间巢室一起鼓动。毒在你血里翻了个身。',
        effects:[
          {op:'damage', v:10},
          {op:'debuff', s:'poison', v:6, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 2 · BOSS ----------

  { id:'e_blight_hive_mother', name:'毒窖母巢', act:2, tier:'boss',
    hp:[250,290], gold:[140,180],
    glyph:'🐝', color:'#a06cd5', size:'large',
    lore:'窖里没有王，只有一层层正在成熟的巢室。',
    moves:[
      { id:'e_blight_hive_mother_spore', name:'孢子播撒', intent:'attackDebuff', dmg:8, weight:3,
        next:'e_blight_hive_mother_cocoon',
        tell:'一片孢雨落在你的斗篷上。',
        effects:[
          {op:'damage', v:8},
          {op:'debuff', s:'poison', v:3, t:'all'}
        ] },
      { id:'e_blight_hive_mother_cocoon', name:'孵化护壳', intent:'defend', dmg:0, weight:2,
        requireHpAbove:0.5,
        tell:'它把自己裹进了新结的鞘里。',
        effects:[
          {op:'block', v:26},
          {op:'buff', s:'metallicize', v:4, t:'self'}
        ] },
      { id:'e_blight_hive_mother_grow', name:'催生队列', intent:'buff', dmg:0, weight:2,
        requireTurn:[2], next:'e_blight_hive_mother_spore',
        tell:'它的腹部又鼓起了一节。',
        effects:[{op:'buff', s:'strength', v:3, t:'self'}] },
      { id:'e_blight_hive_mother_tide', name:'酸潮吞没', intent:'attackDebuff', dmg:16, weight:4,
        requireHpBelow:0.5,
        tell:'整个窖池翻了过来。你吸进去的每一口都是它。',
        effects:[
          {op:'damage', v:16},
          {op:'debuff', s:'poison', v:6, t:'all'},
          {op:'debuff', s:'frail', v:2, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 3 · 普通（10）----------

  { id:'e_burn_titan', name:'熔炉泰坦', act:3, tier:'normal',
    hp:[76,88], gold:[28,42],
    glyph:'♨', color:'#e0603a', size:'normal',
    lore:'它被吊在熔炉上方，只为了随时倾倒。',
    moves:[
      { id:'e_burn_titan_pour', name:'铁水倾泻', intent:'attackDebuff', dmg:18, weight:3,
        tell:'它把整炉铁水举过了头顶。',
        effects:[
          {op:'damage', v:18},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] },
      { id:'e_burn_titan_wall', name:'炉壁合拢', intent:'defend', dmg:0, weight:2,
        tell:'两片炉壁向中间合上。',
        effects:[
          {op:'block', v:22},
          {op:'buff', s:'metallicize', v:3, t:'self'}
        ] },
      { id:'e_burn_titan_bellows', name:'鼓风助燃', intent:'buff', dmg:0, weight:1,
        requireTurn:[2], next:'e_burn_titan_pour',
        tell:'风箱开始尖叫。',
        effects:[{op:'buff', s:'strength', v:4, t:'self'}] }
    ]
  },

  { id:'e_ash_revenant', name:'灰烬亡者', act:3, tier:'normal',
    hp:[52,62], gold:[26,38],
    glyph:'⚱', color:'#8a7a6a', size:'normal',
    lore:'烧完了还能再烧一次，只要还剩一点没凉的。',
    moves:[
      { id:'e_ash_revenant_claw', name:'骨爪挥击', intent:'attack', dmg:14, weight:3,
        tell:'爪尖上掉下几片灰。',
        effects:[{op:'damage', v:14}] },
      { id:'e_ash_revenant_rekindle', name:'复燃', intent:'buff', dmg:0, weight:2,
        tell:'它胸口的灰又红了一下。',
        effects:[{op:'buff', s:'regen', v:4, t:'self'}] },
      { id:'e_ash_revenant_veil', name:'灰烬帷幕', intent:'attackDebuff', dmg:7, weight:2,
        requireTurn:[3],
        tell:'它把自己裹进了一层灰里。',
        effects:[
          {op:'damage', v:7},
          {op:'debuff', s:'vulnerable', v:2, t:'all'},
          {op:'debuff', s:'frail', v:2, t:'all'}
        ] }
    ]
  },

  { id:'e_rail_spider', name:'轨蛛', act:3, tier:'normal',
    hp:[48,58], gold:[24,36],
    glyph:'🕸', color:'#6a6ad6', size:'normal',
    lore:'它在天花板的轨道上织了整张网。',
    moves:[
      { id:'e_rail_spider_cleave', name:'丝线绞割', intent:'attack', dmg:13, weight:3,
        tell:'两根丝同时收紧了。',
        effects:[{op:'damage', v:13}] },
      { id:'e_rail_spider_bind', name:'喷丝缠绕', intent:'attackDebuff', dmg:5, weight:2,
        tell:'一条丝从脚踝绕到了膝盖。',
        effects:[
          {op:'damage', v:5},
          {op:'debuff', s:'entangled', v:2, t:'all'}
        ] },
      { id:'e_rail_spider_coil', name:'悬停蓄势', intent:'buff', dmg:0, weight:1,
        requireTurn:[2], next:'e_rail_spider_cleave',
        tell:'它把八条腿全收进了腹下。',
        effects:[{op:'buff', s:'strength', v:3, t:'self'}] }
    ]
  },

  { id:'e_husk_swarm', name:'空壳群', act:3, tier:'normal',
    hp:[48,58], gold:[22,32],
    glyph:'🦴', color:'#cfcab0', size:'small',
    lore:'每一副空壳里都还留着一点没走的东西。',
    moves:[
      { id:'e_husk_swarm_scrape', name:'空壳刮擦', intent:'attack', dmg:9, weight:4,
        tell:'成百上千副空壳同时蹭过地面。',
        effects:[{op:'damage', v:9}] },
      { id:'e_husk_swarm_lend', name:'互相支撑', intent:'defend', dmg:0, weight:2,
        tell:'它们靠在一起，站成了一堵墙。',
        effects:[
          {op:'block', v:14},
          {op:'buff', s:'thorns', v:2, t:'self'}
        ] },
      { id:'e_husk_swarm_echo', name:'汲取残响', intent:'buff', dmg:0, weight:1,
        once:true,
        tell:'壳里的残响汇成了一股。',
        effects:[{op:'buff', s:'strength', v:3, t:'self'}] }
    ]
  },

  { id:'e_void_acolyte', name:'虚寂侍者', act:3, tier:'normal',
    hp:[56,66], gold:[27,40],
    glyph:'✳', color:'#8fd6ff', size:'normal',
    lore:'它张着嘴，整条走廊却没有一点声音。',
    moves:[
      { id:'e_void_acolyte_silence', name:'静默祷唱', intent:'debuff', dmg:0, weight:2,
        tell:'它张嘴的时候，什么都没有发生。',
        effects:[
          {op:'debuff', s:'weak', v:3, t:'all'},
          {op:'debuff', s:'entangled', v:1, t:'all'}
        ] },
      { id:'e_void_acolyte_fade', name:'虚化', intent:'buff', dmg:0, weight:2,
        tell:'它的边缘开始化开。',
        effects:[
          {op:'buff', s:'intangible', v:2, t:'self'},
          {op:'block', v:10}
        ] },
      { id:'e_void_acolyte_pierce', name:'穿影', intent:'attackDebuff', dmg:10, weight:3,
        tell:'手臂从你的影子里伸了出来。',
        effects:[
          {op:'damage', v:10},
          {op:'debuff', s:'mark', v:2, t:'all'}
        ] }
    ]
  },

  { id:'e_slag_priest', name:'熔渣祭司', act:3, tier:'normal',
    hp:[62,72], gold:[29,43],
    glyph:'🕯', color:'#d96a3a', size:'normal',
    lore:'它把灰烬排成队，然后一个一个点名。',
    moves:[
      { id:'e_slag_priest_charm', name:'灰烬祝祷', intent:'buff', dmg:0, weight:2,
        tell:'灰烬浮在空中，排成一列。',
        effects:[
          {op:'buff', s:'strength', v:3, t:'self'},
          {op:'buff', s:'thorns', v:2, t:'self'}
        ] },
      { id:'e_slag_priest_whip', name:'硫火鞭', intent:'attackDebuff', dmg:9, weight:3,
        tell:'鞭梢还在滴着烧红的渣。',
        effects:[
          {op:'damage', v:9},
          {op:'debuff', s:'burn', v:2, t:'all'}
        ] },
      { id:'e_slag_priest_consecrate', name:'圣化壁垒', intent:'defend', dmg:0, weight:1,
        tell:'它在身前画了一道符。',
        effects:[
          {op:'block', v:18},
          {op:'buff', s:'metallicize', v:2, t:'self'}
        ] }
    ]
  },

  { id:'e_ruin_golem', name:'废墟巨像', act:3, tier:'normal',
    hp:[90,100], gold:[34,48],
    glyph:'🗿', color:'#9a9a8a', size:'normal',
    lore:'它曾经是一座塔，塔塌了，它站起来了。',
    moves:[
      { id:'e_ruin_golem_crush', name:'碎石碾压', intent:'attack', dmg:20, weight:3,
        next:'e_ruin_golem_shake',
        tell:'整块天花板塌了下来。',
        effects:[{op:'damage', v:20}] },
      { id:'e_ruin_golem_shake', name:'废墟震落', intent:'attackDebuff', dmg:8, weight:2,
        tell:'它抖了抖身子，掉下一层灰。',
        effects:[
          {op:'damage', v:8},
          {op:'debuff', s:'siege', v:2, t:'all'}
        ] },
      { id:'e_ruin_golem_pile', name:'垒砌残骸', intent:'defend', dmg:0, weight:1,
        tell:'它把碎砖一块块摞到了身前。',
        effects:[
          {op:'block', v:26},
          {op:'buff', s:'barricade', v:1, t:'self'}
        ] }
    ],
    onDeath:[{op:'buff', s:'strength', v:3, t:'all'}]
  },

  { id:'e_cinder_scav', name:'灰烬拾荒客', act:3, tier:'normal',
    hp:[54,64], gold:[26,38],
    glyph:'🐺', color:'#c98b4b', size:'normal',
    lore:'它捡东西，也记仇，两样都不肯落下。',
    moves:[
      { id:'e_cinder_scav_hook', name:'铁钩夺物', intent:'attack', dmg:15, weight:3,
        tell:'钩子从下往上挑。',
        effects:[{op:'damage', v:15}] },
      { id:'e_cinder_scav_notebook', name:'记下仇家', intent:'attackDebuff', dmg:6, weight:2,
        tell:'它用炭笔在你手背上写了什么。',
        effects:[
          {op:'damage', v:6},
          {op:'debuff', s:'mark', v:2, t:'all'},
          {op:'debuff', s:'vulnerable', v:1, t:'all'}
        ] },
      { id:'e_cinder_scav_trip', name:'缠腿绊倒', intent:'attackDebuff', dmg:4, weight:1,
        tell:'它一扯你的绑带。',
        effects:[
          {op:'damage', v:4},
          {op:'debuff', s:'drain', v:3, t:'all'}
        ] },
      { id:'e_cinder_scav_instinct', name:'拾荒本能', intent:'defend', dmg:0, weight:1,
        tell:'它把捡来的零件全扣在了身上。',
        effects:[
          {op:'block', v:10},
          {op:'buff', s:'strength', v:2, t:'self'}
        ] }
    ]
  },

  { id:'e_gas_mantis', name:'煤气螳螂', act:3, tier:'normal',
    hp:[60,70], gold:[28,42],
    glyph:'🦗', color:'#8ad6a0', size:'normal',
    lore:'它呼吸的每一口，都是别人排出来的废气。',
    moves:[
      { id:'e_gas_mantis_triple', name:'三连斩', intent:'attack', dmg:15, weight:3,
        tell:'三条前臂同时落下来。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:5}]}] },
      { id:'e_gas_mantis_hold', name:'屏息凝气', intent:'defend', dmg:0, weight:2,
        tell:'它把气全部压进了腹囊。',
        effects:[
          {op:'block', v:16},
          {op:'buff', s:'dexterity', v:2, t:'self'}
        ] },
      { id:'e_gas_mantis_puff', name:'煤气喷发', intent:'attackDebuff', dmg:7, weight:1,
        requireTurn:[3],
        tell:'鞘翅裂开，一股甜腥味扑面而来。',
        effects:[
          {op:'damage', v:7},
          {op:'debuff', s:'poison', v:3, t:'all'}
        ] }
    ],
    onDeath:[{op:'addHand', card:'c_ember_slash', n:1}]
  },

  { id:'e_furnace_wraith', name:'熔炉幽魂', act:3, tier:'normal',
    hp:[48,56], gold:[23,34],
    glyph:'👻', color:'#ff9a3c', size:'normal',
    lore:'炉火熄灭那晚，有一点火没肯走。',
    moves:[
      { id:'e_furnace_wraith_tongue', name:'焰舌缠身', intent:'attackDebuff', dmg:10, weight:3,
        tell:'它贴着你的影子烧了过来。',
        effects:[
          {op:'damage', v:10},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] },
      { id:'e_furnace_wraith_condense', name:'冷却凝结', intent:'defend', dmg:0, weight:2,
        tell:'它把自己凝成了一层硬壳。',
        effects:[
          {op:'block', v:12},
          {op:'buff', s:'metallicize', v:2, t:'self'}
        ] },
      { id:'e_furnace_wraith_drain', name:'余烬汲取', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2],
        tell:'它从你的伤口里抽走了一点热。',
        effects:[
          {op:'debuff', s:'frail', v:2, t:'all'},
          {op:'debuff', s:'weak', v:2, t:'all'},
          {op:'heal', n:8, t:'self'}
        ] }
    ],
    onDeath:[{op:'loseHp', n:8}]
  },

  // ---------- ACT 3 · 精英（3）----------

  { id:'e_harvest_arbiter', name:'收割仲裁者', act:3, tier:'elite',
    hp:[150,175], gold:[78,105],
    glyph:'⚖', color:'#c9a06b', size:'large',
    lore:'它的秤一端放着你的命，另一端还空着。',
    moves:[
      { id:'e_harvest_arbiter_hear', name:'开庭', intent:'attackDebuff', dmg:10, weight:3,
        tell:'它敲了一下。空气里多了点铁腥味。',
        effects:[
          {op:'damage', v:10},
          {op:'debuff', s:'mark', v:2, t:'all'},
          {op:'debuff', s:'vulnerable', v:1, t:'all'}
        ] },
      { id:'e_harvest_arbiter_execute', name:'授权处刑', intent:'attack', dmg:18, weight:3,
        tell:'刀已经举到了最高处。',
        effects:[{op:'damage', v:18}] },
      { id:'e_harvest_arbiter_pan', name:'悬秤', intent:'buff', dmg:0, weight:2,
        tell:'秤盘里放着你的名字。',
        effects:[
          {op:'block', v:24},
          {op:'buff', s:'ritual', v:2, t:'self'},
          {op:'buff', s:'thorns', v:3, t:'self'}
        ] },
      { id:'e_harvest_arbiter_verdict', name:'终审', intent:'attackDebuff', dmg:26, weight:4,
        requireHpBelow:0.5, next:'e_harvest_arbiter_hear',
        tell:'秤杆压到了底。',
        effects:[
          {op:'damage', v:26},
          {op:'debuff', s:'siege', v:3, t:'all'}
        ] }
    ]
  },

  { id:'e_titan_slagheart', name:'熔渣之心', act:3, tier:'elite',
    hp:[185,200], gold:[82,110],
    glyph:'🫀', color:'#e0554a', size:'large',
    lore:'挖开它，里面不是肉，是一根还在跳的铁桩。',
    moves:[
      { id:'e_titan_slagheart_spray', name:'熔浆喷射', intent:'attackDebuff', dmg:16, weight:3,
        tell:'心脏裂开一道口子，喷出来的是铁。',
        effects:[
          {op:'damage', v:16},
          {op:'debuff', s:'burn', v:3, t:'all'}
        ] },
      { id:'e_titan_slagheart_scar', name:'结痂', intent:'defend', dmg:0, weight:2,
        tell:'裂口在几秒内重新长合。',
        effects:[
          {op:'block', v:30},
          {op:'buff', s:'metallicize', v:4, t:'self'}
        ] },
      { id:'e_titan_slagheart_pump', name:'搏动供能', intent:'buff', dmg:0, weight:2,
        requireTurn:[2], next:'e_titan_slagheart_spray',
        tell:'每一次搏动，腔室都亮一分。',
        effects:[{op:'buff', s:'strength', v:4, t:'self'}] },
      { id:'e_titan_slagheart_burst', name:'崩心一击', intent:'attackDebuff', dmg:30, weight:4,
        requireHpBelow:0.5,
        tell:'它把自己捏爆了，用的是你站的位置。',
        effects:[
          {op:'damage', v:30},
          {op:'debuff', s:'vulnerable', v:3, t:'all'}
        ] }
    ]
  },

  { id:'e_null_choir', name:'无声合唱团', act:3, tier:'elite',
    hp:[160,180], gold:[76,102],
    glyph:'🎭', color:'#7f5ad6', size:'large',
    lore:'几十副喉咙一起开合，房间里却没有一点声音。',
    moves:[
      { id:'e_null_choir_chant', name:'齐诵', intent:'attackDebuff', dmg:9, weight:3,
        tell:'几十张嘴同时张开了。',
        effects:[
          {op:'damage', v:9},
          {op:'debuff', s:'frail', v:2, t:'all'},
          {op:'debuff', s:'weak', v:2, t:'all'}
        ] },
      { id:'e_null_choir_veil', name:'帷幕', intent:'defend', dmg:0, weight:2,
        tell:'它们躲进了自己的影子里。',
        effects:[
          {op:'buff', s:'shroud', v:3, t:'self'},
          {op:'block', v:18}
        ] },
      { id:'e_null_choir_steal', name:'夺走回声', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2],
        tell:'你的每一次呼吸都慢了半拍。',
        effects:[
          {op:'debuff', s:'drain', v:3, t:'all'},
          {op:'debuff', s:'entangled', v:2, t:'all'}
        ] },
      { id:'e_null_choir_exec', name:'无声处刑', intent:'attackDebuff', dmg:28, weight:4,
        requireHpBelow:0.5,
        tell:'所有的声音都停了，包括你自己的。',
        effects:[
          {op:'damage', v:28},
          {op:'debuff', s:'bind', v:2, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 3 · BOSS ----------

  { id:'e_molten_regent', name:'熔心 · 无名执政官', act:3, tier:'boss',
    hp:[290,320], gold:[180,200],
    glyph:'👑', color:'#ff4a2a', size:'large',
    lore:'它登基那天烧掉了自己的名字，从此只以心跳称呼。',
    moves:[
      // 阶段一（>50%）：力量成长
      { id:'e_molten_regent_crown', name:'加冕', intent:'attackBuff', dmg:14, weight:3,
        next:'e_molten_regent_lava',
        tell:'它把王冠按进了自己的胸腔。',
        effects:[
          {op:'damage', v:14},
          {op:'buff', s:'strength', v:3, t:'self'}
        ] },
      { id:'e_molten_regent_lava', name:'熔火铺地', intent:'debuff', dmg:0, weight:2,
        tell:'地砖开始冒泡。整座大厅都在升温。',
        effects:[
          {op:'debuff', s:'burn', v:4, t:'all'},
          {op:'debuff', s:'drain', v:2, t:'all'}
        ] },
      // 阶段二（<50%）：转攻为守
      { id:'e_molten_regent_law', name:'执政官铁律', intent:'defend', dmg:0, weight:2,
        requireHpBelow:0.5,
        tell:'它站进了一套锈铁骨架里，边缘开始发红。',
        effects:[
          {op:'block', v:40},
          {op:'buff', s:'thorns', v:5, t:'self'},
          {op:'buff', s:'metallicize', v:5, t:'self'}
        ] },
      // 阶段三（<25%）：一次性大招
      { id:'e_molten_regent_annihilate', name:'湮灭令', intent:'attackDebuff', dmg:34, weight:4,
        once:true, requireHpBelow:0.25, next:'e_molten_regent_law',
        tell:'它把整座熔炉的账，一并算在了你头上。',
        effects:[
          {op:'damage', v:34},
          {op:'debuff', s:'vulnerable', v:3, t:'all'},
          {op:'debuff', s:'siege', v:4, t:'all'}
        ] }
    ]
  },

  // ---------- ACT 1 · 码头蒸汽工会 ----------

  { id:'e_dock_riveter', name:'码头铆钉工', act:1, tier:'normal',
    hp:[22,28], gold:[8,14], glyph:'铆', color:'#b8976b', size:'normal',
    lore:'他的工单上写着补船，船沉了以后，工单只剩下补人。',
    moves:[
      { id:'e_dock_riveter_nails', name:'双钉齐射', intent:'attack', dmg:6, weight:3,
        next:'e_dock_riveter_reload',
        tell:'两枚铆钉同时上膛，将连续射击两次，随后必须装填。',
        effects:[{op:'repeat', n:2, then:[{op:'damage', v:3}]}] },
      { id:'e_dock_riveter_reload', name:'装填钉匣', intent:'defend', dmg:0, weight:1,
        tell:'他低头补钉，只会获得 6 点格挡。',
        effects:[{op:'block', v:6}] },
      { id:'e_dock_riveter_sight', name:'打上定位钉', intent:'debuff', dmg:0, weight:1,
        once:true, next:'e_dock_riveter_nails',
        tell:'准星停在你的护甲缺口，留下 1 层标记，下一回合双钉齐射。',
        effects:[{op:'debuff', s:'mark', v:1, t:'all'}] }
    ]
  },

  { id:'e_bilge_lamplighter', name:'舱底点灯人', act:1, tier:'normal',
    hp:[18,24], gold:[7,12], glyph:'灯', color:'#dbab60', size:'normal',
    lore:'他只点没有人看守的灯。灯亮的时候，舱底一定有人。',
    moves:[
      { id:'e_bilge_lamplighter_flare', name:'倾倒灯火', intent:'attackDebuff', dmg:4, weight:2,
        once:true, next:'e_bilge_lamplighter_cover',
        tell:'灯油从提灯口溢出；本次攻击会附加 1 层灼烧，之后他会护住灯芯。',
        effects:[{op:'damage', v:4}, {op:'debuff', s:'burn', v:1, t:'all'}] },
      { id:'e_bilge_lamplighter_staff', name:'灯杆横扫', intent:'attack', dmg:6, weight:3,
        tell:'他横握灯杆，准备一次 6 点伤害的扫击。',
        effects:[{op:'damage', v:6}] },
      { id:'e_bilge_lamplighter_cover', name:'护住灯芯', intent:'defend', dmg:0, weight:2,
        tell:'他把灯藏进外套，只获得 5 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:5}] }
    ]
  },

  { id:'e_chain_tollman', name:'铁链收税人', act:1, tier:'normal',
    hp:[30,36], gold:[10,16], glyph:'链', color:'#829690', size:'normal',
    lore:'没有钱就留一节指骨，桥下的链条已经很长了。',
    moves:[
      { id:'e_chain_tollman_hook', name:'税钩', intent:'attack', dmg:8, weight:3,
        next:'e_chain_tollman_slack',
        tell:'铁钩已拉到尽头，将造成 8 点伤害，随后必须收链。',
        effects:[{op:'damage', v:8}] },
      { id:'e_chain_tollman_bind', name:'缠住护腕', intent:'debuff', dmg:0, weight:2,
        requireTurn:[2], next:'e_chain_tollman_hook',
        tell:'链圈瞄准你的护腕；施加 2 层束缚后，下一回合拉动税钩。',
        effects:[{op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_chain_tollman_slack', name:'收回松链', intent:'defend', dmg:0, weight:1,
        tell:'他正把链条绕回腰间，只获得 4 点格挡。',
        effects:[{op:'block', v:4}] }
    ]
  },

  { id:'e_pressure_runner', name:'背炉跑腿', act:1, tier:'normal',
    hp:[20,26], gold:[8,13], glyph:'汽', color:'#87b9a7', size:'normal',
    lore:'背上的小锅炉替他呼吸，也替他决定什么时候该冲出去。',
    moves:[
      { id:'e_pressure_runner_charge', name:'拧紧背炉', intent:'buff', dmg:0, weight:2,
        once:true, next:'e_pressure_runner_dash',
        tell:'背炉开始积压蒸汽，获得 2 点力量，下一回合撞来。',
        effects:[{op:'buff', s:'strength', v:2, t:'self'}] },
      { id:'e_pressure_runner_dash', name:'蒸汽冲撞', intent:'attack', dmg:8, weight:0,
        next:'e_pressure_runner_vent',
        tell:'蒸汽喷口朝向地面，准备一次冲撞；撞完必定泄压。',
        effects:[{op:'damage', v:8}] },
      { id:'e_pressure_runner_vent', name:'背炉泄压', intent:'defend', dmg:0, weight:1,
        tell:'他弯腰放汽，失去 2 点力量，只获得 3 点格挡。',
        effects:[{op:'buff', s:'strength', v:-2, t:'self'}, {op:'block', v:3}] },
      { id:'e_pressure_runner_pipe', name:'管钳敲打', intent:'attack', dmg:5, weight:3,
        tell:'炉压不足，他只会用管钳造成 5 点基础伤害。',
        effects:[{op:'damage', v:5}] }
    ]
  },

  { id:'e_dock_pressure_master', name:'工会压力监工', act:1, tier:'elite',
    hp:[64,76], gold:[32,46], glyph:'压', color:'#a99c79', size:'large',
    lore:'他每次点名都先检查阀门，漏掉的名字会被计入炉压。',
    moves:[
      { id:'e_dock_pressure_master_load', name:'加压检查', intent:'defend', dmg:0, weight:3,
        next:'e_dock_pressure_master_burst',
        tell:'压力表接近红线，获得 12 点格挡，下一回合施放重锤。',
        effects:[{op:'block', v:12}] },
      { id:'e_dock_pressure_master_burst', name:'压力重锤', intent:'attack', dmg:14, weight:0,
        next:'e_dock_pressure_master_vent',
        tell:'重锤已经锁定，造成 14 点伤害后必定开阀泄压。',
        effects:[{op:'damage', v:14}] },
      { id:'e_dock_pressure_master_vent', name:'打开侧阀', intent:'defend', dmg:0, weight:1,
        tell:'侧阀暴露，监工获得 4 点格挡和 2 层易伤；这是进攻窗口。',
        effects:[{op:'block', v:4}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] },
      { id:'e_dock_pressure_master_hook', name:'拖拽工钩', intent:'attack', dmg:8, weight:2,
        tell:'他用工钩试探，只会造成 8 点伤害。',
        effects:[{op:'damage', v:8}] },
      { id:'e_dock_pressure_master_redline', name:'红线双冲', intent:'attack', dmg:12, weight:1,
        requireHpBelow:0.5, next:'e_dock_pressure_master_vent',
        tell:'压力表碎了，将连续造成两次 6 点伤害，然后泄压。',
        effects:[{op:'repeat', n:2, then:[{op:'damage', v:6}]}] }
    ]
  },

  { id:'e_guild_chain_foreman', name:'缆索领班', act:1, tier:'elite',
    hp:[60,72], gold:[30,44], glyph:'缆', color:'#78a3ab', size:'large',
    lore:'他把工人的名字编进缆绳，绳子越粗，船就越难离港。',
    moves:[
      { id:'e_guild_chain_foreman_cast', name:'撒出钢缆', intent:'debuff', dmg:0, weight:3,
        next:'e_guild_chain_foreman_pull',
        tell:'钢缆绕向护甲，施加 2 层束缚，下一回合拉紧。',
        effects:[{op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_guild_chain_foreman_pull', name:'收紧吊索', intent:'attack', dmg:12, weight:0,
        next:'e_guild_chain_foreman_coil',
        tell:'绞盘已咬住钢缆，将造成 12 点伤害，随后停机绕绳。',
        effects:[{op:'damage', v:12}] },
      { id:'e_guild_chain_foreman_coil', name:'停机绕绳', intent:'defend', dmg:0, weight:1,
        tell:'绞盘停止转动，只获得 7 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:7}] },
      { id:'e_guild_chain_foreman_anchor', name:'掷下小锚', intent:'attack', dmg:9, weight:2,
        tell:'一枚小锚正在晃动，准备一次 9 点伤害的攻击。',
        effects:[{op:'damage', v:9}] },
      { id:'e_guild_chain_foreman_last', name:'断缆回弹', intent:'attackDebuff', dmg:14, weight:1,
        once:true, requireHpBelow:0.4, next:'e_guild_chain_foreman_coil',
        tell:'最后一根缆绳绷直，将造成 14 点伤害和 1 层脆骨，然后停机。',
        effects:[{op:'damage', v:14}, {op:'debuff', s:'frail', v:1, t:'all'}] }
    ]
  },

  { id:'e_dock_guildmaster', name:'沉港工会长', act:1, tier:'boss',
    hp:[210,230], gold:[120,160], glyph:'港', color:'#bba068', size:'large',
    lore:'他站在沉船吊机上，仍在批准三百年前那批船的离港申请。',
    moves:[
      { id:'e_dock_guildmaster_hoist', name:'升起吊机', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_dock_guildmaster_drop',
        tell:'吊机正在举起船锚，获得 10 点格挡，下一回合单次砸下。',
        effects:[{op:'block', v:10}] },
      { id:'e_dock_guildmaster_drop', name:'船锚坠落', intent:'attack', dmg:12, weight:0,
        requireHpAbove:0.5, next:'e_dock_guildmaster_repair',
        tell:'船锚将造成 12 点伤害，砸完吊臂会卡住。',
        effects:[{op:'damage', v:12}] },
      { id:'e_dock_guildmaster_notice', name:'停航通知', intent:'attackDebuff', dmg:6, weight:1,
        requireHpAbove:0.5, next:'e_dock_guildmaster_repair',
        tell:'他以铁牌敲钟，造成 6 点伤害并施加 1 层虚弱，随后检修。',
        effects:[{op:'damage', v:6}, {op:'debuff', s:'weak', v:1, t:'all'}] },
      { id:'e_dock_guildmaster_lock', name:'锁死闸门', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_dock_guildmaster_twin',
        tell:'船坞闸门关闭；获得 8 点格挡并施加 2 层束缚，下一回合双锚坠落。',
        effects:[{op:'block', v:8}, {op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_dock_guildmaster_twin', name:'双锚坠落', intent:'attack', dmg:14, weight:0,
        requireHpBelow:0.5, next:'e_dock_guildmaster_repair',
        tell:'两枚船锚各造成 7 点伤害，随后吊机停摆。',
        effects:[{op:'repeat', n:2, then:[{op:'damage', v:7}]}] },
      { id:'e_dock_guildmaster_break', name:'拆下主梁', intent:'attack', dmg:18, weight:1,
        once:true, requireHpBelow:0.25, next:'e_dock_guildmaster_repair',
        tell:'主梁已经被拔出，这一击造成 18 点伤害，之后必须检修。',
        effects:[{op:'damage', v:18}] },
      { id:'e_dock_guildmaster_repair', name:'检修卡死的吊臂', intent:'defend', dmg:0, weight:1,
        tell:'吊臂卡住，会长只获得 4 点格挡和 2 层易伤，本回合不会攻击。',
        effects:[{op:'block', v:4}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  },

  { id:'e_ghost_ferry_keeper', name:'幽灯摆渡长', act:1, tier:'boss',
    hp:[200,220], gold:[120,160], glyph:'渡', color:'#7db8ae', size:'large',
    lore:'他的渡船从不靠岸，乘客只能在两盏灯交换影子的时候下船。',
    moves:[
      { id:'e_ghost_ferry_keeper_light', name:'重新点亮船灯', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_ghost_ferry_keeper_oar',
        tell:'他低头添灯油，获得 8 点格挡，下一回合用船桨击打。',
        effects:[{op:'block', v:8}] },
      { id:'e_ghost_ferry_keeper_oar', name:'渡魂桨', intent:'attack', dmg:8, weight:0,
        requireHpAbove:0.5, next:'e_ghost_ferry_keeper_light',
        tell:'长桨将造成 8 点伤害，随后他会回头照看船灯。',
        effects:[{op:'damage', v:8}] },
      { id:'e_ghost_ferry_keeper_smoke', name:'灯烟扑面', intent:'debuff', dmg:0, weight:1,
        once:true, requireHpAbove:0.5, next:'e_ghost_ferry_keeper_light',
        tell:'他吹灭一截灯芯，施加 2 层虚弱，不会直接造成伤害。',
        effects:[{op:'debuff', s:'weak', v:2, t:'all'}] },
      { id:'e_ghost_ferry_keeper_mirror', name:'水面定位', intent:'debuff', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_ghost_ferry_keeper_toll',
        tell:'三道水纹围住你的倒影，施加 1 层束缚，下一回合连续拍打三次。',
        effects:[{op:'debuff', s:'bind', v:1, t:'all'}] },
      { id:'e_ghost_ferry_keeper_toll', name:'三重船税', intent:'attack', dmg:15, weight:0,
        requireHpBelow:0.5, next:'e_ghost_ferry_keeper_dark',
        tell:'三道水纹各造成 5 点伤害，随后船灯会彻底熄灭。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:5}]}] },
      { id:'e_ghost_ferry_keeper_dark', name:'船灯熄灭', intent:'defend', dmg:0, weight:1,
        tell:'他在黑暗中摸索，回复 3 点生命并获得 2 层易伤，不会攻击。',
        effects:[{op:'heal', n:3}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  },

  // ---------- ACT 2 · 幽灯巡逻队 ----------

  { id:'e_ghost_lantern_scout', name:'幽灯斥候', act:2, tier:'normal',
    hp:[34,42], gold:[16,24], glyph:'巡', color:'#72aaa0', size:'normal',
    lore:'他先用灯照亮出口，再从出口后面走出来。',
    moves:[
      { id:'e_ghost_lantern_scout_cut', name:'灯下斩击', intent:'attack', dmg:9, weight:3,
        next:'e_ghost_lantern_scout_trim',
        tell:'刀锋已经离鞘，造成 9 点伤害后会整理灯芯。',
        effects:[{op:'damage', v:9}] },
      { id:'e_ghost_lantern_scout_trim', name:'修剪灯芯', intent:'defend', dmg:0, weight:1,
        tell:'他低头修剪灯芯，只获得 6 点格挡。',
        effects:[{op:'block', v:6}] },
      { id:'e_ghost_lantern_scout_flash', name:'巡逻暗号', intent:'debuff', dmg:0, weight:2,
        once:true, next:'e_ghost_lantern_scout_cut',
        tell:'幽灯连闪两次，施加 2 层虚弱，下一回合拔刀。',
        effects:[{op:'debuff', s:'weak', v:2, t:'all'}] }
    ]
  },

  { id:'e_fog_ticket_clerk', name:'雾票检验员', act:2, tier:'normal',
    hp:[38,46], gold:[18,26], glyph:'票', color:'#b5a88d', size:'normal',
    lore:'他在每张票上盖同一个日期，那一天没有任何一艘船回来。',
    moves:[
      { id:'e_fog_ticket_clerk_punch', name:'验票打孔', intent:'attackDebuff', dmg:6, weight:2,
        once:true, next:'e_fog_ticket_clerk_stamp',
        tell:'票钳朝向你的胸口，造成 6 点伤害和 1 层标记，然后盖章。',
        effects:[{op:'damage', v:6}, {op:'debuff', s:'mark', v:1, t:'all'}] },
      { id:'e_fog_ticket_clerk_stamp', name:'铜章落下', intent:'attack', dmg:10, weight:0,
        next:'e_fog_ticket_clerk_file',
        tell:'铜章将造成 10 点基础伤害，随后检验员必须归档。',
        effects:[{op:'damage', v:10}] },
      { id:'e_fog_ticket_clerk_file', name:'整理旧票', intent:'defend', dmg:0, weight:3,
        next:'e_fog_ticket_clerk_stamp',
        tell:'他只会获得 8 点格挡，下一回合再次盖章。',
        effects:[{op:'block', v:8}] }
    ]
  },

  { id:'e_lantern_chain_guard', name:'提灯锁卫', act:2, tier:'normal',
    hp:[48,56], gold:[20,28], glyph:'锁', color:'#83a6b4', size:'normal',
    lore:'他的灯链连着同伴的锁甲，倒下时最后一圈链才会松开。',
    moves:[
      { id:'e_lantern_chain_guard_swing', name:'链灯抡击', intent:'attack', dmg:12, weight:3,
        tell:'提灯绕成一个完整圆圈，准备造成 12 点伤害。',
        effects:[{op:'damage', v:12}] },
      { id:'e_lantern_chain_guard_cage', name:'灯链合围', intent:'debuff', dmg:0, weight:1,
        once:true, requireTurn:[2], next:'e_lantern_chain_guard_swing',
        tell:'链环围向护腕，施加 2 层束缚，下一回合抡灯。',
        effects:[{op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_lantern_chain_guard_brace', name:'架起锁甲', intent:'defend', dmg:0, weight:2,
        tell:'他获得 14 点格挡；若被击倒，余下同伴会得到 1 层神器。',
        effects:[{op:'block', v:14}] }
    ],
    onDeath:[{op:'buff', s:'artifact', v:1, t:'all'}]
  },

  { id:'e_ash_bell_tracker', name:'灰钟追迹者', act:2, tier:'normal',
    hp:[32,40], gold:[15,23], glyph:'钟', color:'#af9db0', size:'normal',
    lore:'钟声不会传出巷子，却能一直传到你的手指里面。',
    moves:[
      { id:'e_ash_bell_tracker_ring', name:'追迹钟声', intent:'debuff', dmg:0, weight:2,
        next:'e_ash_bell_tracker_twin',
        tell:'钟绳已经拉紧，施加 1 层缠绕，下一回合发动两次攻击。',
        effects:[{op:'debuff', s:'entangled', v:1, t:'all'}] },
      { id:'e_ash_bell_tracker_twin', name:'双音敲击', intent:'attack', dmg:10, weight:0,
        next:'e_ash_bell_tracker_hush',
        tell:'两个钟锤将各造成 5 点伤害，敲完会暂时停声。',
        effects:[{op:'repeat', n:2, then:[{op:'damage', v:5}]}] },
      { id:'e_ash_bell_tracker_hush', name:'捂住钟口', intent:'defend', dmg:0, weight:1,
        tell:'钟口被堵住，只获得 5 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:5}] },
      { id:'e_ash_bell_tracker_tap', name:'钟沿轻击', intent:'attack', dmg:7, weight:2,
        tell:'他只抬起一个钟锤，准备一次 7 点伤害的攻击。',
        effects:[{op:'damage', v:7}] }
    ]
  },

  { id:'e_lantern_inquisitor', name:'幽灯审问官', act:2, tier:'elite',
    hp:[102,116], gold:[48,70], glyph:'审', color:'#72b3a7', size:'large',
    lore:'他要的答案并不在问题里面，而在灯照不到的地方。',
    moves:[
      { id:'e_lantern_inquisitor_aim', name:'锁定灯影', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_lantern_inquisitor_beam',
        tell:'灯罩收窄，获得 10 点格挡，下一回合发射一道强光。',
        effects:[{op:'block', v:10}] },
      { id:'e_lantern_inquisitor_beam', name:'审问光束', intent:'attack', dmg:16, weight:0,
        next:'e_lantern_inquisitor_dim',
        tell:'光束将造成 16 点伤害，灯罩随后会过热。',
        effects:[{op:'damage', v:16}] },
      { id:'e_lantern_inquisitor_dim', name:'冷却灯罩', intent:'defend', dmg:0, weight:1,
        tell:'灯罩冒出冷雾，只获得 5 点格挡和 2 层易伤。',
        effects:[{op:'block', v:5}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] },
      { id:'e_lantern_inquisitor_hunt', name:'逼问斩击', intent:'attackDebuff', dmg:10, weight:2,
        tell:'短刀正在找护甲接缝，造成 10 点伤害并施加 1 层虚弱。',
        effects:[{op:'damage', v:10}, {op:'debuff', s:'weak', v:1, t:'all'}] },
      { id:'e_lantern_inquisitor_spread', name:'三面分光', intent:'attack', dmg:18, weight:2,
        requireHpBelow:0.5, next:'e_lantern_inquisitor_dim',
        tell:'破裂的灯罩把光分成三束，每束造成 6 点伤害，随后冷却。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:6}]}] }
    ]
  },

  { id:'e_tide_glass_diver', name:'潮玻璃潜督', act:2, tier:'elite',
    hp:[110,124], gold:[50,72], glyph:'潜', color:'#79b5b9', size:'large',
    lore:'潜盔里一直有水，水面以下才是他的脸。',
    moves:[
      { id:'e_tide_glass_diver_shell', name:'合拢潜盔', intent:'defend', dmg:0, weight:3,
        next:'e_tide_glass_diver_harpoon',
        tell:'潜盔闭合，获得 18 点格挡和 2 层荆棘，下一回合射出鱼叉。',
        effects:[{op:'block', v:18}, {op:'buff', s:'thorns', v:2, t:'self'}] },
      { id:'e_tide_glass_diver_harpoon', name:'高压鱼叉', intent:'attack', dmg:14, weight:0,
        next:'e_tide_glass_diver_surface',
        tell:'鱼叉将造成 14 点伤害，射出后必须打开潜盔减压。',
        effects:[{op:'damage', v:14}] },
      { id:'e_tide_glass_diver_surface', name:'开盔减压', intent:'defend', dmg:0, weight:1,
        tell:'潜盔打开，失去 2 层荆棘并获得 2 层易伤，本回合不会攻击。',
        effects:[{op:'buff', s:'thorns', v:-2, t:'self'}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] },
      { id:'e_tide_glass_diver_knife', name:'潜刀切割', intent:'attack', dmg:10, weight:2,
        tell:'潜刀沿水线滑动，只会造成 10 点伤害。',
        effects:[{op:'damage', v:10}] },
      { id:'e_tide_glass_diver_shards', name:'碎盔连射', intent:'attack', dmg:18, weight:1,
        requireHpBelow:0.5, next:'e_tide_glass_diver_surface',
        tell:'三片潜盔玻璃已经弹起，各造成 6 点伤害，随后减压。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:6}]}] }
    ]
  },

  { id:'e_ghost_lantern_marshall', name:'幽灯巡夜总长', act:2, tier:'boss',
    hp:[250,280], gold:[140,180], glyph:'夜', color:'#88b8a8', size:'large',
    lore:'城里每一盏没有熄灭的灯，都挂在他的名字下面。',
    moves:[
      { id:'e_ghost_lantern_marshall_align', name:'列齐巡夜灯', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_ghost_lantern_marshall_cross',
        tell:'三盏巡夜灯排成一线，获得 14 点格挡，下一回合三连射。',
        effects:[{op:'block', v:14}] },
      { id:'e_ghost_lantern_marshall_cross', name:'三灯交火', intent:'attack', dmg:15, weight:0,
        requireHpAbove:0.5, next:'e_ghost_lantern_marshall_dim',
        tell:'三盏灯各造成 5 点伤害，发射后总长必须更换灯芯。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:5}]}] },
      { id:'e_ghost_lantern_marshall_verdict', name:'巡夜裁断', intent:'attackDebuff', dmg:12, weight:1,
        next:'e_ghost_lantern_marshall_dim',
        tell:'巡夜刀将造成 12 点伤害和 1 层虚弱，随后整理灯具。',
        effects:[{op:'damage', v:12}, {op:'debuff', s:'weak', v:1, t:'all'}] },
      { id:'e_ghost_lantern_marshall_blackout', name:'熄灭全街', intent:'debuff', dmg:0, weight:2,
        once:true, requireHpBelow:0.5, next:'e_ghost_lantern_marshall_lock',
        tell:'灯油正在淌出，将施加 2 层灼烧，然后重新锁定你的位置。',
        effects:[{op:'debuff', s:'burn', v:2, t:'all'}] },
      { id:'e_ghost_lantern_marshall_lock', name:'封锁灯影', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_ghost_lantern_marshall_storm',
        tell:'三盏破灯转向你，获得 8 点格挡并施加 2 层束缚，下一回合齐射。',
        effects:[{op:'block', v:8}, {op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_ghost_lantern_marshall_storm', name:'碎灯风暴', intent:'attack', dmg:21, weight:0,
        requireHpBelow:0.5, next:'e_ghost_lantern_marshall_dim',
        tell:'三盏碎灯各造成 7 点伤害，之后会完全熄灭一个回合。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:7}]}] },
      { id:'e_ghost_lantern_marshall_dim', name:'更换灯芯', intent:'defend', dmg:0, weight:1,
        tell:'所有灯具都在冷却，只获得 4 点格挡和 2 层易伤，本回合不会攻击。',
        effects:[{op:'block', v:4}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  },

  { id:'e_submerged_beacon', name:'沉海灯塔心', act:2, tier:'boss',
    hp:[260,290], gold:[140,180], glyph:'塔', color:'#84b5ba', size:'large',
    lore:'海平面升到灯室以后，灯塔依然认为每一条影子都是等待导航的船。',
    moves:[
      { id:'e_submerged_beacon_charge', name:'聚拢海光', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_submerged_beacon_sweep',
        tell:'灯塔镜片慢慢聚焦，获得 16 点格挡，下一回合横扫一道光束。',
        effects:[{op:'block', v:16}] },
      { id:'e_submerged_beacon_sweep', name:'海光横扫', intent:'attack', dmg:14, weight:0,
        requireHpAbove:0.5, next:'e_submerged_beacon_cool',
        tell:'光束将造成 14 点伤害，扫完后镜片会停转。',
        effects:[{op:'damage', v:14}] },
      { id:'e_submerged_beacon_tide', name:'污潮拍岸', intent:'attackDebuff', dmg:10, weight:1,
        requireHpAbove:0.5, next:'e_submerged_beacon_cool',
        tell:'污水涌向脚边，造成 10 点伤害和 2 层中毒，随后镜片停转。',
        effects:[{op:'damage', v:10}, {op:'debuff', s:'poison', v:2, t:'all'}] },
      { id:'e_submerged_beacon_crack', name:'灯室开裂', intent:'buff', dmg:0, weight:2,
        once:true, requireHpBelow:0.5, next:'e_submerged_beacon_overload',
        tell:'裂口露出备用光源，只获得 1 点力量，下一回合开始超载蓄光。',
        effects:[{op:'buff', s:'strength', v:1, t:'self'}] },
      { id:'e_submerged_beacon_overload', name:'备用光源蓄能', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_submerged_beacon_arc',
        tell:'三片备用镜面发亮，获得 10 点格挡，下一回合发射三束光。',
        effects:[{op:'block', v:10}] },
      { id:'e_submerged_beacon_arc', name:'三镜共振', intent:'attack', dmg:18, weight:0,
        requireHpBelow:0.5, next:'e_submerged_beacon_cool',
        tell:'三片镜面各造成 6 点基础伤害，之后所有镜片会停止转动。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:6}]}] },
      { id:'e_submerged_beacon_cool', name:'镜片停转', intent:'defend', dmg:0, weight:1,
        tell:'灯塔正在排水，只获得 6 点格挡和 2 层易伤，不会发射光束。',
        effects:[{op:'block', v:6}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  },

  // ---------- ACT 3 · 血契议会 ----------

  { id:'e_blood_ledger_scribe', name:'血账抄写员', act:3, tier:'normal',
    hp:[54,64], gold:[26,38], glyph:'账', color:'#bf7f91', size:'normal',
    lore:'他只抄那些没有签名的账，因为那些账最终都要由活人来认。',
    moves:[
      { id:'e_blood_ledger_scribe_note', name:'记下血债', intent:'attackDebuff', dmg:10, weight:2,
        once:true, next:'e_blood_ledger_scribe_settle',
        tell:'血笔正在落下，造成 10 点伤害和 2 层标记，下一回合追债。',
        effects:[{op:'damage', v:10}, {op:'debuff', s:'mark', v:2, t:'all'}] },
      { id:'e_blood_ledger_scribe_settle', name:'血笔清算', intent:'attack', dmg:14, weight:2,
        next:'e_blood_ledger_scribe_erase',
        tell:'血笔会造成 14 点基础伤害，随后必须擦去旧账。',
        effects:[{op:'damage', v:14}] },
      { id:'e_blood_ledger_scribe_erase', name:'擦去旧账', intent:'defend', dmg:0, weight:1,
        tell:'他低头擦账，只获得 10 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:10}] },
      { id:'e_blood_ledger_scribe_seal', name:'封住牌袋', intent:'debuff', dmg:0, weight:1,
        once:true, requireTurn:[2], next:'e_blood_ledger_scribe_settle',
        tell:'封条绕向护腕，施加 2 层束缚，下一回合追债。',
        effects:[{op:'debuff', s:'bind', v:2, t:'all'}] }
    ]
  },

  { id:'e_contract_bailiff', name:'契约执行吏', act:3, tier:'normal',
    hp:[70,82], gold:[30,44], glyph:'契', color:'#ae829a', size:'normal',
    lore:'他不读契约。他只负责把印章放到最后一块仍然完整的皮肤上。',
    moves:[
      { id:'e_contract_bailiff_writ', name:'宣读强制令', intent:'debuff', dmg:0, weight:3,
        next:'e_contract_bailiff_strike',
        tell:'强制令将施加 2 层易伤，下一回合落下契锤。',
        effects:[{op:'debuff', s:'vulnerable', v:2, t:'all'}] },
      { id:'e_contract_bailiff_strike', name:'契锤落款', intent:'attack', dmg:14, weight:0,
        next:'e_contract_bailiff_sheath',
        tell:'契锤会造成 14 点基础伤害，随后执行吏必须重新装印。',
        effects:[{op:'damage', v:14}] },
      { id:'e_contract_bailiff_sheath', name:'重新装印', intent:'defend', dmg:0, weight:1,
        tell:'他正在更换印章，只获得 10 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:10}] }
    ]
  },

  { id:'e_salt_witness', name:'盐血见证人', act:3, tier:'normal',
    hp:[50,60], gold:[24,36], glyph:'证', color:'#b5aba0', size:'normal',
    lore:'他把每一个看见的名字刻在盐块上，血滴进去以后名字才算成立。',
    moves:[
      { id:'e_salt_witness_cut', name:'盐刀取证', intent:'attack', dmg:12, weight:3,
        tell:'盐刀已握紧，将造成一次 12 点伤害的攻击。',
        effects:[{op:'damage', v:12}] },
      { id:'e_salt_witness_crust', name:'结成盐壳', intent:'defend', dmg:0, weight:1,
        once:true, next:'e_salt_witness_cut',
        tell:'盐壳结硬，获得 12 点格挡和 1 层荆棘，下一回合用盐刀取证。',
        effects:[{op:'block', v:12}, {op:'buff', s:'thorns', v:1, t:'self'}] },
      { id:'e_salt_witness_mend', name:'盐水缝合', intent:'defend', dmg:0, weight:2,
        requireHpBelow:0.5, next:'e_salt_witness_cut',
        tell:'他用盐水缝合伤口，回复 6 点生命并获得 2 层虚弱，下一次取证会减弱。',
        effects:[{op:'heal', n:6}, {op:'debuff', s:'weak', v:2, t:'self'}] }
    ]
  },

  { id:'e_cinder_notary', name:'烬印公证人', act:3, tier:'normal',
    hp:[62,72], gold:[28,42], glyph:'印', color:'#ca8273', size:'normal',
    lore:'他把公证书烤到字迹消失，剩下的温度才是证明。',
    moves:[
      { id:'e_cinder_notary_brand', name:'烬印烙下', intent:'attackDebuff', dmg:11, weight:1,
        once:true, next:'e_cinder_notary_ash',
        tell:'烧红的公证印会造成 11 点伤害和 1 层灼烧，之后必须清理炉灰。',
        effects:[{op:'damage', v:11}, {op:'debuff', s:'burn', v:1, t:'all'}] },
      { id:'e_cinder_notary_press', name:'双印核对', intent:'attack', dmg:14, weight:3,
        next:'e_cinder_notary_ash',
        tell:'两枚铜印将各造成 7 点伤害，落印后会暂停清灰。',
        effects:[{op:'repeat', n:2, then:[{op:'damage', v:7}]}] },
      { id:'e_cinder_notary_ash', name:'清理炉灰', intent:'defend', dmg:0, weight:1,
        tell:'他正把灰拨进抽屉，只获得 9 点格挡，本回合不会攻击。',
        effects:[{op:'block', v:9}] },
      { id:'e_cinder_notary_fault', name:'指出印缝', intent:'debuff', dmg:0, weight:1,
        requireTurn:[2], next:'e_cinder_notary_press',
        tell:'他指向护甲接缝，施加 2 层脆骨，下一回合核对双印。',
        effects:[{op:'debuff', s:'frail', v:2, t:'all'}] }
    ]
  },

  { id:'e_oath_executioner', name:'誓约行刑官', act:3, tier:'elite',
    hp:[160,180], gold:[78,106], glyph:'刑', color:'#b57d99', size:'large',
    lore:'他只执行在场的人亲口确认过的誓言，包括临死前说出的那句。',
    moves:[
      { id:'e_oath_executioner_measure', name:'量刑刻度', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_oath_executioner_axe',
        tell:'斧柄上的刻度被锁定，获得 16 点格挡，下一回合落下一斧。',
        effects:[{op:'block', v:16}] },
      { id:'e_oath_executioner_axe', name:'契斧行刑', intent:'attack', dmg:22, weight:0,
        next:'e_oath_executioner_withdraw',
        tell:'契斧将造成 22 点伤害，劈完会嵌在地里。',
        effects:[{op:'damage', v:22}] },
      { id:'e_oath_executioner_withdraw', name:'拔出契斧', intent:'defend', dmg:0, weight:1,
        tell:'契斧卡在地缝，行刑官只获得 6 点格挡和 2 层易伤。',
        effects:[{op:'block', v:6}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] },
      { id:'e_oath_executioner_backhand', name:'斧背驱赶', intent:'attack', dmg:16, weight:2,
        next:'e_oath_executioner_withdraw',
        tell:'斧背将造成 16 点伤害，之后必须重新握柄。',
        effects:[{op:'damage', v:16}] },
      { id:'e_oath_executioner_sentence', name:'重订刑期', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_oath_executioner_triple',
        tell:'他翻开最后三条誓约，获得 12 点格挡并施加 1 层缠绕，下一回合三连斩。',
        effects:[{op:'block', v:12}, {op:'debuff', s:'entangled', v:1, t:'all'}] },
      { id:'e_oath_executioner_triple', name:'三誓清算', intent:'attack', dmg:24, weight:0,
        requireHpBelow:0.5, next:'e_oath_executioner_withdraw',
        tell:'三条誓约各落下一次 8 点伤害的斩击，随后契斧再次卡住。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:8}]}] }
    ]
  },

  { id:'e_council_sealkeeper', name:'议会封印保管人', act:3, tier:'elite',
    hp:[170,190], gold:[80,108], glyph:'封', color:'#b1a48f', size:'large',
    lore:'他负责保管从未通过的法案。每一块封印都还有一点脉搏。',
    moves:[
      { id:'e_council_sealkeeper_close', name:'合拢铁封', intent:'defend', dmg:0, weight:3,
        next:'e_council_sealkeeper_stamp',
        tell:'铁封合拢，获得 20 点格挡和 3 层金属化，下一回合压印。',
        effects:[{op:'block', v:20}, {op:'buff', s:'metallicize', v:3, t:'self'}] },
      { id:'e_council_sealkeeper_stamp', name:'议会压印', intent:'attack', dmg:18, weight:0,
        next:'e_council_sealkeeper_open',
        tell:'铁封将造成 18 点基础伤害，压印后会打开封匣。',
        effects:[{op:'damage', v:18}] },
      { id:'e_council_sealkeeper_open', name:'打开封匣', intent:'defend', dmg:0, weight:1,
        tell:'封匣打开，失去 3 层金属化，只获得 4 点格挡和 2 层易伤。',
        effects:[{op:'buff', s:'metallicize', v:-3, t:'self'}, {op:'block', v:4},
          {op:'debuff', s:'vulnerable', v:2, t:'self'}] },
      { id:'e_council_sealkeeper_chain', name:'封链抽打', intent:'attack', dmg:14, weight:2,
        tell:'封链正在摆动，只会造成 14 点基础伤害。',
        effects:[{op:'damage', v:14}] },
      { id:'e_council_sealkeeper_break', name:'废除旧封', intent:'buff', dmg:0, weight:2,
        once:true, requireHpBelow:0.5, next:'e_council_sealkeeper_stamp',
        tell:'旧封被打碎，获得 2 点力量，下一回合压印，之后仍须打开封匣。',
        effects:[{op:'buff', s:'strength', v:2, t:'self'}] }
    ]
  },

  { id:'e_blood_contract_speaker', name:'血契议会代言人', act:3, tier:'boss',
    hp:[290,320], gold:[180,200], glyph:'议', color:'#bf8199', size:'large',
    lore:'整间议会只有他一张嘴。其他席位上的人都已在契约里签过字了。',
    moves:[
      { id:'e_blood_contract_speaker_read', name:'宣读债条', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_blood_contract_speaker_verdict',
        tell:'他抬起债条，获得 16 点格挡并施加 1 层标记，下一回合裁决。',
        effects:[{op:'block', v:16}, {op:'debuff', s:'mark', v:1, t:'all'}] },
      { id:'e_blood_contract_speaker_verdict', name:'议会裁决', intent:'attack', dmg:18, weight:0,
        requireHpAbove:0.5, next:'e_blood_contract_speaker_recess',
        tell:'法槌将造成 18 点基础伤害，裁决后必须休庭整理契约。',
        effects:[{op:'damage', v:18}] },
      { id:'e_blood_contract_speaker_question', name:'交叉质询', intent:'attackDebuff', dmg:12, weight:1,
        requireHpAbove:0.5, next:'e_blood_contract_speaker_recess',
        tell:'铁笔将造成 12 点基础伤害和 1 层虚弱，随后休庭。',
        effects:[{op:'damage', v:12}, {op:'debuff', s:'weak', v:1, t:'all'}] },
      { id:'e_blood_contract_speaker_sign', name:'封死血契', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_blood_contract_speaker_execute',
        tell:'血契边缘开始凝固，获得 12 点格挡并施加 2 层束缚，下一回合强制执行。',
        effects:[{op:'block', v:12}, {op:'debuff', s:'bind', v:2, t:'all'}] },
      { id:'e_blood_contract_speaker_execute', name:'强制执行', intent:'attack', dmg:24, weight:0,
        requireHpBelow:0.5, next:'e_blood_contract_speaker_recess',
        tell:'血契将造成一次 24 点基础伤害的重击，之后代言人必须休庭。',
        effects:[{op:'damage', v:24}] },
      { id:'e_blood_contract_speaker_final', name:'最后三条附款', intent:'attack', dmg:30, weight:1,
        once:true, requireHpBelow:0.25, next:'e_blood_contract_speaker_recess',
        tell:'最后三条附款同时生效，各造成 10 点基础伤害，只会使用一次，随后休庭。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:10}]}] },
      { id:'e_blood_contract_speaker_recess', name:'休庭整理', intent:'defend', dmg:0, weight:1,
        tell:'代言人低头整理契约，只获得 5 点格挡和 2 层易伤，本回合不会攻击。',
        effects:[{op:'block', v:5}, {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  },

  { id:'e_red_council_engine', name:'赤议院决议机', act:3, tier:'boss',
    hp:[300,320], gold:[180,200], glyph:'决', color:'#ba827b', size:'large',
    lore:'议员退场后，机器仍在投票。每次全票通过，炉门就向外打开一点。',
    moves:[
      { id:'e_red_council_engine_ratify', name:'核准议案', intent:'defend', dmg:0, weight:3,
        requireHpAbove:0.5, next:'e_red_council_engine_stamp',
        tell:'压印台升起，获得 18 点格挡，下一回合落下核准印。',
        effects:[{op:'block', v:18}] },
      { id:'e_red_council_engine_stamp', name:'核准印坠落', intent:'attack', dmg:16, weight:0,
        requireHpAbove:0.5, next:'e_red_council_engine_idle',
        tell:'核准印将造成 16 点伤害，落印后机器必须退回空档。',
        effects:[{op:'damage', v:16}] },
      { id:'e_red_council_engine_archive', name:'铁皮归档', intent:'defend', dmg:0, weight:1,
        once:true, requireHpAbove:0.5, next:'e_red_council_engine_stamp',
        tell:'档案铁皮向外张开，获得 12 点格挡和 2 层荆棘，下一回合落印。',
        effects:[{op:'block', v:12}, {op:'buff', s:'thorns', v:2, t:'self'}] },
      { id:'e_red_council_engine_override', name:'紧急表决', intent:'defend', dmg:0, weight:3,
        requireHpBelow:0.5, next:'e_red_council_engine_triple',
        tell:'三座压印台一起升起，获得 10 点格挡，下一回合三印连落。',
        effects:[{op:'block', v:10}] },
      { id:'e_red_council_engine_triple', name:'三印全票通过', intent:'attack', dmg:24, weight:0,
        requireHpBelow:0.5, next:'e_red_council_engine_idle',
        tell:'三枚决议印各造成 8 点伤害，落印后所有压台会回到空档。',
        effects:[{op:'repeat', n:3, then:[{op:'damage', v:8}]}] },
      { id:'e_red_council_engine_emergency', name:'焚毁否决票', intent:'attackDebuff', dmg:28, weight:1,
        once:true, requireHpBelow:0.25, next:'e_red_council_engine_idle',
        tell:'否决票被送进炉门，造成 28 点伤害和 1 层灼烧，只会执行一次，随后停机。',
        effects:[{op:'damage', v:28}, {op:'debuff', s:'burn', v:1, t:'all'}] },
      { id:'e_red_council_engine_idle', name:'压台空档', intent:'defend', dmg:0, weight:1,
        tell:'压台正在归位，失去 2 层荆棘，只获得 4 点格挡和 2 层易伤。',
        effects:[{op:'buff', s:'thorns', v:-2, t:'self'}, {op:'block', v:4},
          {op:'debuff', s:'vulnerable', v:2, t:'self'}] }
    ]
  }

];

export const ENEMIES = [...BASE_ENEMIES, ...HARBOR_ENEMIES, ...DEPTH_ENEMIES];
