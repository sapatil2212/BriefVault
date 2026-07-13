import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dailySeries } from "@/lib/admin/metrics";
import type { AiUsageResponse } from "@/types/admin";

/**
 * AI usage analytics sourced entirely from `AiRequestLog` (the existing
 * per-call observability table). Provider/module breakdowns and cost come
 * straight from real logged generations.
 */
export async function getAiUsage(opts: {
  days?: number;
  provider?: string;
  module?: string;
}): Promise<AiUsageResponse> {
  const days = opts.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Prisma.AiRequestLogWhereInput = { createdAt: { gte: since } };
  if (opts.provider) where.provider = opts.provider;
  if (opts.module) where.kind = opts.module;

  const [total, success, tokenAgg, latencyAgg, byProviderRaw, byModuleRaw, trend] =
    await Promise.all([
      prisma.aiRequestLog.count({ where }),
      prisma.aiRequestLog.count({ where: { ...where, success: true } }),
      prisma.aiRequestLog.aggregate({ where, _sum: { tokensUsed: true, costUsd: true } }),
      prisma.aiRequestLog.aggregate({ where, _avg: { latencyMs: true } }),
      prisma.aiRequestLog.groupBy({
        by: ["provider"],
        where,
        _count: { _all: true },
        _sum: { tokensUsed: true, costUsd: true },
        _avg: { latencyMs: true },
      }),
      prisma.aiRequestLog.groupBy({
        by: ["kind"],
        where,
        _count: { _all: true },
        _sum: { tokensUsed: true },
      }),
      dailySeries({ table: "ai_request_logs", dateColumn: "createdAt", agg: "COUNT(*)", days }),
    ]);

  const failedByProvider = await prisma.aiRequestLog.groupBy({
    by: ["provider"],
    where: { ...where, success: false },
    _count: { _all: true },
  });
  const failedMap = new Map(failedByProvider.map((f) => [f.provider, f._count._all]));

  return {
    summary: {
      totalRequests: total,
      successRequests: success,
      failedRequests: total - success,
      successRate: total > 0 ? Number(((success / total) * 100).toFixed(1)) : 100,
      totalTokens: tokenAgg._sum.tokensUsed ?? 0,
      totalCostUsd: Number((tokenAgg._sum.costUsd ?? 0).toFixed(4)),
      avgLatencyMs: Math.round(latencyAgg._avg.latencyMs ?? 0),
    },
    byProvider: byProviderRaw
      .map((p) => ({
        provider: p.provider,
        requests: p._count._all,
        tokens: p._sum.tokensUsed ?? 0,
        costUsd: Number((p._sum.costUsd ?? 0).toFixed(4)),
        avgLatencyMs: Math.round(p._avg.latencyMs ?? 0),
        failed: failedMap.get(p.provider) ?? 0,
      }))
      .sort((a, b) => b.requests - a.requests),
    byModule: byModuleRaw
      .map((m) => ({ module: m.kind, requests: m._count._all, tokens: m._sum.tokensUsed ?? 0 }))
      .sort((a, b) => b.requests - a.requests),
    trend,
  };
}
