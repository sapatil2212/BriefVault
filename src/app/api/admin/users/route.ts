import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { listUsers, type UserListFilter } from "@/lib/admin/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/users — filtered, paginated platform user list. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const filter: UserListFilter = {
    search: sp.get("search") ?? undefined,
    role: sp.get("role") ?? undefined,
    status: sp.get("status") ?? undefined,
    organization: sp.get("organization") ?? undefined,
    orgType: sp.get("orgType") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    sort: (sp.get("sort") as UserListFilter["sort"]) ?? undefined,
    order: (sp.get("order") as UserListFilter["order"]) ?? undefined,
  };

  const result = await listUsers(filter);
  return ok(result.items, "OK", {
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, pageCount: result.pageCount },
  });
}
