import { prisma } from "@/lib/db";

export async function listActiveRoutes() {
  return prisma.route.findMany({
    where: { status: "active" },
    include: {
      snapshots: {
        orderBy: { scraped_at: "desc" },
        take: 1,
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getRouteById(id: string) {
  return prisma.route.findUnique({ where: { id } });
}

export async function createRoute(data: {
  origin: string;
  destination: string;
  date_from: Date;
  date_to: Date;
  exclude_budget_airlines?: boolean;
  require_checked_baggage?: boolean;
}) {
  return prisma.route.create({ data: { ...data, status: "active" } });
}

export async function updateRoute(
  id: string,
  data: {
    date_from?: Date;
    date_to?: Date;
    exclude_budget_airlines?: boolean;
    require_checked_baggage?: boolean;
  }
) {
  return prisma.route.update({ where: { id }, data });
}

export async function updateRouteDates(
  id: string,
  data: { date_from: Date; date_to: Date }
) {
  return prisma.route.update({ where: { id }, data });
}

export async function softDeleteRoute(id: string) {
  return prisma.route.update({
    where: { id },
    data: { status: "inactive" },
  });
}
