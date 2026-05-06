export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listActiveRoutes, createRoute } from "@/lib/routes/queries";
import { createRouteSchema } from "@/lib/routes/validation";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const routes = await listActiveRoutes(session.userId);
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
      latest_source: r.snapshots[0]?.source ?? null,
      latest_departure_date: r.snapshots[0]?.departure_date ?? null,
      last_checked: r.snapshots[0]?.scraped_at ?? null,
      exclude_budget_airlines: r.exclude_budget_airlines,
      require_checked_baggage: r.require_checked_baggage,
      is_round_trip: r.is_round_trip ?? true,
    }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/routes] GET failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const { origin, destination, date_from, date_to, exclude_budget_airlines, require_checked_baggage, is_round_trip } = parsed.data;
  try {
    const route = await createRoute({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date_from: new Date(date_from),
      date_to: new Date(date_to),
      user_id: session.userId,
      exclude_budget_airlines: exclude_budget_airlines ?? false,
      require_checked_baggage: require_checked_baggage ?? false,
      is_round_trip: is_round_trip ?? true,
    });
    return NextResponse.json(route, { status: 201 });
  } catch (err) {
    console.error("[api/routes] POST failed:", err);
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
  }
}
