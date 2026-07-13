import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { getDocumentResults } from "@/lib/ai/services/document-service";

export const runtime = "nodejs";

/**
 * GET /api/documents/:id/results
 * Structured AI intelligence + extracted metadata for a document.
 */
export async function GET(
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
  const results = await getDocumentResults(user.id, id);
  if (!results) {
    return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  }

  return ok(results, "OK");
}
