import { HARBOR_REGIONS } from './regions.harbor.js';
import { DEPTH_REGIONS } from './regions.depths.js';

export const REGIONS = [...HARBOR_REGIONS, ...DEPTH_REGIONS];
export const REGION_MAP = new Map(REGIONS.map((region) => [region.id, region]));
export const CHAPTERS = {
  1: { name: '沉港边界', rows: 15, cols: 4, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 3 },
  2: { name: '雾下巡航', rows: 18, cols: 4, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 3 },
  3: { name: '旧城契约', rows: 20, cols: 5, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 4 },
  4: { name: '冰井断流', rows: 20, cols: 5, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 4 },
  5: { name: '雷轨机城', rows: 22, cols: 5, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 4 },
  6: { name: '零火深渊', rows: 24, cols: 5, eliteFrom: 3, shopCount: 2, restCount: 1, eventCount: 5 },
};

export const regionById = (id) => REGION_MAP.get(id) || null;
export const regionsOf = (act) => REGIONS.filter((region) => region.act === act);
export const chapterForNight = (night) => Math.max(1, Math.min(6, Number(night) || 1));
export const expeditionEndAct = (act) => act <= 3 ? 3 : act;
export const encounterById = (regionId, id) => regionById(regionId)?.encounters.find((entry) => entry.id === id) || null;
