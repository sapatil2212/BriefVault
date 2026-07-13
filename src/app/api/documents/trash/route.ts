import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { listTrashedDocuments } from "@/lib/ai/services/document-service";

export const runtime = "nodejs";

/** GET /api/documents/trash — the caller's soft-deleted documents. */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }
  const items = await listTrashedDocuments(user.id);
  return ok(items, "OK");
}
