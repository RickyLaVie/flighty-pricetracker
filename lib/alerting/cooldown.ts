import { prisma } from "@/lib/db";
import type { Tier } from "./tiers";

const COOLDOWN_MS = 12 * 60 * 60 * 1000;

export async function isOnCooldown(routeId: string, tier: Tier): Promise<boolean> {
  const cutoff = new Date(Date.now() - COOLDOWN_MS);
  const recent = await prisma.alertLog.findFirst({
    where: {
      route_id: routeId,
      tier,
      sent_at: { gte: cutoff },
    },
  });
  return recent !== null;
}

export async function clearCooldownsBelow(routeId: string, tier: Tier) {
  // When a higher tier fires, reset lower-tier cooldowns so they re-trigger if price recovers
  const cutoff = new Date(Date.now() - COOLDOWN_MS);
  await prisma.alertLog.deleteMany({
    where: {
      route_id: routeId,
      tier: { lt: tier },
      sent_at: { gte: cutoff },
    },
  });
}

export async function recordAlert(routeId: string, tier: Tier) {
  await prisma.alertLog.create({ data: { route_id: routeId, tier } });
}
