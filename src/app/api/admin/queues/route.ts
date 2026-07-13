import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { getQueueSummary, listQueueJobs, retryJob, cancelJob, retryAllFailed } from "@/lib/admin/queue-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/queues — per-type summary + a page of recent jobs. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const [summary, jobs] = await Promise.all([
    getQueueSummary(),
    listQueueJobs({
      type: sp.get("type") ?? undefined,
      status: sp.get("status") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    }),
  ]);

  return ok({ summary, jobs: jobs.items }, "OK", {
    meta: { total: jobs.total, page: jobs.page, pageSize: jobs.pageSize, pageCount: jobs.pageCount },
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("retry"), jobId: z.string() }),
  z.object({ action: z.literal("cancel"), jobId: z.string() }),
  z.object({ action: z.literal("retryAllFailed"), type: z.string().optional() }),
]);

/** POST /api/admin/queues — job actions (retry / cancel / retry-all-failed). */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION });
  const input = parsed.data;

  let message = "Done.";
  if (input.action === "retry") {
    await retryJob(input.jobId);
    message = "Job re-queued.";
  } else if (input.action === "cancel") {
    await cancelJob(input.jobId);
    message = "Job cancelled.";
  } else {
    const count = await retryAllFailed(input.type);
    message = `${count} failed job(s) re-queued.`;
  }

  await logAdminAction(req, {
    adminId: guard.user.id,
    action: `queue.${input.action}`,
    entity: "QueueJob",
    entityId: "jobId" in input ? input.jobId : null,
    metadata: input,
  });
  return ok({}, message);
}
