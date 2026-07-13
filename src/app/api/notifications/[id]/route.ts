import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { markRead } from "@/lib/notifications/service";

export const runtime = "nodejs";

/** POST /api/notifications/:id — mark a single notification as read. */
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
  const done = await markRead(user.id, id);
  if (!done) {
    return fail("Notification not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  }
  return ok({ id }, "Marked read.");
}
