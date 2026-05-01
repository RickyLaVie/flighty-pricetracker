export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateRoute, softDeleteRoute, getRouteById } from "@/lib/routes/queries";
import { updateRouteSchema } from "@/lib/routes/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getRouteById(id);
  if (!existing || existing.status !== "active") {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  const body = await req.json();
  const parsed = updateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const data: Parameters<typeof updateRoute>[1] = {};
  if (parsed.data.date_from) data.date_from = new Date(parsed.data.date_from);
  if (parsed.data.date_to) data.date_to = new Date(parsed.data.date_to);
  if (parsed.data.exclude_budget_airlines !== undefined) data.exclude_budget_airlines = parsed.data.exclude_budget_airlines;
  if (parsed.data.require_checked_baggage !== undefined) data.require_checked_baggage = parsed.data.require_checked_baggage;
  const updated = await updateRoute(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getRouteById(id);
  if (!existing || existing.status !== "active") {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  await softDeleteRoute(id);
  return new NextResponse(null, { status: 204 });
}
