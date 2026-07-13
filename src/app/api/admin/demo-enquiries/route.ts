import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { listDemoEnquiries, type DemoEnquiryListFilter } from "@/lib/demo/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/demo-enquiries — list, filtered + paged. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const filter: DemoEnquiryListFilter = {
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  };

  const result = await listDemoEnquiries(filter);
  return ok(result.items, "OK", {
    meta: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
      counts: result.counts,
    },
  });
}
