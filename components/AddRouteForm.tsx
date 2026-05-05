"use client";

import { useState } from "react";
import { useLocale, T } from "@/lib/locale";
import { AirportInput } from "@/components/AirportInput";

interface RouteBasic {
  id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  latest_price: null;
  latest_currency: null;
  latest_airline: null;
  latest_source: null;
  latest_departure_date: null;
  last_checked: null;
  exclude_budget_airlines: boolean;
  require_checked_baggage: boolean;
}

interface Props {
  onAdded: (route: RouteBasic) => void;
}

function handleDateChange(val: string, setter: (v: string) => void) {
  if (!val) { setter(""); return; }
  // Only accept values where the year part is exactly 4 digits
  const year = val.split("-")[0];
  if (year.length <= 4) setter(val);
}

export function AddRouteForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [excludeBudget, setExcludeBudget] = useState(false);
  const [requireBaggage, setRequireBaggage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { lang } = useLocale();
  const t = T[lang];

  function validate() {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z]{3}$/.test(origin)) e.origin = lang === "zh" ? "請輸入 3 碼機場代碼" : "3-letter IATA code required";
    if (!/^[A-Za-z]{3}$/.test(destination)) e.destination = lang === "zh" ? "請輸入 3 碼機場代碼" : "3-letter IATA code required";
    if (!dateFrom) e.date_from = lang === "zh" ? "請選擇日期" : "Required";
    if (!dateTo) e.date_to = lang === "zh" ? "請選擇日期" : "Required";
    if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom))
      e.date_to = lang === "zh" ? "回程日期不可早於出發日期" : "End date must be on or after start date";
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
        exclude_budget_airlines: excludeBudget,
        require_checked_baggage: requireBaggage,
      }),
    });

    setBusy(false);
    if (res.ok) {
      const route = await res.json();
      onAdded({ ...route, latest_price: null, latest_currency: null, latest_airline: null, latest_source: null, latest_departure_date: null, last_checked: null, exclude_budget_airlines: excludeBudget, require_checked_baggage: requireBaggage });
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
        className="w-full py-3 rounded-2xl border-2 border-dashed border-brand/40 text-brand hover:bg-brand-light font-bold transition-colors"
      >
        {t.addRoute}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3"
    >
      <h2 className="font-extrabold text-gray-800">
        {lang === "zh" ? "新增航線" : "Add New Route"}
      </h2>

      <div className="flex gap-2">
        <div className="flex-1">
          <AirportInput
            value={origin}
            onChange={setOrigin}
            placeholder={lang === "zh" ? "出發（例：TPE）" : "From (e.g. TPE)"}
            lang={lang}
          />
          {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin}</p>}
        </div>
        <div className="flex-1">
          <AirportInput
            value={destination}
            onChange={setDestination}
            placeholder={lang === "zh" ? "目的地（例：NRT）" : "To (e.g. NRT)"}
            lang={lang}
          />
          {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={dateFrom}
            min="2024-01-01"
            max="2035-12-31"
            onChange={(e) => handleDateChange(e.target.value, setDateFrom)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {errors.date_from && <p className="text-red-500 text-xs mt-1">{errors.date_from}</p>}
        </div>
        <div className="flex-1">
          <input
            type="date"
            value={dateTo}
            min="2024-01-01"
            max="2035-12-31"
            onChange={(e) => handleDateChange(e.target.value, setDateTo)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {errors.date_to && <p className="text-red-500 text-xs mt-1">{errors.date_to}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-gray-600">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={requireBaggage} onChange={e => setRequireBaggage(e.target.checked)} className="rounded accent-brand" />
          {lang === "zh" ? "需含托運行李" : "Require checked baggage"}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={excludeBudget} onChange={e => setExcludeBudget(e.target.checked)} className="rounded accent-brand" />
          {lang === "zh" ? "排除廉價航空" : "Exclude budget airlines"}
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover disabled:opacity-50 transition-colors shadow-sm"
        >
          {busy ? "…" : lang === "zh" ? "確認新增" : "Add Route"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          {lang === "zh" ? "取消" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
