# 《焰契 · 锈锚酒馆》美术资产总表与规划规范

本文档为《焰契 · 锈锚酒馆》（Emberpact: Anchored Tavern）项目全量美术资产总表、交付规格及制作进度跟踪看板。

---

## 一、美术风格定位与视觉规范

- **整体风格**：蒸汽末世 + 暗黑克苏鲁奇幻的 **2D 手绘图小说风格（Graphic Novel Game Art）**。
- **视觉关键词**：锈铁、硫火、港雾、盐晶、古老机械、深渊残片。
- **色彩基调**：
  - **基底**：深炭灰、黑曜岩、冷铅色（`#0a0c0f` ~ `#1e2630`）
  - **核心主题点缀**：冷海青（`#2ec4b6`）、硫火金（`#e5a50a` / `#ffd43b`）、余烬炽橙（`#ff6b35`）、血契深红（`#e03131` / `#be526a`）、秘术暗紫（`#9775fa`）
- **造型要求**：
  - 人物与怪物具备高反差的外部硬剪影，缩放至小图标尺寸仍具高辨识度。
  - 画面纯净：**禁止在原图中绘制任何文字、数值或游戏 UI 框**（全由代码层动态渲染）。
- **文件与目录规范**：
  - 文件命名与代码内数据 ID 完全一致，遵循小写加下划线命名法。
  - 标准路径：`/assets/characters/`、`/assets/enemies/`、`/assets/backgrounds/`、`/assets/cards/`、`/assets/regions/`。

---

## 二、第一批优先交付资产总览看板（Phase 1 MVP）

| 资产类别 | 规划数量 | 已完成数量 | 推进状态 | 交付文件路径 | 规格与比例 |
|---|:---:|:---:|:---:|---|---|
| **全景场景大背景** | 7 | 7 | **100% 已就绪** | `assets/backgrounds/` | 1920×1080 (16:9), WebP/JPG |
| **旅者角色战斗立绘** | 8 | 8 | **100% 已就绪** | `assets/characters/` | 768×1024 (3:4), WebP/JPG |
| **区域地图矢量场景** | 12 | 12 | **100% 已就绪** | `assets/regions/` | 矢量 SVG |
| **幕次新首领大立绘** | 12 | 1 | 8% 进行中 | `assets/enemies/` | 1024×1024 (1:1), WebP/JPG |
| **核心卡牌专属插画** | 24 | 0 | 排期待制 | `assets/cards/` | 512×384 (4:3), WebP/JPG |

---

## 三、旅者立绘与头像（全 8 位 · 已 100% 就绪）

> 规格：768×1024 (3:4)，已绑定至 `src/data/characters.js`，可在选角与战斗内展示。

| 角色 ID | 旅者名称 | 称号 / 身份 | 视觉特征与关键道具 | 关联文件路径 | 当前状态 |
|---|---|---|---|---|:---:|
| `ch_ashborn` | **烬裔** | 锈锚酒馆老板 | 炽热余烬熔火重锤、黑皮铁匠围裙、满身炉火烟尘、熔炭瞳孔 | `/assets/characters/ch_ashborn.jpg` | **已完成** |
| `ch_ichor` | **毒医** | 江湖郎中 | 黄铜鸟嘴面具、翠绿药剂背带、墨绿破损斗篷、悬吊毒香熏炉 | `/assets/characters/ch_ichor.jpg` | **已完成** |
| `ch_gambler` | **赌徒** | 命悬一掷者 | 翻飞的骨骰、黄铜金属卡牌、赭黄风衣、腰悬账簿与鱼叉索 | `/assets/characters/ch_gambler.jpg` | **已完成** |
| `ch_warden` | **铁壁** | 破门重装守卫 | 满身伤疤、重型铆接板甲、液压活塞重钢塔盾、战壕铁锹战斧 | `/assets/characters/ch_warden.jpg` | **已完成** |
| `ch_echoer` | **回响者** | 秘术声律学者 | 编发小铜钟、眼罩秘术之眼、共振音叉法杖、声波波纹与淡紫长袍 | `/assets/characters/ch_echoer.jpg` | **已完成** |
| `ch_riveter` | **铆工** | 封门机械工匠 | 焊接护目镜、重型气动蒸汽铆钉枪、冷压夹钳、皮背带工装 | `/assets/characters/ch_riveter.jpg` | **已完成** |
| `ch_lantern` | **幽灯客** | 巡夜提灯人 | 深灰油布兜帽披风、散发暖金光芒的防风马灯、裁剪利刃与雨雾 | `/assets/characters/ch_lantern.jpg` | **已完成** |
| `ch_oathbound` | **誓痕者** | 血契狂战士 | 赤裸双臂雕刻的血红誓印、染血绷带手套、沉重锁链与坚毅战姿 | `/assets/characters/ch_oathbound.jpg` | **已完成** |

