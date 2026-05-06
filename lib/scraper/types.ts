export interface MarketStats {
  source: "momondo";
  updatedAt: string;
  monthlyAvg: number[];   // 12 values Jan–Dec, USD
  monthLabels: string[];  // ["Jan", ..., "Dec"]
  p25: number;
  p75: number;
  median: number;
}

export interface ScrapeEntry {
  price: number;
  currency: string;
  airline: string;
  source: string;
}

export interface ScrapeResult {
  entries: ScrapeEntry[];
  marketStats?: MarketStats;
}
