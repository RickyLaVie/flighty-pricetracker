"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, T } from "@/lib/locale";
import { AIRPORTS } from "@/lib/airports";

function airportLabel(iata: string, lang: "zh" | "en"): string {
  const a = AIRPORTS.find((ap) => ap.iata === iata);
  if (!a) return iata;
  if (lang === "en") return `${a.city} (${iata})`;
  const shortName = a.nameZh.replace(/國際機場$/, "").replace(/機場$/, "");
  return `${a.cityZh}${shortName}（${iata}）`;
}

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
  is_round_trip: boolean;
}

function sourceLabel(source: string | null): string {
  if (!source) return "";
  return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBookingUrl(
  source: string | null,
  origin: string,
  destination: string,
  dateFrom: string,
  dateTo: string
): string {
  const dep = dateFrom.slice(0, 10);
  const ret = dateTo.slice(0, 10);
  if (source === "momondo")
    return `https://www.momondo.com/flight-search/${origin}-${destination}/${dep}/${ret}?adults=1&sort=price_a`;
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
  const [isRoundTrip, setIsRoundTrip] = useState(route.is_round_trip);
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
    if (!confirm(`Delete route ${route.origin} ⇄ ${route.destination}?`)) return;
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
      body: JSON.stringify({
        date_from: dateFrom,
        date_to: isRoundTrip ? dateTo : dateFrom,
        exclude_budget_airlines: excludeBudget,
        require_checked_baggage: requireBaggage,
        is_round_trip: isRoundTrip,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdated({
        ...route,
        date_from: updated.date_from,
        date_to: updated.date_to,
        exclude_budget_airlines: updated.exclude_budget_airlines,
        require_checked_baggage: updated.require_checked_baggage,
        is_round_trip: updated.is_round_trip,
      });
      setEditing(false);
    } else {
      setError("Failed to update. Please try again.");
    }
  }

  const price = route.latest_price != null ? fmt(route.latest_price) : t.noDataYet;
  const checked = route.last_checked
    ? new Date(route.last_checked).toLocaleString()
    : "Never";
  const bookingUrl = buildBookingUrl(
    route.latest_source,
    route.origin,
    route.destination,
    route.date_from,
    route.date_to
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/routes/${route.id}`}
          className="text-xl font-extrabold text-gray-900 hover:text-brand transition-colors leading-tight"
        >
          {airportLabel(route.origin, lang)} {route.is_round_trip ? "⇄" : "→"} {airportLabel(route.destination, lang)}
        </Link>
        <div className="flex gap-1.5 shrink-0">
          {/* White bg + brand border = clear orange text on white */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded-lg border border-brand text-brand font-semibold bg-white hover:bg-brand-light disabled:opacity-50 transition-colors"
          >
            {refreshing ? "…" : t.refreshNow}
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
          >
            {lang === "zh" ? "編輯" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-red-100 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {lang === "zh" ? "刪除" : "Delete"}
          </button>
        </div>
      </div>

      {/* Date / filters */}
      {editing ? (
        <form onSubmit={handleEdit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand/30"
              required
            />
            <span className="self-center text-gray-400">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand/30"
              required
            />
          </div>
          {/* Trip type toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold w-fit">
            <button
              type="button"
              onClick={() => setIsRoundTrip(false)}
              className={`px-3 py-1.5 transition-colors ${!isRoundTrip ? "bg-brand text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              {lang === "zh" ? "單程" : "One-way"}
            </button>
            <button
              type="button"
              onClick={() => setIsRoundTrip(true)}
              className={`px-3 py-1.5 transition-colors ${isRoundTrip ? "bg-brand text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              {lang === "zh" ? "來回" : "Round trip"}
            </button>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireBaggage}
                onChange={(e) => setRequireBaggage(e.target.checked)}
                className="rounded accent-brand"
              />
              {lang === "zh" ? "需含托運行李" : "Require checked baggage"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeBudget}
                onChange={(e) => setExcludeBudget(e.target.checked)}
                className="rounded accent-brand"
              />
              {lang === "zh" ? "排除廉價航空" : "Exclude budget airlines"}
            </label>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            {/* Dark bg primary = white text, clear */}
            <button
              type="submit"
              disabled={busy}
              className="text-sm px-4 py-1.5 rounded-lg bg-brand-hover text-white font-bold hover:bg-brand disabled:opacity-50 transition-colors"
            >
              {lang === "zh" ? "儲存" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm px-4 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-gray-400 flex flex-wrap items-center gap-2">
          <span>{route.date_from.slice(0, 10)} – {route.date_to.slice(0, 10)}</span>
          {route.require_checked_baggage && (
            <span className="bg-brand-light text-brand-hover px-2 py-0.5 rounded-full text-xs font-semibold">
              {lang === "zh" ? "含托運行李" : "Checked baggage"}
            </span>
          )}
          {route.exclude_budget_airlines && (
            <span className="bg-brand-light text-brand-hover px-2 py-0.5 rounded-full text-xs font-semibold">
              {lang === "zh" ? "排除廉航" : "No budget airlines"}
            </span>
          )}
        </div>
      )}

      {/* Price + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">{price}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {route.latest_airline && route.latest_airline !== "Unknown" && (
              <span>✈ {route.latest_airline}</span>
            )}
            {route.latest_source && (
              <>
                <span className="text-gray-300">·</span>
                <span>via {sourceLabel(route.latest_source)}</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-300 mt-0.5">🕐 {checked}</div>
        </div>

        <div className="flex flex-col gap-1.5 items-end">
          {route.latest_price && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors shadow-sm"
            >
              {t.bookNow}
            </a>
          )}
          <Link
            href={`/routes/${route.id}`}
            className="px-4 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            {t.priceHistory}
          </Link>
        </div>
      </div>
    </div>
  );
}