---

## 四、场景与战斗大背景（全 7 张 · 已 100% 就绪）

> 规格：1920×1080 (16:9)，留足中央与下部战斗及 UI 交互空间。

| 背景 ID | 场景名称 | 适用界面 / 幕次 | 核心视觉元素 | 关联文件路径 | 当前状态 |
|---|---|---|---|---|:---:|
| `bg_tavern` | **锈锚酒馆内景** | 酒馆主界面（账房/设施/委托） | 燃烧的铸铁壁炉、生锈大船锚、橡木吧台、酒桶、蒸汽铜管与悬吊马灯 | `/assets/backgrounds/bg_tavern.jpg` | **已完成** |
| `bg_act1` | **码头与泊地** | 幕一（锈潮码头 / 沉船泊地） | 工业蒸汽吊机、泥泞潮闸铁桥、搁浅残破船骨巨龙、夜雾与暗水 | `/assets/backgrounds/bg_act1.jpg` | **已完成** |
| `bg_act2` | **钟雾与盐镜** | 幕二（钟雾回廊 / 盐镜水道） | 哥特式石拱长廊、铁链悬吊重青铜大钟、镜面水道、浅滩盐晶结壳 | `/assets/backgrounds/bg_act2.jpg` | **已完成** |
| `bg_act3` | **旧城与法庭** | 幕三（血契旧城 / 灰烬法庭） | 破败黑石议院大厅、垂落的撕裂猩红血旗、高阶判台、余烬火盆 | `/assets/backgrounds/bg_act3.jpg` | **已完成** |
| `bg_act4` | **盐井与冰库** | 幕四（冰封盐井 / 断流冰库） | 深层地下盐矿、纵横矿架与矿车、结冰巨型闸阀、深蓝冰凌与管线 | `/assets/backgrounds/bg_act4.jpg` | **已完成** |
| `bg_act5` | **机城与浮轨** | 幕五（雷鸣机城 / 浮空轨场） | 暴风雨中浮空钢铁城、旋转巨齿轮厂房、高空铁轨、特斯拉线圈电弧 | `/assets/backgrounds/bg_act5.jpg` | **已完成** |
| `bg_act6` | **深渊与圣所** | 幕六（星蚀深渊 / 零火圣所） | 天幕巨大日全食黑环、悬浮破碎白石神庙平台、倒悬玄武岩柱、熄灭火坛 | `/assets/backgrounds/bg_act6.jpg` | **已完成** |

---

## 五、12 位新首领大立绘（Boss Combatants）

> 规格：1024×1024 (1:1)，透明背景或深色纯净底，凸显压迫感与大招蓄力姿态。

