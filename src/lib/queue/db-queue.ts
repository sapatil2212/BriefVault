import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Durable, database-backed job queue — a free/open-source alternative to a
 * Redis/BullMQ setup, using the app's existing MySQL database.
 *
 * - `enqueue` inserts a PENDING row.
 * - A single polling worker (started from instrumentation) atomically claims
 *   due jobs, runs the registered handler, and retries with exponential backoff.
 * - Crash recovery: RUNNING jobs whose lock is stale are returned to PENDING.
 *
 * Works across multiple server processes: claims are guarded by a conditional
 * `updateMany`, so only one worker wins a given job.
 */

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

const handlers = new Map<string, JobHandler>();

/** Register the handler for a job `type`. Safe to call more than once. */
export function registerHandler(type: string, handler: JobHandler): void {
  handlers.set(type, handler);
}

export interface EnqueueOptions {
  maxAttempts?: number;
  /** Delay before the job becomes eligible to run. */
  delayMs?: number;
}

/** Add a job to the queue. Returns the created job id. */
export async function enqueue(
  type: string,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {}
): Promise<string> {
  const job = await prisma.queueJob.create({
    data: {
      type,
      payload: payload as Prisma.InputJsonValue,
      maxAttempts: options.maxAttempts ?? 3,
      runAt: new Date(Date.now() + (options.delayMs ?? 0)),
    },
    select: { id: true },
  });
  return job.id;
}

const WORKER_ID = `${process.pid}-${randomUUID().slice(0, 8)}`;
const STALE_LOCK_MS = 5 * 60 * 1000;
const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 60_000;

/** Atomically claim the next due PENDING job, or null if none is available. */
async function claimNext(): Promise<{
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
} | null> {
  const candidate = await prisma.queueJob.findFirst({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    select: { id: true },
  });
  if (!candidate) return null;

  const claimed = await prisma.queueJob.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: {
      status: "RUNNING",
      lockedAt: new Date(),
      lockedBy: WORKER_ID,
      attempts: { increment: 1 },
    },
  });
  if (claimed.count === 0) return null; // lost the race — another worker took it

  return prisma.queueJob.findUnique({
    where: { id: candidate.id },
    select: { id: true, type: true, payload: true, attempts: true, maxAttempts: true },
  });
}

/** Run a single claimed job, recording success/failure with retry + backoff. */
async function runJob(job: {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}): Promise<void> {
  const handler = handlers.get(job.type);
  if (!handler) {
    await prisma.queueJob.update({
      where: { id: job.id },
      data: { status: "FAILED", lastError: `No handler for type "${job.type}"`, lockedAt: null, lockedBy: null },
    });
    return;
  }

  try {
    await handler((job.payload ?? {}) as Record<string, unknown>);
    await prisma.queueJob.update({
      where: { id: job.id },
      data: { status: "SUCCEEDED", lastError: null, lockedAt: null, lockedBy: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (job.attempts >= job.maxAttempts) {
      await prisma.queueJob.update({
        where: { id: job.id },
        data: { status: "FAILED", lastError: message, lockedAt: null, lockedBy: null },
      });
    } else {
      const backoff = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (job.attempts - 1));
      await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: "PENDING",
          lastError: message,
          runAt: new Date(Date.now() + backoff),
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
  }
}

/** Return jobs stuck in RUNNING past the stale-lock window back to PENDING. */
async function reapStale(): Promise<void> {
  await prisma.queueJob.updateMany({
    where: { status: "RUNNING", lockedAt: { lt: new Date(Date.now() - STALE_LOCK_MS) } },
    data: { status: "PENDING", lockedAt: null, lockedBy: null },
  });
}

/** Claim and run up to `concurrency` jobs in parallel for one tick. */
export async function drainOnce(concurrency = 2): Promise<number> {
  await reapStale();
  const running: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    const job = await claimNext();
    if (!job) break;
    running.push(runJob(job));
  }
  await Promise.all(running);
  return running.length;
}

let started = false;
let busy = false;

/**
 * Start the background polling worker (idempotent per process). Polls every
 * `intervalMs`, processing up to `concurrency` jobs per tick without overlap.
 */
export function startQueueWorker(options: { intervalMs?: number; concurrency?: number } = {}): void {
  if (started) return;
  started = true;
  const intervalMs = options.intervalMs ?? 3_000;
  const concurrency = options.concurrency ?? 2;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      // Keep draining while there is work, so bursts clear quickly.
      while ((await drainOnce(concurrency)) > 0) {
        /* loop until no job was claimed */
      }
    } catch (err) {
      console.warn("[queue] worker tick failed:", (err as Error).message);
    } finally {
      busy = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  (timer as unknown as { unref?: () => void }).unref?.();
}
