import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { listNotifications, markAllRead } from "@/lib/notifications/service";

export const runtime = "nodejs";

/** GET /api/notifications — recent notifications + unread count. */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }
  const { items, unread } = await listNotifications(user.id);
  return ok(items, "OK", { meta: { unread } });
}

/** POST /api/notifications — mark all as read. */
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }
  await markAllRead(user.id);
  return ok({ ok: true }, "All notifications marked read.");
}
