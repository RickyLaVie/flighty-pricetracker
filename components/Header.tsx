"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, CURRENCIES, type CurrencyCode } from "@/lib/locale";

interface User {
  userId: string;
  displayName: string | null;
  pictureUrl: string | null;
}

export function Header() {
  const { lang, setLang, currency, setCurrency } = useLocale();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/flighty-logo.svg"
            alt="Flighty"
            width={120}
            height={54}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLang("zh")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "zh"
                  ? "bg-brand-hover text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              繁中
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "en"
                  ? "bg-brand-hover text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              EN
            </button>
          </div>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>

          {/* Auth area */}
          {user === undefined ? null : user ? (
            <div className="flex items-center gap-2">
              {user.pictureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.pictureUrl}
                  alt={user.displayName ?? ""}
                  className="w-7 h-7 rounded-full object-cover"
                />
              )}
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
              >
                {lang === "zh" ? "登出" : "Logout"}
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/line/login"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#06C755] text-white font-bold hover:bg-[#05b34d] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.627.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              {lang === "zh" ? "LINE 登入" : "Login with LINE"}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
