"use client";

interface Props {
  currentPrice: number;
  currency: string;
  p25: number;
  p75: number;
}

function levelInfo(price: number, p25: number, p75: number) {
  if (price <= p25) return { label: "便宜", color: "text-green-700", bg: "bg-green-50 border-green-200" };
  if (price >= p75) return { label: "稍貴", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  return { label: "一般", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
}

export function PriceLevelBar({ currentPrice, currency, p25, p75 }: Props) {
  const { label, color, bg } = levelInfo(currentPrice, p25, p75);

  // Bar spans from (p25 - half the spread) to (p75 + half the spread)
  // so the typical zone occupies the middle third of the bar
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
      <p className="text-sm text-gray-500 mb-5">
        此路線的最低票價通常介於{" "}
        <span className="font-medium text-gray-700">
          ${p25.toLocaleString()} – ${p75.toLocaleString()} {currency}
        </span>{" "}
        之間。
        （依此路線已收集的歷史票價估算）
      </p>

      {/* Gradient bar */}
      <div className="relative px-1">
        {/* Price bubble above marker */}
        <div
          className="absolute -top-7 transform -translate-x-1/2 bg-gray-800 text-white text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
          style={{ left: `${markerPct}%` }}
        >
          ${currentPrice.toLocaleString()} 屬於{label}價位
        </div>

        {/* Colour bar */}
        <div
          className="h-2.5 rounded-full"
          style={{
            background: `linear-gradient(to right,
              #4ade80 0%,
              #86efac ${p25Pct * 0.6}%,
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
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>${p25.toLocaleString()}</span>
          <span className="text-gray-400 text-center flex-1 px-2">一般價格區間</span>
          <span>${p75.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
