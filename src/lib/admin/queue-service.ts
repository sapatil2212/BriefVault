import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { QueueSummaryRow, QueueJobRow, Paginated } from "@/types/admin";

/**
 * Background-job monitoring over the durable DB-backed `QueueJob` table. Jobs
 * are grouped by their `type` string (upload, ocr, embedding, ...). Admin
 * actions (retry/cancel) operate on the same rows the worker polls.
 */
export async function getQueueSummary(): Promise<QueueSummaryRow[]> {
  const groups = await prisma.queueJob.groupBy({
    by: ["type", "status"],
    _count: { _all: true },
  });

  const byType = new Map<string, QueueSummaryRow>();
  for (const g of groups) {
    const row =
      byType.get(g.type) ??
      { type: g.type, pending: 0, running: 0, succeeded: 0, failed: 0, total: 0 };
    const count = g._count._all;
    if (g.status === "PENDING") row.pending += count;
    else if (g.status === "RUNNING") row.running += count;
    else if (g.status === "SUCCEEDED") row.succeeded += count;
    else if (g.status === "FAILED") row.failed += count;
    row.total += count;
    byType.set(g.type, row);
  }
  return [...byType.values()].sort((a, b) => b.total - a.total);
}

export async function listQueueJobs(opts: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<QueueJobRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
  const where: Prisma.QueueJobWhereInput = {};
  if (opts.type) where.type = opts.type;
  if (opts.status) where.status = opts.status as Prisma.QueueJobWhereInput["status"];

  const [total, rows] = await Promise.all([
    prisma.queueJob.count({ where }),
    prisma.queueJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        runAt: true,
        lastError: true,
        createdAt: true,
      },
    }),
  ]);

  const items: QueueJobRow[] = rows.map((j) => ({
    id: j.id,
    type: j.type,
    status: j.status,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    runAt: j.runAt.toISOString(),
    lastError: j.lastError,
    createdAt: j.createdAt.toISOString(),
  }));
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Reset a failed job to PENDING so the worker picks it up again. */
export async function retryJob(id: string) {
  return prisma.queueJob.update({
    where: { id },
    data: { status: "PENDING", attempts: 0, lastError: null, runAt: new Date(), lockedAt: null, lockedBy: null },
  });
}

/** Cancel a pending job by marking it failed with a cancellation note. */
export async function cancelJob(id: string) {
  return prisma.queueJob.update({
    where: { id },
    data: { status: "FAILED", lastError: "Cancelled by administrator" },
  });
}

/** Bulk retry every failed job of an optional type. Returns affected count. */
export async function retryAllFailed(type?: string): Promise<number> {
  const { count } = await prisma.queueJob.updateMany({
    where: { status: "FAILED", ...(type ? { type } : {}) },
    data: { status: "PENDING", attempts: 0, lastError: null, runAt: new Date(), lockedAt: null, lockedBy: null },
  });
  return count;
}
