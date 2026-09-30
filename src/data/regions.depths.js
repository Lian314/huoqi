// 每区域：4 普通编队、2 精英、2 Boss、1 同幕前哨与 3 专属事件。
// 开场状态只赋予一次；首回合资源在 firstTurn 中结算。
export const DEPTH_REGIONS = [
  { id:'r_frozen_mine', act:4, name:'冰封盐井', title:'冻盐下的旧工单',
    text:'盐井的升降机停在半空，采掘工把名字留在冻盐里。碎裂的护甲和细小的盐缝决定第一轮交锋。',
    color:'#83b4b2', art:'/assets/regions/r_frozen_mine.svg',
    rule:{name:'盐霜裂甲',text:'你开场获得 1 层脆骨，首回合获得 6 点基础格挡；每名敌人开场获得 1 层碎裂。',
      playerStart:[{op:'debuff',s:'frail',v:1,t:'self'}],
      enemyStart:[{op:'buff',s:'splinter',v:1,t:'self'}],firstTurn:[{op:'block',v:6}]},
    encounters:[
      {id:'enc_d_mine_cut',name:'盐凿作业点',tier:'normal',weight:3,enemies:['e_d_salt_cutter']},
      {id:'enc_d_mine_haul',name:'冻索矿车',tier:'normal',weight:3,enemies:['e_d_ice_hauler']},
      {id:'enc_d_mine_crew',name:'采盐协作班',tier:'normal',weight:1,enemies:['e_d_salt_cutter','e_d_ice_hauler']},
      {id:'enc_d_mine_valve',name:'井库交界巡检',tier:'normal',weight:1,enemies:['e_d_salt_cutter','e_d_frost_valve']},
      {id:'enc_d_mine_elite',name:'冻井安全检查',tier:'elite',weight:3,enemies:['e_d_mine_warden']},
      {id:'enc_d_mine_guest',name:'冰库司越界巡查',tier:'elite',weight:1,enemies:['e_d_ice_gatekeeper']},
      {id:'enc_d_mine_boss',name:'盐井王座',tier:'boss',weight:3,enemies:['e_d_salt_excavator']},
      {id:'enc_d_mine_heart',name:'井底冰库守心',tier:'boss',weight:1,enemies:['e_d_reservoir_heart']},
      {id:'enc_d_mine_sentry',name:'井口前哨',tier:'sentry',weight:1,enemies:['e_d_salt_cutter']}
    ],eventIds:['ev_d_salt_lift','ev_d_frozen_payroll','ev_d_miner_memorial']
  },
  { id:'r_ice_reservoir', act:4, name:'断流冰库', title:'最后一滴仍在流动的水',
    text:'库门冻住了退路，阀门后面的水不再回答。巡守沿旧水面滑行，镜面融化时才露出真正的门缝。',
    color:'#91bdc5', art:'/assets/regions/r_ice_reservoir.svg',
    rule:{name:'断流寒息',text:'你开场获得 1 层缠绕，首回合获得 8 点基础格挡；每名敌人开场获得 1 层神器。',
      playerStart:[{op:'debuff',s:'entangled',v:1,t:'self'}],
      enemyStart:[{op:'buff',s:'artifact',v:1,t:'self'}],firstTurn:[{op:'block',v:8}]},
    encounters:[
      {id:'enc_d_ice_valve',name:'余压霜阀',tier:'normal',weight:3,enemies:['e_d_frost_valve']},
      {id:'enc_d_ice_skate',name:'水面巡守',tier:'normal',weight:3,enemies:['e_d_reservoir_skater']},
      {id:'enc_d_ice_patrol',name:'断流巡检班',tier:'normal',weight:1,enemies:['e_d_frost_valve','e_d_reservoir_skater']},
      {id:'enc_d_ice_salt',name:'盐井送检队',tier:'normal',weight:1,enemies:['e_d_reservoir_skater','e_d_salt_cutter']},
      {id:'enc_d_ice_elite',name:'库门封锁',tier:'elite',weight:3,enemies:['e_d_ice_gatekeeper']},
      {id:'enc_d_ice_guest',name:'冰库安全检查',tier:'elite',weight:1,enemies:['e_d_mine_warden']},
      {id:'enc_d_ice_boss',name:'守心冰室',tier:'boss',weight:3,enemies:['e_d_reservoir_heart']},
      {id:'enc_d_ice_drill',name:'冻库采掘架',tier:'boss',weight:1,enemies:['e_d_salt_excavator']},
      {id:'enc_d_ice_sentry',name:'库门前哨',tier:'sentry',weight:1,enemies:['e_d_frost_valve']}
    ],eventIds:['ev_d_last_water','ev_d_cold_storage','ev_d_ice_valve_wager']
  },
  { id:'r_thunder_city', act:5, name:'雷鸣机城', title:'全城仍在等待通电',
    text:'机城用雷声传递命令，送信员把电弧送到每一个街垒。继电器的跳闸声能让整条街短暂安静。',
    color:'#d4b460', art:'/assets/regions/r_thunder_city.svg',
    rule:{name:'线圈跳火',text:'你和每名敌人开场各获得 1 点力量；你首回合额外获得 1 点能量。',
      playerStart:[{op:'buff',s:'strength',v:1,t:'self'}],
      enemyStart:[{op:'buff',s:'strength',v:1,t:'self'}],firstTurn:[{op:'energy',n:1}]},
    encounters:[
      {id:'enc_d_city_courier',name:'弧光投递',tier:'normal',weight:3,enemies:['e_d_spark_courier']},
      {id:'enc_d_city_guard',name:'线圈街垒',tier:'normal',weight:3,enemies:['e_d_coil_guard']},
      {id:'enc_d_city_wired',name:'带电街垒班',tier:'normal',weight:1,enemies:['e_d_spark_courier','e_d_coil_guard']},
      {id:'enc_d_city_rail',name:'空轨线路检修',tier:'normal',weight:1,enemies:['e_d_spark_courier','e_d_rail_breacher']},
      {id:'enc_d_city_elite',name:'继电审判',tier:'elite',weight:3,enemies:['e_d_relay_judge']},
      {id:'enc_d_city_guest',name:'机城空轨调度',tier:'elite',weight:1,enemies:['e_d_sky_dispatcher']},
      {id:'enc_d_city_boss',name:'总继电机房',tier:'boss',weight:3,enemies:['e_d_city_relay']},
      {id:'enc_d_city_terminal',name:'带电终站',tier:'boss',weight:1,enemies:['e_d_sky_conductor']},
      {id:'enc_d_city_sentry',name:'机城前哨',tier:'sentry',weight:1,enemies:['e_d_spark_courier']}
    ],eventIds:['ev_d_storm_bill','ev_d_relay_bench','ev_d_grounding_market']
  },
  { id:'r_sky_rail', act:5, name:'浮空轨场', title:'风里最后一班列车',
    text:'轨道悬在城市上方，信号灯照着已经脱轨的货厢。每次俯冲和齐射之后，牵引索都必须重新收回。',
    color:'#96b0bd', art:'/assets/regions/r_sky_rail.svg',
    rule:{name:'断桥急行',text:'你开场获得 1 层专注，首回合额外抽 1 张牌；每名敌人开场获得 1 层荆棘。',
      playerStart:[{op:'buff',s:'focus',v:1,t:'self'}],
      enemyStart:[{op:'buff',s:'thorns',v:1,t:'self'}],firstTurn:[{op:'draw',n:1}]},
    encounters:[
      {id:'enc_d_sky_breach',name:'断桥轨剪',tier:'normal',weight:3,enemies:['e_d_rail_breacher']},
      {id:'enc_d_sky_wing',name:'铁翼牵引',tier:'normal',weight:3,enemies:['e_d_kite_pilot']},
      {id:'enc_d_sky_crew',name:'浮轨检修班',tier:'normal',weight:1,enemies:['e_d_rail_breacher','e_d_kite_pilot']},
      {id:'enc_d_sky_coil',name:'悬轨线圈护送',tier:'normal',weight:1,enemies:['e_d_rail_breacher','e_d_coil_guard']},
      {id:'enc_d_sky_elite',name:'终站调度',tier:'elite',weight:3,enemies:['e_d_sky_dispatcher']},
      {id:'enc_d_sky_guest',name:'悬轨继电审判',tier:'elite',weight:1,enemies:['e_d_relay_judge']},
      {id:'enc_d_sky_boss',name:'悬轨终站',tier:'boss',weight:3,enemies:['e_d_sky_conductor']},
      {id:'enc_d_sky_relay',name:'空轨总继电室',tier:'boss',weight:1,enemies:['e_d_city_relay']},
      {id:'enc_d_sky_sentry',name:'空轨前哨',tier:'sentry',weight:1,enemies:['e_d_rail_breacher']}
    ],eventIds:['ev_d_sky_ticket','ev_d_derailed_cargo','ev_d_empty_platform']
  },
  { id:'r_eclipse_abyss', act:6, name:'星蚀深渊', title:'星光落下以后',
    text:'每一层深渊都少一颗星，夜图和空门在黑暗里互相守望。灯罩打开时，死星留下的空位会露出真正的轮廓。',
    color:'#a596b8', art:'/assets/regions/r_eclipse_abyss.svg',
    rule:{name:'星蚀视差',text:'你开场获得 1 层虚弱，首回合额外获得 1 点能量；每名敌人开场获得 1 层虚化。',
      playerStart:[{op:'debuff',s:'weak',v:1,t:'self'}],
      enemyStart:[{op:'buff',s:'intangible',v:1,t:'self'}],firstTurn:[{op:'energy',n:1}]},
    encounters:[
      {id:'enc_d_abyss_reader',name:'缺星夜图',tier:'normal',weight:3,enemies:['e_d_star_reader']},
      {id:'enc_d_abyss_gate',name:'无墙空门',tier:'normal',weight:3,enemies:['e_d_void_gate_guard']},
      {id:'enc_d_abyss_watch',name:'深渊守望班',tier:'normal',weight:1,enemies:['e_d_star_reader','e_d_void_gate_guard']},
      {id:'enc_d_abyss_ember',name:'余烬探星队',tier:'normal',weight:1,enemies:['e_d_star_reader','e_d_ember_mender']},
      {id:'enc_d_abyss_elite',name:'蚀星镜室',tier:'elite',weight:3,enemies:['e_d_eclipse_lenskeeper']},
      {id:'enc_d_abyss_guest',name:'深渊末火告解',tier:'elite',weight:1,enemies:['e_d_cinder_confessor']},
      {id:'enc_d_abyss_boss',name:'占灯深渊',tier:'boss',weight:3,enemies:['e_d_eclipse_herald']},
      {id:'enc_d_abyss_vow',name:'无星守誓处',tier:'boss',weight:1,enemies:['e_d_zero_flame']},
      {id:'enc_d_abyss_sentry',name:'深渊前哨',tier:'sentry',weight:1,enemies:['e_d_star_reader']}
    ],eventIds:['ev_d_star_chart','ev_d_eclipsed_archive','ev_d_dark_lens']
  },
  { id:'r_last_sanctum', act:6, name:'零火圣所', title:'熄火之后的最后誓言',
    text:'圣所的火早已熄灭，门廊卫和告解师仍在履行最后一条命令。铁环打开的那一刻，剩下的誓言才有可以击穿的位置。',
    color:'#b79aa5', art:'/assets/regions/r_last_sanctum.svg',
    rule:{name:'熄火净誓',text:'你开场获得 2 层坚毅，首回合获得 4 点基础格挡；每名敌人开场获得 1 层神器。',
      playerStart:[{op:'buff',s:'resolve',v:2,t:'self'}],
      enemyStart:[{op:'buff',s:'artifact',v:1,t:'self'}],firstTurn:[{op:'block',v:4}]},
    encounters:[
      {id:'enc_d_sanctum_mend',name:'余烬缝火',tier:'normal',weight:3,enemies:['e_d_ember_mender']},
      {id:'enc_d_sanctum_gate',name:'零火门廊',tier:'normal',weight:3,enemies:['e_d_sanctum_sentinel']},
      {id:'enc_d_sanctum_vigil',name:'守火夜班',tier:'normal',weight:1,enemies:['e_d_ember_mender','e_d_sanctum_sentinel']},
      {id:'enc_d_sanctum_void',name:'空门守火队',tier:'normal',weight:1,enemies:['e_d_ember_mender','e_d_void_gate_guard']},
      {id:'enc_d_sanctum_elite',name:'末火告解屏',tier:'elite',weight:3,enemies:['e_d_cinder_confessor']},
      {id:'enc_d_sanctum_guest',name:'圣所死星镜室',tier:'elite',weight:1,enemies:['e_d_eclipse_lenskeeper']},
      {id:'enc_d_sanctum_boss',name:'零火守誓坛',tier:'boss',weight:3,enemies:['e_d_zero_flame']},
      {id:'enc_d_sanctum_eclipse',name:'末火占灯台',tier:'boss',weight:1,enemies:['e_d_eclipse_herald']},
      {id:'enc_d_sanctum_sentry',name:'圣所前哨',tier:'sentry',weight:1,enemies:['e_d_ember_mender']}
    ],eventIds:['ev_d_zero_flame_altar','ev_d_last_confession','ev_d_ember_testament']
  }
];
