// 深层六区域事件：每区域 3 个、每事件 3 个互斥选项。
// 费用必须实际扣除；随机删牌和概率结果均在选项中说明。
export const DEPTH_EVENTS = [
  // ---------- ACT 4 · 冰封盐井 ----------
  { id:'ev_d_salt_lift', name:'冻住的盐井升降机', glyph:'闸', act:4, regionId:'r_frozen_mine',
    text:'升降机停在井口和井底之间，检票员的指甲已经冻在工牌上。他给你三条下井的路：开闸、破冰，或者把多余的行李留在配重箱里。',
    options:[
      { label:'买下备用闸门钥匙', desc:'支付 80 金币，永久加入「闸门密钥」。', req:{gold:80},
        result:{text:'钥匙从冰里拔出来，齿槽还带着升降机最后一次开门时的热。',
          effects:[{op:'gold',n:-80},{op:'addDeck',card:'c_r_gate_key'}]} },
      { label:'沿冰柱滑进井底', desc:'失去 12 点生命，永久加入「霜棱贯穿」，获得 25 金币。',
        result:{text:'冰柱划开了袖口，你也记住了霜棱穿过铁甲的角度。',
          effects:[{op:'loseHp',n:12},{op:'addDeck',card:'c_i_rime_lance'},{op:'gold',n:25}]} },
      { label:'交出两张牌做配重', desc:'随机移除 2 张牌，随机升级至多 2 张未升级的牌。', req:{deckSizeAbove:13},
        result:{text:'配重箱沉下去，升降机把你剩余的牌压得更结实了。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'upgradeCard',n:2}]} }
    ]
  },
  { id:'ev_d_frozen_payroll', name:'冻薪发放处', glyph:'薪', act:4, regionId:'r_frozen_mine',
    text:'工资单冻在盐块里，出纳把火钳、破冰锤和一只空的牌袋摆成一排。每笔工资只承认一种取法，取完之后盐块就会重新合上。',
    options:[
      { label:'支付化冻手续费', desc:'支付 40 金币，获得 75~95 金币。', req:{gold:40},
        result:{text:'盐块慢慢化开，最外面的一份工资落到了你手里。',
          effects:[{op:'gold',n:-40}],loot:{gold:[75,95]}} },
      { label:'徒手砸开深层工资', desc:'先失去 10 点生命；65% 获得 150 金币，35% 再失去 8 点生命并获得 30 金币。',
        result:{text:'深层盐块裂开的声音很清脆，里面有时是钱，有时只剩一枚旧工牌。',
          effects:[{op:'loseHp',n:10},{op:'if',cond:{type:'chance',p:0.65},
            then:[{op:'gold',n:150}],else:[{op:'loseHp',n:8},{op:'gold',n:30}]}]} },
      { label:'注销一件自带工具', desc:'随机移除 1 张牌，回复 20 点生命并获得 35 金币。', req:{deckSizeAbove:10},
        result:{text:'旧工具归入公库，出纳退回了押金和一小罐温盐水。',
          effects:[{op:'removeCard'},{op:'heal',n:20},{op:'gold',n:35}]} }
    ]
  },
  { id:'ev_d_miner_memorial', name:'盐井无字碑', glyph:'碑', act:4, regionId:'r_frozen_mine',
    text:'碑上没有名字，只有一圈圈被盐蚀出来的手印。守碑人说盐不肯记住字，却能记住人的重量，他正在给下一枚手印留位置。',
    options:[
      { label:'捐款加固无字碑', desc:'支付 65 金币，永久增加 4 点最大生命。', req:{gold:65},
        result:{text:'新的碑脚站稳了，你的影子也像重新找到一块能站的地。',
          effects:[{op:'gold',n:-65},{op:'maxHp',n:4}]} },
      { label:'割掉伤口里的冻盐', desc:'永久失去 4 点最大生命，回复 40 点生命。',
        result:{text:'冻盐留在碑脚，你带着少一点的身体继续走，但伤口终于不响了。',
          effects:[{op:'maxHp',n:-4},{op:'heal',n:40}]} },
      { label:'烧掉两张牌祭井', desc:'随机移除 2 张牌，随机升级至多 3 张未升级的牌。', req:{deckSizeAbove:14},
        result:{text:'纸灰落进手印，余下的牌面上结起一层很薄的硬盐。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'upgradeCard',n:3}]} }
    ]
  },

  // ---------- ACT 4 · 断流冰库 ----------
  { id:'ev_d_last_water', name:'最后一滴活水', glyph:'水', act:4, regionId:'r_ice_reservoir',
    text:'活水悬在玻璃管里，管外的冰却每天都在增厚。守水人按钱、血和旧招式开出三种水票，兑过一种，剩下的水票就要当场烧掉。',
    options:[
      { label:'买一张温水票', desc:'支付 55 金币，回复 32 点生命。', req:{gold:55},
        result:{text:'水温刚好够让僵硬的手指重新张开。',
          effects:[{op:'gold',n:-55},{op:'heal',n:32}]} },
      { label:'在冰管上留下血纹', desc:'失去 12 点生命，永久增加 6 点最大生命。',
        result:{text:'血纹融进玻璃，你胸口的呼吸也慢慢多出了一点余地。',
          effects:[{op:'loseHp',n:12},{op:'maxHp',n:6}]} },
      { label:'用一张旧牌交换霜息', desc:'随机移除 1 张牌，永久加入「霜息喷涌」。', req:{deckSizeAbove:10},
        result:{text:'旧牌被水管吸走，吐出来的一口寒息有了可以握住的形状。',
          effects:[{op:'removeCard'},{op:'addDeck',card:'c_i_glacier_breath'}]} }
    ]
  },
  { id:'ev_d_cold_storage', name:'断流冷藏寄物处', glyph:'藏', act:4, regionId:'r_ice_reservoir',
    text:'每只冷藏柜都写着一个已经不在的人。柜台后的寄物员愿意让你取一份，但必须补上仓储费，或者交出能说明你确实来过的东西。',
    options:[
      { label:'付清一格仓储费', desc:'支付 75 金币，从遗物奖励中选择 1 件。', req:{gold:75},
        result:{text:'寄物员划掉一个旧名字，柜门后的物品还保持着被放进去的姿态。',
          effects:[{op:'gold',n:-75}],loot:{relics:1}} },
      { label:'徒手取下冻柜锁', desc:'失去 11 点生命，获得 2 瓶随机药水。',
        result:{text:'冻柜锁粘走了一层皮，柜内的两瓶补给却没有冻坏。',
          effects:[{op:'loseHp',n:11}],loot:{potions:[2,2]}} },
      { label:'留一张牌做新的寄物', desc:'随机移除 1 张牌，获得 70 金币。', req:{deckSizeAbove:10},
        result:{text:'寄物员不记你的名字，只把钱放在腾出来的那格位置上。',
          effects:[{op:'removeCard'},{op:'gold',n:70}]} }
    ]
  },
  { id:'ev_d_ice_valve_wager', name:'霜阀试压台', glyph:'阀', act:4, regionId:'r_ice_reservoir',
    text:'试压台只剩最后一只还能转动的阀门。检验官把保险单压在台上，又把手套放在旁边，说有人付钱试，有人亲手试，还有人把旧本事拆了重做。',
    options:[
      { label:'买一份完整保险', desc:'支付 60 金币，随机升级至多 2 张未升级的牌。', req:{gold:60},
        result:{text:'保险单收走了，检验官在你的牌上补好两处最容易裂开的缝。',
          effects:[{op:'gold',n:-60},{op:'upgradeCard',n:2}]} },
      { label:'把手握在霜阀上', desc:'先失去 8 点生命；60% 永久加入「冻土庇护」，40% 再失去 4 点生命并获得 45 金币。',
        result:{text:'霜阀转动时，冻土有时让开一条路，有时只吐出检验官的赔款。',
          effects:[{op:'loseHp',n:8},{op:'if',cond:{type:'chance',p:0.6},
            then:[{op:'addDeck',card:'c_i_permafrost_ward'}],else:[{op:'loseHp',n:4},{op:'gold',n:45}]}]} },
      { label:'拆掉两张旧牌的阀芯', desc:'随机移除 2 张牌，回复 26 点生命，永久加入「冻疮啃咬」。', req:{deckSizeAbove:14},
        result:{text:'旧阀芯被冻土吞下，留下的一点寒气可以从此握在手里。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'heal',n:26},{op:'addDeck',card:'c_i_frostbite'}]} }
    ]
  },

  // ---------- ACT 5 · 雷鸣机城 ----------
  { id:'ev_d_storm_bill', name:'雷电欠费窗口', glyph:'电', act:5, regionId:'r_thunder_city',
    text:'整条街只剩收费窗口还亮着。账单按硬币、电荷和随身工具三项开列，收费员说只要补清一项，城里就会把另外两项暂时忘掉。',
    options:[
      { label:'买回一份停机退款', desc:'支付 45 金币，获得 90~120 金币。', req:{gold:45},
        result:{text:'机器核对完上一班的停机时间，退下来的钱带着一点电流的麻。',
          effects:[{op:'gold',n:-45}],loot:{gold:[90,120]}} },
      { label:'以身体承受一次校准', desc:'失去 14 点生命，永久增加 6 点最大生命。',
        result:{text:'校准电流走过胸口，收费员把你的承载量写成了新的数字。',
          effects:[{op:'loseHp',n:14},{op:'maxHp',n:6}]} },
      { label:'注销一件导电工具', desc:'随机移除 1 张牌，永久加入「线圈放电」。', req:{deckSizeAbove:11},
        result:{text:'工具从账上消失，留下的电荷被卷成一张新的放电图。',
          effects:[{op:'removeCard'},{op:'addDeck',card:'c_i_coil_discharge'}]} }
    ]
  },
  { id:'ev_d_relay_bench', name:'继电器校验台', glyph:'继', act:5, regionId:'r_thunder_city',
    text:'校验台不停在通和断之间跳动，技师把三根测试线递到你面前。每根线后面都有一个工单，换线就意味着作废刚才那一张。',
    options:[
      { label:'支付整套校验费用', desc:'支付 85 金币，随机升级至多 3 张未升级的牌。', req:{gold:85},
        result:{text:'技师把全部接点擦亮，你的牌也多出三道能承受电流的边。',
          effects:[{op:'gold',n:-85},{op:'upgradeCard',n:3}]} },
      { label:'握住未经测试的导线', desc:'先失去 12 点生命；65% 随机升级至多 3 张牌，35% 再失去 6 点生命并获得 50 金币。',
        result:{text:'导线先响了一声，技师随后才判断那声响是成功还是事故。',
          effects:[{op:'loseHp',n:12},{op:'if',cond:{type:'chance',p:0.65},
            then:[{op:'upgradeCard',n:3}],else:[{op:'loseHp',n:6},{op:'gold',n:50}]}]} },
      { label:'用旧牌换一只铜笼', desc:'随机移除 1 张牌，永久加入「铜笼」，获得 20 金币。', req:{deckSizeAbove:11},
        result:{text:'旧牌做成了绝缘衬里，技师把修好的铜笼交给你。',
          effects:[{op:'removeCard'},{op:'addDeck',card:'c_i_copper_cage'},{op:'gold',n:20}]} }
    ]
  },
  { id:'ev_d_grounding_market', name:'接地线夜市', glyph:'线', act:5, regionId:'r_thunder_city',
    text:'夜市的摊位全都拴着接地线，摊主不许客人碰两根线。他们把钱价、伤价和旧料价分别写在三根线末端，写好以后就不再改。',
    options:[
      { label:'购买一张风暴线路图', desc:'支付 90 金币，永久加入「离子风暴」。', req:{gold:90},
        result:{text:'线路图一折好，街头远处就有一阵还没下来的雷声。',
          effects:[{op:'gold',n:-90},{op:'addDeck',card:'c_i_ion_storm'}]} },
      { label:'帮摊主接回断线', desc:'失去 10 点生命，获得 2 瓶随机药水。',
        result:{text:'断线灼伤了指缝，摊主把两瓶修理工补给当作工钱递来。',
          effects:[{op:'loseHp',n:10}],loot:{potions:[2,2]}} },
      { label:'交出两件旧料', desc:'随机移除 2 张牌，永久增加 5 点最大生命。', req:{deckSizeAbove:14},
        result:{text:'旧料被接进地线，你身上的杂音也跟着安静了一点。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'maxHp',n:5}]} }
    ]
  },

  // ---------- ACT 5 · 浮空轨场 ----------
  { id:'ev_d_sky_ticket', name:'没有列车的售票处', glyph:'票', act:5, regionId:'r_sky_rail',
    text:'售票员的窗口开在空中，窗口下面没有站台。三种票上分别印着钱袋、伤口和空行李架，售票员从来不问你想去哪里。',
    options:[
      { label:'买一张夜间转乘票', desc:'支付 65 金币，永久加入「夜渡凭证」。', req:{gold:65},
        result:{text:'售票员把票边剪掉一角，足够让你认出下一盏灯下的出口。',
          effects:[{op:'gold',n:-65},{op:'addDeck',card:'c_l_night_pass'}]} },
      { label:'沿导电索翻过窗口', desc:'失去 12 点生命，永久加入「弧光跃」和「静电穿刺」。',
        result:{text:'空中的导电索让你学会了先借一束弧光，再把脚落下。',
          effects:[{op:'loseHp',n:12},{op:'addDeck',card:'c_i_arc_jump'},{op:'addDeck',card:'c_i_static_strike'}]} },
      { label:'减轻一张牌的行李', desc:'随机移除 1 张牌，回复 24 点生命。', req:{deckSizeAbove:11},
        result:{text:'行李架终于不响了，售票员递出一张用来包扎的旧软票。',
          effects:[{op:'removeCard'},{op:'heal',n:24}]} }
    ]
  },
  { id:'ev_d_derailed_cargo', name:'悬挂的脱轨货厢', glyph:'厢', act:5, regionId:'r_sky_rail',
    text:'货厢挂在两段已经断开的轨道之间，管理员坐在车门上收过路费。他说货厢只够再落一次，所以这次只能挑一种方式把货取走。',
    options:[
      { label:'付钱打开保险货格', desc:'支付 70 金币，从遗物奖励中选择 1 件。', req:{gold:70},
        result:{text:'保险格在货厢晃动之前弹开，里面的东西仍被妥善固定着。',
          effects:[{op:'gold',n:-70}],loot:{relics:1}} },
      { label:'跳进正在下坠的暗格', desc:'先失去 9 点生命；55% 获得 150 金币，45% 再失去 9 点生命并获得 40 金币。',
        result:{text:'暗格在下坠中打开，能抓住多少，取决于你比散落的货物快多少。',
          effects:[{op:'loseHp',n:9},{op:'if',cond:{type:'chance',p:0.55},
            then:[{op:'gold',n:150}],else:[{op:'loseHp',n:9},{op:'gold',n:40}]}]} },
      { label:'留下旧牌固定货厢', desc:'随机移除 1 张牌，随机升级至多 2 张未升级的牌。', req:{deckSizeAbove:11},
        result:{text:'旧牌垫住一段断轨，管理员用随身铆钉给剩下的牌补好了边框。',
          effects:[{op:'removeCard'},{op:'upgradeCard',n:2}]} }
    ]
  },
  { id:'ev_d_empty_platform', name:'空站台医务亭', glyph:'亭', act:5, regionId:'r_sky_rail',
    text:'医务亭的床铺都系着绳子，风大的时候床比人先离开地面。医生把诊金写在票背上，说这站已经没有下一班，欠账得在这里结完。',
    options:[
      { label:'支付现钱诊金', desc:'支付 55 金币，回复 35 点生命。', req:{gold:55},
        result:{text:'医生把床系回站台，在摇晃停止之前缝好了最深的伤口。',
          effects:[{op:'gold',n:-55},{op:'heal',n:35}]} },
      { label:'割去无法愈合的伤痕', desc:'永久失去 4 点最大生命，回复 45 点生命。',
        result:{text:'旧伤被留在空站台，你的行李终于不再一直带着它。',
          effects:[{op:'maxHp',n:-4},{op:'heal',n:45}]} },
      { label:'交出两张旧车票', desc:'随机移除 2 张牌，获得 100 金币。', req:{deckSizeAbove:14},
        result:{text:'医生把旧牌收进退票箱，站台退回最后一笔没用上的路费。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'gold',n:100}]} }
    ]
  },

  // ---------- ACT 6 · 星蚀深渊 ----------
  { id:'ev_d_star_chart', name:'缺星航图', glyph:'星', act:6, regionId:'r_eclipse_abyss',
    text:'航图上缺了六颗星，制图人用你的影子量它们原来的位置。他把三种补图材料摆在桌上，星位一旦补好，另外两种材料就要送回深渊。',
    options:[
      { label:'买下终审星图', desc:'支付 100 金币，永久加入「断罪」。', req:{gold:100},
        result:{text:'最后一颗星被画在图边，你从那条边上读到一段可以落下的判词。',
          effects:[{op:'gold',n:-100},{op:'addDeck',card:'c_a_verdict'}]} },
      { label:'以自己的影子补星位', desc:'失去 16 点生命，永久增加 8 点最大生命。',
        result:{text:'缺星的地方亮了一瞬，你的影子从此多出一段不容易折断的轮廓。',
          effects:[{op:'loseHp',n:16},{op:'maxHp',n:8}]} },
      { label:'让一张旧牌成为坐标', desc:'随机移除 1 张牌，随机升级至多 3 张未升级的牌。', req:{deckSizeAbove:12},
        result:{text:'坐标定住以后，余下的牌终于知道该往哪一个方向发力。',
          effects:[{op:'removeCard'},{op:'upgradeCard',n:3}]} }
    ]
  },
  { id:'ev_d_eclipsed_archive', name:'蚀星藏书台', glyph:'书', act:6, regionId:'r_eclipse_abyss',
    text:'藏书台上每本书都压着一小片没有光的夜。管理员把金币秤、裂纹手套和旧书槽递过来，说借书的方式会决定哪一页肯跟你走。',
    options:[
      { label:'付清一本书的押金', desc:'支付 95 金币，从遗物奖励中选择 1 件。', req:{gold:95},
        result:{text:'管理员翻开封底，那里压着一件远比书页更早的旧物。',
          effects:[{op:'gold',n:-95}],loot:{relics:1}} },
      { label:'徒手掀开无光书页', desc:'先失去 14 点生命；60% 永久加入「玻璃吐息」，40% 再失去 6 点生命并获得 60 金币。',
        result:{text:'无光书页擦过手心，留下的有时是呼吸，有时是很久以前欠下的赔款。',
          effects:[{op:'loseHp',n:14},{op:'if',cond:{type:'chance',p:0.6},
            then:[{op:'addDeck',card:'c_a_glass_breath'}],else:[{op:'loseHp',n:6},{op:'gold',n:60}]}]} },
      { label:'用两张旧牌换一页', desc:'随机移除 2 张牌，永久加入「第六口气」。', req:{deckSizeAbove:15},
        result:{text:'旧书槽合上了，你带走的一页在手心里慢慢起伏。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'addDeck',card:'c_a_sixth_breath'}]} }
    ]
  },
  { id:'ev_d_dark_lens', name:'死星镜磨坊', glyph:'镜', act:6, regionId:'r_eclipse_abyss',
    text:'镜磨坊只磨碎星落下来的边角，磨成的粉从来不肯发亮。磨镜人把三张工单摊开，每张都要留下不同的磨料，付完就不能再换。',
    options:[
      { label:'购买一枚新月镜片', desc:'支付 70 金币，永久加入「玻璃新月」。', req:{gold:70},
        result:{text:'镜片的弯缘不映人脸，只映出刀刃该经过的位置。',
          effects:[{op:'gold',n:-70},{op:'addDeck',card:'c_a_glass_crescent'}]} },
      { label:'帮磨坊分拣碎镜', desc:'失去 12 点生命，获得 2 瓶随机药水和 30 金币。',
        result:{text:'碎镜割开了指节，磨镜人把夜班药和工钱一起结清。',
          effects:[{op:'loseHp',n:12},{op:'gold',n:30}],loot:{potions:[2,2]}} },
      { label:'把旧牌磨成镜衬', desc:'随机移除 1 张牌，回复 30 点生命。', req:{deckSizeAbove:12},
        result:{text:'镜衬接住了你身上最刺人的那一点寒意，手指也重新暖起来。',
          effects:[{op:'removeCard'},{op:'heal',n:30}]} }
    ]
  },

  // ---------- ACT 6 · 零火圣所 ----------
  { id:'ev_d_zero_flame_altar', name:'零火誓坛', glyph:'誓', act:6, regionId:'r_last_sanctum',
    text:'誓坛没有火，誓纸却一直温热。看坛人给出三种签署方式，说末火只承认一份完整的承诺，不能把三份代价拆开混着付。',
    options:[
      { label:'买下最后誓约', desc:'支付 100 金币，永久加入「最后誓约」。', req:{gold:100},
        result:{text:'钱袋压住了旧誓纸，看坛人把最后一份还能签署的承诺交给你。',
          effects:[{op:'gold',n:-100},{op:'addDeck',card:'c_o_last_covenant'}]} },
      { label:'将血留在熄火处', desc:'失去 18 点生命，永久增加 8 点最大生命。',
        result:{text:'熄火处没有重新亮起来，但你胸口剩下的那一点热站稳了。',
          effects:[{op:'loseHp',n:18},{op:'maxHp',n:8}]} },
      { label:'把两张旧誓纸留在坛上', desc:'随机移除 2 张牌，从遗物奖励中选择 1 件。', req:{deckSizeAbove:15},
        result:{text:'旧誓纸压住了坛底的裂口，裂口下面露出前一任守誓者的物品。',
          effects:[{op:'removeCard'},{op:'removeCard'}],loot:{relics:1}} }
    ]
  },
  { id:'ev_d_last_confession', name:'末火告解间', glyph:'解', act:6, regionId:'r_last_sanctum',
    text:'告解间的屏风只剩一扇，后面传来缓慢数钱的声音。告解师把三只碗放到屏风下面：一只装诊金，一只装旧伤，一只装你不想再带走的故事。',
    options:[
      { label:'支付现钱告解费', desc:'支付 80 金币，回复 45 点生命。', req:{gold:80},
        result:{text:'屏风后面的声音停了，身上最深的伤终于能自己合拢。',
          effects:[{op:'gold',n:-80},{op:'heal',n:45}]} },
      { label:'将一段旧伤留下', desc:'永久失去 5 点最大生命，回复 55 点生命。',
        result:{text:'告解师封住了那段不肯愈合的旧伤，让你剩余的身体轻了一点。',
          effects:[{op:'maxHp',n:-5},{op:'heal',n:55}]} },
      { label:'烧掉一张旧故事', desc:'随机移除 1 张牌，随机升级至多 3 张未升级的牌。', req:{deckSizeAbove:12},
        result:{text:'故事烧完以后，剩下的牌面再也不需要绕开同一处空白。',
          effects:[{op:'removeCard'},{op:'upgradeCard',n:3}]} }
    ]
  },
  { id:'ev_d_ember_testament', name:'余烬遗嘱柜', glyph:'柜', act:6, regionId:'r_last_sanctum',
    text:'遗嘱柜里没有纸，只有一层层还保持形状的灰。司炉官把金币盘、取灰钳和旧牌匣推向你，说最后一份遗嘱只能交给一种继承人。',
    options:[
      { label:'补缴遗嘱保管费', desc:'支付 55 金币，获得 100~150 金币。', req:{gold:55},
        result:{text:'保管费结清以后，一袋已经冷却的硬币从灰里露了出来。',
          effects:[{op:'gold',n:-55}],loot:{gold:[100,150]}} },
      { label:'用手捧起最后一层灰', desc:'先失去 10 点生命；65% 永久加入「最终之锚」，35% 再失去 8 点生命并获得 70 金币。',
        result:{text:'灰里有时留着最后一件可以握住的东西，有时只剩不再需要的零钱。',
          effects:[{op:'loseHp',n:10},{op:'if',cond:{type:'chance',p:0.65},
            then:[{op:'addDeck',card:'c_a_final_anchor'}],else:[{op:'loseHp',n:8},{op:'gold',n:70}]}]} },
      { label:'用两张旧牌接回遗嘱', desc:'随机移除 2 张牌，永久加入「第十二次呼吸」。', req:{deckSizeAbove:15},
        result:{text:'旧牌匣接住最后一点灰，你的下一次呼吸终于不用借别人的余温。',
          effects:[{op:'removeCard'},{op:'removeCard'},{op:'addDeck',card:'c_spc_twelfth_breath'}]} }
    ]
  }
];
