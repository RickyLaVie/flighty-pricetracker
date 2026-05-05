"use client";

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";

export type Lang = "zh" | "en";
export type CurrencyCode = "USD" | "TWD" | "EUR" | "GBP" | "JPY" | "HKD" | "CNY";

export const CURRENCIES: { code: CurrencyCode; flag: string; symbol: string }[] = [
  { code: "TWD", flag: "🇹🇼", symbol: "NT$" },
  { code: "USD", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", flag: "🇬🇧", symbol: "£" },
  { code: "JPY", flag: "🇯🇵", symbol: "¥" },
  { code: "HKD", flag: "🇭🇰", symbol: "HK$" },
  { code: "CNY", flag: "🇨🇳", symbol: "¥" },
];

const SYMBOL: Record<CurrencyCode, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol])
) as Record<CurrencyCode, string>;

interface LocaleCtx {
  lang: Lang;
  currency: CurrencyCode;
  rates: Partial<Record<string, number>>;
  setLang: (l: Lang) => void;
  setCurrency: (c: CurrencyCode) => void;
  /** Format a USD price into the selected currency string, e.g. "NT$6,338" */
  fmt: (usdPrice: number | null | undefined) => string;
  /** Convert a USD number to selected-currency number (for chart axes) */
  convert: (usdPrice: number) => number;
}

const LocaleContext = createContext<LocaleCtx>({
  lang: "zh",
  currency: "USD",
  rates: {},
  setLang: () => {},
  setCurrency: () => {},
  fmt: (p) => (p != null ? `$${Math.round(p).toLocaleString()}` : "--"),
  convert: (p) => p,
});

// Approximate fallback rates used when the live fetch fails
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1, TWD: 32.5, EUR: 0.92, GBP: 0.79, JPY: 145, HKD: 7.82, CNY: 7.25,
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Partial<Record<string, number>>>(FALLBACK_RATES);

  // Hydrate from localStorage
  useEffect(() => {
    const l = localStorage.getItem("lang") as Lang | null;
    const c = localStorage.getItem("currency") as CurrencyCode | null;
    if (l === "zh" || l === "en") setLangState(l);
    if (c) setCurrencyState(c);
  }, []);

  // Fetch live exchange rates via server-side proxy (avoids browser CORS)
  useEffect(() => {
    fetch("/api/rates")
      .then((r) => { if (!r.ok) throw new Error(`rates ${r.status}`); return r.json(); })
      .then((d) => {
        // Only update if we received actual rates; an empty object would overwrite FALLBACK_RATES
        if (d?.rates && Object.keys(d.rates).length >= 5) {
          setRates({ USD: 1, ...d.rates });
        }
      })
      .catch((e) => console.warn("[locale] exchange rate fetch failed, using fallback:", e));
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  }, []);

  const convert = useCallback(
    (usdPrice: number) => {
      const rate = rates[currency] ?? 1;
      return currency === "JPY"
        ? Math.round(usdPrice * rate)
        : Math.round(usdPrice * rate * 10) / 10;
    },
    [currency, rates]
  );

  const fmt = useCallback(
    (usdPrice: number | null | undefined) => {
      if (usdPrice == null) return "--";
      const sym = SYMBOL[currency];
      const val = convert(usdPrice);
      return `${sym}${Math.round(val).toLocaleString()}`;
    },
    [currency, convert]
  );

  return (
    <LocaleContext.Provider value={{ lang, currency, rates, setLang, setCurrency, fmt, convert }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

// ─── Translation strings ────────────────────────────────────────────────────

export const T = {
  zh: {
    cheap: "便宜", typical: "一般", expensive: "稍貴",
    levelLabel: (l: string) => `就你的搜尋條件而言，目前的票價${l}`,
    typicalRange: (lo: string, hi: string) =>
      `此路線最低票價通常介於 ${lo} – ${hi} 之間。`,
    monthAvg: (mo: string, v: string) => `${mo}份均價約 ${v}，`,
    yearMedian: (v: string) => `全年中位數 ${v}。`,
    dataSource: "（資料來源：Momondo 歷史市場資料）",
    normalRange: "一般價格區間",
    noMarketData: "尚未取得市場歷史價格資料，下次資料更新後將自動顯示。",
    bookNow: "立即訂票",
    priceHistory: "查看歷史價格",
    refreshNow: "資料更新",
    addRoute: "+ 追蹤新路線",
    noDataYet: "No data yet",
    buildingBaseline: "Building baseline — alerts will activate after 30 days of data",
  },
  en: {
    cheap: "Cheap", typical: "Typical", expensive: "Expensive",
    levelLabel: (l: string) => `Based on your search, fares are currently ${l.toLowerCase()}`,
    typicalRange: (lo: string, hi: string) =>
      `Lowest fares for this route typically range from ${lo} to ${hi}.`,
    monthAvg: (mo: string, v: string) => `${mo} avg ${v}; `,
    yearMedian: (v: string) => `annual median ${v}.`,
    dataSource: "(Source: Momondo historical data)",
    normalRange: "Typical range",
    noMarketData: "Market data not yet available — refresh to fetch it.",
    bookNow: "Book Now",
    priceHistory: "Price History",
    refreshNow: "Refresh Now",
    addRoute: "+ Track new route",
    noDataYet: "No data yet",
    buildingBaseline: "Building baseline — alerts will activate after 30 days of data",
  },
} as const;

const MONTH_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const MONTH_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function monthName(idx: number, lang: Lang) {
  return lang === "zh" ? MONTH_ZH[idx] : MONTH_EN[idx];
}
