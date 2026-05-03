"use client";

import { useLocale, T, monthName } from "@/lib/locale";

interface MarketStats {
  monthlyAvg: number[];
  monthLabels: string[];
  p25: number;
  p75: number;
  median: number;
}

interface Props {
  currentPrice: number;
  departureDate: string;
  marketStats: MarketStats;
}

export function PriceLevelBar({ currentPrice, departureDate, marketStats }: Props) {
  const { lang, fmt, convert } = useLocale();
  const t = T[lang];
  const { p25, p75, monthlyAvg, median } = marketStats;

  const cp = convert(currentPrice);
  const lo = convert(p25);
  const hi = convert(p75);

  const label = cp <= lo ? t.cheap : cp >= hi ? t.expensive : t.typical;
  const color = cp <= lo ? "text-green-700" : cp >= hi ? "text-red-600" : "text-yellow-700";
  const bg = cp <= lo ? "bg-green-50 border-green-200" : cp >= hi ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";

  const depMonth = new Date(departureDate).getUTCMonth();
  const depMonthLabel = monthName(depMonth, lang);

  const spread = hi - lo;
  const barMin = Math.max(0, lo - spread * 0.5);
  const barMax = hi + spread * 0.5;
  const barRange = barMax - barMin;

  const p25Pct = ((lo - barMin) / barRange) * 100;
  const p75Pct = ((hi - barMin) / barRange) * 100;
  const markerPct = Math.max(1, Math.min(99, ((cp - barMin) / barRange) * 100));

  return (
    <div className={`rounded-xl border px-5 py-4 mb-6 ${bg}`}>
      <p className={`font-semibold text-base mb-0.5 ${color}`}>
        {t.levelLabel(label)}
      </p>
      <p className="text-sm text-gray-500 mb-1">
        {t.typicalRange(fmt(p25), fmt(p75))}
      </p>
      <p className="text-xs text-gray-400 mb-3">
        {t.monthAvg(depMonthLabel, fmt(monthlyAvg[depMonth] ?? median))}
        {t.yearMedian(fmt(median))}
        {t.dataSource}
      </p>

      {/* pt-8 reserves space for the price bubble above the bar */}
      <div className="relative pt-8 px-1 mb-4">
        {/* Price bubble — positioned at top of padded area, never overlaps text */}
        <div
          className="absolute top-0 -translate-x-1/2 bg-gray-800 text-white text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
          style={{ left: `${markerPct}%` }}
        >
          {fmt(currentPrice)} · {label}
        </div>

        {/* Bar + marker share the same relative container so top-1/2 is exactly on the bar */}
        <div className="relative h-2.5">
          <div
            className="absolute inset-0 rounded-full"
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
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow-md z-10"
            style={{ left: `calc(${markerPct}% - 8px)` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span className="text-green-600 font-medium">{fmt(p25)} {t.cheap}</span>
          <span>{t.normalRange}</span>
          <span className="text-red-500 font-medium">{t.expensive} {fmt(p75)}</span>
        </div>
      </div>
    </div>
  );
}
