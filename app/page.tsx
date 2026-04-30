"use client";

import { useEffect, useState } from "react";
import { RouteCard } from "@/components/RouteCard";
import { AddRouteForm } from "@/components/AddRouteForm";

interface Route {
  id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  latest_price: number | null;
  latest_currency: string | null;
  last_checked: string | null;
}

export default function Dashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

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
      });
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
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">✈ Flight Price Tracker</h1>
      <p className="text-gray-500 mb-8">Get notified when fares drop.</p>

      <div className="flex flex-col gap-4">
        <AddRouteForm onAdded={handleAdded} />

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading…</p>
        ) : routes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🛫</p>
            <p className="text-lg font-medium text-gray-500">No routes tracked yet</p>
            <p className="text-sm mt-1">Add a route above to start watching prices.</p>
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
