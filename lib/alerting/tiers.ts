export type Tier = 1 | 2 | 3;

export interface TierInfo {
  tier: Tier;
  label: string;
  emoji: string;
  dropPercent: number;
}

export const TIER_DEFS: TierInfo[] = [
  { tier: 3, label: "Flash Sale — Abnormally Cheap", emoji: "🚨", dropPercent: 40 },
  { tier: 2, label: "Great Deal",                    emoji: "✈",  dropPercent: 30 },
  { tier: 1, label: "Good Deal",                     emoji: "✈",  dropPercent: 20 },
];

export function evaluateTier(price: number, average: number): TierInfo | null {
  const ratio = price / average;
  for (const def of TIER_DEFS) {
    if (ratio <= (100 - def.dropPercent) / 100) {
      return def;
    }
  }
  return null;
}
