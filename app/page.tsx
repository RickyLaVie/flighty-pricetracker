"use client";

import { useEffect, useState } from "react";
import { RouteCard } from "@/components/RouteCard";
import { AddRouteForm } from "@/components/AddRouteForm";
import { LineFriendBanner } from "@/components/LineFriendBanner";
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

interface User {
  userId: string;
  displayName: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLocale();
  const t = T[lang];

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/routes").then((r) => r.json()),
    ])
      .then(([userData, routesData]) => {
        setUser(userData);
        if (Array.isArray(routesData)) {
          const sorted = [...routesData].sort((a: Route, b: Route) => {
            if (!a.last_checked) return 1;
            if (!b.last_checked) return -1;
            return new Date(b.last_checked).getTime() - new Date(a.last_checked).getTime();
          });
          setRoutes(sorted);
        }
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

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">✈️</p>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          {lang === "zh" ? "追蹤你的航班票價" : "Track your flight prices"}
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          {lang === "zh"
            ? "登入後即可追蹤航線、查看票價歷史，並在票價下跌時收到 LINE 通知"
            : "Log in to track routes, view price history, and get LINE alerts when fares drop"}
        </p>
        <a
          href="/api/auth/line/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#06C755] text-white font-bold text-base hover:bg-[#05b34d] transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.627.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          {lang === "zh" ? "使用 LINE 登入" : "Login with LINE"}
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        <LineFriendBanner />
        <AddRouteForm onAdded={handleAdded} />

        {routes.length === 0 ? (
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
