import { ok } from "@/lib/api/response";
import { getPublicPlans } from "@/lib/plans/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/plans — public plan catalog for signup + marketing pages. */
export async function GET() {
  const plans = await getPublicPlans();
  return ok(plans, "OK");
}
