import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { getAiUsage } from "@/lib/admin/ai-usage-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/ai-usage?days=&provider=&module= — AI analytics. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const days = sp.get("days") ? Number(sp.get("days")) : 30;
  const data = await getAiUsage({
    days: Number.isFinite(days) ? Math.min(days, 90) : 30,
    provider: sp.get("provider") ?? undefined,
    module: sp.get("module") ?? undefined,
  });
  return ok(data, "OK");
}
