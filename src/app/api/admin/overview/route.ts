import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { getOverview } from "@/lib/admin/overview-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/overview?days= — platform KPIs, trends, and health. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const data = await getOverview(Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 30);
  return ok(data, "OK");
}