| 首领数据 ID | 首领名称 | 登场幕次与区域 | 视觉设定与关键特征 | 目标文件路径 | 进度状态 |
|---|---|---|---|---|:---:|
| `e_h_rust_harbormaster` | **锈潮港务长** | 幕一 · 锈潮码头 | 半机械巨汉、背后外挂重型蒸汽吊车臂、铁钩铁索、防毒铁面具、查验货册 | `/assets/enemies/e_h_rust_harbormaster.jpg` | **已完成** |
| `e_h_keel_captain` | **沉船骨舰长** | 幕一 · 沉船泊地 | 倒扣船龙骨幽灵舰长、残破金边海军大衣、双持藤壶船锚战锤、幽绿胸腔磷光 | `/assets/enemies/e_h_keel_captain.jpg` | 待生成 |
| `e_h_fog_bell_prior` | **钟雾落钟住持** | 幕二 · 钟雾回廊 | 隐修院长、青铜巨钟头盔、破旧麻织苦行僧袍、巨大撞钟石杵法杖、浓雾回声 | `/assets/enemies/e_h_fog_bell_prior.jpg` | 待生成 |
| `e_h_salt_mirror_keeper`| **盐镜双印守关人** | 幕二 · 盐镜水道 | 晶莹盐晶重甲、悬浮环绕对称盐晶镜片、双手各执一枚厚重花岗岩契约巨印 | `/assets/enemies/e_h_salt_mirror_keeper.jpg` | 待生成 |
| `e_h_blood_city_notary` | **血契旧城公证长** | 幕三 · 血契旧城 | 枯槁血庭公证官、拖地深红天鹅绒法袍、滴血黄铜公证印锤、巨幅血契卷轴 | `/assets/enemies/e_h_blood_city_notary.jpg` | 待生成 |
| `e_h_ash_high_judge`    | **灰烬法庭首席法官** | 幕三 · 灰烬法庭 | 高坐黑石判台的蒙目法官、炽热熔岩锻造的审判战锤、燃烧天平、漫天灰烬 | `/assets/enemies/e_h_ash_high_judge.jpg` | 待生成 |
| `e_d_salt_excavator`    | **井底古法采掘架** | 幕四 · 冰封盐井 | 庞大古老采盐掘进构装体、裹满冰霜与盐壳的钢铁机架、巨型旋转钻头、排气管 | `/assets/enemies/e_d_salt_excavator.jpg` | 待生成 |
| `e_d_reservoir_heart`   | **冰库水核守卫** | 幕四 · 断流冰库 | 极寒水核生命、被尖锐冰棱与沉重冻结闸门板护甲重重包裹、零度幽蓝光晕 | `/assets/enemies/e_d_reservoir_heart.jpg` | 待生成 |
| `e_d_city_relay`        | **机城总继电器** | 幕五 · 雷鸣机城 | 机械城中央供电核心、数排旋转黄铜线圈、高压绝缘陶瓷瓶、狂暴蓝紫电弧瀑布 | `/assets/enemies/e_d_city_relay.jpg` | 待生成 |
| `e_d_sky_conductor`     | **浮空轨列车长** | 幕五 · 浮空轨场 | 蒸汽机车车头改装的半人马重甲装甲巨兽、排障铲胸甲、高压蒸汽排气矛枪 | `/assets/enemies/e_d_sky_conductor.jpg` | 待生成 |
| `e_d_eclipse_herald`    | **星蚀传令使** | 幕六 · 星蚀深渊 | 漂浮在虚空裂隙上的星蚀行者、头顶倒悬日蚀漆黑圆环光圈、星尘法袍、黑晶战镰 | `/assets/enemies/e_d_eclipse_herald.jpg` | 待生成 |
| `e_d_zero_flame`        | **零火守誓者** | 幕六 · 零火圣所 | 守卫熄灭火坛的终焉圣殿骑士、雕花白曜石残甲、双手拄地的无光巨剑、灰烬锁链 | `/assets/enemies/e_d_zero_flame.jpg` | 待生成 |

---

## 六、12 个区域地图矢量场景（全量已完成）

> 规格：SVG 矢量图形，已接入 `src/data/regions.harbor.js` 与 `src/data/regions.depths.js`。

