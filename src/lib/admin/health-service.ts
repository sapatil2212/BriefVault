import "server-only";
import { prisma } from "@/lib/prisma";
import { aiConfig } from "@/lib/ai/config";
import { getLlmProvider } from "@/lib/ai/providers/llm";
import type { HealthCheck } from "@/types/admin";

/**
 * Live system-health probes. Each check is best-effort and independently
 * timed so one slow subsystem never blocks the rest. New subsystems (Redis,
 * external APIs) plug in by adding a probe — the shape stays identical.
 */
export async function getHealthChecks(): Promise<HealthCheck[]> {
  const [database, queue, ai, storage] = await Promise.all([
    checkDatabase(),
    checkQueueWorkers(),
    checkAiProvider(),
    checkStorage(),
  ]);
  return [database, queue, ai, storage];
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const start = Date.now();
  const result = await fn();
  return { ms: Date.now() - start, result };
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    const { ms } = await timed(() => prisma.$queryRaw`SELECT 1`);
    return {
      key: "database",
      label: "Database (MySQL)",
      state: ms < 500 ? "operational" : "degraded",
      latencyMs: ms,
      detail: ms < 500 ? "Responding normally" : "Elevated query latency",
    };
  } catch (err) {
    return {
      key: "database",
      label: "Database (MySQL)",
      state: "down",
      latencyMs: null,
      detail: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

async function checkQueueWorkers(): Promise<HealthCheck> {
  try {
    const { ms, result } = await timed(async () => {
      const now = new Date();
      const staleThreshold = new Date(now.getTime() - 5 * 60_000);
      const [pending, stuck] = await Promise.all([
        prisma.queueJob.count({ where: { status: "PENDING", runAt: { lte: now } } }),
        prisma.queueJob.count({ where: { status: "RUNNING", lockedAt: { lt: staleThreshold } } }),
      ]);
      return { pending, stuck };
    });
    const { pending, stuck } = result;
    const state = stuck > 0 ? "degraded" : "operational";
    return {
      key: "queue",
      label: "Queue Workers",
      state,
      latencyMs: ms,
      detail: stuck > 0 ? `${stuck} stalled job(s), ${pending} pending` : `${pending} pending job(s)`,
    };
  } catch {
    return { key: "queue", label: "Queue Workers", state: "unknown", latencyMs: null };
  }
}

async function checkAiProvider(): Promise<HealthCheck> {
  try {
    const provider = getLlmProvider();
    const ready = provider.isReady();
    const isFallback = provider.name === "extractive";
    return {
      key: "ai",
      label: "AI Provider",
      state: isFallback ? "degraded" : ready ? "operational" : "down",
      latencyMs: null,
      detail: isFallback
        ? "Running on offline extractive fallback (no provider key)"
        : `Active provider: ${provider.name} (${aiConfig.llm.model})`,
    };
  } catch {
    return { key: "ai", label: "AI Provider", state: "unknown", latencyMs: null };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  try {
    const { ms } = await timed(() => prisma.document.count({ where: { deletedAt: null } }));
    return {
      key: "storage",
      label: "Document Storage",
      state: "operational",
      latencyMs: ms,
      detail: "Storage index reachable",
    };
  } catch {
    return { key: "storage", label: "Document Storage", state: "unknown", latencyMs: null };
  }
}
