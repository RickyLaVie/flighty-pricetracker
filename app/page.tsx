"use client";

import { useEffect, useState } from "react";
import { RouteCard } from "@/components/RouteCard";
import { AddRouteForm } from "@/components/AddRouteForm";
import { useLocale, T } from "@/lib/locale";

interface Route {
  id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  latest_price: number | null;
  latest_currency: string | null;
  latest_airline: string | null;
  latest_source: string | null;
  latest_departure_date: string | null;
  last_checked: string | null;
  exclude_budget_airlines: boolean;
  require_checked_baggage: boolean;
}

export default function Dashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLocale();
  const t = T[lang];

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a: Route, b: Route) => {
          if (!a.last_checked) return 1;
          if (!b.last_checked) return -1;
          return new Date(b.last_checked).getTime() - new Date(a.last_checked).getTime();
        });
        setRoutes(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleAdded(route: Route) {
    setRoutes((prev) => [route, ...prev]);
  }

  function handleDeleted(id: string) {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  }

  function handleUpdated(updated: Route) {
    setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        <AddRouteForm onAdded={handleAdded} />

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">✈️</p>
            <p className="text-lg font-bold text-gray-500">
              {lang === "zh" ? "尚未追蹤任何航線" : "No routes tracked yet"}
            </p>
            <p className="text-sm mt-1">
              {lang === "zh" ? "點上方按鈕開始追蹤票價" : "Add a route above to start watching prices."}
            </p>
          </div>
        ) : (
          routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))
        )}
      </div>
    </main>
  );
}