| 区域 ID | 幕次 | 区域名称 | 主题与场景重点 | 对应矢量文件 | 当前状态 |
|---|:---:|---|---|---|:---:|
| `r_rust_quay` | 1 | 锈潮码头 | 起重吊架、铁桥、货箱与灯塔 | `/assets/regions/r_rust_quay.svg` | **已完成** |
| `r_ship_grave` | 1 | 沉船泊地 | 搁浅船骨、断桅与肋板 | `/assets/regions/r_ship_grave.svg` | **已完成** |
| `r_bell_corridor` | 2 | 钟雾回廊 | 连续拱门、悬铃与回廊 | `/assets/regions/r_bell_corridor.svg` | **已完成** |
| `r_salt_mirror` | 2 | 盐镜水道 | 镜面水池、盐晶与双岸阶梯 | `/assets/regions/r_salt_mirror.svg` | **已完成** |
| `r_blood_city` | 3 | 血契旧城 | 议院尖塔、红旗、高桥与城门 | `/assets/regions/r_blood_city.svg` | **已完成** |
| `r_ash_court` | 3 | 灰烬法庭 | 黑石判台、阶梯与余火 | `/assets/regions/r_ash_court.svg` | **已完成** |
| `r_frozen_mine` | 4 | 冰封盐井 | 冰壁、矿道、吊笼与轨道 | `/assets/regions/r_frozen_mine.svg` | **已完成** |
| `r_ice_reservoir` | 4 | 断流冰库 | 闸坝、断裂输水管与冻水面 | `/assets/regions/r_ice_reservoir.svg` | **已完成** |
| `r_thunder_city` | 5 | 雷鸣机城 | 齿轮厂房、管线与引雷装置 | `/assets/regions/r_thunder_city.svg` | **已完成** |
| `r_sky_rail` | 5 | 浮空轨场 | 悬空铁轨、吊桥与列车 | `/assets/regions/r_sky_rail.svg` | **已完成** |
| `r_eclipse_abyss` | 6 | 星蚀深渊 | 裂隙、倒悬石柱与断桥 | `/assets/regions/r_eclipse_abyss.svg` | **已完成** |
| `r_last_sanctum` | 6 | 零火圣所 | 白石穹门、最后火坛与断阶 | `/assets/regions/r_last_sanctum.svg` | **已完成** |

---

## 七、首批 24 张核心卡牌插画规划（Core Card Arts）

> 规格：512×384 (4:3)，主体居中，四周留白便于在各种卡框裁切下保持完好。
> 选牌原则：覆盖全部 8 位旅者的起手开局套牌与最标志性核心机制牌。

