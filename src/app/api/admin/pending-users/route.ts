import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { listPendingUsers, type PendingListFilter } from "@/lib/admin/pending-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/pending-users — users awaiting approval, filtered + paged. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const filter: PendingListFilter = {
    search: sp.get("search") ?? undefined,
    plan: sp.get("plan") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    sort: (sp.get("sort") as PendingListFilter["sort"]) ?? undefined,
    order: (sp.get("order") as PendingListFilter["order"]) ?? undefined,
  };

  const result = await listPendingUsers(filter);
  return ok(result.items, "OK", {
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, pageCount: result.pageCount },
  });
}
