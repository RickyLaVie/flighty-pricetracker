export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://api.frankfurter.app/latest?from=USD&to=TWD,EUR,GBP,JPY,HKD,CNY",
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return NextResponse.json({ rates: {} }, { status: 200 });
  const data = await res.json();
  return NextResponse.json(data);
}
