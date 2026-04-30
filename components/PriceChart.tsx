"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface Snapshot {
  scraped_at: string;
  price: number;
  source: string;
}

interface Props {
  snapshots: Snapshot[];
  average: number | null;
  hasBaseline: boolean;
}

export function PriceChart({ snapshots, average, hasBaseline }: Props) {
  const data = snapshots.map((s) => ({
    date: new Date(s.scraped_at).toLocaleDateString(),
    price: s.price,
    source: s.source,
  }));

  return (
    <div>
      {!hasBaseline && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Building baseline — alerts will activate after 30 days of data
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            dot={{ r: 3 }}
            name="Price"
          />
          {average !== null && (
            <ReferenceLine
              y={average}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `Avg ${Math.round(average).toLocaleString()}`, fill: "#92400e", fontSize: 11 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
