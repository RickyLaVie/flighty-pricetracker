"use client";

import Link from "next/link";
import { useState } from "react";

interface Route {
  id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  latest_price: number | null;
  latest_currency: string | null;
  latest_airline: string | null;
  last_checked: string | null;
}

interface Props {
  route: Route;
  onDeleted: (id: string) => void;
  onUpdated: (route: Route) => void;
}

export function RouteCard({ route, onDeleted, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [dateFrom, setDateFrom] = useState(route.date_from.slice(0, 10));
  const [dateTo, setDateTo] = useState(route.date_to.slice(0, 10));
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
      body: JSON.stringify({ date_from: dateFrom, date_to: dateTo }),
    });
    setBusy(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdated({ ...route, date_from: updated.date_from, date_to: updated.date_to });
      setEditing(false);
    } else {
      setError("Failed to update. Please try again.");
    }
  }

  const price = route.latest_price
    ? `${route.latest_price.toLocaleString()} ${route.latest_currency ?? ""}`
    : "No data yet";
  const checked = route.last_checked
    ? new Date(route.last_checked).toLocaleString()
    : "Never";
  const bookingUrl = `https://www.google.com/travel/flights?q=one+way+flights+from+${route.origin}+to+${route.destination}+on+${route.date_from.slice(0, 10)}&hl=en&curr=USD`;

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
            {refreshing ? "Refreshing…" : "Refresh Now"}
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
        <p className="text-sm text-gray-500">
          {route.date_from.slice(0, 10)} – {route.date_to.slice(0, 10)}
        </p>
      )}

      <div className="text-sm text-gray-600 flex flex-col gap-1">
        <div className="flex gap-4">
          <span>💰 {price}</span>
          {route.latest_airline && route.latest_airline !== "Unknown" && (
            <span>✈️ {route.latest_airline}</span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <span>🕐 {checked}</span>
          {route.latest_price && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🔗 Book on Google Flights
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
