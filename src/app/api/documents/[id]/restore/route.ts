import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { restoreDocument } from "@/lib/ai/services/document-service";
import { logAudit } from "@/lib/audit/service";

export const runtime = "nodejs";

/** POST /api/documents/:id/restore — restore a soft-deleted document. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }
  const { id } = await params;
  const restored = await restoreDocument(user.id, id);
  if (!restored) {
    return fail("Document not found in Trash.", { status: 404, code: ErrorCode.NOT_FOUND });
  }
  await logAudit({ userId: user.id, action: "document.restore", entity: "document", entityId: id });
  return ok({ id }, "Document restored.");
}
