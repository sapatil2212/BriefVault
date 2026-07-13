import "server-only";
import { prisma } from "@/lib/prisma";
import { dailySeries, startOfDaysAgo } from "@/lib/admin/metrics";
import { getHealthChecks } from "@/lib/admin/health-service";
import type { OverviewResponse, OverviewKpis } from "@/types/admin";

/**
 * Aggregates the platform-wide overview. KPIs use indexed Prisma aggregates;
 * trends are pushed down to SQL (see metrics.ts). Anything without a backing
 * table yet (subscriptions/revenue) reports 0 and is wired for future tables —
 * no mock data.
 */
export async function getOverview(days = 30): Promise<OverviewResponse> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thirtyDaysAgo = startOfDaysAgo(30);

  const [
    totalUsers,
    suspendedUsers,
    activeSessionUserGroups,
    orgGroups,
    documentsUploaded,
    documentsProcessed,
    documentsFailed,
    aiAgg,
    aiFailed,
    aiTokenAgg,
    processingQueueDepth,
    aiQueueDepth,
    storageAgg,
    newUsers30d,
    usersThisMonth,
    usersPrevMonth,
    activeSubscriptionsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.session.findMany({
      where: { expiresAt: { gt: now } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.user.groupBy({ by: ["organization"], _count: { _all: true } }),
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.document.count({ where: { deletedAt: null, status: "READY" } }),
    prisma.document.count({ where: { deletedAt: null, status: "FAILED" } }),
    prisma.aiRequestLog.aggregate({ _count: { _all: true }, _sum: { costUsd: true } }),
    prisma.aiRequestLog.count({ where: { success: false } }),
    prisma.aiRequestLog.aggregate({ _sum: { tokensUsed: true } }),
    prisma.queueJob.count({ where: { status: { in: ["PENDING", "RUNNING"] } } }),
    prisma.document.count({ where: { deletedAt: null, status: "PROCESSING" } }),
    prisma.document.aggregate({ _sum: { sizeBytes: true }, where: { deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);
  const activeSubscriptions = activeSubscriptionsCount;

  const monthlyGrowthPct =
    usersPrevMonth > 0
      ? Number((((usersThisMonth - usersPrevMonth) / usersPrevMonth) * 100).toFixed(1))
      : usersThisMonth > 0
        ? 100
        : 0;

  const kpis: OverviewKpis = {
    totalOrganizations: orgGroups.length,
    totalUsers,
    activeUsers: activeSessionUserGroups.length,
    suspendedUsers,
    documentsUploaded,
    documentsProcessed,
    documentsFailed,
    aiRequests: aiAgg._count._all,
    aiRequestsFailed: aiFailed,
    aiQueueDepth,
    processingQueueDepth,
    storageBytes: storageAgg._sum.sizeBytes ?? 0,
    tokensConsumed: aiTokenAgg._sum.tokensUsed ?? 0,
    estimatedCostUsd: Number((aiAgg._sum.costUsd ?? 0).toFixed(2)),
    activeSubscriptions,
    monthlyGrowthPct,
    newUsers30d,
  };

  const [
    userGrowth,
    documentUploads,
    aiUsage,
    tokenConsumption,
    storageGrowth,
    avgProcessingMs,
    health,
    orgGrowth,
  ] = await Promise.all([
    dailySeries({ table: "users", dateColumn: "createdAt", agg: "COUNT(*)", days }),
    dailySeries({ table: "documents", dateColumn: "createdAt", agg: "COUNT(*)", days, where: "deletedAt IS NULL" }),
    dailySeries({ table: "ai_request_logs", dateColumn: "createdAt", agg: "COUNT(*)", days }),
    dailySeries({ table: "ai_request_logs", dateColumn: "createdAt", agg: "COALESCE(SUM(tokensUsed),0)", days }),
    dailySeries({ table: "documents", dateColumn: "createdAt", agg: "COALESCE(SUM(sizeBytes),0)", days, where: "deletedAt IS NULL", cumulative: true }),
    dailySeries({ table: "ai_request_logs", dateColumn: "createdAt", agg: "COALESCE(ROUND(AVG(latencyMs)),0)", days }),
    getHealthChecks(),
    orgGrowthSeries(days),
  ]);

  return {
    kpis,
    charts: {
      userGrowth,
      orgGrowth,
      documentUploads,
      aiUsage,
      tokenConsumption,
      storageGrowth,
      avgProcessingMs,
      apiRequests: aiUsage, // proxy until a dedicated API-request log exists
    },
    health,
    generatedAt: now.toISOString(),
  };
}

/**
 * Cumulative distinct-organization growth. Organizations are a free-text field
 * on users today, so "org created" = first time a name appears. Computed from
 * the earliest signup per organization.
 */
async function orgGrowthSeries(days: number) {
  const rows = await prisma.$queryRawUnsafe<Array<{ day: string | Date; value: bigint | number }>>(
    `SELECT DATE(firstSeen) AS day, COUNT(*) AS value FROM (
       SELECT organization, MIN(createdAt) AS firstSeen FROM users GROUP BY organization
     ) t GROUP BY DATE(firstSeen) ORDER BY day ASC`
  );
  // Reuse densify semantics inline (cumulative).
  const { dayKeys } = await import("@/lib/admin/metrics");
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
    map.set(key, Number(r.value ?? 0));
  }
  // Baseline: orgs created before the window start count toward the running total.
  const windowStart = startOfDaysAgo(days - 1).toISOString().slice(0, 10);
  let running = 0;
  for (const [k, v] of map) if (k < windowStart) running += v;

  return dayKeys(days).map((date) => {
    running += map.get(date) ?? 0;
    return { date, value: running };
  });
}
