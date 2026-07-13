import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { listOrganizations } from "@/lib/admin/org-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/organizations — derived org analytics, paginated. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const result = await listOrganizations({
    search: sp.get("search") ?? undefined,
    orgType: sp.get("orgType") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return ok(result.items, "OK", {
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, pageCount: result.pageCount },
  });
}
