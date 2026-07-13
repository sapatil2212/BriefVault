import "server-only";
import { Prisma, type Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_SEEDS } from "@/lib/plans/defaults";
import type { PlanFeatureFlags, PlanKey, PlanLimits, PublicPlan } from "@/lib/plans/types";

/**
 * Database-backed plan catalog. Plans are lazily seeded from PLAN_SEEDS the
 * first time the catalog is read, after which the DB is authoritative. All
 * plan reads go through here so seeding, sorting, and DTO mapping stay in one
 * place.
 */

let seeded = false;

/** Idempotently ensure the four launch plans exist. Safe to call repeatedly. */
export async function ensurePlansSeeded(): Promise<void> {
  if (seeded) return;
  const count = await prisma.plan.count();
  if (count === 0) {
    await prisma.$transaction(
      PLAN_SEEDS.map((p) =>
        prisma.plan.create({
          data: {
            key: p.key,
            name: p.name,
            tagline: p.tagline,
            priceMonthly: p.priceMonthly,
            currency: p.currency,
            requiresApproval: p.requiresApproval,
            isPopular: p.isPopular,
            isActive: true,
            sortOrder: p.sortOrder,
            limits: p.limits as unknown as Prisma.InputJsonValue,
            features: p.features as unknown as Prisma.InputJsonValue,
            featureFlags: p.featureFlags as unknown as Prisma.InputJsonValue,
          },
        })
      )
    );
  }
  seeded = true;
}

/** Map a Prisma Plan row to the serializable public DTO. */
export function toPublicPlan(plan: Plan): PublicPlan {
  return {
    key: plan.key as PlanKey,
    name: plan.name,
    tagline: plan.tagline ?? "",
    priceMonthly: plan.priceMonthly,
    currency: plan.currency,
    requiresApproval: plan.requiresApproval,
    isPopular: plan.isPopular,
    sortOrder: plan.sortOrder,
    limits: plan.limits as unknown as PlanLimits,
    features: (plan.features as unknown as string[]) ?? [],
    featureFlags: (plan.featureFlags as unknown as PlanFeatureFlags) ?? ({} as PlanFeatureFlags),
  };
}

/** All active plans, ordered for display. */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  await ensurePlansSeeded();
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(toPublicPlan);
}

/** Resolve a single plan row by its key (case-insensitive), or null. */
export async function getPlanByKey(key: string): Promise<Plan | null> {
  await ensurePlansSeeded();
  return prisma.plan.findUnique({ where: { key: key.toUpperCase() } });
}
