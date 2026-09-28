import type { Car } from './types';
import { SEED_ADS } from './seed-ads';

/**
 * إعلانات البذرة الحقيقية (10 سيارات بصورها) — تُعرض تلقائياً عندما تكون قاعدة
 * البيانات فارغة أو غير متاحة، حتى لا يرى الزائر موقعاً فارغاً.
 */
export const SAMPLE_CARS: Car[] = SEED_ADS.map((ad, index) => ({ ...ad, id: `seed-${index + 1}` }));