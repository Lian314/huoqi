export const SITE_TYPES = {
  forge: { name: '工坊', glyph: '锻', color: '#67b7c9', text: '炉膛还热着。磨利一件工具，或卸掉一件负担。' },
  shrine: { name: '祭坛', glyph: '祀', color: '#bf81ad', text: '灯后面的影子接受鲜血。它的回报只伴你走一小段路。' },
  supply: { name: '补给', glyph: '箱', color: '#75be91', text: '有人在这里留下补给。行囊只能带走其中一份。' },
  trial: { name: '试炼', glyph: '试', color: '#df7b6c', text: '闸门后有两轮守卫。中途可以撤出，完成两轮才能领取封存的奖励。' },
  vault: { name: '密库', glyph: '锁', color: '#d6bb5e', text: '封印钥匙可以无声开门，也可以从守卫手里夺下库藏。' },
  waystation: { name: '驿站', glyph: '驿', color: '#8fb0d1', text: '墙内没有潮声。这里可以养伤、备下护盾，或交换一把钥匙。' },
};

export const siteDef = (type) => SITE_TYPES[type] || null;
