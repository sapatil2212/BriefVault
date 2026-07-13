import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { listAllDocuments, documentStatusCounts } from "@/lib/admin/document-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/documents — cross-tenant document monitoring. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const [result, counts] = await Promise.all([
    listAllDocuments({
      search: sp.get("search") ?? undefined,
      status: sp.get("status") ?? undefined,
      kind: sp.get("kind") ?? undefined,
      organization: sp.get("organization") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    }),
    documentStatusCounts(),
  ]);

  return ok(result.items, "OK", {
    meta: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
      counts,
    },
  });
}
