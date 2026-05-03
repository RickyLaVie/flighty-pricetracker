"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, CURRENCIES, type CurrencyCode } from "@/lib/locale";

export function Header() {
  const { lang, setLang, currency, setCurrency } = useLocale();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/flighty-logo.png"
            alt="Flighty"
            width={120}
            height={54}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLang("zh")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "zh" ? "bg-brand text-white" : "bg-white text-gray-500 hover:bg-brand-light"
              }`}
            >
              繁中
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "en" ? "bg-brand text-white" : "bg-white text-gray-500 hover:bg-brand-light"
              }`}
            >
              EN
            </button>
          </div>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer font-medium"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
