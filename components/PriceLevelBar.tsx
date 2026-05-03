"use client";

interface MarketStats {
  monthlyAvg: number[];
  monthLabels: string[];
  p25: number;
  p75: number;
  median: number;
}

interface Props {
  currentPrice: number;
  currency: string;
  departureDate: string; // ISO string e.g. "2026-06-28T00:00:00.000Z"
  marketStats: MarketStats;
}

function levelInfo(price: number, p25: number, p75: number) {
  if (price <= p25) return { label: "便宜", color: "text-green-700", bg: "bg-green-50 border-green-200" };
  if (price >= p75) return { label: "稍貴", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  return { label: "一般", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
}

const MONTH_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function PriceLevelBar({ currentPrice, currency, departureDate, marketStats }: Props) {
  const { p25, p75, monthlyAvg, median } = marketStats;
  const { label, color, bg } = levelInfo(currentPrice, p25, p75);

  // Departure month index (0=Jan)
  const depMonth = new Date(departureDate).getUTCMonth();
  const depMonthAvg = Math.round(monthlyAvg[depMonth]);
  const depMonthZh = MONTH_ZH[depMonth];

  // Bar spans: [p25 - 0.5×spread, p75 + 0.5×spread]
  const spread = p75 - p25;
  const barMin = Math.max(0, p25 - spread * 0.5);
  const barMax = p75 + spread * 0.5;
  const barRange = barMax - barMin;

  const p25Pct = ((p25 - barMin) / barRange) * 100;
  const p75Pct = ((p75 - barMin) / barRange) * 100;
  const markerPct = Math.max(1, Math.min(99, ((currentPrice - barMin) / barRange) * 100));

  return (
    <div className={`rounded-xl border px-5 py-4 mb-6 ${bg}`}>
      <p className={`font-semibold text-base mb-0.5 ${color}`}>
        就你的搜尋條件而言，目前的票價{label}
      </p>
      <p className="text-sm text-gray-500 mb-1">
        此路線最低票價通常介於{" "}
        <span className="font-medium text-gray-700">
          ${p25.toLocaleString()} – ${p75.toLocaleString()} {currency}
        </span>{" "}
        之間。
      </p>
      <p className="text-xs text-gray-400 mb-5">
        {depMonthZh}份均價約 ${depMonthAvg}，全年中位數 ${median}。
        （資料來源：Momondo 歷史市場資料）
      </p>

      {/* Gradient bar */}
      <div className="relative px-1 mb-8">
        {/* Price bubble above marker */}
        <div
          className="absolute -top-7 transform -translate-x-1/2 bg-gray-800 text-white text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
          style={{ left: `${markerPct}%` }}
        >
          ${currentPrice.toLocaleString()} {label}
        </div>

        {/* Colour bar — hard 3-zone gradient */}
        <div
          className="h-2.5 rounded-full"
          style={{
            background: `linear-gradient(to right,
              #4ade80 0%,
              #86efac ${p25Pct * 0.7}%,
              #fde047 ${p25Pct}%,
              #fbbf24 ${(p25Pct + p75Pct) / 2}%,
              #fb923c ${p75Pct}%,
              #f87171 100%)`,
          }}
        />

        {/* Marker dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow-md"
          style={{ left: `calc(${markerPct}% - 8px)` }}
        />

        {/* Range labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span className="text-green-600 font-medium">${p25} 便宜</span>
          <span className="text-center">一般價格區間</span>
          <span className="text-red-500 font-medium">稍貴 ${p75}</span>
        </div>
      </div>
    </div>
  );
}
