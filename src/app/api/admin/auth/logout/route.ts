import { ok } from "@/lib/api/response";
import { clearAdminSessionCookie } from "@/lib/admin/admin-auth";

export const runtime = "nodejs";

/** POST /api/admin/auth/logout — clears the super-admin session cookie. */
export async function POST() {
  await clearAdminSessionCookie();
  return ok({}, "Signed out of admin.");
}
