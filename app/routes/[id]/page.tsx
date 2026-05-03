"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PriceChart } from "@/components/PriceChart";
import { PriceLevelBar } from "@/components/PriceLevelBar";

interface Snapshot {
  id: string;
  price: number;
  currency: string;
  airline: string;
  source: string;
  scraped_at: string;
}

interface PriceStats {
  p25: number;
  p75: number;
  median: number;
  count: number;
}

interface ChartData {
  snapshots: Snapshot[];
  average: number | null;
  hasBaseline: boolean;
  priceStats: PriceStats | null;
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/routes/${id}/snapshots`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [id]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 block">
        ← Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Price History</h1>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !data || data.snapshots.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500">No price data yet for this route.</p>
          <p className="text-sm mt-1">Check back after the next scrape cycle.</p>
        </div>
      ) : (
        <>
          {(() => {
            const latest = [...data.snapshots].sort(
              (a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
            )[0];
            return data.priceStats && latest ? (
              <PriceLevelBar
                currentPrice={latest.price}
                currency={latest.currency}
                p25={data.priceStats.p25}
                p75={data.priceStats.p75}
              />
            ) : !data.priceStats ? (
              <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
                收集更多價格資料中（至少需要 5 筆才能顯示價格分析）…
              </div>
            ) : null;
          })()}
          <PriceChart
            snapshots={data.snapshots}
            average={data.average}
            hasBaseline={data.hasBaseline}
          />
        </>
      )}

      {data && data.snapshots.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-700 mb-3">Recent snapshots</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Price</th>
                  <th className="pb-2 pr-4">Airline</th>
                  <th className="pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {[...data.snapshots].reverse().slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(s.scraped_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-medium">
                      {s.price.toLocaleString()} {s.currency}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{s.airline}</td>
                    <td className="py-2 text-gray-400 capitalize">{s.source.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
