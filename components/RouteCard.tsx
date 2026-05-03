"use client";

import Link from "next/link";
import { useState } from "react";
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

function sourceLabel(source: string | null): string {
  if (!source) return "";
  return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBookingUrl(source: string | null, origin: string, destination: string, dateFrom: string, dateTo: string): string {
  const dep = dateFrom.slice(0, 10);
  const ret = dateTo.slice(0, 10);
  if (source === "momondo") {
    return `https://www.momondo.com/flight-search/${origin}-${destination}/${dep}/${ret}?adults=1&sort=price_a`;
  }
  if (source === "skyscanner") {
    const d = new Date(dep);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `https://www.skyscanner.com/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${yy}${mm}${dd}/?adults=1&cabinclass=economy&rtn=1`;
  }
  return `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${dep}+returning+${ret}&hl=en&curr=USD`;
}

interface Props {
  route: Route;
  onDeleted: (id: string) => void;
  onUpdated: (route: Route) => void;
}

export function RouteCard({ route, onDeleted, onUpdated }: Props) {
  const { fmt, lang } = useLocale();
  const t = T[lang];
  const [editing, setEditing] = useState(false);
  const [dateFrom, setDateFrom] = useState(route.date_from.slice(0, 10));
  const [dateTo, setDateTo] = useState(route.date_to.slice(0, 10));
  const [excludeBudget, setExcludeBudget] = useState(route.exclude_budget_airlines);
  const [requireBaggage, setRequireBaggage] = useState(route.require_checked_baggage);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    const res = await fetch(`/api/routes/${route.id}/refresh`, { method: "POST" });
    setRefreshing(false);
    if (res.ok) {
      const data = await res.json();
      onUpdated({
        ...route,
        latest_price: data.price,
        latest_currency: data.currency,
        latest_airline: data.airline,
        latest_source: data.source,
        latest_departure_date: data.departure_date,
        last_checked: data.last_checked,
      });
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete route ${route.origin} → ${route.destination}?`)) return;
    setBusy(true);
    await fetch(`/api/routes/${route.id}`, { method: "DELETE" });
    onDeleted(route.id);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (new Date(dateTo) < new Date(dateFrom)) {
      setError("End date must be on or after start date");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/routes/${route.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_from: dateFrom, date_to: dateTo, exclude_budget_airlines: excludeBudget, require_checked_baggage: requireBaggage }),
    });
    setBusy(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdated({ ...route, date_from: updated.date_from, date_to: updated.date_to, exclude_budget_airlines: updated.exclude_budget_airlines, require_checked_baggage: updated.require_checked_baggage });
      setEditing(false);
    } else {
      setError("Failed to update. Please try again.");
    }
  }

  const price = route.latest_price != null ? fmt(route.latest_price) : t.noDataYet;
  const checked = route.last_checked
    ? new Date(route.last_checked).toLocaleString()
    : "Never";
  const bookingUrl = buildBookingUrl(route.latest_source, route.origin, route.destination, route.date_from, route.date_to);

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href={`/routes/${route.id}`}
          className="text-xl font-bold text-blue-600 hover:underline"
        >
          {route.origin} → {route.destination}
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            {refreshing ? "…" : t.refreshNow}
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-sm px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleEdit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              required
            />
            <span className="self-center text-gray-500">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={requireBaggage} onChange={e => setRequireBaggage(e.target.checked)} className="rounded" />
              需含托運行李
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={excludeBudget} onChange={e => setExcludeBudget(e.target.checked)} className="rounded" />
              排除廉價航空
            </label>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-gray-500 flex flex-col gap-1">
          <span>{route.date_from.slice(0, 10)} – {route.date_to.slice(0, 10)}</span>
          <div className="flex gap-2 flex-wrap">
            {route.require_checked_baggage && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs">含托運行李</span>}
            {route.exclude_budget_airlines && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs">排除廉價航空</span>}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
          <span className="font-semibold text-gray-800">💰 {price}</span>
          {route.latest_airline && route.latest_airline !== "Unknown" && (
            <span>✈️ {route.latest_airline}</span>
          )}
          {route.latest_source && (
            <span className="text-gray-400 text-xs">via {sourceLabel(route.latest_source)}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
          <span className="text-gray-400">🕐 {checked}</span>
          {route.latest_price && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              {t.bookNow}
            </a>
          )}
          <Link
            href={`/routes/${route.id}`}
            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200"
          >
            {t.priceHistory}
          </Link>
        </div>
      </div>
    </div>
  );
}
