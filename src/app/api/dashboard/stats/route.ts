import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { getDashboardStats } from "@/lib/dashboard/stats-service";

export const runtime = "nodejs";

/** GET /api/dashboard/stats — live aggregated stats for the current user. */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const stats = await getDashboardStats(user.id);
  return ok(stats, "OK");
}
