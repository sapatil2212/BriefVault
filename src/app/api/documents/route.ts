import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { listDocuments } from "@/lib/ai/services/document-service";

export const runtime = "nodejs";

/**
 * GET /api/documents?take=&cursor=
 * Cursor-paginated list of the caller's documents (newest first).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const { searchParams } = new URL(req.url);
  const take = Number(searchParams.get("take") ?? 20);
  const cursor = searchParams.get("cursor") ?? undefined;

  const { items, nextCursor } = await listDocuments(user.id, {
    take: Number.isFinite(take) ? take : 20,
    cursor,
  });

  return ok(items, "OK", { meta: { nextCursor } });
}