| 序号 | 卡牌 ID | 卡牌名称 | 类型 / 费用 | 归属流派 / 角色 | 插画画面构想 (Visual Description) | 目标路径 |
|:---:|---|---|:---:|---|---|---|
| 1 | `c_strike` | **挥击** | 攻击 (1) | 通用基础 | 生锈铁短剑斜向下凶猛劈击，带出四溅的亮黄金属火花 | `/assets/cards/c_strike.jpg` |
| 2 | `c_guard` | **格挡** | 技能 (1) | 通用基础 | 沉重的粗大铆接铁盾挡在正中，格挡住迎面而来的冲击火光 | `/assets/cards/c_guard.jpg` |
| 3 | `c_bash` | **重击** | 攻击 (2) | 通用强袭 | 双手高举的厚重铸铁平头大锤从天而降，震碎地面石砖 | `/assets/cards/c_bash.jpg` |
| 4 | `c_ember_slash` | **灼热挥砍** | 攻击 (1) | 烬裔 / 火焰 | 通体烧得通红的弯刀划破黑暗，斩出滚烫的烈焰轨迹与飞溅火星 | `/assets/cards/c_ember_slash.jpg` |
| 5 | `c_burn_wave` | **燃焰浪** | 攻击 (2) | 烬裔 / 火焰 | 从地面向前喷涌而出的宽幅灼热火浪，伴随漫天灰烬吞没视野 | `/assets/cards/c_burn_wave.jpg` |
| 6 | `c_i_venom_sleeve` | **毒袖** | 攻击 (1) | 毒医 / 毒液 | 宽大的墨绿袍袖甩出，数枚淬有幽绿剧毒的细长飞针激射而出 | `/assets/cards/c_i_venom_sleeve.jpg` |
| 7 | `c_i_ichor_censer` | **药香熏炉** | 技能 (1) | 毒医 / 毒雾 | 镂空精雕黄铜悬吊熏炉，向四方喷吐着浓郁的碧绿治愈与毒香烟雾 | `/assets/cards/c_i_ichor_censer.jpg` |
| 8 | `c_plague_tide` | **疫潮** | 攻击 (2) | 毒医 / 群体毒 | 黏稠翻滚的腐蚀性墨绿毒潮在地表漫延，冒着带有毒气的小气泡 | `/assets/cards/c_plague_tide.jpg` |
| 9 | `c_harpoon_line` | **鱼叉索** | 攻击 (1) | 赌徒 / 抓取 | 连着坚韧油麻绳的带倒刺生锈铁鱼叉破风飞射而出，破空疾驰 | `/assets/cards/c_harpoon_line.jpg` |
| 10 | `c_bone_scatter` | **碎骨乱掷** | 攻击 (1) | 赌徒 / 乱骰 | 刻有奇异符文的惨白骨骰与尖锐兽骨碎片如暴雨般向四周飞掷 | `/assets/cards/c_bone_scatter.jpg` |
| 11 | `c_pocket_ledger` | **随身账簿** | 技能 (1) | 赌徒 / 运筹 | 斑驳折角、满是墨渍与血痕的黄铜角扣厚皮账本，露出算计页签 | `/assets/cards/c_pocket_ledger.jpg` |
| 12 | `c_brace` | **严阵以待** | 技能 (1) | 铁壁 / 防守 | 披甲双臂交叉紧锁在胸前，蒸汽护具阀门合拢释放加固气压 | `/assets/cards/c_brace.jpg` |
| 13 | `c_steam_press` | **蒸汽冲压** | 攻击 (2) | 铁壁 / 攻防 | 工业重型活塞拳头伴随白色高压泄气蒸汽向下猛烈冲压 | `/assets/cards/c_steam_press.jpg` |
| 14 | `c_iron_carapace` | **铁壳硬化** | 技能 (2) | 铁壁 / 护甲 | 钢铁装甲如鳞片般收拢紧扣，金属接缝处迸发出强化冷蓝反光 | `/assets/cards/c_iron_carapace.jpg` |
| 15 | `c_piston_kick` | **活塞突踢** | 攻击 (1) | 回响者 / 连击 | 带有微型蒸汽活塞推进器的铁胫甲向前凌空飞踹，撕裂空气 | `/assets/cards/c_piston_kick.jpg` |
| 16 | `c_pwr_static_choir` | **静电诵唱** | 能力 (1) | 回响者 / 回响 | 紫色静电火花在虚空中交织成振动的音波五线谱与跳跃符文 | `/assets/cards/c_pwr_static_choir.jpg` |
| 17 | `c_r_rivet_strike` | **铆击** | 攻击 (1) | 铆工 / 气动 | 重型气动铆钉枪将一枚通红炽热的巨大钢铆钉狂暴打入目标 | `/assets/cards/c_r_rivet_strike.jpg` |
| 18 | `c_r_seam_guard` | **接缝加固** | 技能 (1) | 铆工 / 铆接 | 两只铁匠手套使用粗大重型 C 型夹钳把两道厚实钢板强行咬合紧固 | `/assets/cards/c_r_seam_guard.jpg` |
| 19 | `c_r_plate_ram` | **盾板冲撞** | 攻击 (1) | 铆工 / 转换 | 身体前倾紧贴巨大的整块铆钉厚钢板防暴盾，以排山倒海之势野蛮撞击 | `/assets/cards/c_r_plate_ram.jpg` |
| 20 | `c_l_wick_cut` | **灯芯裁剪** | 攻击 (1) | 幽灯客 / 裁光 | 锋利如柳叶的黄铜灯芯修剪剪刀利落合拢，剪落一段迸裂的金芒火芯 | `/assets/cards/c_l_wick_cut.jpg` |
| 21 | `c_l_hooded_step` | **暗影轻步** | 技能 (1) | 幽灯客 / 潜行 | 兜帽披风与浓重夜雾彻底融为一体，迷雾中唯留下一道淡淡的残影 | `/assets/cards/c_l_hooded_step.jpg` |
| 22 | `c_l_trail_light` | **引路微光** | 技能 (1) | 幽灯客 / 探明 | 提起的黄铜马灯在潮湿泥泞的石板路上照亮一圈温暖的金黄光斑与足迹 | `/assets/cards/c_l_trail_light.jpg` |
| 23 | `c_o_red_knuckle` | **血指节** | 攻击 (1) | 誓痕者 / 血击 | 缠满染血绷带的铁铸指虎重拳呼啸砸出，带出撕裂般的血雾气旋 | `/assets/cards/c_o_red_knuckle.jpg` |
| 24 | `c_o_bound_guard` | **契痕坚守** | 技能 (1) | 誓痕者 / 血誓 | 手臂上的誓言烙印透出刺目血芒，凝聚出一层半透明的符文血盾阻挡冲击 | `/assets/cards/c_o_bound_guard.jpg` |

