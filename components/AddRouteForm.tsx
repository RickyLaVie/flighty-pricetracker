"use client";

import { useState } from "react";

interface RouteBasic {
  id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  latest_price: null;
  latest_currency: null;
  latest_airline: null;
  last_checked: null;
}

interface Props {
  onAdded: (route: RouteBasic) => void;
}

export function AddRouteForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z]{3}$/.test(origin)) e.origin = "3-letter IATA code required";
    if (!/^[A-Za-z]{3}$/.test(destination)) e.destination = "3-letter IATA code required";
    if (!dateFrom) e.date_from = "Required";
    if (!dateTo) e.date_to = "Required";
    if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom))
      e.date_to = "End date must be on or after start date";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setBusy(true);

    const res = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date_from: dateFrom,
        date_to: dateTo,
      }),
    });

    setBusy(false);
    if (res.ok) {
      const route = await res.json();
      onAdded({ ...route, latest_price: null, latest_currency: null, latest_airline: null, last_checked: null });
      setOrigin(""); setDestination(""); setDateFrom(""); setDateTo("");
      setOpen(false);
    } else {
      const body = await res.json();
      const fieldErrors = body?.issues?.fieldErrors ?? {};
      const mapped: Record<string, string> = {};
      for (const [k, msgs] of Object.entries(fieldErrors)) {
        mapped[k] = (msgs as string[])[0] ?? "Invalid";
      }
      setErrors(mapped);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
      >
        + Track a new route
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow p-5 flex flex-col gap-3"
    >
      <h2 className="font-semibold text-gray-800">New Route</h2>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            placeholder="From (e.g. TPE)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full border rounded px-3 py-2 text-sm uppercase"
          />
          {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin}</p>}
        </div>
        <div className="flex-1">
          <input
            placeholder="To (e.g. NRT)"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full border rounded px-3 py-2 text-sm uppercase"
          />
          {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {errors.date_from && <p className="text-red-500 text-xs mt-1">{errors.date_from}</p>}
        </div>
        <div className="flex-1">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {errors.date_to && <p className="text-red-500 text-xs mt-1">{errors.date_to}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add Route"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-lg bg-gray-100 text-sm hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
