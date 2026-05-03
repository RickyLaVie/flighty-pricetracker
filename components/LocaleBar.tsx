"use client";

import { useLocale, CURRENCIES, type CurrencyCode } from "@/lib/locale";

export function LocaleBar() {
  const { lang, setLang, currency, setCurrency } = useLocale();

  return (
    <div className="flex items-center justify-end gap-3 px-4 py-2 bg-white border-b border-gray-100 text-sm">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setLang("zh")}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            lang === "zh" ? "bg-gray-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          繁中
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            lang === "en" ? "bg-gray-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          EN
        </button>
      </div>

      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
    </div>
  );
}
