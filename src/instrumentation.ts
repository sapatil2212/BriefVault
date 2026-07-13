/**
 * Server startup hook.
 *
 * Everything here is Node-only (Prisma, the AI pipeline, `crypto`). Wrapping it
 * in a positive `NEXT_RUNTIME === "nodejs"` block lets Next statically strip the
 * whole branch — and its dynamic imports — from the Edge build, so Edge never
 * tries to resolve Node built-ins like `crypto`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { purgeExpiredUnverified, purgeExpiredSessions } = await import(
      "@/lib/auth/cleanup"
    );

    // Start the durable DB-backed job worker. Importing the AI queue registers
    // its job handlers before the worker begins polling.
    await import("@/lib/ai/queue");
    const { startQueueWorker } = await import("@/lib/queue/db-queue");
    startQueueWorker({ intervalMs: 3_000, concurrency: 2 });

    const run = async () => {
      try {
        await purgeExpiredUnverified();
        await purgeExpiredSessions();
      } catch (err) {
        // Swallow — DB may be temporarily unavailable; retry next tick.
        if (process.env.NODE_ENV === "development") {
          console.warn("[cleanup] skipped:", (err as Error).message);
        }
      }
    };

    // Kick once shortly after boot, then every minute.
    setTimeout(run, 10_000);
    const timer = setInterval(run, 60_000);
    (timer as unknown as { unref?: () => void }).unref?.();
  }
}
