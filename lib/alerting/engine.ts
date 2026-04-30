import { prisma } from "@/lib/db";
import { computeRollingAverage } from "./average";
import { evaluateTier } from "./tiers";
import { isOnCooldown, clearCooldownsBelow, recordAlert } from "./cooldown";
import { sendPriceAlert } from "@/lib/linebot/notifications";
import type { Tier } from "./tiers";

export async function evaluateAndAlert(routeId: string, snapshotPrice: number) {
  const average = await computeRollingAverage(routeId);
  if (average === null) return; // insufficient history

  const tierInfo = evaluateTier(snapshotPrice, average);
  if (tierInfo === null) return; // price above all thresholds

  const tier = tierInfo.tier as Tier;

  // Higher tier overrides active lower-tier cooldowns
  await clearCooldownsBelow(routeId, tier);

  const onCooldown = await isOnCooldown(routeId, tier);
  if (onCooldown) return;

  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) return;

  const dropPercent = Math.round((1 - snapshotPrice / average) * 100);

  await sendPriceAlert({
    origin: route.origin,
    destination: route.destination,
    date_from: route.date_from,
    date_to: route.date_to,
    price: snapshotPrice,
    average,
    dropPercent,
    tierInfo,
  });

  await recordAlert(routeId, tier);
}
