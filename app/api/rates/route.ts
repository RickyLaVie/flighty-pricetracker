export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// TWD is not available from ECB/frankfurter.app.
// Keep it as a static rate; other currencies use live data.
const STATIC_RATES: Record<string, number> = {
  TWD: 32.5, EUR: 0.92, GBP: 0.79, JPY: 145, HKD: 7.82, CNY: 7.25,
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,HKD,CNY",
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && Object.keys(data.rates).length >= 4) {
        // Merge: static rates first (provides TWD), live rates override the rest
        return NextResponse.json({ rates: { ...STATIC_RATES, ...data.rates } });
      }
    }
  } catch {
    // fall through to static rates
  }
  return NextResponse.json({ rates: STATIC_RATES });
}
