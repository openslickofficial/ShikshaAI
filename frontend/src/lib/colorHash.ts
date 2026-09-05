export type PastelSeries = 'coral' | 'sand' | 'lavender' | 'mint';

const SERIES_LIST: PastelSeries[] = ['coral', 'sand', 'lavender', 'mint'];

/**
 * Returns a deterministic pastel series color name ("coral", "sand", "lavender", or "mint")
 * for a given seed string (e.g. session ID).
 */
export function getPastelSeries(seed: string): PastelSeries {
  if (!seed) return 'coral';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % SERIES_LIST.length;
  return SERIES_LIST[index];
}