---

## 八、第二批后续扩展规划（Phase 2）

| 资源类别 | 规划总量 | 建议规格 | 交付要点 |
|---|:---:|:---:|---|
| **普通敌人立绘** | 72 个 | 768×768 (1:1) | 杂兵立绘，剪影简洁，对应各区域特色小怪 |
| **精英敌人立绘** | 32 个 | 768×768 (1:1) | 精英压迫感造型，动作张力更强 |
| **全量卡牌插画** | 223 张（补齐后 247） | 512×384 (4:3) | 各学派（奥术、冰霜、火焰、机械、血契）扩展牌插画 |
| **遗物图标** | 64 个 | 128×128 (1:1) | 透明背景道具切图，金属质感强烈 |
| **药水图标** | 36 个 | 128×128 (1:1) | 各色炼金药剂瓶，区分液体流光与瓶型 |
| **状态图标** | 30 个 | 128×128 (1:1) | 状态效果 Pip 图标，高对比度符号化 |
| **设施与员工** | 16 / 12 个 | 256×256 (1:1) | 酒馆经营模块的设施升级与雇员肖像 |

---

## 九、工程接入与前端渲染契约

1. **自动路径寻址**：
   - 旅者角色立绘：`character.portrait = "/assets/characters/${id}.jpg"`
   - 首领敌人立绘：`enemy.art = "/assets/enemies/${id}.jpg"`
   - 战斗幕次背景：`arena.style.backgroundImage = "url(/assets/backgrounds/bg_act${act}.jpg)"`
   - 卡牌插画容器：`<img class="card-art" src="/assets/cards/${id}.jpg" onerror="this.src='/assets/cards/fallback.svg'" />`
2. **渐进式优雅降级（Fallback）**：
   - 当图片未生成或加载失败时，代码自动回退至对应的 `glyph` 符号或通用 SVG 图标，杜绝破图与布局崩溃。
3. **前端动效增强建议**：
   - 战斗常态微动：CSS `transform: translateY(-2px)` 微漂浮呼吸。
   - 受击白闪：`filter: brightness(2.5)` 配合震动帧动画。
   - 首领压迫光晕：`filter: drop-shadow(0 0 16px rgba(255, 107, 53, 0.45))`。
