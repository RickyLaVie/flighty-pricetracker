export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateRouteDates, softDeleteRoute, getRouteById } from "@/lib/routes/queries";
import { updateRouteDatesSchema } from "@/lib/routes/validation";

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
  const parsed = updateRouteDatesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const updated = await updateRouteDates(id, {
    date_from: new Date(parsed.data.date_from),
    date_to: new Date(parsed.data.date_to),
  });
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
