import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import {
  listSubscriptions,
  getSubscriptionStats,
  type SubscriptionListFilter,
} from "@/lib/admin/subscription-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/subscriptions — subscription list + headline stats. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const filter: SubscriptionListFilter = {
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    plan: sp.get("plan") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  };

  const [result, stats] = await Promise.all([listSubscriptions(filter), getSubscriptionStats()]);
  return ok(result.items, "OK", {
    meta: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
      stats,
    },
  });
}
