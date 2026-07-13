import { ok, fail, ErrorCode } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionOverview } from "@/lib/subscriptions/service";
import { changeUserPlan } from "@/lib/admin/pending-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/subscription/me — the signed-in user's plan, status, and usage. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", { status: 401, code: ErrorCode.UNAUTHORIZED });

  const overview = await getSubscriptionOverview(user.id);
  return ok({ ...overview, accountStatus: user.status }, "OK");
}

/** POST /api/subscription/me — change/upgrade/downgrade user's plan. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", { status: 401, code: ErrorCode.UNAUTHORIZED });

  try {
    const body = await req.json();
    const { planKey } = body;

    if (!planKey || typeof planKey !== "string") {
      return fail("planKey is required", { status: 400, code: ErrorCode.VALIDATION });
    }

    const overview = await getSubscriptionOverview(user.id);
    const result = await changeUserPlan(user.id, planKey);
    const updatedOverview = await getSubscriptionOverview(user.id);

    return ok({ ...updatedOverview, result }, "Plan updated successfully");
  } catch (err: unknown) {
    const error = err as Error;
    return fail(error?.message || "Failed to update plan", { status: 500, code: ErrorCode.INTERNAL });
  }
}
