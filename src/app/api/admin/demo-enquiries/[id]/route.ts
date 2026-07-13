import { NextRequest } from "next/server";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { getDemoEnquiry, updateDemoEnquiry, deleteDemoEnquiry } from "@/lib/demo/service";
import { updateDemoEnquirySchema } from "@/lib/validations/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/demo-enquiries/:id — full enquiry detail. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  const enquiry = await getDemoEnquiry(id);
  if (!enquiry) return fail("Enquiry not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  return ok(enquiry, "OK");
}

/** PATCH /api/admin/demo-enquiries/:id — update triage status / internal notes. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  const parsed = updateDemoEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION, error: parsed.error.message });
  }

  const existing = await getDemoEnquiry(id);
  if (!existing) return fail("Enquiry not found.", { status: 404, code: ErrorCode.NOT_FOUND });

  const updated = await updateDemoEnquiry(id, parsed.data);

  await logAdminAction(req, {
    adminId: guard.user.id,
    action: "demoEnquiry.update",
    entity: "DemoEnquiry",
    entityId: id,
    metadata: { ...parsed.data },
  });

  return ok(updated, "Updated.");
}

/** DELETE /api/admin/demo-enquiries/:id — permanently remove an enquiry. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  const existing = await getDemoEnquiry(id);
  if (!existing) return fail("Enquiry not found.", { status: 404, code: ErrorCode.NOT_FOUND });

  await deleteDemoEnquiry(id);

  await logAdminAction(req, {
    adminId: guard.user.id,
    action: "demoEnquiry.delete",
    entity: "DemoEnquiry",
    entityId: id,
    metadata: { name: existing.name, email: existing.email, company: existing.company },
  });

  return ok({ id }, "Deleted.");
}
