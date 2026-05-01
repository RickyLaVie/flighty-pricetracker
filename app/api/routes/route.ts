export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listActiveRoutes, createRoute } from "@/lib/routes/queries";
import { createRouteSchema } from "@/lib/routes/validation";


export async function GET() {
  const routes = await listActiveRoutes();
  type RouteWithSnapshot = Awaited<ReturnType<typeof listActiveRoutes>>[number];
  const data = routes.map((r: RouteWithSnapshot) => ({
    id: r.id,
    origin: r.origin,
    destination: r.destination,
    date_from: r.date_from,
    date_to: r.date_to,
    status: r.status,
    created_at: r.created_at,
    latest_price: r.snapshots[0]?.price ?? null,
    latest_currency: r.snapshots[0]?.currency ?? null,
    latest_airline: r.snapshots[0]?.airline ?? null,
    latest_departure_date: r.snapshots[0]?.departure_date ?? null,
    last_checked: r.snapshots[0]?.scraped_at ?? null,
    exclude_budget_airlines: r.exclude_budget_airlines,
    require_checked_baggage: r.require_checked_baggage,
  }));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const { origin, destination, date_from, date_to, exclude_budget_airlines, require_checked_baggage } = parsed.data;
  const route = await createRoute({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    date_from: new Date(date_from),
    date_to: new Date(date_to),
    exclude_budget_airlines: exclude_budget_airlines ?? false,
    require_checked_baggage: require_checked_baggage ?? false,
  });
  return NextResponse.json(route, { status: 201 });
}
