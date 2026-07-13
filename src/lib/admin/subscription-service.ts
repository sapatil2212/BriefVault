import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePlansSeeded } from "@/lib/plans/service";
import type { Paginated } from "@/types/admin";
import type { AdminSubscriptionRow, SubscriptionStats } from "@/types/admin";

export interface SubscriptionListFilter {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}

function buildWhere(f: SubscriptionListFilter): Prisma.SubscriptionWhereInput {
  const where: Prisma.SubscriptionWhereInput = {};
  if (f.status) where.status = f.status as Prisma.SubscriptionWhereInput["status"];
  if (f.plan) where.plan = { key: f.plan.toUpperCase() };
  if (f.search) {
    where.user = {
      OR: [
        { email: { contains: f.search } },
        { firstName: { contains: f.search } },
        { lastName: { contains: f.search } },
        { organization: { contains: f.search } },
      ],
    };
  }
  return where;
}

/** Paginated subscription list joined with subscriber + plan. */
export async function listSubscriptions(f: SubscriptionListFilter): Promise<Paginated<AdminSubscriptionRow>> {
  await ensurePlansSeeded();
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize ?? 20));
  const where = buildWhere(f);

  const [total, rows] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, organization: true } },
        plan: { select: { key: true, name: true, priceMonthly: true, currency: true } },
      },
    }),
  ]);

  const items: AdminSubscriptionRow[] = rows.map((s) => ({
    id: s.id,
    userId: s.user.id,
    userName: `${s.user.firstName} ${s.user.lastName}`.trim(),
    userEmail: s.user.email,
    organization: s.user.organization,
    planKey: s.plan.key,
    planName: s.plan.name,
    priceMonthly: s.plan.priceMonthly,
    currency: s.plan.currency,
    status: s.status,
    startedAt: s.startedAt?.toISOString() ?? null,
    currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Headline subscription metrics: counts by status, MRR, and per-plan spread. */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  await ensurePlansSeeded();

  const [byStatus, activeWithPlan, plans] = await Promise.all([
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: { select: { key: true, name: true, priceMonthly: true } } },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { key: true, name: true } }),
  ]);

  const statusCounts: Record<string, number> = { PENDING: 0, ACTIVE: 0, EXPIRED: 0, CANCELLED: 0 };
  for (const g of byStatus) statusCounts[g.status] = g._count._all;

  const mrr = activeWithPlan.reduce((sum, s) => sum + (s.plan.priceMonthly ?? 0), 0);

  const perPlanMap = new Map<string, { key: string; name: string; active: number }>();
  for (const p of plans) perPlanMap.set(p.key, { key: p.key, name: p.name, active: 0 });
  for (const s of activeWithPlan) {
    const entry = perPlanMap.get(s.plan.key);
    if (entry) entry.active += 1;
  }

  return {
    total: byStatus.reduce((n, g) => n + g._count._all, 0),
    active: statusCounts.ACTIVE,
    pending: statusCounts.PENDING,
    cancelled: statusCounts.CANCELLED,
    expired: statusCounts.EXPIRED,
    mrr,
    perPlan: Array.from(perPlanMap.values()),
  };
}
