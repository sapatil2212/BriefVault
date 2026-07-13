import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { retryDocument } from "@/lib/admin/document-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ action: z.literal("retry") });

/** PATCH /api/admin/documents/:id — retry failed processing. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION });
  }

  await retryDocument(id);
  await logAdminAction(req, { adminId: guard.user.id, action: "document.retry", entity: "Document", entityId: id });
  return ok({ id }, "Document re-queued for processing.");
}
