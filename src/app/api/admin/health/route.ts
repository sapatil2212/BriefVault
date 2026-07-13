import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { getHealthChecks } from "@/lib/admin/health-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/health — live system health probes. */
export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const checks = await getHealthChecks();
  return ok(checks, "OK");
}
