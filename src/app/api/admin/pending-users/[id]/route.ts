import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { PLAN_KEYS } from "@/lib/plans/types";
import {
  getPendingUserDetail,
  approveUser,
  rejectUser,
  requestUserInfo,
  suspendUser,
  reactivateUser,
  changeUserPlan,
} from "@/lib/admin/pending-service";
import { StateTransitionError } from "@/lib/subscriptions/state-machine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), plan: z.enum(PLAN_KEYS).optional() }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "Provide a reason.").max(500) }),
  z.object({ action: z.literal("requestInfo"), message: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("suspend") }),
  z.object({ action: z.literal("reactivate") }),
  z.object({ action: z.literal("changePlan"), plan: z.enum(PLAN_KEYS) }),
]);

/** GET /api/admin/pending-users/:id — full review detail. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  const detail = await getPendingUserDetail(id);
  if (!detail) return fail("User not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  return ok(detail, "OK");
}

/** PATCH /api/admin/pending-users/:id — approval-workflow actions. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION, error: parsed.error.message });
  }
  const input = parsed.data;
  const adminId = guard.user.email;

  try {
    switch (input.action) {
      case "approve":
        await approveUser(id, adminId, input.plan);
        break;
      case "reject":
        await rejectUser(id, adminId, input.reason);
        break;
      case "requestInfo":
        await requestUserInfo(id, adminId, input.message);
        break;
      case "suspend":
        await suspendUser(id);
        break;
      case "reactivate":
        await reactivateUser(id);
        break;
      case "changePlan":
        await changeUserPlan(id, input.plan);
        break;
    }
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return fail(err.message, { status: 409, code: "ILLEGAL_TRANSITION" });
    }
    const message = err instanceof Error ? err.message : "Action failed.";
    return fail(message, { status: 400, code: ErrorCode.VALIDATION });
  }

  await logAdminAction(req, {
    adminId: guard.user.id,
    action: `pendingUser.${input.action}`,
    entity: "User",
    entityId: id,
    metadata: { ...input },
  });

  return ok({ id }, "Done.");
}
